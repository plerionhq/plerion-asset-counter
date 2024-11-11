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
    const revision = parseInt(revisionStr, 10);
    const latestDefinitionEntry = latestDefinitions.get(family);
    if (!latestDefinitionEntry || latestDefinitionEntry.revision < revision) {
      latestDefinitions.set(family, { arn, revision });
    }
  });

  return Array.from(latestDefinitions.values()).map((entry) => entry.arn);
};

export const query = async (AWS_MAPPING, serviceName, resourceType, region) => {
  const client = new ECSClient({ region });
  const resources = [];
  let clusterTaskDefinitionArns = [];

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
        const serviceTaskDefinitionArns = [];
        if (response && Array.isArray(response?.services)) {
          response.services.forEach((service) => {
            if (service?.taskDefinition) {
              serviceTaskDefinitionArns.push(service.taskDefinition);
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
                serviceTaskDefinitionArns.push(...deploymentTaskDefinitionArns);
              }
            }
          });
        }
        clusterTaskDefinitionArns = [
          ...new Set([
            ...clusterTaskDefinitionArns,
            ...serviceTaskDefinitionArns,
          ]),
        ];
      }),
    );
  }
  const latestTaskDefintions = [];
  for await (const page of paginateListTaskDefinitions(
    { client },
    { status: "ACTIVE" },
  )) {
    latestTaskDefintions.push(
      ...(filterLatestTaskDefinitionsByRevision(page.taskDefinitionArns) || []),
    );
  }
  const deduplicatedTaskDefintions = [
    ...new Set([...latestTaskDefintions, ...clusterTaskDefinitionArns]),
  ];
  const totalTaskDefinitions = deduplicatedTaskDefintions.length;
  updateResourceTypeCounter(
    AWS_MAPPING,
    serviceName,
    resourceType,
    totalTaskDefinitions,
  );
  AWS_MAPPING.total += totalTaskDefinitions;
};
