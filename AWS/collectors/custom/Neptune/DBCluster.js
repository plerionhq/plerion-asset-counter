import { NeptuneClient } from "@aws-sdk/client-neptune";
import {
  paginateDescribeDBClusters as paginateNeptuneClusters
} from "@aws-sdk/client-neptune/dist-types/pagination/DescribeDBClustersPaginator.js";

export const queryNeptuneCluster = async (AWS_MAPPING, serviceName, resourceType, region) => {
  let resources = [];
  const client = new NeptuneClient({ region });
  for await (const page of paginateNeptuneClusters(
    { client },
    { Filters: [{ Name: "engine", Values: ["neptune"] }] }
  )) {
    resources.push(...(page.DBClusters || []));
  }
  const resourceCount = resources.length;
  updateResourceTypeCounter(serviceName, resourceType, resourceCount);
  AWS_MAPPING.total += resourceCount;
};