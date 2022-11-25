import { Command } from "commander";
import { queryAWS } from "./aws";
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
  switch (provider) {
    case AWS:
      await queryAWS(service, resourceType);
      break;
  }
})();
