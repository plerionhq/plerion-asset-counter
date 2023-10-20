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

export const getNextListPageTokenKey = () => {
  const resourceObject = this.resourceDependency;
  const { list } = resourceObject;
  const { action: listAction } = list;
  const { paginationToken } = listAction;
  if (paginationToken) {
    return paginationToken;
  }
  return "NextToken";
};

