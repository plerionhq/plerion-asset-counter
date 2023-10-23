import { NeptuneClient } from "@aws-sdk/client-neptune";
import {
  paginateDescribeDBInstances as paginateNeptuneInstances
} from "@aws-sdk/client-neptune/dist-types/pagination/DescribeDBInstancesPaginator.js";

export const queryNeptuneInstance = async (AWS_MAPPING, serviceName, resourceType, region) => {
  let resources = [];
  const client = new NeptuneClient({ region });
  for await (const page of paginateNeptuneInstances(
    { client },
    { Filters: [{ Name: "engine", Values: ["neptune"] }] }
  )) {
    resources.push(...(page.DBInstances || []));
  }
  const resourceCount = resources.length;
  updateResourceTypeCounter(serviceName, resourceType, resourceCount);
  AWS_MAPPING.total += resourceCount;
};

