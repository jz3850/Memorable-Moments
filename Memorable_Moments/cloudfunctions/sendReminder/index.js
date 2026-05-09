const cloud = require('wx-server-sdk')
const { lunarToSolar } = require('./lunar')

cloud.init({
  env: 'cloud1-d6gxqaextf1756819'
})

const db = cloud.database()

const TEMPLATE_ID = '4WAwheE-KQct3YhqURiiWuFj3lKDb8Ya1PbPVcTUGC4'

function pad(num) {
  return num < 10 ? '0' + num : '' + num
}

function formatDate(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function getTodayString() {
  const now = new Date()
  const date = new Date(now.getTime() + 8 * 60 * 60 * 1000)
  return formatDate(date)
}

function isSameDate(date, todayString) {
  return formatDate(date) === todayString
}

function getNextSolarDate(month, day) {
  const currentYear = new Date().getFullYear()

  let date = new Date(currentYear, month - 1, day)

  if (formatDate(date) < getTodayString()) {
    date = new Date(currentYear + 1, month - 1, day)
  }

  return date
}

function getNextLunarDate(month, day, isLeap = false) {
  const currentYear = new Date().getFullYear()

  let date = lunarToSolar(currentYear, month, day, isLeap)

  if (formatDate(date) < getTodayString()) {
    date = lunarToSolar(currentYear + 1, month, day, isLeap)
  }

  return date
}

function isEventToday(item, today) {
  if (item.calendarType === '农历') {
    const date = getNextLunarDate(
      Number(item.lunarMonth),
      Number(item.lunarDay),
      item.isLeap || false
    )

    return isSameDate(date, today)
  }

  let month = item.month
  let day = item.day

  if ((!month || !day) && item.originalDate) {
    const parts = item.originalDate.split('-')
    month = Number(parts[1])
    day = Number(parts[2])
  }

  const date = getNextSolarDate(Number(month), Number(day))

  return isSameDate(date, today)
}

exports.main = async () => {
  const today = getTodayString()

  const res = await db.collection('events')
    .where({
      reminderEnabled: true
    })
    .get()

  const events = res.data || []

  const targetEvents = events.filter(item => {
    const isToday = isEventToday(item, today)
    const notSentToday = item.lastReminderDate !== today
  
    return isToday && notSentToday
  })

  let successCount = 0
  let failCount = 0
  let skipCount = events.length - targetEvents.length

  for (const item of targetEvents) {
    try {
      await cloud.openapi.subscribeMessage.send({
        touser: item._openid,
        templateId: TEMPLATE_ID,
        page: 'pages/index/index',
        miniprogramState: 'formal',
        lang: 'zh_CN',
        data: {
          thing12: {
            value: String(item.name || '日程提醒').slice(0, 20)
          },
          date2: {
            value: today
          },
          thing9: {
            value: String(item.remark || '今天是你记录的重要日子').slice(0, 20)
          }
        }
      })

      await db.collection('events').doc(item._id).update({
        data: {
          lastReminderDate: today,
          lastReminderAt: new Date()
        }
      })

      successCount++
    } catch (err) {
      console.error('发送失败', item, err)
      failCount++
    }
  }

  return {
    today,
    total: events.length,
    target: targetEvents.length,
    successCount,
    failCount,
    skipCount
  }
}