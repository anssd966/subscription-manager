import { differenceInDays, format, isAfter, isBefore, isSameDay, addDays } from 'date-fns'

export const calculateEndDate = (startDate, duration) => {
  const start = new Date(startDate)
  const end = new Date(start)
  
  if (duration === 'month') {
    end.setMonth(end.getMonth() + 1)
  } else if (duration === '3months') {
    end.setMonth(end.getMonth() + 3)
  } else if (duration === '6months') {
    end.setMonth(end.getMonth() + 6)
  } else if (duration === 'year') {
    end.setFullYear(end.getFullYear() + 1)
  }
  
  return formatDate(end.toISOString())
}

export const getDaysRemaining = (endDate) => {
  const end = new Date(endDate)
  const now = new Date()
  const days = differenceInDays(end, now)
  return days
}

export const formatDate = (dateString) => {
  const date = new Date(dateString)
  return format(date, 'yyyy-MM-dd')
}

export const formatDateArabic = (dateString) => {
  const date = new Date(dateString)
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  return `${day}/${month}/${year}`
}

export const isExpired = (endDate) => {
  return isBefore(new Date(endDate), new Date())
}

export const isExpiringSoon = (endDate, days = 7) => {
  const end = new Date(endDate)
  const now = new Date()
  const daysRemaining = differenceInDays(end, now)
  return daysRemaining >= 0 && daysRemaining <= days
}

export const getSubscriptionsByDate = (subscriptions, targetDate) => {
  const target = new Date(targetDate)
  return subscriptions.filter(sub => {
    const endDate = new Date(sub.endDate)
    return isSameDay(endDate, target)
  })
}

export const getSubscriptionsExpiringInRange = (subscriptions, startDate, endDate) => {
  const start = new Date(startDate)
  const end = new Date(endDate)
  return subscriptions.filter(sub => {
    const subEndDate = new Date(sub.endDate)
    return (isAfter(subEndDate, start) || isSameDay(subEndDate, start)) &&
           (isBefore(subEndDate, end) || isSameDay(subEndDate, end))
  })
}

