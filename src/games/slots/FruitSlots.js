import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as Animatable from 'react-native-animatable';

const fruits = ["🍓", "🍉", "🍇", "🍌", "🍎", "🥭", "🍑", "🍒"];

export default function FruitSlots() {
  const [reels, setReels] = useState(["🍓", "🍓", "🍓"]);
  const [spinning, setSpinning] = useState(false);
  const [balance, setBalance] = useState(1000);
  const [bet, setBet] = useState(10);
  const [lastWin, setLastWin] = useState(0);

  const spin = async () => {
    if (spinning || balance < bet) return;
    
    setSpinning(true);
    setBalance(prev => prev - bet);
    setLastWin(0);

    // Animación de giro
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        setReels(prev => {
          const newReels = [...prev];
          newReels[i] = fruits[Math.floor(Math.random() * fruits.length)];
          return newReels;
        });
      }, 500 * (i + 1));
    }

    // Resultado final
    setTimeout(() => {
      const newReels = [
        fruits[Math.floor(Math.random() * fruits.length)],
        fruits[Math.floor(Math.random() * fruits.length)],
        fruits[Math.floor(Math.random() * fruits.length)]
      ];
      
      setReels(newReels);
      
      const win = calculateWin(newReels);
      if (win > 0) {
        setLastWin(win);
        setBalance(prev => prev + win);
      }
      
      setSpinning(false);
    }, 2000);
  };

  const calculateWin = (currentReels) => {
    if (currentReels[0] === "🍒" && currentReels[1] === "🍒" && currentReels[2] === "🍒") {
      return bet * 20;
    }
    if (currentReels[0] === currentReels[1] && currentReels[1] === currentReels[2]) {
      return bet * 8;
    }
    if (currentReels[0] === currentReels[1] || currentReels[1] === currentReels[2]) {
      return bet * 2;
    }
    return 0;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🍓 Tragaperras de Frutas</Text>
      
      <View style={styles.balanceContainer}>
        <Text style={styles.balance}>Balance: ${balance}</Text>
        <Text style={styles.bet}>Apuesta: ${bet}</Text>
        {lastWin > 0 && (
          <Animatable.Text 
            animation="bounceIn" 
            style={styles.win}
          >
            ¡Ganaste: ${lastWin}!
          </Animatable.Text>
        )}
      </View>

      <View style={styles.slotsContainer}>
        {reels.map((symbol, index) => (
          <Animatable.View 
            key={index}
            animation={spinning ? "pulse" : null}
            iterationCount="infinite"
            style={styles.reel}
          >
            <Text style={styles.symbol}>{symbol}</Text>
          </Animatable.View>
        ))}
      </View>

      <TouchableOpacity 
        style={[styles.spinButton, spinning && styles.spinButtonDisabled]} 
        onPress={spin}
        disabled={spinning}
      >
        <Text style={styles.spinButtonText}>
          {spinning ? '🌀 Girando...' : '🎰 Girar'}
        </Text>
      </TouchableOpacity>

      <View style={styles.betOptions}>
        {[5, 10, 25, 50].map(amount => (
          <TouchableOpacity
            key={amount}
            style={[styles.betButton, bet === amount && styles.betButtonSelected]}
            onPress={() => setBet(amount)}
          >
            <Text style={styles.betButtonText}>${amount}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FF6B6B',
    marginBottom: 20,
  },
  balanceContainer: {
    backgroundColor: '#2a2a2a',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    alignItems: 'center',
  },
  balance: {
    color: '#FF6B6B',
    fontSize: 18,
    fontWeight: 'bold',
  },
  bet: {
    color: 'white',
    fontSize: 16,
  },
  win: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 5,
  },
  slotsContainer: {
    flexDirection: 'row',
    marginBottom: 30,
  },
  reel: {
    width: 80,
    height: 80,
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
    margin: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FF6B6B',
  },
  symbol: {
    fontSize: 30,
  },
  spinButton: {
    backgroundColor: '#FF6B6B',
    padding: 15,
    borderRadius: 10,
    minWidth: 150,
    alignItems: 'center',
    marginBottom: 20,
  },
  spinButtonDisabled: {
    backgroundColor: '#666',
  },
  spinButtonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
  },
  betOptions: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  betButton: {
    backgroundColor: '#333',
    padding: 10,
    margin: 5,
    borderRadius: 5,
    minWidth: 50,
    alignItems: 'center',
  },
  betButtonSelected: {
    backgroundColor: '#FF6B6B',
  },
  betButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});