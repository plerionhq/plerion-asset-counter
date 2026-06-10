import {
  RekognitionClient,
  paginateDescribeProjects,
} from "@aws-sdk/client-rekognition";
import { updateResourceTypeCounter } from "../../../utils/index.js";

export const query = async (AWS_MAPPING, serviceName, resourceType, region) => {
  let resources = [];
  const client = new RekognitionClient({ region });
  for await (const page of paginateDescribeProjects({ client }, {})) {
    resources.push(...(page.ProjectDescriptions || []));
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
