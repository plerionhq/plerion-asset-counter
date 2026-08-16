import {
  DescribeHubCommand,
  SecurityHubClient,
} from "@aws-sdk/client-securityhub";
import { updateResourceTypeCounter } from "../../../utils/index.js";

// Hub is a region-level singleton: there is no ListHubs operation, only
// DescribeHub against the caller's own account. The counter probes DescribeHub
// directly: 1 if it resolves in this region, 0 if it throws InvalidAccessException
// (Security Hub is not enabled for this account in this region).
export const query = async (AWS_MAPPING, serviceName, resourceType, region) => {
  const client = new SecurityHubClient({ region });
  let resourceCount = 0;
  try {
    await client.send(new DescribeHubCommand({}));
    resourceCount = 1;
  } catch (err) {
    resourceCount = 0;
  }
  updateResourceTypeCounter(
    AWS_MAPPING,
    serviceName,
    resourceType,
    resourceCount,
  );
  AWS_MAPPING.total += resourceCount;
};
