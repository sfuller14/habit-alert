import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Habit, HabitEntry } from '@/types/types';
import { useAuth } from './useAuth';
import { useNotifications } from './useNotifications';

export function useHabits() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [entries, setEntries] = useState<HabitEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { scheduleHabitNotifications, getNotificationsForDate } = useNotifications();

  // Fetch habits for the current user
  const fetchHabits = async () => {
    if (!user) return [];
    
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) {
        throw error;
      }
      
      setHabits(data || []);
      return data || [];
    } catch (error: any) {
      setError(error.message);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Fetch entries for a specific habit
  const fetchEntriesForHabit = async (habitId: string) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('habit_entries')
        .select('*')
        .eq('habit_id', habitId)
        .order('date', { ascending: true });
      
      if (error) {
        throw error;
      }
      
      setEntries(data || []);
      return data || [];
    } catch (error: any) {
      setError(error.message);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Create a new habit
  const createHabit = async (habitData: Omit<Habit, 'id' | 'user_id' | 'created_at'>) => {
    if (!user) return null;
    
    try {
      setLoading(true);
      
      const newHabit = {
        ...habitData,
        user_id: user.id,
      };
      
      const { data, error } = await supabase
        .from('habits')
        .insert(newHabit)
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      // Schedule notifications for the new habit
      if (data) {
        await scheduleHabitNotifications(data);
        setHabits(prev => [...prev, data]);
      }
      
      return data;
    } catch (error: any) {
      setError(error.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Update an existing habit
  const updateHabit = async (habitData: Habit) => {
    if (!user) return null;
    
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('habits')
        .update(habitData)
        .eq('id', habitData.id)
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      // Update notifications for the habit
      if (data) {
        await scheduleHabitNotifications(data);
        setHabits(prev => prev.map(h => h.id === data.id ? data : h));
      }
      
      return data;
    } catch (error: any) {
      setError(error.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Delete a habit
  const deleteHabit = async (habitId: string) => {
    if (!user) return false;
    
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('habits')
        .delete()
        .eq('id', habitId);
      
      if (error) {
        throw error;
      }
      
      // Remove habit from state
      setHabits(prev => prev.filter(h => h.id !== habitId));
      
      return true;
    } catch (error: any) {
      setError(error.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Add an entry for a habit
  const addHabitEntry = async (habitId: string, date: string, value: string | number | boolean) => {
    try {
      setLoading(true);
      
      const newEntry = {
        habit_id: habitId,
        date,
        value: value.toString(),
      };
      
      const { data, error } = await supabase
        .from('habit_entries')
        .insert(newEntry)
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      setEntries(prev => [...prev, data]);
      return data;
    } catch (error: any) {
      setError(error.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Get habit entries for a specific date
  const getEntriesForDate = async (date: string) => {
    if (!user) return [];
    
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('habit_entries')
        .select('*, habits!inner(*)')
        .eq('habits.user_id', user.id)
        .eq('date', date);
      
      if (error) {
        throw error;
      }
      
      return data || [];
    } catch (error: any) {
      setError(error.message);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Get count of entries for each date
  const getEntriesCountByDate = async () => {
    if (!user) return {};
    
    try {
      const { data, error } = await supabase
        .from('habit_entries')
        .select('date, id, habits!inner(user_id)')
        .eq('habits.user_id', user.id);
      
      if (error) throw error;
      
      const countsByDate: { [date: string]: number } = {};
      
      if (data) {
        data.forEach(entry => {
          if (countsByDate[entry.date]) {
            countsByDate[entry.date]++;
          } else {
            countsByDate[entry.date] = 1;
          }
        });
      }
      
      return countsByDate;
    } catch (error: any) {
      setError(error.message);
      return {};
    }
  };

  // Helper function to determine if a habit should have notifications on a date
  const shouldHaveNotificationOnDate = (habit: Habit, date: Date) => {
    const dayOfWeek = date.getDay(); // 0 (Sunday) to 6 (Saturday)
    const dayOfMonth = date.getDate(); // 1-31
    
    switch (habit.notification_frequency) {
      case 'daily':
        return true;
      case 'weekly':
        return dayOfWeek === 1; // Monday
      case 'monthly':
        return dayOfMonth === 1; // First day of month
      default:
        return false;
    }
  };

  // Get notifications count by date
  const getNotificationsCountByDate = async () => {
    if (!habits.length) {
      await fetchHabits();
    }
    
    const notificationsByDate: Record<string, { count: number, habits: string[] }> = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Project notifications for the next 30 days
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateString = date.toISOString().split('T')[0];
      
      // Check each habit for notifications on this date
      for (const habit of habits) {
        if (shouldHaveNotificationOnDate(habit, date)) {
          if (!notificationsByDate[dateString]) {
            notificationsByDate[dateString] = { count: 0, habits: [] };
          }
          notificationsByDate[dateString].count += habit.times_per_day || 1;
          notificationsByDate[dateString].habits.push(habit.name);
        }
      }
    }
    
    return notificationsByDate;
  };

  // Get habit data for calendar marking
  const getCalendarData = useCallback(async () => {
    if (!user) return {};
    
    try {
      setLoading(true);
      
      // Get past entries data
      const entriesCountByDate = await getEntriesCountByDate();
      
      // Format data for calendar marking
      const markedDates: any = {};
      const today = new Date().toISOString().split('T')[0];
      
      // Add past entries (green numbers)
      for (const date in entriesCountByDate) {
        if (!markedDates[date]) {
          markedDates[date] = { dots: [] };
        }
        
        // Add count as text for past entries
        markedDates[date].text = entriesCountByDate[date].toString();
        markedDates[date].textColor = '#4CAF50'; // Green for past records
      }
      
      // Get future notifications
      const futureDates = await getNotificationsCountByDate();
      
      // Add future notifications (blue numbers)
      for (const date in futureDates) {
        const dateObj = new Date(date);
        const todayObj = new Date(today);
        
        // Set hours to 0 for proper comparison
        dateObj.setHours(0, 0, 0, 0);
        todayObj.setHours(0, 0, 0, 0);
        
        if (dateObj >= todayObj) {
          if (!markedDates[date]) {
            markedDates[date] = { dots: [] };
          }
          
          // For today, handle both past and future
          if (date === today && markedDates[date].text) {
            // Combine past and future with a separator
            markedDates[date].text = `${markedDates[date].text} • ${futureDates[date].count}`;
            markedDates[date].textColor = '#4A55A2'; // Mixed color
          } else {
            // Just future alerts
            markedDates[date].text = futureDates[date].count.toString();
            markedDates[date].textColor = '#2196F3'; // Blue for future alerts
          }
          
          // Add dots for notifications
          for (const habitName of futureDates[date].habits) {
            markedDates[date].dots.push({
              key: `${date}-${habitName}`,
              color: '#2196F3', // Blue for notifications
            });
          }
        }
      }
      
      return markedDates;
    } catch (error: any) {
      setError(error.message);
      return {};
    } finally {
      setLoading(false);
    }
  }, [user, getEntriesCountByDate, getNotificationsCountByDate]);

  // Helper function to generate consistent colors for habits
  const getHabitColor = (habitName: string) => {
    const colors = ['#FF5733', '#33FF57', '#3357FF', '#F033FF', '#FF33A1', '#33FFF5'];
    const index = habitName.charCodeAt(0) % colors.length;
    return colors[index];
  };

  // Load habits when user changes
  useEffect(() => {
    if (user) {
      fetchHabits();
    } else {
      setHabits([]);
      setEntries([]);
    }
  }, [user]);

  return {
    habits,
    entries,
    loading,
    error,
    fetchHabits,
    fetchEntriesForHabit,
    createHabit,
    updateHabit,
    deleteHabit,
    addHabitEntry,
    getEntriesForDate,
    getCalendarData,
    getEntriesCountByDate,
    getNotificationsCountByDate,
  };
}