import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '@/components/Layout';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { showSuccess, showError } from '@/utils/toast';
import { scheduleTasks } from '@/lib/scheduler';
import { Users, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const NewAssignment = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const templateId = searchParams.get('templateId');
  
  const [loading, setLoading] = useState(false);
  const [templateLoading, setTemplateLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    course: '',
    deadline: '',
    brief: '',
    type: 'essay',
    word_count: '',
    workload_style: 'steady',
    is_shared: false
  });

  useEffect(() => {
    if (templateId) {
      loadTemplate(templateId);
    }
  }, [templateId]);

  const loadTemplate = async (id: string) => {
    setTemplateLoading(true);
    try {
      const { data, error } = await supabase
        .from('assignment_templates')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (data) {
        setFormData(prev => ({
          ...prev,
          title: data.title,
          course: data.course || '',
          type: data.type || 'essay'
        }));
      }
    } catch (error: any) {
      showError("Could not load template details");
    } finally {
      setTemplateLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: prefs } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!prefs) throw new Error('Please set your study preferences first.');

      let tasksToSchedule = [];

      if (templateId) {
        const { data: template } = await supabase
          .from('assignment_templates')
          .select('tasks')
          .eq('id', templateId)
          .single();
        
        tasksToSchedule = template?.tasks || [];
      } else {
        const { data: response, error: engineError } = await supabase.functions.invoke('generate-tasks', {
          body: {
            brief: formData.brief,
            title: formData.title,
            type: formData.type,
            word_count: formData.word_count
          }
        });

        if (engineError) throw new Error(engineError.message || 'Schedule generation failed');
        tasksToSchedule = response?.tasks || [];
      }

      if (!tasksToSchedule || tasksToSchedule.length === 0) {
        throw new Error('No tasks were generated or found in template.');
      }

      const scheduledTasks = scheduleTasks(
        tasksToSchedule,
        new Date(formData.deadline),
        {
          study_hours: prefs.study_hours,
          days_off: prefs.days_off,
          buffer_days: prefs.buffer_days
        },
        formData.workload_style as any
      );

      const { data: assignment, error: assError } = await supabase
        .from('assignments')
        .insert({
          user_id: user.id,
          title: formData.title,
          course: formData.course,
          deadline: formData.deadline,
          brief: formData.brief || (templateId ? 'Created from template' : ''),
          type: formData.type,
          word_count: formData.word_count,
          workload_style: formData.workload_style,
          is_shared: formData.is_shared
        })
        .select()
        .single();

      if (assError) throw assError;

      const tasksToInsert = scheduledTasks.map(t => ({
        assignment_id: assignment.id,
        user_id: user.id,
        ...t,
        status: 'pending'
      }));

      const { error: tasksError } = await supabase.from('tasks').insert(tasksToInsert);
      if (tasksError) throw tasksError;

      showSuccess('Assignment planned successfully!');
      navigate('/');
    } catch (error: any) {
      showError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">
              {templateId ? 'Use Template' : 'New Assignment'}
            </h2>
          </div>
          {templateId && (
            <Badge className="bg-indigo-100 text-indigo-700 border-none flex items-center gap-1 py-1 px-3">
              <Zap className="w-3 h-3" />
              Template Mode
            </Badge>
          )}
        </div>

        <Card className="border-none shadow-sm rounded-2xl">
          <CardHeader>
            <CardTitle>Assignment Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="e.g. Ethics in AI Essay"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="course">Course/Module</Label>
                  <Input
                    id="course"
                    placeholder="e.g. CS301"
                    value={formData.course}
                    onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                    required
                    className="rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="deadline">Final Deadline</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  required
                  className="rounded-xl"
                />
              </div>

              {!templateId && (
                <div className="space-y-2">
                  <Label htmlFor="brief">Assignment Brief</Label>
                  <Textarea
                    id="brief"
                    placeholder="Paste the full assignment text here..."
                    className="min-h-[150px] rounded-xl"
                    value={formData.brief}
                    onChange={(e) => setFormData({ ...formData, brief: e.target.value })}
                    required
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Assignment Type</Label>
                  <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="essay">Essay</SelectItem>
                      <SelectItem value="report">Report</SelectItem>
                      <SelectItem value="programming">Programming Project</SelectItem>
                      <SelectItem value="presentation">Presentation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Word Count / Scope</Label>
                  <Input
                    placeholder="e.g. 2000 words"
                    value={formData.word_count}
                    onChange={(e) => setFormData({ ...formData, word_count: e.target.value })}
                    className="rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Workload Style</Label>
                <Select value={formData.workload_style} onValueChange={(v) => setFormData({ ...formData, workload_style: v })}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="steady">Steady (Spread out)</SelectItem>
                    <SelectItem value="concentrated">Concentrated (Fewer days)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                <div className="flex items-center gap-3">
                  <div className="bg-indigo-600 p-2 rounded-lg">
                    <Users className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <Label htmlFor="is_shared" className="text-indigo-900 font-semibold cursor-pointer">Share with Friends</Label>
                  </div>
                </div>
                <Switch 
                  id="is_shared"
                  checked={formData.is_shared}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_shared: checked })}
                />
              </div>

              <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 rounded-xl h-12" disabled={loading || templateLoading}>
                {loading ? 'Processing...' : templateId ? 'Apply Template' : 'Create Study Plan'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default NewAssignment;