import {
  ListPermissionSetsCommand,
  paginateListInstances,
  paginateListPermissionSets,
  SSOAdminClient,
} from "@aws-sdk/client-sso-admin";
import { updateResourceTypeCounter } from "../../../utils/index.js";

// Plerion collects an Identity Center instance only in its primary region,
// and only in the management or delegated administrator account: members
// can list the organization's instance but are refused its contents.
export const administeredInstances = async (client, region) => {
  const administered = [];
  for await (const page of paginateListInstances({ client }, {})) {
    for (const instance of page.Instances || []) {
      if ((instance.PrimaryRegion || region) !== region) {
        continue;
      }
      try {
        await client.send(
          new ListPermissionSetsCommand({
            InstanceArn: instance.InstanceArn,
            MaxResults: 1,
          }),
        );
        administered.push(instance);
      } catch (err) {
        if (err.name !== "AccessDeniedException") {
          throw err;
        }
      }
    }
  }
  return administered;
};

export const querySSO = async (
  AWS_MAPPING,
  serviceName,
  resourceType,
  region,
) => {
  const client = new SSOAdminClient({ region });
  const instances = await administeredInstances(client, region);
  let resourceCount = instances.length;
  if (resourceType === "AWS::SSO::PermissionSet") {
    resourceCount = 0;
    for (const { InstanceArn } of instances) {
      for await (const page of paginateListPermissionSets(
        { client },
        { InstanceArn },
      )) {
        resourceCount += (page.PermissionSets || []).length;
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
