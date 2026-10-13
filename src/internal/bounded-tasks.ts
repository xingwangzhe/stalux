/** Work-conserving queue: one slow task never stalls the other workers. */
export async function forEachBounded<T>(
    items: readonly T[],
    concurrency: number,
    task: (item: T) => Promise<unknown>,
): Promise<void> {
    if (!Number.isInteger(concurrency) || concurrency < 1)
        throw new RangeError("Concurrency must be a positive integer");
    let cursor = 0;
    let failed = false;
    const worker = async () => {
        while (!failed && cursor < items.length) {
            const item = items[cursor++] as T;
            try {
                await task(item);
            } catch (error) {
                failed = true;
                throw error;
            }
        }
    };
    // Wait for active tasks to settle before returning a failure to the build.
    const results = await Promise.allSettled(
        Array.from({ length: Math.min(concurrency, items.length) }, worker),
    );
    const failure = results.find((result) => result.status === "rejected");
    if (failure?.status === "rejected") throw failure.reason;
}
