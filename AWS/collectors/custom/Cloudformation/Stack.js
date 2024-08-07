import {
  CloudFormationClient,
  paginateListStacks,
  StackStatus,
} from "@aws-sdk/client-cloudformation";
import { updateResourceTypeCounter } from "../../../utils/index.js";

const { CREATE_FAILED, DELETE_COMPLETE, ...STACK_STATUS_TO_COLLECT } =
  StackStatus;

export const query = async (AWS_MAPPING, serviceName, resourceType, region) => {
  let total = 0;
  const resources = [];
  const client = new CloudFormationClient({ region });
  for await (const page of paginateListStacks({ client }, {
    StackStatusFilter: Object.values(STACK_STATUS_TO_COLLECT),
  })) {
    resources.push(...(page.StackSummaries || []));
  }
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
