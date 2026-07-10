# User 模块（骨架）

该模块是为即将到来的商城 C 端项目预留的顶级用户域骨架。

## 目录

- hooks: 组合式状态逻辑（示例: useUserList）
- pages: 页面组件（示例: UserHomePage）
- services: API 访问层（示例: getUserList）
- styles: 模块样式
- types: 类型定义

## 权限说明（当前后台）

- user 资源读接口：viewer / admin / super_admin
- user 资源写接口（创建/更新/删除）：admin / super_admin
- supervisor（role=super_admin）：允许编辑和删除 user 资源

## 说明

当前 frontend-server 主要服务于管理员端，本模块先以骨架形式存在，后续可逐步承接 C 端用户相关能力（资料、收货地址、订单偏好等）。
