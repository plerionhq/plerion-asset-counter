import {
  OpenSearchServerlessClient,
  paginateListSecurityConfigs,
} from "@aws-sdk/client-opensearchserverless";
import { updateResourceTypeCounter } from "../../../utils/index.js";

// The list call answers for one type at a time.
const TYPES = ["saml", "iamidentitycenter", "iamfederation"];

export const query = async (AWS_MAPPING, serviceName, resourceType, region) => {
  const resources = [];
  const client = new OpenSearchServerlessClient({ region });
  for (const type of TYPES) {
    for await (const page of paginateListSecurityConfigs(
      { client },
      { type },
    )) {
      resources.push(...(page.securityConfigSummaries || []));
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
