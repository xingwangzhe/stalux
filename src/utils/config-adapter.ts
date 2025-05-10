// 导入默认配置
import {type SiteConfig} from '../types'
import { site as defaultConfig } from '../consts';
import { siteConfig,useConfig } from '../_config.ts'; // 导入默认配置



// 直接选择配置：如果用户配置模块 (userModule) 成功加载并且其包含 'site' 导出，则使用它。
// 否则，使用默认配置 (defaultConfig)。
export const config_site: SiteConfig = useConfig ?  siteConfig : defaultConfig ; 
