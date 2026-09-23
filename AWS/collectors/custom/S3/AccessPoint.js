import {
  ListAccessPointsCommand,
  S3ControlClient,
} from "@aws-sdk/client-s3-control";
import { getAWSAccountId } from "../../../service/index.js";
import { updateResourceTypeCounter } from "../../../utils/index.js";

export const query = async (AWS_MAPPING, serviceName, resourceType, region) => {
  const client = new S3ControlClient({ region });
  const accountId = await getAWSAccountId();
  const resources = [];
  let nextToken;
  do {
    const command = new ListAccessPointsCommand({
      AccountId: accountId,
      NextToken: nextToken,
    });
    const response = await client.send(command);
    resources.push(...(response.AccessPointList || []));
    nextToken = response.NextToken;
  } while (nextToken);
  const resourceCount = resources.length;
  updateResourceTypeCounter(
    AWS_MAPPING,
    serviceName,
    resourceType,
    resourceCount,
  );
  AWS_MAPPING.total += resourceCount;
};
