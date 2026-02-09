/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as assignments_mutations from "../assignments/mutations.js";
import type * as assignments_queries from "../assignments/queries.js";
import type * as billing_actions from "../billing/actions.js";
import type * as billing_queries from "../billing/queries.js";
import type * as customers_crud from "../customers/crud.js";
import type * as http from "../http.js";
import type * as invitations_internal from "../invitations/internal.js";
import type * as invitations_manage from "../invitations/manage.js";
import type * as invitations_queries from "../invitations/queries.js";
import type * as invitations_send from "../invitations/send.js";
import type * as lemonsqueezy_plans from "../lemonsqueezy/plans.js";
import type * as lemonsqueezy_signature from "../lemonsqueezy/signature.js";
import type * as lemonsqueezy_sync from "../lemonsqueezy/sync.js";
import type * as lemonsqueezy_webhook from "../lemonsqueezy/webhook.js";
import type * as myFunctions from "../myFunctions.js";
import type * as orgs_create from "../orgs/create.js";
import type * as orgs_get from "../orgs/get.js";
import type * as orgs_update from "../orgs/update.js";
import type * as users_create from "../users/create.js";
import type * as users_manage from "../users/manage.js";
import type * as users_queries from "../users/queries.js";
import type * as users_sync from "../users/sync.js";
import type * as webhooks_workos from "../webhooks/workos.js";
import type * as workos_createOrg from "../workos/createOrg.js";
import type * as workos_storeOrg from "../workos/storeOrg.js";
import type * as workos_updateOrg from "../workos/updateOrg.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "assignments/mutations": typeof assignments_mutations;
  "assignments/queries": typeof assignments_queries;
  "billing/actions": typeof billing_actions;
  "billing/queries": typeof billing_queries;
  "customers/crud": typeof customers_crud;
  http: typeof http;
  "invitations/internal": typeof invitations_internal;
  "invitations/manage": typeof invitations_manage;
  "invitations/queries": typeof invitations_queries;
  "invitations/send": typeof invitations_send;
  "lemonsqueezy/plans": typeof lemonsqueezy_plans;
  "lemonsqueezy/signature": typeof lemonsqueezy_signature;
  "lemonsqueezy/sync": typeof lemonsqueezy_sync;
  "lemonsqueezy/webhook": typeof lemonsqueezy_webhook;
  myFunctions: typeof myFunctions;
  "orgs/create": typeof orgs_create;
  "orgs/get": typeof orgs_get;
  "orgs/update": typeof orgs_update;
  "users/create": typeof users_create;
  "users/manage": typeof users_manage;
  "users/queries": typeof users_queries;
  "users/sync": typeof users_sync;
  "webhooks/workos": typeof webhooks_workos;
  "workos/createOrg": typeof workos_createOrg;
  "workos/storeOrg": typeof workos_storeOrg;
  "workos/updateOrg": typeof workos_updateOrg;
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
