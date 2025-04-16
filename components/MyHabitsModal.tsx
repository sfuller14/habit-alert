import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Modal, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useHabits } from '@/hooks/useHabits';
import { X, CreditCard as Edit, Plus } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import EditHabitModal from './EditHabitModal';

interface MyHabitsModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function MyHabitsModal({ visible, onClose }: MyHabitsModalProps) {
  const [selectedHabit, setSelectedHabit] = useState<any>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  
  const { habits, loading, fetchHabits } = useHabits();
  const router = useRouter();

  // Refresh habits when modal opens
  useEffect(() => {
    if (visible) {
      fetchHabits();
    }
  }, [visible]);

  // Format the notification frequency for display
  const formatFrequency = (habit: any) => {
    switch (habit.notification_frequency) {
      case 'daily':
        return `Daily (${habit.times_per_day || 1} time${habit.times_per_day > 1 ? 's' : ''})`;
      case 'weekly':
        return 'Weekly';
      case 'monthly':
        return 'Monthly';
      default:
        return 'Custom';
    }
  };

  // Format the response type for display
  const formatResponseType = (responseType: string) => {
    switch (responseType) {
      case 'yes_no':
        return 'Yes/No';
      case 'scale':
        return 'Scale (1-10)';
      case 'numeric':
        return 'Numeric';
      default:
        return responseType;
    }
  };

  // Format notification times for display
  const formatTimes = (habit: any) => {
    if (!habit.notification_times || habit.notification_times.length === 0) {
      return 'No times set';
    }
    
    return habit.notification_times.map((time: string) => {
      const [hours, minutes] = time.split(':').map(Number);
      const date = new Date();
      date.setHours(hours, minutes, 0);
      return date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    }).join(', ');
  };

  // Handle editing a habit
  const handleEditHabit = (habit: any) => {
    setSelectedHabit(habit);
    setEditModalVisible(true);
  };

  // Add new habit button handler
  const handleAddHabit = () => {
    onClose();
    router.push('/new-habit');
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
            <Text style={styles.modalTitle}>My Habits</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <X size={24} color="#333" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalBody}>
            {loading ? (
              <ActivityIndicator size="large" color="#4A55A2" style={styles.loading} />
            ) : habits.length > 0 ? (
              <ScrollView>
                {habits.map(habit => (
                  <View key={habit.id} style={styles.habitCard}>
                    <View style={styles.habitHeader}>
                      <Text style={styles.habitName}>{habit.name}</Text>
                      <TouchableOpacity 
                        style={styles.editButton}
                        onPress={() => handleEditHabit(habit)}
                      >
                        <Edit size={18} color="#4A55A2" />
                      </TouchableOpacity>
                    </View>
                    
                    <View style={styles.habitDetails}>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Response Type:</Text>
                        <Text style={styles.detailValue}>{formatResponseType(habit.response_type)}</Text>
                      </View>
                      
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Reminder:</Text>
                        <Text style={styles.detailValue}>{formatFrequency(habit)}</Text>
                      </View>
                      
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Times:</Text>
                        <Text style={styles.detailValue}>{formatTimes(habit)}</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>You haven't set up any habits yet</Text>
                <TouchableOpacity 
                  style={styles.addButton}
                  onPress={handleAddHabit}
                >
                  <Text style={styles.addButtonText}>Add Your First Habit</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
          
          {habits.length > 0 && (
            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.floatingAddButton}
                onPress={handleAddHabit}
              >
                <Plus size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* Edit Habit Modal */}
      <EditHabitModal
        habit={selectedHabit}
        visible={editModalVisible}
        onClose={() => {
          setEditModalVisible(false);
          fetchHabits(); // Refresh the list after editing
        }}
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
    flex: 1,
    marginVertical: 40,
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
    textAlign: 'center',
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    flex: 1,
    padding: 16,
  },
  loading: {
    marginTop: 50,
  },
  habitCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#4A55A2',
  },
  habitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  habitName: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  editButton: {
    padding: 8,
  },
  habitDetails: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    marginRight: 8,
    width: 100,
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  addButton: {
    backgroundColor: '#4A55A2',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  modalFooter: {
    padding: 16,
    alignItems: 'flex-end',
  },
  floatingAddButton: {
    backgroundColor: '#4A55A2',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});