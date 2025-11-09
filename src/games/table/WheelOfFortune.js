// src/games/table/WheelOfFortune.js
import React, { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Path, G, Text as SvgText } from 'react-native-svg';

const WHEEL_SECTIONS = [
  { label: 'x2', value: 2, color: '#FF6B6B' },
  { label: 'x1', value: 1, color: '#4ECDC4' },
  { label: 'x3', value: 3, color: '#FFD700' },
  { label: 'x0', value: 0, color: '#95E1D3' },
  { label: 'x5', value: 5, color: '#FF9FF3' },
  { label: 'x2', value: 2, color: '#F368E0' },
  { label: 'x10', value: 10, color: '#FF9F43' },
  { label: 'x1', value: 1, color: '#54A0FF' },
];

export default function WheelOfFortune({ navigation }) {
  const [coins, setCoins] = useState(1000);
  const [bet, setBet] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState('');
  
  const spinAnimation = useRef(new Animated.Value(0)).current;
  const rotation = useRef(0);

  const spinWheel = (betAmount) => {
    if (coins < betAmount || spinning) return;
    
    setBet(betAmount);
    setCoins(coins - betAmount);
    setSpinning(true);
    setResult('');
    
    // Calcular rotación final (múltiplo de 45 grados + vueltas extras)
    const extraRotations = 5 + Math.random() * 3;
    const sectionAngle = 360 / WHEEL_SECTIONS.length;
    const winningSection = Math.floor(Math.random() * WHEEL_SECTIONS.length);
    const finalRotation = extraRotations * 360 + winningSection * sectionAngle;
    
    rotation.current = finalRotation;
    
    Animated.timing(spinAnimation, {
      toValue: finalRotation,
      duration: 4000,
      useNativeDriver: true,
    }).start(() => {
      const winMultiplier = WHEEL_SECTIONS[winningSection].value;
      const winAmount = betAmount * winMultiplier;
      
      if (winAmount > 0) {
        setCoins(coins + winAmount);
        setResult(`¡${WHEEL_SECTIONS[winningSection].label}! Ganas ${winAmount} coins 🎉`);
      } else {
        setResult('Sin premio esta vez. ¡Sigue intentando!');
      }
      
      setSpinning(false);
    });
  };

  const resetGame = () => {
    setBet(0);
    setResult('');
  };

  const spinRotation = spinAnimation.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });

  const renderWheelSection = (section, index) => {
    const totalSections = WHEEL_SECTIONS.length;
    const angle = (360 / totalSections) * (index + 0.5);
    const rad = (angle * Math.PI) / 180;
    const textRadius = 80;
    
    return (
      <G key={index}>
        <Path
          d={`
            M 100 100
            L ${100 + 90 * Math.cos((index * 2 * Math.PI) / totalSections - Math.PI / 2)} 
              ${100 + 90 * Math.sin((index * 2 * Math.PI) / totalSections - Math.PI / 2)}
            A 90 90 0 0 1 
              ${100 + 90 * Math.cos(((index + 1) * 2 * Math.PI) / totalSections - Math.PI / 2)} 
              ${100 + 90 * Math.sin(((index + 1) * 2 * Math.PI) / totalSections - Math.PI / 2)}
            Z
          `}
          fill={section.color}
          stroke="#000"
          strokeWidth="2"
        />
        <SvgText
          x={100 + textRadius * Math.cos(rad)}
          y={100 + textRadius * Math.sin(rad)}
          fill="#000"
          fontSize="14"
          fontWeight="bold"
          textAnchor="middle"
          alignmentBaseline="middle"
        >
          {section.label}
        </SvgText>
      </G>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFD700" />
        </TouchableOpacity>
        <Text style={styles.coins}>💰 {coins} coins</Text>
      </View>

      <Text style={styles.title}>🎡 Wheel of Fortune</Text>

      {/* Rueda de la fortuna */}
      <View style={styles.wheelContainer}>
        <Animated.View style={[styles.wheel, { transform: [{ rotate: spinRotation }] }]}>
          <Svg width="200" height="200" viewBox="0 0 200 200">
            <Circle cx="100" cy="100" r="95" fill="#2b2b2b" stroke="#FFD700" strokeWidth="3" />
            {WHEEL_SECTIONS.map((section, index) => renderWheelSection(section, index))}
            <Circle cx="100" cy="100" r="15" fill="#FFD700" />
          </Svg>
        </Animated.View>
        <View style={styles.pointer} />
      </View>

      {result ? <Text style={styles.result}>{result}</Text> : null}

      {/* Controles */}
      <View style={styles.controls}>
        <View style={styles.betContainer}>
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

        {!spinning && bet > 0 && (
          <TouchableOpacity style={styles.resetButton} onPress={resetGame}>
            <Text style={styles.resetButtonText}>Jugar Otra Vez</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Secciones de la rueda */}
      <View style={styles.sectionsInfo}>
        <Text style={styles.sectionsTitle}>Premios en la Rueda:</Text>
        <View style={styles.sectionsGrid}>
          {WHEEL_SECTIONS.map((section, index) => (
            <View key={index} style={[styles.sectionItem, { backgroundColor: section.color }]}>
              <Text style={styles.sectionText}>{section.label}</Text>
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
    width: 200,
    height: 200,
  },
  pointer: {
    position: 'absolute',
    top: -10,
    left: 90,
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
  betContainer: {
    alignItems: 'center',
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
  resetButton: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    marginTop: 15,
  },
  resetButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  sectionsInfo: {
    backgroundColor: '#1a1a1a',
    padding: 15,
    borderRadius: 10,
    width: '100%',
  },
  sectionsTitle: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  sectionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  sectionItem: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    margin: 3,
    minWidth: 40,
    alignItems: 'center',
  },
  sectionText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 12,
  },
});