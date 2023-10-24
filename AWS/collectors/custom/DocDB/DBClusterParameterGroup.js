import { DocDBClient } from "@aws-sdk/client-docdb";
import { paginateDescribeDBClusterParameterGroups as paginateDocDBClusterParameterGroups } from "@aws-sdk/client-docdb/dist-types/pagination/DescribeDBClusterParameterGroupsPaginator.js";
import { updateResourceTypeCounter } from "../../../utils/index.js";

export const query = async (AWS_MAPPING, serviceName, resourceType, region) => {
  let resources = [];
  const client = new DocDBClient({ region });
  for await (const page of paginateDocDBClusterParameterGroups(
    { client },
    { Filters: [{ Name: "engine", Values: ["docdb"] }] },
  )) {
    resources.push(...(page.DBClusterParameterGroups || []));
  }
  const resourceCount = resources.length;
  updateResourceTypeCounter(serviceName, resourceType, resourceCount);
  AWS_MAPPING.total += resourceCount;
};
