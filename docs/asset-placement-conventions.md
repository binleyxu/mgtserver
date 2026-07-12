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
- `password-security-reset-icon.svg`

### 已符合 `public/static` 职责（代码在用）

- `avatar/avatar-fallback.jpg`
- `avatar/supervisor_32.jpg`
- `avatar/supervisor_128.jpg`

## 隐藏问题记录（头像链路，2026-07-13）

### 问题现象

- 后端头像上传接口返回了相对路径 `/static/avatar/{admin_id}/avatar_32.jpg` 与 `/static/avatar/{admin_id}/avatar_128.jpg`。
- 但在管理端域名 `http://192.168.0.99:3000` 访问同路径时，返回 `text/html`（前端页面）而不是 `image/jpeg`。

### 根因

- 管理端服务层未把 `/static/avatar/*` 正确转发到后端静态资源服务，导致 SPA 回退到 `index.html`。

### 正确做法

- 保持后端返回相对路径 `/static/avatar/...`（推荐）。
- 在管理端网关/代理层增加规则：`/static/avatar/*` 转发到后端 `http://192.168.0.206:8080/static/avatar/*`。
- 若无法快速改代理，可临时让后端返回绝对地址（跨域方案），但不作为首选长期方案。

### 验收标准

- `http://192.168.0.99:3000/static/avatar/254/avatar_32.jpg` 返回 200 且 `Content-Type: image/jpeg`。
- 页面管理员头像显示上传后的真实头像，而不是长期停留在默认占位图。

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
