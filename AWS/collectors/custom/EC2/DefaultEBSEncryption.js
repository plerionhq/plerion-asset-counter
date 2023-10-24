import {
  EC2Client,
  GetEbsEncryptionByDefaultCommand,
} from "@aws-sdk/client-ec2";
import { updateResourceTypeCounter } from "../../../utils/index.js";

export const query = async (AWS_MAPPING, serviceName, resourceType, region) => {
  let total = 0;
  const command = new GetEbsEncryptionByDefaultCommand({});
  const client = new EC2Client({ region });
  const response = await client.send(command);
  if (response) {
    const ebsEncryptionCount =
      response.EbsEncryptionByDefault !== undefined ? 1 : 0;
    total += ebsEncryptionCount;
    updateResourceTypeCounter(
      AWS_MAPPING,
      serviceName,
      resourceType,
      ebsEncryptionCount,
    );
  }

  AWS_MAPPING.total += total;
};
