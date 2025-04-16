import { useState } from 'react';
import { StyleSheet, Text, View, Modal, TouchableOpacity, TextInput, Switch } from 'react-native';
import { Habit } from '@/types/types';
import { useHabits } from '@/hooks/useHabits';
import { X } from 'lucide-react-native';

interface HabitEntryModalProps {
  habit: Habit | null;
  visible: boolean;
  date: string;
  onClose: () => void;
}

export default function HabitEntryModal({ habit, visible, date, onClose }: HabitEntryModalProps) {
  const [yesNoValue, setYesNoValue] = useState(false);
  const [scaleValue, setScaleValue] = useState('5');
  const [numericValue, setNumericValue] = useState('');
  const { addHabitEntry } = useHabits();

  // Reset values when habit changes
  useState(() => {
    setYesNoValue(false);
    setScaleValue('5');
    setNumericValue('');
  }, [habit]);

  // Submit the habit entry
  const handleSubmit = async () => {
    if (!habit) return;

    let value: string | number | boolean;
    
    switch (habit.response_type) {
      case 'yes_no':
        value = yesNoValue;
        break;
      case 'scale':
        value = parseInt(scaleValue, 10);
        break;
      case 'numeric':
        value = numericValue;
        break;
      default:
        value = '';
    }

    await addHabitEntry(habit.id, date, value);
    onClose();
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
            <Text style={styles.modalTitle}>Track: {habit.name}</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <X size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            <Text style={styles.dateText}>{new Date(date).toDateString()}</Text>

            {habit.response_type === 'yes_no' && (
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Did you complete this habit?</Text>
                <View style={styles.switchContainer}>
                  <Text style={[styles.switchLabel, !yesNoValue && styles.activeSwitchLabel]}>No</Text>
                  <Switch
                    value={yesNoValue}
                    onValueChange={setYesNoValue}
                    trackColor={{ false: '#d3d3d3', true: '#adb9e3' }}
                    thumbColor={yesNoValue ? '#4A55A2' : '#f4f3f4'}
                  />
                  <Text style={[styles.switchLabel, yesNoValue && styles.activeSwitchLabel]}>Yes</Text>
                </View>
              </View>
            )}

            {habit.response_type === 'scale' && (
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Rate on a scale of 1-10:</Text>
                <View style={styles.scaleContainer}>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                    <TouchableOpacity
                      key={num}
                      style={[
                        styles.scaleButton,
                        parseInt(scaleValue, 10) === num && styles.activeScaleButton
                      ]}
                      onPress={() => setScaleValue(num.toString())}
                    >
                      <Text style={[
                        styles.scaleButtonText,
                        parseInt(scaleValue, 10) === num && styles.activeScaleButtonText
                      ]}>
                        {num}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {habit.response_type === 'numeric' && (
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Enter a value:</Text>
                <TextInput
                  style={styles.textInput}
                  value={numericValue}
                  onChangeText={setNumericValue}
                  keyboardType="numeric"
                  placeholder="Enter a number"
                />
              </View>
            )}
          </View>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
              <Text style={styles.submitButtonText}>Save</Text>
            </TouchableOpacity>
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
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  dateText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchLabel: {
    fontSize: 16,
    marginHorizontal: 16,
    color: '#999',
  },
  activeSwitchLabel: {
    color: '#4A55A2',
    fontWeight: 'bold',
  },
  scaleContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  scaleButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    margin: 5,
  },
  activeScaleButton: {
    backgroundColor: '#4A55A2',
  },
  scaleButtonText: {
    fontSize: 16,
  },
  activeScaleButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  textInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  modalFooter: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#f0f0f0',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: 'bold',
  },
  submitButton: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  submitButtonText: {
    color: '#4A55A2',
    fontWeight: 'bold',
  },
});