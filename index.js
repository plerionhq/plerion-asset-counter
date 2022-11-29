import { writeFile } from "fs/promises";
import { Command } from "commander";
import { queryAWS } from "./AWS/aws.js";

const program = new Command();
program
  .option("-p, --provider <provider>")
  .option("-s, --service <service>")
  .option("-r, --resource <resource>");

program.parse();

const options = program.opts();
const AWS = "AWS";

(async () => {
  const { provider, service, resource: resourceType } = options;
  let result;
  switch (provider) {
    case AWS:
      result = await queryAWS(service, resourceType);
      break;
  }
  console.log("OUTPUT: ");
  console.log(result, null, 2);
  await writeFile(`${provider}-output.json`, JSON.stringify(result));
})();
