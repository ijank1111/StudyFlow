"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw, CheckCircle2, Coffee, Zap, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';

interface FocusTimerProps {
  task: {
    id: string;
    title: string;
    estimated_hours: number;
    actual_hours?: number | null;
  };
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

const FocusTimer = ({ task, isOpen, onClose, onUpdate }: FocusTimerProps) => {
  const initialWorkSeconds = Math.round(task.estimated_hours * 3600);
  const [timeLeft, setTimeLeft] = useState(initialWorkSeconds);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<'work' | 'break'>('work');
  const [totalSecondsSpent, setTotalSecondsSpent] = useState(0);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const totalSecondsRef = useRef(0);

  useEffect(() => {
    if (mode === 'work') {
      setTimeLeft(initialWorkSeconds);
    }
  }, [task.id, initialWorkSeconds, mode]);

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
        if (mode === 'work') {
          totalSecondsRef.current += 1;
          setTotalSecondsSpent(totalSecondsRef.current);
        }
      }, 1000);
    } else if (timeLeft === 0) {
      handleTimerComplete();
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, timeLeft, mode]);

  const handleTimerComplete = () => {
    setIsActive(false);
    if (mode === 'work') {
      showSuccess("Task duration reached! Time for a break.");
      setMode('break');
      const breakTime = Math.min(Math.max(5 * 60, Math.round(initialWorkSeconds * 0.1)), 30 * 60);
      setTimeLeft(breakTime);
    } else {
      showSuccess("Break over! Ready to continue?");
      setMode('work');
      setTimeLeft(initialWorkSeconds);
    }
  };

  const toggleTimer = () => setIsActive(!isActive);

  const resetTimer = () => {
    setIsActive(false);
    if (mode === 'work') {
      setTimeLeft(initialWorkSeconds);
    } else {
      const breakTime = Math.min(Math.max(5 * 60, Math.round(initialWorkSeconds * 0.1)), 30 * 60);
      setTimeLeft(breakTime);
    }
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const saveProgress = async () => {
    const secondsToSave = totalSecondsRef.current;
    
    try {
      if (secondsToSave > 0) {
        const additionalHours = secondsToSave / 3600;
        const currentActual = Number(task.actual_hours || 0);
        const newTotalHours = Number((currentActual + additionalHours).toFixed(4));

        console.log("[FocusTimer] Attempting to save progress:", { taskId: task.id, newTotalHours });

        const { error } = await supabase
          .from('tasks')
          .update({ actual_hours: newTotalHours })
          .eq('id', task.id);

        if (error) {
          console.error("[FocusTimer] Database update error:", error);
          showError(`Save failed: ${error.message}`);
        } else {
          showSuccess(`Saved ${Math.round(secondsToSave / 60)} minutes of focus!`);
          onUpdate();
        }
      }
      onClose();
    } catch (error: any) {
      console.error("[FocusTimer] Unexpected runtime error:", error);
      showError("An unexpected error occurred while saving.");
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className={`p-8 text-center space-y-6 transition-colors duration-500 ${mode === 'work' ? 'bg-indigo-50' : 'bg-emerald-50'}`}>
          <div className="flex justify-between items-center">
            <div className={`px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-2 ${mode === 'work' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}`}>
              {mode === 'work' ? <Zap className="w-3 h-3" /> : <Coffee className="w-3 h-3" />}
              {mode === 'work' ? 'Focus Session' : 'Short Break'}
            </div>
            <button onClick={saveProgress} className="text-slate-400 hover:text-slate-600 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-2">
            <h3 className="text-slate-500 text-sm font-medium line-clamp-1 px-4">Focusing on: {task.title}</h3>
            <div className={`text-7xl font-black tabular-nums tracking-tighter ${mode === 'work' ? 'text-indigo-600' : 'text-emerald-600'}`}>
              {formatTime(timeLeft)}
            </div>
            <p className="text-xs text-slate-400">Target: {task.estimated_hours}h</p>
          </div>

          <div className="flex justify-center items-center gap-4">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={resetTimer}
              className="h-12 w-12 rounded-2xl border-slate-200 text-slate-400 hover:text-slate-600"
            >
              <RotateCcw className="w-5 h-5" />
            </Button>
            
            <Button 
              onClick={toggleTimer}
              className={`h-16 w-16 rounded-3xl shadow-lg transition-transform active:scale-95 ${
                mode === 'work' 
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white' 
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              {isActive ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
            </Button>

            <Button 
              variant="outline" 
              size="icon" 
              onClick={saveProgress}
              className="h-12 w-12 rounded-2xl border-slate-200 text-slate-400 hover:text-indigo-600"
            >
              <CheckCircle2 className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="p-6 bg-white">
          <div className="flex items-center justify-between text-sm">
            <div className="text-slate-500">Session Progress</div>
            <div className="font-bold text-slate-700">{Math.round((totalSecondsSpent / 60))}m spent</div>
          </div>
          <div className="mt-2 h-2 w-full bg-slate-100 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-1000 ${mode === 'work' ? 'bg-indigo-500' : 'bg-emerald-500'}`}
              style={{ 
                width: `${(1 - (timeLeft / (mode === 'work' ? initialWorkSeconds : Math.min(Math.max(5 * 60, Math.round(initialWorkSeconds * 0.1)), 30 * 60)))) * 100}%` 
              }}
            />
          </div>
          <Button 
            variant="ghost" 
            className="w-full mt-6 text-slate-400 hover:text-indigo-600 rounded-xl"
            onClick={saveProgress}
          >
            Finish & Save Progress
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FocusTimer;