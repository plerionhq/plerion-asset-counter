import { ApplicationAutoScalingClient, DescribeScalableTargetsCommand } from "@aws-sdk/client-application-auto-scaling";

export const queryScalableTargets = async (AWS_MAPPING, serviceName, resourceType, region) => {
  const aasClient = new ApplicationAutoScalingClient({ region });
  let total = 0;
  let aasNextToken;
  do {
    const describeScalableTargets = new DescribeScalableTargetsCommand({
      NextToken: aasNextToken,
      ServiceNamespace: "dynamodb"
    });
    const response = await aasClient.send(describeScalableTargets);
    if (response && response.ScalableTargets) {
      const scalableTargetsCount = response.ScalableTargets.length || 0;
      total += scalableTargetsCount;
      updateResourceTypeCounter(
        serviceName,
        resourceType,
        scalableTargetsCount
      );
      aasNextToken = response.NextToken;
    }
  } while (aasNextToken);
  AWS_MAPPING.total += total;
};