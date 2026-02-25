import {
  SageMakerClient,
  paginateListModelCards,
} from "@aws-sdk/client-sagemaker";
import { updateResourceTypeCounter } from "../../../utils/index.js";

export const query = async (AWS_MAPPING, serviceName, resourceType, region) => {
  let resources = [];
  const client = new SageMakerClient({ region });
  for await (const page of paginateListModelCards({ client }, {})) {
    resources.push(...(page.ModelCardSummaries || []));
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
