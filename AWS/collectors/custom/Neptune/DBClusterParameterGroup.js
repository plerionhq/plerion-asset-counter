import { NeptuneClient, paginateDescribeDBClusterParameterGroups } from "@aws-sdk/client-neptune";

const queryNeptuneClusterParameterGroups = async (
  serviceName,
  resourceType,
  region
) => {
  let resources = [];
  const client = new NeptuneClient({ region });
  for await (const page of paginateDescribeDBClusterParameterGroups(
    { client },
    { Filters: [{ Name: "engine", Values: ["neptune"] }] }
  )) {
    resources.push(...(page.DBClusterParameterGroups || []));
  }
  const resourceCount = resources.length;
  updateResourceTypeCounter(serviceName, resourceType, resourceCount);
  AWS_MAPPING.total += resourceCount;
};