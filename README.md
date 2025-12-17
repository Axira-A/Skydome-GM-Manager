# TRPG Game Master System (TRPGGMSys)

**TRPGGMSys** 是一个基于 React + Vite 构建的桌面角色扮演游戏（TRPG）主持人辅助系统。它旨在帮助 GM（游戏主持人）高效地管理角色状态、物品库存、战斗流程以及探索进度。系统采用赛博朋克/科幻风格设计，内置了基于 d10 骰池的规则计算引擎。

## 🛠️ 技术栈

- **核心框架**: React 18, TypeScript
- **构建工具**: Vite
- **状态管理**: Zustand (支持本地持久化存储)
- **UI 样式**: Tailwind CSS
- **图标库**: Lucide React
- **路由**: React Router DOM

## ✨ 主要功能

- **👥 角色管理 (Overview)**: 创建/编辑/删除角色，可视化生命值/侵蚀度，拖拽式装备与背包管理。
- **📦 库存系统**: 角色个人背包与全队共享资源箱，支持物品在不同容器与装备槽之间自由拖拽。
- **🗺️ 探索系统 (Map)**: 多层级地图（浅层/红森林/深空），基于权重的随机节点生成，内置属性检定掷骰器。
- **⚔️ 战斗模拟 (Combat)**: 回合制战斗追踪，自动计算伤害、护甲穿透、异常状态及侵蚀伤害。
- **⚙️ 规则配置 (Manager)**: 自定义物品、敌人、技能、异常状态及探索节点，构建专属游戏世界。

## 🚀 部署与安装指南

### 1. 环境准备

确保您的开发环境中已安装：
- **Node.js**: >= 16.0.0
- **npm** 或 **yarn**

### 2. 本地开发

```bash
# 1. 克隆仓库
git clone <repository-url>
cd TRPGGMSys

# 2. 安装依赖
npm install

# 3. 启动开发服务器
npm run dev
```

启动后，访问 `http://localhost:5173` 即可使用。

### 3. 生产环境构建与部署

本项目为纯前端静态应用（SPA），可以部署在任何静态网页托管服务上（如 GitHub Pages, Vercel, Netlify, Nginx 等）。

**构建步骤：**

```bash
# 执行构建命令
npm run build
```

构建完成后，会在项目根目录生成 `dist` 文件夹。

**部署方式：**

- **静态托管 (推荐)**: 将 `dist` 文件夹内的所有文件上传至 Web 服务器的根目录。
- **Nginx 配置示例**:
  ```nginx
  server {
      listen 80;
      server_name your-domain.com;
      root /path/to/dist;
      index index.html;

      location / {
          try_files $uri $uri/ /index.html;
      }
  }
  ```

## 📂 项目结构

```
src/
├── components/     # 通用组件 (Layout, Navbar)
├── i18n/           # 国际化翻译文件
├── pages/          # 主要页面 (Overview, Map, Combat, Manager)
├── store/          # Zustand 状态管理 (gameStore.ts)
├── types/          # TypeScript 类型定义
└── App.tsx         # 路由配置
```

## 💾 数据存储说明

本系统使用浏览器的 `LocalStorage` 进行数据持久化。
- **优点**: 无需后端数据库，刷新页面数据不丢失，纯本地运行保护隐私。
- **注意**: 清除浏览器缓存或使用无痕模式会导致数据丢失。建议定期在配置页面导出数据（如需迁移设备）。

## 🤝 贡献

欢迎提交 Issue 或 Pull Request 来改进此项目。

## 📄 许可证

MIT License
