// Route classification shared by SSR and the client router. The Astro View
// Transitions helpers that used to live here were removed together with the
// ClientRouter: Swup owns navigation and every cue, so route animation config
// and `view-transition-name` generation had no consumer left.
import { getRouteKind, type RouteKind } from "./public-routes";

export { getRouteKind, type RouteKind };
