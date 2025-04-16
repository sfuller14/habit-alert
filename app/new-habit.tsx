import { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Switch, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ResponseType, NotificationFrequency } from '@/types/types';
import { useHabits } from '@/hooks/useHabits';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react-native';

type Step = 1 | 2 | 3 | 4;

export default function NewHabitScreen() {
  const [step, setStep] = useState<Step>(1);
  const [habitName, setHabitName] = useState('');
  const [responseType, setResponseType] = useState<ResponseType>('yes_no');
  const [notificationFrequency, setNotificationFrequency] = useState<NotificationFrequency>('daily');
  const [timesPerDay, setTimesPerDay] = useState(1);
  const [notificationTimes, setNotificationTimes] = useState<string[]>(['12:00']);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [currentTimeIndex, setCurrentTimeIndex] = useState(0);
  const [tempTime, setTempTime] = useState(new Date());
  
  const { createHabit } = useHabits();
  const router = useRouter();

  // Handle next step button
  const handleNext = () => {
    if (step === 1 && !habitName.trim()) {
      alert('Please enter a habit name');
      return;
    }

    if (step < 4) {
      setStep((prev: Step) => (prev + 1) as Step);
    }
  };

  // Handle back button
  const handleBack = () => {
    if (step > 1) {
      setStep((prev: Step) => (prev - 1) as Step);
    } else {
      router.back();
    }
  };

  // Handle completion of habit creation
  const handleDone = async () => {
    try {
      await createHabit({
        name: habitName,
        response_type: responseType,
        notification_frequency: notificationFrequency,
        times_per_day: timesPerDay,
        notification_times: notificationTimes,
      });
      
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Error creating habit:', error);
      alert('Failed to create habit. Please try again.');
    }
  };

  // Update number of notification times based on times per day
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

  // Render step 1: Habit Name
  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Name Your Habit</Text>
      <Text style={styles.stepDescription}>What habit would you like to track?</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Enter habit name"
        value={habitName}
        onChangeText={setHabitName}
        autoFocus
      />
    </View>
  );

  // Render step 2: Response Type
  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Select Response Type</Text>
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

  // Render step 3: Notification Frequency
  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Notification Frequency</Text>
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

  // Render step 4: Notification Times
  const renderStep4 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Notification Times</Text>
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

  // Render the current step
  const renderCurrentStep = () => {
    switch (step) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      case 4:
        return renderStep4();
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <ArrowLeft size={24} color="#4A55A2" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Habit</Text>
        <View style={styles.backButton} />
      </View>

      <View style={styles.progress}>
        {[1, 2, 3, 4].map((s) => (
          <View 
            key={s}
            style={[
              styles.progressStep,
              s <= step ? styles.progressStepActive : null
            ]}
          />
        ))}
      </View>

      <ScrollView style={styles.content}>
        {renderCurrentStep()}
      </ScrollView>

      <View style={styles.footer}>
        {step < 4 ? (
          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextButtonText}>Next</Text>
            <ArrowRight size={20} color="#fff" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.doneButton} onPress={handleDone}>
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        )}
      </View>
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
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progress: {
    flexDirection: 'row',
    padding: 16,
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  progressStep: {
    flex: 1,
    height: 4,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 2,
    borderRadius: 2,
  },
  progressStepActive: {
    backgroundColor: '#4A55A2',
  },
  content: {
    flex: 1,
  },
  stepContainer: {
    padding: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 15,
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
    maxHeight: 300,
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
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  nextButton: {
    flexDirection: 'row',
    backgroundColor: '#4A55A2',
    borderRadius: 8,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
  doneButton: {
    backgroundColor: '#4A55A2',
    borderRadius: 8,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  doneButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});