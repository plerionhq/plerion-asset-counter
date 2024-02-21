import { EC2Client, paginateDescribeInstances } from "@aws-sdk/client-ec2";
import { updateResourceTypeCounter } from "../../../utils/index.js";

export const query = async (AWS_MAPPING, serviceName, resourceType, region) => {
  let total = 0;
  let resources = [];
  const isInstanceFromAutoScaleGroup = (instance) => {
    return !!instance?.Tags?.find(
      (tag) => tag.Key === "aws:autoscaling:groupName",
    );
  };
  const isInstanceTerminated = (instance) => {
    return instance?.State?.Code === 48;
  };
  try {
    const client = new EC2Client({ region });
    for await (const page of paginateDescribeInstances({ client }, {})) {
      if (page.Reservations) {
        resources.push(
          ...(page.Reservations.map(
            (reservation) => reservation.Instances,
          ).flat() || []),
        );
      }
    }
    const nonTerminatedInstances = resources.filter(
      (instance) => !isInstanceTerminated(instance));
    const asgInstances =  nonTerminatedInstances.filter(
        (instance) =>
          isInstanceFromAutoScaleGroup(instance)
      );
    const groupedAsgAmi = asgInstances.reduce((asgAmiGroup, instance) => {
        const asgName = instance.Tags.find((tag)=> tag.Key === "aws:autoscaling:groupName").Value;
        const imageId = instance.ImageId;
        if(asgAmiGroup[asgName]) {
          asgAmiGroup[asgName] = {};
        }
        asgAmiGroup[asgName][imageId] = true
        return asgAmiGroup;
      });

    const amiScannedPerAsg = Object.keys(groupedAsgAmi).map((asgName) => Object.keys(groupedAsgAmi[asgName]).length);
    const totalEc2ScannedForAsg = amiScannedPerAsg.reduce((accumulator, currentValue) => accumulator + currentValue, 0);
    const ec2InstancesCount = (nonTerminatedInstances.length - asgInstances.length) + totalEc2ScannedForAsg;
    total += ec2InstancesCount;
    updateResourceTypeCounter(
      AWS_MAPPING,
      serviceName,
      resourceType,
      ec2InstancesCount,
    );
  } catch (err) {
    console.log(`Error finding ${resourceType}`);
  }
  AWS_MAPPING.total += total;
};
