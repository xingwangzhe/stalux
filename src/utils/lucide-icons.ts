/**
 * 导航等场景用到的 Lucide 图标静态映射。
 * 按需从 @lucide/astro 导入，避免整包 lucide 依赖。
 *
 * 新增图标：在下方 import 并写入 iconMap 即可（key 为 kebab-case，与 config.yml 一致）。
 * 图标列表: https://lucide.dev/icons/
 */
import type { AstroComponent } from "@lucide/astro";
import Airplay from "@lucide/astro/icons/airplay";
import Archive from "@lucide/astro/icons/archive";
import Folder from "@lucide/astro/icons/folder";
import House from "@lucide/astro/icons/house";
import Link from "@lucide/astro/icons/link";
import Menu from "@lucide/astro/icons/menu";
import Quote from "@lucide/astro/icons/quote";
import Search from "@lucide/astro/icons/search";
import Tag from "@lucide/astro/icons/tag";
import TrainFront from "@lucide/astro/icons/train-front";
import User from "@lucide/astro/icons/user";
import X from "@lucide/astro/icons/x";

/** config.yml 中 icon 字段（kebab-case）→ Astro 图标组件 */
export const iconMap: Record<string, AstroComponent> = {
    home: House,
    house: House,
    archive: Archive,
    folder: Folder,
    tag: Tag,
    quote: Quote,
    link: Link,
    user: User,
    "train-front": TrainFront,
    menu: Menu,
    search: Search,
    x: X,
    airplay: Airplay,
};

/**
 * 按 kebab-case 名称取图标组件；找不到时打日志并返回 null。
 */
export function getLucideIcon(iconName: string | undefined | null): AstroComponent | null {
    if (!iconName) return null;
    const Icon = iconMap[iconName];
    if (!Icon) {
        console.error(
            `lucide 图标 '${iconName}' 未找到，请在 src/utils/lucide-icons.ts 中添加映射`,
        );
        return null;
    }
    return Icon;
}
