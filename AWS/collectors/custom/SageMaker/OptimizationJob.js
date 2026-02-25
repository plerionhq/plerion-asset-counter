import {
  SageMakerClient,
  paginateListOptimizationJobs,
  OptimizationJobStatus,
} from "@aws-sdk/client-sagemaker";
import { updateResourceTypeCounter } from "../../../utils/index.js";

const INCLUDED_JOB_STATUSES = [
  OptimizationJobStatus.COMPLETED,
  OptimizationJobStatus.INPROGRESS,
  OptimizationJobStatus.STOPPING,
];

export const query = async (AWS_MAPPING, serviceName, resourceType, region) => {
  let resources = [];
  const client = new SageMakerClient({ region });
  for await (const { OptimizationJobSummaries } of
    paginateListOptimizationJobs({ client }, {})) {
    const filtered = (OptimizationJobSummaries || []).filter(
      (job) =>
        job.OptimizationJobStatus &&
        INCLUDED_JOB_STATUSES.includes(job.OptimizationJobStatus)
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
