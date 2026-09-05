import { describeError } from "../utils/diagnostics";

declare const __STALUX_DEBUG__: boolean;

/** Browser-only sink; not an Astro runtime logger and never forwarded to a server. */
interface ClientLogEnvironment {
    dev: boolean;
    detailed: boolean;
    sink: Pick<Console, "debug" | "warn" | "error">;
}

export function createClientLogger(
    scope: string,
    environment: ClientLogEnvironment = {
        dev: import.meta.env.DEV,
        get detailed() {
            return typeof __STALUX_DEBUG__ !== "undefined" && __STALUX_DEBUG__;
        },
        sink: console,
    },
) {
    const prefix = `[stalux/${scope}]`;
    return {
        debug(message: string) {
            if (environment.dev && environment.detailed) {
                environment.sink.debug(`${prefix} ${message}`);
            }
        },
        warn(message: string) {
            environment.sink.warn(`${prefix} ${message}`);
        },
        error(message: string, error: unknown) {
            environment.sink.error(`${prefix} ${message}: ${describeError(error)}`);
        },
    };
}
