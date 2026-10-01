import {
  RolesAnywhereClient,
  paginateListTrustAnchors,
} from "@aws-sdk/client-rolesanywhere";
import { updateResourceTypeCounter } from "../../../utils/index.js";

export const query = async (AWS_MAPPING, serviceName, resourceType, region) => {
  const resources = [];
  const client = new RolesAnywhereClient({ region });
  for await (const page of paginateListTrustAnchors({ client }, {})) {
    resources.push(...(page.trustAnchors || []));
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
