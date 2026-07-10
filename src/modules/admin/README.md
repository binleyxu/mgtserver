# Admin 模块

这是一个 React TypeScript 的 admin 管理员模块，用于与后端 API 服务器（192.168.0.206）进行通信。

## 目录结构

```
admin/
├── pages/           # 页面组件
│   └── AdminPage.tsx
├── components/      # 可复用组件
├── services/        # API 服务
│   └── adminService.ts
├── hooks/          # 自定义 Hooks
│   ├── useAdmin.ts
│   └── index.ts
├── types/          # TypeScript 类型定义
│   └── admin.types.ts
├── styles/         # 样式文件
│   └── AdminPage.css
├── index.ts        # 模块入口
└── README.md       # 本文件
```

## 快速开始

### 在你的应用中使用 AdminPage

```typescript
import { AdminPage } from '@/modules/admin';

function App() {
  return (
    <div>
      <AdminPage />
    </div>
  );
}

export default App;
```

### 使用 useAdmin Hook 获取数据

```typescript
import { useAdmin } from '@/modules/admin/hooks';

function MyComponent() {
  const { 
    admins, 
    loading, 
    error, 
    fetchAdmins,
    removeAdmin 
  } = useAdmin();

  useEffect(() => {
    fetchAdmins();
  }, []);

  if (loading) return <div>加载中...</div>;
  if (error) return <div>错误: {error}</div>;

  return (
    <div>
      {admins.map(admin => (
        <div key={admin.id}>
          {admin.name} - {admin.email}
        </div>
      ))}
    </div>
  );
}
```

### 直接调用 API 服务

```typescript
import { 
  getAdminList, 
  createAdmin, 
  updateAdmin, 
  deleteAdmin 
} from '@/modules/admin';

// 获取列表
const response = await getAdminList(1, 10);

// 创建管理员
await createAdmin({
  name: '张三',
  email: 'zhangsan@example.com',
  role: 'admin',
  password: '123456'
});

// 更新管理员
await updateAdmin('admin-id', {
  name: '李四',
  status: 'active'
});

// 删除管理员
await deleteAdmin('admin-id');
```

## API 端点

| 方法 | 端点 | 描述 |
|-----|------|------|
| GET | `/api/admin/list?page=1&pageSize=10` | 获取管理员列表 |
| GET | `/api/admin/{id}` | 获取管理员详情 |
| POST | `/api/admin` | 创建管理员 |
| PUT | `/api/admin/{id}` | 更新管理员 |
| DELETE | `/api/admin/{id}` | 删除管理员 |

## 类型定义

### Admin
管理员信息对象

```typescript
interface Admin {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}
```

### CreateAdminRequest
创建管理员请求

```typescript
interface CreateAdminRequest {
  name: string;
  email: string;
  role: string;
  password: string;
}
```

### UpdateAdminRequest
更新管理员请求

```typescript
interface UpdateAdminRequest {
  name?: string;
  email?: string;
  role?: string;
  status?: 'active' | 'inactive';
}
```

## 功能特性

- ✅ 获取管理员列表（支持分页）
- ✅ 获取管理员详情
- ✅ 创建新管理员
- ✅ 更新管理员信息
- ✅ 删除管理员
- ✅ 错误处理和加载状态
- ✅ 响应式 UI 设计
- ✅ TypeScript 类型安全

## 自定义配置

### 修改 API 基础 URL

在 `services/adminService.ts` 中修改：

```typescript
const API_BASE_URL = 'http://192.168.0.206/api/admin';
```

### 添加身份验证

在 API 请求中添加认证令牌：

```typescript
const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`,
};
```

## 注意事项

1. 确保后端 API 服务器（192.168.0.206）正常运行
2. 根据后端实际响应格式调整类型定义
3. 生产环境中应使用 HTTPS
4. 建议添加错误重试机制
5. 建议实现请求拦截器统一处理认证

## 扩展建议

- [ ] 添加表单验证
- [ ] 添加搜索和过滤功能
- [ ] 添加批量操作
- [ ] 添加导出功能
- [ ] 添加权限管理
- [ ] 添加日志记录
