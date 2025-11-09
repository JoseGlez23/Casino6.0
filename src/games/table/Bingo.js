// src/games/table/Bingo.js
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function Bingo({ navigation }) {
  const [coins, setCoins] = useState(1000);
  const [bet, setBet] = useState(0);
  const [card, setCard] = useState([]);
  const [calledNumbers, setCalledNumbers] = useState([]);
  const [currentNumber, setCurrentNumber] = useState(null);
  const [gameState, setGameState] = useState('betting');
  const [markedNumbers, setMarkedNumbers] = useState([]);

  const generateCard = () => {
    const newCard = [];
    for (let i = 0; i < 25; i++) {
      if (i === 12) { // Centro libre
        newCard.push({ number: 'FREE', called: true });
      } else {
        const min = Math.floor(i / 5) * 15 + 1;
        const max = min + 14;
        newCard.push({ 
          number: Math.floor(Math.random() * (max - min + 1)) + min,
          called: false
        });
      }
    }
    return newCard;
  };

  const placeBet = (amount) => {
    if (coins >= amount) {
      setBet(amount);
      setCoins(coins - amount);
      setCard(generateCard());
      setGameState('playing');
      setCalledNumbers([]);
      setMarkedNumbers([]);
    }
  };

  const callNumber = () => {
    if (calledNumbers.length >= 75) return;

    let newNumber;
    do {
      newNumber = Math.floor(Math.random() * 75) + 1;
    } while (calledNumbers.includes(newNumber));

    setCalledNumbers([...calledNumbers, newNumber]);
    setCurrentNumber(newNumber);

    // Verificar si el número está en la tarjeta
    if (card.some(cell => cell.number === newNumber)) {
      setMarkedNumbers([...markedNumbers, newNumber]);
    }

    // Verificar si hay bingo
    checkBingo();
  };

  const checkBingo = () => {
    // Lógica simplificada para verificar bingo
    const hasBingo = markedNumbers.length >= 5; // Simplificado
    if (hasBingo) {
      const winAmount = bet * 10;
      setCoins(coins + winAmount);
      setGameState('ended');
    }
  };

  const resetGame = () => {
    setBet(0);
    setGameState('betting');
    setCurrentNumber(null);
  };

  const renderCardCell = ({ item, index }) => (
    <View style={[
      styles.cell,
      item.called && styles.freeCell,
      markedNumbers.includes(item.number) && styles.markedCell
    ]}>
      <Text style={styles.cellText}>{item.number}</Text>
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

      <Text style={styles.title}>🅱️ Bingo</Text>

      {currentNumber && (
        <View style={styles.currentNumber}>
          <Text style={styles.currentNumberText}>Número: {currentNumber}</Text>
        </View>
      )}

      {gameState === 'betting' && (
        <View style={styles.betContainer}>
          <Text style={styles.betTitle}>Selecciona tu apuesta:</Text>
          <View style={styles.betButtons}>
            {[10, 25, 50, 100].map(amount => (
              <TouchableOpacity
                key={amount}
                style={[styles.betButton, coins < amount && styles.disabledButton]}
                onPress={() => placeBet(amount)}
                disabled={coins < amount}
              >
                <Text style={styles.betButtonText}>{amount}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {gameState === 'playing' && (
        <View style={styles.gameArea}>
          <FlatList
            data={card}
            renderItem={renderCardCell}
            keyExtractor={(item, index) => index.toString()}
            numColumns={5}
            style={styles.card}
          />
          
          <TouchableOpacity style={styles.callButton} onPress={callNumber}>
            <Text style={styles.callButtonText}>Llamar Número</Text>
          </TouchableOpacity>
        </View>
      )}

      {gameState === 'ended' && (
        <View style={styles.resultArea}>
          <Text style={styles.winText}>¡BINGO! Ganas {bet * 10} coins</Text>
          <TouchableOpacity style={styles.resetButton} onPress={resetGame}>
            <Text style={styles.resetButtonText}>Jugar Otra Vez</Text>
          </TouchableOpacity>
        </View>
      )}
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
    marginBottom: 20,
  },
  currentNumber: {
    backgroundColor: '#2563EB',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    alignItems: 'center',
  },
  currentNumberText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
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
  gameArea: {
    alignItems: 'center',
  },
  card: {
    marginBottom: 20,
  },
  cell: {
    width: 50,
    height: 50,
    backgroundColor: '#FFF',
    margin: 2,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
  },
  freeCell: {
    backgroundColor: '#FFD700',
  },
  markedCell: {
    backgroundColor: '#10B981',
  },
  cellText: {
    fontWeight: 'bold',
  },
  callButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  callButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 18,
  },
  resultArea: {
    alignItems: 'center',
  },
  winText: {
    color: '#FFD700',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
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
});