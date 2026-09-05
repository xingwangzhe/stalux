import type { AstroRuntimeLogger } from "astro";

declare const __STALUX_DEBUG__: boolean;

/** Shared formatting only: this module never owns a logger or imports Node APIs. */
export function describeError(error: unknown): string {
    const parts: string[] = [];
    const seen = new Set<unknown>();
    let current = error;
    for (let depth = 0; depth < 5 && !seen.has(current); depth++) {
        seen.add(current);
        parts.push(
            current instanceof Error
                ? current.stack || `${current.name}: ${current.message}`
                : String(current),
        );
        if (!(current instanceof Error) || current.cause === undefined) break;
        current = current.cause;
    }
    const text = parts.join("\nCaused by: ");
    return text
        .replace(/(https?:\/\/[^\s?#]+)[?#][^\s)]+/g, "$1?[redacted]")
        .replace(/(Bearer\s+)[^\s]+/gi, "$1[redacted]")
        .replace(/((?:token|password|secret|api[_-]?key)\s*[=:]\s*)[^\s,;]+/gi, "$1[redacted]");
}

/** Runtime loggers have no debug method. Detail is opt-in, then sent through official info. */
export function logDetail(
    logger: AstroRuntimeLogger | undefined,
    scope: string,
    message: string,
): void {
    if (typeof __STALUX_DEBUG__ !== "undefined" && __STALUX_DEBUG__) {
        logger?.info(`[stalux/${scope}] ${message}`);
    }
}

export function logFailure(
    logger: AstroRuntimeLogger | undefined,
    scope: string,
    message: string,
    error: unknown,
): void {
    logger?.error(`[stalux/${scope}] ${message}: ${describeError(error)}`);
}
