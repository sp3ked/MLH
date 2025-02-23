import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Choose a Tour</Text>

      {/* Button 1: Purdue Tour */}
      <Pressable style={styles.button} onPress={() => router.push('/(tabs)/purdue-tour')}>
        <Text style={styles.buttonText}>Purdue Tour</Text>
      </Pressable>

      {/* Button 2: Another Tour */}
      <Pressable style={styles.button} onPress={() => alert('Another Tour Coming Soon!')}>
        <Text style={styles.buttonText}>Another Tour</Text>
      </Pressable>

      {/* Button 3: A Future Tour */}
      <Pressable style={styles.button} onPress={() => alert('Future Tour Under Construction!')}>
        <Text style={styles.buttonText}>Future Tour</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#0a7ea4',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginVertical: 8,
    width: '80%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
