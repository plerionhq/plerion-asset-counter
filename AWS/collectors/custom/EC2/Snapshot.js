import { EC2Client, paginateDescribeSnapshots } from "@aws-sdk/client-ec2";

export const querySnapshot = async (AWS_MAPPING, serviceName, resourceType, region) => {
  const client = new EC2Client({ region });
  let resources = [];
  for await (const image of paginateDescribeSnapshots(
    { client },
    { OwnerIds: ["self"] }
  )) {
    const { Snapshots: snapshots } = snapshots;
    resources.push(...(snapshots || []));
  }
  updateResourceTypeCounter(serviceName, resourceType, resources.length);
  AWS_MAPPING.total += resources.length;
};
