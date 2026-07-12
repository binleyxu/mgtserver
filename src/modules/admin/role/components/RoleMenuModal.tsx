import React from 'react'
import { Checkbox, Modal } from 'antd'

import type { MenuItemInfo } from '../../types/admin.types'

type RoleMenuModalProps = {
  open: boolean
  confirmLoading: boolean
  roleName?: string
  menuCatalog: MenuItemInfo[]
  selectedRoleMenuIds: number[]
  onChangeSelectedIds: (ids: number[]) => void
  onOk: () => void
  onCancel: () => void
}

export const RoleMenuModal: React.FC<RoleMenuModalProps> = ({
  open,
  confirmLoading,
  roleName,
  menuCatalog,
  selectedRoleMenuIds,
  onChangeSelectedIds,
  onOk,
  onCancel,
}) => {
  const selectedMenuIdSet = React.useMemo(() => new Set(selectedRoleMenuIds), [selectedRoleMenuIds])

  const menuMatrix = React.useMemo(() => {
    const sortedMenus = [...menuCatalog].sort((left, right) => {
      const sortDiff = left.sort - right.sort
      if (sortDiff !== 0) return sortDiff
      return left.id - right.id
    })

    const menuById = new Map(sortedMenus.map((menu) => [menu.id, menu] as const))

    const getLineage = (menu: MenuItemInfo): MenuItemInfo[] => {
      const lineage: MenuItemInfo[] = [menu]
      let current = menu

      while (current.parent_id != null && menuById.has(current.parent_id)) {
        const parent = menuById.get(current.parent_id)
        if (!parent) {
          break
        }
        lineage.unshift(parent)
        current = parent
      }

      return lineage
    }

    const roots = sortedMenus.filter((menu) => menu.parent_id == null || !menuById.has(menu.parent_id))
    const rootCells = new Map<number, { level1: MenuItemInfo[]; level2: MenuItemInfo[]; level3: MenuItemInfo[] }>()

    for (const root of roots) {
      rootCells.set(root.id, { level1: [root], level2: [], level3: [] })
    }

    for (const menu of sortedMenus) {
      const lineage = getLineage(menu)
      const root = lineage[0]
      const cell = rootCells.get(root.id) ?? { level1: [], level2: [], level3: [] }

      if (lineage.length === 1) {
        cell.level1 = [menu]
      } else if (lineage.length === 2) {
        cell.level2.push(menu)
      } else if (lineage.length >= 3) {
        cell.level3.push(menu)
      }

      rootCells.set(root.id, cell)
    }

    const orderedRoots = roots.map((root) => rootCells.get(root.id) ?? { level1: [root], level2: [], level3: [] })

    return {
      columns: roots,
      rows: [
        orderedRoots.map((cell) => cell.level1),
        orderedRoots.map((cell) => cell.level2),
        orderedRoots.map((cell) => cell.level3),
      ],
    }
  }, [menuCatalog])

  const menuTree = React.useMemo(() => {
    const sortedMenus = [...menuCatalog].sort((left, right) => {
      const sortDiff = left.sort - right.sort
      if (sortDiff !== 0) return sortDiff
      return left.id - right.id
    })

    const menuById = new Map(sortedMenus.map((menu) => [menu.id, menu] as const))
    const childrenByParent = new Map<number, number[]>()

    for (const menu of sortedMenus) {
      if (menu.parent_id == null || !menuById.has(menu.parent_id)) {
        continue
      }

      const bucket = childrenByParent.get(menu.parent_id) ?? []
      bucket.push(menu.id)
      childrenByParent.set(menu.parent_id, bucket)
    }

    const collectDescendants = (menuId: number): number[] => {
      const descendants: number[] = []
      const stack = [...(childrenByParent.get(menuId) ?? [])]

      while (stack.length > 0) {
        const currentId = stack.pop()
        if (currentId == null) {
          continue
        }

        descendants.push(currentId)
        const children = childrenByParent.get(currentId)
        if (children?.length) {
          stack.push(...children)
        }
      }

      return descendants
    }

    return {
      collectDescendants,
    }
  }, [menuCatalog])

  const handleMenuSelectionChange = React.useCallback((checkedValues: number[]) => {
    const previousSelected = new Set(selectedRoleMenuIds)
    const nextChecked = new Set(checkedValues)
    const removedIds = [...previousSelected].filter((id) => !nextChecked.has(id))

    const nextSelected = new Set(checkedValues)

    for (const removedId of removedIds) {
      const descendants = menuTree.collectDescendants(removedId)
      descendants.forEach((descendantId) => nextSelected.delete(descendantId))
    }

    const closedSet = new Set<number>()
    for (const menuId of nextSelected) {
      closedSet.add(menuId)
    }

    onChangeSelectedIds(Array.from(closedSet))
  }, [menuTree, onChangeSelectedIds, selectedRoleMenuIds])

  return (
    <Modal
      title={roleName ? `角色菜单配置 - ${roleName}` : '角色菜单配置'}
      open={open}
      onOk={onOk}
      onCancel={onCancel}
      confirmLoading={confirmLoading}
      okText="保存"
      cancelText="取消"
      width={720}
    >
      <div style={{ marginBottom: 12, color: '#8c8c8c' }}>
        勾选该角色可见的左侧菜单（menu_id）
      </div>
      <Checkbox.Group
        style={{ width: '100%' }}
        value={selectedRoleMenuIds}
        onChange={(checkedValues) => handleMenuSelectionChange((checkedValues as number[]).map((v) => Number(v)))}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {menuMatrix.rows.map((row, rowIndex) => (
            <div
              key={`menu-row-${rowIndex}`}
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${menuMatrix.columns.length}, minmax(0, 1fr))`,
                gap: 8,
              }}
            >
              {row.map((menus, columnIndex) => (
                <div
                  key={`menu-cell-${rowIndex}-${columnIndex}`}
                  style={{
                    minHeight: 44,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                  }}
                >
                  {menus.map((menu) => (
                    <label
                      key={menu.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        border: '1px solid #f0f0f0',
                        borderRadius: 8,
                        padding: '8px 10px',
                        minHeight: 40,
                        whiteSpace: 'nowrap',
                        opacity: menu.parent_id != null && !selectedMenuIdSet.has(menu.parent_id) ? 0.45 : 1,
                      }}
                    >
                      <Checkbox
                        value={menu.id}
                        disabled={menu.parent_id != null && !selectedMenuIdSet.has(menu.parent_id)}
                      />
                      <span style={{ fontWeight: 600 }}>{menu.id}</span>
                      <span>{menu.label}</span>
                    </label>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      </Checkbox.Group>
    </Modal>
  )
}
