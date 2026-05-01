'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { getTasks, createTask, updateTask } from '@/lib/api/tasks';
import { CheckSquare, Plus, X, Calendar, Clock } from 'lucide-react';

export function TasksPanel() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [newTask, setNewTask] = useState('');

  const { data: tasksData } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => getTasks({}),
  });

  const createMutation = useMutation({
    mutationFn: (title: string) => createTask({ title }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setNewTask('');
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, completed }: { id: string; completed: boolean }) => 
      updateTask(id, { completed }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const tasks = tasksData?.data || [];
  const pendingTasks = tasks.filter((t: any) => !t.completed);
  const completedTasks = tasks.filter((t: any) => t.completed);

  const handleAddTask = () => {
    if (newTask.trim()) {
      createMutation.mutate(newTask);
    }
  };

  const handleToggleTask = (task: any) => {
    toggleMutation.mutate({ id: task.id, completed: !task.completed });
  };

  if (!isOpen) {
    return (
      <Button variant="ghost" size="sm" onClick={() => setIsOpen(true)}>
        <CheckSquare className="w-4 h-4 mr-2" />
        Tasks ({pendingTasks.length})
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end pt-16 pr-4 bg-black/50">
      <Card className="w-96 max-h-[80vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="font-semibold">Tasks</h3>
          <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-4 border-b">
          <div className="flex gap-2">
            <Input
              placeholder="Add a new task..."
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
            />
            <Button size="sm" onClick={handleAddTask} disabled={createMutation.isPending}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            {pendingTasks.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Pending</p>
                {pendingTasks.map((task: any) => (
                  <div key={task.id} className="flex items-center gap-2 p-2 rounded hover:bg-muted/50">
                    <button
                      onClick={() => handleToggleTask(task)}
                      className="p-1 rounded hover:bg-muted"
                    >
                      <CheckSquare className="w-4 h-4" />
                    </button>
                    <span className="flex-1 text-sm">{task.title}</span>
                    {task.due_date && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(task.due_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {completedTasks.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Completed</p>
                {completedTasks.map((task: any) => (
                  <div key={task.id} className="flex items-center gap-2 p-2 rounded hover:bg-muted/50 opacity-60">
                    <button
                      onClick={() => handleToggleTask(task)}
                      className="p-1 rounded hover:bg-muted"
                    >
                      <CheckSquare className="w-4 h-4 text-primary" />
                    </button>
                    <span className="flex-1 text-sm line-through">{task.title}</span>
                  </div>
                ))}
              </div>
            )}

            {tasks.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">No tasks yet</p>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
