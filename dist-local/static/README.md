# public/static 使用说明

此目录仅放置“运行时静态资源”，通过固定 URL 访问。

## 放这里的资源

- 需要以 `/static/...` 直接访问的文件。
- 后端返回 URL 会直接引用的资源（如头像、模板等）。
- 不希望构建时改名（不加 hash）的静态文件。

## 不放这里的资源

- 仅在前端源码中 `import` 的 UI 图标与装饰图。

## 使用方式

- 推荐：在代码中直接使用 `/static/xxx`。
- 示例：`/static/avatar/supervisor_32.jpg`

详细规范见：`docs/asset-placement-conventions.md`
