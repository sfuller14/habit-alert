import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LineChart } from 'react-native-chart-kit';
import { HabitEntry } from '@/types/types';
import { useHabits } from '@/hooks/useHabits';

const screenWidth = Dimensions.get('window').width;

// Web-compatible chart component
const WebChart = ({ data, chartConfig, width, height, style }: any) => {
  if (!data || !data.labels || !data.datasets || data.datasets.length === 0) {
    return (
      <View style={[styles.noDataContainer, { width, height }]}>
        <Text style={styles.noDataText}>No data available</Text>
      </View>
    );
  }

  return (
    <View style={[style, { width, height }]}>
      <View style={styles.webChartContainer}>
        <View style={styles.webChartLabels}>
          {data.labels.map((label: string, index: number) => (
            <Text key={index} style={styles.webChartLabel}>{label}</Text>
          ))}
        </View>
        <View style={styles.webChartData}>
          {data.datasets[0].data.map((value: number, index: number) => (
            <View 
              key={index} 
              style={[
                styles.webChartBar, 
                { 
                  height: `${(value / Math.max(...data.datasets[0].data)) * 80}%`,
                  backgroundColor: chartConfig.color(0.8) 
                }
              ]}
            >
              <Text style={styles.webChartValue}>{value}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

export default function AnalyticsScreen() {
  const [selectedHabit, setSelectedHabit] = useState<string | null>(null);
  const [chartData, setChartData] = useState<any>({
    labels: [],
    datasets: [{ data: [] }],
  });
  const { habits, fetchEntriesForHabit, loading } = useHabits();

  // Load chart data when selected habit changes
  useEffect(() => {
    async function loadChartData() {
      if (selectedHabit) {
        const entries = await fetchEntriesForHabit(selectedHabit);
        processChartData(entries);
      }
    }

    if (habits.length > 0) {
      // Select first habit by default if none selected
      if (!selectedHabit) {
        setSelectedHabit(habits[0].id);
      } else {
        loadChartData();
      }
    }
  }, [selectedHabit, habits]);

  // Process entries into chart data format
  const processChartData = (entries: HabitEntry[]) => {
    if (!entries || entries.length === 0) {
      setChartData({
        labels: [],
        datasets: [{ data: [0] }],
      });
      return;
    }

    // Sort entries by date
    const sortedEntries = [...entries].sort((a, b) => {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });

    // Format dates for display
    const labels = sortedEntries.map(entry => {
      const date = new Date(entry.date);
      return `${date.getMonth() + 1}/${date.getDate()}`;
    });

    // Extract values, convert to numbers for the chart
    const values = sortedEntries.map(entry => {
      if (typeof entry.value === 'boolean') {
        return entry.value ? 1 : 0;
      } else if (typeof entry.value === 'string' && entry.value.toLowerCase() === 'true') {
        return 1;
      } else if (typeof entry.value === 'string' && entry.value.toLowerCase() === 'false') {
        return 0;
      } else {
        return Number(entry.value) || 0;
      }
    });

    setChartData({
      labels,
      datasets: [{ data: values }],
    });
  };

  // Get selected habit details
  const getSelectedHabitDetails = () => {
    if (!selectedHabit) return null;
    return habits.find(habit => habit.id === selectedHabit);
  };

  const selectedHabitDetails = getSelectedHabitDetails();

  const chartConfig = {
    backgroundColor: '#fff',
    backgroundGradientFrom: '#fff',
    backgroundGradientTo: '#fff',
    decimalPlaces: selectedHabitDetails?.response_type === 'yes_no' ? 0 : 1,
    color: (opacity = 1) => `rgba(74, 85, 162, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: '#4A55A2',
    },
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Habit Analytics</Text>
      </View>

      <View style={styles.habitSelector}>
        <Text style={styles.selectorLabel}>Select Habit:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.habitsScroll}>
          {habits.map(habit => (
            <TouchableOpacity
              key={habit.id}
              style={[
                styles.habitChip,
                selectedHabit === habit.id && styles.selectedHabitChip
              ]}
              onPress={() => setSelectedHabit(habit.id)}
            >
              <Text style={[
                styles.habitChipText,
                selectedHabit === habit.id && styles.selectedHabitChipText
              ]}>
                {habit.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {selectedHabitDetails && (
        <View style={styles.habitDetails}>
          <Text style={styles.habitName}>{selectedHabitDetails.name}</Text>
          <Text style={styles.habitType}>
            Type: {selectedHabitDetails.response_type === 'yes_no' 
              ? 'Yes/No' 
              : selectedHabitDetails.response_type === 'scale' 
                ? 'Scale (1-10)' 
                : 'Numeric Input'}
          </Text>
        </View>
      )}

      <View style={styles.chartContainer}>
        {chartData.labels.length > 0 ? (
          Platform.OS === 'web' ? (
            <WebChart 
              data={chartData}
              width={screenWidth - 32}
              height={220}
              chartConfig={chartConfig}
              style={styles.chart}
            />
          ) : (
            <LineChart
              data={chartData}
              width={screenWidth - 32}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
            />
          )
        ) : (
          <View style={styles.noDataContainer}>
            <Text style={styles.noDataText}>No data available for this habit yet</Text>
          </View>
        )}
      </View>

      <View style={styles.statsContainer}>
        <Text style={styles.statsTitle}>Statistics</Text>
        
        {chartData.datasets[0].data.length > 0 ? (
          <>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Entries:</Text>
              <Text style={styles.statValue}>{chartData.datasets[0].data.length}</Text>
            </View>
            
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Average:</Text>
              <Text style={styles.statValue}>
                {(chartData.datasets[0].data.reduce((a: number, b: number) => a + b, 0) / 
                  chartData.datasets[0].data.length).toFixed(2)}
              </Text>
            </View>
            
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Highest:</Text>
              <Text style={styles.statValue}>
                {Math.max(...chartData.datasets[0].data)}
              </Text>
            </View>
            
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Lowest:</Text>
              <Text style={styles.statValue}>
                {Math.min(...chartData.datasets[0].data)}
              </Text>
            </View>
          </>
        ) : (
          <Text style={styles.noStatsText}>Add entries to see statistics</Text>
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  habitSelector: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectorLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  habitsScroll: {
    flexDirection: 'row',
  },
  habitChip: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  selectedHabitChip: {
    backgroundColor: '#4A55A2',
  },
  habitChipText: {
    fontSize: 14,
  },
  selectedHabitChipText: {
    color: 'white',
  },
  habitDetails: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  habitName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  habitType: {
    fontSize: 14,
    color: '#666',
  },
  chartContainer: {
    padding: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  noDataContainer: {
    height: 220,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  noDataText: {
    fontSize: 16,
    color: '#666',
  },
  statsContainer: {
    flex: 1,
    padding: 16,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  statLabel: {
    fontSize: 16,
    color: '#333',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4A55A2',
  },
  noStatsText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
  },
  // Web chart styles
  webChartContainer: {
    width: '100%',
    height: '100%',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 10,
    flexDirection: 'column',
  },
  webChartLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 5,
    height: 20,
  },
  webChartLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  webChartData: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingTop: 10,
  },
  webChartBar: {
    flex: 1,
    marginHorizontal: 5,
    justifyContent: 'flex-start',
    alignItems: 'center',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    minHeight: 20,
  },
  webChartValue: {
    fontSize: 10,
    color: 'white',
    fontWeight: 'bold',
    marginTop: 2,
  },
});