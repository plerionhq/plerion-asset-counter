import { queryOrganizations } from "./service.js";

export const query = async (...args) => await queryOrganizations(...args);
