import {
  SageMakerClient,
  paginateListHyperParameterTuningJobs,
  HyperParameterTuningJobStatus,
} from "@aws-sdk/client-sagemaker";
import { updateResourceTypeCounter } from "../../../utils/index.js";

const INCLUDED_JOB_STATUSES = [
  HyperParameterTuningJobStatus.COMPLETED,
  HyperParameterTuningJobStatus.IN_PROGRESS,
  HyperParameterTuningJobStatus.STOPPING,
];

export const query = async (AWS_MAPPING, serviceName, resourceType, region) => {
  let resources = [];
  const client = new SageMakerClient({ region });
  for await (const { HyperParameterTuningJobSummaries } of
    paginateListHyperParameterTuningJobs({ client }, {})) {
    const filtered = (HyperParameterTuningJobSummaries || []).filter(
      (job) =>
        job.HyperParameterTuningJobStatus &&
        INCLUDED_JOB_STATUSES.includes(job.HyperParameterTuningJobStatus)
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
