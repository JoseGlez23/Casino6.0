import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import * as Animatable from 'react-native-animatable';

const symbols = ["7️⃣", "🍀", "💰", "🎯", "⭐", "🔔", "🎰", "💫"];

export default function LuckySevenSlots() {
  const [reels, setReels] = useState(["7️⃣", "7️⃣", "7️⃣"]);
  const [spinning, setSpinning] = useState(false);
  const [balance, setBalance] = useState(1000);
  const [bet, setBet] = useState(10);
  const [lastWin, setLastWin] = useState(0);
  const [jackpot, setJackpot] = useState(5000);

  const spin = async () => {
    if (spinning || balance < bet) return;
    
    setSpinning(true);
    setBalance(prev => prev - bet);
    setLastWin(0);

    // Contribución al jackpot
    setJackpot(prev => prev + bet * 0.1);

    // Animación de giro
    for (let i = 0; i < 4; i++) {
      setTimeout(() => {
        setReels(prev => prev.map(() => symbols[Math.floor(Math.random() * symbols.length)]));
      }, 400 * i);
    }

    // Resultado final
    setTimeout(() => {
      const newReels = [
        symbols[Math.floor(Math.random() * symbols.length)],
        symbols[Math.floor(Math.random() * symbols.length)],
        symbols[Math.floor(Math.random() * symbols.length)]
      ];
      
      setReels(newReels);
      
      const win = calculateWin(newReels);
      if (win > 0) {
        setLastWin(win);
        setBalance(prev => prev + win);
        
        // Si es jackpot, resetear
        if (win === jackpot) {
          setJackpot(5000);
          Alert.alert('🎊 JACKPOT! 🎊', '¡Felicidades! Ganaste el Jackpot!');
        }
      }
      
      setSpinning(false);
    }, 2000);
  };

  const calculateWin = (currentReels) => {
    if (currentReels[0] === "7️⃣" && currentReels[1] === "7️⃣" && currentReels[2] === "7️⃣") {
      return jackpot; // Jackpot
    }
    if (currentReels[0] === "🍀" && currentReels[1] === "🍀" && currentReels[2] === "🍀") {
      return bet * 25;
    }
    if (currentReels[0] === currentReels[1] && currentReels[1] === currentReels[2]) {
      return bet * 12;
    }
    if (currentReels[0] === currentReels[1] || currentReels[1] === currentReels[2]) {
      return bet * 3;
    }
    return 0;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🍀 Lucky 7 Slots</Text>
      
      <View style={styles.balanceContainer}>
        <Text style={styles.balance}>Balance: ${balance}</Text>
        <Text style={styles.bet}>Apuesta: ${bet}</Text>
        <Text style={styles.jackpot}>Jackpot: ${jackpot}</Text>
        {lastWin > 0 && (
          <Animatable.Text 
            animation="tada" 
            style={[styles.win, lastWin === jackpot && styles.jackpotWin]}
          >
            {lastWin === jackpot ? '🎊 JACKPOT! 🎊' : `¡Ganaste: $${lastWin}!`}
          </Animatable.Text>
        )}
      </View>

      <View style={styles.slotsContainer}>
        {reels.map((symbol, index) => (
          <Animatable.View 
            key={index}
            animation={spinning ? "rotate" : null}
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
          {spinning ? '🎡 Girando...' : '🍀 Girar por Suerte'}
        </Text>
      </TouchableOpacity>

      <View style={styles.betOptions}>
        {[10, 25, 50, 100, 200].map(amount => (
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
    color: '#4CAF50',
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
    color: '#4CAF50',
    fontSize: 18,
    fontWeight: 'bold',
  },
  bet: {
    color: 'white',
    fontSize: 16,
  },
  jackpot: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
  },
  win: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 5,
  },
  jackpotWin: {
    color: '#FFD700',
    fontSize: 20,
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
    borderColor: '#4CAF50',
  },
  symbol: {
    fontSize: 30,
  },
  spinButton: {
    backgroundColor: '#4CAF50',
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
    backgroundColor: '#4CAF50',
  },
  betButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});