import {
  DirectoryServiceClient,
  paginateDescribeDirectories,
} from "@aws-sdk/client-directory-service";
import { updateResourceTypeCounter } from "../../../utils/index.js";

export const query = async (AWS_MAPPING, serviceName, resourceType, region) => {
  const resources = [];
  const client = new DirectoryServiceClient({ region });
  for await (const page of paginateDescribeDirectories({ client }, {})) {
    resources.push(...(page.DirectoryDescriptions || []));
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
