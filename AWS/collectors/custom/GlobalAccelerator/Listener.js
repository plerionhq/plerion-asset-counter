import {
  GlobalAcceleratorClient,
  paginateListAccelerators,
  paginateListListeners,
} from "@aws-sdk/client-global-accelerator";
import { updateResourceTypeCounter } from "../../../utils/index.js";

// Listeners are listed per accelerator; there is no call across accelerators.
export const query = async (AWS_MAPPING, serviceName, resourceType, region) => {
  const client = new GlobalAcceleratorClient({ region });
  let resourceCount = 0;
  for await (const { Accelerators = [] } of paginateListAccelerators(
    { client },
    {},
  )) {
    for (const { AcceleratorArn } of Accelerators) {
      for await (const page of paginateListListeners(
        { client },
        { AcceleratorArn },
      )) {
        resourceCount += page.Listeners?.length ?? 0;
      }
    }
  }
  updateResourceTypeCounter(
    AWS_MAPPING,
    serviceName,
    resourceType,
    resourceCount,
  );
  AWS_MAPPING.total += resourceCount;
};
