// בוט משימות – פתרון תרגול עצמאי (תרגיל 1, 2, 3 + אתגר)
// הרצה:  npm start   (או npm run dev כדי שיעלה מחדש בכל שמירה)
//
// תרגיל 1: פקודה ‎/clear שמוחקת את כל המשימות, ונוספה ל-setMyCommands
// תרגיל 2: אחרי העדיפות הבוט שואל על תאריך יעד (step חדש ב-Map של הטופס)
// תרגיל 3: Mini App עם שדה הערות (notes) שנשלח לבוט ב-sendData
// אתגר:    המשימות נשמרות בקובץ tasks.json, ולא נמחקות כשהבוט עולה מחדש

import { Bot, InlineKeyboard, Keyboard } from 'grammy'
import express from 'express'
import fs from 'node:fs'

const bot = new Bot(process.env.BOT_TOKEN)

// ================================================================ אתגר: שמירה לקובץ
// במקום להחזיק את המשימות רק בזיכרון, כותבים אותן לקובץ JSON אחרי כל שינוי,
// וקוראים אותו פעם אחת כשהבוט עולה.
const DATA_FILE = 'tasks.json'

function loadData() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'))
  } catch {
    // אין קובץ עדיין (הפעלה ראשונה) או שהוא פגום: מתחילים מאפס
    return { tasks: {}, nextId: 1 }
  }
}

function saveData() {
  // שומרים גם את nextId, אחרת אחרי הפעלה מחדש ה-id יתחילו שוב מ-1 ויתנגשו
  fs.writeFileSync(DATA_FILE, JSON.stringify({ tasks, nextId }, null, 2))
}

const data = loadData()

// tasks: { userId: [ { id, title, priority, due, notes, done } ] }
const tasks = data.tasks
let nextId = data.nextId

// ================================================================ תרגיל 2: הטופס כ-Map של שלבים
// במקום Set ("מי באמצע לכתוב כותרת") יש Map שזוכר לכל משתמש באיזה שלב הוא
// ומה כבר ענה:  userId -> { step: 'title' | 'priority' | 'due', title, priority }
const forms = new Map()

const PRIORITY = { high: '🔴 High', normal: '🟡 Normal', low: '🟢 Low' }

// ================================================================ פקודות
bot.command('start', (ctx) =>
  ctx.reply(`Hi ${ctx.from.first_name}!`, {
    reply_markup: mainMenu(),
  })
)

bot.command('help', (ctx) =>
  ctx.reply('/start /list /new /clear /cancel'))

bot.command('list', showList)
bot.command('new', startForm)

bot.command('cancel', (ctx) => {
  forms.delete(ctx.from.id) // יוצאים מהטופס, בכל שלב שהוא
  return ctx.reply('Cancelled', { reply_markup: mainMenu() })
})

// ---------------------------------------------------------------- תרגיל 1: ‎/clear
bot.command('clear', async (ctx) => {
  const count = userTasks(ctx.from.id).length
  if (count === 0) return ctx.reply('Nothing to clear, the list is already empty.')
  tasks[ctx.from.id] = [] // מוחקים רק את המשימות של המשתמש הזה, לא של כולם
  saveData()
  await ctx.reply(`Deleted ${count} task${count === 1 ? '' : 's'} 🗑`, { reply_markup: mainMenu() })
})

// the Menu button with the list of commands
// תרגיל 1: הוספנו את clear לרשימה, כדי שיופיע בכפתור Menu
bot.api.setMyCommands([
  { command: 'start', description: 'Main menu' },
  { command: 'list',  description: 'My tasks' },
  { command: 'new',   description: 'New task' },
  { command: 'clear', description: 'Delete all my tasks' },
  { command: 'cancel', description: 'Cancel' },
]).catch(() => {})

// ================================================================ תפריט (Reply Keyboard)
function mainMenu() {
  const kb = new Keyboard()
    .text('New task').text('My tasks').row()
  // תרגיל 3: כפתור שפותח את ה-Mini App. רק כשיש כתובת https ב-.env
  // (sendData עובד רק כשה-Mini App נפתח מכפתור כזה, ב-Reply Keyboard)
  if (process.env.WEBAPP_URL) kb.webApp('📝 Full form', process.env.WEBAPP_URL)
  return kb.resized()
}

