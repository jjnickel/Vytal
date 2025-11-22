import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../ThemeContext';
import { useWeight } from '../WeightContext';

export default function HealthScreen() {
  const { accentColor, backgroundColor } = useTheme();
  const { weightEntries, addWeightEntry } = useWeight();
  const navigation = useNavigation();
  const [weightInput, setWeightInput] = useState('');
  const [showWeightInput, setShowWeightInput] = useState(false);

  // In a real app this screen would fetch data from Apple HealthKit or
  // Google Fit. For the prototype we display placeholder metrics.
  const metrics = {
    steps: 7500,
    hrv: 60,
    restingHeartRate: 58,
    vo2Max: 45,
    sleepHours: 7.5,
  };

  const handleAddWeight = () => {
    const weight = parseFloat(weightInput);
    if (isNaN(weight) || weight <= 0) {
      Alert.alert('Invalid Input', 'Please enter a valid weight');
      return;
    }
    addWeightEntry(weight);
    setWeightInput('');
    setShowWeightInput(false);
    Alert.alert('Success', 'Weight logged successfully!');
  };

  // Line graph component
  const WeightGraph = () => {
    if (weightEntries.length === 0) return null;
    const [graphDimensions, setGraphDimensions] = useState({ width: 0, height: 0 });

    const graphHeight = 200;
    const graphPadding = 20;

    // Get min and max weights for scaling (add padding)
    const weights = weightEntries.map(e => e.weight);
    const minWeight = Math.min(...weights);
    const maxWeight = Math.max(...weights);
    const weightPadding = (maxWeight - minWeight) * 0.1 || 2;
    const adjustedMinWeight = minWeight - weightPadding;
    const adjustedMaxWeight = maxWeight + weightPadding;
    const weightRange = adjustedMaxWeight - adjustedMinWeight || 10;

    // Calculate points in percentages
    const points = weightEntries.map((entry, index) => {
      const xPercent = weightEntries.length === 1 ? 50 : (index / (weightEntries.length - 1)) * 100;
      const yPercent = 100 - (((entry.weight - adjustedMinWeight) / weightRange) * 100);
      return { 
        xPercent, 
        yPercent, 
        weight: entry.weight, 
        date: entry.date,
        index 
      };
    });

    // Create gradient fill area under the line using vertical strips
    // Each strip follows the line curve and has gradient opacity
    const gradientStrips = [];
    const numStrips = 100; // More strips = smoother gradient
    
    for (let strip = 0; strip < numStrips; strip++) {
      const xPercent = (strip / (numStrips - 1)) * 100;
      
      // Find which line segment this strip belongs to
      let segmentIndex = 0;
      for (let i = 0; i < points.length - 1; i++) {
        if (xPercent >= points[i].xPercent && xPercent <= points[i + 1].xPercent) {
          segmentIndex = i;
          break;
        }
      }
      
      // Interpolate y position along the line at this x position
      const p1 = points[segmentIndex];
      const p2 = points[Math.min(segmentIndex + 1, points.length - 1)];
      const t = p1.xPercent === p2.xPercent ? 0 : (xPercent - p1.xPercent) / (p2.xPercent - p1.xPercent);
      const lineYPercent = p1.yPercent + (p2.yPercent - p1.yPercent) * t;
      
      // Create vertical gradient strips with decreasing opacity from line to bottom
      const numGradientLayers = 15;
      for (let layer = 0; layer < numGradientLayers; layer++) {
        const layerHeight = (100 - lineYPercent) / numGradientLayers;
        const layerTop = lineYPercent + (layer * layerHeight);
        // Opacity decreases from top (near line) to bottom
        const layerOpacity = 0.3 * (1 - layer / numGradientLayers);
        
        gradientStrips.push(
          <View
            key={`gradient-strip-${strip}-${layer}`}
            style={[
              styles.gradientStrip,
              {
                left: `${xPercent}%`,
                top: `${layerTop}%`,
                height: `${layerHeight}%`,
                backgroundColor: accentColor,
                opacity: layerOpacity,
              },
            ]}
          />
        );
      }
    }

    return (
      <View style={styles.graphContainer}>
        <View style={styles.graphHeader}>
          <Text style={styles.graphTitle}>Weight Progression</Text>
          <Text style={styles.graphSubtitle}>
            {weightEntries.length} {weightEntries.length === 1 ? 'entry' : 'entries'}
          </Text>
        </View>
        <View style={[styles.graph, { height: graphHeight }]}>
          {/* Y-axis labels */}
          <View style={styles.yAxis}>
            <Text style={styles.yAxisLabel}>{adjustedMaxWeight.toFixed(1)}</Text>
            <Text style={styles.yAxisLabel}>{((adjustedMinWeight + adjustedMaxWeight) / 2).toFixed(1)}</Text>
            <Text style={styles.yAxisLabel}>{adjustedMinWeight.toFixed(1)}</Text>
          </View>
          
          {/* Graph area */}
          <View 
            style={styles.graphArea}
            onLayout={(event) => {
              const { width, height } = event.nativeEvent.layout;
              setGraphDimensions({ width, height });
            }}
          >
            {/* Grid lines */}
            <View style={styles.gridLine} />
            <View style={[styles.gridLine, { top: '50%' }]} />
            <View style={[styles.gridLine, { top: '100%' }]} />
            
            {/* Gradient fill area under the line */}
            <View style={styles.fillContainer}>
              {gradientStrips}
            </View>
            
            {/* Line graph - connecting the dots exactly from point to point */}
            <View style={styles.lineContainer}>
              {graphDimensions.width > 0 && graphDimensions.height > 0 && points.map((point, index) => {
                if (index === 0) return null;
                const prevPoint = points[index - 1];
                
                // Convert percentages to pixels
                const graphAreaWidth = graphDimensions.width;
                const graphAreaHeight = graphDimensions.height;
                
                const x1 = (prevPoint.xPercent / 100) * graphAreaWidth;
                const y1 = (prevPoint.yPercent / 100) * graphAreaHeight;
                const x2 = (point.xPercent / 100) * graphAreaWidth;
                const y2 = (point.yPercent / 100) * graphAreaHeight;
                
                // Calculate line segment
                const dx = x2 - x1;
                const dy = y2 - y1;
                const length = Math.sqrt(dx * dx + dy * dy);
                const angle = Math.atan2(dy, dx) * (180 / Math.PI);
                
                // Position line so it starts at (x1, y1) and ends at (x2, y2)
                // Center is at midpoint
                const centerX = (x1 + x2) / 2;
                const centerY = (y1 + y2) / 2;
                
                // Position the line's left edge so center is at midpoint
                const lineLeft = centerX - (length / 2);
                
                return (
                  <View
                    key={`line-${index}`}
                    style={[
                      styles.lineSegment,
                      {
                        left: lineLeft,
                        top: centerY,
                        width: length,
                        marginTop: -1.5, // Center vertically (line height is 3px)
                        transform: [{ rotate: `${angle}deg` }],
                        backgroundColor: accentColor,
                      },
                    ]}
                  />
                );
              })}
              
              {/* Data points */}
              {points.map((point, index) => (
                <View
                  key={`point-${index}`}
                  style={[
                    styles.dataPoint,
                    {
                      left: `${point.xPercent}%`,
                      top: `${point.yPercent}%`,
                      backgroundColor: accentColor,
                    },
                  ]}
                />
              ))}
            </View>
          </View>
        </View>
        
        {/* X-axis labels (dates) */}
        <View style={styles.xAxis}>
          {points.map((point, index) => {
            if (index % Math.ceil(points.length / 5) !== 0 && index !== points.length - 1) return null;
            const dateStr = point.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            return (
              <Text key={`label-${index}`} style={styles.xAxisLabel}>
                {dateStr}
              </Text>
            );
          })}
        </View>
      </View>
    );
  };

  const MetricCard = ({ label, value, unit, icon }) => (
    <View style={styles.metricCard}>
      <View style={styles.metricHeader}>
        <Text style={styles.metricIcon}>{icon}</Text>
        <Text style={styles.metricLabel}>{label}</Text>
      </View>
      <View style={styles.metricValueContainer}>
        <Text style={[styles.metricValue, { color: accentColor }]}>{value}</Text>
        <Text style={styles.metricUnit}>{unit}</Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor }]}>
      {/* Top Banner */}
      <View style={styles.topBanner}>
        <Image
          source={require('../assets/logo2.png')}
          style={styles.bannerLogo}
          resizeMode="contain"
        />
      </View>
      <View style={styles.homeButtonWrapper}>
        <TouchableOpacity
          style={[styles.homeButton, { backgroundColor: '#1F2937', borderColor: accentColor }]}
          onPress={() => navigation.navigate('Home')}
        >
          <Ionicons name="home" size={20} color={accentColor} />
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
        <Text style={styles.title}>Health Summary</Text>
        <Text style={styles.subtitle}>Your wellness metrics at a glance</Text>
      </View>

      {/* Weight Tracking Section */}
      <View style={styles.weightSection}>
        <View style={styles.weightHeader}>
          <View>
            <Text style={styles.weightTitle}>Weight Tracking</Text>
            <Text style={styles.weightSubtitle}>
              Current: {weightEntries.length > 0 ? weightEntries[weightEntries.length - 1].weight.toFixed(1) : 'N/A'} lbs
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.addWeightButton, { backgroundColor: accentColor }]}
            onPress={() => setShowWeightInput(!showWeightInput)}
          >
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <Text style={styles.addWeightButtonText}>Add Weight</Text>
          </TouchableOpacity>
        </View>

        {showWeightInput && (
          <View style={styles.weightInputContainer}>
            <TextInput
              style={styles.weightInput}
              placeholder="Enter weight (lbs)"
              placeholderTextColor="#6B7280"
              value={weightInput}
              onChangeText={setWeightInput}
              keyboardType="numeric"
            />
            <View style={styles.weightInputActions}>
              <TouchableOpacity
                style={[styles.weightCancelButton, { borderColor: '#374151' }]}
                onPress={() => {
                  setShowWeightInput(false);
                  setWeightInput('');
                }}
              >
                <Text style={styles.weightCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.weightSaveButton, { backgroundColor: accentColor }]}
                onPress={handleAddWeight}
              >
                <Text style={styles.weightSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {weightEntries.length > 0 && <WeightGraph />}
      </View>

      <View style={styles.metricsGrid}>
        <MetricCard 
          label="Steps Today" 
          value={metrics.steps.toLocaleString()} 
          unit="steps"
          icon="👣"
        />
        <MetricCard 
          label="HRV" 
          value={metrics.hrv} 
          unit="ms"
          icon="💓"
        />
        <MetricCard 
          label="Resting Heart Rate" 
          value={metrics.restingHeartRate} 
          unit="bpm"
          icon="❤️"
        />
        <MetricCard 
          label="VO₂ Max" 
          value={metrics.vo2Max} 
          unit="ml/kg/min"
          icon="💪"
        />
        <MetricCard 
          label="Sleep" 
          value={metrics.sleepHours} 
          unit="hours"
          icon="😴"
        />
      </View>
    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 20,
    paddingTop: 80, // Space for banner (60px) + spacing
    paddingHorizontal: 10,
  },
  topBanner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: '#1F2937',
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    paddingRight: 20,
    paddingBottom: 10,
    zIndex: 5,
  },
  bannerLogo: {
    width: 120,
    height: 40,
  },
  homeButtonWrapper: {
    position: 'absolute',
    top: 50,
    left: 10,
    zIndex: 10,
    width: 44,
    height: 44,
  },
  homeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    backgroundColor: '#1F2937',
  },
  contentContainer: {
    padding: 20,
    paddingTop: 40,
  },
  header: {
    marginBottom: 32,
    marginTop: 10,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#F9FAFB',
    marginBottom: 8,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    fontWeight: '400',
    letterSpacing: 0.2,
  },
  metricsGrid: {
    gap: 16,
  },
  metricCard: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#374151',
    marginBottom: 12,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  metricIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  metricLabel: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '500',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  metricValueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  metricValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#6366F1',
    letterSpacing: -0.5,
  },
  metricUnit: {
    fontSize: 16,
    color: '#6B7280',
    marginLeft: 8,
    fontWeight: '500',
  },
  weightSection: {
    marginBottom: 32,
  },
  weightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  weightTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F9FAFB',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  weightSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '400',
  },
  addWeightButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  addWeightButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  weightInputContainer: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#374151',
    marginBottom: 16,
  },
  weightInput: {
    backgroundColor: '#111827',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#374151',
    fontSize: 16,
    color: '#F9FAFB',
    fontWeight: '500',
    marginBottom: 12,
  },
  weightInputActions: {
    flexDirection: 'row',
    gap: 12,
  },
  weightCancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
  },
  weightCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  weightSaveButton: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  weightSaveText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  graphContainer: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#374151',
    marginTop: 16,
  },
  graphHeader: {
    marginBottom: 16,
  },
  graphTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F9FAFB',
    marginBottom: 4,
  },
  graphSubtitle: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '400',
  },
  graph: {
    position: 'relative',
    width: '100%',
    marginBottom: 20,
  },
  yAxis: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 35,
    justifyContent: 'space-between',
    paddingVertical: 20,
  },
  yAxisLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  graphArea: {
    marginLeft: 40,
    position: 'relative',
    height: '100%',
    overflow: 'hidden',
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#374151',
    opacity: 0.5,
  },
  fillContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    zIndex: 0,
  },
  gradientStrip: {
    position: 'absolute',
    width: `${100 / 100}%`, // Width of each strip (1% for 100 strips)
  },
  lineContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    zIndex: 1,
  },
  lineSegment: {
    position: 'absolute',
    height: 3,
    borderRadius: 1.5,
    marginTop: -1.5, // Center the line vertically on the point
    marginLeft: 0,
  },
  dataPoint: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    marginLeft: -5,
    marginTop: -5,
    zIndex: 2,
    borderWidth: 2,
    borderColor: '#1F2937',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  xAxis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: 40,
    marginTop: 8,
  },
  xAxisLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    fontWeight: '500',
  },
});
