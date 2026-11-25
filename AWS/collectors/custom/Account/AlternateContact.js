import {
  AccountClient,
  GetAlternateContactCommand,
} from "@aws-sdk/client-account";
import { updateResourceTypeCounter } from "../../../utils/index.js";

// Alternate contacts are an account-level setting: every account has exactly one
// AWS::Account::AlternateContact resource, whether or not any contact is set. The account
// API is global, so one region is enough. ResourceNotFoundException means the SECURITY
// contact is not set; that is a state of the resource, so it still counts as 1. Any other
// error is rethrown so a permissions or throttling failure surfaces.
export const query = async (AWS_MAPPING, serviceName, resourceType, region) => {
  const client = new AccountClient({ region });
  let resourceCount = 0;
  try {
    await client.send(
      new GetAlternateContactCommand({ AlternateContactType: "SECURITY" }),
    );
    resourceCount = 1;
  } catch (err) {
    if (err.name === "ResourceNotFoundException") {
      resourceCount = 1;
    } else {
      console.log(`Account AlternateContact error: ${err.name}`);
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
