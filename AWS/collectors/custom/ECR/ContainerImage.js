import {
  ECRClient,
  paginateDescribeRepositories,
  paginateDescribeImages,
} from "@aws-sdk/client-ecr";
import { updateResourceTypeCounter } from "../../../utils/index.js";

export const query = async (AWS_MAPPING, serviceName, resourceType, region) => {
  const client = new ECRClient({ region });
  let total = 0;
  const repositories = [];
  for await (const page of paginateDescribeRepositories(
    { client },
    { maxResults: 1000 },
  )) {
    if (page.repositories) {
      for (const repository of page.repositories) {
        repositories.push({ ...repository });
      }
    }
  }

  for (const repository of repositories) {
    if (
      !repository.repositoryName ||
      !repository.repositoryArn ||
      !repository.repositoryUri
    ) {
      continue;
    }
    const images = [];
    for await (const page of paginateDescribeImages(
      { client },
      { repositoryName: repository.repositoryName, maxResults: 1000 },
    )) {
      if (page.imageDetails) {
        for (const image of page.imageDetails) {
          images.push({
            ...image,
            ImageId: `${repository.repositoryUri}:${image.imageDigest}`,
            ImageName: `${repository.repositoryName}:${image.imageDigest}`,
          });
        }
      }
    }

    if (!images.length) {
      continue;
    }

    total += images.length;
    updateResourceTypeCounter(
      AWS_MAPPING,
      serviceName,
      resourceType,
      images.length,
    );
  }
  AWS_MAPPING.total += total;
};
