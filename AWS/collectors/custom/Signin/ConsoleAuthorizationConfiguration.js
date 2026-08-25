import {
  GetConsoleAuthorizationConfigurationCommand,
  SigninClient,
} from "@aws-sdk/client-signin";
import { updateResourceTypeCounter } from "../../../utils/index.js";

// ConsoleAuthorizationConfiguration is an account-level setting, not a listable resource: every
// account has exactly one, whether or not it has been configured. Every region answers the same
// question for the same account, so collecting from one region is enough — there is no List
// operation. GetConsoleAuthorizationConfiguration throws ResourceNotFoundException when the
// account has never configured it; that is a STATE of the resource (unconfigured), not its
// absence, so it still counts as 1. Any other error is rethrown so a permissions or throttling
// failure surfaces instead of being silently scored as a real count.
export const query = async (AWS_MAPPING, serviceName, resourceType, region) => {
  const client = new SigninClient({ region });
  let resourceCount = 0;
  try {
    await client.send(new GetConsoleAuthorizationConfigurationCommand({}));
    resourceCount = 1;
  } catch (err) {
    if (err.name === "ResourceNotFoundException") {
      resourceCount = 1;
    } else {
      console.log(
        `Signin ConsoleAuthorizationConfiguration error: ${err.name}`,
      );
      throw err;
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
