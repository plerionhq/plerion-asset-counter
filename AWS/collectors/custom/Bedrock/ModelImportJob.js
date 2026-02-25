import {
  BedrockClient,
  paginateListModelImportJobs,
} from "@aws-sdk/client-bedrock";
import { ModelImportJobStatus } from "@aws-sdk/client-bedrock";
import { updateResourceTypeCounter } from "../../../utils/index.js";

const INCLUDED_JOB_STATUSES = [
  ModelImportJobStatus.COMPLETED,
  ModelImportJobStatus.IN_PROGRESS,
];

export const query = async (AWS_MAPPING, serviceName, resourceType, region) => {
  let resources = [];
  const client = new BedrockClient({ region });
  for await (const { modelImportJobSummaries } of paginateListModelImportJobs(
    { client },
    {},
  )) {
    const filtered = (modelImportJobSummaries || []).filter(
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
