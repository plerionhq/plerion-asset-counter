import {
  BedrockAgentRuntimeClient,
  paginateListSessions,
} from "@aws-sdk/client-bedrock-agent-runtime";
import { updateResourceTypeCounter } from "../../../utils/index.js";

export const query = async (AWS_MAPPING, serviceName, resourceType, region) => {
  let resources = [];
  const client = new BedrockAgentRuntimeClient({ region });
  for await (const page of paginateListSessions({ client }, {})) {
    resources.push(...(page.sessionSummaries || []));
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
