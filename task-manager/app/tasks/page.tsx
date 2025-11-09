"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { supabase } from "@/lib/supabaseClient";

type Task = {
  id: string;
  title: string;
  due_date?: string;
  note?: string;
  priority: "Low" | "Medium" | "High";
  completed: boolean;
  created_at?: string;
};

type FormData = {
  title: string;
  due_date?: string;
  note?: string;
  priority?: "Low" | "Medium" | "High";
  tags?: string;
  subtasks?: string;
  recurring_interval?: "daily" | "weekly" | "monthly";
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<"all" | "completed" | "pending">("all");
  const [sortBy, setSortBy] = useState<"newest" | "due" | "priority">("newest");
  const [step, setStep] = useState(1);

  const router = useRouter();
  const { register, handleSubmit, reset, watch } = useForm<FormData>();
  const selectedPriority = watch("priority") || "Medium";

  useEffect(() => {
    const fetchTasks = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }

      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) console.error("Error fetching tasks:", error.message);
      else setTasks(data || []);
    };

    fetchTasks();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) router.push("/login");
    });

    return () => subscription.unsubscribe();
  }, [router]);

  const addTask = async (data: FormData) => {
    if (!data.title.trim()) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data: newTask, error } = await supabase
      .from("tasks")
      .insert([{
        user_id: session.user.id,
        title: data.title,
        due_date: data.due_date || null,
        note: data.note || null,
        priority: data.priority || "Medium",
      }])
      .select()
      .single();

    if (error) {
      console.error("Error adding task:", error.message);
      return;
    }

    if (newTask) setTasks(prev => [newTask, ...prev]);
    reset();
    setStep(1);
  };

  const deleteTask = async (id: string) => {
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (error) {
      console.error("Error deleting task:", error.message);
      return;
    }
    setTasks(prev => prev.filter(task => task.id !== id));
  };

  const toggleTask = async (task: Task) => {
    const { data: updatedTask, error } = await supabase
      .from("tasks")
      .update({ completed: !task.completed })
      .eq("id", task.id)
      .select()
      .single();

    if (error) {
      console.error("Error toggling task:", error.message);
      return;
    }

    if (updatedTask) setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
  };

  const filteredTasks = useMemo(() => {
    let result = [...tasks].map(t => ({ ...t, completed: !!t.completed }));

    if (filter === "completed") result = result.filter(t => t.completed);
    if (filter === "pending") result = result.filter(t => !t.completed);

    if (sortBy === "due") {
      result.sort((a, b) => {
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return a.due_date.localeCompare(b.due_date);
      });
    } else if (sortBy === "priority") {
      const priorityOrder = { High: 1, Medium: 2, Low: 3 };
      result.sort((a, b) => (priorityOrder[a.priority] || 3) - (priorityOrder[b.priority] || 3));
    } else {
      result.sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
    }

    return result;
  }, [tasks, filter, sortBy]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High":
        return "bg-red-100 text-red-800 border-red-400";
      case "Medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-400";
      case "Low":
        return "bg-green-100 text-green-800 border-green-400";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getFormColor = (priority: string) => {
    switch (priority) {
      case "High": return "border-red-500 focus:ring-red-300 bg-red-50";
      case "Medium": return "border-yellow-500 focus:ring-yellow-300 bg-yellow-50";
      case "Low": return "border-green-500 focus:ring-green-300 bg-green-50";
      default: return "border-gray-300 focus:ring-gray-200 bg-white";
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Advanced Task Manager</h1>

      {/* Wizard Form with Colors */}
      <form onSubmit={handleSubmit(addTask)} className="mb-6 border rounded p-4 shadow-sm space-y-4">
        {/* Step 1 */}
        {step === 1 && (
          <div className="space-y-2">
            <input
              {...register("title")}
              placeholder="Task title"
              className={`border rounded p-2 w-full ${getFormColor(selectedPriority)}`}
              required
            />
            <select
              {...register("priority")}
              defaultValue="Medium"
              className={`border rounded p-2 w-full ${getFormColor(selectedPriority)}`}
            >
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
            </select>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="space-y-2">
            <input
              {...register("due_date")}
              type="date"
              className="border rounded p-2 w-full bg-blue-50 border-blue-300 focus:ring-blue-200"
            />
            <textarea
              {...register("note")}
              placeholder="Note"
              className="border rounded p-2 w-full bg-gray-50 border-gray-300 focus:ring-gray-200"
            />
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div className="space-y-2">
            <input
              {...register("tags")}
              placeholder="Tags (comma separated)"
              className="border rounded p-2 w-full bg-purple-50 border-purple-300 focus:ring-purple-200"
            />
            <input
              {...register("subtasks")}
              placeholder="Subtasks (comma separated)"
              className="border rounded p-2 w-full bg-indigo-50 border-indigo-300 focus:ring-indigo-200"
            />
            <select
              {...register("recurring_interval")}
              className="border rounded p-2 w-full bg-pink-50 border-pink-300 focus:ring-pink-200"
            >
              <option value="">Recurring?</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-2">
          {step > 1 && <button type="button" onClick={() => setStep(step - 1)} className="px-4 py-2 border rounded hover:bg-gray-100 transition">Back</button>}
          {step < 3 && <button type="button" onClick={() => setStep(step + 1)} className="px-4 py-2 border rounded hover:bg-gray-100 transition">Next</button>}
          {step === 3 && <button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">Add Task</button>}
        </div>
      </form>

      {/* Filters & Sorting */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div>
          <span className="mr-2 font-semibold">Filter:</span>
          <select
            value={filter}
            onChange={e => setFilter(e.target.value as any)}
            className="border rounded p-1"
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        <div>
          <span className="mr-2 font-semibold">Sort by:</span>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="border rounded p-1"
          >
            <option value="newest">Newest</option>
            <option value="due">Due Date</option>
            <option value="priority">Priority</option>
          </select>
        </div>
      </div>

      {/* Task List */}
      <ul className="space-y-2">
        {filteredTasks.length === 0 ? (
          <p className="text-gray-500 text-center">No tasks to show.</p>
        ) : (
          filteredTasks.map(task => (
            <li key={task.id} className={`flex flex-col gap-1 border rounded p-2 ${getPriorityColor(task.priority)} transition-colors duration-300`}>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={(e) => {
                    e.stopPropagation();
                    toggleTask(task);
                  }}
                  className="cursor-pointer"
                />
                <span className={`flex-1 font-medium ${task.completed ? "line-through opacity-70" : ""}`}>
                  {task.title} ({task.priority})
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteTask(task.id);
                  }}
                  className="text-red-600 hover:text-red-800 font-semibold"
                >
                  Delete
                </button>
              </div>
              {task.due_date && <p className="text-sm">Due: {task.due_date}</p>}
              {task.note && <p className="text-sm">{task.note}</p>}
              {task.created_at && <p className="text-xs opacity-70">Created: {new Date(task.created_at).toLocaleString()}</p>}
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
