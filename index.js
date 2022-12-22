import { writeFile } from "fs/promises";
import { Command } from "commander";
import { queryAWS } from "./AWS/aws.js";

import { UNIT_MAPPING } from "./constants.js";

const program = new Command();
program
  .option("-p, --provider <provider>")
  .option("-s, --service <service>")
  .option("-r, --resource <resource>")
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
    Object.keys(serviceResourceTypesCounts).forEach((resourceTypeCount) => {
      if (serviceUnits && serviceUnits[resourceTypeCount] !== undefined) {
        cwppUnits +=
          serviceUnits[resourceTypeCount] *
          serviceResourceTypesCounts[resourceTypeCount];
      }
      cspmUnits += serviceResourceTypesCounts[resourceTypeCount];
    });
  });
  return { CSPM: cspmUnits, CWPP: cwppUnits };
};

(async () => {
  const { provider, service, resource: resourceType, verbose } = options;
  let result;
  switch (provider) {
    case AWS:
      result = await queryAWS(service, resourceType);
      break;
  }
  const { CSPM: CSPM_UNITS, CWPP: CWPP_UNITS } = calculateUnits(
    result,
    provider
  );
  result["CSPM_UNITS"] = CSPM_UNITS;
  result["CWPP_UNITS"] = CWPP_UNITS;
  console.log("-----------------------------------");
  console.log("OUTPUT: ");
  console.log(result, null, 2);
  console.log("-----------------------------------");
  if (verbose) {
    await writeFile(`${provider}-output.json`, JSON.stringify(result));
  } else {
    await writeFile(
      `${provider}-output.json`,
      JSON.stringify({ total: result.total })
    );
  }
  console.log("CSPM/CIEM Asset Units: " + CSPM_UNITS);
  console.log("CWPP Asset Units: " + CWPP_UNITS);
  console.log("Total Asset Units: " + (CWPP_UNITS + CSPM_UNITS));
  console.log("-----------------------------------");
})();
