import { writeFile } from "fs/promises";
import { Command } from "commander";
import { queryAWS } from "./AWS/aws.js";
import { isKubectlInstalled, queryKubernetes } from "./k8s/index.js";

import { UNIT_MAPPING, DAYS_PER_MONTH } from "./constants.js";

const program = new Command();
program
  .option("-p, --provider <provider>")
  .option("-s, --service <service>")
  .option("-r, --resource <resource>")
  .option("--accountId <a provider's account id to prefix the output file>")
  .option("-v, --verbose", "Verbose resource type logging");

program.parse();

const options = program.opts();
const AWS = "AWS";
const Kubernetes = "K8S";

const calculateK8sUnits = (result) => {
  let kspmUnits = 0;
  let cwppUnits = 0;
  Object.keys(result.resources).forEach((resource) => {
    const kspmResourceCounts = result.resources[resource]["KSPM"] || 0;
    const cwppResourceCounts = result.resources[resource]["CWPP"] || 0;
    kspmUnits += kspmResourceCounts;
    cwppUnits += cwppResourceCounts * (UNIT_MAPPING.K8S[resource] || 1);
  });
  return { KSPM: kspmUnits, CWPP: cwppUnits };
};

const calculateUnits = (result, provider) => {
  const providerUnits = UNIT_MAPPING[provider];
  let cspmUnits = 0;
  let cwppUnits = 0;
  Object.keys(result).forEach((serviceName) => {
    if (serviceName === "total") {
      return;
    }
    const serviceResourceTypesCounts = result[serviceName];
    const serviceUnits = providerUnits[serviceName];
    Object.keys(serviceResourceTypesCounts).forEach((resourceType) => {
      if (serviceUnits && serviceUnits[resourceType] !== undefined) {
        cwppUnits +=
          serviceUnits[resourceType] *
          (serviceResourceTypesCounts[resourceType]["cwppUnits"] ||
            serviceResourceTypesCounts[resourceType]);
      }
      cspmUnits +=
        serviceResourceTypesCounts[resourceType]["cspmUnits"] ||
        serviceResourceTypesCounts[resourceType];
    });
  });
  return { CSPM: cspmUnits, CWPP: cwppUnits };
};

(async () => {
  const {
    provider,
    service,
    resource: resourceType,
    verbose,
    accountId,
  } = options;
  let result;
  switch (provider) {
    case AWS:
      result = await queryAWS(service, resourceType, verbose, accountId);
      await reportCloudProviderStat(result, AWS, accountId, verbose);
      break;
    case Kubernetes: {
      const kubectlInstalled = await isKubectlInstalled();
      if (!kubectlInstalled) {
        console.log(
          "kubectl is not installed in this machine. Refer link https://kubernetes.io/docs/tasks/tools for installation.",
        );
        return;
      }
      result = await queryKubernetes(resourceType, verbose);
      await reportK8sStat(result, verbose);
      break;
    }
  }
})();

