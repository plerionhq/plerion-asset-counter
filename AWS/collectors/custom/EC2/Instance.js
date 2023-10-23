import { EC2Client, paginateDescribeInstances } from "@aws-sdk/client-ec2";

export const queryEC2Instance = async (AWS_MAPPING, serviceName, resourceType, region) => {
  let total = 0;
  let resources = [];
  try {
    const client = new EC2Client({ region });
    for await (const page of paginateDescribeInstances({ client }, {})) {
      if (page.Reservations) {
        resources.push(
          ...(page.Reservations.map(
            (reservation) => reservation.Instances
          ).flat() || [])
        );
      }
    }
    const ec2InstancesCount = resources.length;
    total += ec2InstancesCount;
    updateResourceTypeCounter(serviceName, resourceType, ec2InstancesCount);
  } catch (err) {
    console.log(`Error finding ${resourceType}`);
  }
  AWS_MAPPING.total += total;
};

