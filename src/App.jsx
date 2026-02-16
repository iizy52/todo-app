import { useState, useEffect, useCallback } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { fetchTodos, createTodo, updateTodo, deleteTodo, reorderTodos } from './api'
import './App.css'

function SortableItem({ todo, onToggle, onDelete, onStartEdit, editingId, editText, onEditChange, onEditKeyDown, onEditBlur }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: todo.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const isOverdue = todo.due_date && !todo.completed && new Date(todo.due_date) < new Date(new Date().toDateString())
  const isDueSoon = todo.due_date && !todo.completed && !isOverdue &&
    new Date(todo.due_date) <= new Date(Date.now() + 3 * 86400000)

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`${todo.completed ? 'completed' : ''} priority-${todo.priority} ${isOverdue ? 'overdue' : ''} ${isDueSoon ? 'due-soon' : ''}`}
    >
      <span className="drag-handle" {...attributes} {...listeners}>⠿</span>
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => onToggle(todo.id, !todo.completed)}
      />
      {editingId === todo.id ? (
        <input
          type="text"
          className="edit-input"
          value={editText}
          onChange={onEditChange}
          onKeyDown={(e) => onEditKeyDown(e, todo.id)}
          onBlur={() => onEditBlur(todo.id)}
          autoFocus
        />
      ) : (
        <>
          <div className="todo-content">
            <span className="todo-text" onDoubleClick={() => onStartEdit(todo)}>
              {todo.text}
            </span>
            <div className="todo-meta">
              {todo.category && <span className="tag category-tag">{todo.category}</span>}
              <span className={`tag priority-tag ${todo.priority}`}>
                {todo.priority === 'high' ? '高' : todo.priority === 'medium' ? '中' : '低'}
              </span>
              {todo.due_date && (
                <span className={`tag date-tag ${isOverdue ? 'overdue' : ''}`}>
                  {todo.due_date}
                </span>
              )}
            </div>
          </div>
          <div className="actions">
            <button className="edit-btn" onClick={() => onStartEdit(todo)}>編集</button>
            <button className="delete-btn" onClick={() => onDelete(todo.id)}>削除</button>
          </div>
        </>
      )}
    </li>
  )
}