const reportCloudProviderStat = async (
  result,
  provider,
  accountId,
  verbose,
) => {
  const { CSPM: CSPM_UNITS, CWPP: CWPP_UNITS } = calculateUnits(result, AWS);
  result["CSPM_UNITS"] = CSPM_UNITS;
  result["CWPP_UNITS"] = CWPP_UNITS;
  result["TOTAL_UNITS"] = CWPP_UNITS + CSPM_UNITS;
  result["DAYS_PER_MONTH"] = DAYS_PER_MONTH;
  result["CSPM_UNITS_PER_MONTH"] =
    result["DAYS_PER_MONTH"] * result["CSPM_UNITS"];
  result["CWPP_UNITS_PER_MONTH"] =
    result["DAYS_PER_MONTH"] * result["CWPP_UNITS"];
  result["TOTAL_UNITS_PER_MONTH"] =
    result["DAYS_PER_MONTH"] * result["TOTAL_UNITS"];

  result["INFO"] = {
    CSPM_CIEM_ASSET_UNIT_BASE_CONSUMPTION: 1,
    CWPP_ASSET_UNIT_BASE_CONSUMPTION: 10,
    TOTAL_DAYS_PER_MONTH: result["DAYS_PER_MONTH"],
  };
  result["DAILY"] = {
    CSPM_CIEM_ASSET_UNITS: result["CSPM_UNITS"],
    CWPP_ASSET_UNITS: result["CWPP_UNITS"],
    TOTAL_ASSET_UNITS: result["TOTAL_UNITS"],
  };
  result["MONTHLY"] = {
    CSPM_CIEM_ASSET_UNITS: result["CSPM_UNITS_PER_MONTH"],
    CWPP_ASSET_UNITS: result["CWPP_UNITS_PER_MONTH"],
    TOTAL_ASSET_UNITS: result["TOTAL_UNITS_PER_MONTH"],
  };
  console.log("-----------------------------------");
  console.log("OUTPUT: ");
  console.log(result);
  console.log("-----------------------------------");
  if (verbose) {
    await writeFile(`${provider}-output.json`, JSON.stringify(result, null, 2));
  } else {
    const accountIdPrefix = accountId ? `${accountId}-` : "";
    await writeFile(
      `${accountIdPrefix}${provider}-output.json`,
      JSON.stringify(
        {
          TOTAL: result.total,
          CSPM_UNITS: result["CSPM_UNITS"],
          CWPP_UNITS: result["CWPP_UNITS"],
          TOTAL_UNITS: result["TOTAL_UNITS"],
          DAYS_PER_MONTH: result["DAYS_PER_MONTH"],
          CSPM_UNITS_PER_MONTH: result["CSPM_UNITS_PER_MONTH"],
          CWPP_UNITS_PER_MONTH: result["CWPP_UNITS_PER_MONTH"],
          TOTAL_UNITS_PER_MONTH: result["TOTAL_UNITS_PER_MONTH"],
          INFO: {
            CSPM_CIEM_ASSET_UNIT_BASE_CONSUMPTION: 1,
            CWPP_ASSET_UNIT_BASE_CONSUMPTION: 10,
            TOTAL_DAYS_PER_MONTH: result["DAYS_PER_MONTH"],
          },
          DAILY: {
            CSPM_CIEM_ASSET_UNITS: result["CSPM_UNITS"],
            CWPP_ASSET_UNITS: result["CWPP_UNITS"],
            TOTAL_ASSET_UNITS: result["TOTAL_UNITS"],
          },
          MONTHLY: {
            CSPM_CIEM_ASSET_UNITS: result["CSPM_UNITS_PER_MONTH"],
            CWPP_ASSET_UNITS: result["CWPP_UNITS_PER_MONTH"],
            TOTAL_ASSET_UNITS: result["TOTAL_UNITS_PER_MONTH"],
          },
        },
        null,
        2,
      ),
    );
  }
  console.log("INFO");
  console.log("CSPM/CIEM Asset Unit Base Consumption: 1");
  console.log("CWPP Asset Unit Base Consumption: 10");
  console.log("Total days per month: " + result["DAYS_PER_MONTH"]);
  console.log("-----------------------------------");
  console.log("DAILY");
  console.log("CSPM/CIEM Asset Units: " + result["CSPM_UNITS"]);
  console.log("CWPP Asset Units: " + result["CWPP_UNITS"]);
  console.log("Total Asset Units: " + result["TOTAL_UNITS"]);
  console.log("-----------------------------------");
  console.log("MONTHLY");
  console.log(
    "CSPM/CIEM Asset Units consumed p/m: " + result["CSPM_UNITS_PER_MONTH"],
  );
  console.log(
    "CWPP Asset Units consumed p/m: " + result["CWPP_UNITS_PER_MONTH"],
  );
  console.log(
    "Total Asset Units consumed p/m: " + result["TOTAL_UNITS_PER_MONTH"],
  );
  console.log("-----------------------------------");
};

