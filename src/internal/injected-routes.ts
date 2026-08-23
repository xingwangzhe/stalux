import { fileURLToPath } from "node:url";

import { ROUTE_DEFINITIONS } from "../utils/route-catalog";

export interface InjectedRoute {
    pattern: string;
    entrypoint: string;
}

export function createInjectedRoutes(baseDir: URL): InjectedRoute[] {
    return ROUTE_DEFINITIONS.map(({ pattern, source }) => ({
        pattern,
        entrypoint: fileURLToPath(new URL(source, baseDir)),
    }));
}
