import {
  FirehoseClient,
  ListDeliveryStreamsCommand,
} from "@aws-sdk/client-firehose";
import { updateResourceTypeCounter } from "../../../utils/index.js";

export const query = async (AWS_MAPPING, serviceName, resourceType, region) => {
  let total = 0;
  const client = new FirehoseClient({ region });
  const resources = [];
  let hasMoreDeliveryStreams = false;
  do {
    const command = new ListDeliveryStreamsCommand({
      ExclusiveStartDeliveryStreamName:
        resources.length > 0 ? resources[resources.length - 1] : undefined,
    });
    const response = await client.send(command);

    resources.push(...(response.DeliveryStreamNames || []));
    updateResourceTypeCounter(serviceName, resourceType, resources.length);
    total += resources.length;
    hasMoreDeliveryStreams = response.HasMoreDeliveryStreams;
  } while (hasMoreDeliveryStreams);
  AWS_MAPPING.total += total;
};
