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
    radius: number;
    comment: string;
}

// Backend server IP address - Change this when switching networks
const BACKEND_URL = 'http://172.20.10.6:5000';

const GEO_LOCATIONS: GeofenceLocation[] = [
    {
        id: '1',
        name: 'Clock Tower',
        latitude: 40.427274,
        longitude: -86.914065,
        radius: 75, // 75 meters
        comment: 'You are near the Clock Tower!'
    },
    {
        id: '2',
        name: 'Clapping Circle',
        latitude: 40.425787,
        longitude: -86.911866,
        radius: 50, // 50 meters
        comment: 'You are near the Clapping Circle!'
    },
    {
        id: '3',
        name: 'Lion\'s Head Fountain',
        latitude: 40.426061,
        longitude: -86.913974,
        radius: 30, // 30 meters
        comment: 'You are near the Lion\'s Head Fountain!'
    },
    {
        id: '4',
        name: 'Verve',
        latitude: 40.422234,
        longitude: -86.907011,
        radius: 100, // 100 meters
        comment: 'You are at Verve!'
    },
    {
        id: '5',
        name: 'Co-Rec',
        latitude: 40.429307,
        longitude: -86.922374,
        radius: 100, // Adjust the radius as needed
        comment: 'You are at the Co-Rec!'
    }
];

const DirectionArrow = ({ bearing }: { bearing: number }) => (
    <MaterialCommunityIcons
        name="arrow-up-circle"
        size={40}
        color="#2196F3"
        style={{ transform: [{ rotate: `${bearing}deg` }] }}
    />
);

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

// Function to send a comment to the Flask backend
const sendGeofenceComment = (message: string) => {
    fetch('http://<your-computer-ip>:5000/post-comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
    })
        .then(response => response.json())
        .then(data => {
            console.log('Comment scheduled:', data);
        })
        .catch(err => {
            console.error('Error posting comment:', err);
        });
};

