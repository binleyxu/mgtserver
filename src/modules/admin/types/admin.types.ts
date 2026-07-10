/**
 * Admin 模块类型定义
 */

// Admin 管理员信息
export interface Admin {
  id: string;
  username: string;
  name: string;
  email: string;
  role: string;
  roleId?: number;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

// 角色信息
export interface Role {
  id: number;
  role_name: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

// Admin 列表响应
export interface AdminListResponse {
  code: number;
  message: string;
  data: Admin[];
  total: number;
  page: number;
  pageSize: number;
}

// Admin 详情响应
export interface AdminDetailResponse {
  code: number;
  message: string;
  data: Admin;
}

// Admin 创建请求
export interface CreateAdminRequest {
  username: string;
  name: string;
  email: string;
  role_id: number;
  role?: string;
  password: string;
}

// Admin 更新请求
export interface UpdateAdminRequest {
  name?: string;
  email?: string;
  role_id?: number;
  role?: string;
  is_active?: boolean;
  password?: string;
}

export interface RoleListResponse {
  total: number;
  items: Role[];
}

export interface CreateRoleRequest {
  role_name: string;
  is_active?: boolean;
}

export interface UpdateRoleRequest {
  role_name?: string;
  is_active?: boolean;
}

export interface AdminLoginRequest {
  username: string;
  password: string;
}

export interface AdminLoginResponse extends ApiResponse<{ token: string; admin: Admin }> {}

// 通用 API 响应
export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}


export interface MenuItemInfo {
  id: number;
  menu_key: string;
  label: string;
  path: string;
  parent_id?: number | null;
  sort: number;
  is_active: boolean;
}

export interface MenuListResponse {
  total: number;
  items: MenuItemInfo[];
}

export interface RoleMenuResponse {
  role_id: number;
  menu_ids: number[];
  menu: MenuItemInfo[];
}


export interface MenuCreateRequest {
  id: number;
  menu_key: string;
  label: string;
  path?: string;
  parent_id?: number | null;
  sort?: number;
  is_active?: boolean;
}

export interface MenuUpdateRequest {
  menu_key?: string;
  label?: string;
  path?: string;
  parent_id?: number | null;
  sort?: number;
  is_active?: boolean;
}
