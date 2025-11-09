// src/games/specialty/CaribbeanStud.js
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function CaribbeanStud({ navigation }) {
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

  const startGame = (betAmount) => {
    if (coins < betAmount) return;
    
    setBet(betAmount);
    setCoins(coins - betAmount);
    
    // Repartir cartas
    const newPlayerCards = [dealCard(), dealCard(), dealCard(), dealCard(), dealCard()];
    const newDealerCards = [dealCard(), dealCard(), dealCard(), dealCard(), dealCard()];
    
    setPlayerCards(newPlayerCards);
    setDealerCards(newDealerCards);
    setGameState('playing');
    setResult('');
  };

  const fold = () => {
    setResult('Te retiras. Pierdes la apuesta');
    setGameState('result');
  };

  const call = () => {
    const dealerQualifies = dealerCards.some(card => card.value === 'A' || card.value === 'K');
    
    if (!dealerQualifies) {
      setCoins(coins + bet);
      setResult('Dealer no califica. Recuperas tu apuesta');
    } else {
      // Evaluar manos (simplificado)
      const playerHasPair = new Set(playerCards.map(c => c.value)).size < 5;
      const dealerHasPair = new Set(dealerCards.map(c => c.value)).size < 5;
      
      if (playerHasPair && !dealerHasPair) {
        const winAmount = bet * 2;
        setCoins(coins + winAmount);
        setResult(`¡Ganas! +${winAmount} coins`);
      } else if (!playerHasPair && dealerHasPair) {
        setResult('Dealer gana con par');
      } else {
        setResult('Empate. Recuperas tu apuesta');
        setCoins(coins + bet);
      }
    }
    
    setGameState('result');
  };

  const resetGame = () => {
    setBet(0);
    setPlayerCards([]);
    setDealerCards([]);
    setGameState('betting');
    setResult('');
  };

  const renderCard = (card, index, hide = false) => (
    <View key={index} style={styles.card}>
      {hide ? (
        <Text style={styles.cardHidden}>🂠</Text>
      ) : (
        <>
          <Text style={styles.cardValue}>{card.value}</Text>
          <Text style={styles.cardSuit}>{card.suit}</Text>
        </>
      )}
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

      <Text style={styles.title}>🏝️ Caribbean Stud</Text>

      {/* Cartas del Dealer */}
      <View style={styles.area}>
        <Text style={styles.areaTitle}>Dealer</Text>
        <View style={styles.cardsContainer}>
          {dealerCards.map((card, index) => 
            renderCard(card, index, gameState === 'playing')
          )}
        </View>
      </View>

      {/* Cartas del Jugador */}
      <View style={styles.area}>
        <Text style={styles.areaTitle}>Tu Mano</Text>
        <View style={styles.cardsContainer}>
          {playerCards.map((card, index) => renderCard(card, index))}
        </View>
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
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#2563EB' }]} onPress={call}>
              <Text style={styles.actionButtonText}>Apostar</Text>
            </TouchableOpacity>
          </View>
        )}

        {gameState === 'result' && (
          <TouchableOpacity style={styles.resetButton} onPress={resetGame}>
            <Text style={styles.resetButtonText}>Jugar Otra Vez</Text>
          </TouchableOpacity>
        )}
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
    marginVertical: 10,
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
    flexWrap: 'wrap',
  },
  card: {
    width: 60,
    height: 80,
    backgroundColor: '#FFF',
    borderRadius: 8,
    margin: 5,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  cardValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  cardSuit: {
    fontSize: 20,
  },
  cardHidden: {
    fontSize: 30,
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
});