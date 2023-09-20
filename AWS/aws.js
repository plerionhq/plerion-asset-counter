import services from "./aws-services.json" assert { type: "json" };
import dependencies from "./aws-dependencies.json" assert { type: "json" };
import jp from "jsonpath";
import chunks from "lodash.chunk";
import { WAFV2Client, ListRuleGroupsCommand } from "@aws-sdk/client-wafv2";
import {
  ApplicationAutoScalingClient,
  DescribeScalableTargetsCommand,
  paginateDescribeScalingPolicies,
} from "@aws-sdk/client-application-auto-scaling";
import {
  paginateListResources,
  CloudControlClient,
} from "@aws-sdk/client-cloudcontrol";
import {
  EC2Client,
  GetEbsEncryptionByDefaultCommand,
  DescribeSnapshotsCommand,
  DescribeImagesCommand,
  DescribeFpgaImagesCommand,
  paginateDescribeInstances,
} from "@aws-sdk/client-ec2";
import { GlacierClient, paginateListVaults } from "@aws-sdk/client-glacier";
import {
  IAMClient,
  paginateGetAccountAuthorizationDetails,
} from "@aws-sdk/client-iam";
import {
  FirehoseClient,
  ListDeliveryStreamsCommand,
} from "@aws-sdk/client-firehose";
import { KinesisClient, ListStreamsCommand } from "@aws-sdk/client-kinesis";
import { LambdaClient, paginateListFunctions } from "@aws-sdk/client-lambda";
import {
  MemoryDBClient,
  DescribeACLsCommand,
  DescribeClustersCommand,
  DescribeUsersCommand,
} from "@aws-sdk/client-memorydb";
import {
  OrganizationsClient,
  DescribeOrganizationCommand,
  paginateListRoots,
} from "@aws-sdk/client-organizations";
import {
  S3ControlClient,
  GetPublicAccessBlockCommand,
} from "@aws-sdk/client-s3-control";
import { SSMClient, ListDocumentsCommand } from "@aws-sdk/client-ssm";
import {
  APIGatewayClient,
  paginateGetRestApis,
  GetStagesCommand,
} from "@aws-sdk/client-api-gateway";
import {
  ECSClient,
  paginateListClusters,
  ListServicesCommand,
  DescribeServicesCommand,
  DescribeTaskDefinitionCommand,
} from "@aws-sdk/client-ecs";
import {
  DocDBClient,
  paginateDescribeDBInstances,
  paginateDescribeDBClusters,
  paginateDescribeDBClusterParameterGroups as paginateDocDBClusterParameterGroups
} from "@aws-sdk/client-docdb";
import {
  RDSClient,
  paginateDescribeDBInstances as paginateRDSInstances,
  paginateDescribeDBClusters as paginateRDSClusters,
  paginateDescribeDBClusterSnapshots,
} from "@aws-sdk/client-rds";
import {
  NeptuneClient,
  paginateDescribeDBInstances as paginateNeptuneInstances,
  paginateDescribeDBClusterParameterGroups,
} from "@aws-sdk/client-neptune";
import {
  EKSClient,
  paginateListNodegroups,
  paginateListClusters as paginateListEKSClusters,
} from "@aws-sdk/client-eks";
import {
  ComputeOptimizerClient,
  GetEnrollmentStatusCommand,
} from "@aws-sdk/client-compute-optimizer";

import { getAWSAccountId } from "./utils.js";

const AWS_MAPPING = { total: 0 };

