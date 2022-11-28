import { STSClient, GetCallerIdentityCommand } from "@aws-sdk/client-sts";

export const getAWSAccountId = async () => {
  const response = await new STSClient({}).send(
    new GetCallerIdentityCommand({})
  );

  return String(response.Account);
};
