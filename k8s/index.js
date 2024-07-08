import path from "path";
import { readFileSync } from "fs";
import jp from "jsonpath";

import { execCommand } from "../utils/index.js";

const K8S_MAPPING = { total: 0, resources: {} };

const supportedKubernetesResources = JSON.parse(
  readFileSync(path.join(process.cwd(), "k8s/k8-resources.json")),
);

const getContainers = (resources, resourceName) => {
  if (!resources.length) {
    return [];
  }

  const containerPathMap = {
    pods: "$..spec.containers[*].image",
    cronjobs: "$..spec.jobTemplate.spec.template.spec.containers[*].image",
    default: "$..spec.template.spec.containers[*].image",
  };

  return jp.query(
    resources,
    containerPathMap[resourceName] || containerPathMap.default,
  );
};

const getResourcesToQuery = (requestedResources) => {
  const allK8sResources = Object.entries(supportedKubernetesResources).map(
    ([, k8Resource]) => k8Resource,
  );

  let resourcesToQuery = allK8sResources;

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
          !acc.validResources
            .map((resource) => resource.name)
            .includes(validResource.name) &&
            acc.validResources.push(validResource);
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

const getOwnerLessPods = (pods) => {
  return pods.filter((podsDescription) => {
    const ownerReferences = podsDescription.metadata.ownerReferences;
    if (!ownerReferences) return true;

    return ownerReferences.some(
      (ownerReference) => ownerReference.kind === "Node",
    );
  });
};

export const queryKubernetes = async (requestedResources, verbose) => {
  const resourcesToQuery = getResourcesToQuery(requestedResources);

  for (const k8sResource of resourcesToQuery) {
    const resourceName = k8sResource.name;
    try {
      console.log(`querying ${resourceName}`);
      const resourceResponse = await execCommand(
        `kubectl get ${resourceName} --all-namespaces -o json`,
        true,
      );
      let resources = [];
      if (resourceName === "pods") {
        resources = getOwnerLessPods(resourceResponse.items);
      } else {
        resources = resourceResponse.items;
      }
      updateResourceCounter(
        K8S_MAPPING,
        resourceName,
        "KSPM",
        resources.length,
      );
      K8S_MAPPING.total += resources.length;

      if (k8sResource.isWorkload) {
        const containers = getContainers(resources, resourceName);
        updateResourceCounter(
          K8S_MAPPING,
          resourceName,
          "CWPP",
          containers.length,
        );
        K8S_MAPPING.total += containers.length;
      }
    } catch (err) {
      console.log(`Error fetching resource detail of ${resourceName}`);
      verbose && console.log(err);
    }
  }

  return K8S_MAPPING;
};

export const updateResourceCounter = (K8S_MAPPING, resource, type, value) => {
  if (typeof value !== "number") {
    console.log(`${resource} DID NOT RECEIVE NUMBER FOR VALUE`);
    process.exit(1);
  }
  if (!K8S_MAPPING.resources[resource]) {
    K8S_MAPPING.resources[resource] = {};
  }
  const previousCount = K8S_MAPPING.resources[resource][type] || 0;

  K8S_MAPPING.resources[resource][type] = previousCount + value;
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
