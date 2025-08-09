'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Calendar, Clock, Plus, Trash2, Download, Presentation } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  time: string;
  duration: string;
  priority: 'high' | 'medium' | 'low';
}

export default function PlannerPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState({ title: '', time: '', duration: '30', priority: 'medium' as const });
  const [plannerDate, setPlannerDate] = useState(new Date().toISOString().split('T')[0]);

  const addTask = () => {
    if (!newTask.title || !newTask.time) return;
    
    const task: Task = {
      id: Date.now().toString(),
      ...newTask
    };
    
    setTasks([...tasks, task]);
    setNewTask({ title: '', time: '', duration: '30', priority: 'medium' });
  };

  const removeTask = (id: string) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  const generatePlannerSlides = () => {
    if (tasks.length === 0) return;
    
    const plannerPrompt = `Create a daily planner presentation for ${plannerDate} with the following tasks:
    
${tasks.map(task => `- ${task.time}: ${task.title} (${task.duration} minutes, ${task.priority} priority)`).join('\n')}

Include slides for:
1. Daily Overview with date and motivation
2. Morning Schedule (detailed time blocks)
3. Afternoon Schedule (detailed time blocks)  
4. Evening Schedule and wind-down
5. Priority Tasks Summary with focus areas
6. Break Times and Self-Care reminders
7. Time Management Tips and productivity hacks
8. Tomorrow's Preparation checklist

Make it professional, organized, and motivating with:
- Clear time blocks and priority indicators
- Productivity tips and energy optimization
- Motivational quotes and positive reinforcement
- Visual hierarchy for different priority levels
- Actionable daily reflection prompts`;

    router.push(`/generate?prompt=${encodeURIComponent(plannerPrompt)}&type=planner`);
  };

  const exportPlannerPDF = () => {
    // Simple PDF export using browser print
    const printContent = `
      <html>
        <head>
          <title>Daily Planner - ${plannerDate}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .task { margin: 10px 0; padding: 10px; border-left: 4px solid #0891b2; }
            .high { border-left-color: #dc2626; }
            .medium { border-left-color: #ea580c; }
            .low { border-left-color: #16a34a; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Daily Planner</h1>
            <h2>${new Date(plannerDate).toLocaleDateString()}</h2>
          </div>
          ${tasks.map(task => `
            <div class="task ${task.priority}">
              <strong>${task.time}</strong> - ${task.title}
              <br><small>${task.duration} minutes | ${task.priority} priority</small>
            </div>
          `).join('')}
        </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  if (!user) {
    router.push('/auth');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-emerald-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Calendar className="h-8 w-8 text-teal-600" />
              <span className="text-xl font-bold text-gray-900">Day Planner</span>
            </div>
            <div className="flex items-center space-x-4">
              <Button onClick={() => router.push('/dashboard')} variant="outline">
                Dashboard
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Date Selection */}
        <Card className="mb-8 border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-teal-600" />
              <span>Plan Your Day</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <Input
                type="date"
                value={plannerDate}
                onChange={(e) => setPlannerDate(e.target.value)}
                className="w-auto"
              />
              <span className="text-gray-600">
                {new Date(plannerDate).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Add Task Form */}
        <Card className="mb-8 border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Plus className="h-5 w-5 text-teal-600" />
              <span>Add Task</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Input
                placeholder="Task title"
                value={newTask.title}
                onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                className="md:col-span-2"
              />
              <Input
                type="time"
                value={newTask.time}
                onChange={(e) => setNewTask({...newTask, time: e.target.value})}
              />
              <div className="flex space-x-2">
                <Input
                  type="number"
                  placeholder="Duration (min)"
                  value={newTask.duration}
                  onChange={(e) => setNewTask({...newTask, duration: e.target.value})}
                  className="w-24"
                />
                <select
                  value={newTask.priority}
                  onChange={(e) => setNewTask({...newTask, priority: e.target.value as any})}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
            <Button onClick={addTask} className="mt-4" disabled={!newTask.title || !newTask.time}>
              <Plus className="h-4 w-4 mr-2" />
              Add Task
            </Button>
          </CardContent>
        </Card>

        {/* Tasks List */}
        <Card className="mb-8 border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-teal-600" />
                <span>Today's Schedule ({tasks.length} tasks)</span>
              </div>
              {tasks.length > 0 && (
                <div className="flex space-x-2">
                  <Button onClick={exportPlannerPDF} variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export PDF
                  </Button>
                  <Button onClick={generatePlannerSlides} size="sm">
                    <Presentation className="h-4 w-4 mr-2" />
                    Generate Slides
                  </Button>
                </div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tasks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No tasks scheduled yet. Add your first task above.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {tasks
                  .sort((a, b) => a.time.localeCompare(b.time))
                  .map((task) => (
                    <div
                      key={task.id}
                      className={`flex items-center justify-between p-4 rounded-lg border-l-4 ${
                        task.priority === 'high' ? 'border-red-500 bg-red-50' :
                        task.priority === 'medium' ? 'border-orange-500 bg-orange-50' :
                        'border-green-500 bg-green-50'
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-4">
                          <span className="font-mono text-sm font-medium">
                            {task.time}
                          </span>
                          <span className="font-medium">{task.title}</span>
                          <span className="text-sm text-gray-500">
                            {task.duration} min
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            task.priority === 'high' ? 'bg-red-100 text-red-800' :
                            task.priority === 'medium' ? 'bg-orange-100 text-orange-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {task.priority}
                          </span>
                        </div>
                      </div>
                      <Button
                        onClick={() => removeTask(task.id)}
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}