const DDB_SCALABLE_TARGET = "AWS::DynamoDB::ScalableTarget";
const EC2_INSTANCE = "AWS::EC2::Instance";
const EC2_DEFAULT_EBS_ENCRYPTION = "AWS::EC2::DefaultEBSEncryption";
const EC2_SNAPSHOT = "AWS::EC2::Snapshot";
const EC2_AMI = "AWS::EC2::AMI";
const EC2_FPGA_IMAGE = "AWS::EC2::FpgaImage";
const GLACIER_VAULT = "AWS::Glacier::Vault";
const IAM_GROUP = "AWS::IAM::Group";
const IAM_ROLE = "AWS::IAM::Role";
const IAM_USER = "AWS::IAM::User";
const IAM_POLICY = "AWS::IAM::Policy";
const KINESIS_FIREHOSE_DELIVERY_STREAM = "AWS::Kinesis::FirehoseDeliveryStream";
const KINESIS_STREAM = "AWS::Kinesis::Stream";
const LAMBDA_FUNCTION = "AWS::Lambda::Function";
const MEMORY_DB_ACL = "AWS::MemoryDB::ACL";
const MEMORY_DB_CLUSTER = "AWS::MemoryDB::Cluster";
const MEMORY_DB_USER = "AWS::MemoryDB::User";
const ORGANIZATIONS_ORGANIZATION = "AWS::Organizations::Organization";
const ORGANIZATIONS_UNIT = "AWS::Organizations::OrganizationalUnit";
const S3CONTROL_BLOCK_PUBLIC_ACCESS = "AWS::S3Control::PublicAccessBlock";
const SSM_DOCUMENT = "AWS::SSM::Document";
const APIGATEWAY_STAGE = "AWS::APIGateway::Stage";
const ECS_SERVICE = "AWS::ECS::Service";
const DOC_DB_INSTANCE = "AWS::DocDB::DBInstance";
const DOC_DB_CLUSTER = "AWS::DocDB::DBCluster";
const DOC_DB_CLUSTER_PARAMETER_GROUP = "AWS::DocDB::DBClusterParameterGroup";
const RDS_DB_INSTANCE = "AWS::RDS::DBInstance";
const RDS_DB_CLUSTER = "AWS::RDS::DBCluster";
const RDS_DB_CLUSTER_SNAPSHOT = "AWS::RDS::DBClusterSnapshot";
const NEPTUNE_DB_INSTANCE = "AWS::Neptune::DBInstance";
const NEPTUNE_DB_CLUSTER_PARAMETER_GROUP =
  "AWS::Neptune::DBClusterParameterGroup";
const ECS_TASK_DEFINITION = "AWS::ECS::TaskDefinition";
const WAF_RULE_GROUP = "AWS::WAFv2::RuleGroup";
const EKS_NODE_GROUP = "AWS::EKS::NodeGroup";
const COMPUTE_OPTIMIZER_ENROLLMENT_STATUS =
  "AWS::ComputeOptimizer::EnrollmentStatus";
const APPLICATION_AUTOSCALING_SCALING_POLICY =
  "AWS::ApplicationAutoScaling::ECSScalingPolicy";

const querySSMDocument = async (serviceName, resourceType, region) => {
  const client = new SSMClient({ region });
  const command = new ListDocumentsCommand({
    DocumentFilterList: [
      {
        key: "Owner",
        value: "self",
      },
    ],
  });
  const response = await client.send(command);
  let total = 0;
  if (response && response.DocumentIdentifiers) {
    total += response.DocumentIdentifiers.length;
    updateResourceTypeCounter(
      serviceName,
      resourceType,
      response.DocumentIdentifiers.length
    );
  }
  AWS_MAPPING.total += total;
};

const queryS3ControlBlockPublicAccess = async (
  serviceName,
  resourceType,
  region
) => {
  const client = new S3ControlClient({ region });
  const command = new GetPublicAccessBlockCommand({
    AccountId: await getAWSAccountId(),
  });
  const response = await client.send(command);
  let total = 0;
  if (response && response.PublicAccessBlockConfiguration) {
    total++;
    updateResourceTypeCounter(serviceName, resourceType, total);
    AWS_MAPPING.total += total;
  }
};

const queryOrganizations = async (serviceName, resourceType, region) => {
  const client = new OrganizationsClient({ region });
  const organization = await client.send(new DescribeOrganizationCommand({}));
  const resources = [];
  const roots = [];
  let total = 0;
  if (
    AWS_MAPPING[serviceName] &&
    AWS_MAPPING[serviceName][resourceType] !== undefined
  ) {
    return;
  }
  // AWS Organization is only counted as a resource for the master account
  if (
    organization &&
    organization.Organization &&
    organization.Organization.MasterAccountId === (await getAWSAccountId())
  ) {
    resources.push(organization.Organization);
    updateResourceTypeCounter(serviceName, resourceType, resources.length);
    total += resources.length;
    for await (const { Roots: rootPage } of paginateListRoots({ client }, {})) {
      roots.push(...(rootPage || []));
    }
    updateResourceTypeCounter(serviceName, resourceType, resources.length);
    total += roots.length;
  }
  AWS_MAPPING.total += total;
};

