import { queryIAMAccountAuthorization } from "./service.js";

export const query = async (...args) =>
  await queryIAMAccountAuthorization(...args);
