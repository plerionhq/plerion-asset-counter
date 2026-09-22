import {
  S3ControlClient,
  paginateListMultiRegionAccessPoints,
} from "@aws-sdk/client-s3-control";
import { getAWSAccountId } from "../../../service/index.js";
import { updateResourceTypeCounter } from "../../../utils/index.js";

// The Multi-Region Access Point control plane is only served out of US West (Oregon) — any other
// region throws PermanentRedirect. The S3 service entry this resource is registered under
// (aws-services.json) iterates regions=["us-east-1"], so the client intentionally ignores the
// per-loop `region` argument below and always targets us-west-2; `region` stays in the signature
// per the playbook's required 4-arg `query` shape.
// eslint-disable-next-line no-unused-vars
export const query = async (AWS_MAPPING, serviceName, resourceType, region) => {
  let resources = [];
  const client = new S3ControlClient({ region: "us-west-2" });
  const accountId = await getAWSAccountId();
  for await (const page of paginateListMultiRegionAccessPoints(
    { client },
    { AccountId: accountId },
  )) {
    resources.push(...(page.AccessPoints || []));
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
