import {
  DescribeServicesCommand,
  DescribeTaskDefinitionCommand,
  ECSClient,
  ListServicesCommand,
  paginateListClusters,
} from "@aws-sdk/client-ecs";
import chunks from "lodash.chunk";
import { updateResourceTypeCounter } from "../../../utils/index.js";

const ECS_TASK_DEFINITION = "AWS::ECS::TaskDefinition";

export const query = async (AWS_MAPPING, serviceName, resourceType, region) => {
  let total = 0;
  const client = new ECSClient({ region });
  const resources = [];
  for await (const page of paginateListClusters({ client }, {})) {
    resources.push(...(page.clusterArns || []));
  }

  for await (const clusterArn of resources) {
    const command = new ListServicesCommand({
      cluster: clusterArn,
    });
    const response = await client?.send(command);
    const serviceCount = response?.serviceArns.length;
    total += serviceCount;
    updateResourceTypeCounter(
      AWS_MAPPING,
      serviceName,
      resourceType,
      serviceCount,
    );
    const chunkedServices = chunks(response?.serviceArns, 10);
    // Batching by 10 because this is the API limit per docs
    // https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-ecs/interfaces/describeservicescommandinput.html
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

        await Promise.all(
          [...new Set(taskDefinitionArns)].map(async (taskDefinition) => {
            let getTaskDefCmd = new DescribeTaskDefinitionCommand({
              taskDefinition,
            });
            let getTaskDefRes = await client?.send(getTaskDefCmd);
            let containerCount =
              getTaskDefRes.taskDefinition?.containerDefinitions.length;
            total += containerCount;
            updateResourceTypeCounter(
              AWS_MAPPING,
              serviceName,
              ECS_TASK_DEFINITION,
              containerCount,
            );
          }),
        );
      }),
    );
  }
  AWS_MAPPING.total += total;
};
