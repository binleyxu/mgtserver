# 前端资源目录放置规范

## 目标

- 明确区分 `src/assets` 与 `public/static` 的职责。
- 降低 logo、icon、svg、avatar 等资源混放导致的维护成本。

## 目录职责

### `src/assets`

用于**前端源码编译期资源**，通过 TS/TSX `import` 引入。

典型特征：
- 在代码里通过 `import xxx from '@/assets/xxx.svg?url'` 使用。
- 参与 Vite 构建，产物会带 hash（缓存友好）。
- 适合 UI 图标、菜单图标、品牌图、前端默认占位图。

应该放：
- 导航图标（如 `admin-icon.svg`、`country-globe.svg`）。
- 页面内装饰图、品牌图（如 `logo.jpg`）。
- 仅前端使用的默认占位图（如 `admin/avatar-fallback.svg`）。

不应该放：
- 需要通过固定 URL 对外访问的文件。
- 后端上传/生成、需要长期稳定路径的文件。

### `public/static`

用于**运行时静态文件**，通过绝对 URL（如 `/static/...`）访问。

典型特征：
- 在代码里直接写字符串路径：`/static/avatar/supervisor_32.jpg`。
- 构建时不会改名，不加 hash，路径稳定。
- 适合后端/运维协同资源、上传后的公开文件、固定外链。

应该放：
- 默认头像、上传头像、导入模板、需稳定 URL 的资源。
- 需要被后端响应体直接引用的静态文件。

不应该放：
- 仅在前端组件里 `import` 的 UI 图标。

## 当前项目盘点（2026-07-12）

### 已符合 `src/assets` 职责（代码在用）

- `admin-icon.svg`
- `country-globe.svg`
- `region-management.svg`
- `role-management-action.svg`
- `logo.jpg`
- `admin/avatar-fallback.svg`

### 已符合 `public/static` 职责（代码在用）

- `avatar/supervisor_32.jpg`
- `avatar/supervisor_128.jpg`

### 待清理候选（当前未检索到引用）

当前批次清理后，`src/assets` 暂无未引用候选。

## 命名建议

- UI 图标统一后缀：`*-icon.svg`。
- 业务动作图标统一后缀：`*-action.svg`。
- 默认资源统一前缀：`default-*`（例如 `default-avatar-32.jpg`）。
- 避免 `source`、`final2`、`new` 等临时命名长期留在主目录。

## 代码使用建议

- `src/assets` 统一使用别名导入：`@/assets/...`。
- `public/static` 统一使用根路径：`/static/...`。
- 禁止在 `src/assets` 中放置“仅靠 URL 直接访问”的运行时文件。