const queryMemoryDBACL = async (serviceName, resourceType, region) => {
  let total = 0;
  const client = new MemoryDBClient({ region });
  const resources = [];
  let nextToken;
  do {
    const command = new DescribeACLsCommand({
      NextToken: nextToken,
    });
    const response = await client.send(command);
    resources.push(...(response.ACLs || []));
    updateResourceTypeCounter(serviceName, resourceType, resources.length);
    total += resources.length;
    nextToken = response.NextToken;
  } while (nextToken);
  AWS_MAPPING.total += total;
};

const queryMemoryDBCluster = async (serviceName, resourceType, region) => {
  let total = 0;
  const client = new MemoryDBClient({ region });
  const resources = [];
  let nextToken;
  do {
    const command = new DescribeClustersCommand({
      NextToken: nextToken,
    });
    const response = await client.send(command);
    resources.push(...(response.Clusters || []));
    updateResourceTypeCounter(serviceName, resourceType, resources.length);
    total += resources.length;
    nextToken = response.NextToken;
  } while (nextToken);
  AWS_MAPPING.total += total;
};

const queryMemoryDBUser = async (serviceName, resourceType, region) => {
  let total = 0;
  const client = new MemoryDBClient({ region });
  const resources = [];
  let nextToken;
  do {
    const command = new DescribeUsersCommand({
      NextToken: nextToken,
    });
    const response = await client.send(command);
    resources.push(...(response.Users || []));
    updateResourceTypeCounter(serviceName, resourceType, resources.length);
    total += resources.length;
    nextToken = response.NextToken;
  } while (nextToken);
  AWS_MAPPING.total += total;
};

const queryLambdaFunction = async (serviceName, resourceType, region) => {
  let resources = [];
  const client = new LambdaClient({ region });
  for await (const page of paginateListFunctions({ client }, {})) {
    resources.push(...(page.Functions || []));
  }
  const resourceCount = resources.length;
  updateResourceTypeCounter(serviceName, resourceType, resourceCount);
  AWS_MAPPING.total += resourceCount;
};

const queryKinesisStream = async (serviceName, resourceType, region) => {
  let total = 0;
  const client = new KinesisClient({ region });
  const resources = [];
  let hasMoreStreams = false;
  do {
    const command = new ListStreamsCommand({
      ExclusiveStartStreamName:
        resources.length > 0 ? resources[resources.length - 1] : undefined,
    });
    const response = await client.send(command);

    resources.push(...(response.StreamNames || []));
    updateResourceTypeCounter(serviceName, resourceType, resources.length);
    total += resources.length;
    hasMoreStreams = response.HasMoreStreams;
  } while (hasMoreStreams);
  AWS_MAPPING.total += total;
};

const queryKinesisFirehoseDeliveryStream = async (
  serviceName,
  resourceType,
  region
) => {
  let total = 0;
  const client = new FirehoseClient({ region });
  const resources = [];
  let hasMoreDeliveryStreams = false;
  do {
    const command = new ListDeliveryStreamsCommand({
      ExclusiveStartDeliveryStreamName:
        resources.length > 0 ? resources[resources.length - 1] : undefined,
    });
    const response = await client.send(command);

    resources.push(...(response.DeliveryStreamNames || []));
    updateResourceTypeCounter(serviceName, resourceType, resources.length);
    total += resources.length;
    hasMoreDeliveryStreams = response.HasMoreDeliveryStreams;
  } while (hasMoreDeliveryStreams);
  AWS_MAPPING.total += total;
};

const queryIAMAccountAuthorization = async (
  serviceName,
  resourceType,
  region
) => {
  const users = [];
  const groups = [];
  const roles = [];
  const managedPolicies = [];
  if (
    AWS_MAPPING[serviceName] &&
    AWS_MAPPING[serviceName][resourceType] !== undefined
  ) {
    return;
  }
  const client = new IAMClient({ region });
  for await (const page of paginateGetAccountAuthorizationDetails(
    { client },
    {}
  )) {
    if (page.UserDetailList && page.UserDetailList.length) {
      users.push(...(page.UserDetailList || []));
      updateResourceTypeCounter(
        serviceName,
        IAM_USER,
        page.UserDetailList.length
      );
    } else {
      updateResourceTypeCounter(serviceName, IAM_USER, 0);
    }
    if (page.GroupDetailList && page.GroupDetailList.length) {
      groups.push(...(page.GroupDetailList || []));
      updateResourceTypeCounter(
        serviceName,
        IAM_GROUP,
        page.GroupDetailList.length
      );
    } else {
      updateResourceTypeCounter(serviceName, IAM_GROUP, 0);
    }
    if (page.RoleDetailList && page.RoleDetailList.length) {
      roles.push(...(page.RoleDetailList || []));
      updateResourceTypeCounter(
        serviceName,
        IAM_ROLE,
        page.RoleDetailList.length
      );
    } else {
      updateResourceTypeCounter(serviceName, IAM_ROLE, 0);
    }
    if (page.Policies && page.Policies.length) {
      managedPolicies.push(...(page.Policies || []));
      updateResourceTypeCounter(serviceName, IAM_POLICY, page.Policies.length);
    } else {
      updateResourceTypeCounter(serviceName, IAM_POLICY, 0);
    }
  }
  const total =
    users.length + groups.length + roles.length + managedPolicies.length;
  AWS_MAPPING.total += total;
};

