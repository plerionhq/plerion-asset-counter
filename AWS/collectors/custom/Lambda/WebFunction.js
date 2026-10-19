import {
  LambdaWebClient,
  paginateListWebFunctions,
} from "@aws-sdk/client-lambda-web";
import { updateResourceTypeCounter } from "../../../utils/index.js";

export const query = async (AWS_MAPPING, serviceName, resourceType, region) => {
  let resources = [];
  const client = new LambdaWebClient({ region });
  try {
    for await (const page of paginateListWebFunctions({ client }, {})) {
      resources.push(...(page.functions || []));
    }
  } catch (error) {
    // Web Functions are served in a handful of regions. Elsewhere the API
    // answers 403 with an HTML body, which the SDK reports as a
    // deserialization error; both count as zero.
    const status = error?.$response?.statusCode ?? error?.$metadata?.httpStatusCode;
    if (status !== 403 && error?.name !== "AccessDeniedException") {
      throw error;
    }
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
