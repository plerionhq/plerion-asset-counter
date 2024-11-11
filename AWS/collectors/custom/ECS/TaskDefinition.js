import {
  ECSClient,
  paginateListClusters,
  paginateListTaskDefinitions,
  ListServicesCommand,
  DescribeServicesCommand,
} from "@aws-sdk/client-ecs";
import chunks from "lodash.chunk";
import { updateResourceTypeCounter } from "../../../utils/index.js";

const filterLatestTaskDefinitionsByRevision = (taskDefinitionArns) => {
  const latestDefinitions = new Map();

  taskDefinitionArns.forEach((arn) => {
    const [family, revisionStr] = arn.split(":task-definition/")[1].split(":");
    const revision = Number(revisionStr);

    if (
      !latestDefinitions.has(family) ||
      Number(latestDefinitions.get(family).split(":").pop()) < revision
    ) {
      latestDefinitions.set(family, arn);
    }
  });

  return Array.from(latestDefinitions.values());
};

export const query = async (AWS_MAPPING, serviceName, resourceType, region) => {
  const client = new ECSClient({ region });
  const resources = [];
  let numberOfAttachedTaskedDefintions = 0;

  for await (const page of paginateListClusters({ client }, {})) {
    resources.push(...(page.clusterArns || []));
  }
  for await (const clusterArn of resources) {
    const command = new ListServicesCommand({
      cluster: clusterArn,
    });
    const response = await client?.send(command);
    const chunkedServices = chunks(response?.serviceArns, 10);
    await Promise.all(
      chunkedServices.map(async (serviceArns) => {
        const command = new DescribeServicesCommand({
          cluster: clusterArn,
          services: serviceArns,
        });
        const response = await client?.send(command);
        const taskDefinitionArns = [];
        if (response && Array.isArray(response?.services)) {
          response.services.forEach((service) => {
            if (service?.taskDefinition) {
              taskDefinitionArns.push(service.taskDefinition);
            }
            if (Array.isArray(service?.deployments)) {
              const deploymentTaskDefinitionArns = service.deployments
                .filter(
                  (deployment) =>
                    deployment?.status === "PRIMARY" &&
                    !!deployment?.taskDefinition,
                )
                .map((deployment) => deployment?.taskDefinition);
              if (deploymentTaskDefinitionArns) {
                taskDefinitionArns.push(...deploymentTaskDefinitionArns);
              }
            }
          });
        }
        numberOfAttachedTaskedDefintions += taskDefinitionArns.length;
      }),
    );
  }

  for await (const page of paginateListTaskDefinitions(
    { client },
    { status: "ACTIVE" },
  )) {
    const latestTaskDefintions = filterLatestTaskDefinitionsByRevision(
      page.taskDefinitionArns,
    );
    resources.push(...(latestTaskDefintions || []));
  }
  const totalTaskDefinitions =
    resources.length + numberOfAttachedTaskedDefintions;
  updateResourceTypeCounter(
    AWS_MAPPING,
    serviceName,
    resourceType,
    totalTaskDefinitions,
  );
  AWS_MAPPING.total += totalTaskDefinitions;
};
