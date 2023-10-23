import { EKSClient, paginateListNodegroups } from "@aws-sdk/client-eks";
import {
  paginateListClusters as paginateListEKSClusters
} from "@aws-sdk/client-eks/dist-types/pagination/ListClustersPaginator.js";

export const queryEKSNodeGroup = async (AWS_MAPPING, serviceName, resourceType, region) => {
  const client = new EKSClient({ region });
  const clusterNames = [];
  for await (const page of paginateListEKSClusters({ client }, {})) {
    clusterNames.push(...(page.clusters || []));
  }
  let nodeGroups = [];
  await Promise.all(
    clusterNames.map(async (clusterName) => {
      for await (const page of paginateListNodegroups(
        { client },
        { clusterName }
      )) {
        if (
          page?.nodegroups?.length !== undefined &&
          page?.nodegroups?.length > 0
        ) {
          for (const nodeGroup of page.nodegroups) {
            nodeGroups.push({ clusterName, nodeGroup });
          }
        }
      }
    })
  );
  const resourceCount = nodeGroups.length;
  updateResourceTypeCounter(serviceName, resourceType, resourceCount);
  AWS_MAPPING.total += resourceCount;
};