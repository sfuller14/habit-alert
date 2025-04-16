import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Modal, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useHabits } from '@/hooks/useHabits';
import { X, ChevronDown, Calendar } from 'lucide-react-native';
import HabitEntryModal from './HabitEntryModal';
import { Platform } from 'react-native';
import { Calendar as CalendarComponent, DateData } from 'react-native-calendars';

interface ManualEntryModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function ManualEntryModal({ visible, onClose }: ManualEntryModalProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState<any>(null);
  const [habitEntryModalVisible, setHabitEntryModalVisible] = useState(false);
  const [habitsDropdownOpen, setHabitsDropdownOpen] = useState(false);
  const [showCalendarView, setShowCalendarView] = useState(false);
  const [markedDates, setMarkedDates] = useState<any>({});
  
  const { habits, loading } = useHabits();

  // Reset selection when modal opens
  useEffect(() => {
    if (visible) {
      setSelectedDate(new Date());
      setSelectedHabit(null);
      setHabitsDropdownOpen(false);
      setShowCalendarView(false);
      
      // Mark the current date on the calendar
      const dateString = new Date().toISOString().split('T')[0];
      setMarkedDates({
        [dateString]: {
          selected: true,
          selectedColor: '#4A55A2',
        }
      });
    }
  }, [visible]);

  // Handle date change from native date picker
  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setSelectedDate(selectedDate);
      // Update marked dates for calendar view as well
      updateMarkedDates(selectedDate.toISOString().split('T')[0]);
    }
  };

  // Handle date selection from calendar
  const handleDayPress = (day: DateData) => {
    const newDate = new Date(day.dateString);
    setSelectedDate(newDate);
    updateMarkedDates(day.dateString);
    setShowCalendarView(false);
  };

  // Update marked dates for calendar display
  const updateMarkedDates = (dateString: string) => {
    setMarkedDates({
      [dateString]: {
        selected: true,
        selectedColor: '#4A55A2',
      }
    });
  };

  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString(undefined, {
      weekday: 'short',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Select a habit
  const handleSelectHabit = (habit: any) => {
    setSelectedHabit(habit);
    setHabitsDropdownOpen(false);
  };

  // Open habit entry modal
  const handleTrackHabit = () => {
    if (!selectedHabit) return;
    setHabitEntryModalVisible(true);
  };

  // After recording an entry
  const handleEntryComplete = () => {
    setHabitEntryModalVisible(false);
    // Keep the modal open to allow multiple entries
  };

  // Toggle calendar view
  const toggleCalendarView = () => {
    setShowCalendarView(!showCalendarView);
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Manual Habit Entry</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <X size={24} color="#333" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalBody}>
            <Text style={styles.sectionTitle}>Select Date</Text>
            <TouchableOpacity 
              style={styles.dateSelector}
              onPress={toggleCalendarView}
            >
              <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
              <Calendar size={20} color="#4A55A2" />
            </TouchableOpacity>
            
            {showCalendarView && (
              <View style={styles.calendarContainer}>
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
                  }}
                  markedDates={markedDates}
                  onDayPress={handleDayPress}
                  enableSwipeMonths={true}
                  maxDate={new Date().toISOString().split('T')[0]} // Can't select future dates
                />
              </View>
            )}
            
            {showDatePicker && Platform.OS !== 'web' && (
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display="default"
                onChange={handleDateChange}
                maximumDate={new Date()}
              />
            )}
            
            <Text style={[styles.sectionTitle, {marginTop: 20}]}>Select Habit</Text>
            <TouchableOpacity 
              style={styles.habitSelector}
              onPress={() => setHabitsDropdownOpen(!habitsDropdownOpen)}
            >
              <Text style={[styles.habitSelectorText, !selectedHabit && styles.placeholderText]}>
                {selectedHabit ? selectedHabit.name : 'Select a habit'}
              </Text>
              <ChevronDown size={20} color="#4A55A2" />
            </TouchableOpacity>
            
            {habitsDropdownOpen && (
              <View style={styles.habitsDropdown}>
                {loading ? (
                  <ActivityIndicator size="small" color="#4A55A2" style={styles.loadingIndicator} />
                ) : habits.length > 0 ? (
                  <ScrollView style={styles.habitsList} nestedScrollEnabled>
                    {habits.map(habit => (
                      <TouchableOpacity
                        key={habit.id}
                        style={styles.habitItem}
                        onPress={() => handleSelectHabit(habit)}
                      >
                        <Text style={styles.habitItemText}>{habit.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                ) : (
                  <Text style={styles.noHabitsText}>No habits found</Text>
                )}
              </View>
            )}
          </View>
          
          <View style={styles.modalFooter}>
            <TouchableOpacity 
              style={[styles.trackButton, !selectedHabit && styles.disabledButton]}
              onPress={handleTrackHabit}
              disabled={!selectedHabit}
            >
              <Text style={styles.trackButtonText}>Track Habit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Habit Entry Modal */}
      <HabitEntryModal
        habit={selectedHabit}
        visible={habitEntryModalVisible}
        date={selectedDate.toISOString().split('T')[0]}
        onClose={handleEntryComplete}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    width: '90%',
    maxHeight: '90%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  dateSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 15,
  },
  dateText: {
    fontSize: 16,
    color: '#333',
  },
  calendarContainer: {
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  calendar: {
    borderRadius: 8,
  },
  habitSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  habitSelectorText: {
    fontSize: 16,
    color: '#333',
  },
  placeholderText: {
    color: '#999',
  },
  habitsDropdown: {
    marginTop: 8,
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    maxHeight: 200,
  },
  habitsList: {
    maxHeight: 200,
  },
  habitItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  habitItemText: {
    fontSize: 16,
    color: '#333',
  },
  noHabitsText: {
    padding: 16,
    textAlign: 'center',
    color: '#999',
  },
  loadingIndicator: {
    padding: 16,
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  trackButton: {
    backgroundColor: '#4A55A2',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  trackButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});