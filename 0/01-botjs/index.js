import { Bot, InlineKeyboard, Keyboard } from 'grammy'

const bot = new Bot(process.env.BOT_TOKEN)

// tasks in memory: { userId: [ { id, title, done } ] }
// (restarting the bot clears them)
const tasks = {}
let nextId = 1

// users that are in the middle of writing a new task
const waitingForTitle = new Set()

bot.command('start', (ctx) =>
  ctx.reply(`Hi ${ctx.from.first_name}!`, {
    reply_markup: mainMenu(),
  })
)

bot.command('help', (ctx) =>
  ctx.reply('/start /list /new /cancel'))

bot.command('list', showList)
bot.command('new', startForm)
bot.command('cancel', (ctx) => {
  waitingForTitle.delete(ctx.from.id)
  return ctx.reply('Cancelled', { reply_markup: mainMenu() })
})

// the Menu button with the list of commands
bot.api.setMyCommands([
  { command: 'start', description: 'Main menu' },
  { command: 'list',  description: 'My tasks' },
  { command: 'new',   description: 'New task' },
  { command: 'cancel', description: 'Cancel' },
]).catch(() => {})


function mainMenu() {
  return new Keyboard()
    .text('New task').text('My tasks').row()
    .resized()
}

// a click sends the button text as a message
bot.hears('My tasks', showList)
bot.hears('New task', startForm)


function userTasks(userId) {
  if (!tasks[userId]) tasks[userId] = []
  return tasks[userId]
}

function findTask(userId, id) {
  return userTasks(userId).find((t) => t.id === Number(id))
}

function taskText(task) {
  return `${task.done ? '✅' : '⬜'} ${task.title}`
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

function startForm(ctx) {
  waitingForTitle.add(ctx.from.id)
  return ctx.reply('What is the task? (/cancel to stop)')
}

bot.callbackQuery(/^done:(\d+)$/, async (ctx) => {
  const task = findTask(ctx.from.id, ctx.match[1])
  if (!task) return ctx.answerCallbackQuery('Task not found')
  task.done = !task.done
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
  await ctx.answerCallbackQuery('Deleted')
  await ctx.deleteMessage()
})

// any other text: if we asked for a title, this is the new task
bot.on('message:text', async (ctx) => {
  if (!waitingForTitle.has(ctx.from.id)) {
    return ctx.reply('Use the buttons or /help', { reply_markup: mainMenu() })
  }
  waitingForTitle.delete(ctx.from.id)
  const task = { id: nextId++, title: ctx.message.text, done: false }
  userTasks(ctx.from.id).push(task)
  await ctx.reply('Added:', { reply_markup: mainMenu() })
  await ctx.reply(taskText(task), { reply_markup: taskButtons(task) })
})

bot.catch((err) => console.error('Bot error:', err.message))

bot.start()   // long polling: no public URL needed
console.log('Bot is running. Press Ctrl+C to stop.')
