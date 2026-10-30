import { sitePath } from "../utils/site-path";
import { createEnhancedSearch, type NativeSearch } from "./search-engine";

const base = import.meta.env.BASE_URL;
interface PagefindModule {
    createInstance: (options: Record<string, unknown>) => NativeSearch;
}
const moduleUrl = sitePath("pagefind/pagefind.js", base);
let modulePromise: Promise<PagefindModule> | undefined;
function loadNative(): Promise<PagefindModule> {
    if (!modulePromise) {
        modulePromise = import(/* @vite-ignore */ moduleUrl);
        void modulePromise?.catch(() => {
            modulePromise = undefined;
        });
    }
    return modulePromise as Promise<PagefindModule>;
}

/** Public Component UI bundle contract; no private instance fields or hooks are patched. */
export function createInstance(options: Record<string, unknown> = {}) {
    let native: Promise<NativeSearch> | undefined;
    const load = () => {
        if (!native) {
            native = loadNative().then((module) =>
                module.createInstance({
                    ranking: { pageLength: 0.4, termFrequency: 0.8 },
                    ...options,
                }),
            );
            void native.catch(() => {
                native = undefined;
            });
        }
        return native;
    };
    return createEnhancedSearch(load, base);
}
let instance: ReturnType<typeof createInstance> | undefined;
const shared = () => {
    instance ??= createInstance();
    return instance;
};
export const search = (...args: Parameters<NativeSearch["search"]>) => shared().search(...args);
export const options = (...args: Parameters<NativeSearch["options"]>) => shared().options(...args);
export const filters = () => shared().filters();
export const mergeIndex = (...args: Parameters<NativeSearch["mergeIndex"]>) =>
    shared().mergeIndex(...args);
