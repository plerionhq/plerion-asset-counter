import {
  BedrockAgentCoreControlClient,
  paginateListGateways,
  paginateListGatewayTargets,
} from "@aws-sdk/client-bedrock-agentcore-control";
import { updateResourceTypeCounter } from "../../../utils/index.js";

// GatewayTarget is a sub-resource of Gateway: the control-plane API has no
// account-wide ListGatewayTargets, only ListGatewayTargets(gatewayIdentifier).
// List all gateways first, then list targets per gateway and flatten
// (mirrors service-collector's GatewayTarget collector).
export const query = async (AWS_MAPPING, serviceName, resourceType, region) => {
  const client = new BedrockAgentCoreControlClient({ region });
  const gateways = [];
  for await (const page of paginateListGateways({ client }, {})) {
    gateways.push(...(page.items || []));
  }
  let resources = [];
  for (const gateway of gateways) {
    if (!gateway.gatewayId) {
      continue;
    }
    for await (const page of paginateListGatewayTargets(
      { client },
      { gatewayIdentifier: gateway.gatewayId },
    )) {
      resources.push(...(page.items || []));
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
