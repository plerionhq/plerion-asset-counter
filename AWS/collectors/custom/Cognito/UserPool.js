import {
  CognitoIdentityProviderClient,
  paginateListUserPools,
} from "@aws-sdk/client-cognito-identity-provider";
import { updateResourceTypeCounter } from "../../../utils/index.js";

export const query = async (AWS_MAPPING, serviceName, resourceType, region) => {
  let resources = [];
  const client = new CognitoIdentityProviderClient({ region });
  for await (const page of paginateListUserPools(
    { client },
    { MaxResults: 60 },
  )) {
    resources.push(...(page.UserPools || []));
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