const queryGlacierVault = async (serviceName, resourceType, region) => {
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

const queryWafv2RuleGroup = async (serviceName, resourceType, region) => {
  let total = 0;
  const client = new WAFV2Client({ region });
  const commandForRegional = new ListRuleGroupsCommand({
    Scope: "REGIONAL",
  });
  const responseForRegional = await client.send(commandForRegional);

  const commandForCloudfront = new ListRuleGroupsCommand({
    Scope: "CLOUDFRONT",
  });
  const responseForCloudfront = await client.send(commandForCloudfront);

  const data = [];
  if (responseForRegional.RuleGroups)
    data.push(...responseForRegional.RuleGroups);

  if (responseForCloudfront.RuleGroups)
    data.push(...responseForCloudfront.RuleGroups);
  const resourceCount = data.length;
  total += resourceCount;
  updateResourceTypeCounter(serviceName, resourceType, resourceCount);
  AWS_MAPPING.total += total;
};

const queryEc2Ami = async (serviceName, resourceType, region) => {
  const client = new EC2Client({ region });
  const command = new DescribeImagesCommand({
    Owners: ["self"],
  });
  const response = await client.send(command);
  const total = response?.Images?.length ?? 0;
  updateResourceTypeCounter(serviceName, resourceType, total);
  AWS_MAPPING.total += total;
};

const queryEc2fpga = async (serviceName, resourceType, region) => {
  const client = new EC2Client({ region });
  const command = new DescribeFpgaImagesCommand({
    Owners: ["self"],
  });
  const response = await client.send(command);
  const total = response?.Images?.length ?? 0;
  updateResourceTypeCounter(serviceName, resourceType, total);
  AWS_MAPPING.total += total;
};

const queryScalableTargets = async (serviceName, resourceType, region) => {
  const aasClient = new ApplicationAutoScalingClient({ region });
  let total = 0;
  let aasNextToken;
  do {
    const describeScalableTargets = new DescribeScalableTargetsCommand({
      NextToken: aasNextToken,
      ServiceNamespace: "dynamodb",
    });
    const response = await aasClient.send(describeScalableTargets);
    if (response && response.ScalableTargets) {
      const scalableTargetsCount = response.ScalableTargets.length || 0;
      total += scalableTargetsCount;
      updateResourceTypeCounter(
        serviceName,
        resourceType,
        scalableTargetsCount
      );
      aasNextToken = response.NextToken;
    }
  } while (aasNextToken);
  AWS_MAPPING.total += total;
};

const queryEC2Instance = async (serviceName, resourceType, region) => {
  let total = 0;
  let resources = [];
  try {
    const client = new EC2Client({ region });
    for await (const page of paginateDescribeInstances({ client }, {})) {
      if (page.Reservations) {
        resources.push(
          ...(page.Reservations.map(
            (reservation) => reservation.Instances
          ).flat() || [])
        );
      }
    }
    const ec2InstancesCount = resources.length;
    total += ec2InstancesCount;
    updateResourceTypeCounter(serviceName, resourceType, ec2InstancesCount);
  } catch (err) {
    console.log(`Error finding ${resourceType}`);
  }
  AWS_MAPPING.total += total;
};

const querySnapshot = async (serviceName, resourceType, region) => {
  let total = 0;
  try {
    const command = new DescribeSnapshotsCommand({ OwnerIds: ["self"] });
    const client = new EC2Client({ region });
    const response = await client.send(command);
    if (response && response.Snapshots) {
      const snapshotCount = response.Snapshots.length;
      total += snapshotCount;
      updateResourceTypeCounter(serviceName, resourceType, snapshotCount);
    }
  } catch (err) {
    console.log(`Error finding ${resourceType}`);
  }
  AWS_MAPPING.total += total;
};

const queryDefaultEBSEncryption = async (serviceName, resourceType, region) => {
  let total = 0;
  const command = new GetEbsEncryptionByDefaultCommand({});
  const client = new EC2Client({ region });
  const response = await client.send(command);
  if (response) {
    const ebsEncryptionCount =
      response.EbsEncryptionByDefault !== undefined ? 1 : 0;
    total += ebsEncryptionCount;
    updateResourceTypeCounter(serviceName, resourceType, ebsEncryptionCount);
  }

  AWS_MAPPING.total += total;
};

const queryAPIGatewayStage = async (serviceName, resourceType, region) => {
  let total = 0;
  const client = new APIGatewayClient({ region });
  const resources = [];
  for await (const page of paginateGetRestApis({ client }, {})) {
    resources.push(...(page.items || []));
  }
  for await (const apis of resources) {
    const command = new GetStagesCommand({
      restApiId: apis.id,
    });
    const response = await client?.send(command);
    const stageCount = response?.item.length;
    total += stageCount;
    updateResourceTypeCounter(serviceName, resourceType, stageCount);
  }
  AWS_MAPPING.total += total;
};

const queryECSService = async (serviceName, resourceType, region) => {
  let total = 0;
  const client = new ECSClient({ region });
  const resources = [];
  for await (const page of paginateListClusters({ client }, {})) {
    resources.push(...(page.clusterArns || []));
  }

  for await (const clusterArn of resources) {
    const command = new ListServicesCommand({
      cluster: clusterArn,
    });
    const response = await client?.send(command);
    const serviceCount = response?.serviceArns.length;
    total += serviceCount;
    updateResourceTypeCounter(serviceName, resourceType, serviceCount);
    const chunkedServices = chunks(response?.serviceArns, 10);
    // Batching by 10 because this is the API limit per docs
    // https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-ecs/interfaces/describeservicescommandinput.html
    await Promise.all(
      chunkedServices.map(async (serviceArns) => {
        const command = new DescribeServicesCommand({
          cluster: clusterArn,
          services: serviceArns,
        });
        const response = await client?.send(command);
        const taskDefinitionArns = [];
        if (response && Array.isArray(response?.services)) {
          response.services.forEach((service) => {
            if (service?.taskDefinition) {
              taskDefinitionArns.push(service.taskDefinition);
            }
            if (Array.isArray(service?.deployments)) {
              const deploymentTaskDefinitionArns = service.deployments
                .filter(
                  (deployment) =>
                    deployment?.status === "PRIMARY" &&
                    !!deployment?.taskDefinition
                )
                .map((deployment) => deployment?.taskDefinition);
              if (deploymentTaskDefinitionArns) {
                taskDefinitionArns.push(...deploymentTaskDefinitionArns);
              }
            }
          });
        }

        await Promise.all(
          [...new Set(taskDefinitionArns)].map(async (taskDefinition) => {
            let getTaskDefCmd = new DescribeTaskDefinitionCommand({
              taskDefinition,
            });
            let getTaskDefRes = await client?.send(getTaskDefCmd);
            let containerCount =
              getTaskDefRes.taskDefinition?.containerDefinitions.length;
            total += containerCount;
            updateResourceTypeCounter(
              serviceName,
              ECS_TASK_DEFINITION,
              containerCount
            );
          })
        );
      })
    );
  }
  AWS_MAPPING.total += total;
};

const queryDependencies = async (serviceName, resourceType, region) => {
  const resourceDependency = dependencies.find((dep) => dep.id === serviceName);
  let total = 0;
  if (resourceDependency) {
    const { resources } = resourceDependency;
    const resourceTypeDependency = resources.find(
      (resource) => resource.resourceType === resourceType
    );
    if (resourceTypeDependency) {
      if (
        resourceTypeDependency.listClientConfig.clientType ===
        "AWS_CLOUDCONTROL_V3"
      ) {
        const listClient = new CloudControlClient({
          region,
        });
        const paginatorConfig = {
          client: listClient,
          pageSize: 25,
        };
        const commandInput = {
          TypeName: resourceType,
        };
        const paginator = paginateListResources(paginatorConfig, commandInput);
        for await (const page of paginator) {
          const descriptors = page.ResourceDescriptions;
          const s3BucketsLength = descriptors.length || 0;
          updateResourceTypeCounter(serviceName, resourceType, s3BucketsLength);
          total += s3BucketsLength;
        }
      } else {
        const { list, listClientConfig } = resourceTypeDependency;
        const classPackage = await import(listClientConfig.packageName);
        const ClientClass = classPackage[listClientConfig.clientName];
        const listClient = new ClientClass({
          region,
        });
        const { action: listAction } = list;
        const { command, outputProperty, outputPropertySearchType } =
          listAction;

        const resources = [];
        if (command.includes("paginate")) {
          const packageImport = await import(listClientConfig.packageName);
          const CommandClass = packageImport[command];
          for await (const page of CommandClass({ client: listClient }, {})) {
            if (outputPropertySearchType === "JSON_PATH") {
              const result = jp.query(page, outputProperty)[0];
              resources.push(...result);
            } else {
              resources.push(...page[outputProperty]);
            }
          }
        } else {
          const packageImport = await import(listClientConfig.packageName);
          const CommandClass = packageImport[`${command}Command`];
          const com = new CommandClass({});
          const listResponse = await listClient.send(com);
          if (outputPropertySearchType === "JSON_PATH") {
            const result = jp.query(listResponse, outputProperty)[0];
            const responses = Array.isArray(result) ? result : [result];
            resources.push(...responses);
          } else {
            const responses = Array.isArray(listResponse[outputProperty])
              ? listResponse[outputProperty]
              : [listResponse[outputProperty]];
            resources.push(...responses);
          }
        }
        const resultsLength = resources.length || 0;
        updateResourceTypeCounter(serviceName, resourceType, resultsLength);
        total += resultsLength;
      }
    }
  }
  AWS_MAPPING.total += total;
};

const updateResourceTypeCounter = (serviceName, resourceType, value) => {
  if (AWS_MAPPING[serviceName] === undefined) {
    AWS_MAPPING[serviceName] = { [resourceType]: value };
  } else if (AWS_MAPPING[serviceName][resourceType] === undefined) {
    AWS_MAPPING[serviceName][resourceType] = value;
  } else {
    AWS_MAPPING[serviceName][resourceType] += value;
  }
};

const queryDocDBInstance = async (serviceName, resourceType, region) => {
  let resources = [];
  const client = new DocDBClient({ region });
  for await (const page of paginateDescribeDBInstances(
    { client },
    { Filters: [{ Name: "engine", Values: ["docdb"] }] }
  )) {
    resources.push(...(page.DBInstances || []));
  }
  const resourceCount = resources.length;
  updateResourceTypeCounter(serviceName, resourceType, resourceCount);
  AWS_MAPPING.total += resourceCount;
};

const queryDocDBCluster = async (serviceName, resourceType, region) => {
  let resources = [];
  const client = new DocDBClient({ region });
  for await (const page of paginateDescribeDBClusters(
    { client },
    { Filters: [{ Name: "engine", Values: ["docdb"] }] }
  )) {
    resources.push(...(page.DBClusters || []));
  }
  const resourceCount = resources.length;
  updateResourceTypeCounter(serviceName, resourceType, resourceCount);
  AWS_MAPPING.total += resourceCount;
};

const queryDocDBClusterParameterGroup = async (serviceName, resourceType, region) => {
  let resources = [];
  const client = new DocDBClient({ region });
  for await (const page of paginateDocDBClusterParameterGroups(
    { client },
    { Filters: [{ Name: "engine", Values: ["docdb"] }] }
  )) {
    resources.push(...(page.DBClusterParameterGroups || []));
  }
  const resourceCount = resources.length;
  updateResourceTypeCounter(serviceName, resourceType, resourceCount);
  AWS_MAPPING.total += resourceCount;
};

const queryRDSInstance = async (serviceName, resourceType, region) => {
  let resources = [];
  const client = new RDSClient({ region });
  for await (const page of paginateRDSInstances(
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
            "sqlserver-web",
          ],
        },
      ],
    }
  )) {
    resources.push(...(page.DBInstances || []));
  }
  const resourceCount = resources.length;
  updateResourceTypeCounter(serviceName, resourceType, resourceCount);
  AWS_MAPPING.total += resourceCount;
};

