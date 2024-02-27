
import { AutoScalingClient, DescribeAutoScalingGroupsCommand } from "@aws-sdk/client-auto-scaling";
import { EC2Client, DescribeInstancesCommand } from "@aws-sdk/client-ec2";
import { updateResourceTypeCounter, batchArray } from "../../../utils/index.js";

export const query = async (AWS_MAPPING, serviceName, resourceType, region) => {
  let total = 0;

  try {
    const asgClient = new AutoScalingClient({ region });
    const ec2Client = new EC2Client({ region });

    let nextToken = null;
    let allAsg = [];

    do {
      const command = new DescribeAutoScalingGroupsCommand({
        NextToken: nextToken,
      });
      const response = await asgClient.send(command);
      allAsg = allAsg.concat(response.AutoScalingGroups);
      nextToken = response.NextToken;
    } while(nextToken);

    total += allAsg.length;
    updateResourceTypeCounter(
      AWS_MAPPING,
      serviceName,
      resourceType,
      { cspmUnits: allAsg.length },
    );

    const asgEc2Map = allAsg.reduce((map, autoScalingGroup) => {
      const asgArn = autoScalingGroup.AutoScalingGroupARN;
      map[asgArn] = autoScalingGroup.Instances.map(instance => instance.InstanceId);
      return map;
    }, {});

    const instances = Object.values(asgEc2Map).reduce((ec2List, asgEc2s) => {
      return ec2List.concat(asgEc2s);
    }, []);

    // Get AMI for all ASG instances
    const ec2AmiMap = await batchArray(instances, 10).reduce(async (map, instanceIds) => {
      const command = new DescribeInstancesCommand({
        InstanceIds: instanceIds,
      });
      const data = await ec2Client.send(command);
      const instances = data.Reservations.map(reservation => reservation.Instances).flat();
      return instances.reduce((instanceAmiMap, instance) => {
        instanceAmiMap[instance.InstanceId] = instance.ImageId;
        return instanceAmiMap;
      }, map)
    }, {});

    // Find Distinct AMI scanned per ASG and set it CWPP units
    Object.values(asgEc2Map).forEach((asgInstances) => {
      const amiScanned = [...new Set(asgInstances.map(instance => ec2AmiMap[instance]))];
      updateResourceTypeCounter(
        AWS_MAPPING,
        serviceName,
        resourceType,
        { cwppUnits: amiScanned.length },
      );
      total += amiScanned.length;
    });
  } catch(error) {
    console.log(`Error finding ${resourceType}`);
  }
  AWS_MAPPING.total += total;
};
