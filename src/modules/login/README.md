# Login 模块

`login` 是独立业务模块，与 `admin`、`region`、`user` 并列。

## 目录结构

```
login/
├── hooks/
│   └── useLogin.ts
├── pages/
│   └── LoginPage.tsx
├── styles/
│   └── LoginPage.css
└── index.ts
```

## 职责

- 管理员登录页面与交互编排。
- 登录成功后令牌写入与账号状态校验。
- 登录相关 UI 样式。

说明：

- 鉴权底层能力（token/session/权限）仍由 `auth` 模块提供。
