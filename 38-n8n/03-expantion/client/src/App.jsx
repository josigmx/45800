import { useEffect, useState } from 'react';

export default function App() {
  const [expenses, setExpenses] = useState([]);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('אוכל');

  // GET all
  async function load() {
    const res = await fetch('/api/expenses');
    setExpenses(await res.json());
  }

  useEffect(() => {
    load();
  }, []);

  // POST create
  async function add(e) {
    e.preventDefault();
    if (!title || !(Number(amount) > 0)) {
      alert('צריך שם וסכום גדול מ-0');
      return;
    }
    await fetch('/api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description: '', amount: Number(amount), category }),
    });
    setTitle('');
    setAmount('');
    load();
  }

  // DELETE by id
  async function remove(id) {
    await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
    load();
  }

  const total = expenses.reduce((sum, x) => sum + Number(x.amount), 0);

  return (
    <div style={{ maxWidth: 650, margin: '40px auto', fontFamily: 'Arial' }}>
      <h1>מעקב הוצאות</h1>
      <h2>סה"כ: ₪{total}</h2>

      <form onSubmit={add}>
        <input placeholder="על מה?" value={title} onChange={(e) => setTitle(e.target.value)} />
        <input placeholder="סכום" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option>אוכל</option>
          <option>תחבורה</option>
          <option>בילויים</option>
          <option>כללי</option>
        </select>
        <button>הוסף</button>
      </form>

      <table width="100%">
        <thead>
          <tr><th>מה</th><th>סכום</th><th>קטגוריה</th><th>תאריך</th><th></th></tr>
        </thead>
        <tbody>
          {expenses.map((x) => (
            <tr key={x.id}>
              <td>{x.title}</td>
              <td>₪{x.amount}</td>
              <td>{x.category}</td>
              <td>{x.date}</td>
              <td><button onClick={() => remove(x.id)}>מחק</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
