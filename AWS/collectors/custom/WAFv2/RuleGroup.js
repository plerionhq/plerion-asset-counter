import { ListRuleGroupsCommand, WAFV2Client } from "@aws-sdk/client-wafv2";
import { paginate } from "../../../service/index.js";
import { updateResourceTypeCounter } from "../../../utils/index.js";

export const query = async (AWS_MAPPING, serviceName, resourceType, region) => {
  let total = 0;
  const client = new WAFV2Client({ region });
  const responseForRegional = await paginate({
    client,
    command: {
      CommandClass: ListRuleGroupsCommand,
      params: {
        Scope: "REGIONAL",
      },
    },
    nextKey: "NextMarker",
    responseKey: "RuleGroups",
  });

  // CLOUDFRONT only supported for us-east-1
  let responseForCloudfront;
  if (region === "us-east-1") {
    responseForCloudfront = await paginate({
      client,
      command: {
        CommandClass: ListRuleGroupsCommand,
        params: {
          Scope: "CLOUDFRONT",
        },
      },
      nextKey: "NextMarker",
      responseKey: "RuleGroups",
    });
  }

  const data = [];
  if (responseForRegional.RuleGroups)
    data.push(...responseForRegional.RuleGroups);

  if (responseForCloudfront.RuleGroups)
    data.push(...responseForCloudfront.RuleGroups);
  const resourceCount = data.length;
  total += resourceCount;
  updateResourceTypeCounter(serviceName, resourceType, resourceCount);
  AWS_MAPPING.total += total;
};
