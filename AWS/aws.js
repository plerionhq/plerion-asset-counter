import services from "./aws-services.json" assert { type: "json" };
import dependencies from "./aws-dependencies.json" assert { type: "json" };
import jp from "jsonpath";
import chunks from "lodash.chunk";
import { WAFV2Client, ListRuleGroupsCommand } from "@aws-sdk/client-wafv2";
import {
  ApplicationAutoScalingClient,
  DescribeScalableTargetsCommand,
  paginateDescribeScalingPolicies
} from "@aws-sdk/client-application-auto-scaling";
import {
  paginateListResources,
  CloudControlClient
} from "@aws-sdk/client-cloudcontrol";
import {
  EC2Client,
  GetEbsEncryptionByDefaultCommand,
  paginateDescribeInstances, paginateDescribeImages, paginateDescribeFpgaImages, paginateDescribeSnapshots
} from "@aws-sdk/client-ec2";
import { GlacierClient, paginateListVaults } from "@aws-sdk/client-glacier";
import {
  IAMClient,
  paginateGetAccountAuthorizationDetails
} from "@aws-sdk/client-iam";
import {
  FirehoseClient,
  ListDeliveryStreamsCommand
} from "@aws-sdk/client-firehose";
import { KinesisClient, ListStreamsCommand } from "@aws-sdk/client-kinesis";
import { LambdaClient, paginateListFunctions } from "@aws-sdk/client-lambda";
import {
  MemoryDBClient,
  DescribeACLsCommand,
  DescribeClustersCommand,
  DescribeUsersCommand
} from "@aws-sdk/client-memorydb";
import {
  OrganizationsClient,
  DescribeOrganizationCommand,
  paginateListRoots
} from "@aws-sdk/client-organizations";
import {
  S3ControlClient,
  GetPublicAccessBlockCommand
} from "@aws-sdk/client-s3-control";
import { SSMClient, paginateListDocuments } from "@aws-sdk/client-ssm";
import {
  APIGatewayClient,
  paginateGetRestApis,
  GetStagesCommand
} from "@aws-sdk/client-api-gateway";
import {
  ECSClient,
  paginateListClusters,
  ListServicesCommand,
  DescribeServicesCommand,
  DescribeTaskDefinitionCommand
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
  paginateDescribeDBClusterSnapshots
} from "@aws-sdk/client-rds";
import {
  NeptuneClient,
  paginateDescribeDBInstances as paginateNeptuneInstances,
  paginateDescribeDBClusters as paginateNeptuneClusters,
  paginateDescribeDBClusterParameterGroups
} from "@aws-sdk/client-neptune";
import {
  EKSClient,
  paginateListNodegroups,
  paginateListClusters as paginateListEKSClusters
} from "@aws-sdk/client-eks";
import {
  ComputeOptimizerClient,
  GetEnrollmentStatusCommand
} from "@aws-sdk/client-compute-optimizer";

import {
  getNextListPageTokenKey,
  getNextListPageTokenRequestKey,
  getNextPageTokenKeyFromResponse
} from "./utils/index";
import { paginate, getAWSAccountId } from "./service/index";
import { ListBucketsCommand, S3Client } from "@aws-sdk/client-s3";
import { EMRClient } from "@aws-sdk/client-emr";
import { ApiGatewayV2Client, GetApisCommand } from "@aws-sdk/client-apigatewayv2";

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
const ORGANIZATIONS_ACCOUNT = "AWS::Organizations::Account";
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
const NEPTUNE_DB_CLUSTER = "AWS::Neptune::DBCluster";
const NEPTUNE_DB_CLUSTER_PARAMETER_GROUP =
  "AWS::Neptune::DBClusterParameterGroup";
const WAF_RULE_GROUP = "AWS::WAFv2::RuleGroup";
const EKS_NODE_GROUP = "AWS::EKS::NodeGroup";
const COMPUTE_OPTIMIZER_ENROLLMENT_STATUS =
  "AWS::ComputeOptimizer::EnrollmentStatus";
const APPLICATION_AUTOSCALING_SCALING_POLICY =
  "AWS::ApplicationAutoScaling::ECSScalingPolicy";
const S3_BUCKET = "AWS::S3::Bucket";
const EMR_CLUSTER = "AWS::EMR::Cluster";
const APIGATEWAYV2_API = "AWS::ApiGatewayV2::API";










































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
              case ORGANIZATIONS_ACCOUNT:
                await queryOrganizationsAccount(serviceName, resourceType, region);
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
              case NEPTUNE_DB_CLUSTER:
                await queryNeptuneCluster(serviceName, resourceType, region);
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
              case S3_BUCKET:
                await queryS3Buckets(serviceName, resourceType, region);
                break;
              case EMR_CLUSTER:
                await queryEMRClusters(serviceName, resourceType, region);
                break;
              case APIGATEWAYV2_API:
                await queryAPIGatewayV2APIs(serviceName, resourceType, region);
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
