import { EC2Client, paginateDescribeSnapshots } from "@aws-sdk/client-ec2";
import { updateResourceTypeCounter } from "../../../utils/index.js";

export const query = async (AWS_MAPPING, serviceName, resourceType, region) => {
  const client = new EC2Client({ region });
  let resources = [];
  for await (const ss of paginateDescribeSnapshots(
    { client },
    { OwnerIds: ["self"] },
  )) {
    const { Snapshots: snapshots } = ss;
    resources.push(...(snapshots || []));
  }
  updateResourceTypeCounter(
    AWS_MAPPING,
    serviceName,
    resourceType,
    resources.length,
  );
  AWS_MAPPING.total += resources.length;
};