const reportK8sStat = async (result, verbose) => {
  const { KSPM: KSPM_UNITS, CWPP: CWPP_UNITS } = calculateK8sUnits(result);
  result["KSPM_UNITS"] = KSPM_UNITS;
  result["CWPP_UNITS"] = CWPP_UNITS;
  result["TOTAL_UNITS"] = KSPM_UNITS + CWPP_UNITS;
  result["DAYS_PER_MONTH"] = DAYS_PER_MONTH;
  result["KSPM_UNITS_PER_MONTH"] =
    result["DAYS_PER_MONTH"] * result["KSPM_UNITS"];
  result["CWPP_UNITS_PER_MONTH"] =
    result["DAYS_PER_MONTH"] * result["CWPP_UNITS"];
  result["TOTAL_UNITS_PER_MONTH"] =
    result["DAYS_PER_MONTH"] * result["TOTAL_UNITS"];

  result["INFO"] = {
    KSPM_RESOURCE_UNIT_BASE_CONSUMPTION: 1,
    CWPP_ASSET_UNIT_BASE_CONSUMPTION: 10,
    TOTAL_DAYS_PER_MONTH: result["DAYS_PER_MONTH"],
  };
  result["DAILY"] = {
    KSPM_RESOURCE_UNITS: result["KSPM_UNITS"],
    CWPP_ASSET_UNITS: result["CWPP_UNITS"],
    TOTAL_RESOURCE_UNITS: result["TOTAL_UNITS"],
  };
  result["MONTHLY"] = {
    KSPM_RESOURCE_UNITS: result["KSPM_UNITS_PER_MONTH"],
    CWPP_ASSET_UNITS: result["CWPP_UNITS_PER_MONTH"],
    TOTAL_RESOURCE_UNITS: result["TOTAL_UNITS_PER_MONTH"],
  };
  console.log("-----------------------------------");
  console.log("OUTPUT: ");
  console.log(result);
  console.log("-----------------------------------");

  const resultFileName = `${Kubernetes}-output.json`;
  if (verbose) {
    await writeFile(resultFileName, JSON.stringify(result, null, 2));
  } else {
    await writeFile(
      resultFileName,
      JSON.stringify(
        {
          TOTAL: result.total,
          KSPM_UNITS: result["KSPM_UNITS"],
          TOTAL_UNITS: result["TOTAL_UNITS"],
          DAYS_PER_MONTH: result["DAYS_PER_MONTH"],
          KSPM_UNITS_PER_MONTH: result["KSPM_UNITS_PER_MONTH"],
          CWPP_UNITS_PER_MONTH: result["CWPP_UNITS_PER_MONTH"],
          TOTAL_UNITS_PER_MONTH: result["TOTAL_UNITS_PER_MONTH"],
          INFO: {
            KSPM_RESOURCE_UNIT_BASE_CONSUMPTION: 1,
            CWPP_ASSET_UNIT_BASE_CONSUMPTION: 10,
            TOTAL_DAYS_PER_MONTH: result["DAYS_PER_MONTH"],
          },
          DAILY: {
            KSPM_RESOURCE_UNITS: result["KSPM_UNITS"],
            CWPP_ASSET_UNITS: result["CWPP_UNITS"],
            TOTAL_RESOURCE_UNITS: result["TOTAL_UNITS"],
          },
          MONTHLY: {
            KSPM_RESOURCE_UNITS: result["KSPM_UNITS_PER_MONTH"],
            CWPP_ASSET_UNITS: result["CWPP_UNITS_PER_MONTH"],
            TOTAL_RESOURCE_UNITS: result["TOTAL_UNITS_PER_MONTH"],
          },
        },
        null,
        2,
      ),
    );
  }
  console.log("INFO");
  console.log("KSPM Resource Unit Base Consumption: 1");
  console.log("CWPP Asset Unit Base Consumption: 10");
  console.log("Total days per month: " + result["DAYS_PER_MONTH"]);
  console.log("-----------------------------------");
  console.log("DAILY");
  console.log("KSPM Resource Units: " + result["KSPM_UNITS"]);
  console.log("CWPP Asset Units: " + result["CWPP_UNITS"]);
  console.log("Total Resource Units: " + result["TOTAL_UNITS"]);
  console.log("-----------------------------------");
  console.log("MONTHLY");
  console.log(
    "KSPM Resource Units consumed p/m: " + result["KSPM_UNITS_PER_MONTH"],
  );
  console.log(
    "CWPP Asset Units consumed p/m: " + result["CWPP_UNITS_PER_MONTH"],
  );
  console.log(
    "Total Resource Units consumed p/m: " + result["TOTAL_UNITS_PER_MONTH"],
  );
  console.log("-----------------------------------");
};
