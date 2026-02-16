import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import App from '../App'

// Mock the API module
vi.mock('../api', () => ({
  fetchTodos: vi.fn(),
  createTodo: vi.fn(),
  updateTodo: vi.fn(),
  deleteTodo: vi.fn(),
  reorderTodos: vi.fn(),
}))

import { fetchTodos, createTodo, updateTodo, deleteTodo } from '../api'

beforeEach(() => {
  vi.clearAllMocks()
  fetchTodos.mockResolvedValue([])
})

describe('App', () => {
  it('renders the title', async () => {
    render(<App />)
    await waitFor(() => {
      expect(screen.getByText('ToDo List')).toBeInTheDocument()
    })
  })

  it('renders input and add button', async () => {
    render(<App />)
    await waitFor(() => {
      expect(screen.getByPlaceholderText('新しいタスクを入力...')).toBeInTheDocument()
      expect(screen.getByText('追加')).toBeInTheDocument()
    })
  })

  it('adds a new todo', async () => {
    createTodo.mockResolvedValue({
      id: 1,
      text: 'テストタスク',
      completed: false,
      priority: 'medium',
      due_date: null,
      category: '',
      sort_order: 0,
    })

    render(<App />)

    await waitFor(() => {
      expect(screen.getByPlaceholderText('新しいタスクを入力...')).toBeInTheDocument()
    })

    const input = screen.getByPlaceholderText('新しいタスクを入力...')
    fireEvent.change(input, { target: { value: 'テストタスク' } })
    fireEvent.click(screen.getByText('追加'))

    await waitFor(() => {
      expect(createTodo).toHaveBeenCalledWith({
        text: 'テストタスク',
        priority: 'medium',
        dueDate: null,
        category: '',
      })
      expect(screen.getByText('テストタスク')).toBeInTheDocument()
    })
  })

  it('toggles a todo', async () => {
    fetchTodos.mockResolvedValue([
      { id: 1, text: '既存タスク', completed: false, priority: 'medium', due_date: null, category: '', sort_order: 0 },
    ])
    updateTodo.mockResolvedValue({
      id: 1, text: '既存タスク', completed: true, priority: 'medium', due_date: null, category: '', sort_order: 0,
    })

    render(<App />)

    await waitFor(() => {
      expect(screen.getByText('既存タスク')).toBeInTheDocument()
    })

    const checkbox = screen.getByRole('checkbox')
    fireEvent.click(checkbox)

    await waitFor(() => {
      expect(updateTodo).toHaveBeenCalledWith(1, { completed: true })
    })
  })

  it('deletes a todo', async () => {
    fetchTodos.mockResolvedValue([
      { id: 1, text: '削除対象', completed: false, priority: 'medium', due_date: null, category: '', sort_order: 0 },
    ])
    deleteTodo.mockResolvedValue({ success: true })

    render(<App />)

    await waitFor(() => {
      expect(screen.getByText('削除対象')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('削除'))

    await waitFor(() => {
      expect(deleteTodo).toHaveBeenCalledWith(1)
      expect(screen.queryByText('削除対象')).not.toBeInTheDocument()
    })
  })

  it('filters todos by status', async () => {
    fetchTodos.mockResolvedValue([
      { id: 1, text: '未完了タスク', completed: false, priority: 'medium', due_date: null, category: '', sort_order: 0 },
      { id: 2, text: '完了タスク', completed: true, priority: 'medium', due_date: null, category: '', sort_order: 1 },
    ])

    render(<App />)

    await waitFor(() => {
      expect(screen.getByText('未完了タスク')).toBeInTheDocument()
      expect(screen.getByText('完了タスク')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('未完了'))
    expect(screen.getByText('未完了タスク')).toBeInTheDocument()
    expect(screen.queryByText('完了タスク')).not.toBeInTheDocument()

    fireEvent.click(screen.getByText('完了済み'))
    expect(screen.queryByText('未完了タスク')).not.toBeInTheDocument()
    expect(screen.getByText('完了タスク')).toBeInTheDocument()

    fireEvent.click(screen.getByText('すべて'))
    expect(screen.getByText('未完了タスク')).toBeInTheDocument()
    expect(screen.getByText('完了タスク')).toBeInTheDocument()
  })

  it('shows empty message when no todos', async () => {
    render(<App />)
    await waitFor(() => {
      expect(screen.getByText('タスクがありません')).toBeInTheDocument()
    })
  })

  it('shows remaining count', async () => {
    fetchTodos.mockResolvedValue([
      { id: 1, text: 'タスク1', completed: false, priority: 'medium', due_date: null, category: '', sort_order: 0 },
      { id: 2, text: 'タスク2', completed: true, priority: 'medium', due_date: null, category: '', sort_order: 1 },
    ])

    render(<App />)

    await waitFor(() => {
      expect(screen.getByText('残り 1 件のタスク')).toBeInTheDocument()
    })
  })
})
