import {
  IdentitystoreClient,
  paginateListGroups,
  paginateListUsers,
} from "@aws-sdk/client-identitystore";
import { SSOAdminClient } from "@aws-sdk/client-sso-admin";
import { administeredInstances } from "../SSO/service.js";
import { updateResourceTypeCounter } from "../../../utils/index.js";

// Counted only where the Identity Center instance is administered, the same
// rule the collector uses.
export const queryIdentityStore = async (
  AWS_MAPPING,
  serviceName,
  resourceType,
  region,
) => {
  const instances = await administeredInstances(
    new SSOAdminClient({ region }),
    region,
  );
  const client = new IdentitystoreClient({ region });
  let resourceCount = 0;
  for (const { IdentityStoreId } of instances) {
    if (resourceType === "AWS::IdentityStore::User") {
      for await (const page of paginateListUsers(
        { client },
        { IdentityStoreId },
      )) {
        resourceCount += (page.Users || []).length;
      }
    } else {
      for await (const page of paginateListGroups(
        { client },
        { IdentityStoreId },
      )) {
        resourceCount += (page.Groups || []).length;
      }
    }
  }
  updateResourceTypeCounter(
    AWS_MAPPING,
    serviceName,
    resourceType,
    resourceCount,
  );
  AWS_MAPPING.total += resourceCount;
};
