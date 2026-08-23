import { describe, expect, it } from "vitest";

import { toUnicodeRange } from "../src/internal/font-slices";

describe("font slice CSS ranges", () => {
    it("uses valid CSS range syntax with one U+ prefix", () => {
        expect(
            toUnicodeRange([
                [0x20, 0x7e],
                [0x4e00, 0x5219],
            ]),
        ).toEqual(["U+0020-007E", "U+4E00-5219"]);
    });

    it("keeps a single code point as one descriptor", () => {
        expect(toUnicodeRange([[0x3000, 0x3000]])).toEqual(["U+3000"]);
    });
});
