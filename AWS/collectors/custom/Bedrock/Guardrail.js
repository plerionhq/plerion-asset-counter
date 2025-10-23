import { BedrockClient, paginateListGuardrails } from "@aws-sdk/client-bedrock";
import { updateResourceTypeCounter } from "../../../utils/index.js";

export const query = async (AWS_MAPPING, serviceName, resourceType, region) => {
  let resources = [];
  const client = new BedrockClient({ region });
  for await (const page of paginateListGuardrails({ client }, {})) {
    resources.push(...(page.guardrails || []));
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
