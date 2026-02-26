import {
  SageMakerClient,
  paginateListModelExplainabilityJobDefinitions,
} from "@aws-sdk/client-sagemaker";
import { updateResourceTypeCounter } from "../../../utils/index.js";

export const query = async (AWS_MAPPING, serviceName, resourceType, region) => {
  let resources = [];
  const client = new SageMakerClient({ region });
  for await (const { JobDefinitionSummaries } of
    paginateListModelExplainabilityJobDefinitions({ client }, {})) {
    resources.push(...(JobDefinitionSummaries || []));
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
