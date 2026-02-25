import {
  BedrockClient,
  paginateListImportedModels,
} from "@aws-sdk/client-bedrock";
import { updateResourceTypeCounter } from "../../../utils/index.js";

const SUPPORTED_REGIONS = [
  "eu-central-1",
  "us-east-1",
  "us-east-2",
  "us-west-2",
];

export const query = async (AWS_MAPPING, serviceName, resourceType, region) => {
  if (!SUPPORTED_REGIONS.includes(region)) {
    updateResourceTypeCounter(AWS_MAPPING, serviceName, resourceType, 0);
    return;
  }
  let resources = [];
  const client = new BedrockClient({ region });
  for await (const page of paginateListImportedModels({ client }, {})) {
    resources.push(...(page.modelSummaries || []));
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
