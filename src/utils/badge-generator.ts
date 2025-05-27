/**
 * 徽章生成器工具
 * 基于 badge-maker 库生成徽章
 */
import { makeBadge } from 'badge-maker';
import type { BadgeOptions } from '../types';

/**
 * 生成徽章SVG
 * @param options 徽章选项
 * @returns 返回徽章SVG字符串
 */
export function generateBadge(options: BadgeOptions): string {
  try {
    const format = {
      label: options.label,
      message: options.message,
      color: options.color || 'blue',
      style: options.style || 'flat',
      labelColor: options.labelColor,
      logo: options.logo,
      logoWidth: options.logoWidth,
    };
    
    // 过滤掉未定义的属性
    Object.keys(format).forEach(key => {
      const typedKey = key as keyof typeof format;
      if (format[typedKey] === undefined) {
        delete format[typedKey];
      }
    });
      return makeBadge(format);
  } catch (error) {
    return '';
  }
}

/**
 * 将SVG字符串转为Data URL
 * @param svg SVG字符串
 * @returns data URL
 */
export function svgToDataUrl(svg: string): string {
  if (!svg) return '';
  const encoded = encodeURIComponent(svg)
    .replace(/'/g, '%27')
    .replace(/"/g, '%22');
  
  return `data:image/svg+xml,${encoded}`;
}