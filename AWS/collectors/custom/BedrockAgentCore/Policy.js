import {
  BedrockAgentCoreControlClient,
  paginateListPolicyEngines,
  paginateListPolicies,
} from "@aws-sdk/client-bedrock-agentcore-control";
import { updateResourceTypeCounter } from "../../../utils/index.js";

// Policy is a sub-resource of PolicyEngine: there is no account-wide
// ListPolicies operation, so list() first enumerates policy engines
// (ListPolicyEngines), then lists policies per engine (ListPolicies),
// flattening the result (mirrors service-collector's Policy collector).
export const query = async (AWS_MAPPING, serviceName, resourceType, region) => {
  const client = new BedrockAgentCoreControlClient({ region });
  const policyEngines = [];
  for await (const page of paginateListPolicyEngines({ client }, {})) {
    policyEngines.push(...(page.policyEngines || []));
  }
  let resources = [];
  for (const policyEngine of policyEngines) {
    if (!policyEngine.policyEngineId) {
      continue;
    }
    for await (const page of paginateListPolicies(
      { client },
      { policyEngineId: policyEngine.policyEngineId },
    )) {
      resources.push(...(page.policies || []));
    }
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
