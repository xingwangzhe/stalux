import type { CSSObject, Rule, RuleContext } from "unocss";

/** Selector, reusable utilities, component differences, optional media/supports wrapper. */
export type StyleSpec = [string, string, CSSObject, string?];

export function selectorRules(feature: string, specs: StyleSpec[]): Rule[] {
    return [
        [
            new RegExp(`^stalux-style-${feature}-(\\d+)$`),
            async ([, index], context) => {
                const spec = specs[Number(index)];
                if (!spec) return;
                const [selector, utilities, differences, parent] = spec;
                const entries: CSSObject = {};
                for (const utility of utilities.split(/\s+/).filter(Boolean)) {
                    await expandUtility(utility, context, entries);
                }
                return {
                    ...entries,
                    ...differences,
                    [context.symbols.selector]: () => selector,
                    ...(parent
                        ? {
                              [context.symbols.variants]: [
                                  { parent: [parent, parentOrder(parent)] },
                              ],
                          }
                        : {}),
                    [context.symbols.sort]: Number(index),
                };
            },
            { layer: "components" },
        ],
    ];
}

// UnoCSS otherwise alphabetizes custom media wrappers, putting 900px after 600px.
// Keep broad max-width rules before narrower overrides and accessibility rules last.
function parentOrder(parent: string): number {
    const maximum = parent.match(/max-width:\s*(\d+)px/);
    const minimum = parent.match(/min-width:\s*(\d+)px/);
    if (maximum) return 10_000 - Number(maximum[1]);
    if (minimum) return 1_000 + Number(minimum[1]);
    if (parent.includes("prefers-reduced-motion")) return 20_000;
    if (parent === "@media print") return 21_000;
    return 500;
}

async function expandUtility(utility: string, context: RuleContext, entries: CSSObject) {
    const shortcut = await context.generator.expandShortcut(utility, context);
    if (shortcut) {
        for (const token of shortcut[0]) {
            if (typeof token !== "string") throw new Error(`Expected static utility: ${utility}`);
            await expandUtility(token, context, entries);
        }
        return;
    }
    const parsed = await context.generator.parseUtil(utility, context);
    if (!parsed?.length) throw new Error(`Unknown selector utility: ${utility}`);
    for (const rule of parsed) {
        if (typeof rule[2] === "string" || !Array.isArray(rule[2])) {
            throw new Error(`Selector utilities must produce declarations: ${utility}`);
        }
        for (const [property, value] of rule[2]) entries[property] = value;
    }
}