const queryRDSCluster = async (serviceName, resourceType, region) => {
  let resources = [];
  const client = new RDSClient({ region });
  for await (const page of paginateRDSClusters(
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
            "sqlserver-web",
          ],
        },
      ],
    }
  )) {
    resources.push(...(page.DBClusters || []));
  }
  const resourceCount = resources.length;
  updateResourceTypeCounter(serviceName, resourceType, resourceCount);
  AWS_MAPPING.total += resourceCount;
};

const queryRDSClusterSnapshot = async (serviceName, resourceType, region) => {
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
            "sqlserver-web",
          ],
        },
      ],
    }
  )) {
    resources.push(...(page.DBClusterSnapshots || []));
  }
  const resourceCount = resources.length;
  updateResourceTypeCounter(serviceName, resourceType, resourceCount);
  AWS_MAPPING.total += resourceCount;
};

const queryEKSNodeGroup = async (serviceName, resourceType, region) => {
  const client = new EKSClient({ region });
  const clusterNames = [];
  for await (const page of paginateListEKSClusters({ client }, {})) {
    clusterNames.push(...(page.clusters || []));
  }
  let nodeGroups = [];
  await Promise.all(
    clusterNames.map(async (clusterName) => {
      for await (const page of paginateListNodegroups(
        { client },
        { clusterName }
      )) {
        if (
          page?.nodegroups?.length !== undefined &&
          page?.nodegroups?.length > 0
        ) {
          for (const nodeGroup of page.nodegroups) {
            nodeGroups.push({ clusterName, nodeGroup });
          }
        }
      }
    })
  );
  const resourceCount = nodeGroups.length;
  updateResourceTypeCounter(serviceName, resourceType, resourceCount);
  AWS_MAPPING.total += resourceCount;
};

