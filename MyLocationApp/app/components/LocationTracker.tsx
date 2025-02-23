import React, { useEffect, useState, useRef } from 'react';
import { View, Text, Button, StyleSheet, Dimensions, SafeAreaView, ScrollView } from 'react-native';
import * as Location from 'expo-location';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import MapView, { Marker, Circle } from 'react-native-maps';
import { haversineDistance } from '../utils/distance';

// Define the geofence location type
interface GeofenceLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius: number; // in meters
  comment: string;
  facts: string[]; // Add facts array
}

// Update this to match your computer's IP address (not localhost!)
const BACKEND_URL = 'http://172.20.10.6:5000'; // Replace xxx with your IP's last numbers
const DEBUG = true;

const GEO_LOCATIONS: GeofenceLocation[] = [
  {
    id: '1',
    name: 'Clock Tower',
    latitude: 40.427274,
    longitude: -86.914065,
    radius: 75,
    comment: 'You are near the Clock Tower!',
    facts: [
      "The Clock Tower is a historic Purdue landmark, built in 1995. It stands 160 feet tall over campus. Its chimes resonate every hour for all to hear."
    ]
  },
  {
    id: '2',
    name: 'Clapping Circle',
    latitude: 40.425787,
    longitude: -86.911866,
    radius: 50,
    comment: 'You are near the Clapping Circle!',
    facts: [
      "The Clapping Circle features a captivating echo effect. Students gather to test its acoustics by clapping. It's a delightful oddity unique to campus."
    ]
  },
  {
    id: '3',
    name: "Lion's Head Fountain",
    latitude: 40.426061,
    longitude: -86.913974,
    radius: 30,
    comment: "You are near the Lion's Head Fountain!",
    facts: [
      "This fountain was donated by the Class of 1903 to honor tradition. It’s a tranquil place to relax with scenic architecture. Many campus photos are taken here."
    ]
  },
  {
    id: '4',
    name: 'Verve',
    latitude: 40.422234,
    longitude: -86.907011,
    radius: 100,
    comment: 'You are at Verve!',
    facts: [
      'Verve is a popular coffee shop near Purdue’s campus.',
      'It is known for its cozy atmosphere and delicious coffee.',
      'Students often come here to study and socialize.'
    ]
  },
  {
    // Updated Co-Rec location
    id: '5',
    name: 'Co-Rec',
    latitude: 40.428351,
    longitude: -86.922461,
    radius: 100,
    comment: 'Welcome to the Co-Rec!',
    facts: [
      'The Co-Rec is Purdue’s premier recreational sports center.',
      'It has a variety of fitness classes and sports facilities.',
      'A great place to stay active and meet fellow Boilermakers.'
    ]
  },
  {
    // New Chick-fil-A zone
    id: '6',
    name: 'Chick-fil-A',
    latitude: 40.428351,
    longitude: -86.919702,
    radius: 50,
    comment: 'Welcome to Chick-fil-A! A great dining spot on campus.',
    facts: [
      'Chick-fil-A is famous for its chicken sandwiches and waffle fries.',
      'It’s popular among students for quick, tasty meals.',
      'Don’t forget to try their signature sauces!'
    ]
  },
  {
    id: '7',
    name: 'Engineering Fountain',
    latitude: 40.428626,
    longitude: -86.913803,
    radius: 50,
    comment: 'Welcome to the Engineering Fountain!',
    facts: [
      'One of Purdue’s iconic landmarks in the Engineering Mall.',
      'Its modern design is a favorite backdrop for student photos.',
      'A common gathering spot for engineering students.'
    ]
  },
  {
    // Example for the extra coordinate near engineering
    id: '8',
    name: 'Engineering Hall',
    latitude: 40.430186,
    longitude: -86.913535,
    radius: 50,
    comment: 'Welcome to an Engineering building!',
    facts: [
      'This hall hosts various engineering labs and classrooms.',
      'Collaborating here is a key part of many student projects.',
      'You can find quiet study spots in some hallways.'
    ]
  },
  {
    id: '9',
    name: 'Neil Armstrong Hall of Engineering',
    latitude: 40.431060,
    longitude: -86.914920,
    radius: 50,
    comment: 'Welcome to Neil Armstrong Hall of Engineering!',
    facts: [
      'Named after the first man on the moon, a Purdue alumnus.',
      'Features interactive exhibits and innovative labs.',
      'A centerpiece for Purdue’s engineering program.'
    ]
  },
  {
    id: '10',
    name: 'Elliott Hall of Music',
    latitude: 40.427900,
    longitude: -86.914948,
    radius: 50,
    comment: 'Welcome to Elliott Hall of Music!',
    facts: [
      'Elliott Hall hosts concerts, theater, and major events.',
      'It’s one of the largest proscenium theaters in the country.',
      'Known for excellent acoustics and stage technology.'
    ]
  },
  {
    id: '11',
    name: 'Hello Walk and Quad',
    latitude: 40.424959,
    longitude: -86.914293,
    radius: 50,
    comment: 'You are at the Hello Walk and Quad!',
    facts: [
      'The tradition is to say "Hello" to everyone you pass here.',
      'A scenic spot to relax and enjoy campus views.',
      'Often used for outdoor events and student gatherings.'
    ]
  },
  {
    id: '12',
    name: 'Library',
    latitude: 40.424967,
    longitude: -86.912822,
    radius: 50,
    comment: 'Welcome to the Library!',
    facts: [
      'Purdue’s libraries offer extensive resources for research.',
      'A quiet place to study and collaborate on projects.',
      'You can reserve private study rooms here.'
    ]
  },
  {
    id: '13',
    name: 'Purdue Memorial Union and Hotel',
    latitude: 40.425000,
    longitude: -86.911212,
    radius: 50,
    comment: 'Welcome to the Purdue Memorial Union!',
    facts: [
      'The Union has dining options, a game room, and lounges.',
      'It also features a hotel and event spaces.',
      'A central hub of campus life for students and visitors.'
    ]
  },
  {
    id: '14',
    name: "Harry's Bar",
    latitude: 40.423816,
    longitude: -86.909021,
    radius: 50,
    comment: "Welcome to Harry's, Purdue’s most popular bar!",
    facts: [
      'A favorite hangout for Boilermakers and alumni.',
      'Known for its lively atmosphere and longtime traditions.',
      'Great spot to meet friends and unwind after classes.'
    ]
  },
  {
    id: '15',
    name: 'City Hall',
    latitude: 40.425237,
    longitude: -86.906595,
    radius: 50,
    comment: 'Welcome to City Hall!',
    facts: [
      'Local government offices are located here.',
      'Community events and meetings often take place inside.',
      'It’s a building that showcases the city’s civic pride.'
    ]
  }
];

