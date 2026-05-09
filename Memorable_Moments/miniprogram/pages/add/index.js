const { solarToLunar } = require('../../utils/lunar')

function getBaseName(type) {
  if (type === 'task') return '事务'
  if (type === 'birthday') return '生日'
  return '纪念日'
}

function getStorageKey(type) {
  if (type === 'task') return 'taskList'
  if (type === 'birthday') return 'birthdayList'
  return 'anniversaryList'
}

Page({
  data: {
    type: 'anniversary',
    editIndex: -1,
    pageTitle: '添加纪念日',

    name: '',
    date: '',
    remark: '',

    calendarTypeList: ['阳历', '农历'],
    calendarTypeIndex: 0
  },

  onLoad(options) {
    const type = options.type || 'anniversary'
    const editIndex = options.index !== undefined ? Number(options.index) : -1

    const baseName = getBaseName(type)
    const pageTitle = editIndex >= 0 ? `编辑${baseName}` : `添加${baseName}`

    this.setData({
      type,
      editIndex,
      pageTitle
    })

    wx.setNavigationBarTitle({
      title: pageTitle
    })

    if (editIndex >= 0) {
      this.loadEditData(type, editIndex)
    }
  },

  loadEditData(type, editIndex) {
    const storageKey = getStorageKey(type)
    const list = wx.getStorageSync(storageKey) || []
    const item = list[editIndex]

    if (!item) return

    const calendarTypeIndex = item.calendarType === '农历' ? 1 : 0

    this.setData({
      name: item.name || '',
      date: item.originalDate || '',
      remark: item.remark || '',
      calendarTypeIndex
    })
  },

  onNameInput(event) {
    this.setData({
      name: event.detail.value
    })
  },

  onRemarkInput(event) {
    this.setData({
      remark: event.detail.value
    })
  },

  onDateChange(event) {
    this.setData({
      date: event.detail.value
    })
  },

  onCalendarTypeChange(event) {
    this.setData({
      calendarTypeIndex: Number(event.detail.value)
    })
  },

  async onSave() {
    const {
      name,
      date,
      remark,
      type,
      editIndex,
      calendarTypeList,
      calendarTypeIndex
    } = this.data

    if (!name.trim()) {
      wx.showToast({
        title: '请输入名称',
        icon: 'none'
      })
      return
    }

    if (!date) {
      wx.showToast({
        title: '请选择日期',
        icon: 'none'
      })
      return
    }

    const calendarType = calendarTypeList[calendarTypeIndex]
    const parts = date.split('-')

    const newEvent = {
      name: name.trim(),
      remark: remark.trim(),
      type,
      originalDate: date,
      calendarType,
      reminderEnabled: false,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    if (calendarType === '阳历') {
      newEvent.month = Number(parts[1])
      newEvent.day = Number(parts[2])
    } else {
      const solarDate = new Date(
        Number(parts[0]),
        Number(parts[1]) - 1,
        Number(parts[2])
      )

      const lunar = solarToLunar(solarDate)

      newEvent.lunarMonth = lunar.lunarMonth
      newEvent.lunarDay = lunar.lunarDay
      newEvent.isLeap = lunar.isLeap
    }

    const storageKey = getStorageKey(type)
    const list = wx.getStorageSync(storageKey) || []

    try {
      wx.showLoading({
        title: '保存中...'
      })

      const db = wx.cloud.database()

      if (editIndex >= 0) {
        const oldItem = list[editIndex] || {}

        newEvent.reminderEnabled = oldItem.reminderEnabled || false
        newEvent.createdAt = oldItem.createdAt || new Date()
        newEvent.updatedAt = new Date()

        if (oldItem._id) {
          await db.collection('events').doc(oldItem._id).update({
            data: {
              ...newEvent
            }
          })
        }

        list[editIndex] = {
          ...oldItem,
          ...newEvent
        }
      } else {
        const addRes = await db.collection('events').add({
          data: newEvent
        })

        list.push({
          ...newEvent,
          _id: addRes._id
        })
      }

      wx.setStorageSync(storageKey, list)

      wx.hideLoading()

      wx.showToast({
        title: editIndex >= 0 ? '修改成功' : '保存成功',
        icon: 'success'
      })

      setTimeout(() => {
        wx.navigateBack()
      }, 500)
    } catch (err) {
      wx.hideLoading()
      console.error('保存到云数据库失败', err)

      wx.showModal({
        title: '保存失败',
        content: '云数据库保存失败，请检查云开发环境、events 集合权限和网络状态。',
        showCancel: false
      })
    }
  }
})