const LocationTracker = () => {
    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [isTracking, setIsTracking] = useState(false);
    const [distances, setDistances] = useState<{ [key: string]: number }>({});
    const [bearings, setBearings] = useState<{ [key: string]: number }>({});
    const [statusMessages, setStatusMessages] = useState<string[]>([]);
    const [currentZoneStatus, setCurrentZoneStatus] = useState<string>("Not in any zone");
    const mapRef = useRef<MapView | null>(null);

    const addStatusMessage = (message: string) => {
        const timestamp = new Date().toLocaleTimeString();
        const fullMessage = `[${timestamp}] ${message}`;
        console.log(fullMessage);
        setStatusMessages(prev => {
            const newMessages = [fullMessage, ...prev.slice(0, 19)]; // Keep last 20 messages
            return newMessages;
        });
    };

    const updateDistancesAndBearings = (currentLocation: { latitude: number; longitude: number }) => {
        const newDistances: { [key: string]: number } = {};
        const newBearings: { [key: string]: number } = {};
        let insideZones: string[] = [];

        GEO_LOCATIONS.forEach((geo) => {
            const distance = haversineDistance(
                currentLocation.latitude,
                currentLocation.longitude,
                geo.latitude,
                geo.longitude
            );
            const bearing = calculateBearing(
                currentLocation.latitude,
                currentLocation.longitude,
                geo.latitude,
                geo.longitude
            );
            newDistances[geo.id] = distance;
            newBearings[geo.id] = bearing;

            if (distance <= geo.radius) {
                insideZones.push(geo.name);
                // Send POST request to backend with current coordinates
                fetch(`${BACKEND_URL}/post-location`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        latitude: currentLocation.latitude,
                        longitude: currentLocation.longitude
                    })
                })
                    .then(response => response.json())
                    .then(data => {
                        console.log('Location posted:', data);
                        addStatusMessage(`Posted location to livestream: (${currentLocation.latitude}, ${currentLocation.longitude})`);
                    })
                    .catch(err => {
                        console.error('Error posting location:', err);
                        addStatusMessage(`Failed to post location: ${err.message}`);
                    });
            }
        });

        // Update zone status
        if (insideZones.length === 0) {
            const newStatus = "Not in any zone";
            if (newStatus !== currentZoneStatus) {
                setCurrentZoneStatus(newStatus);
                addStatusMessage(newStatus);
            }
        } else {
            const newStatus = `Currently in: ${insideZones.join(", ")}`;
            if (newStatus !== currentZoneStatus) {
                setCurrentZoneStatus(newStatus);
                addStatusMessage(newStatus);
            }
        }

        setDistances(newDistances);
        setBearings(newBearings);
    };

    const startLocationTracking = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setErrorMsg('Permission to access location was denied');
                return;
            }

            setIsTracking(true);
            addStatusMessage('Location tracking started');

            const initialLocation = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Highest,
            });
            setLocation(initialLocation);
            updateDistancesAndBearings(initialLocation.coords);

            // Center map on initial location
            mapRef.current?.animateToRegion({
                latitude: initialLocation.coords.latitude,
                longitude: initialLocation.coords.longitude,
                latitudeDelta: 0.001,
                longitudeDelta: 0.001,
            });

            const subscription = await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.Highest,
                    distanceInterval: 0, // Update as frequently as possible
                    timeInterval: 3000, // Update every 3 seconds
                },
                (newLocation) => {
                    setLocation(newLocation);
                    updateDistancesAndBearings(newLocation.coords);
                    mapRef.current?.animateToRegion({
                        latitude: newLocation.coords.latitude,
                        longitude: newLocation.coords.longitude,
                        latitudeDelta: 0.001,
                        longitudeDelta: 0.001,
                    }, 500);
                }
            );

            return () => {
                subscription.remove();
                setIsTracking(false);
                addStatusMessage('Location tracking stopped');
            };
        } catch (error) {
            setErrorMsg('Error starting location tracking');
            console.error(error);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.statusSection}>
                <Text style={styles.sectionTitle}>Status Updates</Text>
                <ScrollView
                    style={styles.statusScroll}
                    contentContainerStyle={styles.statusContent}
                >
                    {statusMessages.map((msg, index) => (
                        <Text key={index} style={styles.statusMessage}>{msg}</Text>
                    ))}
                </ScrollView>
            </View>

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
                                coordinate={{
                                    latitude: geo.latitude,
                                    longitude: geo.longitude,
                                }}
                                title={geo.name}
                                pinColor="#4CAF50"
                            />
                            <Circle
                                center={{
                                    latitude: geo.latitude,
                                    longitude: geo.longitude,
                                }}
                                radius={geo.radius}
                                fillColor="rgba(76, 175, 80, 0.2)"
                                strokeColor="rgba(76, 175, 80, 0.5)"
                            />
                        </React.Fragment>
                    ))}
                </MapView>
            </View>

            <ScrollView
                style={styles.controlPanel}
                contentContainerStyle={styles.controlPanelContent}
            >
                <View style={styles.buttonContainer}>
                    <Button
                        title={isTracking ? "Stop Tracking" : "Start Tracking"}
                        onPress={startLocationTracking}
                    />
                </View>

                {errorMsg ? (
                    <Text style={styles.errorText}>{errorMsg}</Text>
                ) : location ? (
                    <>
                        <View style={styles.zoneStatus}>
                            <Text style={styles.sectionTitle}>Zone Status</Text>
                            <Text style={[
                                styles.zoneStatusText,
                                currentZoneStatus.includes("Not in any zone") ? styles.redText : styles.greenText
                            ]}>
                                {currentZoneStatus}
                            </Text>
                        </View>

                        <View style={styles.locationInfo}>
                            <Text style={styles.sectionTitle}>Current Location</Text>
                            <Text style={styles.coordinates}>
                                Lat: {location.coords.latitude.toFixed(6)}
                            </Text>
                            <Text style={styles.coordinates}>
                                Lon: {location.coords.longitude.toFixed(6)}
                            </Text>
                        </View>

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
};

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

export default LocationTracker; 