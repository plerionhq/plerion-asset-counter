import { paginateDescribeDBClusterSnapshots, RDSClient } from "@aws-sdk/client-rds";

export const queryRDSClusterSnapshot = async (AWS_MAPPING, serviceName, resourceType, region) => {
  let resources = [];
  const client = new RDSClient({ region });
  for await (const page of paginateDescribeDBClusterSnapshots(
    { client },
    {
      Filters: [
        {
          Name: "engine",
          Values: [
            "aurora-mysql",
            "custom-sqlserver-ee",
            "custom-sqlserver-se",
            "custom-sqlserver-web",
            "aurora-postgresql",
            "mariadb",
            "mysql",
            "oracle-ee",
            "oracle-ee-cdb",
            "oracle-se2",
            "oracle-se2-cdb",
            "aurora",
            "postgres",
            "sqlserver-ee",
            "sqlserver-ex",
            "sqlserver-se",
            "sqlserver-web"
          ]
        }
      ]
    }
  )) {
    resources.push(...(page.DBClusterSnapshots || []));
  }
  const resourceCount = resources.length;
  updateResourceTypeCounter(serviceName, resourceType, resourceCount);
  AWS_MAPPING.total += resourceCount;
};