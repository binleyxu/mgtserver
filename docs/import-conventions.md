# Frontend 导入约定（模块化）

## 目标

- 降低跨模块耦合
- 减少目录调整导致的大面积改动
- 提升代码可读性与可维护性

## 约定

1. 跨模块导入优先使用模块入口
- 推荐：`from '@/auth'`、`from '../../admin'`
- 避免：`from '../../auth/authentication/services/sessionService'`

1.1 auth 导入优先级
- 推荐：`from '@/auth'`
- 过渡兼容（将逐步淘汰）：`from '../../auth'`、`from '../../../auth'`
- 禁止：`from '../../auth/authentication/services/*'`

2. 同模块内部可使用相对路径
- 例如 `login` 模块内部：`../hooks/useLogin`

3. 业务模块与领域模块职责边界
- `modules/login`：登录页面与登录业务编排
- `modules/auth`：鉴权能力（authentication/authorization）

4. 新增模块时必须提供 `index.ts`
- 对外集中导出页面、服务、类型
- 其他模块只能依赖这个入口，不直接依赖深层文件

## Code Review 检查清单

- 是否出现跨模块深层导入（`../../<module>/<deep path>`）
- 是否绕过模块 `index.ts` 直接引用内部实现
- 导入是否符合职责边界（例如登录页面不应回放到 auth 模块）

## 快速检查命令

```bash
rg "from '../../(admin|auth|region|user|login)/" -n src/modules
```

若命中结果为 0 或仅属于同模块内部导入，则符合约定。

## 自动检查（推荐接入 CI）

本地执行：

```bash
npm run check:imports
```

返回码说明：

- `0`：通过
- `2`：发现跨模块深层导入
- `3`：执行环境错误（目录或工具异常）
