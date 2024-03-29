import {
  ApiGatewayV2Client,
  GetApisCommand,
} from "@aws-sdk/client-apigatewayv2";
import { updateResourceTypeCounter } from "../../../utils/index.js";

export const query = async (AWS_MAPPING, serviceName, resourceType, region) => {
  let total = 0;
  const resources = [];
  const client = new ApiGatewayV2Client({ region });
  let nextToken;
  do {
    const command = new GetApisCommand({
      NextToken: nextToken,
    });
    const response = await client.send(command);
    resources.push(...(response.Items || []));
    nextToken = response.NextToken;
  } while (nextToken);
  const resourceCount = resources.length;
  updateResourceTypeCounter(
    AWS_MAPPING,
    serviceName,
    resourceType,
    resourceCount,
  );
  total += resources.length;
  AWS_MAPPING.total += total;
};
