# 管理员头像业务需求文档

## 1. 目标与范围

- 目标：定义管理员头像在前端、后端、数据库、静态资源与运维侧的统一业务规则，避免实现分叉与联调歧义。
- 适用范围：管理端管理员模块（列表、编辑弹窗、当前登录管理员展示）。
- 不在范围：用户模块头像（`/user`）、手机端独立头像能力。

## 2. 角色与路径规则

### 2.1 普通管理员路径规则

- 普通管理员头像路径必须使用按管理员 id 分目录规则：
  - 小图：`/static/avatar/{id}/avatar_32.jpg`
  - 大图：`/static/avatar/{id}/avatar_128.jpg`
- 数据库存储路径应与上述规则一致，不允许混用旧命名（如 `admin_255_32.jpg`）。

### 2.2 supervisor 特殊规则（长期）

- `supervisor` 使用独立默认头像路径策略，不与普通管理员 id 分目录规则混用：
  - `supervisor_32.jpg`
  - `supervisor_128.jpg`
- 该规则为长期跨项目复用规则。

## 3. 存储归属与访问链路

### 3.1 存储归属

- 头像文件权威存储目录在后端主机：`/home/apiadmin/static/avatar/`。
- 前端工程目录 `public/static` 不承载业务上传头像落盘。

### 3.2 前端访问链路

- 浏览器访问统一使用代理路径：`/api/static/avatar/...`。
- 代理转发目标：后端静态服务 `/static/avatar/...`。
- 管理端域名显示的是代理入口，不代表文件存储在前端项目目录。

## 4. 上传需求

### 4.1 上传接口

- Method: `POST`
- Path: `/admin/{id}/avatar`
- Content-Type: `multipart/form-data`
- 字段：
  - `file`
  - `crop_x`
  - `crop_y`
  - `crop_size`
  - `original_width`
  - `original_height`

### 4.2 文件与图像处理规则

- 允许输入格式：bmp/jpg/jpeg/png。
- 最大大小：5MB。
- 服务端统一输出 jpg，两张尺寸：32x32 与 128x128。
- 路径写入按第 2.1 规则。

### 4.3 上传返回

- 必须返回：
  - `admin_id`
  - `avatar_small_url`
  - `avatar_large_url`
  - `avatar_version`
  - `avatar_updated_at`
- 前端约束：
  - 返回 `admin_id` 必须与请求 id 一致。
  - 不接受 `data:image/...` 作为持久化头像 URL。

## 5. 展示与缓存规则

### 5.1 展示位置

- 管理员列表显示 32x32。
- 编辑态显示 32 与 128 双预览。
- 左下角当前登录管理员头像应可独立加载，不依赖列表分页结果。

### 5.2 缓存刷新

- 头像 URL 必须支持版本参数（例如 `?v=avatar_version`）进行缓存击穿。
- 头像更新后应即时刷新列表、编辑态与当前登录管理员头像。

## 6. 数据库字段约束

- `public.admin` 至少包含：
  - `avatar_small_url`
  - `avatar_large_url`
  - `avatar_version`
  - `avatar_updated_at`
- 字段语义：
  - URL 字段存相对路径（`/static/avatar/...`）。
  - `avatar_version` 每次成功更新自增。
  - `avatar_updated_at` 记录服务端更新时间。

## 7. 删除管理员与头像清理

### 7.1 删除语义

- 删除管理员成功后，必须同步清理该管理员头像目录：`/home/apiadmin/static/avatar/{id}`。
- 目录不存在视为清理成功。
- 删除请求需幂等。

### 7.2 失败补偿

- 若管理员删除成功但目录删除失败：
  - 不回滚管理员删除。
  - 写入补偿任务（`pending/retrying/succeeded/failed`）。
  - 后台任务按退避策略重试。

### 7.3 日志审计要求

- 每次删除与补偿至少记录：
  - `request_id`
  - `operator_admin_id`
  - `target_admin_id`
  - `avatar_dir`
  - `result`
  - `error_type`
  - `error_message`
  - `duration_ms`

## 8. 联调与验收标准

### 8.1 正向验收

1. 上传成功后，后端目录存在对应文件。
2. 列表、编辑态、当前登录管理员头像同步更新。
3. 刷新后仍显示新头像。

### 8.2 异常验收

1. 非法格式、超大小、越界裁剪、无权限按预期报错。
2. 路径代理异常时能快速定位（`/api/static/...` 返回类型应为 `image/jpeg`）。
3. 删除管理员后目录被清理；失败时补偿可追踪。

### 8.3 一致性验收

- 三方一致：
  - 数据库 URL 字段
  - 后端磁盘文件
  - 前端实际可访问 URL

## 9. 运维巡检要求

- 每日巡检输出两类差异：
  - `orphan`: 磁盘有文件但数据库未引用。
  - `missing`: 数据库引用但磁盘缺失。
- 管理端巡检需包含“前端静态目录不得回流业务头像文件”的检查。

## 10. 发布与回滚

- 发布顺序：后端（含迁移/补偿）优先，前端后发。
- 回滚原则：
  - 前端优先回滚。
  - 后端保留字段兼容与补偿任务，避免回滚后产生不可追踪垃圾文件。
