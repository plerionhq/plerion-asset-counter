import {
  EKSClient,
  paginateListNodegroups,
  paginateListClusters,
} from "@aws-sdk/client-eks";
import { updateResourceTypeCounter } from "../../../utils/index.js";

export const query = async (AWS_MAPPING, serviceName, resourceType, region) => {
  const client = new EKSClient({ region });
  const clusterNames = [];
  for await (const page of paginateListClusters({ client }, {})) {
    clusterNames.push(...(page.clusters || []));
  }
  let nodeGroups = [];
  await Promise.all(
    clusterNames.map(async (clusterName) => {
      for await (const page of paginateListNodegroups(
        { client },
        { clusterName },
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
    }),
  );
  const resourceCount = nodeGroups.length;
  updateResourceTypeCounter(serviceName, resourceType, resourceCount);
  AWS_MAPPING.total += resourceCount;
};
