/**
 * Admin 模块 API 服务
 */

import { API_ENDPOINTS } from '../../../config';
import {
  extractApiMessage,
  isBusinessSuccess,
  readEnvelopeCode,
  readEnvelopeDataObject,
  readEnvelopeItems,
  readEnvelopeTotal,
  readHttpErrorMessage,
  readSuccessMessage,
} from '../../../utils/apiSemantics'
import type {
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
} from '../types/admin.types';
import { buildAuthHeaders, handleUnauthorizedResponse } from '@/auth'
import { DEFAULT_ADMIN_AVATAR_DATA_URI } from '../avatar/utils/imageTransform'

function getAuthHeaders(): Record<string, string> {
  return buildAuthHeaders()
}

function handleAuthResponse(response: Response): void {
  handleUnauthorizedResponse(response)
}

function mapAdminItem(item: any): Admin {
  const rawId = item.id ?? item.admin_id ?? item.user_id ?? item.uid
  const toText = (value: unknown): string => (typeof value === 'string' ? value : value != null ? String(value) : '')
  const avatarSmall = toText(item.avatar_small_url ?? item.avatar_url)
  const avatarLarge = toText(item.avatar_large_url ?? item.avatar_url)

  return {
    id: rawId !== undefined && rawId !== null ? String(rawId) : '',
    username: toText(item.username),
    name: toText(item.full_name),
    email: toText(item.email),
    role: toText(item.role),
    roleId: item.role_id !== undefined && item.role_id !== null ? Number(item.role_id) : undefined,
    avatarSmallUrl: avatarSmall || DEFAULT_ADMIN_AVATAR_DATA_URI,
    avatarLargeUrl: avatarLarge || DEFAULT_ADMIN_AVATAR_DATA_URI,
    avatarVersion: item.avatar_version !== undefined && item.avatar_version !== null ? Number(item.avatar_version) : null,
    avatarUpdatedAt: toText(item.avatar_updated_at) || null,
    status: item.is_active ? 'active' : 'inactive',
    createdAt: toText(item.created_at),
    updatedAt: toText(item.last_login),
  }
}

function toText(value: unknown): string {
  return typeof value === 'string' ? value : value != null ? String(value) : ''
}

function mapMenuItem(item: Record<string, unknown>): MenuItemInfo {
  return {
    id: Number(item.id),
    menu_key: toText(item.menu_key),
    label: toText(item.label),
    path: toText(item.path),
    parent_id: item.parent_id !== undefined && item.parent_id !== null ? Number(item.parent_id) : null,
    sort: Number(item.sort ?? 0),
    is_active: Boolean(item.is_active),
  }
}

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? value as Record<string, unknown> : {}
}

function ensureEnvelopePayload(payload: unknown, fallbackMessage: string): Record<string, unknown> {
  const body = toRecord(payload)
  const code = readEnvelopeCode(body)
  if (!isBusinessSuccess(code)) {
    throw new Error(extractApiMessage(body) || fallbackMessage)
  }
  return body
}

function mapRoleMenuPayload(payload: unknown, fallbackMessage: string): RoleMenuResponse {
  const body = ensureEnvelopePayload(payload, fallbackMessage)
  const data = readEnvelopeDataObject(body) ?? body
  const menuRows = Array.isArray(data.menu) ? data.menu.map((item) => mapMenuItem(toRecord(item))) : []

  return {
    role_id: Number(data.role_id ?? 0),
    menu_ids: Array.isArray(data.menu_ids) ? data.menu_ids.map((id) => Number(id)) : [],
    menu: menuRows,
  }
}

/**
 * 获取 admin 列表
 */
export async function getAdminList(
  page: number = 1,
  pageSize: number = 10
): Promise<AdminListResponse> {
  const response = await fetch(
    `${API_ENDPOINTS.ADMIN.LIST}?page=${page}&pageSize=${pageSize}`,
    {
      method: 'GET',
      headers: getAuthHeaders(),
    }
  );

  handleAuthResponse(response);

  if (!response.ok) {
    throw new Error(await readHttpErrorMessage(response, `Failed to fetch admin list: HTTP ${response.status}`))
  }

  const payload = await response.json()
  const code = readEnvelopeCode(payload)
  if (!isBusinessSuccess(code)) {
    throw new Error(extractApiMessage(payload) || '加载管理员列表失败')
  }

  const items = readEnvelopeItems(payload)
  const total = readEnvelopeTotal(payload, items.length)

  const adminRows = items.map((item: any) => mapAdminItem(item));

  return {
    code: code ?? 200,
    message: readSuccessMessage(payload),
    data: adminRows,
    total,
    page,
    pageSize,
  };
}

/**
 * 获取 admin 详情
 */
