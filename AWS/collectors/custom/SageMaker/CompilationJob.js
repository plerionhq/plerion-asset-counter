import {
  SageMakerClient,
  paginateListCompilationJobs,
  CompilationJobStatus,
} from "@aws-sdk/client-sagemaker";
import { updateResourceTypeCounter } from "../../../utils/index.js";

const INCLUDED_JOB_STATUSES = [
  CompilationJobStatus.COMPLETED,
  CompilationJobStatus.INPROGRESS,
  CompilationJobStatus.STOPPING,
];

export const query = async (AWS_MAPPING, serviceName, resourceType, region) => {
  let resources = [];
  const client = new SageMakerClient({ region });
  for await (const { CompilationJobSummaries } of paginateListCompilationJobs(
    { client },
    {}
  )) {
    const filtered = (CompilationJobSummaries || []).filter(
      (job) =>
        job.CompilationJobStatus &&
        INCLUDED_JOB_STATUSES.includes(job.CompilationJobStatus)
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
