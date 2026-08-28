export interface SearchDialogLike {
    open?: () => void;
}

export interface CustomElementRegistryLike<ElementType> {
    whenDefined(name: string): Promise<unknown>;
    upgrade(element: ElementType): void;
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
