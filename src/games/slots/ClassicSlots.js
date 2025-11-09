// src/games/slots/ClassicSlots.js
import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SYMBOLS = ['🍒', '🍋', '🍊', '🍇', '🔔', '💎', '7️⃣', '🍀'];

export default function ClassicSlots({ navigation }) {
  const [coins, setCoins] = useState(1000);
  const [bet, setBet] = useState(10);
  const [spinning, setSpinning] = useState(false);
  const [reels, setReels] = useState([0, 0, 0]);
  const [result, setResult] = useState('');
  
  const spinAnimations = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current
  ];

  const spin = () => {
    if (spinning || coins < bet) return;
    
    setSpinning(true);
    setResult('');
    setCoins(coins - bet);

    const spins = [10 + Math.random() * 5, 12 + Math.random() * 5, 14 + Math.random() * 5];
    const finalReels = [
      Math.floor(Math.random() * SYMBOLS.length),
      Math.floor(Math.random() * SYMBOLS.length),
      Math.floor(Math.random() * SYMBOLS.length)
    ];

    const animations = spinAnimations.map((anim, index) =>
      Animated.timing(anim, {
        toValue: spins[index],
        duration: 2000 + index * 500,
        useNativeDriver: true,
      })
    );

    Animated.parallel(animations).start(() => {
      setReels(finalReels);
      checkWin(finalReels);
      setSpinning(false);
    });
  };

  const checkWin = (finalReels) => {
    const [a, b, c] = finalReels;
    let winAmount = 0;
    let winMessage = '';

    if (a === b && b === c) {
      // Tres símbolos iguales
      if (SYMBOLS[a] === '7️⃣') {
        winAmount = bet * 50;
        winMessage = '¡TRIPLE 7! Jackpot 🎰';
      } else if (SYMBOLS[a] === '💎') {
        winAmount = bet * 25;
        winMessage = '¡TRIPLE DIAMANTE! 💎';
      } else {
        winAmount = bet * 10;
        winMessage = '¡TRIPLE COMBI! 🎉';
      }
    } else if (a === b || b === c || a === c) {
      // Dos símbolos iguales
      winAmount = bet * 2;
      winMessage = '¡DOBLE COMBI! ✨';
    }

    if (winAmount > 0) {
      setCoins(coins + winAmount);
      setResult(`${winMessage} +${winAmount} coins`);
    } else {
      setResult('Sin premio esta vez 😢');
    }
  };

  const getSymbolPosition = (reelIndex) => {
    const inputRange = [];
    const outputRange = [];
    
    for (let i = 0; i <= 20; i++) {
      inputRange.push(i);
      outputRange.push(-i * 60);
    }

    return spinAnimations[reelIndex].interpolate({
      inputRange,
      outputRange,
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFD700" />
        </TouchableOpacity>
        <Text style={styles.coins}>💰 {coins} coins</Text>
      </View>

      <Text style={styles.title}>🎰 Tragamonedas Clásica</Text>

      {/* Máquina tragamonedas */}
      <View style={styles.slotMachine}>
        <View style={styles.reelsContainer}>
          {reels.map((_, index) => (
            <View key={index} style={styles.reel}>
              <Animated.View style={[styles.reelContent, { transform: [{ translateY: getSymbolPosition(index) }] }]}>
                {[...Array(20)].map((_, i) => (
                  <Text key={i} style={styles.symbol}>
                    {SYMBOLS[(i + reels[index]) % SYMBOLS.length]}
                  </Text>
                ))}
              </Animated.View>
            </View>
          ))}
        </View>
        
        <View style={styles.payline} />
      </View>

      {/* Controles */}
      <View style={styles.controls}>
        <View style={styles.betControls}>
          <Text style={styles.betLabel}>Apuesta: {bet} coins</Text>
          <View style={styles.betButtons}>
            {[10, 25, 50, 100].map(amount => (
              <TouchableOpacity
                key={amount}
                style={[styles.betButton, bet === amount && styles.activeBet]}
                onPress={() => setBet(amount)}
              >
                <Text style={styles.betButtonText}>{amount}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.spinButton, (spinning || coins < bet) && styles.disabledButton]}
          onPress={spin}
          disabled={spinning || coins < bet}
        >
          <Text style={styles.spinButtonText}>
            {spinning ? '🎰 Girando...' : '🎯 JUGAR'}
          </Text>
        </TouchableOpacity>
      </View>

      {result ? <Text style={styles.result}>{result}</Text> : null}

      {/* Tabla de pagos */}
      <View style={styles.payouts}>
        <Text style={styles.payoutsTitle}>Premios:</Text>
        <Text style={styles.payout}>7️⃣7️⃣7️⃣ = x50</Text>
        <Text style={styles.payout}>💎💎💎 = x25</Text>
        <Text style={styles.payout}>Cualquier triple = x10</Text>
        <Text style={styles.payout}>Cualquier doble = x2</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F0F',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    textAlign: 'center',
    marginBottom: 30,
  },
  slotMachine: {
    backgroundColor: '#8B0000',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  reelsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10,
  },
  reel: {
    width: 80,
    height: 80,
    backgroundColor: '#1a1a1a',
    marginHorizontal: 5,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  reelContent: {
    alignItems: 'center',
  },
  symbol: {
    fontSize: 40,
    height: 60,
    textAlign: 'center',
    lineHeight: 60,
  },
  payline: {
    width: '100%',
    height: 3,
    backgroundColor: '#FFD700',
    marginTop: -40,
  },
  controls: {
    alignItems: 'center',
    marginBottom: 20,
  },
  betControls: {
    alignItems: 'center',
    marginBottom: 15,
  },
  betLabel: {
    color: '#FFF',
    fontSize: 16,
    marginBottom: 10,
  },
  betButtons: {
    flexDirection: 'row',
  },
  betButton: {
    backgroundColor: '#333',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 10,
    marginHorizontal: 5,
  },
  activeBet: {
    backgroundColor: '#FFD700',
  },
  betButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  spinButton: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
  },
  disabledButton: {
    backgroundColor: '#666',
  },
  spinButtonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 18,
  },
  result: {
    color: '#FFD700',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: 'bold',
  },
  payouts: {
    backgroundColor: '#1a1a1a',
    padding: 15,
    borderRadius: 10,
  },
  payoutsTitle: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  payout: {
    color: '#FFF',
    fontSize: 14,
    marginBottom: 5,
  },
});