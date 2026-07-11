import {
  BedrockAgentCoreControlClient,
  GetTokenVaultCommand,
} from "@aws-sdk/client-bedrock-agentcore-control";
import { updateResourceTypeCounter } from "../../../utils/index.js";

// TokenVault is an account+region-level singleton: there is no
// ListTokenVaults operation (mirrors service-collector's TokenVault
// collector, which returns a synthetic placeholder from list() and only
// confirms existence via GetTokenVault). The counter probes GetTokenVault
// directly: 1 if the default vault resolves in this region, 0 on error
// (e.g. the control plane has no vault provisioned there yet).
export const query = async (AWS_MAPPING, serviceName, resourceType, region) => {
  const client = new BedrockAgentCoreControlClient({ region });
  let resourceCount = 0;
  try {
    await client.send(new GetTokenVaultCommand({}));
    resourceCount = 1;
  } catch (err) {
    resourceCount = 0;
  }
  updateResourceTypeCounter(
    AWS_MAPPING,
    serviceName,
    resourceType,
    resourceCount,
  );
  AWS_MAPPING.total += resourceCount;
};
