import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Modal, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { X } from 'lucide-react-native';
import { useHabits } from '@/hooks/useHabits';
import { useNotifications } from '@/hooks/useNotifications';
import { HabitEntry } from '@/types/types';

interface DateDetailModalProps {
  visible: boolean;
  date: string;
  onClose: () => void;
}

export default function DateDetailModal({ visible, date, onClose }: DateDetailModalProps) {
  const [loading, setLoading] = useState(true);
  const [pastEntries, setPastEntries] = useState<any[]>([]);
  const [futureNotifications, setFutureNotifications] = useState<any[]>([]);
  const [isToday, setIsToday] = useState(false);
  const [isPast, setIsPast] = useState(false);
  
  const { getEntriesForDate } = useHabits();
  const { getNotificationsForDate } = useNotifications();

  useEffect(() => {
    if (visible) {
      loadDateData();
    }
  }, [visible, date]);

  const loadDateData = async () => {
    setLoading(true);
    
    // Determine if date is today, past, or future
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const selectedDate = new Date(date);
    selectedDate.setHours(0, 0, 0, 0);
    
    const isSelectedToday = selectedDate.getTime() === today.getTime();
    const isSelectedPast = selectedDate < today;
    
    setIsToday(isSelectedToday);
    setIsPast(isSelectedPast);
    
    // Load data based on date type
    if (isSelectedToday || isSelectedPast) {
      // Load past entries
      const entries = await getEntriesForDate(date);
      setPastEntries(entries);
    }
    
    if (isSelectedToday || !isSelectedPast) {
      // Load future notifications
      const notifications = await getNotificationsForDate(date);
      setFutureNotifications(notifications);
    }
    
    setLoading(false);
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

  // Render entry value based on habit type
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
            <Text style={styles.modalTitle}>{formatDate(date)}</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <X size={24} color="#333" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4A55A2" />
            </View>
          ) : (
            <ScrollView style={styles.modalBody}>
              {/* Past records section */}
              {(isPast || isToday) && (
                <>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>
                      {pastEntries.length > 0 
                        ? `Habit Records (${pastEntries.length})`
                        : 'No habit records for this date'}
                    </Text>
                  </View>
                  
                  {pastEntries.map(entry => (
                    <View key={entry.id} style={styles.entryCard}>
                      <Text style={styles.habitName}>{entry.habits.name}</Text>
                      <Text style={styles.entryValue}>{renderEntryValue(entry)}</Text>
                      <Text style={styles.entryTime}>
                        Tracked on {new Date(entry.created_at).toLocaleTimeString()}
                      </Text>
                    </View>
                  ))}
                </>
              )}
              
              {/* Divider if both sections are shown */}
              {(isPast || isToday) && (!isPast || isToday) && pastEntries.length > 0 && futureNotifications.length > 0 && (
                <View style={styles.divider} />
              )}
              
              {/* Future notifications section */}
              {(!isPast || isToday) && (
                <>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>
                      {futureNotifications.length > 0 
                        ? `Scheduled Reminders (${futureNotifications.length})`
                        : 'No reminders scheduled for this date'}
                    </Text>
                  </View>
                  
                  {futureNotifications.map((notification, index) => (
                    <View key={index} style={styles.notificationCard}>
                      <Text style={styles.habitName}>
                        {notification.content.data?.habitName || 'Habit Reminder'}
                      </Text>
                      <Text style={styles.notificationTime}>
                        {notification.trigger.hour}:
                        {notification.trigger.minute.toString().padStart(2, '0')}
                      </Text>
                    </View>
                  ))}
                </>
              )}
            </ScrollView>
          )}
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
    maxHeight: '80%',
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
    padding: 16,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  sectionHeader: {
    marginBottom: 12,
    marginTop: 8,
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
  notificationTime: {
    fontSize: 16,
    color: '#555',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 16,
  },
});