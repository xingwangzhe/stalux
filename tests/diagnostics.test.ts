import { describe, expect, it, vi } from "vitest";

import { createClientLogger } from "../src/scripts/logger";
import { describeError, logDetail, logFailure } from "../src/utils/diagnostics";

function sink() {
    return { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() };
}

describe("diagnostic boundaries", () => {
    it.each([
        [true, true, 1],
        [true, false, 0],
        [false, true, 0],
        [false, false, 0],
    ])("browser detail requires dev=%s and detailed=%s", (dev, detailed, calls) => {
        const output = sink();
        const logger = createClientLogger("search", { dev, detailed, sink: output });
        logger.debug("loading UI");
        expect(output.debug).toHaveBeenCalledTimes(calls);
        if (calls) expect(output.debug).toHaveBeenCalledWith("[stalux/search] loading UI");
        logger.warn("script unavailable");
        expect(output.warn).toHaveBeenCalledWith("[stalux/search] script unavailable");
    });

    it("retains scope and the cause chain without URL credentials", () => {
        const output = sink();
        const error = new Error("lightbox failed", {
            cause: new Error("fetch https://example.com/module.js?token=private-token"),
        });
        const logger = createClientLogger("photoswipe", {
            dev: false,
            detailed: false,
            sink: output,
        });
        logger.error("initialization failed", error);
        const text = output.error.mock.calls[0]?.[0];
        expect(text).toContain("[stalux/photoswipe] initialization failed");
        expect(text).toContain("Caused by:");
        expect(text).toContain("module.js?[redacted]");
        expect(text).not.toContain("private-token");
    });

    it("handles non-Error throws and cyclic causes", () => {
        expect(describeError("token=abc password=def Bearer ghi")).toBe(
            "token=[redacted] password=[redacted] Bearer [redacted]",
        );
        const error = new Error("cycle");
        error.cause = error;
        expect(describeError(error).match(/Error: cycle/g)).toHaveLength(1);
        expect(describeError(null)).toBe("null");
    });

    it("uses the supplied Astro logger without falling back to console", () => {
        const output = sink();
        logFailure(output, "word-count", "calculation failed", "bad metadata");
        expect(output.error).toHaveBeenCalledWith(
            "[stalux/word-count] calculation failed: bad metadata",
        );
        const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
        try {
            logFailure(undefined, "word-count", "calculation failed", "bad metadata");
            expect(consoleSpy).not.toHaveBeenCalled();
            logDetail(output, "content", "cache hit");
            expect(output.info).not.toHaveBeenCalled();
        } finally {
            consoleSpy.mockRestore();
        }
    });
});
