import { STSClient, GetCallerIdentityCommand } from "@aws-sdk/client-sts";

export const getAWSAccountId = async () => {
  const response = await new STSClient({}).send(
    new GetCallerIdentityCommand({})
  );

  return String(response.Account);
};

export const getNextPageTokenKeyFromResponse = (
  response,
  paginationKey
) => {
  const responseKeys = Object.keys(response);
  return responseKeys.find(
    (k) => k.toLowerCase() === paginationKey.toLowerCase()
  );
};

export const getNextListPageTokenKey = (list) => {
  const { action: listAction } = list;
  const { paginationToken } = listAction;
  if (paginationToken) {
    return paginationToken;
  }
  return "NextToken";
};

export const getNextListPageTokenRequestKey = (
  nextPageTokenResponseKey,
  list
) => {
  const { action: listAction } = list;
  const { nextPageTokenKey } = listAction;
  if (nextPageTokenKey) {
    return nextPageTokenKey;
  }
  return nextPageTokenResponseKey;
};

export const paginate = async ({
                                 client,
                                 command,
                                 responseKey = "Items",
                                 nextKey = "NextToken"
                               }) => {
  let nextToken;
  const results = [];
  let commandParams = command.params;
  do {
    const response = await client.send(
      new command.CommandClass(commandParams)
    );
    results.push(...(response[responseKey] || []));
    nextToken = response[nextKey];
    commandParams = command.params
      ? { [nextKey]: nextToken, ...command.params }
      : { [nextKey]: nextToken };
  } while (nextToken);
  return results;
};