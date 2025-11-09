// src/games/specialty/ThreeCardPoker.js
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ThreeCardPoker({ navigation }) {
  const [coins, setCoins] = useState(1000);
  const [bet, setBet] = useState(0);
  const [playerCards, setPlayerCards] = useState([]);
  const [dealerCards, setDealerCards] = useState([]);
  const [gameState, setGameState] = useState('betting');
  const [result, setResult] = useState('');

  const cardValues = {
    'A': 14, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, 
    '10': 10, 'J': 11, 'Q': 12, 'K': 13
  };

  const suits = ['♠️', '♥️', '♦️', '♣️'];

  const dealCard = () => {
    const values = Object.keys(cardValues);
    const value = values[Math.floor(Math.random() * values.length)];
    const suit = suits[Math.floor(Math.random() * suits.length)];
    return { value, suit, numeric: cardValues[value] };
  };

  const evaluateHand = (cards) => {
    const values = cards.map(c => c.numeric).sort((a, b) => a - b);
    const suits = cards.map(c => c.suit);
    
    // Escalera de color
    if (new Set(suits).size === 1 && values[2] - values[0] === 2) {
      return { rank: 6, name: 'Escalera de Color' };
    }
    // Trío
    if (new Set(values).size === 1) {
      return { rank: 5, name: 'Trío' };
    }
    // Escalera
    if (values[2] - values[0] === 2) {
      return { rank: 4, name: 'Escalera' };
    }
    // Color
    if (new Set(suits).size === 1) {
      return { rank: 3, name: 'Color' };
    }
    // Par
    if (new Set(values).size === 2) {
      return { rank: 2, name: 'Par' };
    }
    // Carta alta
    return { rank: 1, name: 'Carta Alta' };
  };

  const startGame = (betAmount) => {
    if (coins < betAmount) return;
    
    setBet(betAmount);
    setCoins(coins - betAmount);
    
    // Repartir cartas
    const newPlayerCards = [dealCard(), dealCard(), dealCard()];
    const newDealerCards = [dealCard(), dealCard(), dealCard()];
    
    setPlayerCards(newPlayerCards);
    setDealerCards(newDealerCards);
    setGameState('playing');
    setResult('');
  };

  const play = () => {
    const playerHand = evaluateHand(playerCards);
    const dealerHand = evaluateHand(dealerCards);
    
    let winAmount = 0;
    
    // El dealer debe tener Queen-high o mejor para calificar
    const dealerQualifies = dealerHand.rank >= 2 || 
      dealerCards.some(card => card.numeric >= 12); // Q, K, A
    
    if (!dealerQualifies) {
      winAmount = bet;
      setResult('Dealer no califica. Recibes ' + winAmount + ' coins');
    } else if (playerHand.rank > dealerHand.rank) {
      winAmount = bet * 2;
      setResult(`¡Ganas! ${playerHand.name} vs ${dealerHand.name} +${winAmount} coins`);
    } else if (playerHand.rank < dealerHand.rank) {
      setResult(`Pierdes. ${playerHand.name} vs ${dealerHand.name}`);
    } else {
      // Desempate por carta alta
      const playerHigh = Math.max(...playerCards.map(c => c.numeric));
      const dealerHigh = Math.max(...dealerCards.map(c => c.numeric));
      
      if (playerHigh > dealerHigh) {
        winAmount = bet * 2;
        setResult(`¡Ganas! Carta alta +${winAmount} coins`);
      } else if (playerHigh < dealerHigh) {
        setResult('Pierdes. Carta alta del dealer');
      } else {
        winAmount = bet;
        setResult('Empate. Recuperas tu apuesta');
      }
    }

    if (winAmount > 0) {
      setCoins(coins + winAmount);
    }

    setGameState('result');
  };

  const fold = () => {
    setResult('Te retiras. Pierdes la apuesta');
    setGameState('result');
  };

  const resetGame = () => {
    setBet(0);
    setPlayerCards([]);
    setDealerCards([]);
    setGameState('betting');
    setResult('');
  };

  const renderCard = (card, index) => (
    <View key={index} style={styles.card}>
      <Text style={styles.cardValue}>{card.value}</Text>
      <Text style={styles.cardSuit}>{card.suit}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFD700" />
        </TouchableOpacity>
        <Text style={styles.coins}>💰 {coins} coins</Text>
      </View>

      <Text style={styles.title}>🎴 Three Card Poker</Text>

      {/* Cartas del Dealer */}
      {dealerCards.length > 0 && (
        <View style={styles.area}>
          <Text style={styles.areaTitle}>Dealer</Text>
          <View style={styles.cardsContainer}>
            {dealerCards.map((card, index) => renderCard(card, index))}
          </View>
          {gameState === 'playing' && (
            <Text style={styles.handInfo}>
              {evaluateHand(dealerCards).name}
            </Text>
          )}
        </View>
      )}

      {/* Cartas del Jugador */}
      {playerCards.length > 0 && (
        <View style={styles.area}>
          <Text style={styles.areaTitle}>Tu Mano</Text>
          <View style={styles.cardsContainer}>
            {playerCards.map((card, index) => renderCard(card, index))}
          </View>
          <Text style={styles.handInfo}>
            {evaluateHand(playerCards).name}
          </Text>
        </View>
      )}

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
                  onPress={() => startGame(amount)}
                  disabled={coins < amount}
                >
                  <Text style={styles.betButtonText}>{amount}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {gameState === 'playing' && (
          <View style={styles.gameButtons}>
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#DC2626' }]} onPress={fold}>
              <Text style={styles.actionButtonText}>Retirarse</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#2563EB' }]} onPress={play}>
              <Text style={styles.actionButtonText}>Jugar</Text>
            </TouchableOpacity>
          </View>
        )}

        {gameState === 'result' && (
          <TouchableOpacity style={styles.resetButton} onPress={resetGame}>
            <Text style={styles.resetButtonText}>Jugar Otra Vez</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Tabla de pagos */}
      <View style={styles.payouts}>
        <Text style={styles.payoutsTitle}>Jerarquía de Manos:</Text>
        <Text style={styles.payout}>1. Escalera de Color</Text>
        <Text style={styles.payout}>2. Trío</Text>
        <Text style={styles.payout}>3. Escalera</Text>
        <Text style={styles.payout}>4. Color</Text>
        <Text style={styles.payout}>5. Par</Text>
        <Text style={styles.payout}>6. Carta Alta</Text>
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
  area: {
    alignItems: 'center',
    marginVertical: 15,
  },
  areaTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  cardsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  card: {
    width: 70,
    height: 100,
    backgroundColor: '#FFF',
    borderRadius: 8,
    margin: 5,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  cardValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  cardSuit: {
    fontSize: 24,
  },
  handInfo: {
    color: '#FFD700',
    fontSize: 16,
    marginTop: 10,
    fontWeight: 'bold',
  },
  result: {
    color: '#FFD700',
    fontSize: 18,
    textAlign: 'center',
    marginVertical: 20,
    fontWeight: 'bold',
  },
  controls: {
    marginTop: 20,
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
  gameButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  actionButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  resetButton: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    alignSelf: 'center',
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
    marginTop: 20,
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
    marginBottom: 3,
  },
});