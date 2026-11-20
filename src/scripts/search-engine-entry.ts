import { createOramaSearch } from "./search-engine";

// Search UI loads this public module for its own instance; WebMCP uses the default instance.
const engine = createOramaSearch(import.meta.env.BASE_URL);
export const createInstance = () => engine;
export const { search, options, filters } = engine;
