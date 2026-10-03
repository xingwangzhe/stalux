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
export type WeatherState = { status: "loading" | "ready" | "error"; data?: WeatherData };
type Listener = (state: WeatherState) => void;

function validData(value: unknown): value is WeatherData {
    if (!value || typeof value !== "object") return false;
    const data = value as WeatherData;
    return (
        typeof data.city === "string" &&
        data.city.length > 0 &&
        data.city.length < 160 &&
        (data.ip === undefined ||
            (typeof data.ip === "string" &&
                data.ip.length <= 45 &&
                /^[0-9a-f:.]+$/i.test(data.ip))) &&
        [data.temperature, data.apparent, data.code, data.updated].every(Number.isFinite)
    );
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
        const cached: unknown = JSON.parse(storage?.getItem(CACHE_KEY) ?? "null");
        if (validData(cached) && cached.updated <= now()) data = cached;
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
        if (!listeners.size || controller) return;
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
            const get = async (url: string) => {
                if (request.signal.aborted) throw new Error("Request cancelled");
                const response = await fetcher(url, {
                    signal: request.signal,
                    credentials: "omit",
                    referrerPolicy: "no-referrer",
                });
                if (request.signal.aborted || !response.ok)
                    throw new Error("Weather service unavailable");
                return response.json();
            };
            const validateLocation = (location: {
                city?: unknown;
                latitude?: unknown;
                longitude?: unknown;
                ip?: unknown;
                error?: unknown;
            }) => {
                const lat = location.latitude;
                const lon = location.longitude;
                if (
                    location.error ||
                    typeof location.city !== "string" ||
                    !location.city.trim() ||
                    typeof lat !== "number" ||
                    typeof lon !== "number" ||
                    !Number.isFinite(lat) ||
                    !Number.isFinite(lon) ||
                    Math.abs(lat) > 90 ||
                    Math.abs(lon) > 180
                )
                    throw new Error("Invalid approximate location");
                const ip =
                    typeof location.ip === "string" &&
                    location.ip.length <= 45 &&
                    /^[0-9a-f:.]+$/i.test(location.ip)
                        ? location.ip
                        : undefined;
                return { city: location.city.trim(), lat, lon, ip };
            };
            let location: ReturnType<typeof validateLocation>;
            try {
                location = validateLocation(await get("https://api.ip.sb/geoip"));
            } catch {
                const info = await get("https://ipinfo.io/json");
                const coordinates = typeof info.loc === "string" ? info.loc.split(",") : [];
                location = validateLocation({
                    city: info.city,
                    ip: info.ip,
                    latitude:
                        coordinates.length === 2 && coordinates[0]?.trim()
                            ? Number(coordinates[0])
                            : undefined,
                    longitude:
                        coordinates.length === 2 && coordinates[1]?.trim()
                            ? Number(coordinates[1])
                            : undefined,
                    error: info.error,
                });
            }
            const { lat, lon } = location;
            const url = new URL("https://api.open-meteo.com/v1/forecast");
            url.search = new URLSearchParams({
                latitude: lat.toFixed(2),
                longitude: lon.toFixed(2),
                current: "temperature_2m,apparent_temperature,weather_code",
                timezone: "auto",
                forecast_days: "1",
            }).toString();
            const weather = await get(url.href);
            const current = weather.current;
            const next: WeatherData = {
                city: location.city.trim(),
                ip: location.ip,
                temperature: current?.temperature_2m,
                apparent: current?.apparent_temperature,
                code: current?.weather_code,
                updated: now(),
            };
            if (!validData(next)) throw new Error("Invalid weather response");
            if (token !== generation || request.signal.aborted) return;
            data = next;
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
                if (!listeners.size) stop();
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
    if (!elements.length) return;
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
        if (!output || !status || !retry) return () => {};
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
