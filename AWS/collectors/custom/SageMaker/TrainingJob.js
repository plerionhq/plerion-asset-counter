import {
  SageMakerClient,
  paginateListTrainingJobs,
  TrainingJobStatus,
} from "@aws-sdk/client-sagemaker";
import { updateResourceTypeCounter } from "../../../utils/index.js";

const INCLUDED_JOB_STATUSES = [
  TrainingJobStatus.COMPLETED,
  TrainingJobStatus.IN_PROGRESS,
  TrainingJobStatus.STOPPING,
];

export const query = async (AWS_MAPPING, serviceName, resourceType, region) => {
  let resources = [];
  const client = new SageMakerClient({ region });
  for await (const { TrainingJobSummaries } of paginateListTrainingJobs(
    { client },
    {}
  )) {
    const filtered = (TrainingJobSummaries || []).filter(
      (job) =>
        job.TrainingJobStatus &&
        INCLUDED_JOB_STATUSES.includes(job.TrainingJobStatus)
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
