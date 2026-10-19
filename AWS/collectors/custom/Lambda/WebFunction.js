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
    // Web Functions are served in a handful of regions; a region without
    // the service answers with an unknown-endpoint or access error and
    // counts as zero.
    if (
      error?.name !== "UnknownEndpoint" &&
      error?.name !== "AccessDeniedException" &&
      error?.code !== "ENOTFOUND"
    ) {
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
