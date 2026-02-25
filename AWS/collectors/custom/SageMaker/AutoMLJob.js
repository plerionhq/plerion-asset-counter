import {
  SageMakerClient,
  paginateListAutoMLJobs,
  AutoMLJobStatus,
} from "@aws-sdk/client-sagemaker";
import { updateResourceTypeCounter } from "../../../utils/index.js";

const INCLUDED_JOB_STATUSES = [
  AutoMLJobStatus.COMPLETED,
  AutoMLJobStatus.IN_PROGRESS,
  AutoMLJobStatus.STOPPING,
];

export const query = async (AWS_MAPPING, serviceName, resourceType, region) => {
  let resources = [];
  const client = new SageMakerClient({ region });
  for await (const { AutoMLJobSummaries } of paginateListAutoMLJobs(
    { client },
    {}
  )) {
    const filtered = (AutoMLJobSummaries || []).filter(
      (job) =>
        job.AutoMLJobStatus &&
        INCLUDED_JOB_STATUSES.includes(job.AutoMLJobStatus)
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
