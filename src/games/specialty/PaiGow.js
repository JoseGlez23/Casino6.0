// src/games/specialty/PaiGow.js
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function PaiGow({ navigation }) {
  const [coins, setCoins] = useState(1000);
  const [bet, setBet] = useState(0);
  const [cards, setCards] = useState([]);
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

  const startGame = (betAmount) => {
    if (coins < betAmount) return;
    
    setBet(betAmount);
    setCoins(coins - betAmount);
    
    // Repartir 7 cartas
    const newCards = [];
    for (let i = 0; i < 7; i++) {
      newCards.push(dealCard());
    }
    
    setCards(newCards);
    setGameState('arranging');
    setResult('');
  };

  const arrangeCards = (hand5, hand2) => {
    // Evaluación simplificada
    const hasPair5 = new Set(hand5.map(c => c.value)).size < 5;
    const hasPair2 = new Set(hand2.map(c => c.value)).size < 2;
    
    if (hasPair5 || hasPair2) {
      const winAmount = bet;
      setCoins(coins + winAmount);
      setResult(`¡Mano válida! +${winAmount} coins`);
    } else {
      setResult('Mano no válida. Sin premio');
    }
    
    setGameState('result');
  };

  const resetGame = () => {
    setBet(0);
    setCards([]);
    setGameState('betting');
    setResult('');
  };

  const autoArrange = () => {
    // Ordenamiento automático simple
    const sortedCards = [...cards].sort((a, b) => a.numeric - b.numeric);
    const hand5 = sortedCards.slice(0, 5);
    const hand2 = sortedCards.slice(5, 7);
    arrangeCards(hand5, hand2);
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

      <Text style={styles.title}>🎴 Pai Gow Poker</Text>

      {/* Cartas */}
      {cards.length > 0 && (
        <View style={styles.cardsArea}>
          <Text style={styles.areaTitle}>Tus 7 Cartas:</Text>
          <View style={styles.cardsContainer}>
            {cards.map((card, index) => renderCard(card, index))}
          </View>
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

        {gameState === 'arranging' && (
          <View style={styles.arrangeContainer}>
            <Text style={styles.arrangeTitle}>Organiza tus cartas en 2 manos:</Text>
            <Text style={styles.arrangeSubtitle}>Mano de 5 y mano de 2 cartas</Text>
            <TouchableOpacity style={styles.autoButton} onPress={autoArrange}>
              <Text style={styles.autoButtonText}>Organizar Automáticamente</Text>
            </TouchableOpacity>
          </View>
        )}

        {gameState === 'result' && (
          <TouchableOpacity style={styles.resetButton} onPress={resetGame}>
            <Text style={styles.resetButtonText}>Jugar Otra Vez</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Reglas */}
      <View style={styles.rules}>
        <Text style={styles.rulesTitle}>Reglas del Pai Gow:</Text>
        <Text style={styles.rule}>• Recibes 7 cartas</Text>
        <Text style={styles.rule}>• Separa en mano de 5 y mano de 2</Text>
        <Text style={styles.rule}>• Ambas manos deben tener al menos un par</Text>
        <Text style={styles.rule}>• Ganas si ambas manos son válidas</Text>
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
  cardsArea: {
    alignItems: 'center',
    marginBottom: 20,
  },
  areaTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  cardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  card: {
    width: 50,
    height: 70,
    backgroundColor: '#FFF',
    borderRadius: 6,
    margin: 3,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  cardValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  cardSuit: {
    fontSize: 18,
  },
  result: {
    color: '#FFD700',
    fontSize: 18,
    textAlign: 'center',
    marginVertical: 20,
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
  arrangeContainer: {
    alignItems: 'center',
  },
  arrangeTitle: {
    color: '#FFF',
    fontSize: 16,
    marginBottom: 10,
    textAlign: 'center',
  },
  arrangeSubtitle: {
    color: '#CCC',
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
  },
  autoButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 20,
  },
  autoButtonText: {
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
  rules: {
    backgroundColor: '#1a1a1a',
    padding: 15,
    borderRadius: 10,
  },
  rulesTitle: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  rule: {
    color: '#FFF',
    fontSize: 14,
    marginBottom: 5,
  },
});