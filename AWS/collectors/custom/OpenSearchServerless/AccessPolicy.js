import {
  OpenSearchServerlessClient,
  paginateListAccessPolicies,
} from "@aws-sdk/client-opensearchserverless";
import { updateResourceTypeCounter } from "../../../utils/index.js";

// The list call answers for one type at a time.
const TYPES = ["data"];

export const query = async (AWS_MAPPING, serviceName, resourceType, region) => {
  const resources = [];
  const client = new OpenSearchServerlessClient({ region });
  for (const type of TYPES) {
    for await (const page of paginateListAccessPolicies({ client }, { type })) {
      resources.push(...(page.accessPolicySummaries || []));
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
