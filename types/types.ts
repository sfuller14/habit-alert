export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  response_type: 'yes_no' | 'scale' | 'numeric';
  notification_frequency: 'daily' | 'weekly' | 'monthly';
  times_per_day: number;
  notification_times: string[];
  created_at: string;
}

export interface HabitEntry {
  id: string;
  habit_id: string;
  date: string;
  value: string | number | boolean;
  created_at: string;
}

export type ResponseType = 'yes_no' | 'scale' | 'numeric';
export type NotificationFrequency = 'daily' | 'weekly' | 'monthly';