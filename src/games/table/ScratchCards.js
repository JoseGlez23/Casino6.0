// src/games/table/ScratchCards.js
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ScratchCards({ navigation }) {
  const [coins, setCoins] = useState(1000);
  const [bet, setBet] = useState(0);
  const [card, setCard] = useState([]);
  const [scratched, setScratched] = useState([]);
  const [gameState, setGameState] = useState('buying');
  const [result, setResult] = useState('');

  const symbols = ['💰', '💎', '⭐', '🍒', '7️⃣', '🍀', '🎯', '👑'];

  const buyCard = (amount) => {
    if (coins < amount) return;
    
    setBet(amount);
    setCoins(coins - amount);
    
    // Generar tarjeta de rasca y gana
    const newCard = [];
    for (let i = 0; i < 9; i++) {
      newCard.push(symbols[Math.floor(Math.random() * symbols.length)]);
    }
    
    setCard(newCard);
    setScratched([]);
    setGameState('scratching');
    setResult('');
  };

  const scratch = (index) => {
    if (scratched.includes(index) || gameState !== 'scratching') return;
    
    const newScratched = [...scratched, index];
    setScratched(newScratched);
    
    // Verificar si todas las casillas están raspadas
    if (newScratched.length === 3) {
      checkWin(newScratched);
    }
  };

  const checkWin = (scratchedIndices) => {
    const revealedSymbols = scratchedIndices.map(idx => card[idx]);
    const uniqueSymbols = [...new Set(revealedSymbols)];
    
    let winAmount = 0;
    
    if (uniqueSymbols.length === 1) {
      // Tres símbolos iguales
      if (revealedSymbols[0] === '💰') winAmount = bet * 10;
      else if (revealedSymbols[0] === '💎') winAmount = bet * 8;
      else if (revealedSymbols[0] === '7️⃣') winAmount = bet * 6;
      else winAmount = bet * 4;
    } else if (uniqueSymbols.length === 2) {
      // Dos símbolos iguales
      winAmount = bet * 2;
    }
    
    if (winAmount > 0) {
      setCoins(coins + winAmount);
      setResult(`¡Ganas! +${winAmount} coins 🎉`);
    } else {
      setResult('Sin premio esta vez. ¡Sigue intentando!');
    }
    
    setGameState('result');
  };

  const resetGame = () => {
    setBet(0);
    setCard([]);
    setScratched([]);
    setGameState('buying');
    setResult('');
  };

  const revealAll = () => {
    if (gameState !== 'scratching') return;
    
    const allIndices = [0, 1, 2, 3, 4, 5, 6, 7, 8];
    setScratched(allIndices);
    checkWin([0, 1, 2]); // Solo verifica las primeras 3 para premio
  };

  const renderCardCell = (symbol, index) => (
    <TouchableOpacity
      key={index}
      style={styles.cell}
      onPress={() => scratch(index)}
      disabled={scratched.includes(index) || gameState !== 'scratching'}
    >
      {scratched.includes(index) ? (
        <Text style={styles.symbol}>{symbol}</Text>
      ) : (
        <Text style={styles.scratchArea}>🎁</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFD700" />
        </TouchableOpacity>
        <Text style={styles.coins}>💰 {coins} coins</Text>
      </View>

      <Text style={styles.title}>🎫 Scratch Cards</Text>

      {/* Tarjeta de rasca y gana */}
      {card.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Rasca 3 áreas para ganar!</Text>
          <View style={styles.cardGrid}>
            {card.map((symbol, index) => renderCardCell(symbol, index))}
          </View>
          <Text style={styles.cardHint}>
            Raspadas: {scratched.length}/3
          </Text>
        </View>
      )}

      {result ? <Text style={styles.result}>{result}</Text> : null}

      {/* Controles */}
      <View style={styles.controls}>
        {gameState === 'buying' && (
          <View style={styles.buyContainer}>
            <Text style={styles.buyTitle}>Compra una tarjeta:</Text>
            <View style={styles.buyButtons}>
              {[10, 25, 50, 100].map(amount => (
                <TouchableOpacity
                  key={amount}
                  style={[styles.buyButton, coins < amount && styles.disabledButton]}
                  onPress={() => buyCard(amount)}
                  disabled={coins < amount}
                >
                  <Text style={styles.buyButtonText}>{amount} coins</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {gameState === 'scratching' && (
          <View style={styles.scratchControls}>
            <TouchableOpacity style={styles.revealButton} onPress={revealAll}>
              <Text style={styles.revealButtonText}>Revelar Todo</Text>
            </TouchableOpacity>
          </View>
        )}

        {gameState === 'result' && (
          <TouchableOpacity style={styles.resetButton} onPress={resetGame}>
            <Text style={styles.resetButtonText}>Comprar Otra</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Tabla de pagos */}
      <View style={styles.payouts}>
        <Text style={styles.payoutsTitle}>Premios:</Text>
        <Text style={styles.payout}>💰💰💰 = x10</Text>
        <Text style={styles.payout}>💎💎💎 = x8</Text>
        <Text style={styles.payout}>7️⃣7️⃣7️⃣ = x6</Text>
        <Text style={styles.payout}>Cualquier triple = x4</Text>
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
  card: {
    backgroundColor: '#8B0000',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  cardTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 10,
  },
  cell: {
    width: 70,
    height: 70,
    backgroundColor: '#FFD700',
    margin: 5,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    elevation: 5,
  },
  symbol: {
    fontSize: 30,
  },
  scratchArea: {
    fontSize: 25,
    color: '#8B0000',
  },
  cardHint: {
    color: '#FFF',
    fontSize: 14,
    marginTop: 10,
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
    marginBottom: 20,
  },
  buyContainer: {
    alignItems: 'center',
  },
  buyTitle: {
    color: '#FFF',
    fontSize: 18,
    marginBottom: 15,
  },
  buyButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  buyButton: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    margin: 5,
    minWidth: 80,
  },
  buyButtonText: {
    color: '#000',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  disabledButton: {
    backgroundColor: '#666',
  },
  scratchControls: {
    alignItems: 'center',
  },
  revealButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 20,
  },
  revealButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  resetButton: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  resetButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
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