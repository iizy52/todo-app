import express from 'express'
import cors from 'cors'
import db from './db.js'

const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json())

// GET /api/todos
app.get('/api/todos', (req, res) => {
  const todos = db.prepare('SELECT * FROM todos ORDER BY sort_order ASC').all()
  res.json(todos.map(t => ({ ...t, completed: !!t.completed })))
})

// POST /api/todos
app.post('/api/todos', (req, res) => {
  const { text, priority = 'medium', dueDate = null, category = '' } = req.body
  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'Text is required' })
  }

  const maxOrder = db.prepare('SELECT COALESCE(MAX(sort_order), -1) as max FROM todos').get()
  const sortOrder = maxOrder.max + 1

  const result = db.prepare(
    'INSERT INTO todos (text, priority, due_date, category, sort_order) VALUES (?, ?, ?, ?, ?)'
  ).run(text.trim(), priority, dueDate, category, sortOrder)

  const todo = db.prepare('SELECT * FROM todos WHERE id = ?').get(result.lastInsertRowid)
  res.status(201).json({ ...todo, completed: !!todo.completed })
})

// PUT /api/todos/:id
app.put('/api/todos/:id', (req, res) => {
  const { id } = req.params
  const todo = db.prepare('SELECT * FROM todos WHERE id = ?').get(id)
  if (!todo) return res.status(404).json({ error: 'Todo not found' })

  const { text, completed, priority, dueDate, category } = req.body

  const updated = {
    text: text !== undefined ? text.trim() : todo.text,
    completed: completed !== undefined ? (completed ? 1 : 0) : todo.completed,
    priority: priority !== undefined ? priority : todo.priority,
    due_date: dueDate !== undefined ? dueDate : todo.due_date,
    category: category !== undefined ? category : todo.category,
  }

  db.prepare(
    'UPDATE todos SET text = ?, completed = ?, priority = ?, due_date = ?, category = ? WHERE id = ?'
  ).run(updated.text, updated.completed, updated.priority, updated.due_date, updated.category, id)

  const result = db.prepare('SELECT * FROM todos WHERE id = ?').get(id)
  res.json({ ...result, completed: !!result.completed })
})

// DELETE /api/todos/:id
app.delete('/api/todos/:id', (req, res) => {
  const { id } = req.params
  const result = db.prepare('DELETE FROM todos WHERE id = ?').run(id)
  if (result.changes === 0) return res.status(404).json({ error: 'Todo not found' })
  res.json({ success: true })
})

// PUT /api/todos/reorder
app.put('/api/todos/reorder', (req, res) => {
  const { orderedIds } = req.body
  if (!Array.isArray(orderedIds)) {
    return res.status(400).json({ error: 'orderedIds array is required' })
  }

  const update = db.prepare('UPDATE todos SET sort_order = ? WHERE id = ?')
  const updateMany = db.transaction((ids) => {
    ids.forEach((id, index) => update.run(index, id))
  })
  updateMany(orderedIds)

  res.json({ success: true })
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
