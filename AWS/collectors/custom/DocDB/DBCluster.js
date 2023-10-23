import { DocDBClient, paginateDescribeDBClusters } from "@aws-sdk/client-docdb";

export const queryDocDBCluster = async (AWS_MAPPING, serviceName, resourceType, region) => {
  let resources = [];
  const client = new DocDBClient({ region });
  for await (const page of paginateDescribeDBClusters(
    { client },
    { Filters: [{ Name: "engine", Values: ["docdb"] }] }
  )) {
    resources.push(...(page.DBClusters || []));
  }
  const resourceCount = resources.length;
  updateResourceTypeCounter(serviceName, resourceType, resourceCount);
  AWS_MAPPING.total += resourceCount;
};