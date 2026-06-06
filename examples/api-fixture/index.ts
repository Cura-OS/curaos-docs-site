/**
 * In-repo TypeScript API fixture for the docs-site build.
 *
 * Exercises the TypeDoc + typedoc-plugin-markdown pipeline standalone so the
 * local gate proves API-docs generation without a real `@curaos/*` package.
 *
 * @packageDocumentation
 */

/** A CuraOS deployment profile. */
export type DeploymentProfile = "cloud" | "on-prem" | "hybrid" | "air-gap";

/** Options describing how a tenant's documentation site is served. */
export interface DocsHostingOptions {
  /** The deployment profile the docs are served under. */
  profile: DeploymentProfile;
  /** Whether the static output must render with zero network egress. */
  offline: boolean;
}

/**
 * Resolve whether a hosting configuration is air-gap safe.
 *
 * @param options - The hosting options.
 * @returns `true` when the configuration requires zero external egress.
 *
 * @example
 * ```ts
 * isAirGapSafe({ profile: "air-gap", offline: true }); // => true
 * ```
 */
export function isAirGapSafe(options: DocsHostingOptions): boolean {
  return options.profile === "air-gap" && options.offline;
}
