import { KinesisClient, paginateListChannels } from "@aws-sdk/client-kinesis";
import { updateResourceTypeCounter } from "../../../utils/index.js";

export const query = async (AWS_MAPPING, serviceName, resourceType, region) => {
  let resources = [];
  const client = new KinesisClient({ region });
  for await (const page of paginateListChannels({ client }, {})) {
    resources.push(...(page.ChannelSummaries || []));
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
