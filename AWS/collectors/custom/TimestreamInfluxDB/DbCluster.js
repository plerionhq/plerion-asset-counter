import {
  TimestreamInfluxDBClient,
  paginateListDbClusters,
} from "@aws-sdk/client-timestream-influxdb";
import { updateResourceTypeCounter } from "../../../utils/index.js";

export const query = async (AWS_MAPPING, serviceName, resourceType, region) => {
  let resources = [];
  const client = new TimestreamInfluxDBClient({ region });
  for await (const page of paginateListDbClusters({ client }, {})) {
    resources.push(...(page.items || []));
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
