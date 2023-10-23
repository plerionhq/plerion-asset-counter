import { GetPublicAccessBlockCommand, S3ControlClient } from "@aws-sdk/client-s3-control";
import { getAWSAccountId } from "../../../service/index.js";

const queryS3ControlBlockPublicAccess = async (
  serviceName,
  resourceType,
  region
) => {
  const client = new S3ControlClient({ region });
  const command = new GetPublicAccessBlockCommand({
    AccountId: await getAWSAccountId()
  });
  const response = await client.send(command);
  let total = 0;
  if (response && response.PublicAccessBlockConfiguration) {
    total++;
    updateResourceTypeCounter(serviceName, resourceType, total);
    AWS_MAPPING.total += total;
  }
};