// a click sends the button text as a message
bot.hears('My tasks', showList)
bot.hears('New task', startForm)

// ================================================================ עזרים
function userTasks(userId) {
  if (!tasks[userId]) tasks[userId] = []
  return tasks[userId]
}

function findTask(userId, id) {
  return userTasks(userId).find((t) => t.id === Number(id))
}

function taskText(task) {
  let text = `${task.done ? '✅' : '⬜'} ${task.title}`
  if (task.priority) text += `\nPriority: ${PRIORITY[task.priority]}`
  if (task.due) text += `\nDue: ${task.due}`        // תרגיל 2
  if (task.notes) text += `\nNotes: ${task.notes}`  // תרגיל 3
  return text
}

function taskButtons(task) {
  return new InlineKeyboard()
    .text('Done', `done:${task.id}`)
    .text('Delete', `del:${task.id}`)
}

async function showList(ctx) {
  const list = userTasks(ctx.from.id)
  if (list.length === 0) return ctx.reply('No tasks yet. Press "New task".')
  for (const task of list) {
    await ctx.reply(taskText(task), { reply_markup: taskButtons(task) })
  }
}

// יוצר משימה, שומר לקובץ ומציג אותה עם הכפתורים
async function addTask(ctx, fields, intro) {
  const task = { id: nextId++, done: false, priority: 'normal', due: null, notes: '', ...fields }
  userTasks(ctx.from.id).push(task)
  saveData()
  await ctx.reply(intro, { reply_markup: mainMenu() })
  await ctx.reply(taskText(task), { reply_markup: taskButtons(task) })
}

// ================================================================ הטופס בשאלה ותשובה
// שלב 1: כותרת  ->  שלב 2: עדיפות (כפתורים)  ->  שלב 3: תאריך יעד (תרגיל 2)
function startForm(ctx) {
  forms.set(ctx.from.id, { step: 'title' })
  return ctx.reply('What is the task? (/cancel to stop)')
}

// שלב 2: לחיצה על כפתור עדיפות
bot.callbackQuery(/^prio:(high|normal|low)$/, async (ctx) => {
  const form = forms.get(ctx.from.id)
  if (form?.step !== 'priority') return ctx.answerCallbackQuery('This form is closed')
  // תרגיל 2: לא שומרים עדיין! עוברים לשלב חדש, 'due', וזוכרים את העדיפות
  forms.set(ctx.from.id, { ...form, step: 'due', priority: ctx.match[1] })
  await ctx.answerCallbackQuery()
  await ctx.editMessageText(
    `"${form.title}"\nPriority: ${PRIORITY[ctx.match[1]]}\n\nDue date? Write it as YYYY-MM-DD (for example 2026-12-31)`,
    { reply_markup: new InlineKeyboard().text('Skip, no date', 'due:skip') }
  )
})

// שלב 3 בלי תאריך: כפתור "Skip"
bot.callbackQuery('due:skip', async (ctx) => {
  const form = forms.get(ctx.from.id)
  if (form?.step !== 'due') return ctx.answerCallbackQuery('This form is closed')
  forms.delete(ctx.from.id)
  await ctx.answerCallbackQuery()
  await ctx.editMessageReplyMarkup() // מורידים את הכפתור מההודעה הקודמת
  await addTask(ctx, { title: form.title, priority: form.priority }, 'Added:')
})

// ================================================================ כפתורי משימה (Inline Keyboard)
bot.callbackQuery(/^done:(\d+)$/, async (ctx) => {
  const task = findTask(ctx.from.id, ctx.match[1])
  if (!task) return ctx.answerCallbackQuery('Task not found')
  task.done = !task.done
  saveData() // אתגר: כל שינוי נשמר לקובץ
  await ctx.answerCallbackQuery(task.done ? 'Well done!' : 'Marked as not done')
  await ctx.editMessageText(taskText(task), {
    reply_markup: taskButtons(task),
  })
})

