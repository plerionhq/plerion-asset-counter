import {
  SageMakerClient,
  paginateListFeatureGroups,
} from "@aws-sdk/client-sagemaker";
import { updateResourceTypeCounter } from "../../../utils/index.js";

export const query = async (AWS_MAPPING, serviceName, resourceType, region) => {
  let resources = [];
  const client = new SageMakerClient({ region });
  for await (const page of paginateListFeatureGroups({ client }, {})) {
    resources.push(...(page.FeatureGroupSummaries || []));
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
