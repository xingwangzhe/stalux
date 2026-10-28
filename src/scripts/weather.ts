export const WEATHER_TTL = 20 * 60 * 1000;
const CACHE_KEY = "stalux-weather-v1";
export interface WeatherData {
    city: string;
    ip?: string;
    temperature: number;
    apparent: number;
    code: number;
    updated: number;
}
export interface WeatherState {
    status: "loading" | "ready" | "error";
    data?: WeatherData;
}
type Listener = (state: WeatherState) => void;
/** One provider request; the only shape callers may assume is `unknown`. */
type GeoRequest = (url: string) => Promise<unknown>;

interface ApproximateLocation {
    city: string;
    lat: number;
    lon: number;
    ip?: string;
}

interface WeatherReading {
    temperature: number;
    apparent: number;
    code: number;
}

const invalidLocation = () => new Error("Invalid approximate location");

/**
 * Read one provider's answer into a location, or reject it.
 *
 * The two providers use different field names, so this is the only place that
 * knows either wire format; everything downstream sees ApproximateLocation.
 * Narrowing happens through `in` checks, so no value is ever asserted.
 */
function parseLocation(value: unknown): ApproximateLocation {
    if (typeof value !== "object" || value === null) throw invalidLocation();
    if ("error" in value && value.error) throw invalidLocation();
    if (!("city" in value) || typeof value.city !== "string" || !value.city.trim())
        throw invalidLocation();
    if (!("latitude" in value) || typeof value.latitude !== "number") throw invalidLocation();
    if (!("longitude" in value) || typeof value.longitude !== "number") throw invalidLocation();
    const lat = value.latitude;
    const lon = value.longitude;
    if (
        !(Number.isFinite(lat) && Number.isFinite(lon)) ||
        Math.abs(lat) > 90 ||
        Math.abs(lon) > 180
    )
        throw invalidLocation();
    const usableIp =
        "ip" in value &&
        typeof value.ip === "string" &&
        value.ip.length <= 45 &&
        /^[0-9a-f:.]+$/i.test(value.ip);
    return { city: value.city.trim(), lat, lon, ...(usableIp ? { ip: value.ip as string } : {}) };
}

/** Prefer the primary provider, fall back to the second one on any failure. */
async function resolveLocation(get: GeoRequest): Promise<ApproximateLocation> {
    try {
        return parseLocation(await get("https://api.ip.sb/geoip"));
    } catch {
        const fallback = await get("https://ipinfo.io/json");
        if (typeof fallback !== "object" || fallback === null) throw invalidLocation();
        const coordinates =
            "loc" in fallback && typeof fallback.loc === "string" ? fallback.loc.split(",") : [];
        const pair = coordinates.length === 2 ? coordinates : undefined;
        return parseLocation({
            city: "city" in fallback ? fallback.city : undefined,
            ip: "ip" in fallback ? fallback.ip : undefined,
            latitude: pair?.[0]?.trim() ? Number(pair[0]) : undefined,
            longitude: pair?.[1]?.trim() ? Number(pair[1]) : undefined,
            error: "error" in fallback ? fallback.error : undefined,
        });
    }
}

/**
 * Parse an untrusted value into weather data, or reject it.
 *
 * `in` narrowing keeps this assertion-free: the value stays `unknown` until each
 * field is proven, and the caller receives a domain type instead of a flag.
 */
function parseWeatherData(value: unknown): WeatherData | undefined {
    if (typeof value !== "object" || value === null) return undefined;
    if (!("city" in value) || typeof value.city !== "string") return undefined;
    const city = value.city;
    if (city.length === 0 || city.length >= 160) return undefined;
    let ip: string | undefined;
    if ("ip" in value && value.ip !== undefined) {
        if (
            typeof value.ip !== "string" ||
            value.ip.length > 45 ||
            !/^[0-9a-f:.]+$/i.test(value.ip)
        )
            return undefined;
        ip = value.ip;
    }
    if (!("temperature" in value)) return undefined;
    if (!("apparent" in value)) return undefined;
    if (!("code" in value)) return undefined;
    if (!("updated" in value)) return undefined;
    const temperature = finite(value.temperature);
    const apparent = finite(value.apparent);
    const code = finite(value.code);
    const updated = finite(value.updated);
    if (
        temperature === undefined ||
        apparent === undefined ||
        code === undefined ||
        updated === undefined
    )
        return undefined;
    return { city, ...(ip === undefined ? {} : { ip }), temperature, apparent, code, updated };
}

