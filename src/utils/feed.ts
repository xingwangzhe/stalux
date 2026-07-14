import { toTimestamp, parseDate, isValid, formatInTimeZone } from "@utils/dayjs";
import { toMachineDateTime } from "@utils/semantic-time";
import { getPostDescriptions } from "@utils/word-count-utils";
import type { CollectionEntry } from "astro:content";

interface FeedConfig {
    timezone: string;
}

interface FeedItem {
    title: string;
    pubDate: Date;
    description: string;
    link: string;
    categories: string[];
    customData: string;
}

/**
 * 构建 RSS / Atom 共用的 feed 条目列表。
 * 两个端点的唯一差异是“更新时间”节点名（RSS 用 `atom:updated`，Atom 用 `updated`），
 * 通过 updatedTag 参数化，避免整文件复制。
 *
 * 性能：文章描述走共享缓存 getPostDescriptions()，避免每个端点各自渲染；
 * 排序用 updated ?? date 的时间戳做纯数字比较。
 */
export async function buildFeedItems(
    stalux: FeedConfig,
    posts: CollectionEntry<"posts">[],
    updatedTag: string,
): Promise<FeedItem[]> {
    const sortedPosts = [...posts].sort((a, b) => {
        const dateA = toTimestamp(b.data.updated || b.data.date);
        const dateB = toTimestamp(a.data.updated || a.data.date);
        return dateA - dateB;
    });

    const descriptions = await getPostDescriptions();
    return Promise.all(
        sortedPosts.map(async (post) => {
            const cached = descriptions.get(String(post.data.abbrlink));

            let customData = "";
            if (post.data.updated) {
                const parsed = parseDate(post.data.updated);
                if (isValid(parsed)) {
                    const updatedIso = formatInTimeZone(
                        parsed,
                        stalux.timezone,
                        "yyyy-MM-dd'T'HH:mm:ssXXX",
                    );
                    customData += `<${updatedTag}>${updatedIso}</${updatedTag}>`;
                }
            }
            if (post.data.cc) {
                customData += `<rights>${post.data.cc}</rights>`;
            }

            return {
                title: post.data.title,
                pubDate: new Date(toMachineDateTime(post.data.date, stalux.timezone)),
                description: cached?.desc || post.data.desc || "",
                link: `/posts/${post.data.abbrlink}/`,
                categories: post.data.categories || [],
                customData,
            };
        }),
    );
}
