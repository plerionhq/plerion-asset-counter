import {
  SageMakerGeospatialClient,
  paginateListVectorEnrichmentJobs,
} from "@aws-sdk/client-sagemaker-geospatial";
import { updateResourceTypeCounter } from "../../../utils/index.js";

const EXCLUDED_STATUSES = ["STOPPED", "FAILED", "DELETED"];

export const query = async (AWS_MAPPING, serviceName, resourceType, region) => {
  if (region !== "us-west-2") {
    updateResourceTypeCounter(AWS_MAPPING, serviceName, resourceType, 0);
    return;
  }
  let resources = [];
  const client = new SageMakerGeospatialClient({ region });
  for await (const { VectorEnrichmentJobSummaries } of
    paginateListVectorEnrichmentJobs({ client }, {})) {
    const filtered = (VectorEnrichmentJobSummaries || []).filter(
      (job) => job.Status && !EXCLUDED_STATUSES.includes(job.Status)
    );
    resources.push(...filtered);
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
