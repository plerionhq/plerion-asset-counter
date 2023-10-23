import { EC2Client, paginateDescribeFpgaImages, paginateDescribeImages } from "@aws-sdk/client-ec2";

export const queryEc2Ami = async (AWS_MAPPING, serviceName, resourceType, region) => {
  const client = new EC2Client({ region });
  let resources = [];
  for await (const image of paginateDescribeImages(
    { client },
    { Owners: ["self"] }
  )) {
    const { Images: images } = image;
    resources.push(...(images || []));
  }
  updateResourceTypeCounter(serviceName, resourceType, resources.length);
  AWS_MAPPING.total += resources.length;
};

export const queryEc2fpga = async (AWS_MAPPING, serviceName, resourceType, region) => {
  const client = new EC2Client({ region });
  let resources = [];
  for await (const image of paginateDescribeFpgaImages(
    { client },
    { Owners: ["self"] }
  )) {
    const { FpgaImages: images } = image;
    resources.push(...(images || []));
  }
  updateResourceTypeCounter(serviceName, resourceType, resources.length);
  AWS_MAPPING.total += resources.length;
};

