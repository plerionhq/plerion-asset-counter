import {
  GetPublicAccessBlockCommand,
  S3ControlClient,
} from "@aws-sdk/client-s3-control";
import { getAWSAccountId } from "../../../service/index.js";
import { updateResourceTypeCounter } from "../../../utils/index.js";

export const query = async (AWS_MAPPING, serviceName, resourceType, region) => {
  const client = new S3ControlClient({ region });
  const command = new GetPublicAccessBlockCommand({
    AccountId: await getAWSAccountId(),
  });
  const response = await client.send(command);
  let total = 0;
  if (response && response.PublicAccessBlockConfiguration) {
    total++;
    updateResourceTypeCounter(AWS_MAPPING, serviceName, resourceType, total);
    AWS_MAPPING.total += total;
  }
};
