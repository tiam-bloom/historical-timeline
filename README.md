# 历史时间线

按时代、类型和重要等级梳理中国与世界历史中的关键事件。

## 功能

- **双历史范围**：中国历史与世界历史分栏展示
- **多维筛选**：按类型、重要等级、时期、涉及人物过滤事件
- **等比例时间轴**：事件按实际年份比例排列，支持横向/纵向两种视图
- **缩放控制**：50%–300% 范围内自由缩放时间轴
- **紧凑模式**：隐藏事件描述，仅显示事件名
- **事件详情**：点击卡片查看完整信息、历史影响及评论

## 技术栈

- [React 18](https://react.dev/) + [Vite 5](https://vite.dev/)
- [Lucide React](https://lucide.dev/) 图标库

## 快速开始

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 构建生产版本
pnpm build
```

## 项目结构

```
├── index.html
├── package.json
├── vite.config.js
└── src/
    ├── main.jsx          # 入口文件
    ├── App.jsx            # 应用逻辑与组件
    ├── styles.css         # 全局样式
    └── data/
        ├── events.js      # 筛选常量与数据聚合
        ├── china.json     # 中国历史事件数据
        └── world.json     # 世界历史事件数据
```
