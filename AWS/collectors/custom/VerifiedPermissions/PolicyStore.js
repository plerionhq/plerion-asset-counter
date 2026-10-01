import {
  VerifiedPermissionsClient,
  paginateListPolicyStores,
} from "@aws-sdk/client-verifiedpermissions";
import { updateResourceTypeCounter } from "../../../utils/index.js";

export const query = async (AWS_MAPPING, serviceName, resourceType, region) => {
  const resources = [];
  const client = new VerifiedPermissionsClient({ region });
  for await (const page of paginateListPolicyStores({ client }, {})) {
    resources.push(...(page.policyStores || []));
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
