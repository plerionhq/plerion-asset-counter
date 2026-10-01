import {
  RolesAnywhereClient,
  paginateListProfiles,
} from "@aws-sdk/client-rolesanywhere";
import { updateResourceTypeCounter } from "../../../utils/index.js";

export const query = async (AWS_MAPPING, serviceName, resourceType, region) => {
  const resources = [];
  const client = new RolesAnywhereClient({ region });
  for await (const page of paginateListProfiles({ client }, {})) {
    resources.push(...(page.profiles || []));
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
