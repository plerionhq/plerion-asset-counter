import { LambdaClient, paginateListFunctions } from "@aws-sdk/client-lambda";

export const queryLambdaFunction = async (AWS_MAPPING, serviceName, resourceType, region) => {
  let resources = [];
  const client = new LambdaClient({ region });
  for await (const page of paginateListFunctions({ client }, {})) {
    resources.push(...(page.Functions || []));
  }
  const resourceCount = resources.length;
  updateResourceTypeCounter(serviceName, resourceType, resourceCount);
  AWS_MAPPING.total += resourceCount;
};