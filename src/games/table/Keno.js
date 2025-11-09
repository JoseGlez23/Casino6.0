// src/games/table/Keno.js
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function Keno({ navigation }) {
  const [coins, setCoins] = useState(1000);
  const [bet, setBet] = useState(0);
  const [selectedNumbers, setSelectedNumbers] = useState([]);
  const [drawnNumbers, setDrawnNumbers] = useState([]);
  const [gameState, setGameState] = useState('selecting');
  const [result, setResult] = useState('');

  const numbers = Array.from({ length: 80 }, (_, i) => i + 1);

  const toggleNumber = (number) => {
    if (gameState !== 'selecting') return;
    
    const newSelected = [...selectedNumbers];
    const index = newSelected.indexOf(number);
    
    if (index > -1) {
      newSelected.splice(index, 1);
    } else if (newSelected.length < 10) {
      newSelected.push(number);
    }
    
    setSelectedNumbers(newSelected);
  };

  const placeBet = (amount) => {
    if (coins < amount || selectedNumbers.length === 0) return;
    
    setBet(amount);
    setCoins(coins - amount);
    setGameState('drawing');
    setDrawnNumbers([]);
    setResult('');
    
    // Dibujar 20 números aleatorios
    const newDrawnNumbers = [];
    while (newDrawnNumbers.length < 20) {
      const num = Math.floor(Math.random() * 80) + 1;
      if (!newDrawnNumbers.includes(num)) {
        newDrawnNumbers.push(num);
      }
    }
    
    setDrawnNumbers(newDrawnNumbers);
    
    // Calcular aciertos y premio
    const matches = selectedNumbers.filter(num => newDrawnNumbers.includes(num)).length;
    const winAmount = calculateWin(matches, amount);
    
    if (winAmount > 0) {
      setCoins(coins + winAmount);
      setResult(`¡${matches} aciertos! Ganas ${winAmount} coins 🎉`);
    } else {
      setResult(`${matches} aciertos. Sin premio esta vez 😢`);
    }
    
    setGameState('result');
  };

  const calculateWin = (matches, betAmount) => {
    const payoutTable = {
      0: 0, 1: 0, 2: 0, 3: 0, 4: 1, 5: 2, 6: 10, 7: 50, 8: 100, 9: 500, 10: 1000
    };
    return betAmount * payoutTable[matches] || 0;
  };

  const resetGame = () => {
    setSelectedNumbers([]);
    setDrawnNumbers([]);
    setBet(0);
    setGameState('selecting');
    setResult('');
  };

  const renderNumber = ({ item }) => {
    const isSelected = selectedNumbers.includes(item);
    const isDrawn = drawnNumbers.includes(item);
    const isMatch = isSelected && isDrawn;
    
    return (
      <TouchableOpacity
        style={[
          styles.number,
          isSelected && styles.selectedNumber,
          isDrawn && styles.drawnNumber,
          isMatch && styles.matchedNumber
        ]}
        onPress={() => toggleNumber(item)}
        disabled={gameState !== 'selecting'}
      >
        <Text style={[
          styles.numberText,
          (isSelected || isDrawn) && styles.numberTextSelected
        ]}>
          {item}
        </Text>
      </TouchableOpacity>
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

      <Text style={styles.title}>🔢 Keno</Text>

      <Text style={styles.instructions}>
        Selecciona hasta 10 números (1-80)
      </Text>

      <Text style={styles.selectedCount}>
        Seleccionados: {selectedNumbers.length}/10
      </Text>

      {/* Tablero de números */}
      <FlatList
        data={numbers}
        renderItem={renderNumber}
        keyExtractor={(item) => item.toString()}
        numColumns={10}
        style={styles.numbersGrid}
        scrollEnabled={false}
      />

      {drawnNumbers.length > 0 && (
        <View style={styles.drawnContainer}>
          <Text style={styles.drawnTitle}>Números sorteados:</Text>
          <View style={styles.drawnNumbers}>
            {drawnNumbers.map((num, index) => (
              <Text key={index} style={styles.drawnNumberText}>
                {num}
              </Text>
            ))}
          </View>
        </View>
      )}

      {result ? <Text style={styles.result}>{result}</Text> : null}

      {/* Controles */}
      <View style={styles.controls}>
        {gameState === 'selecting' && (
          <View style={styles.betContainer}>
            <Text style={styles.betTitle}>Selecciona apuesta:</Text>
            <View style={styles.betButtons}>
              {[10, 25, 50, 100].map(amount => (
                <TouchableOpacity
                  key={amount}
                  style={[styles.betButton, coins < amount && styles.disabledButton]}
                  onPress={() => placeBet(amount)}
                  disabled={coins < amount || selectedNumbers.length === 0}
                >
                  <Text style={styles.betButtonText}>{amount}</Text>
                </TouchableOpacity>
              ))}
            </View>
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
        <Text style={styles.payoutsTitle}>Premios (x apuesta):</Text>
        <View style={styles.payoutRow}>
          <Text style={styles.payout}>4 aciertos = x1</Text>
          <Text style={styles.payout}>5 aciertos = x2</Text>
        </View>
        <View style={styles.payoutRow}>
          <Text style={styles.payout}>6 aciertos = x10</Text>
          <Text style={styles.payout}>7 aciertos = x50</Text>
        </View>
        <View style={styles.payoutRow}>
          <Text style={styles.payout}>8 aciertos = x100</Text>
          <Text style={styles.payout}>9 aciertos = x500</Text>
        </View>
        <Text style={styles.payout}>10 aciertos = x1000</Text>
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
    marginBottom: 10,
  },
  instructions: {
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 10,
  },
  selectedCount: {
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: 15,
    fontWeight: 'bold',
  },
  numbersGrid: {
    marginBottom: 20,
  },
  number: {
    width: 30,
    height: 30,
    backgroundColor: '#333',
    margin: 2,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
  },
  selectedNumber: {
    backgroundColor: '#2563EB',
  },
  drawnNumber: {
    backgroundColor: '#666',
  },
  matchedNumber: {
    backgroundColor: '#10B981',
  },
  numberText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  numberTextSelected: {
    color: '#FFF',
  },
  drawnContainer: {
    marginBottom: 15,
  },
  drawnTitle: {
    color: '#FFD700',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  drawnNumbers: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  drawnNumberText: {
    color: '#FFF',
    marginRight: 8,
    marginBottom: 5,
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
    fontSize: 16,
    marginBottom: 10,
  },
  betButtons: {
    flexDirection: 'row',
  },
  betButton: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 10,
    marginHorizontal: 5,
  },
  disabledButton: {
    backgroundColor: '#666',
  },
  betButtonText: {
    color: '#000',
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
  payoutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  payout: {
    color: '#FFF',
    fontSize: 12,
  },
});