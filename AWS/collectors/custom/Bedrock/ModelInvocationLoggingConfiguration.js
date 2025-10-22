import {
  BedrockClient,
  GetModelInvocationLoggingConfigurationCommand,
} from "@aws-sdk/client-bedrock";
import { updateResourceTypeCounter } from "../../../utils/index.js";

export const query = async (AWS_MAPPING, serviceName, resourceType, region) => {
  const client = new BedrockClient({ region });
  const getModelInvocationLoggingConfigurationCommand =
    new GetModelInvocationLoggingConfigurationCommand({});
  const response = await client.send(
    getModelInvocationLoggingConfigurationCommand
  );
  const { loggingConfig } = response;
  const data = loggingConfig ? [loggingConfig] : [];
  const resourceCount = data.length;
  updateResourceTypeCounter(
    AWS_MAPPING,
    serviceName,
    resourceType,
    resourceCount,
  );
  AWS_MAPPING.total += resourceCount;
};
