import React from 'react';
import { View, StyleSheet } from 'react-native';
import LocationTracker from './components/LocationTracker';

export default function App() {
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
    alignItems: 'center',
    justifyContent: 'center',
  },
});