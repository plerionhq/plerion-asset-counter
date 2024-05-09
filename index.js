import { writeFile } from "fs/promises";
import { Command } from "commander";
import { queryAWS } from "./AWS/aws.js";

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
      break;
  }
  const { CSPM: CSPM_UNITS, CWPP: CWPP_UNITS } = calculateUnits(
    result,
    provider,
  );
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
})();
