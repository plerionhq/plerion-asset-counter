import path from "path";
import { readFileSync } from "fs";

import { execCommand } from "../utils/index.js";

const K8S_MAPPING = { total: 0, resources: {} };

const supportedKubernetesResources = JSON.parse(
  readFileSync(path.join(process.cwd(), "k8s/k8-resources.json")),
);

const getResourcesToQuery = (requestedResources) => {
  const allK8sResources = Object.entries(supportedKubernetesResources).map(
    ([, k8Resource]) => k8Resource,
  );

  let resourcesToQuery = allK8sResources.map((resource) => resource.name);

  if (!requestedResources) {
    return resourcesToQuery;
  }

  const { invalidResources, validResources } = requestedResources
    .split(",")
    .reduce(
      (acc, resource) => {
        const validResource = allK8sResources.find(
          (K8sResource) =>
            K8sResource.name === resource ||
            (K8sResource.shortNames || []).includes(resource),
        );
        if (validResource) {
          !acc.validResources.includes(validResource.name) &&
            acc.validResources.push(validResource.name);
        } else {
          acc.invalidResources.push(resource);
        }
        return acc;
      },
      { invalidResources: [], validResources: [] },
    );

  if (invalidResources.length) {
    console.log(
      `These resources are not currently supported: ${invalidResources.join()}`,
    );
  }

  if (!validResources.length) {
    console.log(
      "All provided resources are not supported, querying all supported resources",
    );
  } else {
    resourcesToQuery = validResources;
  }

  return resourcesToQuery;
};

export const queryKubernetes = async (requestedResources, verbose) => {
  const resourcesToQuery = getResourcesToQuery(requestedResources);

  for (const k8sResource of resourcesToQuery) {
    try {
      console.log(`querying ${k8sResource}`);
      const resourceResponse = await execCommand(
        `kubectl get ${k8sResource} --all-namespaces -o json`,
        true,
      );
      updateResourceCounter(
        K8S_MAPPING,
        k8sResource,
        resourceResponse.items.length,
      );
      K8S_MAPPING.total += resourceResponse.items.length;
    } catch (err) {
      console.log(`Error fetching resource detail of ${k8sResource}`);
      verbose && console.log(err);
    }
  }

  return K8S_MAPPING;
};

export const updateResourceCounter = (K8S_MAPPING, resource, value) => {
  if (typeof value !== "number") {
    console.log(`${resource} DID NOT RECEIVE NUMBER FOR VALUE`);
    process.exit(1);
  }
  const previousCount = K8S_MAPPING.resources[resource] || 0;

  K8S_MAPPING.resources[resource] = previousCount + value;
};

export const isKubectlInstalled = async () => {
  let installed = false;
  try {
    await execCommand("kubectl version --client");
    installed = true;
  } catch (err) {
    console.log("Failed to check if kubectl is installed");
  }
  return installed;
};
