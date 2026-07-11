import { API_ENDPOINTS } from '../../../../config'
import {
  extractApiMessage,
  isBusinessSuccess,
  readEnvelopeCode,
  readEnvelopeDataObject,
  readEnvelopeItems,
  readEnvelopeTotal,
  readHttpErrorMessage,
} from '../../../../utils/apiSemantics'
import { buildAuthHeaders, handleUnauthorizedResponse } from '@/auth'

import type { MenuItemInfo, RoleMenuResponse } from '../../types/admin.types'
import type { CreateRoleRequest, Role, RoleListResponse, UpdateRoleRequest } from '../types/role.types'

function getAuthHeaders(): Record<string, string> {
  return buildAuthHeaders()
}

function handleAuthResponse(response: Response): void {
  handleUnauthorizedResponse(response)
}

function toText(value: unknown): string {
  return typeof value === 'string' ? value : value != null ? String(value) : ''
}

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
}

function ensureEnvelopePayload(payload: unknown, fallbackMessage: string): Record<string, unknown> {
  const body = toRecord(payload)
  const code = readEnvelopeCode(body)
  if (!isBusinessSuccess(code)) {
    throw new Error(extractApiMessage(body) || fallbackMessage)
  }
  return body
}

function mapRoleItem(item: Record<string, unknown>): Role {
  return {
    id: Number(item.id),
    role_name: toText(item.role_name),
    is_active: Boolean(item.is_active),
    created_at: toText(item.created_at),
    updated_at: toText(item.updated_at),
  }
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

export async function getRoleList(): Promise<RoleListResponse> {
  const response = await fetch(API_ENDPOINTS.ADMIN.ROLE_LIST, {
    method: 'GET',
    headers: getAuthHeaders(),
  })

  handleAuthResponse(response)

  if (!response.ok) {
    throw new Error(await readHttpErrorMessage(response, `Failed to fetch role list: HTTP ${response.status}`))
  }

  const payload = await response.json()
  const body = ensureEnvelopePayload(payload, '加载角色列表失败')
  const items = readEnvelopeItems(body)

  return {
    total: readEnvelopeTotal(body, items.length),
    items: items.map((item) => mapRoleItem(toRecord(item))),
  }
}

export async function createRole(data: CreateRoleRequest): Promise<Role> {
  const response = await fetch(API_ENDPOINTS.ADMIN.ROLE_CREATE, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  })

  handleAuthResponse(response)

  if (!response.ok) {
    throw new Error(await readHttpErrorMessage(response, `Failed to create role: HTTP ${response.status}`))
  }

  const payload = await response.json()
  const body = ensureEnvelopePayload(payload, '创建角色失败')
  return mapRoleItem(readEnvelopeDataObject(body) ?? body)
}

export async function updateRole(roleId: number, data: UpdateRoleRequest): Promise<Role> {
  const response = await fetch(API_ENDPOINTS.ADMIN.ROLE_UPDATE(roleId), {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  })

  handleAuthResponse(response)

  if (!response.ok) {
    throw new Error(await readHttpErrorMessage(response, `Failed to update role: HTTP ${response.status}`))
  }

  const payload = await response.json()
  const body = ensureEnvelopePayload(payload, '更新角色失败')
  return mapRoleItem(readEnvelopeDataObject(body) ?? body)
}

export async function deleteRole(roleId: number): Promise<void> {
  const response = await fetch(API_ENDPOINTS.ADMIN.ROLE_DELETE(roleId), {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })

  handleAuthResponse(response)

  if (!response.ok) {
    throw new Error(await readHttpErrorMessage(response, `Failed to delete role: HTTP ${response.status}`))
  }
}

export async function getRoleMenu(roleId: number): Promise<RoleMenuResponse> {
  const response = await fetch(API_ENDPOINTS.MENU.ROLE_MENU(roleId), {
    method: 'GET',
    headers: getAuthHeaders(),
  })

  handleAuthResponse(response)

  if (!response.ok) {
    throw new Error(await readHttpErrorMessage(response, `Failed to fetch role menu: HTTP ${response.status}`))
  }

  const payload = await response.json()
  return mapRoleMenuPayload(payload, '加载角色菜单失败')
}

export async function updateRoleMenu(roleId: number, menuIds: number[]): Promise<RoleMenuResponse> {
  const response = await fetch(API_ENDPOINTS.MENU.ROLE_MENU(roleId), {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ menu_ids: menuIds }),
  })

  handleAuthResponse(response)

  if (!response.ok) {
    throw new Error(await readHttpErrorMessage(response, `Failed to update role menu: HTTP ${response.status}`))
  }

  const payload = await response.json()
  return mapRoleMenuPayload(payload, '保存角色菜单失败')
}
