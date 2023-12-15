import { Macie2Client, paginateListFindings } from "@aws-sdk/client-macie2";
import { updateResourceTypeCounter } from "../../../utils/index.js";

export const query = async (AWS_MAPPING, serviceName, resourceType, region) => {
  let total = 0;
  const client = new Macie2Client({ region });
  const resources = [];

  for await (const page of paginateListFindings({ client }, {})) {
    resources.push(...(page.findingIds || []));
  }
  updateResourceTypeCounter(
    AWS_MAPPING,
    serviceName,
    resourceType,
    resources.length,
  );
  AWS_MAPPING.total += total;
};
