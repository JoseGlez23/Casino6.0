// src/games/wheels/BigSix.js
import React, { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const WHEEL_SECTIONS = [
  { label: '1', multiplier: 1, color: '#FF6B6B' },
  { label: '2', multiplier: 2, color: '#4ECDC4' },
  { label: '5', multiplier: 5, color: '#FFD700' },
  { label: '10', multiplier: 10, color: '#95E1D3' },
  { label: '20', multiplier: 20, color: '#FF9FF3' },
  { label: 'JACKPOT', multiplier: 40, color: '#FF9F43' },
];

export default function BigSix({ navigation }) {
  const [coins, setCoins] = useState(1000);
  const [bet, setBet] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState('');
  
  const spinAnimation = useRef(new Animated.Value(0)).current;

  const spinWheel = (betAmount) => {
    if (coins < betAmount || spinning) return;
    
    setBet(betAmount);
    setCoins(coins - betAmount);
    setSpinning(true);
    setResult('');
    
    const extraRotations = 3 + Math.random() * 2;
    const sectionAngle = 360 / WHEEL_SECTIONS.length;
    const winningSection = Math.floor(Math.random() * WHEEL_SECTIONS.length);
    const finalRotation = extraRotations * 360 + winningSection * sectionAngle;
    
    Animated.timing(spinAnimation, {
      toValue: finalRotation,
      duration: 3000,
      useNativeDriver: true,
    }).start(() => {
      const winMultiplier = WHEEL_SECTIONS[winningSection].multiplier;
      const winAmount = betAmount * winMultiplier;
      
      setCoins(coins + winAmount);
      setResult(`¡${WHEEL_SECTIONS[winningSection].label}! Ganas ${winAmount} coins 🎉`);
      setSpinning(false);
    });
  };

  const spinRotation = spinAnimation.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFD700" />
        </TouchableOpacity>
        <Text style={styles.coins}>💰 {coins} coins</Text>
      </View>

      <Text style={styles.title}>🎡 Big Six Wheel</Text>

      {/* Rueda Big Six */}
      <View style={styles.wheelContainer}>
        <Animated.View style={[styles.wheel, { transform: [{ rotate: spinRotation }] }]}>
          <View style={styles.wheelInner}>
            {WHEEL_SECTIONS.map((section, index) => (
              <View
                key={index}
                style={[
                  styles.wheelSection,
                  {
                    backgroundColor: section.color,
                    transform: [
                      { rotate: `${(index * 60)}deg` }
                    ]
                  }
                ]}
              >
                <Text style={styles.sectionLabel}>{section.label}</Text>
              </View>
            ))}
          </View>
        </Animated.View>
        <View style={styles.pointer} />
      </View>

      {result ? <Text style={styles.result}>{result}</Text> : null}

      {/* Controles */}
      <View style={styles.controls}>
        <Text style={styles.betTitle}>Selecciona tu apuesta:</Text>
        <View style={styles.betButtons}>
          {[10, 25, 50, 100].map(amount => (
            <TouchableOpacity
              key={amount}
              style={[styles.betButton, (coins < amount || spinning) && styles.disabledButton]}
              onPress={() => spinWheel(amount)}
              disabled={coins < amount || spinning}
            >
              <Text style={styles.betButtonText}>{amount}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Tabla de pagos */}
      <View style={styles.payouts}>
        <Text style={styles.payoutsTitle}>Multiplicadores:</Text>
        <View style={styles.payoutGrid}>
          {WHEEL_SECTIONS.map((section, index) => (
            <View key={index} style={styles.payoutItem}>
              <View style={[styles.payoutColor, { backgroundColor: section.color }]} />
              <Text style={styles.payoutText}>{section.label} = x{section.multiplier}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F0F',
    padding: 20,
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  backButton: {
    padding: 10,
  },
  coins: {
    color: '#FFD700',
    fontSize: 20,
    fontWeight: 'bold',
  },
  title: {
    color: '#FFD700',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  wheelContainer: {
    position: 'relative',
    marginBottom: 30,
  },
  wheel: {
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: '#2b2b2b',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 5,
    borderColor: '#FFD700',
  },
  wheelInner: {
    width: 240,
    height: 240,
    borderRadius: 120,
    overflow: 'hidden',
    position: 'relative',
  },
  wheelSection: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionLabel: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
    transform: [{ rotate: '-60deg' }],
    marginTop: 20,
  },
  pointer: {
    position: 'absolute',
    top: -15,
    left: 115,
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 20,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#FFD700',
  },
  result: {
    color: '#FFD700',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: 'bold',
  },
  controls: {
    alignItems: 'center',
    marginBottom: 30,
  },
  betTitle: {
    color: '#FFF',
    fontSize: 16,
    marginBottom: 15,
  },
  betButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  betButton: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    margin: 5,
    minWidth: 60,
  },
  betButtonText: {
    color: '#000',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  disabledButton: {
    backgroundColor: '#666',
  },
  payouts: {
    backgroundColor: '#1a1a1a',
    padding: 15,
    borderRadius: 10,
    width: '100%',
  },
  payoutsTitle: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  payoutGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  payoutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    marginBottom: 8,
  },
  payoutColor: {
    width: 20,
    height: 20,
    borderRadius: 4,
    marginRight: 8,
  },
  payoutText: {
    color: '#FFF',
    fontSize: 14,
  },
});