import { DescribeOrganizationCommand, OrganizationsClient } from "@aws-sdk/client-organizations";

export const queryOrganizationsAccount = async (AWS_MAPPING, serviceName, resourceType, region) => {
  let total = 0;
  const client = new OrganizationsClient({ region });
  const organization =
    await client.send(new DescribeOrganizationCommand({}));
  const resources = [];
  if (organization.Organization) {
    resources.push(organization.Organization);
    total += resources.length;
  }
  AWS_MAPPING.total += total;
};