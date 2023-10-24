import services from "./aws-services.json";
import { promises as fs } from "fs";
import path from "path";
import { queryDependencies } from "./service/index.js";

const AWS_MAPPING = { total: 0 };

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
        // Extract service and resource
        const [, serviceName, resourceName] = resourceType;

        // Construct the file path
        const filePath = path.join(
          process.cwd(),
          `collectors/custom/${service}/${resourceName}.js`,
        );
        for (const region of regions) {
          console.log(`Checking ${resourceType} on region ${region}`);
          try {
            await fs.access(filePath);

            // Dynamically import the module
            const module = await import(filePath);

            // Check if query function exists in the module
            if (typeof module.query === "function") {
              await module.query(
                AWS_MAPPING,
                serviceName,
                resourceType,
                region,
              );
            } else {
              console.error(`Function 'query' not found in ${filePath}`);
            }
          } catch (error) {
            await queryDependencies(
              AWS_MAPPING,
              serviceName,
              resourceType,
              region,
            );
          }
        }
      }
    }),
  );
  return AWS_MAPPING;
};
