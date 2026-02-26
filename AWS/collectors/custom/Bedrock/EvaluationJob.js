import {
  BedrockClient,
  paginateListEvaluationJobs,
} from "@aws-sdk/client-bedrock";
import { EvaluationJobStatus } from "@aws-sdk/client-bedrock";
import { updateResourceTypeCounter } from "../../../utils/index.js";

const INCLUDED_JOB_STATUSES = [
  EvaluationJobStatus.COMPLETED,
  EvaluationJobStatus.IN_PROGRESS,
  EvaluationJobStatus.STOPPING,
];

export const query = async (AWS_MAPPING, serviceName, resourceType, region) => {
  let resources = [];
  const client = new BedrockClient({ region });
  for await (const { jobSummaries } of paginateListEvaluationJobs(
    { client },
    {},
  )) {
    const filtered = (jobSummaries || []).filter(
      (job) => job.status && INCLUDED_JOB_STATUSES.includes(job.status),
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
