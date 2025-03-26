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

    // sort by latest pushed images
    const latestPushedImages = images.sort((a, b) => {
      const aTime = a.imagePushedAt
        ? new Date(a.imagePushedAt).getTime()
        : -Infinity;
      const bTime = b.imagePushedAt
        ? new Date(b.imagePushedAt).getTime()
        : -Infinity;
      return bTime - aTime;
    });

    const latestPushedImage = latestPushedImages[0];
    // get the two latest pulled images by date
    const latestPullImages = images
      .filter(
        (image) =>
          image.ImageId !== latestPushedImage.ImageId &&
          !!image.lastRecordedPullTime,
      )
      .sort((a, b) => {
        const aTime = a.lastRecordedPullTime
          ? new Date(a.lastRecordedPullTime).getTime()
          : -Infinity;
        const bTime = b.lastRecordedPullTime
          ? new Date(b.lastRecordedPullTime).getTime()
          : -Infinity;
        return bTime - aTime;
      })
      .slice(0, 2);
    const addedImageIds = new Set([
      latestPushedImage.ImageId,
      ...latestPullImages.map(({ ImageId }) => ImageId),
    ]);
    const remainingIds = 3 - addedImageIds.size;
    const repoCount = [
      latestPushedImage,
      ...latestPullImages,
      ...latestPushedImages
        .filter((image) => !addedImageIds.has(image.ImageId))
        .slice(0, remainingIds),
    ].length;
    total += repoCount;
    updateResourceTypeCounter(
      AWS_MAPPING,
      serviceName,
      resourceType,
      repoCount,
    );
  }
  AWS_MAPPING.total += total;
};
