import { describe, expect, it } from "vitest";
import { forEachBounded } from "../src/internal/bounded-tasks";

describe("bounded task queue", () => {
    it("keeps idle workers busy while a slow task remains pending", async () => {
        let release = () => {};
        const blocked = new Promise<void>((resolve) => {
            release = resolve;
        });
        let active = 0;
        let peak = 0;
        const started: number[] = [];
        const run = forEachBounded([0, 1, 2, 3, 4, 5, 6], 4, async (item) => {
            started.push(item);
            active++;
            peak = Math.max(peak, active);
            if (item === 0) await blocked;
            else await Promise.resolve();
            active--;
        });
        for (let index = 0; index < 12; index++) await Promise.resolve();
        expect(started).toEqual([0, 1, 2, 3, 4, 5, 6]);
        expect(active).toBe(1);
        expect(peak).toBeLessThanOrEqual(4);
        release();
        await run;
        expect(active).toBe(0);
    });

    it("stops scheduling on error and waits for already running work", async () => {
        let release = () => {};
        const blocked = new Promise<void>((resolve) => {
            release = resolve;
        });
        const started: number[] = [];
        let settled = false;
        const run = forEachBounded([0, 1, 2, 3], 2, async (item) => {
            started.push(item);
            if (item === 0) await blocked;
            else throw new Error("failed task");
        });
        const failure = run.catch((error: Error) => {
            settled = true;
            return error.message;
        });
        for (let index = 0; index < 8; index++) await Promise.resolve();
        expect(started).toEqual([0, 1]);
        expect(settled).toBe(false);
        release();
        expect(await failure).toBe("failed task");
        await expect(forEachBounded([], 0, async () => {})).rejects.toThrow(RangeError);
        await expect(forEachBounded([], 4, async () => {})).resolves.toBeUndefined();
    });
});
