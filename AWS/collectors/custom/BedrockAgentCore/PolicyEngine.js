import {
  BedrockAgentCoreControlClient,
  paginateListPolicyEngines,
} from "@aws-sdk/client-bedrock-agentcore-control";
import { updateResourceTypeCounter } from "../../../utils/index.js";

export const query = async (AWS_MAPPING, serviceName, resourceType, region) => {
  let resources = [];
  const client = new BedrockAgentCoreControlClient({ region });
  for await (const page of paginateListPolicyEngines({ client }, {})) {
    resources.push(...(page.policyEngines || []));
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
