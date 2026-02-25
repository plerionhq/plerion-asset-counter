import {
  BedrockAgentClient,
  paginateListFlows,
} from "@aws-sdk/client-bedrock-agent";
import { updateResourceTypeCounter } from "../../../utils/index.js";

export const query = async (AWS_MAPPING, serviceName, resourceType, region) => {
  let resources = [];
  const client = new BedrockAgentClient({ region });
  for await (const page of paginateListFlows({ client }, {})) {
    resources.push(...(page.flowSummaries || []));
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
