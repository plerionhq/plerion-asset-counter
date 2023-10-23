import { ListBucketsCommand, S3Client } from "@aws-sdk/client-s3";

export const queryS3Buckets = async (AWS_MAPPING, serviceName, resourceType, region) => {
  let total = 0;
  const resources = [];
  const client = new S3Client({ region });
  const command = new ListBucketsCommand({});
  const response = await client.send(command);
  resources.push({ ...(response.Buckets || []) });
  updateResourceTypeCounter(serviceName, resourceType, resources.length);
  total += resources.length;
  AWS_MAPPING.total += total;
};