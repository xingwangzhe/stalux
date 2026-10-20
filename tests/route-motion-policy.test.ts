import { describe, expect, it } from "vitest";
import { getRouteMotionPreset } from "../src/utils/route-motion-policy";

const url = (path: string) => new URL(path, "https://example.com");
const paths = [
    "/",
    "/archives/",
    "/posts/a/",
    "/tags/",
    "/tags/a/",
    "/categories/",
    "/categories/a/",
    "/about/",
    "/links/",
    "/words/",
    "/404",
    "/standalone.html",
];
const presets = [
    "none",
    "fade",
    "enter",
    "up",
    "taxonomy",
    "previous",
    "next",
    "home",
    "restore",
    "error",
];

describe("route motion intent, independent of navigation and scrolling", () => {
    it("covers every category pair, including all twelve self loops", () => {
        for (const from of paths)
            for (const to of paths) {
                expect(presets).toContain(
                    getRouteMotionPreset({ from: url(from), to: url(to), navigationType: "push" }),
                );
            }
    });

    it.each(paths)("does not animate the identical route or its hash: %s", (path) => {
        for (const suffix of ["", "#heading"])
            expect(getRouteMotionPreset({ from: url(path), to: url(path + suffix) })).toBe("none");
    });

    it.each(["back", "forward"])(
        "restores history for %s instead of inventing hierarchy",
        (_direction) => {
            expect(
                getRouteMotionPreset({
                    from: url("/posts/a/"),
                    to: url("/archives/"),
                    navigationType: "traverse",
                }),
            ).toBe("restore");
        },
    );

    it.each([
        ["/archives/", "/posts/a/", "enter"],
        ["/posts/a/", "/archives/", "up"],
        ["/posts/a/", "/", "home"],
        ["/", "/about/", "enter"],
        ["/tags/a/", "/categories/a/", "taxonomy"],
        ["/tags/a/", "/tags/b/", "taxonomy"],
        ["/categories/a/", "/categories/", "up"],
        ["/posts/a/", "/posts/b/", "fade"],
        ["/about/", "/words/", "fade"],
        ["/about/", "/404", "error"],
        ["/404", "/archives/", "fade"],
        ["/standalone.html", "/posts/a/", "none"],
        ["/posts/a/", "/standalone.html", "none"],
    ])("%s → %s uses %s", (from, to, preset) => {
        expect(getRouteMotionPreset({ from: url(from), to: url(to), navigationType: "push" })).toBe(
            preset,
        );
    });

    it.each(["previous", "next"])(
        "uses %s only for an explicit article sequence control",
        (intent) => {
            expect(
                getRouteMotionPreset({ from: url("/posts/a/"), to: url("/posts/b/"), intent }),
            ).toBe(intent);
            expect(
                getRouteMotionPreset({ from: url("/archives/"), to: url("/posts/a/"), intent }),
            ).toBe("enter");
        },
    );

    it("gives accessibility, native gestures and replacement priority over decoration", () => {
        const context = { from: url("/posts/a/"), to: url("/posts/b/"), intent: "next" };
        for (const key of ["hidden", "reducedMotion", "browserMotion"] as const)
            expect(getRouteMotionPreset({ ...context, [key]: true })).toBe("none");
        expect(getRouteMotionPreset({ ...context, navigationType: "replace" })).toBe("fade");
        expect(getRouteMotionPreset({ ...context, to: new URL("https://external.example/") })).toBe(
            "none",
        );
    });

    it("does not interpret query-driven new content as an identical URL", () => {
        expect(
            getRouteMotionPreset({
                from: url("/archives/?filter=a"),
                to: url("/archives/?filter=b"),
            }),
        ).toBe("fade");
        expect(getRouteMotionPreset({ from: url("/posts/a"), to: url("/posts/a/") })).toBe("none");
    });
});
