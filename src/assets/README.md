# src/assets 使用说明

此目录仅放置“前端源码编译期资源”。

## 放这里的资源

- 通过 `import` 在 TS/TSX 中使用的图片、svg、icon。
- 菜单图标、页面 logo、组件内默认占位图。

## 不放这里的资源

- 需要稳定 URL（例如 `/static/...`）对外访问的文件。
- 后端上传/生成的运行时文件。

## 使用方式

- 推荐：`import iconUrl from '@/assets/xxx.svg?url'`
- 推荐：统一使用 `@/assets` 别名，避免跨层级相对路径。

详细规范见：`docs/asset-placement-conventions.md`
