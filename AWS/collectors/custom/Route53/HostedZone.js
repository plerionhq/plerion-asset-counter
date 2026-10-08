import {
  Route53Client,
  paginateListHostedZones,
} from "@aws-sdk/client-route-53";
import { updateResourceTypeCounter } from "../../../utils/index.js";

export const query = async (AWS_MAPPING, serviceName, resourceType, region) => {
  const resources = [];
  const client = new Route53Client({ region });
  for await (const page of paginateListHostedZones({ client }, {})) {
    resources.push(...(page.HostedZones || []));
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
