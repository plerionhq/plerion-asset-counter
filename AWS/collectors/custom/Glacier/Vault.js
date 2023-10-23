import { GlacierClient, paginateListVaults } from "@aws-sdk/client-glacier";

export const queryGlacierVault = async (AWS_MAPPING, serviceName, resourceType, region) => {
  let total = 0;
  let resources = [];
  const client = new GlacierClient({ region });
  for await (const page of paginateListVaults({ client }, {})) {
    resources.push(...(page.VaultList || []));
  }
  const resourceCount = resources.length;
  total += resourceCount;
  updateResourceTypeCounter(serviceName, resourceType, resourceCount);
  AWS_MAPPING.total += total;
};