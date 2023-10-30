import {
  ApplicationAutoScalingClient,
  paginateDescribeScalingPolicies,
} from "@aws-sdk/client-application-auto-scaling";
import { updateResourceTypeCounter } from "../../../utils/index.js";

export const query = async (AWS_MAPPING, serviceName, resourceType, region) => {
  let total = 0;
  const resources = [];
  const client = new ApplicationAutoScalingClient({ region });
  for await (const page of paginateDescribeScalingPolicies(
    { client },
    { ServiceNamespace: "ecs" },
  )) {
    resources.push(...(page.ScalingPolicies || []));
  }
  const resourceCount = resources.length;
  updateResourceTypeCounter(
    AWS_MAPPING,
    serviceName,
    resourceType,
    resourceCount,
  );
  total += resources.length;
  AWS_MAPPING.total += total;
};
