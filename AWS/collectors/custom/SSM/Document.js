import { paginateListDocuments, SSMClient } from "@aws-sdk/client-ssm";

export const querySSMDocument = async (AWS_MAPPING, serviceName, resourceType, region) => {
  let resources = [];
  const client = new SSMClient({ region });
  for await (const document of paginateListDocuments(
    { client: this.client },
    {
      MaxResults: 50,
      DocumentFilterList: [
        {
          key: "Owner",
          value: "self"
        }
      ]
    }
  )) {
    const { DocumentIdentifiers: documentIdentifiers } = document;
    resources.push(...(documentIdentifiers || []));
  }
  const resourceCount = resources.length;
  updateResourceTypeCounter(serviceName, resourceType, resourceCount);
  AWS_MAPPING.total += resourceCount;
};
