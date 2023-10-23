import { DescribeUsersCommand, MemoryDBClient } from "@aws-sdk/client-memorydb";

export const queryMemoryDBUser = async (AWS_MAPPING, serviceName, resourceType, region) => {
  let total = 0;
  const client = new MemoryDBClient({ region });
  const resources = [];
  let nextToken;
  do {
    const command = new DescribeUsersCommand({
      NextToken: nextToken
    });
    const response = await client.send(command);
    resources.push(...(response.Users || []));
    updateResourceTypeCounter(serviceName, resourceType, resources.length);
    total += resources.length;
    nextToken = response.NextToken;
  } while (nextToken);
  AWS_MAPPING.total += total;
};