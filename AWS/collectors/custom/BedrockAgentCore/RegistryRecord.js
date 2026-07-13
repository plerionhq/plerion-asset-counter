import {
  BedrockAgentCoreControlClient,
  paginateListRegistries,
  paginateListRegistryRecords,
} from "@aws-sdk/client-bedrock-agentcore-control";
import { updateResourceTypeCounter } from "../../../utils/index.js";

// RegistryRecord is a sub-resource of Registry: list all registries, then
// list records per registry and flatten (mirrors service-collector's
// RegistryRecord collector).
export const query = async (AWS_MAPPING, serviceName, resourceType, region) => {
  const client = new BedrockAgentCoreControlClient({ region });
  const registries = [];
  for await (const page of paginateListRegistries({ client }, {})) {
    registries.push(...(page.registries || []));
  }
  let resources = [];
  for (const registry of registries) {
    if (!registry.registryId) {
      continue;
    }
    for await (const page of paginateListRegistryRecords(
      { client },
      { registryId: registry.registryId },
    )) {
      resources.push(...(page.registryRecords || []));
    }
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
