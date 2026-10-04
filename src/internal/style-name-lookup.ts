/** Dictionary access must not resolve inherited names such as constructor or toString. */
export function styleNameIn(table: Record<string, string>, name: string): string | undefined {
    return Object.hasOwn(table, name) ? table[name] : undefined;
}
