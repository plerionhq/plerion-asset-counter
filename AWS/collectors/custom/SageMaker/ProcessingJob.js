import {
  SageMakerClient,
  paginateListProcessingJobs,
  ProcessingJobStatus,
} from "@aws-sdk/client-sagemaker";
import { updateResourceTypeCounter } from "../../../utils/index.js";

const INCLUDED_JOB_STATUSES = [
  ProcessingJobStatus.COMPLETED,
  ProcessingJobStatus.IN_PROGRESS,
  ProcessingJobStatus.STOPPING,
];

export const query = async (AWS_MAPPING, serviceName, resourceType, region) => {
  let resources = [];
  const client = new SageMakerClient({ region });
  for await (const { ProcessingJobSummaries } of paginateListProcessingJobs(
    { client },
    {}
  )) {
    const filtered = (ProcessingJobSummaries || []).filter(
      (job) =>
        job.ProcessingJobStatus &&
        INCLUDED_JOB_STATUSES.includes(job.ProcessingJobStatus)
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
