/** A clock tick or background fade cannot change declarative tool definitions. */
export function affectsDeclarativeTools(records: MutationRecord[]): boolean {
    const selector = "form[toolname],[form],label,slot";
    const containsTools = (node: Node): boolean => {
        if (!(node instanceof Element)) return false;
        if (Element.prototype.matches.call(node, selector)) return true;
        if (Element.prototype.querySelector.call(node, selector)) return true;
        // An already-created open shadow tree can be inserted along with its host.
        for (const element of [node, ...Element.prototype.querySelectorAll.call(node, "*")]) {
            if (Reflect.get(Element.prototype, "shadowRoot", element)) return true;
        }
        return false;
    };
    return records.some((record) => {
        if (
            record.type === "attributes" &&
            (record.attributeName === "form" || record.attributeName === "toolname")
        )
            return true;
        const element =
            record.target instanceof Element ? record.target : record.target.parentElement;
        if (element && Element.prototype.closest.call(element, selector)) return true;
        if (record.type === "childList")
            return [...record.addedNodes, ...record.removedNodes].some(containsTools);
        return false;
    });
}
