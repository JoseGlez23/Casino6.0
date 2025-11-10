// src/games/table/Bingo.js
import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  FlatList,
  Animated,
  Vibration
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCoins } from '../../context/CoinsContext';
import { useSounds } from '../../hooks/useSounds';

export default function Bingo({ navigation }) {
  const { 
    manekiCoins, 
    tickets, 
    subtractCoins, 
    addCoins, 
    addTickets,
    canAfford 
  } = useCoins();
  
  const { playSound } = useSounds();
  const [bet, setBet] = useState(0);
  const [card, setCard] = useState([]);
  const [calledNumbers, setCalledNumbers] = useState([]);
  const [currentNumber, setCurrentNumber] = useState(null);
  const [gameState, setGameState] = useState('betting');
  const [markedNumbers, setMarkedNumbers] = useState([]);
  const [winAmount, setWinAmount] = useState(0);
  const [ticketsWon, setTicketsWon] = useState(0);
  
  // Animaciones
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Función para calcular tickets ganados
  const getTicketRewards = (betAmount, gameType = 'bingo') => {
    const baseTickets = Math.floor(betAmount * 0.1); // 10% de la apuesta
    const multiplier = gameType === 'bingo' ? 2 : 1; // Bingo da más tickets
    return Math.max(1, baseTickets * multiplier);
  };

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const stopPulseAnimation = () => {
    pulseAnim.stopAnimation();
    pulseAnim.setValue(1);
  };

  const generateCard = () => {
    const newCard = [];
    for (let i = 0; i < 25; i++) {
      if (i === 12) { // Centro libre
        newCard.push({ number: 'FREE', called: true, marked: true });
      } else {
        const min = Math.floor(i / 5) * 15 + 1;
        const max = min + 14;
        newCard.push({ 
          number: Math.floor(Math.random() * (max - min + 1)) + min,
          called: false,
          marked: false
        });
      }
    }
    return newCard;
  };

  const placeBet = async (amount) => {
    if (!canAfford(amount)) {
      playSound('error');
      Vibration.vibrate(100);
      return;
    }

    try {
      playSound('coin');
      await subtractCoins(amount, 'Apuesta en Bingo');
      setBet(amount);
      const newCard = generateCard();
      setCard(newCard);
      setGameState('playing');
      setCalledNumbers([]);
      setMarkedNumbers([12]); // El centro libre siempre está marcado
      setCurrentNumber(null);
      setWinAmount(0);
      setTicketsWon(0);
    } catch (error) {
      playSound('error');
      Vibration.vibrate(100);
    }
  };

  const callNumber = async () => {
    if (calledNumbers.length >= 75) {
      playSound('error');
      return;
    }

    playSound('click');
    
    let newNumber;
    do {
      newNumber = Math.floor(Math.random() * 75) + 1;
    } while (calledNumbers.includes(newNumber));

    const updatedCalledNumbers = [...calledNumbers, newNumber];
    setCalledNumbers(updatedCalledNumbers);
    setCurrentNumber(newNumber);

    // Animación del número actual
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.2,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // Verificar si el número está en la tarjeta y marcarlo
    const updatedCard = card.map(cell => {
      if (cell.number === newNumber) {
        return { ...cell, called: true, marked: true };
      }
      return cell;
    });
    
    setCard(updatedCard);

    // Actualizar números marcados
    const newMarkedNumbers = updatedCard
      .filter(cell => cell.marked)
      .map(cell => typeof cell.number === 'number' ? cell.number : 'FREE');
    setMarkedNumbers(newMarkedNumbers);

    // Verificar si hay bingo
    checkBingo(updatedCard);
  };

  const checkBingo = async (currentCard) => {
    const winningPatterns = [
      // Filas
      [0,1,2,3,4], [5,6,7,8,9], [10,11,12,13,14], 
      [15,16,17,18,19], [20,21,22,23,24],
      // Columnas
      [0,5,10,15,20], [1,6,11,16,21], [2,7,12,17,22],
      [3,8,13,18,23], [4,9,14,19,24],
      // Diagonales
      [0,6,12,18,24], [4,8,12,16,20]
    ];

    const hasBingo = winningPatterns.some(pattern => 
      pattern.every(index => currentCard[index].marked)
    );

    if (hasBingo) {
      const calculatedWin = bet * 15; // 15x multiplicador para bingo
      const calculatedTickets = getTicketRewards(bet, 'bingo');
      
      setWinAmount(calculatedWin);
      setTicketsWon(calculatedTickets);
      
      playSound('success');
      Vibration.vibrate([0, 300, 100, 300]);
      startPulseAnimation();

      try {
        await addCoins(calculatedWin, 'Victoria en Bingo');
        await addTickets(calculatedTickets, 'Tickets ganados en Bingo');
      } catch (error) {
        console.error('Error actualizando premios:', error);
      }

      setGameState('ended');
    }
  };

  const resetGame = () => {
    setBet(0);
    setGameState('betting');
    setCurrentNumber(null);
    setWinAmount(0);
    setTicketsWon(0);
    stopPulseAnimation();
  };

  const renderCardCell = ({ item, index }) => (
    <Animated.View style={[
      styles.cell,
      item.number === 'FREE' && styles.freeCell,
      item.marked && styles.markedCell,
      gameState === 'ended' && item.marked && {
        transform: [{ scale: pulseAnim }]
      }
    ]}>
      <Text style={[
        styles.cellText,
        item.number === 'FREE' && styles.freeCellText,
        item.marked && styles.markedCellText
      ]}>
        {item.number}
      </Text>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      {/* Header Mejorado */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#FFD700" />
        </TouchableOpacity>
        
        <Text style={styles.title}>BINGO</Text>
        
        <View style={styles.balanceContainer}>
          <View style={styles.balanceItem}>
            <Text style={styles.balanceLabel}>Monedas:</Text>
            <Text style={styles.balanceValue}>{manekiCoins}</Text>
          </View>
          <View style={styles.balanceItem}>
            <Text style={styles.balanceLabel}>Tickets:</Text>
            <Text style={styles.balanceValue}>{tickets}</Text>
          </View>
        </View>
      </View>

      {/* Número Actual */}
      {currentNumber && (
        <Animated.View 
          style={[
            styles.currentNumber,
            { transform: [{ scale: scaleAnim }] }
          ]}
        >
          <Text style={styles.currentNumberText}>NÚMERO: {currentNumber}</Text>
        </Animated.View>
      )}

      {/* Fase de Apuesta */}
      {gameState === 'betting' && (
        <View style={styles.betContainer}>
          <Text style={styles.betTitle}>SELECCIONA TU APUESTA</Text>
          <View style={styles.betButtons}>
            {[50, 100, 250, 500].map(amount => (
              <TouchableOpacity
                key={amount}
                style={[
                  styles.betButton, 
                  !canAfford(amount) && styles.disabledButton
                ]}
                onPress={() => placeBet(amount)}
                disabled={!canAfford(amount)}
              >
                <Text style={styles.betButtonText}>{amount}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.betInfo}>
            Premio: 15x | Tickets: +{getTicketRewards(100, 'bingo')} por 100 coins
          </Text>
        </View>
      )}

      {/* Fase de Juego */}
      {gameState === 'playing' && (
        <View style={styles.gameArea}>
          <Text style={styles.gameInfo}>
            Números llamados: {calledNumbers.length}/75
          </Text>
          
          <FlatList
            data={card}
            renderItem={renderCardCell}
            keyExtractor={(item, index) => index.toString()}
            numColumns={5}
            style={styles.card}
            scrollEnabled={false}
          />
          
          <View style={styles.gameControls}>
            <TouchableOpacity 
              style={styles.callButton} 
              onPress={callNumber}
            >
              <Text style={styles.callButtonText}>LLAMAR NÚMERO</Text>
            </TouchableOpacity>
            
            <Text style={styles.gameHelp}>
              Toca "LLAMAR NÚMERO" para continuar
            </Text>
          </View>
        </View>
      )}

      {/* Resultados */}
      {gameState === 'ended' && (
        <Animated.View 
          style={[
            styles.resultArea,
            { transform: [{ scale: pulseAnim }] }
          ]}
        >
          <Text style={styles.winTitle}>¡BINGO!</Text>
          <Text style={styles.winAmount}>+{winAmount} MANEKI COINS</Text>
          <Text style={styles.ticketsWon}>+{ticketsWon} TICKETS</Text>
          
          <View style={styles.resultStats}>
            <Text style={styles.statsText}>
              Números llamados: {calledNumbers.length}
            </Text>
            <Text style={styles.statsText}>
              Multiplicador: 15x
            </Text>
          </View>
          
          <TouchableOpacity 
            style={styles.resetButton} 
            onPress={resetGame}
          >
            <Text style={styles.resetButtonText}>JUGAR OTRA VEZ</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F0F',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 5,
  },
  backButton: {
    padding: 8,
  },
  title: {
    color: '#FFD700',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 2,
    flex: 1,
  },
  balanceContainer: {
    alignItems: 'flex-end',
  },
  balanceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  balanceLabel: {
    color: '#9CA3AF',
    fontSize: 12,
    marginRight: 4,
  },
  balanceValue: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: 'bold',
  },
  currentNumber: {
    backgroundColor: '#DC2626',
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFD700',
  },
  currentNumberText: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  betContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  betTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 25,
    letterSpacing: 1,
  },
  betButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 20,
  },
  betButton: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 25,
    paddingVertical: 15,
    borderRadius: 12,
    margin: 8,
    minWidth: 80,
    borderWidth: 2,
    borderColor: '#B45309',
  },
  betButtonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
  disabledButton: {
    backgroundColor: '#374151',
    borderColor: '#6B7280',
  },
  betInfo: {
    color: '#9CA3AF',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
  },
  gameArea: {
    alignItems: 'center',
  },
  gameInfo: {
    color: '#FFF',
    fontSize: 16,
    marginBottom: 15,
    fontWeight: '600',
  },
  card: {
    marginBottom: 25,
    backgroundColor: '#1F2937',
    padding: 10,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#374151',
  },
  cell: {
    width: 55,
    height: 55,
    backgroundColor: '#FFF',
    margin: 2,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  freeCell: {
    backgroundColor: '#FFD700',
    borderColor: '#B45309',
  },
  markedCell: {
    backgroundColor: '#10B981',
    borderColor: '#047857',
  },
  cellText: {
    fontWeight: 'bold',
    fontSize: 12,
    color: '#000',
  },
  freeCellText: {
    color: '#000',
    fontWeight: '900',
  },
  markedCellText: {
    color: '#FFF',
  },
  gameControls: {
    alignItems: 'center',
  },
  callButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 35,
    paddingVertical: 18,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#1D4ED8',
    marginBottom: 15,
  },
  callButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 18,
    letterSpacing: 1,
  },
  gameHelp: {
    color: '#9CA3AF',
    fontSize: 14,
    textAlign: 'center',
  },
  resultArea: {
    alignItems: 'center',
    backgroundColor: '#1F2937',
    padding: 30,
    borderRadius: 20,
    borderWidth: 4,
    borderColor: '#FFD700',
    marginTop: 20,
  },
  winTitle: {
    color: '#FFD700',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
    letterSpacing: 2,
  },
  winAmount: {
    color: '#10B981',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  ticketsWon: {
    color: '#3B82F6',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  resultStats: {
    alignItems: 'center',
    marginBottom: 25,
  },
  statsText: {
    color: '#D1D5DB',
    fontSize: 16,
    marginBottom: 5,
  },
  resetButton: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 35,
    paddingVertical: 16,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#B91C1C',
  },
  resetButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 1,
  },
});