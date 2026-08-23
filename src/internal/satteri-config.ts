import type { HastPluginEntry, MdastPluginEntry } from "satteri";

export interface SatteriProcessorOptions {
    mdastPlugins: MdastPluginEntry[];
    hastPlugins: HastPluginEntry[];
    features: Record<string, unknown>;
}

interface SatteriProcessor {
    name?: string;
    options?: Partial<SatteriProcessorOptions>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

function pluginName(plugin: unknown): string | undefined {
    if ((isRecord(plugin) || typeof plugin === "function") && "name" in plugin) {
        const name = plugin.name;
        return typeof name === "string" && name.length > 0 ? name : undefined;
    }
    return undefined;
}

export function appendUniquePlugin<T>(list: T[], plugin: T, seen: Set<string>): void {
    const name = pluginName(plugin);
    if (name) {
        if (seen.has(name)) return;
        seen.add(name);
    }
    list.push(plugin);
}

export function prepareSatteriProcessor(processor: unknown): SatteriProcessorOptions | undefined {
    if (!isRecord(processor) || processor.name !== "satteri") return undefined;

    const typedProcessor = processor as SatteriProcessor;
    const partialOptions = typedProcessor.options ?? {};
    const options: SatteriProcessorOptions = {
        mdastPlugins: [...(partialOptions.mdastPlugins ?? [])],
        hastPlugins: [...(partialOptions.hastPlugins ?? [])],
        features: { ...(partialOptions.features ?? {}) },
    };
    for (const key of ["math", "frontmatter", "gfm", "smartPunctuation"]) {
        if (options.features[key] !== false) options.features[key] = true;
    }
    typedProcessor.options = options;
    return options;
}

export function collectPluginNames(options: SatteriProcessorOptions): Set<string> {
    const names = new Set<string>();
    for (const plugin of [...options.mdastPlugins, ...options.hastPlugins]) {
        const name = pluginName(plugin);
        if (name) names.add(name);
    }
    return names;
}
