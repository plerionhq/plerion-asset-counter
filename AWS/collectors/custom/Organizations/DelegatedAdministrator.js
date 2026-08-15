import {
  OrganizationsClient,
  paginateListDelegatedAdministrators,
} from "@aws-sdk/client-organizations";
import { updateResourceTypeCounter } from "../../../utils/index.js";

export const query = async (AWS_MAPPING, serviceName, resourceType, region) => {
  let resources = [];
  const client = new OrganizationsClient({ region });
  for await (const page of paginateListDelegatedAdministrators({ client }, {})) {
    resources.push(...(page.DelegatedAdministrators || []));
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