export async function getAdminDetail(id: string): Promise<AdminDetailResponse> {
  const response = await fetch(API_ENDPOINTS.ADMIN.DETAIL(id), {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  handleAuthResponse(response);

  if (!response.ok) {
    throw new Error(await readHttpErrorMessage(response, `Failed to fetch admin detail: HTTP ${response.status}`))
  }

  const payload = await response.json()
  const code = readEnvelopeCode(payload)
  if (!isBusinessSuccess(code)) {
    throw new Error(extractApiMessage(payload) || '加载管理员详情失败')
  }

  const body = readEnvelopeDataObject(payload) ?? (payload as Record<string, unknown>)
  const rawId = body.id ?? body.admin_id ?? body.user_id ?? body.uid ?? body.username;
  return {
    code: code ?? 200,
    message: readSuccessMessage(payload),
    data: mapAdminItem({ ...body, id: rawId }),
  };
}

export async function getAdminByUsername(username: string): Promise<Admin | null> {
  const response = await fetch(`${API_ENDPOINTS.ADMIN.LIST}?page=1&pageSize=1000`, {
    method: 'GET',
    headers: getAuthHeaders(),
  })

  handleAuthResponse(response)

  if (!response.ok) {
    throw new Error(await readHttpErrorMessage(response, `Failed to fetch admin list: HTTP ${response.status}`))
  }

  const payload = await response.json()
  const code = readEnvelopeCode(payload)
  if (!isBusinessSuccess(code)) {
    throw new Error(extractApiMessage(payload) || '加载管理员列表失败')
  }

  const items = readEnvelopeItems(payload)
  const matched = items.find((item: any) => item.username === username)

  return matched ? mapAdminItem(matched) : null
}

/**
 * 创建 admin
 */
export async function createAdmin(
  data: CreateAdminRequest
): Promise<ApiResponse<Admin>> {
  const response = await fetch(API_ENDPOINTS.ADMIN.CREATE, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  handleAuthResponse(response);

  if (!response.ok) {
    throw new Error(await readHttpErrorMessage(response, `Failed to create admin: HTTP ${response.status}`))
  }

  const payload = await response.json()
  const code = readEnvelopeCode(payload)
  if (!isBusinessSuccess(code)) {
    throw new Error(extractApiMessage(payload) || '创建管理员失败')
  }

  const result = readEnvelopeDataObject(payload) ?? (payload as Record<string, unknown>)
  return {
    code: code ?? 200,
    message: readSuccessMessage(payload),
    data: mapAdminItem(result),
  };
}

/**
 * 更新 admin
 */
export async function updateAdmin(
  id: string,
  data: UpdateAdminRequest
): Promise<ApiResponse<Admin>> {
  const response = await fetch(API_ENDPOINTS.ADMIN.UPDATE(id), {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  handleAuthResponse(response);

  if (!response.ok) {
    throw new Error(await readHttpErrorMessage(response, `Failed to update admin: HTTP ${response.status}`))
  }

  const payload = await response.json()
  const code = readEnvelopeCode(payload)
  if (!isBusinessSuccess(code)) {
    throw new Error(extractApiMessage(payload) || '更新管理员失败')
  }

  const result = readEnvelopeDataObject(payload) ?? (payload as Record<string, unknown>)
  return {
    code: code ?? 200,
    message: readSuccessMessage(payload),
    data: mapAdminItem(result),
  };
}

/**
 * 删除 admin
 */
export async function deleteAdmin(id: string): Promise<ApiResponse<null>> {
  const response = await fetch(API_ENDPOINTS.ADMIN.DELETE(id), {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  handleAuthResponse(response);

  if (!response.ok) {
    throw new Error(await readHttpErrorMessage(response, `Failed to delete admin: HTTP ${response.status}`))
  }

  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    return { code: 200, message: 'success', data: null }
  }

  const payload = await response.json()
  const code = readEnvelopeCode(payload)
  if (!isBusinessSuccess(code)) {
    throw new Error(extractApiMessage(payload) || '删除管理员失败')
  }

  const message = readSuccessMessage(payload)
  return { code: code ?? 200, message, data: null }
}


export async function getMenuList(): Promise<MenuListResponse> {
  const response = await fetch(API_ENDPOINTS.MENU.LIST, {
    method: 'GET',
    headers: getAuthHeaders(),
  })

  handleAuthResponse(response)

  if (!response.ok) {
    throw new Error(await readHttpErrorMessage(response, `Failed to fetch menu list: HTTP ${response.status}`))
  }

  const payload = await response.json()
  const body = ensureEnvelopePayload(payload, '加载菜单列表失败')
  const items = readEnvelopeItems(body)

  return {
    total: readEnvelopeTotal(body, items.length),
    items: items.map((item) => mapMenuItem(toRecord(item))),
  }
}

export async function getCurrentAdminMenu(): Promise<RoleMenuResponse> {
  const response = await fetch(API_ENDPOINTS.AUTH.MENU, {
    method: 'GET',
    headers: getAuthHeaders(),
  })

  handleAuthResponse(response)

  if (!response.ok) {
    throw new Error(await readHttpErrorMessage(response, `Failed to fetch current menu: HTTP ${response.status}`))
  }

  const payload = await response.json()
  return mapRoleMenuPayload(payload, '加载当前角色菜单失败')
}

export async function createMenu(data: MenuCreateRequest): Promise<MenuItemInfo> {
  const response = await fetch(API_ENDPOINTS.MENU.CREATE, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  })

  handleAuthResponse(response)

  if (!response.ok) {
    throw new Error(await readHttpErrorMessage(response, `Failed to create menu: HTTP ${response.status}`))
  }

  const payload = await response.json()
  const body = ensureEnvelopePayload(payload, '创建菜单失败')
  return mapMenuItem(readEnvelopeDataObject(body) ?? body)
}

export async function updateMenu(menuId: number, data: MenuUpdateRequest): Promise<MenuItemInfo> {
  const response = await fetch(API_ENDPOINTS.MENU.UPDATE(menuId), {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  })

  handleAuthResponse(response)

  if (!response.ok) {
    throw new Error(await readHttpErrorMessage(response, `Failed to update menu: HTTP ${response.status}`))
  }

  const payload = await response.json()
  const body = ensureEnvelopePayload(payload, '更新菜单失败')
  return mapMenuItem(readEnvelopeDataObject(body) ?? body)
}
