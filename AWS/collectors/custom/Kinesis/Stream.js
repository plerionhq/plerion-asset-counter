import { KinesisClient, ListStreamsCommand } from "@aws-sdk/client-kinesis";
import { updateResourceTypeCounter } from "../../../utils/index.js";

export const query = async (AWS_MAPPING, serviceName, resourceType, region) => {
  let total = 0;
  const client = new KinesisClient({ region });
  const resources = [];
  let hasMoreStreams = false;
  do {
    const command = new ListStreamsCommand({
      ExclusiveStartStreamName:
        resources.length > 0 ? resources[resources.length - 1] : undefined,
    });
    const response = await client.send(command);

    resources.push(...(response.StreamNames || []));
    updateResourceTypeCounter(
      AWS_MAPPING,
      serviceName,
      resourceType,
      resources.length,
    );
    total += resources.length;
    hasMoreStreams = response.HasMoreStreams;
  } while (hasMoreStreams);
  AWS_MAPPING.total += total;
};
