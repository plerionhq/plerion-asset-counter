import { paginateListIdentityProviderConfigs } from "@aws-sdk/client-eks";
import { countPerCluster } from "./perCluster.js";

export const query = (AWS_MAPPING, serviceName, resourceType, region) =>
  countPerCluster(
    AWS_MAPPING,
    serviceName,
    resourceType,
    region,
    paginateListIdentityProviderConfigs,
    "identityProviderConfigs",
  );
