import {
  BedrockDataAutomationClient,
  paginateListBlueprints,
} from "@aws-sdk/client-bedrock-data-automation";
import { updateResourceTypeCounter } from "../../../utils/index.js";

export const query = async (AWS_MAPPING, serviceName, resourceType, region) => {
  let resources = [];
  const client = new BedrockDataAutomationClient({ region });
  for await (const page of paginateListBlueprints({ client }, {})) {
    resources.push(...(page.blueprints || []));
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