const queryNeptuneInstance = async (serviceName, resourceType, region) => {
  let resources = [];
  const client = new NeptuneClient({ region });
  for await (const page of paginateNeptuneInstances(
    { client },
    { Filters: [{ Name: "engine", Values: ["neptune"] }] }
  )) {
    resources.push(...(page.DBInstances || []));
  }
  const resourceCount = resources.length;
  updateResourceTypeCounter(serviceName, resourceType, resourceCount);
  AWS_MAPPING.total += resourceCount;
};

const queryNeptuneClusterParameterGroups = async (
  serviceName,
  resourceType,
  region
) => {
  let resources = [];
  const client = new NeptuneClient({ region });
  for await (const page of paginateDescribeDBClusterParameterGroups(
    { client },
    { Filters: [{ Name: "engine", Values: ["neptune"] }] }
  )) {
    resources.push(...(page.DBClusterParameterGroups || []));
  }
  const resourceCount = resources.length;
  updateResourceTypeCounter(serviceName, resourceType, resourceCount);
  AWS_MAPPING.total += resourceCount;
};

const queryComputeOptimizerEnrollmentStatus = async (
  serviceName,
  resourceType,
  region
) => {
  let total = 0;
  const client = new ComputeOptimizerClient({ region });
  const resources = [];
  const command = new GetEnrollmentStatusCommand({});
  const response = await client.send(command);
  resources.push({ ...(response || {}) });
  updateResourceTypeCounter(serviceName, resourceType, resources.length);
  total += resources.length;
  AWS_MAPPING.total += total;
};

