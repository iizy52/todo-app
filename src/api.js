const API_BASE = '/api/todos'

export async function fetchTodos() {
  const res = await fetch(API_BASE)
  if (!res.ok) throw new Error('Failed to fetch todos')
  return res.json()
}

export async function createTodo({ text, priority, dueDate, category }) {
  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, priority, dueDate, category }),
  })
  if (!res.ok) throw new Error('Failed to create todo')
  return res.json()
}

export async function updateTodo(id, updates) {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  })
  if (!res.ok) throw new Error('Failed to update todo')
  return res.json()
}

export async function deleteTodo(id) {
  const res = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete todo')
  return res.json()
}

export async function reorderTodos(orderedIds) {
  const res = await fetch(`${API_BASE}/reorder`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderedIds }),
  })
  if (!res.ok) throw new Error('Failed to reorder todos')
  return res.json()
}
