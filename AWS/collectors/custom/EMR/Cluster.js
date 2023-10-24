import { EMRClient } from "@aws-sdk/client-emr";
import { paginateListClusters } from "@aws-sdk/client-ecs";
import { updateResourceTypeCounter } from "../../../utils/index.js";

export const query = async (AWS_MAPPING, serviceName, resourceType, region) => {
  let total = 0;
  const resources = [];
  const client = new EMRClient({ region });
  for await (const page of paginateListClusters({ client }, {})) {
    resources.push(...(page.Clusters || []));
  }
  const resourceCount = resources.length;
  updateResourceTypeCounter(
    AWS_MAPPING,
    serviceName,
    resourceType,
    resourceCount,
  );
  total += resources.length;
  AWS_MAPPING.total += total;
};
