import { promises as fs, readFileSync } from "fs";
import path from "path";

const dependencies = JSON.parse(
  readFileSync(
    path.join(process.cwd(), "AWS/collectors/codeless/aws-dependencies.json"),
  ),
);
import { STSClient, GetCallerIdentityCommand } from "@aws-sdk/client-sts";
import {
  CloudControlClient,
  paginateListResources,
} from "@aws-sdk/client-cloudcontrol";
import jp from "jsonpath";
import {
  getNextListPageTokenKey,
  getNextListPageTokenRequestKey,
  getNextPageTokenKeyFromResponse,
  updateResourceTypeCounter,
} from "../utils/index.js";

export const paginate = async ({
  client,
  command,
  responseKey = "Items",
  nextKey = "NextToken",
}) => {
  let nextToken;
  const results = [];
  let commandParams = command.params;
  do {
    const response = await client.send(new command.CommandClass(commandParams));
    results.push(...(response[responseKey] || []));
    nextToken = response[nextKey];
    commandParams = command.params
      ? { [nextKey]: nextToken, ...command.params }
      : { [nextKey]: nextToken };
  } while (nextToken);
  return results;
};

export const getAWSAccountId = async () => {
  const response = await new STSClient({}).send(
    new GetCallerIdentityCommand({}),
  );

  return String(response.Account);
};

export const queryDependencies = async (
  AWS_MAPPING,
  serviceName,
  resourceType,
  region,
) => {
  const resourceDependency = dependencies.find((dep) => dep.id === serviceName);
  let total = 0;
  if (resourceDependency) {
    const { resources } = resourceDependency;
    const resourceTypeDependency = resources.find(
      (resource) => resource.resourceType === resourceType,
    );
    if (resourceTypeDependency) {
      if (
        resourceTypeDependency.listClientConfig.clientType ===
        "AWS_CLOUDCONTROL_V3"
      ) {
        const listClient = new CloudControlClient({
          region,
        });
        const paginatorConfig = {
          client: listClient,
          pageSize: 25,
        };
        const commandInput = {
          TypeName: resourceType,
        };
        const paginator = paginateListResources(paginatorConfig, commandInput);
        for await (const page of paginator) {
          const descriptors = page.ResourceDescriptions;
          const s3BucketsLength = descriptors.length || 0;
          updateResourceTypeCounter(
            AWS_MAPPING,
            serviceName,
            resourceType,
            s3BucketsLength,
          );
          total += s3BucketsLength;
        }
      } else {
        const { list, listClientConfig } = resourceTypeDependency;
        const classPackage = await import(listClientConfig.packageName);
        const ClientClass = classPackage[listClientConfig.clientName];
        const listClient = new ClientClass({
          region,
        });
        const { action: listAction } = list;
        const { command, outputProperty, outputPropertySearchType } =
          listAction;

        const resources = [];
        if (command.includes("paginate")) {
          const CommandClass = classPackage[command];
          for await (const page of CommandClass({ client: listClient }, {})) {
            if (outputPropertySearchType === "JSON_PATH") {
              const result = jp.query(page, outputProperty)[0];
              resources.push(...result);
            } else {
              resources.push(...page[outputProperty]);
            }
          }
        } else {
          const CommandClass = classPackage[`${command}Command`];
          let nextResponsePageToken;
          let nextRequestPageToken;
          let nextPageTokenValue;
          do {
            const paginationArgs =
              nextResponsePageToken &&
              nextPageTokenValue &&
              nextRequestPageToken
                ? { [nextRequestPageToken]: nextPageTokenValue }
                : {};
            const com = new CommandClass(paginationArgs);
            const listResponse = await listClient.send(com);
            nextResponsePageToken = getNextPageTokenKeyFromResponse(
              listResponse,
              getNextListPageTokenKey(list),
            );
            nextPageTokenValue =
              nextResponsePageToken && listResponse[nextResponsePageToken];
            if (outputPropertySearchType === "JSON_PATH") {
              const result = jp.query(listResponse, outputProperty)[0];
              const responses = Array.isArray(result) ? result : [result];
              resources.push(...responses);
            } else {
              const responses = Array.isArray(listResponse[outputProperty])
                ? listResponse[outputProperty]
                : [listResponse[outputProperty]];
              resources.push(...responses);
            }
            nextRequestPageToken = getNextListPageTokenRequestKey(
              nextResponsePageToken,
              list,
            );
          } while (
            nextPageTokenValue &&
            nextResponsePageToken &&
            nextRequestPageToken
          );
        }
        const resultsLength = resources.length || 0;
        updateResourceTypeCounter(
          AWS_MAPPING,
          serviceName,
          resourceType,
          resultsLength,
        );
        total += resultsLength;
      }
    }
  }
  AWS_MAPPING.total += total;
};

export const checkModuleAndQuery = async (
  filePath,
  AWS_MAPPING,
  serviceName,
  resourceType,
  region,
) => {
  try {
    await fs.access(filePath);
    const module = await import(filePath);
    if (typeof module.query === "function") {
      await module.query(AWS_MAPPING, serviceName, resourceType, region);
      return true;
    } else {
      console.log(`No query function for ${resourceType}`);
      return false;
    }
  } catch (error) {
    return false;
  }
};
