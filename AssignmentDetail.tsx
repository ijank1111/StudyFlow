import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Calendar, Trash2, ArrowLeft, Clock, Play } from 'lucide-react';
import { format } from 'date-fns';
import { showSuccess, showError } from '@/utils/toast';
import { cn } from '@/lib/utils';
import FocusTimer from '@/components/FocusTimer';
import ResourceHub from '@/components/ResourceHub';

const getDifficultyStyles = (difficulty: string) => {
  switch (difficulty?.toLowerCase()) {
    case 'hard':
      return 'bg-red-100 text-red-700 border-red-200';
    case 'medium':
      return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'easy':
      return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
};

const AssignmentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTask, setActiveTask] = useState<any>(null);

  useEffect(() => {
    fetchAssignment();
  }, [id]);

  const fetchAssignment = async () => {
    try {
      const { data, error } = await supabase
        .from('assignments')
        .select('*, tasks(*)')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      if (data.tasks) {
        data.tasks.sort((a: any, b: any) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
      }
      
      setAssignment(data);
    } catch (error: any) {
      showError(error.message);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const toggleTask = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', taskId);

      if (error) throw error;
      
      setAssignment({
        ...assignment,
        tasks: assignment.tasks.map((t: any) => 
          t.id === taskId ? { ...t, status: newStatus } : t
        )
      });
    } catch (error: any) {
      showError(error.message);
    }
  };

  const deleteAssignment = async () => {
    if (!confirm('Are you sure you want to delete this assignment and all its tasks?')) return;
    
    try {
      const { error } = await supabase.from('assignments').delete().eq('id', id);
      if (error) throw error;
      showSuccess('Assignment deleted');
      navigate('/');
    } catch (error: any) {
      showError(error.message);
    }
  };

  if (loading) return <Layout><div className="flex items-center justify-center h-64">Loading assignment...</div></Layout>;

  return (
    <Layout>
      <div className="space-y-6">
        <button 
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100">{assignment.course}</Badge>
              <span className="text-slate-400 flex items-center gap-1 text-sm">
                <Calendar className="w-4 h-4" />
                Deadline: {format(new Date(assignment.deadline), 'PPP')}
              </span>
            </div>
            <h1 className="text-4xl font-bold text-slate-900">{assignment.title}</h1>
          </div>
          <button 
            onClick={deleteAssignment}
            className="p-2 text-slate-400 hover:text-red-600 transition-colors"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-xl font-semibold text-slate-900">Task Schedule</h3>
            <div className="space-y-3">
              {assignment.tasks?.map((task: any) => (
                <Card key={task.id} className={`border-none shadow-sm rounded-2xl transition-all group ${task.status === 'completed' ? 'opacity-60' : ''}`}>
                  <CardContent className="p-4 flex items-start gap-4">
                    <Checkbox 
                      checked={task.status === 'completed'} 
                      onCheckedChange={() => toggleTask(task.id, task.status)}
                      className="mt-1"
                    />
                    <div className="flex-1 space-y-1">
                      <div className="flex justify-between items-start">
                        <h4 className={`font-bold ${task.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                          {task.title}
                        </h4>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => setActiveTask(task)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100"
                            title="Start Focus Session"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                          </button>
                          <Badge variant="outline" className={cn("text-[10px] font-bold uppercase px-2 py-0", getDifficultyStyles(task.difficulty))}>
                            {task.difficulty || 'medium'}
                          </Badge>
                          <Badge variant="outline" className="text-xs font-normal text-slate-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {task.actual_hours ? `${Number(task.actual_hours).toFixed(1)}/` : ''}{task.estimated_hours}h
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm text-slate-500">{task.description}</p>
                      <div className="pt-2 flex items-center gap-4 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(task.start_date), 'MMM d')} - {format(new Date(task.end_date), 'MMM d')}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <ResourceHub assignmentId={id!} />

            <Card className="border-none shadow-sm rounded-2xl bg-indigo-600 text-white">
              <CardHeader>
                <CardTitle className="text-lg">Assignment Brief</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-indigo-100 line-clamp-6 italic">
                  "{assignment.brief}"
                </p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg">Planning Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Type</span>
                  <span className="font-medium capitalize">{assignment.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Workload</span>
                  <span className="font-medium capitalize">{assignment.workload_style}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Effort</span>
                  <span className="font-medium flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {assignment.tasks?.reduce((acc: number, t: any) => acc + t.estimated_hours, 0)} hours
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {activeTask && (
        <FocusTimer 
          task={activeTask} 
          isOpen={!!activeTask} 
          onClose={() => setActiveTask(null)} 
          onUpdate={fetchAssignment}
        />
      )}
    </Layout>
  );
};

export default AssignmentDetail;