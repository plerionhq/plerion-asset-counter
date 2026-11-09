import {
  KeyspacesClient,
  paginateListKeyspaces,
} from "@aws-sdk/client-keyspaces";
import { updateResourceTypeCounter } from "../../../utils/index.js";

// AWS creates these in every account and region. They are not collected.
const SYSTEM_KEYSPACES = new Set([
  "system",
  "system_schema",
  "system_schema_mcs",
  "system_multiregion_info",
]);

export const query = async (AWS_MAPPING, serviceName, resourceType, region) => {
  const client = new KeyspacesClient({ region });
  let resourceCount = 0;
  for await (const { keyspaces = [] } of paginateListKeyspaces(
    { client },
    {},
  )) {
    resourceCount += keyspaces.filter(
      ({ keyspaceName }) => !SYSTEM_KEYSPACES.has(keyspaceName),
    ).length;
  }
  updateResourceTypeCounter(
    AWS_MAPPING,
    serviceName,
    resourceType,
    resourceCount,
  );
  AWS_MAPPING.total += resourceCount;
};
