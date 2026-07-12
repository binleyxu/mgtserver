## 后端打通清单：管理员头像

关联复盘手册：
- [问题复盘手册（开发/联调）](docs/problem-retrospective-playbook.md)

本仓库是前端仓库，不包含后端源码。要让“保存头像”可用，后端必须实现上传接口并落库到 public.admin。

### 1. 数据库迁移（先做）
1. 执行 [scripts/db/migrations/20260712_add_admin_avatar_fields.up.sql](scripts/db/migrations/20260712_add_admin_avatar_fields.up.sql)
2. 验证字段存在：

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'admin'
  AND column_name IN (
    'avatar_small_url',
    'avatar_large_url',
    'avatar_version',
    'avatar_updated_at'
  )
ORDER BY column_name;
```

### 2. 后端接口（必须实现）
- Method: POST
- Path: /admin/{id}/avatar（当前后端已验证）
- 兼容路径：/api/admin/{id}/avatar（建议保持可用）
- Content-Type: multipart/form-data
- Form fields:
  - file
  - crop_x
  - crop_y
  - crop_size
  - original_width
  - original_height

### 3. 服务端处理规则
1. 校验鉴权与权限（仅管理员可改）
2. 校验文件类型（bmp/jpg/png）与大小（<=5MB）
3. 按裁剪参数裁切，输出 jpg 两张：32x32 和 128x128
4. 文件落盘：/static/avatar/{admin_id}/...
5. 更新 public.admin：
   - avatar_small_url
   - avatar_large_url
   - avatar_version（建议自增或毫秒时间戳）
   - avatar_updated_at（NOW()）

### 4. 建议返回（前端已按此解析）

```json
{
  "code": 200,
  "message": "头像上传成功",
  "data": {
    "admin_id": "254",
    "avatar_small_url": "/static/avatar/254/avatar_32.jpg",
    "avatar_large_url": "/static/avatar/254/avatar_128.jpg",
    "avatar_version": 1720780000000,
    "avatar_updated_at": "2026-07-12T04:58:00Z"
  }
}
```

### 5. 联调自检
1. 管理端编辑管理员 -> 编辑头像 -> 保存头像
2. 不应再出现 404 提示
3. 列表头像立即更新
4. 刷新页面后头像仍存在（说明后端落库成功）

### 6. 隐藏问题（必须检查）
1. 后端返回 `/static/avatar/...` 后，管理端域名下同路径可能被前端 SPA 回退拦截，返回 `text/html`。
2. 一旦出现该问题，页面会长期显示默认头像，看起来像“上传成功但不生效”。
3. 快速排查：
  - 后端直连检查：`http://192.168.0.206:8080/static/avatar/{admin_id}/avatar_32.jpg` 应返回 200 且 `image/jpeg`。
  - 管理端域名检查：`http://192.168.0.99:3000/static/avatar/{admin_id}/avatar_32.jpg` 也应返回 200 且 `image/jpeg`。
4. 若管理端域名返回 HTML：
  - 需要在管理端网关补齐 `/static/avatar/*` 到后端静态目录的转发规则。
  - 在代理修复前，不建议前端吞掉问题并静默展示默认图。
