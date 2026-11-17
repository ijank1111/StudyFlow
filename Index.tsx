"use client";

import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Layout from '@/components/Layout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { format, isWithinInterval, parseISO, startOfDay, getDay } from 'date-fns';
import { BookOpen, Clock, Plus, Trash2, Play, Zap, ChevronRight, BarChart3, Activity } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { cn } from '@/lib/utils';
import FocusTimer from '@/components/FocusTimer';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const getDifficultyStyles = (difficulty: string) => {
  switch (difficulty?.toLowerCase()) {
    case 'hard':
      return 'bg-rose-50 text-rose-600 border-rose-100';
    case 'medium':
      return 'bg-amber-50 text-amber-600 border-amber-100';
    case 'easy':
      return 'bg-emerald-50 text-emerald-600 border-emerald-100';
    default:
      return 'bg-indigo-50 text-indigo-600 border-indigo-100';
  }
};

const Index = () => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [loading, setLoading] = useState(true);
  const [activeTask, setActiveTask] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
      } else {
        fetchData(user.id);
      }
    };
    checkUser();
  }, [navigate]);

  const fetchData = async (userId: string) => {
    try {
      const [tasksRes, profileRes] = await Promise.all([
        supabase
          .from('tasks')
          .select('*, assignments(title, course)')
          .order('start_date', { ascending: true }),
        supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single()
      ]);

      if (tasksRes.error) throw tasksRes.error;
      setTasks(tasksRes.data || []);
      setProfile(profileRes.data);
    } catch (error: any) {
      showError(error.message);
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
      
      setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
      showSuccess('Task updated');
    } catch (error: any) {
      showError(error.message);
    }
  };

  const deleteAssignment = async (assignmentId: string, title: string) => {
    if (!confirm(`Are you sure you want to delete the assignment "${title}" and all its tasks?`)) return;
    
    try {
      const { error } = await supabase
        .from('assignments')
        .delete()
        .eq('id', assignmentId);

      if (error) throw error;
      
      setTasks(tasks.filter(t => t.assignment_id !== assignmentId));
      showSuccess('Assignment removed');
    } catch (error: any) {
      showError(error.message);
    }
  };

  const isDayOff = (date: Date) => {
    if (!profile) return false;
    const dayName = DAY_NAMES[getDay(date)];
    return profile.days_off?.includes(dayName) || (profile.study_hours?.[dayName] || 0) === 0;
  };

  const tasksForSelectedDate = tasks.filter(task => {
    if (!selectedDate) return false;
    if (isDayOff(selectedDate)) return false;
    const date = startOfDay(selectedDate);
    const start = startOfDay(parseISO(task.start_date));
    const end = startOfDay(parseISO(task.end_date));
    return isWithinInterval(date, { start, end });
  });

  const modifiers = {
    hasTask: (date: Date) => {
      if (isDayOff(date)) return false;
      return tasks.some(task => {
        const start = startOfDay(parseISO(task.start_date));
        const end = startOfDay(parseISO(task.end_date));
        return isWithinInterval(startOfDay(date), { start, end });
      })
    },
    dayOff: (date: Date) => isDayOff(date)
  };

  const modifiersStyles = {
    hasTask: {
      fontWeight: 'bold',
      color: '#4f46e5',
      backgroundColor: '#eef2ff',
      borderRadius: '12px'
    },
    dayOff: {
      color: '#cbd5e1',
      opacity: 0.5
    }
  };

  if (loading) return <Layout><div className="flex items-center justify-center h-64 text-indigo-600 font-bold animate-pulse">Loading your schedule...</div></Layout>;

  return (
    <Layout>
      <div className="space-y-8 pb-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm uppercase tracking-wider">
              <Zap className="w-4 h-4" />
              Welcome back
            </div>
            <h2 className="text-5xl font-black text-slate-900 tracking-tight">Your Daily Flow</h2>
          </div>
          <Link to="/new">
            <Button className="btn-primary h-14 px-8 rounded-2xl text-base font-bold gap-3">
              <Plus className="w-5 h-5" />
              Add Assignment
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-8">
            <Card className="glass-card rounded-[2.5rem] overflow-hidden p-4">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="w-full"
                modifiers={modifiers}
                modifiersStyles={modifiersStyles}
              />
            </Card>

            <Card className="bg-slate-900 text-white rounded-[2.5rem] p-8 shadow-2xl shadow-slate-200">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-400 uppercase tracking-widest text-xs">Quick Stats</h4>
                  <div className="bg-white/10 p-2 rounded-xl">
                    <BarChart3 className="w-4 h-4 text-indigo-400" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-3xl font-black">{tasks.filter(t => t.status === 'completed').length}</p>
                    <p className="text-xs text-slate-400 font-bold mt-1">COMPLETED</p>
                  </div>
                  <div>
                    <p className="text-3xl font-black">{tasks.filter(t => t.status !== 'completed').length}</p>
                    <p className="text-xs text-slate-400 font-bold mt-1">PENDING</p>
                  </div>
                </div>
                <div className="pt-4">
                  <Link to="/performance" className="text-indigo-400 text-sm font-bold flex items-center gap-2 hover:text-indigo-300 transition-colors">
                    View full analytics <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-8 space-y-6">
            <div className="flex items-center justify-between px-4">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                {selectedDate ? format(selectedDate, 'EEEE, MMMM do') : 'Select a date'}
              </h3>
              {isDayOff(selectedDate || new Date()) && (
                <Badge className="bg-emerald-100 text-emerald-700 border-none px-4 py-1.5 rounded-full font-bold">
                  Rest Day
                </Badge>
              )}
            </div>

            {isDayOff(selectedDate || new Date()) ? (
              <div className="flex flex-col items-center justify-center py-20 glass-card rounded-[3rem] text-center px-8">
                <div className="bg-emerald-100 w-20 h-20 rounded-[2rem] flex items-center justify-center mb-6">
                  <Activity className="w-10 h-10 text-emerald-600" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-2">Time to Recharge</h3>
              </div>
            ) : tasksForSelectedDate.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 glass-card rounded-[3rem] text-center px-8 border-dashed border-2">
                <div className="bg-slate-100 w-20 h-20 rounded-[2rem] flex items-center justify-center mb-6">
                  <Clock className="w-10 h-10 text-slate-400" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-2">All Clear!</h3>
              </div>
            ) : (
              <div className="space-y-4">
                {tasksForSelectedDate.map((task) => (
                  <Card 
                    key={task.id} 
                    className={cn(
                      "glass-card rounded-[2.5rem] transition-all duration-500 group overflow-hidden border-none",
                      task.status === 'completed' ? 'opacity-60 grayscale-[0.5]' : 'hover:translate-y-[-4px] hover:shadow-2xl hover:shadow-indigo-500/10'
                    )}
                  >
                    <CardContent className="p-8 flex items-start gap-6">
                      <div className="pt-1.5">
                        <Checkbox 
                          checked={task.status === 'completed'} 
                          onCheckedChange={() => toggleTask(task.id, task.status)}
                          className="w-7 h-7 rounded-xl border-2 border-indigo-200 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600 transition-all"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-4">
                          <div className="space-y-2 min-w-0">
                            <h4 className={cn(
                              "text-xl font-black tracking-tight truncate transition-all",
                              task.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-900'
                            )}>
                              {task.title}
                            </h4>
                            <div className="flex flex-wrap items-center gap-3">
                              <Badge variant="outline" className={cn("text-[10px] font-black uppercase px-3 py-1 rounded-lg border-2", getDifficultyStyles(task.difficulty))}>
                                {task.difficulty || 'medium'}
                              </Badge>
                              <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-lg">
                                <Clock className="w-3.5 h-3.5" />
                                {task.actual_hours ? `${Number(task.actual_hours).toFixed(1)}/` : ''}{task.estimated_hours}h
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button 
                              onClick={() => setActiveTask(task)}
                              className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all duration-300 shadow-sm"
                              title="Start Focus Session"
                            >
                              <Play className="w-5 h-5 fill-current" />
                            </button>
                            <button 
                              onClick={() => deleteAssignment(task.assignment_id, task.assignments?.title)}
                              className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all duration-300"
                              title="Delete Assignment"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                        <p className="text-slate-500 font-medium text-sm mt-4 line-clamp-2 leading-relaxed">{task.description}</p>
                        <div className="flex items-center gap-4 mt-6 pt-4 border-t border-slate-100/50">
                          <Link 
                            to={`/assignment/${task.assignment_id}`}
                            className="text-xs font-black text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-2"
                          >
                            <BookOpen className="w-4 h-4" />
                            {task.assignments?.title}
                          </Link>
                          <span className="text-slate-200">•</span>
                          <span className="text-[10px] text-slate-400 uppercase tracking-widest font-black">
                            {task.assignments?.course}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {activeTask && (
        <FocusTimer 
          task={activeTask} 
          isOpen={!!activeTask} 
          onClose={() => setActiveTask(null)} 
          onUpdate={() => fetchData(profile?.id)}
        />
      )}
    </Layout>
  );
};

export default Index;