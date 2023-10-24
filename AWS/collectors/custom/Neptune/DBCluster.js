import { NeptuneClient } from "@aws-sdk/client-neptune";
import { paginateDescribeDBClusters as paginateNeptuneClusters } from "@aws-sdk/client-neptune/dist-types/pagination/DescribeDBClustersPaginator.js";
import { updateResourceTypeCounter } from "../../../utils/index.js";

export const query = async (AWS_MAPPING, serviceName, resourceType, region) => {
  let resources = [];
  const client = new NeptuneClient({ region });
  for await (const page of paginateNeptuneClusters(
    { client },
    { Filters: [{ Name: "engine", Values: ["neptune"] }] },
  )) {
    resources.push(...(page.DBClusters || []));
  }
  const resourceCount = resources.length;
  updateResourceTypeCounter(
    AWS_MAPPING,
    serviceName,
    resourceType,
    resourceCount,
  );
  AWS_MAPPING.total += resourceCount;
};
