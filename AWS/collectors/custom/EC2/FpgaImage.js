import { EC2Client, paginateDescribeFpgaImages } from "@aws-sdk/client-ec2";
import { updateResourceTypeCounter } from "../../../utils/index.js";

export const query = async (AWS_MAPPING, serviceName, resourceType, region) => {
  const client = new EC2Client({ region });
  let resources = [];
  for await (const image of paginateDescribeFpgaImages(
    { client },
    { Owners: ["self"] },
  )) {
    const { FpgaImages: images } = image;
    resources.push(...(images || []));
  }
  updateResourceTypeCounter(
    AWS_MAPPING,
    serviceName,
    resourceType,
    resources.length,
  );
  AWS_MAPPING.total += resources.length;
};
