import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { showSuccess, showError } from '@/utils/toast';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const DEFAULT_HOURS: Record<string, number> = {
  'Monday': 2, 'Tuesday': 2, 'Wednesday': 2, 'Thursday': 2, 'Friday': 2, 'Saturday': 4, 'Sunday': 4
};

const Preferences = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [studyHours, setStudyHours] = useState<Record<string, number>>(DEFAULT_HOURS);
  const [daysOff, setDaysOff] = useState<string[]>([]);
  const [bufferDays, setBufferDays] = useState(3);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        const mergedHours = { ...DEFAULT_HOURS, ...(data.study_hours || {}) };
        setStudyHours(mergedHours);
        setDaysOff(data.days_off || []);
        setBufferDays(data.buffer_days ?? 3);
      }
    } catch (error: any) {
      showError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleHourChange = (day: string, value: string) => {
    const numValue = parseInt(value);
    setStudyHours(prev => ({
      ...prev,
      [day]: isNaN(numValue) ? 0 : Math.max(0, Math.min(24, numValue))
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found");

      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          study_hours: studyHours,
          days_off: daysOff,
          buffer_days: bufferDays,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
      showSuccess('Preferences saved successfully!');
    } catch (error: any) {
      showError(error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Layout><div className="flex items-center justify-center h-64">Loading preferences...</div></Layout>;

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Study Preferences</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-none shadow-sm rounded-2xl">
            <CardHeader>
              <CardTitle>Daily Study Hours</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {DAYS.map((day) => (
                <div key={day} className="flex items-center justify-between gap-4">
                  <Label className="w-24 text-slate-600">{day}</Label>
                  <Input
                    type="number"
                    min="0"
                    max="24"
                    value={studyHours[day] ?? 0}
                    onChange={(e) => handleHourChange(day, e.target.value)}
                    className="w-24 rounded-xl border-slate-200 focus:ring-indigo-500"
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-none shadow-sm rounded-2xl">
              <CardHeader>
                <CardTitle>Days Off</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                {DAYS.map((day) => (
                  <div key={day} className="flex items-center space-x-2">
                    <Checkbox
                      id={`off-${day}`}
                      checked={daysOff.includes(day)}
                      onCheckedChange={(checked) => {
                        if (checked) setDaysOff([...daysOff, day]);
                        else setDaysOff(daysOff.filter(d => d !== day));
                      }}
                      className="border-slate-300 data-[state=checked]:bg-indigo-600"
                    />
                    <Label htmlFor={`off-${day}`} className="text-slate-600 cursor-pointer">{day}</Label>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm rounded-2xl">
              <CardHeader>
                <CardTitle>Safety Buffer</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Input
                    type="number"
                    min="0"
                    value={bufferDays}
                    onChange={(e) => setBufferDays(parseInt(e.target.value) || 0)}
                    className="w-24 rounded-xl border-slate-200 focus:ring-indigo-500"
                  />
                  <Label className="text-slate-600">Days</Label>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex justify-end">
          <Button 
            onClick={handleSave} 
            disabled={saving} 
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-8 h-12 shadow-md transition-all active:scale-95"
          >
            {saving ? 'Saving...' : 'Save Preferences'}
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default Preferences;