import {
  IAMClient,
  paginateGetAccountAuthorizationDetails,
} from "@aws-sdk/client-iam";
import { updateResourceTypeCounter } from "../../../utils/index.js";

const IAM_GROUP = "AWS::IAM::Group";
const IAM_ROLE = "AWS::IAM::Role";
const IAM_USER = "AWS::IAM::User";
const IAM_POLICY = "AWS::IAM::Policy";

export const queryIAMAccountAuthorization = async (
  AWS_MAPPING,
  serviceName,
  resourceType,
  region,
) => {
  const users = [];
  const groups = [];
  const roles = [];
  const managedPolicies = [];
  if (
    AWS_MAPPING[serviceName] &&
    AWS_MAPPING[serviceName][resourceType] !== undefined
  ) {
    return;
  }
  const client = new IAMClient({ region });
  for await (const page of paginateGetAccountAuthorizationDetails(
    { client },
    {},
  )) {
    if (page.UserDetailList && page.UserDetailList.length) {
      users.push(...(page.UserDetailList || []));
      updateResourceTypeCounter(
        serviceName,
        IAM_USER,
        page.UserDetailList.length,
      );
    } else {
      updateResourceTypeCounter(serviceName, IAM_USER, 0);
    }
    if (page.GroupDetailList && page.GroupDetailList.length) {
      groups.push(...(page.GroupDetailList || []));
      updateResourceTypeCounter(
        serviceName,
        IAM_GROUP,
        page.GroupDetailList.length,
      );
    } else {
      updateResourceTypeCounter(serviceName, IAM_GROUP, 0);
    }
    if (page.RoleDetailList && page.RoleDetailList.length) {
      roles.push(...(page.RoleDetailList || []));
      updateResourceTypeCounter(
        serviceName,
        IAM_ROLE,
        page.RoleDetailList.length,
      );
    } else {
      updateResourceTypeCounter(serviceName, IAM_ROLE, 0);
    }
    if (page.Policies && page.Policies.length) {
      managedPolicies.push(...(page.Policies || []));
      updateResourceTypeCounter(serviceName, IAM_POLICY, page.Policies.length);
    } else {
      updateResourceTypeCounter(serviceName, IAM_POLICY, 0);
    }
  }
  const total =
    users.length + groups.length + roles.length + managedPolicies.length;
  AWS_MAPPING.total += total;
};
