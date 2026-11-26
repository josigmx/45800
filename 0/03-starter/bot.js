// תרגיל – בוט הזמנת קפה עם כפתורים
// הרצה:  node --env-file=.env bot.js
import { Bot, InlineKeyboard, Keyboard } from 'grammy'

const bot = new Bot(process.env.BOT_TOKEN)

// ---------- נתונים (מוכן בשבילכם) ----------
const MENU = {
  espresso:   { name: 'אספרסו',   price: 9 },
  latte:      { name: 'לאטה',     price: 14 },
  cappuccino: { name: 'קפוצ׳ינו', price: 13 },
  tea:        { name: 'תה',       price: 8 },
}
const SIZES = {
  S: { name: 'קטן',    extra: 0 },
  M: { name: 'בינוני', extra: 2 },
  L: { name: 'גדול',   extra: 4 },
}

const BTN_NEW = '☕ הזמנה חדשה'
const BTN_ORDERS = '🧾 ההזמנות שלי'

const orders = {} // { userId: [ { id, drink, size, name, total } ] }
const drafts = {} // { userId: { drink, size, name, step } }  הזמנה שבתהליך
let nextId = 1


// TODO שלב 1: /start שעונה "שלום <שם>!" ומציג מקלדת ראשית (Keyboard)
//             עם שני הכפתורים BTN_NEW ו-BTN_ORDERS


// TODO שלב 2: bot.hears(BTN_NEW, ...) – פותח drafts[userId] חדש
//             ושולח "מה תרצו לשתות?" עם InlineKeyboard של כל המשקאות ב-MENU
//             callback_data לדוגמה: 'drink:latte'


// TODO שלב 3: bot.callbackQuery(/^drink:(\w+)$/, ...)
//             שומר את המשקה בטיוטה, ומחליף את ההודעה (editMessageText)
//             לשאלה "איזה גודל?" עם כפתורי S / M / L וכפתור "חזרה"


// TODO שלב 4: bot.callbackQuery(/^size:(S|M|L)$/, ...)
//             שומר גודל, מסמן step = 'name' ושואל "איזה שם לכתוב על הכוס?"


// TODO שלב 5: bot.callbackQuery('confirm' / 'cancel', ...)
//             confirm – מעביר את הטיוטה ל-orders עם id ומחיר
//             cancel  – מוחק את הטיוטה


// TODO שלב 6: bot.hears(BTN_ORDERS, ...) – מציג כל הזמנה בהודעה נפרדת
//             עם כפתור "🗑 מחק" (callback_data: 'del:<id>')


// TODO שלב 7: פקודות /new /orders /cancel /help + bot.api.setMyCommands


// TODO שלב 3.5: טקסט חופשי – אם step === 'name' זה השם על הכוס.
//              שולחים סיכום עם כפתורי "✅ אישור" ו-"❌ ביטול".
//              (שימו את ה-handler הזה אחרון! למה?)
bot.on('message:text', (ctx) => {
  return ctx.reply('השתמשו בכפתורים או /help')
})


bot.catch((err) => console.error('Bot error:', err.message))

bot.start()
console.log('הבוט רץ. Ctrl+C לעצירה.')
