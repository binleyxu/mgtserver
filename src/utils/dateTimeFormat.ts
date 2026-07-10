import { DISPLAY_TIME_ZONE } from '../config'

function pad2(value: number): string {
  return String(value).padStart(2, '0')
}

const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: DISPLAY_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

const dateTimeFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: DISPLAY_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
})

interface DateParts {
  day: string
  month: string
  year: string
  hour?: string
  minute?: string
  second?: string
}

function formatParts(formatter: Intl.DateTimeFormat, date: Date): DateParts | null {
  const parts = formatter.formatToParts(date)
  const day = parts.find((part) => part.type === 'day')?.value
  const month = parts.find((part) => part.type === 'month')?.value
  const year = parts.find((part) => part.type === 'year')?.value
  const hour = parts.find((part) => part.type === 'hour')?.value
  const minute = parts.find((part) => part.type === 'minute')?.value
  const second = parts.find((part) => part.type === 'second')?.value

  if (!day || !month || !year) {
    return null
  }

  return { day, month, year, hour, minute, second }
}

function parseDate(value: string | number | Date | null | undefined): Date | null {
  if (value === null || value === undefined || value === '') {
    return null
  }

  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) {
    return null
  }

  return date
}

export function formatDateDMY(value: string | number | Date | null | undefined): string {
  const date = parseDate(value)
  if (!date) {
    return '-'
  }

  const formatted = formatParts(dateFormatter, date)
  if (!formatted) {
    const day = pad2(date.getDate())
    const month = pad2(date.getMonth() + 1)
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
  }

  return `${formatted.day}/${formatted.month}/${formatted.year}`
}

export function formatDateTimeDMY(value: string | number | Date | null | undefined): string {
  const date = parseDate(value)
  if (!date) {
    return '-'
  }

  const formatted = formatParts(dateTimeFormatter, date)
  if (!formatted || !formatted.hour || !formatted.minute || !formatted.second) {
    const day = pad2(date.getDate())
    const month = pad2(date.getMonth() + 1)
    const year = date.getFullYear()
    const hour = pad2(date.getHours())
    const minute = pad2(date.getMinutes())
    const second = pad2(date.getSeconds())

    return `${day}/${month}/${year} ${hour}:${minute}:${second}`
  }

  return `${formatted.day}/${formatted.month}/${formatted.year} ${formatted.hour}:${formatted.minute}:${formatted.second}`
}
