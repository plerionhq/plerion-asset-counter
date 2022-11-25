import services from "./aws-services.json";
import dependencies from "./aws-dependencies.json";
import jp from "jsonpath";
import {
  ApplicationAutoScalingClient,
  DescribeScalableTargetsCommand,
} from "@aws-sdk/client-application-auto-scaling";
import {
  paginateListResources,
  CloudControlClient,
} from "@aws-sdk/client-cloudcontrol";
import {
  EC2Client,
  GetEbsEncryptionByDefaultCommand,
  DescribeSnapshotsCommand,
  paginateDescribeInstances,
} from "@aws-sdk/client-ec2";
import {
  GlacierClient,
  paginateListVaults,
} from '@aws-sdk/client-glacier';

const MAPPING = { total: 0 };

const DDB_SCALABLE_TARGET = "AWS::DynamoDB::ScalableTarget";
const EC2_INSTANCE = "AWS::EC2::Instance";
const EC2_DEFAULT_EBS_ENCRYPTION = "AWS::EC2::DefaultEBSEncryption";
const EC2_SNAPSHOT = "AWS::EC2::Snapshot";
const GLACIER_VAULT = "AWS::Glacier::Vault"

const queryGlacierVault = async (serviceName, resourceType, region) => {
  let total = 0;
  let resources = [];
  try {
    const client = new GlacierClient({ region });
    for await (const page of paginateListVaults({ client }, {})) {
      resources.push(...(page.VaultList || []));
    }
    const resourceCount = resources.length;
    total += resourceCount;
    updateResourceTypeCounter(serviceName, resourceType, resourceCount);
  } catch (err) {
    console.log(`Error finding ${resourceType}`);
  }
  MAPPING.total += total;
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
    try {
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
    } catch (err) {
      console.log(`Error finding ${resourceType}`);
    }
  } while (aasNextToken);
  MAPPING.total += total;
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
  MAPPING.total += total;
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
  MAPPING.total += total;
};

const queryDefaultEBSEncryption = async (serviceName, resourceType, region) => {
  let total = 0;
  try {
    const command = new GetEbsEncryptionByDefaultCommand({});
    const client = new EC2Client({ region });
    const response = await client.send(command);
    if (response) {
      const ebsEncryptionCount =
        response.EbsEncryptionByDefault !== undefined ? 1 : 0;
      total += ebsEncryptionCount;
      updateResourceTypeCounter(serviceName, resourceType, ebsEncryptionCount);
    }
  } catch (err) {
    console.log(`Error finding ${resourceType}`);
  }
  MAPPING.total += total;
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
  MAPPING.total += total;
};

const updateResourceTypeCounter = (serviceName, resourceType, value) => {
  if (MAPPING[serviceName] === undefined) {
    MAPPING[serviceName] = { [resourceType]: value };
  } else if (MAPPING[serviceName][resourceType] === undefined) {
    MAPPING[serviceName][resourceType] = value;
  } else {
    MAPPING[serviceName][resourceType] += value;
  }
};

export const queryAWS = async (parsedService, parsedResourceType) => {
  for (const service of services) {
    const { regions, service: serviceName, resources } = service;
    if (parsedService && parsedService !== serviceName) {
      continue;
    }
    for (const resource of resources) {
      const { resourceType } = resource;
      if (parsedResourceType && parsedResourceType !== resourceType) {
        continue;
      }
      for (const region of regions) {
        console.log(`Checking ${serviceName} on region ${region}`);
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
            default:
              await queryDependencies(serviceName, resourceType, region);
          }
        } catch (err) {
          console.log(`Error checking ${resourceType} on region ${region}`);
        }
      }
    }
  }
  console.log(JSON.stringify(MAPPING));
};
