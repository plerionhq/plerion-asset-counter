import { EMRClient } from "@aws-sdk/client-emr";
import { paginateListClusters } from "@aws-sdk/client-ecs";

export const queryEMRClusters = async (AWS_MAPPING, serviceName, resourceType, region) => {
  let total = 0;
  const resources = [];
  const client = new EMRClient({ region });
  for await (const page of paginateListClusters(
    { client },
    {}
  )) {
    resources.push(...(page.Clusters || []));
  }
  const resourceCount = resources.length;
  updateResourceTypeCounter(serviceName, resourceType, resourceCount);
  total += resources.length;
  AWS_MAPPING.total += total;
};

