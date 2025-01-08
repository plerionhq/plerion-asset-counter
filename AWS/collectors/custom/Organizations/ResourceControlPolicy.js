import {
  paginateListPolicies,
  OrganizationsClient,
} from "@aws-sdk/client-organizations";
import { updateResourceTypeCounter } from "../../../utils/index.js";

export const query = async (AWS_MAPPING, serviceName, resourceType, region) => {
  const client = new OrganizationsClient({ region });
  const resources = [];
  for await (const policies of paginateListPolicies(
    { client },
    { Filter: "RESOURCE_CONTROL_POLICY" },
  )) {
    const { Policies: policy } = policies;
    resources.push(...(policy || []));
  }
  updateResourceTypeCounter(
    AWS_MAPPING,
    serviceName,
    resourceType,
    resources.length,
  );
  AWS_MAPPING.total += resources.length;
};
