import {
  BedrockClient,
  paginateListModelCopyJobs,
} from "@aws-sdk/client-bedrock";
import { ModelCopyJobStatus } from "@aws-sdk/client-bedrock";
import { updateResourceTypeCounter } from "../../../utils/index.js";

const INCLUDED_JOB_STATUSES = [
  ModelCopyJobStatus.COMPLETED,
  ModelCopyJobStatus.IN_PROGRESS,
];

export const query = async (AWS_MAPPING, serviceName, resourceType, region) => {
  let resources = [];
  const client = new BedrockClient({ region });
  for await (const { modelCopyJobSummaries } of paginateListModelCopyJobs(
    { client },
    {},
  )) {
    const filtered = (modelCopyJobSummaries || []).filter(
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
