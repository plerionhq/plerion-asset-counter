import {
  DescribeOrganizationCommand,
  OrganizationsClient,
  paginateListRoots,
} from "@aws-sdk/client-organizations";
import { getAWSAccountId } from "../../../service/index.js";
import { updateResourceTypeCounter } from "../../../utils/index.js";

export const queryOrganizations = async (
  AWS_MAPPING,
  serviceName,
  resourceType,
  region,
) => {
  const client = new OrganizationsClient({ region });
  const organization = await client.send(new DescribeOrganizationCommand({}));
  const resources = [];
  const roots = [];
  let total = 0;
  if (
    AWS_MAPPING[serviceName] &&
    AWS_MAPPING[serviceName][resourceType] !== undefined
  ) {
    return;
  }
  // AWS Organization is only counted as a resource for the master account
  if (
    organization &&
    organization.Organization &&
    organization.Organization.MasterAccountId === (await getAWSAccountId())
  ) {
    resources.push(organization.Organization);
    updateResourceTypeCounter(serviceName, resourceType, resources.length);
    total += resources.length;
    for await (const { Roots: rootPage } of paginateListRoots({ client }, {})) {
      roots.push(...(rootPage || []));
    }
    updateResourceTypeCounter(serviceName, resourceType, resources.length);
    total += roots.length;
  }
  AWS_MAPPING.total += total;
};