const queryScalingPolicies = async (serviceName, resourceType, region) => {
  let total = 0;
  const resources = [];
  const client = new ApplicationAutoScalingClient({ region });
  for await (const page of paginateDescribeScalingPolicies(
    { client },
    { ServiceNamespace: "ecs" }
  )) {
    resources.push(...(page.ScalingPolicies || []));
  }
  const resourceCount = resources.length;
  updateResourceTypeCounter(serviceName, resourceType, resourceCount);
  total += resources.length;
  AWS_MAPPING.total += total;
};

export const queryAWS = async (parsedService, parsedResourceType) => {
  await Promise.all(
    services.map(async (service) => {
      const { regions, service: serviceName, resources } = service;
      if (parsedService && parsedService !== serviceName) {
        return;
      }
      for (const resource of resources) {
        const { resourceType } = resource;
        if (parsedResourceType && parsedResourceType !== resourceType) {
          continue;
        }
        for (const region of regions) {
          console.log(`Checking ${resourceType} on region ${region}`);
          try {
            switch (resourceType) {
              case DDB_SCALABLE_TARGET:
                await queryScalableTargets(serviceName, resourceType, region);
                break;
              case EC2_DEFAULT_EBS_ENCRYPTION:
                await queryDefaultEBSEncryption(
                  serviceName,
                  resourceType,
                  region
                );
                break;
              case EC2_SNAPSHOT:
                await querySnapshot(serviceName, resourceType, region);
                break;
              case EC2_INSTANCE:
                await queryEC2Instance(serviceName, resourceType, region);
                break;
              case GLACIER_VAULT:
                await queryGlacierVault(serviceName, resourceType, region);
                break;
              case IAM_GROUP:
              case IAM_ROLE:
              case IAM_USER:
              case IAM_POLICY:
                await queryIAMAccountAuthorization(
                  serviceName,
                  resourceType,
                  region
                );
                break;
              case KINESIS_FIREHOSE_DELIVERY_STREAM:
                await queryKinesisFirehoseDeliveryStream(
                  serviceName,
                  resourceType,
                  region
                );
                break;
              case KINESIS_STREAM:
                await queryKinesisStream(serviceName, resourceType, region);
                break;
              case LAMBDA_FUNCTION:
                await queryLambdaFunction(serviceName, resourceType, region);
                break;
              case MEMORY_DB_ACL:
                await queryMemoryDBACL(serviceName, resourceType, region);
                break;
              case MEMORY_DB_USER:
                await queryMemoryDBUser(serviceName, resourceType, region);
                break;
              case MEMORY_DB_CLUSTER:
                await queryMemoryDBCluster(serviceName, resourceType, region);
                break;
              case ORGANIZATIONS_UNIT:
              case ORGANIZATIONS_ORGANIZATION:
                await queryOrganizations(serviceName, resourceType, region);
                break;
              case S3CONTROL_BLOCK_PUBLIC_ACCESS:
                await queryS3ControlBlockPublicAccess(
                  serviceName,
                  resourceType,
                  region
                );
                break;
              case SSM_DOCUMENT:
                await querySSMDocument(serviceName, resourceType, region);
                break;
              case APIGATEWAY_STAGE:
                await queryAPIGatewayStage(serviceName, resourceType, region);
                break;
              case ECS_SERVICE:
                await queryECSService(serviceName, resourceType, region);
                break;
              case DOC_DB_INSTANCE:
                await queryDocDBInstance(serviceName, resourceType, region);
                break;
              case DOC_DB_CLUSTER:
                await queryDocDBCluster(serviceName, resourceType, region);
                break;
              case DOC_DB_CLUSTER_PARAMETER_GROUP:
                await queryDocDBClusterParameterGroup(serviceName, resourceType, region);
                break;
              case RDS_DB_INSTANCE:
                await queryRDSInstance(serviceName, resourceType, region);
                break;
              case RDS_DB_CLUSTER:
                await queryRDSCluster(serviceName, resourceType, region);
                break;
              case RDS_DB_CLUSTER_SNAPSHOT:
                await queryRDSClusterSnapshot(
                  serviceName,
                  resourceType,
                  region
                );
                break;
              case NEPTUNE_DB_INSTANCE:
                await queryNeptuneInstance(serviceName, resourceType, region);
                break;
              case NEPTUNE_DB_CLUSTER_PARAMETER_GROUP:
                await queryNeptuneClusterParameterGroups(
                  serviceName,
                  resourceType,
                  region
                );
                break;
              case WAF_RULE_GROUP:
                await queryWafv2RuleGroup(serviceName, resourceType, region);
                break;
              case EC2_AMI:
                await queryEc2Ami(serviceName, resourceType, region);
                break;
              case EC2_FPGA_IMAGE:
                await queryEc2fpga(serviceName, resourceType, region);
                break;
              case EKS_NODE_GROUP:
                await queryEKSNodeGroup(serviceName, resourceType, region);
                break;
              case COMPUTE_OPTIMIZER_ENROLLMENT_STATUS:
                await queryComputeOptimizerEnrollmentStatus(
                  serviceName,
                  resourceType,
                  region
                );
                break;
              case APPLICATION_AUTOSCALING_SCALING_POLICY:
                await queryScalingPolicies(serviceName, resourceType, region);
                break;
              default:
                await queryDependencies(serviceName, resourceType, region);
            }
          } catch (err) {
            console.log(`Error checking ${resourceType} on region ${region}`);
          }
        }
      }
    })
  );
  return AWS_MAPPING;
};
