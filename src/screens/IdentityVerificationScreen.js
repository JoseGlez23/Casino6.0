// src/screens/IdentityVerificationScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView
} from 'react-native';

export default function IdentityVerificationScreen({ navigation }) {
  const [verificationMethod, setVerificationMethod] = useState(null);

  const handleVerification = (method) => {
    setVerificationMethod(method);
    // Simular verificación exitosa
    setTimeout(() => {
      Alert.alert(
        'Verificación Exitosa',
        `Verificación por ${method} completada`,
        [{ text: 'OK', onPress: () => navigation.navigate('Main') }]
      );
    }, 2000);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Verificación de Identidad</Text>
      <Text style={styles.subtitle}>
        Por seguridad, verifica tu identidad para continuar
      </Text>

      <View style={styles.methodsContainer}>
        <TouchableOpacity 
          style={styles.methodCard}
          onPress={() => handleVerification('Huella Digital')}
        >
          <Text style={styles.methodIcon}>👆</Text>
          <Text style={styles.methodTitle}>Huella Digital</Text>
          <Text style={styles.methodDescription}>
            Usa tu huella dactilar para verificar tu identidad
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.methodCard}
          onPress={() => handleVerification('Reconocimiento Facial')}
        >
          <Text style={styles.methodIcon}>📷</Text>
          <Text style={styles.methodTitle}>Reconocimiento Facial</Text>
          <Text style={styles.methodDescription}>
            Escanea tu rostro para verificar tu identidad
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.methodCard}
          onPress={() => handleVerification('Documento')}
        >
          <Text style={styles.methodIcon}>📄</Text>
          <Text style={styles.methodTitle}>Documento de Identidad</Text>
          <Text style={styles.methodDescription}>
            Sube una foto de tu documento de identidad
          </Text>
        </TouchableOpacity>
      </View>

      {verificationMethod && (
        <View style={styles.verifyingContainer}>
          <Text style={styles.verifyingText}>
            Verificando por {verificationMethod}...
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    marginBottom: 30,
  },
  methodsContainer: {
    marginBottom: 30,
  },
  methodCard: {
    backgroundColor: '#2a2a2a',
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  methodIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  methodTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 5,
  },
  methodDescription: {
    fontSize: 14,
    color: 'white',
    textAlign: 'center',
  },
  verifyingContainer: {
    backgroundColor: '#2a2a2a',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  verifyingText: {
    color: '#FFD700',
    fontSize: 16,
  },
});