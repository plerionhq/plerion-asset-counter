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
  const service = AWS_MAPPING[serviceName] || {};
  const updatedCount = updateCount(service[resourceType] || (isInteger(value) ? 0 : {}), value);

  AWS_MAPPING[serviceName] = {
    ...(AWS_MAPPING[serviceName] || {}),
    [resourceType]: updatedCount,
  };
};

const updateCount = (currentValue, increment) => {
  if (isInteger(increment)) {
    return currentValue + increment;
  } else {
    let updatedValue = { ...currentValue };
    for (const [key, value] of Object.entries(increment)) {
      updatedValue[key] = (updatedValue[key] || 0) + value;
    }
    return updatedValue;
  }
};

const isInteger = (input) => (typeof input === 'number' && Number.isInteger(input))

export const batchArray = (array, batchSize) => {
  const batchedArray = [];
  for (let i = 0; i < array.length; i += batchSize) {
    batchedArray.push(array.slice(i, i + batchSize));
  }
  return batchedArray;
}
