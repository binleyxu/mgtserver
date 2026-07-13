export type SystemSettingProfile = {
  id: number
  siteTitle: string
  maintenanceMode: boolean
  updatedAt: string
  updatedBy: number | null
}

export type SystemSettingResponse = {
  code: number
  message: string
  data: SystemSettingProfile
}
