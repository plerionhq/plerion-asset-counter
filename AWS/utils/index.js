export const getNextPageTokenKeyFromResponse = (response, paginationKey) => {
  const responseKeys = Object.keys(response);
  return responseKeys.find(
    (k) => k.toLowerCase() === paginationKey.toLowerCase(),
  );
};

export const getNextListPageTokenKey = (list) => {
  const { action: listAction } = list;
  const { paginationToken } = listAction;
  if (paginationToken) {
    return paginationToken;
  }
  return "NextToken";
};

export const getNextListPageTokenRequestKey = (
  nextPageTokenResponseKey,
  list,
) => {
  const { action: listAction } = list;
  const { nextPageTokenKey } = listAction;
  if (nextPageTokenKey) {
    return nextPageTokenKey;
  }
  return nextPageTokenResponseKey;
};

export const updateResourceTypeCounter = (
  AWS_MAPPING,
  serviceName,
  resourceType,
  value,
) => {
  if (AWS_MAPPING[serviceName] === undefined) {
    AWS_MAPPING[serviceName] = { [resourceType]: value };
  } else if (AWS_MAPPING[serviceName][resourceType] === undefined) {
    AWS_MAPPING[serviceName][resourceType] = value;
  } else {
    AWS_MAPPING[serviceName][resourceType] += value;
  }
};