const finite = (value: unknown): number | undefined =>
    typeof value === "number" && Number.isFinite(value) ? value : undefined;

/** Read the three numbers the card shows, or reject the response. */
function parseReading(value: unknown): WeatherReading | undefined {
    if (typeof value !== "object" || value === null) return undefined;
    if (!("current" in value)) return undefined;
    const current = value.current;
    if (typeof current !== "object" || current === null) return undefined;
    const number = (key: "temperature_2m" | "apparent_temperature" | "weather_code") => {
        if (key === "temperature_2m" && "temperature_2m" in current)
            return finite(current.temperature_2m);
        if (key === "apparent_temperature" && "apparent_temperature" in current)
            return finite(current.apparent_temperature);
        if (key === "weather_code" && "weather_code" in current)
            return finite(current.weather_code);
    };
    const temperature = number("temperature_2m");
    const apparent = number("apparent_temperature");
    const code = number("weather_code");
    if (temperature === undefined || apparent === undefined || code === undefined) return undefined;
    return { temperature, apparent, code };
}

export function createWeatherClient({
    fetcher = fetch,
    storage,
    now = Date.now,
}: {
    fetcher?: typeof fetch;
    storage?: Pick<Storage, "getItem" | "setItem">;
    now?: () => number;
} = {}) {
    const listeners = new Set<Listener>();
    let data: WeatherData | undefined;
    let controller: AbortController | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let generation = 0;
    try {
        const cached = parseWeatherData(JSON.parse(storage?.getItem(CACHE_KEY) ?? "null"));
        if (cached && cached.updated <= now()) data = cached;
    } catch {
        /* Storage is optional. */
    }
    const emit = (status: WeatherState["status"]) => {
        for (const listener of listeners) listener({ status, data });
    };
    const stop = () => {
        generation++;
        controller?.abort();
        controller = undefined;
        clearTimeout(timer);
        timer = undefined;
    };
    const refresh = async (force = false) => {
        if (listeners.size === 0 || controller) return;
        clearTimeout(timer);
        if (!force && data && now() - data.updated < WEATHER_TTL) {
            emit("ready");
            timer = setTimeout(() => void refresh(), WEATHER_TTL - (now() - data.updated));
            return;
        }
        const token = ++generation;
        const request = new AbortController();
        controller = request;
        const timeout = setTimeout(() => request.abort(), 10000);
        timer = timeout;
        emit("loading");
        try {
            const get = async (endpoint: string): Promise<unknown> => {
                if (request.signal.aborted) throw new Error("Request cancelled");
                const response = await fetcher(endpoint, {
                    signal: request.signal,
                    credentials: "omit",
                    referrerPolicy: "no-referrer",
                });
                if (request.signal.aborted || !response.ok)
                    throw new Error("Weather service unavailable");
                return response.json();
            };
            const location = await resolveLocation(get);
            const { lat, lon } = location;
            const url = new URL("https://api.open-meteo.com/v1/forecast");
            url.search = new URLSearchParams({
                latitude: lat.toFixed(2),
                longitude: lon.toFixed(2),
                current: "temperature_2m,apparent_temperature,weather_code",
                timezone: "auto",
                forecast_days: "1",
            }).toString();
            const reading = parseReading(await get(url.href));
            if (!reading) throw new Error("Invalid weather response");
            if (token !== generation || request.signal.aborted) return;
            data = {
                city: location.city,
                ...(location.ip === undefined ? {} : { ip: location.ip }),
                ...reading,
                updated: now(),
            };
            try {
                storage?.setItem(CACHE_KEY, JSON.stringify(data));
            } catch {
                /* Private browsing. */
            }
            emit("ready");
            timer = setTimeout(() => void refresh(), WEATHER_TTL);
        } catch {
            if (token === generation) emit("error");
        } finally {
            clearTimeout(timeout);
            if (token === generation) controller = undefined;
        }
    };
    return {
        subscribe(listener: Listener) {
            listeners.add(listener);
            void refresh();
            return () => {
                listeners.delete(listener);
                if (listeners.size === 0) stop();
            };
        },
        refresh: () => void refresh(true),
    };
}

