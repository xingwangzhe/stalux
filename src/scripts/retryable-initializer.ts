export function createRetryableInitializer(initialize: () => Promise<void>): () => Promise<void> {
    let pending: Promise<void> | undefined;

    return () => {
        if (!pending) {
            pending = initialize().catch((error: unknown) => {
                pending = undefined;
                throw error;
            });
        }
        return pending;
    };
}