bot.callbackQuery(/^del:(\d+)$/, async (ctx) => {
  const list = userTasks(ctx.from.id)
  const i = list.findIndex((t) => t.id === Number(ctx.match[1]))
  if (i === -1) return ctx.answerCallbackQuery('Task not found')
  list.splice(i, 1)
  saveData()
  await ctx.answerCallbackQuery('Deleted')
  await ctx.deleteMessage()
})

// ================================================================ תרגיל 3: נתונים מה-Mini App
// public/index.html קורא ל-Telegram.WebApp.sendData(JSON), והנתונים מגיעים לכאן
bot.on('message:web_app_data', async (ctx) => {
  let form
  try {
    form = JSON.parse(ctx.message.web_app_data.data)
  } catch {
    return ctx.reply('Could not read the form data 🤔')
  }
  const title = String(form.title || '').trim()
  if (title.length < 2) return ctx.reply('The title is too short.')
  await addTask(ctx, {
    title,
    priority: PRIORITY[form.priority] ? form.priority : 'normal',
    due: isValidDate(form.due) ? form.due : null,
    notes: String(form.notes || '').trim().slice(0, 500), // השדה החדש
  }, 'Got it from the form 📝')
})

// ================================================================ כל טקסט אחר
// לפי השלב שהמשתמש נמצא בו בטופס, מחליטים מה הטקסט אומר
bot.on('message:text', async (ctx) => {
  const form = forms.get(ctx.from.id)

  if (!form) {
    return ctx.reply('Use the buttons or /help', { reply_markup: mainMenu() })
  }

  // שלב 1: הטקסט הוא הכותרת
  if (form.step === 'title') {
    const title = ctx.message.text.trim()
    if (title.length < 2) return ctx.reply('Too short, try again:')
    forms.set(ctx.from.id, { step: 'priority', title })
    return ctx.reply(`"${title}"\nPriority?`, {
      reply_markup: new InlineKeyboard()
        .text(PRIORITY.high, 'prio:high')
        .text(PRIORITY.normal, 'prio:normal')
        .text(PRIORITY.low, 'prio:low'),
    })
  }

  // שלב 2: מחכים ללחיצה על כפתור, לא לטקסט
  if (form.step === 'priority') {
    return ctx.reply('Please choose a priority with the buttons above 👆')
  }

  // תרגיל 2 – שלב 3: הטקסט הוא תאריך היעד
  if (form.step === 'due') {
    const due = ctx.message.text.trim()
    if (!isValidDate(due)) {
      return ctx.reply('Please write the date as YYYY-MM-DD, for example 2026-12-31')
    }
    forms.delete(ctx.from.id)
    return addTask(ctx, { title: form.title, priority: form.priority, due }, 'Added:')
  }
})

// תאריך בפורמט YYYY-MM-DD שהוא גם תאריך אמיתי (לא 2026-02-31)
function isValidDate(text) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text || '')) return false
  const d = new Date(text + 'T00:00:00Z')
  return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(text)
}

bot.catch((err) => console.error('Bot error:', err.message))

// ================================================================ תרגיל 3: שרת לדף ה-Mini App
// Express מגיש את התיקייה public. cloudflared מחבר את הפורט הזה לכתובת https:
//   cloudflared tunnel --url http://localhost:3500
// ואת הכתובת שהוא נותן מדביקים ב-WEBAPP_URL בקובץ .env
const app = express()
app.use(express.static('public'))
const port = process.env.PORT || 3500
app.listen(port, () => console.log(`Mini App page on http://localhost:${port}`))

bot.start()   // long polling: no public URL needed
console.log('Bot is running. Press Ctrl+C to stop.')

// print every call the bot makes to Telegram
// bot.api.config.use(async (prev, method, payload, signal) => {
//   const start = Date.now()
//   const res = await prev(method, payload, signal)
//   const n = method === 'getUpdates' ? ` (${res.result?.length ?? 0} updates)` : ''
//   console.log(`${new Date().toLocaleTimeString()}  ${method}${n}  ${Date.now() - start}ms`)
//   return res
// })

// 22:10:01  getUpdates (0 updates)  30012ms
// 22:10:31  getUpdates (0 updates)  30008ms
// 22:10:44  getUpdates (1 updates)  12950ms
// 22:10:44  sendMessage  180ms
