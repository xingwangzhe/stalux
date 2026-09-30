export interface SearchDialogLike {
    open?: () => void;
}

export interface CustomElementRegistryLike<ElementType> {
    whenDefined(name: string): Promise<unknown>;
    upgrade(element: ElementType): void;
}

/** Promote the deferred stylesheet before showing a search dialog on a cold visit. */
export async function ensureSearchStyles(link: HTMLLinkElement | null): Promise<void> {
    if (!link) return;
    link.rel = "stylesheet";
    link.media = "all";
    if (link.sheet) return;
    await new Promise<void>((resolve, reject) => {
        const cleanup = () => {
            link.removeEventListener("load", loaded);
            link.removeEventListener("error", failed);
        };
        const loaded = () => {
            cleanup();
            resolve();
        };
        const failed = () => {
            cleanup();
            reject(new Error("Search stylesheet failed to load"));
        };
        link.addEventListener("load", loaded, { once: true });
        link.addEventListener("error", failed, { once: true });
    });
}

export async function upgradeAndOpenSearchDialog<ElementType extends SearchDialogLike>(
    registry: CustomElementRegistryLike<ElementType>,
    dialog: ElementType | null,
): Promise<void> {
    await registry.whenDefined("pagefind-modal");
    if (!dialog) return;
    registry.upgrade(dialog);
    dialog.open?.();
}
