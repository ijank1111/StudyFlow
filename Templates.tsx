"use client";

import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Copy, BookOpen, Clock, Save } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import { Badge } from '@/components/ui/badge';

interface TemplateTask {
  title: string;
  description: string;
  estimated_hours: number;
  difficulty: string;
}

interface Template {
  id: string;
  title: string;
  course: string;
  type: string;
  tasks: TemplateTask[];
}

const Templates = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  
  const [newTemplate, setNewTemplate] = useState({
    title: '',
    course: '',
    type: 'essay',
    tasks: [] as TemplateTask[]
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('assignment_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error: any) {
      console.error("Templates fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const addTaskToNewTemplate = () => {
    setNewTemplate({
      ...newTemplate,
      tasks: [...newTemplate.tasks, { title: '', description: '', estimated_hours: 1, difficulty: 'medium' }]
    });
  };

  const updateTask = (index: number, field: keyof TemplateTask, value: any) => {
    const updatedTasks = [...newTemplate.tasks];
    updatedTasks[index] = { ...updatedTasks[index], [field]: value };
    setNewTemplate({ ...newTemplate, tasks: updatedTasks });
  };

  const removeTask = (index: number) => {
    setNewTemplate({
      ...newTemplate,
      tasks: newTemplate.tasks.filter((_, i) => i !== index)
    });
  };

  const saveTemplate = async () => {
    if (!newTemplate.title) {
      showError("Template title is required");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('assignment_templates')
        .insert({
          user_id: user.id,
          ...newTemplate
        });

      if (error) throw error;

      showSuccess("Template saved!");
      setIsCreating(false);
      setNewTemplate({ title: '', course: '', type: 'essay', tasks: [] });
      fetchTemplates();
    } catch (error: any) {
      showError(error.message);
    }
  };

  const deleteTemplate = async (id: string) => {
    try {
      const { error } = await supabase.from('assignment_templates').delete().eq('id', id);
      if (error) throw error;
      setTemplates(templates.filter(t => t.id !== id));
      showSuccess("Template deleted");
    } catch (error: any) {
      showError(error.message);
    }
  };

  if (loading) return <Layout><div className="flex items-center justify-center h-64">Loading templates...</div></Layout>;

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">Task Templates</h2>
          </div>
          {!isCreating && (
            <Button onClick={() => setIsCreating(true)} className="bg-indigo-600 hover:bg-indigo-700 rounded-xl">
              <Plus className="w-4 h-4 mr-2" /> Create Template
            </Button>
          )}
        </div>

        {isCreating && (
          <Card className="border-none shadow-md rounded-3xl bg-white overflow-hidden">
            <CardHeader className="bg-slate-50 border-b border-slate-100">
              <CardTitle>New Template</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Template Name</Label>
                  <Input 
                    placeholder="e.g. Weekly Lab Report" 
                    value={newTemplate.title}
                    onChange={(e) => setNewTemplate({...newTemplate, title: e.target.value})}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Default Course (Optional)</Label>
                  <Input 
                    placeholder="e.g. BIO101" 
                    value={newTemplate.course}
                    onChange={(e) => setNewTemplate({...newTemplate, course: e.target.value})}
                    className="rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label className="text-lg font-bold">Tasks</Label>
                  <Button variant="outline" size="sm" onClick={addTaskToNewTemplate} className="rounded-lg">
                    <Plus className="w-3 h-3 mr-1" /> Add Task
                  </Button>
                </div>

                {newTemplate.tasks.map((task, index) => (
                  <div key={index} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
                    <div className="flex gap-3">
                      <Input 
                        placeholder="Task title" 
                        value={task.title}
                        onChange={(e) => updateTask(index, 'title', e.target.value)}
                        className="flex-1 rounded-lg bg-white"
                      />
                      <Input 
                        type="number"
                        placeholder="Hrs" 
                        value={task.estimated_hours}
                        onChange={(e) => updateTask(index, 'estimated_hours', parseFloat(e.target.value))}
                        className="w-20 rounded-lg bg-white"
                      />
                      <Button variant="ghost" size="icon" onClick={() => removeTask(index)} className="text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <Input 
                      placeholder="Short description" 
                      value={task.description}
                      onChange={(e) => updateTask(index, 'description', e.target.value)}
                      className="rounded-lg bg-white text-sm"
                    />
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="ghost" onClick={() => setIsCreating(false)} className="rounded-xl">Cancel</Button>
                <Button onClick={saveTemplate} className="bg-indigo-600 hover:bg-indigo-700 rounded-xl px-8">
                  <Save className="w-4 h-4 mr-2" /> Save Template
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {templates.length === 0 && !isCreating ? (
            <div className="col-span-full text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-100">
              <Copy className="w-12 h-12 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-400">No templates created yet. Start by creating one!</p>
            </div>
          ) : (
            templates.map((template) => (
              <Card key={template.id} className="border-none shadow-sm rounded-3xl hover:shadow-md transition-all group">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-indigo-50 text-indigo-700 border-none">{template.course || 'General'}</Badge>
                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{template.type}</span>
                      </div>
                      <CardTitle className="text-xl">{template.title}</CardTitle>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => deleteTemplate(template.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-3 h-3" />
                        {template.tasks?.length || 0} Tasks
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {template.tasks?.reduce((acc, t) => acc + (t.estimated_hours || 0), 0)}h Total
                      </span>
                    </div>
                    <div className="space-y-1">
                      {template.tasks?.slice(0, 3).map((task, i) => (
                        <div key={i} className="text-xs text-slate-400 flex items-center gap-2">
                          <div className="w-1 h-1 rounded-full bg-indigo-300" />
                          {task.title}
                        </div>
                      ))}
                      {(template.tasks?.length || 0) > 3 && (
                        <div className="text-[10px] text-slate-300 italic pl-3">
                          + {template.tasks.length - 3} more tasks
                        </div>
                      )}
                    </div>
                    <Button 
                      className="w-full mt-4 bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-600 rounded-xl border-none shadow-none transition-all"
                      onClick={() => {
                        window.location.href = `/new?templateId=${template.id}`;
                      }}
                    >
                      Use Template
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Templates;