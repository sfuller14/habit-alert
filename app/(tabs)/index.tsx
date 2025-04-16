import { useCallback, useEffect, useState, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Modal, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar as CalendarComponent, DateData, MarkedDates } from 'react-native-calendars';
import { useRouter } from 'expo-router';
import { HabitEntry } from '@/types/types';
import { useHabits } from '@/hooks/useHabits';
import { useAuth } from '@/hooks/useAuth';
import { Plus, Menu, ChartBar as BarChart2, Clock, Pencil, FileText, Book } from 'lucide-react-native';
import HabitEntryModal from '@/components/HabitEntryModal';
import MyHabitsModal from '@/components/MyHabitsModal';
import ManualEntryModal from '@/components/ManualEntryModal';

export default function CalendarScreen() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [markedDates, setMarkedDates] = useState<MarkedDates>({});
  const [dateEntries, setDateEntries] = useState<any[]>([]);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState<any>(null);
  const [habitEntryModalVisible, setHabitEntryModalVisible] = useState(false);
  const [myHabitsModalVisible, setMyHabitsModalVisible] = useState(false);
  const [manualEntryModalVisible, setManualEntryModalVisible] = useState(false);
  const [isToday, setIsToday] = useState(false);
  const [isPast, setIsPast] = useState(false);
  const [scheduledNotifications, setScheduledNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [detailsReady, setDetailsReady] = useState(false);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const { habits, loading, getEntriesForDate, getCalendarData } = useHabits();
  const { user } = useAuth();
  const router = useRouter();

  // Load calendar data with marked dates
  const loadCalendarData = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getCalendarData();
      
      // Add selected styling to selected date
      setMarkedDates({
        ...data,
        [selectedDate]: {
          ...(data[selectedDate] || {}),
          selected: true,
          selectedColor: '#4A55A2',
        },
      });
      
      // Load entries for the selected date
      fetchDateEntries(selectedDate);
    } catch (error) {
      console.error("Error loading calendar data:", error);
    }
  }, [selectedDate]);

  // Fetch entries for the selected date
  const fetchDateEntries = async (date: string) => {
    try {
      // Create a stable update for all states at once to prevent flashing UI
      let entriesData: any[] = [];
      let notificationsData: any[] = [];
      let isSelectedToday = false;
      let isSelectedPast = false;
      
      // Determine if date is today, past, or future
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const selectedDate = new Date(date);
      selectedDate.setHours(0, 0, 0, 0);
      
      isSelectedToday = selectedDate.getTime() === today.getTime();
      isSelectedPast = selectedDate < today;
      
      // Load entries
      entriesData = await getEntriesForDate(date);
      
      // Load scheduled notifications if this is today or a future date
      if (!isSelectedPast || isSelectedToday) {
        // In a web environment, we simulate the scheduled notifications
        notificationsData = [];
        
        for (const habit of habits) {
          if (habit.notification_frequency === 'daily' ||
              (habit.notification_frequency === 'weekly' && new Date(date).getDay() === 1) ||
              (habit.notification_frequency === 'monthly' && new Date(date).getDate() === 1)) {
            
            for (let i = 0; i < (habit.times_per_day || 1); i++) {
              const timeStr = habit.notification_times[i] || '12:00';
              notificationsData.push({
                id: `${habit.id}-${i}`,
                habitName: habit.name,
                time: timeStr
              });
            }
          }
        }
      }

      // Update everything in a single render batch
      setDetailsReady(false);
      
      // Use a minimal loading time to prevent flickering
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
      
      loadingTimeoutRef.current = setTimeout(() => {
        setDateEntries(entriesData);
        setScheduledNotifications(notificationsData);
        setIsToday(isSelectedToday);
        setIsPast(isSelectedPast);
        setDetailsReady(true);
        setIsLoading(false);
      }, 300); // Minimum loading time to prevent flashing
      
    } catch (error) {
      console.error('Error fetching date details:', error);
      setIsLoading(false);
      setDetailsReady(true);
    }
  };

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, []);

  // Handle date selection on calendar
  const onDayPress = (day: DateData) => {
    const newSelectedDate = day.dateString;
    setSelectedDate(newSelectedDate);
    
    // Update marked dates to highlight the selected date
    setMarkedDates(prevMarkedDates => ({
      ...prevMarkedDates,
      [newSelectedDate]: {
        ...(prevMarkedDates[newSelectedDate] || {}),
        selected: true,
        selectedColor: '#4A55A2',
      },
    }));
    
    // Reset detail states to prevent flashing old content
    setDetailsReady(false);
    setIsLoading(true);
    
    fetchDateEntries(newSelectedDate);
  };

  // Format the selected date for display
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Format time for display
  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0);
    
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Add new habit button handler
  const handleAddHabit = () => {
    router.push('/new-habit');
  };

  // Render habit entry value based on response type
  const renderEntryValue = (entry: any) => {
    const responseType = entry.habits.response_type;
    const value = entry.value;
    
    if (responseType === 'yes_no') {
      return value === true || value === 'true' ? 'Completed ✓' : 'Not completed ✗';
    } else if (responseType === 'scale') {
      return `Rating: ${value}/10`;
    } else {
      return `Value: ${value}`;
    }
  };

  // Handle tracking a habit
  const handleTrackHabit = (habit: any) => {
    setSelectedHabit(habit);
    setHabitEntryModalVisible(true);
  };

  // Load data when component mounts or user changes
  useEffect(() => {
    if (user) {
      loadCalendarData();
    }
  }, [user, habits, loadCalendarData]);

  // Reload calendar data when habits change
  useEffect(() => {
    if (user && habits.length > 0) {
      loadCalendarData();
    }
  }, [habits]);

  // Render the details content
  const renderDetailsContent = () => {
    if (!detailsReady || isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A55A2" />
        </View>
      );
    }

    // If we have entries or notifications, show them
    if (dateEntries.length > 0 || scheduledNotifications.length > 0) {
      return (
        <ScrollView style={styles.detailsContainer}>
          {/* Past entries section */}
          {dateEntries.length > 0 && (
            <View style={styles.detailSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  Tracked Habits ({dateEntries.length})
                </Text>
              </View>
              
              {dateEntries.map((entry) => (
                <View key={entry.id} style={styles.entryCard}>
                  <Text style={styles.habitName}>{entry.habits.name}</Text>
                  <Text style={styles.entryValue}>{renderEntryValue(entry)}</Text>
                  <Text style={styles.entryTime}>
                    Tracked on {new Date(entry.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </Text>
                </View>
              ))}
            </View>
          )}
          
          {/* Scheduled notifications section */}
          {scheduledNotifications.length > 0 && (
            <View style={styles.detailSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  Scheduled Reminders ({scheduledNotifications.length})
                </Text>
              </View>
              
              {scheduledNotifications.map((notification) => (
                <View key={notification.id} style={styles.notificationCard}>
                  <Text style={styles.habitName}>{notification.habitName}</Text>
                  <View style={styles.timeRow}>
                    <Clock size={16} color="#666" style={{marginRight: 6}} />
                    <Text style={styles.notificationTime}>{formatTime(notification.time)}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
          
          {/* Add some padding at the bottom */}
          <View style={{height: 20}} />
        </ScrollView>
      );
    }

    // Empty state
    return (
      <View style={styles.emptyStateContainer}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No habits tracked for this date</Text>
          <TouchableOpacity style={styles.trackButton} onPress={handleAddHabit}>
            <Text style={styles.trackButtonText}>Add a New Habit</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (!user) {
    return <ActivityIndicator style={styles.loading} size="large" color="#4A55A2" />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuButton} onPress={() => setDrawerVisible(true)}>
          <Menu size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Habits</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAddHabit}>
          <Plus size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <CalendarComponent
        style={styles.calendar}
        theme={{
          todayTextColor: '#4A55A2',
          arrowColor: '#4A55A2',
          textDayFontWeight: '400',
          textMonthFontWeight: 'bold',
          textDayHeaderFontWeight: '400',
          textSectionTitleColor: '#333',
          dayTextColor: '#333',
          dotColor: '#4A55A2',
          selectedDotColor: '#ffffff',
        }}
        markedDates={markedDates}
        onDayPress={onDayPress}
        enableSwipeMonths={true}
        markingType="multi-dot"
      />

      <View style={styles.selectedDateContainer}>
        <Text style={styles.selectedDateText}>{formatDate(selectedDate)}</Text>
      </View>
      
      {/* Details section with stabilized rendering */}
      <View style={styles.detailsWrapper}>
        {renderDetailsContent()}
      </View>
      
      {/* Side Drawer Menu */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={drawerVisible}
        onRequestClose={() => setDrawerVisible(false)}
      >
        <TouchableOpacity 
          style={styles.drawerOverlay} 
          activeOpacity={1} 
          onPress={() => setDrawerVisible(false)}
        >
          <View style={styles.drawer} onStartShouldSetResponder={() => true}>
            <Text style={styles.drawerTitle}>Menu</Text>
            
            <TouchableOpacity 
              style={styles.drawerItem}
              onPress={() => {
                setDrawerVisible(false);
                setMyHabitsModalVisible(true);
              }}
            >
              <Book size={24} color="#4A55A2" />
              <Text style={styles.drawerItemText}>My Habits</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.drawerItem}
              onPress={() => {
                setDrawerVisible(false);
                setManualEntryModalVisible(true);
              }}
            >
              <Pencil size={24} color="#4A55A2" />
              <Text style={styles.drawerItemText}>Manual Entry</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.drawerItem}
              onPress={() => {
                setDrawerVisible(false);
                router.push('/(tabs)/analytics');
              }}
            >
              <BarChart2 size={24} color="#4A55A2" />
              <Text style={styles.drawerItemText}>Analytics</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Habit Entry Modal */}
      <HabitEntryModal
        habit={selectedHabit}
        visible={habitEntryModalVisible}
        date={selectedDate}
        onClose={() => {
          setHabitEntryModalVisible(false);
          // Force reload after adding an entry
          loadCalendarData();
        }}
      />
      
      {/* My Habits Modal */}
      <MyHabitsModal
        visible={myHabitsModalVisible}
        onClose={() => {
          setMyHabitsModalVisible(false);
          // Reload data in case habits were changed
          loadCalendarData();
        }}
      />
      
      {/* Manual Entry Modal */}
      <ManualEntryModal
        visible={manualEntryModalVisible}
        onClose={() => {
          setManualEntryModalVisible(false);
          // Reload data in case entries were added
          loadCalendarData();
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  menuButton: {
    padding: 8,
  },
  addButton: {
    backgroundColor: '#4A55A2',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendar: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 10,
  },
  selectedDateContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedDateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4A55A2',
  },
  detailsWrapper: {
    flex: 1,
  },
  detailsContainer: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4A55A2',
  },
  entryCard: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50', // Green for past entries
  },
  habitName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  entryValue: {
    fontSize: 16,
    color: '#555',
    marginBottom: 4,
  },
  entryTime: {
    fontSize: 12,
    color: '#888',
  },
  notificationCard: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3', // Blue for future notifications
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  notificationTime: {
    fontSize: 14,
    color: '#666',
  },
  emptyStateContainer: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  trackButton: {
    backgroundColor: '#4A55A2',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  trackButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  loading: {
    marginTop: 50,
  },
  drawerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  drawer: {
    width: '70%',
    height: '100%',
    backgroundColor: 'white',
    padding: 20,
  },
  drawerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    marginTop: 30,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  drawerItemText: {
    fontSize: 18,
    marginLeft: 15,
  },
});