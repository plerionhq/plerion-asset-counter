import {
  BedrockAgentClient,
  paginateListAgents,
} from "@aws-sdk/client-bedrock-agent";
import { updateResourceTypeCounter } from "../../../utils/index.js";

export const query = async (AWS_MAPPING, serviceName, resourceType, region) => {
  let resources = [];
  const client = new BedrockAgentClient({ region });
  for await (const page of paginateListAgents({ client }, {})) {
    resources.push(...(page.agentSummaries || []));
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
