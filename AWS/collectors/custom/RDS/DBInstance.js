import { RDSClient, paginateDescribeDBInstances } from "@aws-sdk/client-rds";
import { updateResourceTypeCounter } from "../../../utils/index.js";

export const query = async (AWS_MAPPING, serviceName, resourceType, region) => {
  let resources = [];
  const client = new RDSClient({ region });
  for await (const page of paginateDescribeDBInstances(
    { client },
    {
      Filters: [
        {
          Name: "engine",
          Values: [
            'aurora-mysql',
            'aurora-postgresql',
            'mariadb',
            'mysql',
            'oracle-ee',
            'oracle-ee-cdb',
            'oracle-se2',
            'oracle-se2-cdb',
            'postgres',
            'sqlserver-ee',
            'sqlserver-ex',
            'sqlserver-se',
            'sqlserver-web',
          ],
        },
      ],
    },
  )) {
    resources.push(...(page.DBInstances || []));
  }
  const resourceCount = resources.length;
  updateResourceTypeCounter(
    AWS_MAPPING,
    serviceName,
    resourceType,
    resourceCount,
  );
  AWS_MAPPING.total += resourceCount;
};
