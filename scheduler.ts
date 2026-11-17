import { addDays, subDays, format, isBefore, startOfDay, getDay } from 'date-fns';

interface Task {
  title: string;
  description: string;
  estimated_hours: number;
}

interface ScheduledTask extends Task {
  start_date: string;
  end_date: string;
}

interface UserPrefs {
  study_hours: Record<string, number>;
  days_off: string[];
  buffer_days: number;
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function scheduleTasks(
  tasks: Task[],
  deadline: Date,
  prefs: UserPrefs,
  workloadStyle: 'steady' | 'concentrated' = 'steady'
): ScheduledTask[] {
  const scheduledTasks: ScheduledTask[] = [];
  
  // 1. Calculate target completion date (deadline - buffer)
  let currentDate = startOfDay(subDays(deadline, prefs.buffer_days));
  
  // 2. Reverse the tasks to schedule backwards from the deadline
  const reversedTasks = [...tasks].reverse();
  
  for (const task of reversedTasks) {
    let remainingHours = task.estimated_hours;
    
    while (remainingHours > 0) {
      // Find the next available working day (moving backwards)
      while (
        prefs.days_off.includes(DAY_NAMES[getDay(currentDate)]) || 
        (prefs.study_hours[DAY_NAMES[getDay(currentDate)]] || 0) === 0
      ) {
        currentDate = subDays(currentDate, 1);
      }

      const dayName = DAY_NAMES[getDay(currentDate)];
      const availableHours = prefs.study_hours[dayName] || 0;
      
      // How much of this task can we fit into this specific day?
      const hoursForThisDay = Math.min(remainingHours, availableHours);
      
      if (hoursForThisDay > 0) {
        const dateStr = format(currentDate, 'yyyy-MM-dd');
        
        scheduledTasks.push({
          ...task,
          // If it's a split task, we can optionally mark it, but keeping the title clean for now
          title: remainingHours === task.estimated_hours && hoursForThisDay === task.estimated_hours 
            ? task.title 
            : `${task.title} (Part)`,
          estimated_hours: hoursForThisDay,
          start_date: dateStr,
          end_date: dateStr
        });
        
        remainingHours -= hoursForThisDay;
      }
      
      // Move to the previous day for the next chunk of work
      currentDate = subDays(currentDate, 1);
    }
  }
  
  // Return tasks in chronological order
  return scheduledTasks.sort((a, b) => a.start_date.localeCompare(b.start_date));
}