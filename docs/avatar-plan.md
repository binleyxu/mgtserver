## Plan: Admin Avatar 实施工单版

本计划将 avatar 作为 admin 下独立子模块交付，入口固定在管理员编辑页按钮弹窗。上传仅接受 bmp/jpg/png，服务端统一转 jpg，并输出 32x32 与 128x128 两个尺寸。以下工单可直接分配执行。

新增约束：新创建管理员若未上传头像，系统必须自动使用灰色人头默认头像（small=32，large=128）。

### Steps
1. Phase A 工单准备（半天）
1.1 明确角色分工：前端负责人、后端负责人、联调负责人。
1.2 冻结接口字段与错误码，避免并行开发期间反复改契约。
1.3 建立联调环境检查表：前端域名、后端域名、静态目录权限、数据库迁移权限。

2. Phase B 前端工单（2.0~2.5 天）
2.1 FE-01 目录与出口工单
- 在 admin 下创建 avatar 独立子模块目录。
- 新增出口文件并在 admin 主模块按需引用。
- 完成后标准：avatar 逻辑不散落在 admin 主业务文件中。

2.2 FE-02 类型与服务工单
- 扩展管理员类型字段：small/large/version/updatedAt。
- 新增头像上传服务函数，使用 multipart 上传。
- 完成后标准：管理员列表与详情映射包含头像字段。

2.3 FE-03 弹窗裁剪工单
- 实现 AvatarUploadModal，支持选择文件、拖拽正方形裁剪、缩放、双预览。
- 预览尺寸固定为 32 和 128。
- 完成后标准：前端预览可稳定复现用户选区。

2.4 FE-04 编辑页接入工单
- 在管理员编辑流程增加编辑头像按钮。
- 点击按钮打开头像弹窗，提交成功后回写当前编辑态并刷新列表。
- 完成后标准：不新增设置页入口。

2.5 FE-05 异常处理工单
- 对格式、大小、越界、无权限、网络错误做明确提示。
- 完成后标准：失败时弹窗保持现场，用户可直接重试。

3. Phase C 后端工单（2.0~2.5 天）
3.1 BE-01 PostgreSQL migration 工单
- 为 admin 表增加头像字段。
- 提供 up/down 脚本。
- 完成后标准：迁移可重复执行、可回滚。

3.2 BE-02 上传接口工单
- 新增 POST /admin/{id}/avatar。
- 校验 token、权限、文件类型、文件大小、裁剪参数边界。
- 完成后标准：非法请求返回明确业务错误码。

3.3 BE-03 图像处理工单
- 解码 bmp/jpg/png，按裁剪参数截取。
- 输出 jpg 两张：32x32、128x128。
- 完成后标准：输出尺寸精确、质量参数固定。

3.4 BE-04 文件存储与静态路由工单
- 写入项目目录 uploads/avatar/{admin_id}/。
- 挂载 /static/avatar 访问路径。
- 完成后标准：URL 可直接访问，服务账号具备写权限。

3.5 BE-05 列表与详情扩展工单
- admin/list 与 admin/{id} 增加头像字段。
- 保持现有信封结构。
- 完成后标准：前端无需额外适配旧字段语义。

3.6 BE-06 新建管理员默认头像工单
- 创建默认灰色人头头像资源：default_32.jpg 与 default_128.jpg。
- 新建管理员若未上传头像，后端自动写入默认头像 URL 到 avatar_small_url/avatar_large_url。
- 完成后标准：新建管理员立即有头像，列表与编辑态不出现空头像。

4. Phase D 联调工单（1.0~1.5 天）
4.1 INT-01 正向链路联调
- 编辑页打开弹窗，上传并裁剪后保存成功。
- 列表显示 small，编辑态显示 large。

4.2 INT-02 异常链路联调
- 非法格式、超大小、裁剪越界、越权、admin 不存在。

4.3 INT-03 一致性联调
- 数据库字段、接口返回、文件系统实际文件三方一致。

4.4 INT-04 缓存联调
- version 更新后立即读取新头像，不出现旧图残留。

5. Phase E 发布工单（半天）
5.1 先发布后端迁移和接口，再发布前端。
5.2 回滚策略：优先前端回滚；后端保留兼容字段，必要时执行 migration down。
5.3 发布后巡检：抽样 10 条管理员数据验证头像显示与访问可用性。

### 接口最终稿（可直接给后端）
1. 上传接口
- Method: POST
- Path: /admin/{id}/avatar
- Content-Type: multipart/form-data
- Form fields:
  - file: binary
  - crop_x: int
  - crop_y: int
  - crop_size: int
  - original_width: int
  - original_height: int

2. 上传成功响应
- code: 200
- message: 头像上传成功
- data:
  - admin_id: string
  - avatar_small_url: string
  - avatar_large_url: string
  - avatar_version: number
  - avatar_updated_at: string

3. 列表与详情新增字段
- avatar_small_url
- avatar_large_url
- avatar_version
- avatar_updated_at

### 错误码最终稿（可直接给后端）
1. 40001 INVALID_FILE_TYPE
2. 40002 FILE_TOO_LARGE
3. 40003 IMAGE_TOO_SMALL
4. 40004 INVALID_CROP_RECT
5. 40100 UNAUTHORIZED
6. 40301 FORBIDDEN_AVATAR_UPDATE
7. 40401 ADMIN_NOT_FOUND
8. 50001 AVATAR_PROCESS_FAILED
9. 50002 AVATAR_STORAGE_FAILED
10. 50003 AVATAR_DB_UPDATE_FAILED

### 前端文件级工单清单
1. /home/mgtadmin/src/modules/admin/avatar/index.ts
2. /home/mgtadmin/src/modules/admin/avatar/types/avatar.types.ts
3. /home/mgtadmin/src/modules/admin/avatar/services/avatarService.ts
4. /home/mgtadmin/src/modules/admin/avatar/hooks/useAvatarCrop.ts
5. /home/mgtadmin/src/modules/admin/avatar/components/AvatarUploadModal.tsx
6. /home/mgtadmin/src/modules/admin/avatar/components/AvatarCropCanvas.tsx
7. /home/mgtadmin/src/modules/admin/avatar/components/AvatarPreview.tsx
8. /home/mgtadmin/src/modules/admin/avatar/utils/imageTransform.ts
9. /home/mgtadmin/src/modules/admin/avatar/styles/avatar.css
10. /home/mgtadmin/src/modules/admin/pages/AdminPage.tsx
11. /home/mgtadmin/src/modules/admin/types/admin.types.ts
12. /home/mgtadmin/src/modules/admin/services/adminService.ts
13. /home/mgtadmin/src/config.ts

### Verification
1. 构建验证：前端执行 npx tsc -b 或 npm run build 通过。
2. 接口验证：上传成功返回双 URL 与 version，列表和详情字段完整。
3. 图像验证：落盘文件均为 jpg，尺寸严格 32x32 与 128x128。
4. 交互验证：弹窗预览与最终落盘一致，无明显偏移。
5. 安全验证：无 token、越权、非法格式、越界裁剪均按预期拒绝。
