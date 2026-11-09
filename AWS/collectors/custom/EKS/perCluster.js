import { EKSClient, paginateListClusters } from "@aws-sdk/client-eks";
import { updateResourceTypeCounter } from "../../../utils/index.js";

// Counts a type EKS lists per cluster: every cluster in the region, then
// each page of `outputKey` that `paginate` returns for it.
export const countPerCluster = async (
  AWS_MAPPING,
  serviceName,
  resourceType,
  region,
  paginate,
  outputKey,
) => {
  const client = new EKSClient({ region });
  let resourceCount = 0;
  for await (const { clusters = [] } of paginateListClusters({ client }, {})) {
    for (const clusterName of clusters) {
      for await (const page of paginate({ client }, { clusterName })) {
        resourceCount += page[outputKey]?.length ?? 0;
      }
    }
  }
  updateResourceTypeCounter(
    AWS_MAPPING,
    serviceName,
    resourceType,
    resourceCount,
  );
  AWS_MAPPING.total += resourceCount;
};
