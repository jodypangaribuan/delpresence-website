"use client"

import React, { useState, useEffect } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash } from 'lucide-react';

// Define the todo item type
interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

export default function TodoList() {
  // State for todos and new todo text
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState('');

  // Load todos from localStorage on component mount
  useEffect(() => {
    const savedTodos = localStorage.getItem('todos');
    if (savedTodos) {
      setTodos(JSON.parse(savedTodos));
    }
  }, []);

  // Save todos to localStorage whenever todos change
  useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(todos));
  }, [todos]);

  // Add a new todo
  const addTodo = () => {
    if (newTodo.trim() !== '') {
      const newTodoItem: Todo = {
        id: Date.now(),
        text: newTodo,
        completed: false,
      };
      setTodos([...todos, newTodoItem]);
      setNewTodo('');
    }
  };

  // Toggle todo completion status
  const toggleTodo = (id: number, checked: boolean) => {
    setTodos(
      todos.map((todo) =>
        todo.id === id ? { ...todo, completed: checked } : todo
      )
    );
  };

  // Delete a todo
  const deleteTodo = (id: number) => {
    setTodos(todos.filter((todo) => todo.id !== id));
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addTodo();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-4">Todo List</h1>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            type="text"
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            placeholder="Add a new task..."
            className="flex-1"
          />
          <Button type="submit">Add</Button>
        </form>
      </div>

      <div className="space-y-2">
        {todos.length === 0 ? (
          <p className="text-neutral-500">No tasks yet. Add one above!</p>
        ) : (
          todos.map((todo) => (
            <div
              key={todo.id}
              className="flex items-center gap-3 p-3 border rounded-md bg-white"
            >
              <Checkbox 
                id={`todo-${todo.id}`}
                checked={todo.completed}
                onCheckedChange={(checked) => toggleTodo(todo.id, checked as boolean)}
              />
              <label
                htmlFor={`todo-${todo.id}`}
                className={`flex-1 ${
                  todo.completed ? 'line-through text-neutral-400' : ''
                }`}
              >
                {todo.text}
              </label>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => deleteTodo(todo.id)}
                aria-label="Delete task"
              >
                <Trash className="h-4 w-4" />
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
} 