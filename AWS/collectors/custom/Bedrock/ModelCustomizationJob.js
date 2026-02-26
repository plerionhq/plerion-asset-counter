import {
  BedrockClient,
  paginateListModelCustomizationJobs,
} from "@aws-sdk/client-bedrock";
import { ModelCustomizationJobStatus } from "@aws-sdk/client-bedrock";
import { updateResourceTypeCounter } from "../../../utils/index.js";

const INCLUDED_JOB_STATUSES = [
  ModelCustomizationJobStatus.COMPLETED,
  ModelCustomizationJobStatus.IN_PROGRESS,
  ModelCustomizationJobStatus.STOPPING,
];

export const query = async (AWS_MAPPING, serviceName, resourceType, region) => {
  let resources = [];
  const client = new BedrockClient({ region });
  for await (const {
    modelCustomizationJobSummaries,
  } of paginateListModelCustomizationJobs({ client }, {})) {
    const filtered = (modelCustomizationJobSummaries || []).filter(
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
