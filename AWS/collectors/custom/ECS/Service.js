import {
  ECSClient,
  ListServicesCommand,
  paginateListClusters,
} from "@aws-sdk/client-ecs";
import { updateResourceTypeCounter } from "../../../utils/index.js";

export const query = async (AWS_MAPPING, serviceName, resourceType, region) => {
  let total = 0;
  const client = new ECSClient({ region });
  const resources = [];
  for await (const page of paginateListClusters({ client }, {})) {
    resources.push(...(page.clusterArns || []));
  }

  for await (const clusterArn of resources) {
    const command = new ListServicesCommand({
      cluster: clusterArn,
    });
    const response = await client?.send(command);
    const serviceCount = response?.serviceArns.length;
    total += serviceCount;
    updateResourceTypeCounter(
      AWS_MAPPING,
      serviceName,
      resourceType,
      serviceCount,
    );
  }
  AWS_MAPPING.total += total;
};
