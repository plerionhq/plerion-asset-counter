import {
  BedrockAgentCoreControlClient,
  paginateListPaymentManagers,
  paginateListPaymentConnectors,
} from "@aws-sdk/client-bedrock-agentcore-control";
import { updateResourceTypeCounter } from "../../../utils/index.js";

// PaymentConnector is a sub-resource of PaymentManager: the control-plane API
// has no account-wide ListPaymentConnectors, only
// ListPaymentConnectors(paymentManagerId). List all payment managers first,
// then list connectors per manager and flatten (mirrors service-collector's
// PaymentConnector collector).
export const query = async (AWS_MAPPING, serviceName, resourceType, region) => {
  const client = new BedrockAgentCoreControlClient({ region });
  const paymentManagers = [];
  for await (const page of paginateListPaymentManagers({ client }, {})) {
    paymentManagers.push(...(page.paymentManagers || []));
  }
  let resources = [];
  for (const paymentManager of paymentManagers) {
    if (!paymentManager.paymentManagerId) {
      continue;
    }
    for await (const page of paginateListPaymentConnectors(
      { client },
      { paymentManagerId: paymentManager.paymentManagerId },
    )) {
      resources.push(...(page.paymentConnectors || []));
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
