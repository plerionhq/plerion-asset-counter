import {
  paginateListPolicies,
  OrganizationsClient,
  PolicyType,
} from "@aws-sdk/client-organizations";
import { updateResourceTypeCounter } from "../../../utils/index.js";

export const query = async (AWS_MAPPING, serviceName, resourceType, region) => {
  const client = new OrganizationsClient({ region });
  const resources = [];
  for await (const policies of paginateListPolicies(
    { client },
    { Filter: PolicyType.DECLARATIVE_POLICY_EC2 },
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
