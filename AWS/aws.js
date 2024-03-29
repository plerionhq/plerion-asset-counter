import { readFileSync } from "fs";

const services = JSON.parse(
  readFileSync(path.join(process.cwd(), "AWS/aws-services.json")),
);
import path from "path";
import { queryDependencies, checkModuleAndQuery } from "./service/index.js";

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
        for (const region of regions) {
          // Extract service and resource
          const [providerName, serviceName, resourceName] =
            resourceType.split("::");

          // Construct the file path
          const filePath = path.join(
            process.cwd(),
            `${providerName}/collectors/custom/${serviceName}/${resourceName}.js`,
          );
          console.log(`Checking ${resourceType} on region ${region}`);

          const success = await checkModuleAndQuery(
            filePath,
            AWS_MAPPING,
            serviceName,
            resourceType,
            region,
          );

          if (!success) {
            try {
              await queryDependencies(
                AWS_MAPPING,
                serviceName,
                resourceType,
                region,
              );
            } catch (err) {
              console.log(`Error checking ${resourceType} on ${region}`);
            }
          }
        }
      }
    }),
  );
  return AWS_MAPPING;
};
