import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Habit } from '@/types/types';

interface HabitItemProps {
  habit: Habit;
  onPress: () => void;
}

export default function HabitItem({ habit, onPress }: HabitItemProps) {
  // Get appropriate icon and color based on habit type
  const getTypeDetails = () => {
    switch (habit.response_type) {
      case 'yes_no':
        return { label: 'Yes/No', color: '#4CAF50' };
      case 'scale':
        return { label: 'Scale 1-10', color: '#2196F3' };
      case 'numeric':
        return { label: 'Numeric', color: '#9C27B0' };
      default:
        return { label: 'Custom', color: '#FF9800' };
    }
  };

  const typeDetails = getTypeDetails();

  // Format the notification frequency for display
  const formatFrequency = () => {
    switch (habit.notification_frequency) {
      case 'daily':
        return `Daily (${habit.times_per_day} time${habit.times_per_day > 1 ? 's' : ''})`;
      case 'weekly':
        return 'Weekly';
      case 'monthly':
        return 'Monthly';
      default:
        return 'Custom';
    }
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.contentContainer}>
        <Text style={styles.habitName}>{habit.name}</Text>
        
        <View style={styles.detailsContainer}>
          <View style={[styles.typeTag, { backgroundColor: typeDetails.color }]}>
            <Text style={styles.typeText}>{typeDetails.label}</Text>
          </View>
          
          <Text style={styles.frequency}>{formatFrequency()}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 12,
    overflow: 'hidden',
  },
  contentContainer: {
    padding: 16,
  },
  habitName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  detailsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 10,
  },
  typeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  frequency: {
    fontSize: 14,
    color: '#666',
  },
});