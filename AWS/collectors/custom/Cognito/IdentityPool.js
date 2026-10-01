import {
  CognitoIdentityClient,
  paginateListIdentityPools,
} from "@aws-sdk/client-cognito-identity";
import { updateResourceTypeCounter } from "../../../utils/index.js";

export const query = async (AWS_MAPPING, serviceName, resourceType, region) => {
  const resources = [];
  const client = new CognitoIdentityClient({ region });
  for await (const page of paginateListIdentityPools(
    { client, pageSize: 60 },
    { MaxResults: 60 },
  )) {
    resources.push(...(page.IdentityPools || []));
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
