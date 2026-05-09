const { lunarToSolar } = require('../../utils/lunar')

const REMINDER_TEMPLATE_ID = '4WAwheE-KQct3YhqURiiWuFj3lKDb8Ya1PbPVcTUGC4'

function pad(num) {
  return num < 10 ? '0' + num : '' + num
}

function formatDate(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function formatLunarText(month, day, isLeap = false) {
  const months = ['正月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '冬月', '腊月']
  const days = [
    '', '初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
    '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
    '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十'
  ]

  return `农历${isLeap ? '闰' : ''}${months[month - 1]}${days[day]}`
}

function getNthWeekdayOfMonth(year, month, weekday, nth) {
  const firstDay = new Date(year, month - 1, 1)
  const firstWeekday = firstDay.getDay()

  let offset = weekday - firstWeekday
  if (offset < 0) offset += 7

  return new Date(year, month - 1, 1 + offset + (nth - 1) * 7)
}

function getDiffDays(targetDate) {
  const today = new Date()
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const targetStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate())

  return Math.floor((targetStart - todayStart) / (24 * 60 * 60 * 1000))
}

function getNextSolarDate(month, day) {
  const currentYear = new Date().getFullYear()
  let date = new Date(currentYear, month - 1, day)

  if (getDiffDays(date) < 0) {
    date = new Date(currentYear + 1, month - 1, day)
  }

  return date
}

function getNextLunarDate(month, day, isLeap = false) {
  const currentYear = new Date().getFullYear()
  let date = lunarToSolar(currentYear, month, day, isLeap)

  if (getDiffDays(date) < 0) {
    date = lunarToSolar(currentYear + 1, month, day, isLeap)
  }

  return date
}

function getCountdownClass(diff) {
  if (diff <= 7) return 'urgent'
  if (diff <= 30) return 'soon'
  return 'normal'
}

function buildEvent(name, date, extra = {}) {
  const diff = getDiffDays(date)

  return {
    name,
    displayDate: formatDate(date),
    countdown: diff,
    countdownClass: getCountdownClass(diff),
    ...extra
  }
}

function buildUserEvent(item, originalIndex) {
  let targetDate

  if (item.calendarType === '农历') {
    targetDate = getNextLunarDate(
      Number(item.lunarMonth),
      Number(item.lunarDay),
      item.isLeap || false
    )
  } else {
    let month = item.month
    let day = item.day

    if ((!month || !day) && item.originalDate) {
      const parts = item.originalDate.split('-')
      month = Number(parts[1])
      day = Number(parts[2])
    }

    targetDate = getNextSolarDate(Number(month), Number(day))
  }

  const diff = getDiffDays(targetDate)

  return {
    ...item,
    originalIndex,
    displayDate: formatDate(targetDate),
    lunarText: item.calendarType === '农历'
      ? formatLunarText(Number(item.lunarMonth), Number(item.lunarDay), item.isLeap || false)
      : '',
    countdown: diff,
    countdownClass: getCountdownClass(diff)
  }
}

function mergeSystemEvent(baseItem, savedList, type) {
  const eventKey = `${type}_${baseItem.name}`
  const savedItem = savedList.find(item => item.eventKey === eventKey)

  return {
    ...baseItem,
    type,
    eventKey,
    reminderEnabled: savedItem ? savedItem.reminderEnabled : false,
    remark: savedItem ? savedItem.remark || '' : '',
    _id: savedItem ? savedItem._id : ''
  }
}

function sortEvents(list) {
  return list.sort((a, b) => a.countdown - b.countdown)
}

function getListNameByType(type) {
  if (type === 'task') return 'taskList'
  if (type === 'birthday') return 'birthdayList'
  return 'anniversaryList'
}

function getDisplayNameByType(type) {
  if (type === 'task') return '事务'
  if (type === 'birthday') return '生日'
  if (type === 'festival') return '节日'
  if (type === 'holiday') return '节假日'
  return '纪念日'
}

function buildFestivalList(year, savedList = []) {
  const baseList = [
    buildEvent('元旦', getNextSolarDate(1, 1), {
      calendarType: '阳历',
      month: 1,
      day: 1
    }),
    buildEvent('情人节', getNextSolarDate(2, 14), {
      calendarType: '阳历',
      month: 2,
      day: 14
    }),
    buildEvent('妇女节', getNextSolarDate(3, 8), {
      calendarType: '阳历',
      month: 3,
      day: 8
    }),
    buildEvent('劳动节', getNextSolarDate(5, 1), {
      calendarType: '阳历',
      month: 5,
      day: 1
    }),
    buildEvent('母亲节', getNthWeekdayOfMonth(year, 5, 0, 2), {
      calendarType: '阳历',
      specialRule: 'mother_day'
    }),
    buildEvent('儿童节', getNextSolarDate(6, 1), {
      calendarType: '阳历',
      month: 6,
      day: 1
    }),
    buildEvent('父亲节', getNthWeekdayOfMonth(year, 6, 0, 3), {
      calendarType: '阳历',
      specialRule: 'father_day'
    }),
    buildEvent('教师节', getNextSolarDate(9, 10), {
      calendarType: '阳历',
      month: 9,
      day: 10
    }),
    buildEvent('国庆节', getNextSolarDate(10, 1), {
      calendarType: '阳历',
      month: 10,
      day: 1
    }),
    buildEvent('平安夜', getNextSolarDate(12, 24), {
      calendarType: '阳历',
      month: 12,
      day: 24
    }),
    buildEvent('圣诞节', getNextSolarDate(12, 25), {
      calendarType: '阳历',
      month: 12,
      day: 25
    }),
    buildEvent('元宵节', getNextLunarDate(1, 15), {
      calendarType: '农历',
      lunarMonth: 1,
      lunarDay: 15,
      isLeap: false,
      lunarText: formatLunarText(1, 15)
    }),
    buildEvent('七夕节', getNextLunarDate(7, 7), {
      calendarType: '农历',
      lunarMonth: 7,
      lunarDay: 7,
      isLeap: false,
      lunarText: formatLunarText(7, 7)
    }),
    buildEvent('重阳节', getNextLunarDate(9, 9), {
      calendarType: '农历',
      lunarMonth: 9,
      lunarDay: 9,
      isLeap: false,
      lunarText: formatLunarText(9, 9)
    }),
    buildEvent('腊八节', getNextLunarDate(12, 8), {
      calendarType: '农历',
      lunarMonth: 12,
      lunarDay: 8,
      isLeap: false,
      lunarText: formatLunarText(12, 8)
    })
  ]

  return sortEvents(baseList.map(item => mergeSystemEvent(item, savedList, 'festival')))
}

function buildHolidayList(savedList = []) {
  const baseList = [
    buildEvent('元旦假期', getNextSolarDate(1, 1), {
      calendarType: '阳历',
      month: 1,
      day: 1
    }),
    buildEvent('春节', getNextLunarDate(1, 1), {
      calendarType: '农历',
      lunarMonth: 1,
      lunarDay: 1,
      isLeap: false,
      lunarText: formatLunarText(1, 1)
    }),
    buildEvent('清明节', getNextSolarDate(4, 5), {
      calendarType: '阳历',
      month: 4,
      day: 5
    }),
    buildEvent('劳动节假期', getNextSolarDate(5, 1), {
      calendarType: '阳历',
      month: 5,
      day: 1
    }),
    buildEvent('端午节', getNextLunarDate(5, 5), {
      calendarType: '农历',
      lunarMonth: 5,
      lunarDay: 5,
      isLeap: false,
      lunarText: formatLunarText(5, 5)
    }),
    buildEvent('中秋节', getNextLunarDate(8, 15), {
      calendarType: '农历',
      lunarMonth: 8,
      lunarDay: 15,
      isLeap: false,
      lunarText: formatLunarText(8, 15)
    }),
    buildEvent('国庆节假期', getNextSolarDate(10, 1), {
      calendarType: '阳历',
      month: 10,
      day: 1
    })
  ]

  return sortEvents(baseList.map(item => mergeSystemEvent(item, savedList, 'holiday')))
}

Page({
  data: {
    taskList: [],
    birthdayList: [],
    anniversaryList: [],
    festivalList: [],
    holidayList: []
  },

  onLoad() {
    this.refreshData()

    // wx.cloud.callFunction({
    //   name: 'sendReminder'
    // })
  },

  onShow() {
    this.refreshData()
  },

  async refreshData() {
    const year = new Date().getFullYear()

    try {
      const db = wx.cloud.database()

      const res = await db.collection('events')
        .orderBy('updatedAt', 'desc')
        .get()

      const allEvents = res.data || []

      const taskRawList = allEvents.filter(item => item.type === 'task')
      const birthdayRawList = allEvents.filter(item => item.type === 'birthday')
      const anniversaryRawList = allEvents.filter(item => item.type === 'anniversary')
      const systemRawList = allEvents.filter(item => item.type === 'festival' || item.type === 'holiday')

      wx.setStorageSync('taskList', taskRawList)
      wx.setStorageSync('birthdayList', birthdayRawList)
      wx.setStorageSync('anniversaryList', anniversaryRawList)
      wx.setStorageSync('systemEventList', systemRawList)

      this.setData({
        taskList: sortEvents(taskRawList.map((item, index) => buildUserEvent(item, index))),
        birthdayList: sortEvents(birthdayRawList.map((item, index) => buildUserEvent(item, index))),
        anniversaryList: sortEvents(anniversaryRawList.map((item, index) => buildUserEvent(item, index))),
        festivalList: buildFestivalList(year, systemRawList),
        holidayList: buildHolidayList(systemRawList)
      })
    } catch (err) {
      console.error('读取云数据库失败，使用本地缓存', err)

      const taskRawList = wx.getStorageSync('taskList') || []
      const birthdayRawList = wx.getStorageSync('birthdayList') || []
      const anniversaryRawList = wx.getStorageSync('anniversaryList') || []
      const systemRawList = wx.getStorageSync('systemEventList') || []

      this.setData({
        taskList: sortEvents(taskRawList.map((item, index) => buildUserEvent(item, index))),
        birthdayList: sortEvents(birthdayRawList.map((item, index) => buildUserEvent(item, index))),
        anniversaryList: sortEvents(anniversaryRawList.map((item, index) => buildUserEvent(item, index))),
        festivalList: buildFestivalList(year, systemRawList),
        holidayList: buildHolidayList(systemRawList)
      })
    }
  },

  goAddPage(event) {
    const type = event.currentTarget.dataset.type

    wx.navigateTo({
      url: `/pages/add/index?type=${type}`
    })
  },

  onUserEventTap(event) {
    const type = event.currentTarget.dataset.type
    const index = event.currentTarget.dataset.index

    const listName = getListNameByType(type)
    const shownList = this.data[listName]
    const targetItem = shownList[index]

    wx.showActionSheet({
      itemList: [
        '编辑',
        targetItem.reminderEnabled ? '关闭提醒' : '开启提醒',
        '删除'
      ],
      success: (res) => {
        if (res.tapIndex === 0) {
          this.editUserEvent(type, targetItem.originalIndex)
        }

        if (res.tapIndex === 1) {
          this.toggleReminder(type, targetItem.originalIndex, !targetItem.reminderEnabled)
        }

        if (res.tapIndex === 2) {
          this.deleteUserEvent(type, targetItem)
        }
      }
    })
  },

  onSystemEventTap(event) {
    const type = event.currentTarget.dataset.type
    const index = event.currentTarget.dataset.index
  
    const listName = type === 'festival' ? 'festivalList' : 'holidayList'
    const list = this.data[listName]
    const targetItem = list[index]
  
    if (!targetItem) return
  
    wx.showActionSheet({
      itemList: [
        targetItem.reminderEnabled ? '关闭提醒' : '开启提醒',
        '编辑备注'
      ],
      success: (res) => {
        if (res.tapIndex === 0) {
          this.toggleSystemReminder(type, targetItem, !targetItem.reminderEnabled)
        }
  
        if (res.tapIndex === 1) {
          this.editSystemRemark(type, targetItem)
        }
      }
    })
  },

  async toggleSystemReminder(type, item, enabled) {
    if (!item) return
  
    const db = wx.cloud.database()
  
    const saveData = {
      name: item.name,
      type,
      eventKey: item.eventKey,
      calendarType: item.calendarType,
      month: item.month || null,
      day: item.day || null,
      lunarMonth: item.lunarMonth || null,
      lunarDay: item.lunarDay || null,
      isLeap: item.isLeap || false,
      specialRule: item.specialRule || '',
      remark: item.remark || '',
      reminderEnabled: enabled,
      updatedAt: new Date()
    }
  
    try {
      if (enabled) {
        wx.requestSubscribeMessage({
          tmplIds: [REMINDER_TEMPLATE_ID],
          success: async (res) => {
            if (res[REMINDER_TEMPLATE_ID] !== 'accept') {
              wx.showToast({
                title: '未开启提醒',
                icon: 'none'
              })
              return
            }
  
            if (item._id) {
              await db.collection('events').doc(item._id).update({
                data: saveData
              })
            } else {
              await db.collection('events').add({
                data: {
                  ...saveData,
                  createdAt: new Date()
                }
              })
            }
  
            this.refreshData()
  
            wx.showToast({
              title: '已开启提醒',
              icon: 'success'
            })
          },
          fail: () => {
            wx.showToast({
              title: '未开启提醒',
              icon: 'none'
            })
          }
        })
      } else {
        if (item._id) {
          await db.collection('events').doc(item._id).update({
            data: {
              reminderEnabled: false,
              updatedAt: new Date()
            }
          })
        }
  
        this.refreshData()
  
        wx.showToast({
          title: '已关闭提醒',
          icon: 'none'
        })
      }
    } catch (err) {
      console.error('节日提醒设置失败', err)
  
      wx.showToast({
        title: '操作失败',
        icon: 'none'
      })
    }
  },
  
  editSystemRemark(type, item) {
    if (!item) return
  
    wx.showModal({
      title: `编辑${item.name}备注`,
      editable: true,
      placeholderText: '可选，例如：记得提前准备礼物',
      content: item.remark || '',
      success: async (res) => {
        if (!res.confirm) return
  
        const remark = (res.content || '').trim()
        const db = wx.cloud.database()
  
        const saveData = {
          name: item.name,
          type,
          eventKey: item.eventKey,
          calendarType: item.calendarType,
          month: item.month || null,
          day: item.day || null,
          lunarMonth: item.lunarMonth || null,
          lunarDay: item.lunarDay || null,
          isLeap: item.isLeap || false,
          specialRule: item.specialRule || '',
          remark,
          reminderEnabled: item.reminderEnabled || false,
          updatedAt: new Date()
        }
  
        try {
          if (item._id) {
            await db.collection('events').doc(item._id).update({
              data: saveData
            })
          } else {
            await db.collection('events').add({
              data: {
                ...saveData,
                createdAt: new Date()
              }
            })
          }
  
          this.refreshData()
  
          wx.showToast({
            title: '备注已保存',
            icon: 'success'
          })
        } catch (err) {
          console.error('节日备注保存失败', err)
  
          wx.showToast({
            title: '保存失败',
            icon: 'none'
          })
        }
      }
    })
  },

  editUserEvent(type, originalIndex) {
    wx.navigateTo({
      url: `/pages/add/index?type=${type}&index=${originalIndex}`
    })
  },

  async toggleReminder(type, originalIndex, enabled) {
    const listName = getListNameByType(type)
    const rawList = wx.getStorageSync(listName) || []
    const item = rawList[originalIndex]

    if (!item) return

    if (enabled) {
      if (!REMINDER_TEMPLATE_ID || REMINDER_TEMPLATE_ID === '你的模板ID') {
        wx.showModal({
          title: '提醒功能未配置',
          content: '请先把 pages/index/index.js 顶部的 REMINDER_TEMPLATE_ID 替换为你申请到的订阅消息模板 ID。',
          showCancel: false
        })
        return
      }

      wx.requestSubscribeMessage({
        tmplIds: [REMINDER_TEMPLATE_ID],
        success: async (res) => {
          console.log('订阅消息授权结果', res)

          if (res[REMINDER_TEMPLATE_ID] !== 'accept') {
            wx.showToast({
              title: '未开启提醒',
              icon: 'none'
            })
            return
          }

          item.reminderEnabled = true
          item.updatedAt = new Date()

          wx.setStorageSync(listName, rawList)

          if (item._id) {
            const db = wx.cloud.database()
            await db.collection('events').doc(item._id).update({
              data: {
                reminderEnabled: true,
                updatedAt: new Date()
              }
            })
          }

          this.refreshData()

          wx.showToast({
            title: '已开启提醒',
            icon: 'success'
          })
        },
        fail: (err) => {
          console.error('订阅消息授权失败', err)

          wx.showToast({
            title: '未开启提醒',
            icon: 'none'
          })
        }
      })
    } else {
      item.reminderEnabled = false
      item.updatedAt = new Date()

      wx.setStorageSync(listName, rawList)

      if (item._id) {
        const db = wx.cloud.database()
        await db.collection('events').doc(item._id).update({
          data: {
            reminderEnabled: false,
            updatedAt: new Date()
          }
        })
      }

      this.refreshData()

      wx.showToast({
        title: '已关闭提醒',
        icon: 'none'
      })
    }
  },

  async deleteUserEvent(type, targetItem) {
    const listName = getListNameByType(type)
    const displayName = getDisplayNameByType(type)

    wx.showModal({
      title: `删除${displayName}`,
      content: `确定删除「${targetItem.name}」吗？`,
      success: async (res) => {
        if (!res.confirm) return

        const rawList = wx.getStorageSync(listName) || []
        rawList.splice(targetItem.originalIndex, 1)
        wx.setStorageSync(listName, rawList)

        if (targetItem._id) {
          const db = wx.cloud.database()
          await db.collection('events').doc(targetItem._id).remove()
        }

        this.refreshData()

        wx.showToast({
          title: '已删除',
          icon: 'success'
        })
      }
    })
  }
})