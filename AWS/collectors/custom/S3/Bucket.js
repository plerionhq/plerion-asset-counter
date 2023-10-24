import { ListBucketsCommand, S3Client } from "@aws-sdk/client-s3";
import { updateResourceTypeCounter } from "../../../utils/index.js";

export const query = async (AWS_MAPPING, serviceName, resourceType, region) => {
  let total = 0;
  const resources = [];
  const client = new S3Client({ region });
  const command = new ListBucketsCommand({});
  const response = await client.send(command);
  resources.push({ ...(response.Buckets || []) });
  updateResourceTypeCounter(
    AWS_MAPPING,
    serviceName,
    resourceType,
    resources.length,
  );
  total += resources.length;
  AWS_MAPPING.total += total;
};
