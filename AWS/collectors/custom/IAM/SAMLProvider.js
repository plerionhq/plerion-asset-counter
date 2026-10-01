import { IAMClient, ListSAMLProvidersCommand } from "@aws-sdk/client-iam";
import { updateResourceTypeCounter } from "../../../utils/index.js";

export const query = async (AWS_MAPPING, serviceName, resourceType, region) => {
  const client = new IAMClient({ region });
  const response = await client.send(new ListSAMLProvidersCommand({}));
  const resourceCount = (response.SAMLProviderList || []).length;
  updateResourceTypeCounter(
    AWS_MAPPING,
    serviceName,
    resourceType,
    resourceCount,
  );
  AWS_MAPPING.total += resourceCount;
};
