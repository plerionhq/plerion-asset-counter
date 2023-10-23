import { DocDBClient, paginateDescribeDBInstances } from "@aws-sdk/client-docdb";

export const queryDocDBInstance = async (AWS_MAPPING, serviceName, resourceType, region) => {
  let resources = [];
  const client = new DocDBClient({ region });
  for await (const page of paginateDescribeDBInstances(
    { client },
    { Filters: [{ Name: "engine", Values: ["docdb"] }] }
  )) {
    resources.push(...(page.DBInstances || []));
  }
  const resourceCount = resources.length;
  updateResourceTypeCounter(serviceName, resourceType, resourceCount);
  AWS_MAPPING.total += resourceCount;
};

