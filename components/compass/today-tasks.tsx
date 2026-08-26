export function TodayTasks({
  tasks,
  onToggle,
  title,
  emptyText,
}: {
  tasks: { id: string; title: string; completed: boolean }[];
  onToggle: (id: string) => void;
  title: string;
  emptyText: string;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <h2 className="mb-3 font-medium text-gray-900">{title}</h2>
      {tasks.length === 0 ? (
        <p className="text-sm text-gray-500">{emptyText}</p>
      ) : (
        <ul className="space-y-2.5">
          {tasks.map((task) => (
            <li key={task.id} className="flex items-center gap-3">
              <input
                type="checkbox"
                id={`compass-task-${task.id}`}
                checked={task.completed}
                onChange={() => onToggle(task.id)}
                className="h-4 w-4 shrink-0 rounded border-gray-300 text-brand-600 focus:ring-1 focus:ring-brand-500"
              />
              <label
                htmlFor={`compass-task-${task.id}`}
                className={`text-sm transition ${task.completed ? "text-gray-400 line-through" : "text-gray-700"}`}
              >
                {task.title}
              </label>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
