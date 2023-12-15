import { paginateListDocuments, SSMClient } from "@aws-sdk/client-ssm";
import { updateResourceTypeCounter } from "../../../utils/index.js";

export const query = async (AWS_MAPPING, serviceName, resourceType, region) => {
  let resources = [];
  const client = new SSMClient({ region });
  for await (const document of paginateListDocuments(
    { client },
    {
      MaxResults: 50,
      DocumentFilterList: [
        {
          key: "Owner",
          value: "self",
        },
      ],
    },
  )) {
    const { DocumentIdentifiers: documentIdentifiers } = document;
    resources.push(...(documentIdentifiers || []));
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
