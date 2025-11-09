// src/games/table/Lottery.js
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function Lottery({ navigation }) {
  const [coins, setCoins] = useState(1000);
  const [bet, setBet] = useState(0);
  const [selectedNumbers, setSelectedNumbers] = useState([]);
  const [winningNumbers, setWinningNumbers] = useState([]);
  const [gameState, setGameState] = useState('selecting');
  const [result, setResult] = useState('');

  const numbers = Array.from({ length: 49 }, (_, i) => i + 1);

  const toggleNumber = (number) => {
    if (gameState !== 'selecting') return;
    
    const newSelected = [...selectedNumbers];
    const index = newSelected.indexOf(number);
    
    if (index > -1) {
      newSelected.splice(index, 1);
    } else if (newSelected.length < 6) {
      newSelected.push(number);
    }
    
    setSelectedNumbers(newSelected);
  };

  const playLottery = (amount) => {
    if (coins < amount || selectedNumbers.length !== 6) return;
    
    setBet(amount);
    setCoins(coins - amount);
    setGameState('drawing');
    
    // Generar números ganadores
    const newWinningNumbers = [];
    while (newWinningNumbers.length < 6) {
      const num = Math.floor(Math.random() * 49) + 1;
      if (!newWinningNumbers.includes(num)) {
        newWinningNumbers.push(num);
      }
    }
    
    setWinningNumbers(newWinningNumbers);
    
    // Calcular aciertos
    const matches = selectedNumbers.filter(num => newWinningNumbers.includes(num)).length;
    const winAmount = calculateWin(matches, amount);
    
    if (winAmount > 0) {
      setCoins(coins + winAmount);
      setResult(`¡${matches} aciertos! Ganas ${winAmount} coins 🎉`);
    } else {
      setResult(`${matches} aciertos. Sigue intentando!`);
    }
    
    setGameState('result');
  };

  const calculateWin = (matches, betAmount) => {
    const payoutTable = {
      3: 2,    // 3 aciertos = x2
      4: 10,   // 4 aciertos = x10
      5: 50,   // 5 aciertos = x50
      6: 1000  // 6 aciertos = JACKPOT x1000
    };
    return betAmount * (payoutTable[matches] || 0);
  };

  const quickPick = () => {
    const newNumbers = [];
    while (newNumbers.length < 6) {
      const num = Math.floor(Math.random() * 49) + 1;
      if (!newNumbers.includes(num)) {
        newNumbers.push(num);
      }
    }
    setSelectedNumbers(newNumbers.sort((a, b) => a - b));
  };

  const resetGame = () => {
    setSelectedNumbers([]);
    setWinningNumbers([]);
    setBet(0);
    setGameState('selecting');
    setResult('');
  };

  const renderNumber = (number) => {
    const isSelected = selectedNumbers.includes(number);
    const isWinning = winningNumbers.includes(number);
    const isMatch = isSelected && isWinning;
    
    return (
      <TouchableOpacity
        key={number}
        style={[
          styles.number,
          isSelected && styles.selectedNumber,
          isWinning && styles.winningNumber,
          isMatch && styles.matchedNumber
        ]}
        onPress={() => toggleNumber(number)}
        disabled={gameState !== 'selecting'}
      >
        <Text style={[
          styles.numberText,
          (isSelected || isWinning) && styles.numberTextSelected
        ]}>
          {number}
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

      <Text style={styles.title}>🎫 Lottery</Text>

      <Text style={styles.instructions}>
        Selecciona 6 números (1-49)
      </Text>

      <Text style={styles.selectedCount}>
        Seleccionados: {selectedNumbers.length}/6
      </Text>

      {/* Números seleccionados */}
      {selectedNumbers.length > 0 && (
        <View style={styles.selectedContainer}>
          <Text style={styles.selectedTitle}>Tus números:</Text>
          <View style={styles.selectedNumbers}>
            {selectedNumbers.map(num => (
              <Text key={num} style={styles.selectedNumberText}>{num}</Text>
            ))}
          </View>
        </View>
      )}

      {/* Números ganadores */}
      {winningNumbers.length > 0 && (
        <View style={styles.winningContainer}>
          <Text style={styles.winningTitle}>Números ganadores:</Text>
          <View style={styles.winningNumbers}>
            {winningNumbers.map(num => (
              <Text key={num} style={styles.winningNumberText}>{num}</Text>
            ))}
          </View>
        </View>
      )}

      {/* Tablero de números */}
      <View style={styles.numbersGrid}>
        {numbers.map(number => renderNumber(number))}
      </View>

      {result ? <Text style={styles.result}>{result}</Text> : null}

      {/* Controles */}
      <View style={styles.controls}>
        {gameState === 'selecting' && (
          <View style={styles.betContainer}>
            <TouchableOpacity style={styles.quickPickButton} onPress={quickPick}>
              <Text style={styles.quickPickText}>Selección Rápida</Text>
            </TouchableOpacity>
            
            <Text style={styles.betTitle}>Selecciona apuesta:</Text>
            <View style={styles.betButtons}>
              {[10, 25, 50, 100].map(amount => (
                <TouchableOpacity
                  key={amount}
                  style={[styles.betButton, coins < amount && styles.disabledButton]}
                  onPress={() => playLottery(amount)}
                  disabled={coins < amount || selectedNumbers.length !== 6}
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
        <Text style={styles.payout}>3 aciertos = x2</Text>
        <Text style={styles.payout}>4 aciertos = x10</Text>
        <Text style={styles.payout}>5 aciertos = x50</Text>
        <Text style={styles.payout}>6 aciertos = JACKPOT x1000</Text>
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
  selectedContainer: {
    marginBottom: 15,
  },
  selectedTitle: {
    color: '#FFF',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  selectedNumbers: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  selectedNumberText: {
    color: '#FFD700',
    fontWeight: 'bold',
    marginRight: 10,
    fontSize: 16,
  },
  winningContainer: {
    marginBottom: 15,
  },
  winningTitle: {
    color: '#10B981',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  winningNumbers: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  winningNumberText: {
    color: '#10B981',
    fontWeight: 'bold',
    marginRight: 10,
    fontSize: 16,
  },
  numbersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 20,
  },
  number: {
    width: 40,
    height: 40,
    backgroundColor: '#333',
    margin: 2,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
  },
  selectedNumber: {
    backgroundColor: '#2563EB',
  },
  winningNumber: {
    backgroundColor: '#666',
  },
  matchedNumber: {
    backgroundColor: '#10B981',
  },
  numberText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  numberTextSelected: {
    color: '#FFF',
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
  quickPickButton: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 15,
  },
  quickPickText: {
    color: '#FFF',
    fontWeight: 'bold',
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
  payout: {
    color: '#FFF',
    fontSize: 14,
    marginBottom: 5,
  },
});