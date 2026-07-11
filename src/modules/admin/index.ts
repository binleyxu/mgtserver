export { AdminPage } from './pages/AdminPage'

export {
  getAdminList,
  getAdminDetail,
  getAdminByUsername,
  createAdmin,
  updateAdmin,
  deleteAdmin,
  getMenuList,
  getCurrentAdminMenu,
  createMenu,
  updateMenu,
} from './services/adminService'

export {
  getRoleList,
  createRole,
  updateRole,
  deleteRole,
  getRoleMenu,
  updateRoleMenu,
} from './role'

export { RolePage } from './role'

export type {
  Admin,
  AdminListResponse,
  AdminDetailResponse,
  CreateAdminRequest,
  UpdateAdminRequest,
  ApiResponse,
  MenuItemInfo,
  MenuListResponse,
  RoleMenuResponse,
  MenuCreateRequest,
  MenuUpdateRequest,
} from './types/admin.types'

export type {
  Role,
  RoleListResponse,
  CreateRoleRequest,
  UpdateRoleRequest,
} from './role'