export function weatherDescription(code: number, lang: string): string {
    const zh = lang.startsWith("zh");
    const labels = zh
        ? ["晴", "少云", "多云", "阴", "雾", "毛毛雨", "雨", "雪", "雷雨", "天气未知"]
        : [
              "Clear",
              "Mostly clear",
              "Partly cloudy",
              "Overcast",
              "Fog",
              "Drizzle",
              "Rain",
              "Snow",
              "Thunderstorm",
              "Unknown",
          ];
    const index =
        code === 0
            ? 0
            : code === 1
              ? 1
              : code === 2
                ? 2
                : code === 3
                  ? 3
                  : [45, 48].includes(code)
                    ? 4
                    : [51, 53, 55, 56, 57].includes(code)
                      ? 5
                      : [61, 63, 65, 66, 67, 80, 81, 82].includes(code)
                        ? 6
                        : [71, 73, 75, 77, 85, 86].includes(code)
                          ? 7
                          : [95, 96, 99].includes(code)
                            ? 8
                            : 9;
    return labels[index] ?? labels[9] ?? "Unknown";
}

let client: ReturnType<typeof createWeatherClient> | undefined;
export function mountWeather() {
    const elements = [...document.querySelectorAll<HTMLElement>("[data-stalux-weather]")];
    if (elements.length === 0) return;
    if (!client) {
        let storage: Storage | undefined;
        try {
            storage = sessionStorage;
        } catch {
            /* Storage may be disabled. */
        }
        client = createWeatherClient({ storage });
    }
    const shared = client;
    const cleanups = elements.map((element) => {
        const output = element.querySelector<HTMLElement>("[data-weather-output]");
        const locationOutput = element.querySelector<HTMLElement>("[data-weather-location]");
        const status = element.querySelector<HTMLElement>("[data-weather-status]");
        const retry = element.querySelector<HTMLButtonElement>("[data-weather-retry]");
        if (!(output && status && retry)) return () => undefined;
        const zh = (element.dataset.lang ?? "zh-CN").startsWith("zh");
        let visible = !globalThis.IntersectionObserver;
        let unsubscribe: (() => void) | undefined;
        const render: Listener = ({ status: state, data }) => {
            element.dataset.weatherState = state;
            retry.hidden = state !== "error";
            output.textContent = data
                ? `${locationOutput ? (zh ? "天气：" : "Weather: ") : ""}${data.city} · ${weatherDescription(data.code, element.dataset.lang ?? "zh-CN")} · ${Math.round(data.temperature)}°C`
                : zh
                  ? "正在获取附近城市天气…"
                  : "Loading nearby weather…";
            if (locationOutput)
                locationOutput.textContent = data
                    ? `${zh ? "位置" : "Location"}：${data.city} · IP：${data.ip || (zh ? "暂不可用" : "Unavailable")}`
                    : zh
                      ? "访客 IP 与位置暂不可用"
                      : "Visitor IP and location unavailable";
            status.textContent =
                state === "error"
                    ? data
                        ? zh
                            ? "更新失败，显示上次天气"
                            : "Update failed; showing last weather"
                        : zh
                          ? "请稍后重试"
                          : "Please try again later"
                    : state === "loading"
                      ? zh
                          ? "正在更新"
                          : "Updating"
                      : data
                        ? `${zh ? "体感" : "Feels like"} ${Math.round(data.apparent)}°C · ${new Date(data.updated).toLocaleTimeString(zh ? "zh-CN" : "en", { hour: "2-digit", minute: "2-digit" })}`
                        : "";
            if (state === "error" && !data)
                output.textContent = zh ? "天气暂不可用" : "Weather unavailable";
        };
        const update = () => {
            if (visible && !document.hidden) {
                if (!unsubscribe) unsubscribe = shared.subscribe(render);
            } else {
                unsubscribe?.();
                unsubscribe = undefined;
            }
        };
        const observer = globalThis.IntersectionObserver
            ? new IntersectionObserver((entries) => {
                  visible = entries.some((entry) => entry.isIntersecting);
                  update();
              })
            : undefined;
        observer?.observe(element);
        const refresh = () => shared.refresh();
        retry.addEventListener("click", refresh);
        document.addEventListener("visibilitychange", update);
        update();
        return () => {
            unsubscribe?.();
            observer?.disconnect();
            retry.removeEventListener("click", refresh);
            document.removeEventListener("visibilitychange", update);
        };
    });
    return () => {
        for (const cleanup of cleanups) cleanup();
    };
}
