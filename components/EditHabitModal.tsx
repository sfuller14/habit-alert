import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Modal, TouchableOpacity, TextInput, Platform, ScrollView, Switch } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Habit, ResponseType, NotificationFrequency } from '@/types/types';
import { useHabits } from '@/hooks/useHabits';
import { X, Check, Trash2 } from 'lucide-react-native';
import { Alert } from 'react-native';

interface EditHabitModalProps {
  habit: Habit | null;
  visible: boolean;
  onClose: () => void;
}

export default function EditHabitModal({ habit, visible, onClose }: EditHabitModalProps) {
  const [habitName, setHabitName] = useState('');
  const [responseType, setResponseType] = useState<ResponseType>('yes_no');
  const [notificationFrequency, setNotificationFrequency] = useState<NotificationFrequency>('daily');
  const [timesPerDay, setTimesPerDay] = useState(1);
  const [notificationTimes, setNotificationTimes] = useState<string[]>(['12:00']);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [currentTimeIndex, setCurrentTimeIndex] = useState(0);
  const [tempTime, setTempTime] = useState(new Date());
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  const { updateHabit, deleteHabit } = useHabits();

  // Reset and load habit data when modal opens
  useEffect(() => {
    if (habit && visible) {
      setHabitName(habit.name);
      setResponseType(habit.response_type);
      setNotificationFrequency(habit.notification_frequency);
      setTimesPerDay(habit.times_per_day || 1);
      setNotificationTimes(habit.notification_times || ['12:00']);
      setCurrentStep(1);
    }
  }, [habit, visible]);

  // Update notification times array when times per day changes
  const updateNotificationTimes = (count: number) => {
    setTimesPerDay(count);
    
    if (count > notificationTimes.length) {
      // Add more time slots
      const newTimes = [...notificationTimes];
      for (let i = notificationTimes.length; i < count; i++) {
        newTimes.push('12:00');
      }
      setNotificationTimes(newTimes);
    } else if (count < notificationTimes.length) {
      // Remove extra time slots
      setNotificationTimes(notificationTimes.slice(0, count));
    }
  };

  // Handle time selection from picker
  const handleTimeChange = (event: any, selectedTime: Date | undefined) => {
    setShowTimePicker(Platform.OS === 'ios');
    
    if (selectedTime) {
      setTempTime(selectedTime);
      
      // Format time as HH:MM
      const hours = selectedTime.getHours().toString().padStart(2, '0');
      const minutes = selectedTime.getMinutes().toString().padStart(2, '0');
      const timeString = `${hours}:${minutes}`;
      
      const newTimes = [...notificationTimes];
      newTimes[currentTimeIndex] = timeString;
      setNotificationTimes(newTimes);
    }
  };

  // Format time for display
  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0);
    
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Show time picker for a specific time slot
  const showTimePickerForIndex = (index: number) => {
    const [hours, minutes] = notificationTimes[index].split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0);
    
    setTempTime(date);
    setCurrentTimeIndex(index);
    setShowTimePicker(true);
  };

  // Handle saving the updated habit
  const handleSave = async () => {
    if (!habit) return;
    
    if (!habitName.trim()) {
      Alert.alert('Error', 'Please enter a habit name');
      return;
    }
    
    try {
      setIsLoading(true);
      
      await updateHabit({
        ...habit,
        name: habitName,
        response_type: responseType,
        notification_frequency: notificationFrequency,
        times_per_day: timesPerDay,
        notification_times: notificationTimes,
      });
      
      onClose();
    } catch (error) {
      console.error('Error updating habit:', error);
      Alert.alert('Error', 'Failed to update habit');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle deleting the habit
  const handleDelete = () => {
    if (!habit) return;
    
    Alert.alert(
      'Delete Habit',
      `Are you sure you want to delete "${habit.name}"? This will also delete all tracking data for this habit.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              await deleteHabit(habit.id);
              onClose();
            } catch (error) {
              console.error('Error deleting habit:', error);
              Alert.alert('Error', 'Failed to delete habit');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  // Get step content based on current step
  const getStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Edit Habit Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter habit name"
              value={habitName}
              onChangeText={setHabitName}
            />
          </View>
        );
      case 2:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Response Type</Text>
            <Text style={styles.stepDescription}>How would you like to track this habit?</Text>
            
            <TouchableOpacity
              style={[styles.optionButton, responseType === 'yes_no' && styles.selectedOption]}
              onPress={() => setResponseType('yes_no')}
            >
              <Text style={[styles.optionText, responseType === 'yes_no' && styles.selectedOptionText]}>
                Yes/No (Completed or Not)
              </Text>
              {responseType === 'yes_no' && <Check size={20} color="#fff" />}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.optionButton, responseType === 'scale' && styles.selectedOption]}
              onPress={() => setResponseType('scale')}
            >
              <Text style={[styles.optionText, responseType === 'scale' && styles.selectedOptionText]}>
                Scale (1-10 Rating)
              </Text>
              {responseType === 'scale' && <Check size={20} color="#fff" />}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.optionButton, responseType === 'numeric' && styles.selectedOption]}
              onPress={() => setResponseType('numeric')}
            >
              <Text style={[styles.optionText, responseType === 'numeric' && styles.selectedOptionText]}>
                Numeric Input (Custom Value)
              </Text>
              {responseType === 'numeric' && <Check size={20} color="#fff" />}
            </TouchableOpacity>
          </View>
        );
      case 3:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Reminder Frequency</Text>
            <Text style={styles.stepDescription}>How often do you want to be reminded?</Text>
            
            <TouchableOpacity
              style={[styles.optionButton, notificationFrequency === 'daily' && styles.selectedOption]}
              onPress={() => setNotificationFrequency('daily')}
            >
              <Text style={[styles.optionText, notificationFrequency === 'daily' && styles.selectedOptionText]}>
                Daily
              </Text>
              {notificationFrequency === 'daily' && <Check size={20} color="#fff" />}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.optionButton, notificationFrequency === 'weekly' && styles.selectedOption]}
              onPress={() => setNotificationFrequency('weekly')}
            >
              <Text style={[styles.optionText, notificationFrequency === 'weekly' && styles.selectedOptionText]}>
                Weekly
              </Text>
              {notificationFrequency === 'weekly' && <Check size={20} color="#fff" />}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.optionButton, notificationFrequency === 'monthly' && styles.selectedOption]}
              onPress={() => setNotificationFrequency('monthly')}
            >
              <Text style={[styles.optionText, notificationFrequency === 'monthly' && styles.selectedOptionText]}>
                Monthly
              </Text>
              {notificationFrequency === 'monthly' && <Check size={20} color="#fff" />}
            </TouchableOpacity>
            
            {notificationFrequency === 'daily' && (
              <View style={styles.timesPerDayContainer}>
                <Text style={styles.timesPerDayLabel}>Times per day:</Text>
                <View style={styles.counterContainer}>
                  <TouchableOpacity
                    style={styles.counterButton}
                    onPress={() => timesPerDay > 1 && updateNotificationTimes(timesPerDay - 1)}
                  >
                    <Text style={styles.counterButtonText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.counterValue}>{timesPerDay}</Text>
                  <TouchableOpacity
                    style={styles.counterButton}
                    onPress={() => updateNotificationTimes(timesPerDay + 1)}
                  >
                    <Text style={styles.counterButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        );
      case 4:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Reminder Times</Text>
            <Text style={styles.stepDescription}>
              Set the time(s) when you'd like to be reminded
            </Text>
            
            <ScrollView style={styles.timesContainer}>
              {notificationTimes.map((time, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.timeButton}
                  onPress={() => showTimePickerForIndex(index)}
                >
                  <Text style={styles.timeButtonText}>
                    {notificationFrequency === 'daily' && timesPerDay > 1
                      ? `Reminder ${index + 1}: ${formatTime(time)}`
                      : `Reminder Time: ${formatTime(time)}`}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            {showTimePicker && (
              <DateTimePicker
                value={tempTime}
                mode="time"
                is24Hour={false}
                display="default"
                onChange={handleTimeChange}
              />
            )}
          </View>
        );
      default:
        return null;
    }
  };

  if (!habit) return null;

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
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <X size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit Habit</Text>
            <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
              <Trash2 size={24} color="#ff3b30" />
            </TouchableOpacity>
          </View>

          <View style={styles.stepIndicator}>
            {[1, 2, 3, 4].map((step) => (
              <TouchableOpacity 
                key={step}
                style={[styles.stepDot, currentStep === step && styles.activeStepDot]}
                onPress={() => setCurrentStep(step)}
              />
            ))}
          </View>

          <ScrollView style={styles.modalBody}>
            {getStepContent()}
          </ScrollView>

          <View style={styles.modalFooter}>
            <View style={styles.navigationButtons}>
              <TouchableOpacity 
                style={[styles.navButton, styles.prevButton]} 
                onPress={() => currentStep > 1 && setCurrentStep(currentStep - 1)}
                disabled={currentStep === 1}
              >
                <Text style={[styles.navButtonText, currentStep === 1 && styles.disabledText]}>
                  Previous
                </Text>
              </TouchableOpacity>
              
              {currentStep < 4 ? (
                <TouchableOpacity 
                  style={[styles.navButton, styles.nextButton]} 
                  onPress={() => currentStep < 4 && setCurrentStep(currentStep + 1)}
                >
                  <Text style={styles.navButtonText}>Next</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity 
                  style={[styles.navButton, styles.saveButton]}
                  onPress={handleSave}
                  disabled={isLoading}
                >
                  <Text style={styles.saveButtonText}>
                    {isLoading ? 'Saving...' : 'Save'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </View>
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
  closeButton: {
    padding: 8,
  },
  deleteButton: {
    padding: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: '#f9f9f9',
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 5,
  },
  activeStepDot: {
    backgroundColor: '#4A55A2',
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  modalBody: {
    flex: 1,
    padding: 16,
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  navButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  prevButton: {
    backgroundColor: '#f0f0f0',
  },
  nextButton: {
    backgroundColor: '#4A55A2',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  disabledText: {
    color: '#aaa',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  stepContainer: {
    paddingVertical: 8,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  optionButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  selectedOption: {
    backgroundColor: '#4A55A2',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
  },
  selectedOptionText: {
    color: 'white',
    fontWeight: 'bold',
  },
  timesPerDayContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  timesPerDayLabel: {
    fontSize: 16,
    color: '#333',
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  counterButton: {
    width: 30,
    height: 30,
    backgroundColor: '#4A55A2',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  counterValue: {
    fontSize: 18,
    marginHorizontal: 15,
    fontWeight: 'bold',
  },
  timesContainer: {
    maxHeight: 200,
  },
  timeButton: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  timeButtonText: {
    fontSize: 16,
    color: '#333',
  },
});