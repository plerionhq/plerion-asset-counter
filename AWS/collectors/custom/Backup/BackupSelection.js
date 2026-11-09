import {
  BackupClient,
  paginateListBackupPlans,
  paginateListBackupSelections,
} from "@aws-sdk/client-backup";
import { updateResourceTypeCounter } from "../../../utils/index.js";

// Selections hang off a plan: AWS Backup has no account-wide list. List the
// plans, then each plan's selections.
export const query = async (AWS_MAPPING, serviceName, resourceType, region) => {
  const client = new BackupClient({ region });
  const planIds = [];
  for await (const page of paginateListBackupPlans({ client }, {})) {
    for (const plan of page.BackupPlansList || []) {
      if (plan.BackupPlanId) {
        planIds.push(plan.BackupPlanId);
      }
    }
  }
  let resourceCount = 0;
  for (const BackupPlanId of planIds) {
    for await (const page of paginateListBackupSelections(
      { client },
      { BackupPlanId },
    )) {
      resourceCount += (page.BackupSelectionsList || []).length;
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
