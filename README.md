# Memorable Moments

一个基于微信小程序与微信云开发实现的「重要日子记录与提醒」应用。

支持：

* 事务 / 生日 / 纪念日
* 节日 / 节假日
* 阳历 / 农历
* 微信订阅消息提醒
* 云数据库同步

---

# 技术栈

* 微信小程序
* 微信云开发 CloudBase
* 云数据库
* 云函数
* 微信订阅消息

---

# 项目功能

## 1. 倒计时系统

支持：

* 事务
* 生日
* 纪念日
* 节日
* 节假日

并按剩余天数自动排序。

---

## 2. 农历支持

项目内置农历工具：

```text
miniprogram/utils/lunar.js
```

实现：

* 阳历 → 农历
* 农历 → 阳历
* 下一次日期自动计算
* 闰月处理

---

## 3. 云数据库

所有事件统一存储于：

```text
events 集合
```

数据结构：

```js
{
  type,
  name,
  remark,

  originalDate,
  calendarType,

  month,
  day,

  lunarMonth,
  lunarDay,
  isLeap,

  reminderEnabled,

  lastReminderDate,

  createdAt,
  updatedAt
}
```

---

# Reminder 流程

![Uploading image.png…]()

---

# 项目架构

```text
微信小程序前端
    ↓
云函数 sendReminder
    ↓
云数据库 events
    ↓
微信订阅消息
```

---

# 云函数

## login

用于获取用户 openid。

## sendReminder

负责：

* 查询提醒事件
* 自动判断日期
* 防重复提醒
* 发送订阅消息

---

# 项目结构

```text
.
├── miniprogram
│   ├── pages
│   │   ├── index
│   │   └── add
│   ├── utils
│   │   └── lunar.js
│   └── app.js
│
├── cloudfunctions
│   ├── login
│   └── sendReminder
│
└── project.config.json
```

---

# 部署

1. 开启微信云开发
2. 创建 events 集合
3. 配置订阅消息模板
4. 部署云函数
5. 上传并发布小程序

---

# 后续可扩展功能

* 自定义提醒时间
* 搜索 / 分类
* 分享卡片
* UI 优化
* 小组件支持

---

# License

MIT License
