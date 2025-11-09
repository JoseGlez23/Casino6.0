// src/games/specialty/VideoPoker.js
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const CARD_VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const SUITS = ['♠️', '♥️', '♦️', '♣️'];

export default function VideoPoker({ navigation }) {
  const [coins, setCoins] = useState(1000);
  const [bet, setBet] = useState(0);
  const [cards, setCards] = useState([]);
  const [heldCards, setHeldCards] = useState([]);
  const [gameState, setGameState] = useState('betting');
  const [result, setResult] = useState('');

  const dealCards = (betAmount) => {
    if (coins < betAmount) return;
    
    setBet(betAmount);
    setCoins(coins - betAmount);
    setHeldCards([]);
    
    const newCards = [];
    for (let i = 0; i < 5; i++) {
      const value = CARD_VALUES[Math.floor(Math.random() * CARD_VALUES.length)];
      const suit = SUITS[Math.floor(Math.random() * SUITS.length)];
      newCards.push({ value, suit, held: false });
    }
    
    setCards(newCards);
    setGameState('holding');
    setResult('');
  };

  const toggleHold = (index) => {
    if (gameState !== 'holding') return;
    
    const newHeldCards = [...heldCards];
    if (newHeldCards.includes(index)) {
      const idx = newHeldCards.indexOf(index);
      newHeldCards.splice(idx, 1);
    } else {
      newHeldCards.push(index);
    }
    setHeldCards(newHeldCards);
  };

  const drawCards = () => {
    const newCards = [...cards];
    
    for (let i = 0; i < 5; i++) {
      if (!heldCards.includes(i)) {
        const value = CARD_VALUES[Math.floor(Math.random() * CARD_VALUES.length)];
        const suit = SUITS[Math.floor(Math.random() * SUITS.length)];
        newCards[i] = { value, suit, held: false };
      }
    }
    
    setCards(newCards);
    evaluateHand(newCards);
    setGameState('result');
  };

  const evaluateHand = (hand) => {
    const values = hand.map(card => card.value);
    const suits = hand.map(card => card.suit);
    
    // Lógica simplificada de evaluación
    const uniqueValues = [...new Set(values)];
    const uniqueSuits = [...new Set(suits)];
    
    let winAmount = 0;
    let resultText = '';

    // Escalera Real (mismo palo, A,K,Q,J,10)
    if (uniqueSuits.length === 1 && values.includes('A') && values.includes('K') && 
        values.includes('Q') && values.includes('J') && values.includes('10')) {
      winAmount = bet * 250;
      resultText = '¡ESCALERA REAL! 🏆';
    }
    // Escalera de color
    else if (uniqueSuits.length === 1 && uniqueValues.length === 5) {
      winAmount = bet * 50;
      resultText = '¡ESCALERA DE COLOR! ✨';
    }
    // Póker
    else if (uniqueValues.length === 2) {
      const count = values.filter(v => v === values[0]).length;
      if (count === 1 || count === 4) {
        winAmount = bet * 25;
        resultText = '¡PÓKER! 🎯';
      } else {
        winAmount = bet * 6;
        resultText = '¡FULL HOUSE! 🏠';
      }
    }
    // Color
    else if (uniqueSuits.length === 1) {
      winAmount = bet * 6;
      resultText = '¡COLOR! 🌈';
    }
    // Escalera
    else if (uniqueValues.length === 5) {
      winAmount = bet * 4;
      resultText = '¡ESCALERA! 📈';
    }
    // Trío
    else if (uniqueValues.length === 3) {
      winAmount = bet * 3;
      resultText = '¡TRÍO! 🔥';
    }
    // Doble pareja
    else if (uniqueValues.length === 3) {
      winAmount = bet * 2;
      resultText = '¡DOBLE PAREJA! 👯';
    }
    // Pareja de J, Q, K, A
    else if (uniqueValues.length === 4 && 
             (values.includes('J') || values.includes('Q') || values.includes('K') || values.includes('A'))) {
      winAmount = bet;
      resultText = 'Pareja alta 💪';
    } else {
      resultText = 'Sin premio 😢';
    }

    if (winAmount > 0) {
      setCoins(coins + winAmount);
      setResult(`${resultText} +${winAmount} coins`);
    } else {
      setResult(resultText);
    }
  };

  const resetGame = () => {
    setBet(0);
    setGameState('betting');
    setResult('');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFD700" />
        </TouchableOpacity>
        <Text style={styles.coins}>💰 {coins} coins</Text>
      </View>

      <Text style={styles.title}>🎬 Video Poker</Text>

      {/* Cartas */}
      <View style={styles.cardsContainer}>
        {cards.map((card, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.card, heldCards.includes(index) && styles.heldCard]}
            onPress={() => toggleHold(index)}
            disabled={gameState !== 'holding'}
          >
            <Text style={styles.cardValue}>{card.value}</Text>
            <Text style={styles.cardSuit}>{card.suit}</Text>
            {heldCards.includes(index) && <Text style={styles.holdText}>MANTENER</Text>}
          </TouchableOpacity>
        ))}
      </View>

      {result ? <Text style={styles.result}>{result}</Text> : null}

      {/* Controles */}
      <View style={styles.controls}>
        {gameState === 'betting' && (
          <View style={styles.betContainer}>
            <Text style={styles.betTitle}>Selecciona tu apuesta:</Text>
            <View style={styles.betButtons}>
              {[10, 25, 50, 100].map(amount => (
                <TouchableOpacity
                  key={amount}
                  style={[styles.betButton, coins < amount && styles.disabledButton]}
                  onPress={() => dealCards(amount)}
                  disabled={coins < amount}
                >
                  <Text style={styles.betButtonText}>{amount}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {gameState === 'holding' && (
          <TouchableOpacity style={styles.drawButton} onPress={drawCards}>
            <Text style={styles.drawButtonText}>Dibujar Cartas</Text>
          </TouchableOpacity>
        )}

        {gameState === 'result' && (
          <TouchableOpacity style={styles.resetButton} onPress={resetGame}>
            <Text style={styles.resetButtonText}>Jugar Otra Vez</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Tabla de pagos */}
      <View style={styles.payouts}>
        <Text style={styles.payoutsTitle}>Premios:</Text>
        <Text style={styles.payout}>Escalera Real = x250</Text>
        <Text style={styles.payout}>Escalera Color = x50</Text>
        <Text style={styles.payout}>Póker = x25</Text>
        <Text style={styles.payout}>Full House = x6</Text>
        <Text style={styles.payout}>Color = x6</Text>
        <Text style={styles.payout}>Escalera = x4</Text>
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
  cardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  card: {
    width: 60,
    height: 90,
    backgroundColor: '#FFF',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  heldCard: {
    borderWidth: 3,
    borderColor: '#FFD700',
    backgroundColor: '#E8F4FD',
  },
  cardValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  cardSuit: {
    fontSize: 20,
  },
  holdText: {
    position: 'absolute',
    bottom: 5,
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFD700',
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
  betContainer: {
    alignItems: 'center',
  },
  betTitle: {
    color: '#FFF',
    fontSize: 18,
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
  drawButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  drawButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 18,
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