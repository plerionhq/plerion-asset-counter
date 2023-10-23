import { ComputeOptimizerClient, GetEnrollmentStatusCommand } from "@aws-sdk/client-compute-optimizer";

const queryComputeOptimizerEnrollmentStatus = async (
  serviceName,
  resourceType,
  region
) => {
  let total = 0;
  const client = new ComputeOptimizerClient({ region });
  const resources = [];
  const command = new GetEnrollmentStatusCommand({});
  const response = await client.send(command);
  resources.push({ ...(response || {}) });
  updateResourceTypeCounter(serviceName, resourceType, resources.length);
  total += resources.length;
  AWS_MAPPING.total += total;
};

