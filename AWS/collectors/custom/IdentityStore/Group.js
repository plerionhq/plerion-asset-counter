import { queryIdentityStore } from "./service.js";

export const query = async (...args) => await queryIdentityStore(...args);
