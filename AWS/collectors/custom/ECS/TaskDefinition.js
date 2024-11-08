import { ECSClient, paginateListTaskDefinitions } from "@aws-sdk/client-ecs";
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
  for await (const page of paginateListTaskDefinitions(
    { client },
    { status: "ACTIVE" },
  )) {
    const latestTaskDefintions = filterLatestTaskDefinitionsByRevision(
      page.taskDefinitionArns,
    );
    resources.push(...(latestTaskDefintions || []));
  }
  updateResourceTypeCounter(
    AWS_MAPPING,
    serviceName,
    resourceType,
    resources.length,
  );
  AWS_MAPPING.total += resources.length;
};
