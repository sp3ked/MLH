import React from 'react';
import { View, StyleSheet } from 'react-native';
import LocationTracker from '@/app/components/LocationTracker';

export default function PurdueTourScreen() {
  return (
    <View style={styles.container}>
      <LocationTracker />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