const PURDUE_FACTS = [
  'Purdue University was founded in 1869.',
  'Purdue’s mascot is the Boilermaker Special.',
  'Purdue is known for its engineering and aviation programs.',
  'Neil Armstrong, the first man on the moon, graduated from Purdue.',
  'Purdue’s colors are black and gold.'
];

// 🔰 Utility: Calculate bearing for direction arrow
const calculateBearing = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const λ1 = (lon1 * Math.PI) / 180;
  const λ2 = (lon2 * Math.PI) / 180;

  const y = Math.sin(λ2 - λ1) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(λ2 - λ1);
  const θ = Math.atan2(y, x);
  return ((θ * 180) / Math.PI + 360) % 360;
};

// 🔰 Arrow Icon for direction
const DirectionArrow = ({ bearing }: { bearing: number }) => (
  <MaterialCommunityIcons
    name="arrow-up-circle"
    size={40}
    color="#2196F3"
    style={{ transform: [{ rotate: `${bearing}deg` }] }}
  />
);

export default function LocationTracker() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(false);

  // For geofence data
  const [distances, setDistances] = useState<{ [key: string]: number }>({});
  const [bearings, setBearings] = useState<{ [key: string]: number }>({});
  const [currentZoneStatus, setCurrentZoneStatus] = useState("Not in any zone");

  // For logs at the bottom
  const [statusMessages, setStatusMessages] = useState<string[]>([]);

  // Map reference
  const mapRef = useRef<MapView | null>(null);

  // Watch subscription
  const watchSubscription = useRef<Location.LocationSubscription | null>(null);

  // Posting interval
  const postIntervalRef = useRef<NodeJS.Timer | null>(null);

  // Add last post timestamp tracking and a flag to prevent multiple posts
  const lastPostTime = useRef<number>(0);
  const isPosting = useRef<boolean>(false);
  const POST_INTERVAL = 10000; // 10 seconds in milliseconds

  // Track zones that have already had facts posted
  const visitedZones = useRef<Set<string>>(new Set());

  // 🟢 Helper to add logs to the "Status Updates" list
  const addStatusMessage = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const fullMessage = `[${timestamp}] ${message}`;
    console.log(fullMessage);
    setStatusMessages((prev) => [fullMessage, ...prev.slice(0, 19)]); // Keep last 20 messages
  };

  // Add debug logging function
  const debugLog = (message: string) => {
    if (DEBUG) {
      console.log(`[DEBUG] ${message}`);
      addStatusMessage(`DEBUG: ${message}`);
    }
  };

  // Add server status check
  const checkServerStatus = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/status`);
      const data = await response.json();
      if (!data.ready) {
        addStatusMessage('⚠️ Warning: Instagram server not ready');
        return false;
      }
      addStatusMessage('✅ Instagram server connected');
      return true;
    } catch (err) {
      addStatusMessage(`❌ Can't reach server at ${BACKEND_URL}`);
      return false;
    }
  };

  // 🟢 Modified to handle location updates better
  const checkGeofencesAndPost = async (coords: { latitude: number; longitude: number }) => {
    try {
      // Update geofences as before
      let insideZones: string[] = [];
      const newDistances: { [key: string]: number } = {};
      const newBearings: { [key: string]: number } = {};
      let currentFacts: string[] = [];

      GEO_LOCATIONS.forEach((geo) => {
        const distance = haversineDistance(coords.latitude, coords.longitude, geo.latitude, geo.longitude);
        const bearing = calculateBearing(coords.latitude, coords.longitude, geo.latitude, geo.longitude);

        newDistances[geo.id] = distance;
        newBearings[geo.id] = bearing;

        // Only post once upon first entry
        if (distance <= geo.radius && !visitedZones.current.has(geo.id)) {
          insideZones.push(geo.name);
          currentFacts = geo.facts;
          visitedZones.current.add(geo.id);
        }
      });

      // Update distances/bearings for UI
      setDistances(newDistances);
      setBearings(newBearings);

      // Update zone status and log
      if (insideZones.length === 0) {
        if (currentZoneStatus !== "Not in any zone") {
          setCurrentZoneStatus("Not in any zone");
          addStatusMessage("Not in any zone");
        }
      } else {
        const newStatus = `Currently in: ${insideZones.join(", ")}`;
        if (newStatus !== currentZoneStatus) {
          setCurrentZoneStatus(newStatus);
          addStatusMessage(newStatus);
        }
      }

      // Log current location every 2 seconds
      addStatusMessage(`Current location: Lat ${coords.latitude.toFixed(6)}, Long ${coords.longitude.toFixed(6)}`);

      // If a new zone was entered, post immediately
      if (insideZones.length > 0 && currentFacts.length > 0) {
        debugLog('Preparing to send location to server...');
        const serverReady = await checkServerStatus();
        if (!serverReady) return;

        try {
          const factToPost = currentFacts[Math.floor(Math.random() * currentFacts.length)];
          const response = await fetch(`${BACKEND_URL}/send-comment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fact: factToPost }),
          });
          if (!response.ok) throw new Error(`Server responded with ${response.status}`);
          const data = await response.json();
          addStatusMessage(`✅ Posted to Instagram: ${data.comment}`);
        } catch (error) {
          addStatusMessage(`❌ Failed to post: ${error.message}`);
          debugLog(`Post error: ${error}`);
        }
      }
    } catch (error) {
      debugLog(`Error in checkGeofencesAndPost: ${error}`);
    }
  };

  // 🟢 Modified start tracking function with better location handling
  const startLocationTracking = async () => {
    try {
      // Check server first
      const serverReady = await checkServerStatus();
      if (!serverReady) {
        setErrorMsg("Cannot connect to Instagram server");
        return;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg("Permission to access location was denied");
        return;
      }

      setIsTracking(true);
      addStatusMessage('Location tracking started');
      lastPostTime.current = 0; // Reset last post time

      // Subscribe to location updates (every 2 seconds)
      watchSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 2000,
          distanceInterval: 1
        },
        (newLoc) => {
          setLocation(newLoc);
          if (mapRef.current) {
            mapRef.current.animateToRegion({
              latitude: newLoc.coords.latitude,
              longitude: newLoc.coords.longitude,
              latitudeDelta: 0.001,
              longitudeDelta: 0.001,
            }, 500);
          }
          checkGeofencesAndPost(newLoc.coords);
        }
      );

    } catch (error) {
      setErrorMsg('Error starting location tracking');
      console.error(error);
    }
  };

  // 🟢 Modified stop tracking function
  const stopLocationTracking = () => {
    if (watchSubscription.current) {
      watchSubscription.current.remove();
      watchSubscription.current = null;
    }
    if (postIntervalRef.current) {
      clearInterval(postIntervalRef.current);
      postIntervalRef.current = null;
    }
    setIsTracking(false);
    addStatusMessage('Location tracking stopped');
  };

  // 🟢 Clean up on unmount
  useEffect(() => {
    const testConnection = async () => {
      try {
        debugLog('Testing server connection...');
        const response = await fetch(`${BACKEND_URL}/status`);
        const data = await response.json();
        debugLog(`Server status: ${JSON.stringify(data)}`);
      } catch (err) {
        debugLog(`Connection test failed: ${err}`);
      }
    };

    testConnection();
    return () => {
      stopLocationTracking();
    };
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* Status Updates at the Top */}
      <View style={styles.statusSection}>
        <Text style={styles.sectionTitle}>Status Updates</Text>
        <ScrollView style={styles.statusScroll} contentContainerStyle={styles.statusContent}>
          {statusMessages.map((msg, index) => (
            <Text key={index} style={styles.statusMessage}>{msg}</Text>
          ))}
        </ScrollView>
      </View>

      {/* Map Section */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={{
            latitude: GEO_LOCATIONS[0].latitude,
            longitude: GEO_LOCATIONS[0].longitude,
            latitudeDelta: 0.002,
            longitudeDelta: 0.002,
          }}
        >
          {location && (
            <Marker
              coordinate={{
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
              }}
              title="You are here"
              pinColor="#2196F3"
            />
          )}
          {GEO_LOCATIONS.map((geo) => (
            <React.Fragment key={geo.id}>
              <Marker
                coordinate={{ latitude: geo.latitude, longitude: geo.longitude }}
                title={geo.name}
                pinColor="#4CAF50"
              />
              <Circle
                center={{ latitude: geo.latitude, longitude: geo.longitude }}
                radius={geo.radius}
                fillColor="rgba(76, 175, 80, 0.2)"
                strokeColor="rgba(76, 175, 80, 0.5)"
              />
            </React.Fragment>
          ))}
        </MapView>
      </View>

      {/* Control Panel & Info */}
      <ScrollView style={styles.controlPanel} contentContainerStyle={styles.controlPanelContent}>
        {/* Button to Start/Stop Tracking */}
        <View style={styles.buttonContainer}>
          <Button
            title={isTracking ? "Stop Tracking" : "Start Tracking"}
            onPress={isTracking ? stopLocationTracking : startLocationTracking}
          />
        </View>

        {errorMsg ? (
          <Text style={styles.errorText}>{errorMsg}</Text>
        ) : location ? (
          <>
            {/* Current Zone */}
            <View style={styles.zoneStatus}>
              <Text style={styles.sectionTitle}>Zone Status</Text>
              <Text
                style={[
                  styles.zoneStatusText,
                  currentZoneStatus.includes("Not in any zone") ? styles.redText : styles.greenText,
                ]}
              >
                {currentZoneStatus}
              </Text>
            </View>

            {/* Current Location */}
            <View style={styles.locationInfo}>
              <Text style={styles.sectionTitle}>Current Location</Text>
              <Text style={styles.coordinates}>
                Lat: {location.coords.latitude.toFixed(6)}
              </Text>
              <Text style={styles.coordinates}>
                Lon: {location.coords.longitude.toFixed(6)}
              </Text>
            </View>

            {/* Nearby Geofences */}
            <View style={styles.geofenceList}>
              <Text style={styles.sectionTitle}>Nearby Locations</Text>
              {GEO_LOCATIONS.map((geo) => (
                <View key={geo.id} style={styles.geofenceItem}>
                  <DirectionArrow bearing={bearings[geo.id] || 0} />
                  <View style={styles.geofenceInfo}>
                    <Text style={styles.geofenceName}>{geo.name}</Text>
                    <Text style={styles.geofenceDistance}>
                      {(distances[geo.id] || 0).toFixed(0)}m away
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        ) : (
          <Text style={styles.coordinates}>Waiting for location...</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// 🔹 Styles (Exactly as provided)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    width: '100%',
  },
  statusSection: {
    backgroundColor: '#fff',
    padding: 10,
    height: Dimensions.get('window').height * 0.2,
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  statusScroll: {
    flex: 1,
  },
  statusContent: {
    paddingHorizontal: 10,
  },
  mapContainer: {
    height: Dimensions.get('window').height * 0.3,
    width: '100%',
    backgroundColor: '#fff',
  },
  map: {
    flex: 1,
    width: '100%',
  },
  controlPanel: {
    flex: 1,
    width: '100%',
  },
  controlPanelContent: {
    padding: 10,
  },
  buttonContainer: {
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginVertical: 10,
    width: '100%',
  },
  zoneStatus: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginVertical: 10,
    width: '100%',
  },
  redText: {
    color: '#f44336',
  },
  greenText: {
    color: '#4CAF50',
  },
  zoneStatusText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  locationInfo: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginVertical: 10,
    width: '100%',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  coordinates: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  geofenceList: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginVertical: 10,
    width: '100%',
  },
  geofenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    width: '100%',
  },
  geofenceInfo: {
    marginLeft: 10,
    flex: 1,
  },
  geofenceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  geofenceDistance: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  statusMessage: {
    fontSize: 14,
    color: '#666',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  errorText: {
    color: '#f44336',
    fontSize: 16,
    textAlign: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginVertical: 10,
    width: '100%',
  },
});
