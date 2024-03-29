import {
  APIGatewayClient,
  GetStagesCommand,
  paginateGetRestApis,
} from "@aws-sdk/client-api-gateway";
import { updateResourceTypeCounter } from "../../../utils/index.js";

export const query = async (AWS_MAPPING, serviceName, resourceType, region) => {
  let total = 0;
  const client = new APIGatewayClient({ region });
  const resources = [];
  for await (const page of paginateGetRestApis({ client }, {})) {
    resources.push(...(page.items || []));
  }
  for await (const apis of resources) {
    const command = new GetStagesCommand({
      restApiId: apis.id,
    });
    const response = await client?.send(command);
    const stageCount = response?.item.length;
    total += stageCount;
    updateResourceTypeCounter(
      AWS_MAPPING,
      serviceName,
      resourceType,
      stageCount,
    );
  }
  AWS_MAPPING.total += total;
};
