import {
  SageMakerClient,
  paginateListTransformJobs,
  TransformJobStatus,
} from "@aws-sdk/client-sagemaker";
import { updateResourceTypeCounter } from "../../../utils/index.js";

const INCLUDED_JOB_STATUSES = [
  TransformJobStatus.COMPLETED,
  TransformJobStatus.IN_PROGRESS,
  TransformJobStatus.STOPPING,
];

export const query = async (AWS_MAPPING, serviceName, resourceType, region) => {
  let resources = [];
  const client = new SageMakerClient({ region });
  for await (const { TransformJobSummaries } of paginateListTransformJobs(
    { client },
    {}
  )) {
    const filtered = (TransformJobSummaries || []).filter(
      (job) =>
        job.TransformJobStatus &&
        INCLUDED_JOB_STATUSES.includes(job.TransformJobStatus)
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
