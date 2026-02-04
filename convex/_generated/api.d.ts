/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as customers_crud from "../customers/crud.js";
import type * as myFunctions from "../myFunctions.js";
import type * as orgs_create from "../orgs/create.js";
import type * as orgs_get from "../orgs/get.js";
import type * as users_create from "../users/create.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "customers/crud": typeof customers_crud;
  myFunctions: typeof myFunctions;
  "orgs/create": typeof orgs_create;
  "orgs/get": typeof orgs_get;
  "users/create": typeof users_create;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
