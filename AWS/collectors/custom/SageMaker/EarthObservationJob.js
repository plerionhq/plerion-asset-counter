import {
  SageMakerGeospatialClient,
  paginateListEarthObservationJobs,
  EarthObservationJobStatus,
} from "@aws-sdk/client-sagemaker-geospatial";
import { updateResourceTypeCounter } from "../../../utils/index.js";

const INCLUDED_JOB_STATUSES = [
  EarthObservationJobStatus.COMPLETED,
  EarthObservationJobStatus.IN_PROGRESS,
  EarthObservationJobStatus.STOPPING,
];

export const query = async (AWS_MAPPING, serviceName, resourceType, region) => {
  if (region !== "us-west-2") {
    updateResourceTypeCounter(AWS_MAPPING, serviceName, resourceType, 0);
    return;
  }
  let resources = [];
  const client = new SageMakerGeospatialClient({ region });
  for await (const { EarthObservationJobSummaries } of
    paginateListEarthObservationJobs({ client }, {})) {
    const filtered = (EarthObservationJobSummaries || []).filter(
      (job) => job.Status && INCLUDED_JOB_STATUSES.includes(job.Status)
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
