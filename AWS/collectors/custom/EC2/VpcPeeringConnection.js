import {
  EC2Client,
  paginateDescribeVpcPeeringConnections,
} from "@aws-sdk/client-ec2";
import { updateResourceTypeCounter } from "../../../utils/index.js";

export const query = async (AWS_MAPPING, serviceName, resourceType, region) => {
  const client = new EC2Client({ region });
  const resources = [];
  for await (const vpcPeeringConnection of paginateDescribeVpcPeeringConnections(
    { client },
    {
      Filters: [
        {
          Name: "status-code",
          Values: ["active"],
        },
      ],
    }
  )) {
    const { VpcPeeringConnections: vpcPeeringConnections } =
      vpcPeeringConnection;
    for (const vpcPeeringConnection of vpcPeeringConnections) {
      if (vpcPeeringConnection.RequesterVpcInfo?.Region === region) {
        resources.push(vpcPeeringConnection);
      }
    }
  }
  updateResourceTypeCounter(
    AWS_MAPPING,
    serviceName,
    resourceType,
    resources.length
  );
  AWS_MAPPING.total += resources.length;
};
