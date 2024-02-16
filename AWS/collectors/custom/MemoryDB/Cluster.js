import {
  DescribeClustersCommand,
  MemoryDBClient,
} from "@aws-sdk/client-memorydb";
import { updateResourceTypeCounter } from "../../../utils/index.js";

export const query = async (AWS_MAPPING, serviceName, resourceType, region) => {
  let total = 0;
  const client = new MemoryDBClient({ region });
  const resources = [];
  let nextToken;
  do {
    const command = new DescribeClustersCommand({
      NextToken: nextToken,
    });
    const response = await client.send(command);
    resources.push(...(response.Clusters || []));
    updateResourceTypeCounter(
      AWS_MAPPING,
      serviceName,
      resourceType,
      resources.length,
    );
    total += resources.length;
    nextToken = response.NextToken;
  } while (nextToken);
  AWS_MAPPING.total += total;
};