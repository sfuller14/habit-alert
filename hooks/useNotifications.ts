import { useEffect, useRef, useState } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { Habit } from '@/types/types';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export function useNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string | undefined>();
  const [notification, setNotification] = useState<Notifications.Notification | undefined>();
  const [scheduledNotifications, setScheduledNotifications] = useState<any[]>([]);
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    registerForPushNotificationsAsync().then(token => setExpoPushToken(token));

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
    });

    // Load all scheduled notifications
    loadScheduledNotifications();

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log(response);
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener.current!);
      Notifications.removeNotificationSubscription(responseListener.current!);
    };
  }, []);

  // Load all scheduled notifications
  const loadScheduledNotifications = async () => {
    if (Platform.OS === 'web') return;
    try {
      const notifications = await Notifications.getAllScheduledNotificationsAsync();
      setScheduledNotifications(notifications);
    } catch (error) {
      console.error("Error loading scheduled notifications:", error);
    }
  };

  // Get notifications for a specific date
  const getNotificationsForDate = async (dateString: string) => {
    if (Platform.OS === 'web') {
      // For web, return empty array since we can't access native notifications
      return [];
    }
    
    await loadScheduledNotifications();
    
    // Convert the date string to a Date object for comparison
    const targetDate = new Date(dateString);
    targetDate.setHours(0, 0, 0, 0);
    
    // Filter notifications scheduled for the target date
    return scheduledNotifications.filter(notification => {
      const trigger = notification.trigger as any;
      
      if (!trigger) return false;
      
      if (trigger.type === 'calendar') {
        // For calendar triggers, construct the date
        const year = trigger.dateComponents?.year || new Date().getFullYear();
        const month = trigger.dateComponents?.month ? trigger.dateComponents.month - 1 : new Date().getMonth();
        const day = trigger.dateComponents?.day || 1;
        
        const triggerDate = new Date(year, month, day);
        triggerDate.setHours(0, 0, 0, 0);
        
        return triggerDate.getTime() === targetDate.getTime();
      } else if (trigger.hour !== undefined && trigger.repeats) {
        // For daily repeating notifications, check if they're for this day
        // All daily notifications apply to every day
        return true;
      }
      
      return false;
    });
  };

  // Schedule notifications for a habit
  const scheduleHabitNotifications = async (habit: Habit): Promise<void> => {
    if (Platform.OS === 'web') return;
    
    // Cancel existing notifications for this habit
    await cancelHabitNotifications(habit.id);

    if (habit.notification_frequency === 'daily') {
      for (let i = 0; i < (habit.times_per_day || 1); i++) {
        const timeStr = habit.notification_times[i] || '12:00';
        const [hour, minute] = timeStr.split(':').map(Number);
        
        // Schedule the notification
        await Notifications.scheduleNotificationAsync({
          content: {
            title: `Habit Reminder: ${habit.name}`,
            body: `Time to track your habit: ${habit.name}`,
            data: { habitId: habit.id, habitName: habit.name },
          },
          trigger: {
            hour,
            minute,
            repeats: true,
          },
        });
      }
    } else if (habit.notification_frequency === 'weekly') {
      // Handle weekly notifications
      const timeStr = habit.notification_times[0] || '12:00';
      const [hour, minute] = timeStr.split(':').map(Number);
      
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `Weekly Habit Reminder: ${habit.name}`,
          body: `Time to track your weekly habit: ${habit.name}`,
          data: { habitId: habit.id, habitName: habit.name },
        },
        trigger: {
          weekday: 1, // Monday
          hour,
          minute,
          repeats: true,
        },
      });
    } else if (habit.notification_frequency === 'monthly') {
      // Handle monthly notifications
      const timeStr = habit.notification_times[0] || '12:00';
      const [hour, minute] = timeStr.split(':').map(Number);
      
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `Monthly Habit Reminder: ${habit.name}`,
          body: `Time to track your monthly habit: ${habit.name}`,
          data: { habitId: habit.id, habitName: habit.name },
        },
        trigger: {
          day: 1, // First day of the month
          hour,
          minute,
          repeats: true,
        },
      });
    }
    
    // Refresh scheduled notifications list
    loadScheduledNotifications();
  };

  // Cancel notifications for a habit
  const cancelHabitNotifications = async (habitId: string): Promise<void> => {
    if (Platform.OS === 'web') return;
    
    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
    
    for (const notification of scheduledNotifications) {
      if (notification.content.data?.habitId === habitId) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }
    }
    
    // Refresh scheduled notifications list
    loadScheduledNotifications();
  };

  return {
    expoPushToken,
    notification,
    scheduledNotifications,
    scheduleHabitNotifications,
    cancelHabitNotifications,
    getNotificationsForDate,
    loadScheduledNotifications,
  };
}

// Register for push notifications
async function registerForPushNotificationsAsync(): Promise<string | undefined> {
  let token;

  if (Platform.OS === 'web') {
    return undefined;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      alert('Failed to get push token for push notification!');
      return undefined;
    }
    
    try {
      token = (await Notifications.getExpoPushTokenAsync({ projectId: 'your-project-id' })).data;
    } catch (error) {
      console.error("Error getting push token:", error);
    }
  } else {
    // Device simulator, won't receive push notifications
    console.log('Must use physical device for Push Notifications');
  }

  return token;
}