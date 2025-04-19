import TodoList from "@/components/Todo"

export const metadata = {
  title: "Todo List | DelPresence",
  description: "Manage your tasks with our simple todo application",
}

export default function TodosPage() {
  return (
    <main className="py-10">
      <div className="container mx-auto">
        <TodoList />
      </div>
    </main>
  )
} 