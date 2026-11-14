/**
 * Type restoration for swup members we depend on but the package omits.
 *
 * `Visit.abort()` exists in swup 4.10.0's source (`src/modules/Visit.ts`) and is
 * marked `/** @internal *\/`, so it is stripped from the published
 * `dist/types/modules/Visit.d.ts`. The router genuinely needs it: superseding a
 * visit mid-navigation means marking the old one aborted, and no public API does
 * that.
 *
 * Declaring it here is the honest alternative to casting at the call site: the
 * compiler now checks the name and the signature everywhere, and there is exactly
 * one place to revisit when swup changes. Callers still guard with
 * `typeof visit.abort === "function"` so a future removal degrades to a no-op
 * instead of throwing in the middle of a navigation.
 *
 * Recheck on every swup upgrade:
 *   grep -n "@internal" node_modules/swup/src/modules/Visit.ts
 *   grep -n "abort" node_modules/swup/dist/types/modules/Visit.d.ts
 */

export {};

declare module "swup" {
    interface Visit {
        /**
         * Mark this visit aborted. Internal in 4.10.0; see the note above.
         * Not a public API: do not call it outside the router adapter.
         */
        abort(): void;
    }
    /**
     * Added by `@swup/route-name-plugin`, which `@swup/astro` instantiates from
     * its own package. The theme never imports the plugin, so its augmentation
     * has to be restored here for `visit.to.route` to typecheck.
     */
    interface VisitTo {
        route?: string;
    }
    interface Swup {
        /**
         * Added by `@swup/preload-plugin`, enabled through `@swup/astro`; used by
         * `route-prefetch.ts` to warm the main navigation routes.
         */
        preload?: (url: string, options?: { priority?: boolean }) => Promise<unknown>;
    }
}
