import {
  DocDBClient,
  paginateDescribeDBClusterSnapshots,
} from "@aws-sdk/client-docdb";
import { updateResourceTypeCounter } from "../../../utils/index.js";

export const query = async (AWS_MAPPING, serviceName, resourceType, region) => {
  let resources = [];
  const client = new DocDBClient({ region });
  for await (const page of paginateDescribeDBClusterSnapshots(
    { client },
    {
      SnapshotType: "manual",
      Filters: [{ Name: "engine", Values: ["docdb"] }],
    },
  )) {
    resources.push(...(page.DBClusterSnapshots || []));
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
