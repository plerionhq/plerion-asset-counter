import {
  SageMakerClient,
  paginateListModelPackages,
  paginateListModelPackageGroups,
} from "@aws-sdk/client-sagemaker";
import { updateResourceTypeCounter } from "../../../utils/index.js";

export const query = async (AWS_MAPPING, serviceName, resourceType, region) => {
  let resources = [];
  const client = new SageMakerClient({ region });

  for await (const { ModelPackageSummaryList } of paginateListModelPackages(
    { client },
    { ModelApprovalStatus: "Approved" }
  )) {
    resources.push(...(ModelPackageSummaryList || []));
  }

  const groups = [];
  for await (const { ModelPackageGroupSummaryList } of
    paginateListModelPackageGroups({ client }, {})) {
    for (const group of ModelPackageGroupSummaryList || []) {
      if (group.ModelPackageGroupName) {
        groups.push(group.ModelPackageGroupName);
      }
    }
  }

  for (const groupName of groups) {
    for await (const { ModelPackageSummaryList } of paginateListModelPackages(
      { client },
      { ModelPackageGroupName: groupName, ModelApprovalStatus: "Approved" }
    )) {
      resources.push(...(ModelPackageSummaryList || []));
    }
  }

  const resourceCount = resources.length;
  updateResourceTypeCounter(
    AWS_MAPPING,
    serviceName,
    resourceType,
    resourceCount,
  );
  AWS_MAPPING.total += resourceCount;
};
