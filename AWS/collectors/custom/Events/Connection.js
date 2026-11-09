import {
  EventBridgeClient,
  ListConnectionsCommand,
} from "@aws-sdk/client-eventbridge";
import { updateResourceTypeCounter } from "../../../utils/index.js";
import { listAll } from "./listAll.js";

export const query = async (AWS_MAPPING, serviceName, resourceType, region) => {
  const client = new EventBridgeClient({ region });
  const resources = await listAll(
    client,
    ListConnectionsCommand,
    {},
    "Connections",
  );
  const resourceCount = resources.length;
  updateResourceTypeCounter(
    AWS_MAPPING,
    serviceName,
    resourceType,
    resourceCount,
  );
  AWS_MAPPING.total += resourceCount;
};