function App() {
  const [todos, setTodos] = useState([])
  const [input, setInput] = useState('')
  const [priority, setPriority] = useState('medium')
  const [dueDate, setDueDate] = useState('')
  const [category, setCategory] = useState('')
  const [filter, setFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [editingId, setEditingId] = useState(null)
  const [editText, setEditText] = useState('')
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light')
    localStorage.setItem('darkMode', darkMode)
  }, [darkMode])

  const loadTodos = useCallback(async () => {
    try {
      const data = await fetchTodos()
      setTodos(data)
    } catch (err) {
      console.error('Failed to load todos:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadTodos() }, [loadTodos])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleAdd = async () => {
    const text = input.trim()
    if (!text) return
    try {
      const newTodo = await createTodo({ text, priority, dueDate: dueDate || null, category })
      setTodos(prev => [...prev, newTodo])
      setInput('')
      setPriority('medium')
      setDueDate('')
      setCategory('')
    } catch (err) {
      console.error('Failed to add todo:', err)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleAdd()
  }

  const handleToggle = async (id, completed) => {
    try {
      const updated = await updateTodo(id, { completed })
      setTodos(prev => prev.map(t => t.id === id ? updated : t))
    } catch (err) {
      console.error('Failed to toggle todo:', err)
    }
  }

  const handleDelete = async (id) => {
    try {
      await deleteTodo(id)
      setTodos(prev => prev.filter(t => t.id !== id))
    } catch (err) {
      console.error('Failed to delete todo:', err)
    }
  }

  const startEdit = (todo) => {
    setEditingId(todo.id)
    setEditText(todo.text)
  }

  const saveEdit = async (id) => {
    const text = editText.trim()
    if (!text) return
    try {
      const updated = await updateTodo(id, { text })
      setTodos(prev => prev.map(t => t.id === id ? updated : t))
      setEditingId(null)
      setEditText('')
    } catch (err) {
      console.error('Failed to save edit:', err)
    }
  }

  const handleEditKeyDown = (e, id) => {
    if (e.key === 'Enter') saveEdit(id)
    if (e.key === 'Escape') {
      setEditingId(null)
      setEditText('')
    }
  }

  const handleDragEnd = async (event) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = todos.findIndex(t => t.id === active.id)
    const newIndex = todos.findIndex(t => t.id === over.id)
    const reordered = arrayMove(todos, oldIndex, newIndex)
    setTodos(reordered)

    try {
      await reorderTodos(reordered.map(t => t.id))
    } catch (err) {
      console.error('Failed to reorder:', err)
      loadTodos()
    }
  }

  const categories = [...new Set(todos.map(t => t.category).filter(Boolean))]

  const filteredTodos = todos.filter(todo => {
    if (filter === 'active' && todo.completed) return false
    if (filter === 'completed' && !todo.completed) return false
    if (priorityFilter !== 'all' && todo.priority !== priorityFilter) return false
    if (categoryFilter !== 'all' && todo.category !== categoryFilter) return false
    return true
  })

  const remaining = todos.filter(t => !t.completed).length

  if (loading) return <div className="app"><p className="loading">読み込み中...</p></div>

  return (
    <div className="app">
      <header className="app-header">
        <h1>ToDo List</h1>
        <button className="theme-toggle" onClick={() => setDarkMode(!darkMode)}>
          {darkMode ? '☀️' : '🌙'}
        </button>
      </header>

      <div className="add-form">
        <div className="input-row">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="新しいタスクを入力..."
          />
          <button className="add-btn" onClick={handleAdd}>追加</button>
        </div>
        <div className="options-row">
          <select value={priority} onChange={(e) => setPriority(e.target.value)}>
            <option value="high">優先度: 高</option>
            <option value="medium">優先度: 中</option>
            <option value="low">優先度: 低</option>
          </select>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="カテゴリ"
            className="category-input"
          />
        </div>
      </div>

      <div className="filter-section">
        <div className="filters">
          <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>すべて</button>
          <button className={filter === 'active' ? 'active' : ''} onClick={() => setFilter('active')}>未完了</button>
          <button className={filter === 'completed' ? 'active' : ''} onClick={() => setFilter('completed')}>完了済み</button>
        </div>
        <div className="filters">
          <button className={priorityFilter === 'all' ? 'active' : ''} onClick={() => setPriorityFilter('all')}>全優先度</button>
          <button className={priorityFilter === 'high' ? 'active' : ''} onClick={() => setPriorityFilter('high')}>高</button>
          <button className={priorityFilter === 'medium' ? 'active' : ''} onClick={() => setPriorityFilter('medium')}>中</button>
          <button className={priorityFilter === 'low' ? 'active' : ''} onClick={() => setPriorityFilter('low')}>低</button>
        </div>
        {categories.length > 0 && (
          <div className="filters">
            <button className={categoryFilter === 'all' ? 'active' : ''} onClick={() => setCategoryFilter('all')}>全カテゴリ</button>
            {categories.map(cat => (
              <button
                key={cat}
                className={categoryFilter === cat ? 'active' : ''}
                onClick={() => setCategoryFilter(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={filteredTodos.map(t => t.id)} strategy={verticalListSortingStrategy}>
          <ul className="todo-list">
            {filteredTodos.map(todo => (
              <SortableItem
                key={todo.id}
                todo={todo}
                onToggle={handleToggle}
                onDelete={handleDelete}
                onStartEdit={startEdit}
                editingId={editingId}
                editText={editText}
                onEditChange={(e) => setEditText(e.target.value)}
                onEditKeyDown={handleEditKeyDown}
                onEditBlur={saveEdit}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>

      {filteredTodos.length === 0 && (
        <p className="empty-message">タスクがありません</p>
      )}

      {todos.length > 0 && (
        <p className="status">残り {remaining} 件のタスク</p>
      )}
    </div>
  )
}

export default App
