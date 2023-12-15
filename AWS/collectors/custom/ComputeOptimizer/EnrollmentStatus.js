import {
  ComputeOptimizerClient,
  GetEnrollmentStatusCommand,
} from "@aws-sdk/client-compute-optimizer";
import { updateResourceTypeCounter } from "../../../utils/index.js";

export const query = async (AWS_MAPPING, serviceName, resourceType, region) => {
  let total = 0;
  const client = new ComputeOptimizerClient({ region });
  const resources = [];
  const command = new GetEnrollmentStatusCommand({});
  const response = await client.send(command);
  resources.push({ ...(response || {}) });
  updateResourceTypeCounter(
    AWS_MAPPING,
    serviceName,
    resourceType,
    resources.length,
  );
  total += resources.length;
  AWS_MAPPING.total += total;
};
