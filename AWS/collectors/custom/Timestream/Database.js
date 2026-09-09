import {
  TimestreamWriteClient,
  paginateListDatabases,
} from "@aws-sdk/client-timestream-write";
import { updateResourceTypeCounter } from "../../../utils/index.js";

export const query = async (AWS_MAPPING, serviceName, resourceType, region) => {
  let resources = [];
  const client = new TimestreamWriteClient({ region });
  for await (const page of paginateListDatabases({ client }, {})) {
    resources.push(...(page.Databases || []));
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
