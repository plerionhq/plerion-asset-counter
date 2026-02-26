import {
  BedrockAgentClient,
  paginateListPrompts,
} from "@aws-sdk/client-bedrock-agent";
import { updateResourceTypeCounter } from "../../../utils/index.js";

export const query = async (AWS_MAPPING, serviceName, resourceType, region) => {
  let resources = [];
  const client = new BedrockAgentClient({ region });
  for await (const page of paginateListPrompts({ client }, {})) {
    resources.push(...(page.promptSummaries || []));
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
