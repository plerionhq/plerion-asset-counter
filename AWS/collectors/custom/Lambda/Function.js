import { LambdaClient, paginateListFunctions } from "@aws-sdk/client-lambda";
import { updateResourceTypeCounter } from "../../../utils/index.js";

export const query = async (AWS_MAPPING, serviceName, resourceType, region) => {
  let resources = [];
  const client = new LambdaClient({ region });
  for await (const page of paginateListFunctions({ client }, {})) {
    resources.push(...(page.Functions || []));
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
