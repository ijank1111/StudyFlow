"use client";

import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { CheckCircle2, Clock, AlertCircle, TrendingUp, Calendar, BookOpen, Activity, Zap } from 'lucide-react';
import { format, isBefore, parseISO, startOfDay } from 'date-fns';
import { showError } from '@/utils/toast';

const COLORS = ['#4f46e5', '#e2e8f0', '#ef4444', '#f59e0b'];

const Performance = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    delayedTasks: 0,
    totalHours: 0,
    completedHours: 0,
    efficiency: 0,
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [delayedList, setDelayedList] = useState<any[]>([]);

  useEffect(() => {
    fetchPerformanceData();
  }, []);

  const fetchPerformanceData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: tasks, error } = await supabase
        .from('tasks')
        .select('*, assignments(title)')
        .eq('user_id', user.id);

      if (error) throw error;

      if (!tasks || tasks.length === 0) {
        setLoading(false);
        return;
      }

      const today = startOfDay(new Date());
      
      let completed = 0;
      let delayed = 0;
      let totalHrs = 0;
      let completedHrs = 0;
      const delayedTasksList: any[] = [];

      tasks.forEach(task => {
        const isCompleted = task.status === 'completed';
        const isDelayed = !isCompleted && isBefore(parseISO(task.end_date), today);
        
        totalHrs += Number(task.estimated_hours);
        if (isCompleted) {
          completed++;
          completedHrs += Number(task.estimated_hours);
        }
        if (isDelayed) {
          delayed++;
          delayedTasksList.push(task);
        }
      });

      const efficiency = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;

      setStats({
        totalTasks: tasks.length,
        completedTasks: completed,
        pendingTasks: tasks.length - completed,
        delayedTasks: delayed,
        totalHours: totalHrs,
        completedHours: completedHrs,
        efficiency,
      });

      setDelayedList(delayedTasksList);

      const assignmentMap = new Map();
      tasks.forEach(task => {
        const title = task.assignments?.title || 'Unassigned';
        if (!assignmentMap.has(title)) {
          assignmentMap.set(title, { name: title, completed: 0, total: 0 });
        }
        const current = assignmentMap.get(title);
        current.total++;
        if (task.status === 'completed') current.completed++;
      });

      setChartData(Array.from(assignmentMap.values()));

    } catch (error: any) {
      showError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Layout><div className="flex items-center justify-center h-64 text-indigo-600 font-bold animate-pulse">Analyzing performance...</div></Layout>;

  const pieData = [
    { name: 'Completed', value: stats.completedTasks },
    { name: 'Pending', value: stats.pendingTasks },
  ];

  return (
    <Layout>
      <div className="space-y-8 pb-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm uppercase tracking-wider">
              <TrendingUp className="w-4 h-4" />
              Performance Insights
            </div>
            <h2 className="text-5xl font-black text-slate-900 tracking-tight">Your Progress</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="glass-card border-none rounded-[2.5rem] overflow-hidden group hover:translate-y-[-4px] transition-all duration-500">
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="p-3 bg-indigo-100 rounded-2xl text-indigo-600 group-hover:scale-110 transition-transform">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <Badge className="bg-indigo-50 text-indigo-700 border-none font-bold">Completion</Badge>
              </div>
              <div className="space-y-1">
                <h3 className="text-4xl font-black text-slate-900 tracking-tighter">{stats.completedTasks} / {stats.totalTasks}</h3>
                <p className="text-sm text-slate-500 font-bold uppercase tracking-widest">Tasks Finished</p>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-none rounded-[2.5rem] overflow-hidden group hover:translate-y-[-4px] transition-all duration-500">
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="p-3 bg-rose-100 rounded-2xl text-rose-600 group-hover:scale-110 transition-transform">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <Badge className="bg-rose-50 text-rose-700 border-none font-bold">At Risk</Badge>
              </div>
              <div className="space-y-1">
                <h3 className="text-4xl font-black text-slate-900 tracking-tighter">{stats.delayedTasks}</h3>
                <p className="text-sm text-slate-500 font-bold uppercase tracking-widest">Delayed Tasks</p>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-none rounded-[2.5rem] overflow-hidden group hover:translate-y-[-4px] transition-all duration-500">
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="p-3 bg-emerald-100 rounded-2xl text-emerald-600 group-hover:scale-110 transition-transform">
                  <Activity className="w-6 h-6" />
                </div>
                <Badge className="bg-emerald-50 text-emerald-700 border-none font-bold">Efficiency</Badge>
              </div>
              <div className="space-y-1">
                <h3 className="text-4xl font-black text-slate-900 tracking-tighter">{stats.efficiency}%</h3>
                <p className="text-sm text-slate-500 font-bold uppercase tracking-widest">Overall Score</p>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-none rounded-[2.5rem] overflow-hidden group hover:translate-y-[-4px] transition-all duration-500">
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="p-3 bg-amber-100 rounded-2xl text-amber-600 group-hover:scale-110 transition-transform">
                  <Clock className="w-6 h-6" />
                </div>
                <Badge className="bg-amber-50 text-amber-700 border-none font-bold">Effort</Badge>
              </div>
              <div className="space-y-1">
                <h3 className="text-4xl font-black text-slate-900 tracking-tighter">{Math.round(stats.completedHours)}h</h3>
                <p className="text-sm text-slate-500 font-bold uppercase tracking-widest">Hours Invested</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <Card className="lg:col-span-8 glass-card border-none rounded-[3rem] overflow-hidden">
            <CardHeader className="p-8 pb-0">
              <CardTitle className="text-2xl font-black tracking-tight">Progress by Assignment</CardTitle>
            </CardHeader>
            <CardContent className="p-8 h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.1)', padding: '16px' }}
                    cursor={{ fill: '#f8fafc' }}
                  />
                  <Bar dataKey="completed" fill="#4f46e5" radius={[8, 8, 0, 0]} name="Completed" barSize={40} />
                  <Bar dataKey="total" fill="#e2e8f0" radius={[8, 8, 0, 0]} name="Total" barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="lg:col-span-4 glass-card border-none rounded-[3rem] overflow-hidden">
            <CardHeader className="p-8 pb-0">
              <CardTitle className="text-2xl font-black tracking-tight">Task Distribution</CardTitle>
            </CardHeader>
            <CardContent className="p-8 h-[400px] flex flex-col items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={110}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <Card className="lg:col-span-5 glass-card border-none rounded-[3rem] overflow-hidden">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-2xl font-black tracking-tight flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-rose-500" />
                Delayed Tasks
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-0">
              {delayedList.length === 0 ? (
                <div className="text-center py-12">
                  <div className="bg-emerald-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                  </div>
                  <p className="text-slate-500 font-bold">No delayed tasks. Great job!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {delayedList.map((task) => (
                    <div key={task.id} className="flex items-center justify-between p-5 rounded-[2rem] bg-rose-50/50 border border-rose-100 group hover:bg-rose-50 transition-colors">
                      <div className="min-w-0">
                        <p className="font-black text-slate-800 truncate">{task.title}</p>
                        <p className="text-xs text-slate-500 font-bold flex items-center gap-1.5 mt-1">
                          <BookOpen className="w-3.5 h-3.5" />
                          {task.assignments?.title}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-black text-rose-600">Due {format(parseISO(task.end_date), 'MMM d')}</p>
                        <p className="text-[10px] text-rose-400 font-bold uppercase tracking-widest">Overdue</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-7 glass-card border-none rounded-[3rem] overflow-hidden">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-2xl font-black tracking-tight flex items-center gap-3">
                <Zap className="w-6 h-6 text-indigo-500" />
                Efficiency Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-8">
              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <span className="text-slate-600 font-bold">Task Completion Rate</span>
                  <span className="text-2xl font-black text-indigo-600">{stats.efficiency}%</span>
                </div>
                <Progress value={stats.efficiency} className="h-3 bg-slate-100 rounded-full" />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <span className="text-slate-600 font-bold">Hours Completion Rate</span>
                  <span className="text-2xl font-black text-emerald-600">
                    {stats.totalHours > 0 ? Math.round((stats.completedHours / stats.totalHours) * 100) : 0}%
                  </span>
                </div>
                <Progress 
                  value={stats.totalHours > 0 ? (stats.completedHours / stats.totalHours) * 100 : 0} 
                  className="h-3 bg-slate-100 rounded-full" 
                />
              </div>

              <div className="pt-4 grid grid-cols-2 gap-6">
                <div className="p-6 rounded-[2rem] bg-slate-50 border border-slate-100">
                  <p className="text-[10px] uppercase tracking-widest font-black text-slate-400 mb-2">Avg. Task Size</p>
                  <p className="text-3xl font-black text-slate-800">
                    {stats.totalTasks > 0 ? (stats.totalHours / stats.totalTasks).toFixed(1) : 0}h
                  </p>
                </div>
                <div className="p-6 rounded-[2rem] bg-slate-50 border border-slate-100">
                  <p className="text-[10px] uppercase tracking-widest font-black text-slate-400 mb-2">Remaining Effort</p>
                  <p className="text-3xl font-black text-slate-800">
                    {Math.round(stats.totalHours - stats.completedHours)}h
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Performance;