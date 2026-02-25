import {
  BedrockAgentClient,
  paginateListKnowledgeBases,
  paginateListDataSources,
} from "@aws-sdk/client-bedrock-agent";
import { updateResourceTypeCounter } from "../../../utils/index.js";

export const query = async (AWS_MAPPING, serviceName, resourceType, region) => {
  let resources = [];
  const client = new BedrockAgentClient({ region });
  for await (const { knowledgeBaseSummaries } of paginateListKnowledgeBases(
    { client },
    {},
  )) {
    for (const kb of knowledgeBaseSummaries || []) {
      for await (const { dataSourceSummaries } of paginateListDataSources(
        { client },
        { knowledgeBaseId: kb.knowledgeBaseId },
      )) {
        resources.push(...(dataSourceSummaries || []));
      }
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
