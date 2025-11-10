// src/games/table/Lottery.js
import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  FlatList,
  Animated,
  Vibration,
  Image,
  Modal,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCoins } from '../../context/CoinsContext';
import { useSounds } from '../../hooks/useSounds';

// Componente de animación de victoria
const WinAnimation = ({ show, onClose }) => {
  const [scaleAnim] = useState(new Animated.Value(0));
  const [pulseAnim] = useState(new Animated.Value(1));

  React.useEffect(() => {
    if (show) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }).start();
      
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
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

      const timer = setTimeout(() => {
        onClose();
      }, 3000);

      return () => clearTimeout(timer);
    } else {
      scaleAnim.setValue(0);
      pulseAnim.setValue(1);
    }
  }, [show]);

  if (!show) return null;

  return (
    <Modal
      transparent={true}
      visible={show}
      animationType="fade"
    >
      <View style={styles.modalContainer}>
        <Animated.View 
          style={[
            styles.winAnimation,
            {
              transform: [
                { scale: scaleAnim },
                { scale: pulseAnim }
              ]
            }
          ]}
        >
          <Ionicons name="trophy" size={80} color="#FFD700" />
          <Text style={styles.winAnimationText}>¡JACKPOT!</Text>
        </Animated.View>
      </View>
    </Modal>
  );
};

// Componente de animación de derrota
const LoseAnimation = ({ show, onClose }) => {
  const [scaleAnim] = useState(new Animated.Value(0));
  const [shakeAnim] = useState(new Animated.Value(0));

  React.useEffect(() => {
    if (show) {
      Animated.sequence([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        onClose();
      }, 3000);

      return () => clearTimeout(timer);
    } else {
      scaleAnim.setValue(0);
      shakeAnim.setValue(0);
    }
  }, [show]);

  const shakeInterpolation = shakeAnim.interpolate({
    inputRange: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1],
    outputRange: [0, -10, 10, -10, 10, -10, 10, -10, 10, -10, 0],
  });

  if (!show) return null;

  return (
    <Modal
      transparent={true}
      visible={show}
      animationType="fade"
    >
      <View style={styles.modalContainer}>
        <Animated.View 
          style={[
            styles.loseAnimation,
            {
              transform: [
                { scale: scaleAnim },
                { translateX: shakeInterpolation }
              ]
            }
          ]}
        >
          <Ionicons name="sad-outline" size={80} color="#EF4444" />
          <Text style={styles.loseAnimationText}>¡SIN PREMIO!</Text>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default function Lottery({ navigation }) {
  const { 
    manekiCoins, 
    tickets, 
    subtractCoins, 
    addTickets,
    canAfford 
  } = useCoins();
  
  const { playSound } = useSounds();
  const [bet, setBet] = useState(0);
  const [selectedNumbers, setSelectedNumbers] = useState([]);
  const [winningNumbers, setWinningNumbers] = useState([]);
  const [gameState, setGameState] = useState('selecting');
  const [result, setResult] = useState('');
  const [matches, setMatches] = useState(0);
  const [ticketsWon, setTicketsWon] = useState(0);
  const [showWinAnimation, setShowWinAnimation] = useState(false);
  const [showLoseAnimation, setShowLoseAnimation] = useState(false);

  // Animaciones
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const numbers = Array.from({ length: 49 }, (_, i) => i + 1);

  // Función para calcular tickets ganados - SOLO TICKETS
  const getTicketRewards = (betAmount, matchesCount = 0) => {
    const baseTickets = Math.floor(betAmount * 0.2); // 20% de la apuesta en tickets
    const bonusTickets = matchesCount * 10; // Bonus generoso por aciertos
    return Math.max(1, baseTickets + bonusTickets);
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

  const toggleNumber = (number) => {
    if (gameState !== 'selecting') return;
    
    playSound('click');
    
    const newSelected = [...selectedNumbers];
    const index = newSelected.indexOf(number);
    
    if (index > -1) {
      newSelected.splice(index, 1);
    } else if (newSelected.length < 6) {
      newSelected.push(number);
    }
    
    setSelectedNumbers(newSelected);
  };

  const quickPick = () => {
    playSound('click');
    const newNumbers = [];
    while (newNumbers.length < 6) {
      const num = Math.floor(Math.random() * 49) + 1;
      if (!newNumbers.includes(num)) {
        newNumbers.push(num);
      }
    }
    setSelectedNumbers(newNumbers.sort((a, b) => a - b));
  };

  const playLottery = async (amount) => {
    if (!canAfford(amount)) {
      playSound('error');
      Vibration.vibrate(100);
      return;
    }

    if (selectedNumbers.length !== 6) {
      playSound('error');
      Vibration.vibrate(100);
      return;
    }

    try {
      playSound('coin');
      await subtractCoins(amount, 'Apuesta en Lottery');
      setBet(amount);
      setGameState('drawing');
      setWinningNumbers([]);
      setResult('');
      setMatches(0);
      setTicketsWon(0);
      
      // Simular sorteo con animación
      await drawNumbersWithAnimation(amount);
      
    } catch (error) {
      playSound('error');
      Vibration.vibrate(100);
    }
  };

  const drawNumbersWithAnimation = async (betAmount) => {
    const newWinningNumbers = [];
    while (newWinningNumbers.length < 6) {
      const num = Math.floor(Math.random() * 49) + 1;
      if (!newWinningNumbers.includes(num)) {
        newWinningNumbers.push(num);
        
        // Animación para cada número sorteado
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.2,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }),
        ]).start();

        // Pequeña pausa entre números para efecto visual
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
    
    setWinningNumbers(newWinningNumbers);
    
    // Calcular aciertos - SOLO TICKETS
    const matchesCount = selectedNumbers.filter(num => newWinningNumbers.includes(num)).length;
    const calculatedTickets = getTicketRewards(betAmount, matchesCount);
    
    setMatches(matchesCount);
    setTicketsWon(calculatedTickets);
    
    // Verificar si hay premio (3 o más aciertos para ganar tickets)
    const hasWon = matchesCount >= 3;
    
    if (hasWon) {
      playSound('success');
      Vibration.vibrate([0, 300, 100, 300]);
      startPulseAnimation();
      
      if (matchesCount === 6) {
        setShowWinAnimation(true);
      }
      
      try {
        // SOLO AGREGAR TICKETS
        await addTickets(calculatedTickets, `Victoria en Lottery - ${matchesCount} aciertos`);
      } catch (error) {
        console.error('Error actualizando tickets:', error);
      }
      
      setResult(`¡${matchesCount} ACIERTOS!`);
    } else {
      playSound('error');
      setShowLoseAnimation(true);
      setResult(`${matchesCount} aciertos - Sin premio`);
    }
    
    setGameState('result');
  };

  const resetGame = () => {
    setSelectedNumbers([]);
    setWinningNumbers([]);
    setBet(0);
    setGameState('selecting');
    setResult('');
    setMatches(0);
    setTicketsWon(0);
    stopPulseAnimation();
  };

  const renderNumber = ({ item }) => {
    const isSelected = selectedNumbers.includes(item);
    const isWinning = winningNumbers.includes(item);
    const isMatch = isSelected && isWinning;
    
    return (
      <TouchableOpacity
        style={[
          styles.number,
          isSelected && styles.selectedNumber,
          isWinning && styles.winningNumber,
          isMatch && styles.matchedNumber,
          gameState === 'result' && isMatch && {
            transform: [{ scale: pulseAnim }]
          }
        ]}
        onPress={() => toggleNumber(item)}
        disabled={gameState !== 'selecting'}
      >
        <Text style={[
          styles.numberText,
          (isSelected || isWinning) && styles.numberTextSelected
        ]}>
          {item}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Animaciones */}
      <WinAnimation 
        show={showWinAnimation} 
        onClose={() => setShowWinAnimation(false)} 
      />
      <LoseAnimation 
        show={showLoseAnimation} 
        onClose={() => setShowLoseAnimation(false)} 
      />

      {/* Header Mejorado */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#FFD700" />
        </TouchableOpacity>
        
        <Text style={styles.title}>LOTTERY</Text>
        
        <View style={styles.balanceContainer}>
          <View style={styles.balanceItem}>
            <Image
              source={require('../../assets/dinero.png')}
              style={styles.balanceIcon}
            />
            <Text style={styles.balanceValue}>{manekiCoins}</Text>
          </View>
          <View style={styles.balanceItem}>
            <Image
              source={require('../../assets/TICKET.png')}
              style={styles.balanceIcon}
            />
            <Text style={styles.balanceValue}>{tickets}</Text>
          </View>
        </View>
      </View>

      {/* SCROLLVIEW PRINCIPAL - AHORA TODO ES SCROLLABLE */}
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={true}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.instructions}>
          SELECCIONA 6 NÚMEROS (1-49)
        </Text>

        <Text style={styles.selectedCount}>
          SELECCIONADOS: {selectedNumbers.length}/6
        </Text>

        {/* Números seleccionados */}
        {selectedNumbers.length > 0 && (
          <View style={styles.selectedContainer}>
            <Text style={styles.selectedTitle}>TUS NÚMEROS:</Text>
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
            <Text style={styles.winningTitle}>NÚMEROS GANADORES:</Text>
            <View style={styles.winningNumbers}>
              {winningNumbers.map(num => (
                <Text 
                  key={num} 
                  style={[
                    styles.winningNumberText,
                    selectedNumbers.includes(num) && styles.matchedNumberText
                  ]}
                >
                  {num}
                </Text>
              ))}
            </View>
          </View>
        )}

        {/* Tablero de números - AHORA DENTRO DEL SCROLLVIEW */}
        <View style={styles.numbersContainer}>
          <FlatList
            data={numbers}
            renderItem={renderNumber}
            keyExtractor={(item) => item.toString()}
            numColumns={7}
            scrollEnabled={false} // No necesita scroll interno porque está en ScrollView
            contentContainerStyle={styles.numbersGrid}
          />
        </View>

        {/* Resultados */}
        {gameState === 'result' && (
          <Animated.View 
            style={[
              styles.resultContainer,
              ticketsWon > 0 && { transform: [{ scale: pulseAnim }] }
            ]}
          >
            <Text style={styles.result}>{result}</Text>
            {ticketsWon > 0 && (
              <>
                <Text style={styles.ticketsWon}>+{ticketsWon} TICKETS</Text>
                <Text style={styles.ticketsInfo}>¡Solo ganas tickets!</Text>
              </>
            )}
            {ticketsWon === 0 && (
              <Text style={styles.noWinText}>Pierdes: {bet} Maneki Coins</Text>
            )}
          </Animated.View>
        )}

        {/* Controles */}
        <View style={styles.controls}>
          {gameState === 'selecting' && (
            <View style={styles.betContainer}>
              <TouchableOpacity 
                style={styles.quickPickButton} 
                onPress={quickPick}
              >
                <Text style={styles.quickPickText}>SELECCIÓN RÁPIDA</Text>
              </TouchableOpacity>
              
              <Text style={styles.betTitle}>SELECCIONA APUESTA</Text>
              <View style={styles.betButtons}>
                {[50, 100, 250, 500].map(amount => (
                  <TouchableOpacity
                    key={amount}
                    style={[
                      styles.betButton, 
                      (!canAfford(amount) || selectedNumbers.length !== 6) && styles.disabledButton
                    ]}
                    onPress={() => playLottery(amount)}
                    disabled={!canAfford(amount) || selectedNumbers.length !== 6}
                  >
                    <Text style={styles.betButtonText}>{amount}</Text>
                    <Text style={styles.ticketRewardText}>
                      +{getTicketRewards(amount, 3)} tickets
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.betInfo}>
                GANAS SOLO TICKETS - Mínimo 3 aciertos para premio
              </Text>
            </View>
          )}

          {gameState === 'result' && (
            <TouchableOpacity style={styles.resetButton} onPress={resetGame}>
              <Text style={styles.resetButtonText}>JUGAR OTRA VEZ</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Tabla de pagos ACTUALIZADA - SOLO TICKETS */}
        <View style={styles.payouts}>
          <Text style={styles.payoutsTitle}>TABLA DE PREMIOS (SOLO TICKETS):</Text>
          <View style={styles.payoutGrid}>
            <View style={styles.payoutColumn}>
              <Text style={styles.payoutHeader}>Aciertos</Text>
              <Text style={styles.payoutValue}>3</Text>
              <Text style={styles.payoutValue}>4</Text>
              <Text style={styles.payoutValue}>5</Text>
              <Text style={styles.payoutValue}>6</Text>
            </View>
            <View style={styles.payoutColumn}>
              <Text style={styles.payoutHeader}>Tickets</Text>
              <Text style={styles.payoutValue}>+{getTicketRewards(100, 3)}</Text>
              <Text style={styles.payoutValue}>+{getTicketRewards(100, 4)}</Text>
              <Text style={styles.payoutValue}>+{getTicketRewards(100, 5)}</Text>
              <Text style={styles.payoutValue}>+{getTicketRewards(100, 6)}</Text>
            </View>
          </View>
          <Text style={styles.payoutNote}>
            * Por cada 100 Maneki Coins de apuesta
          </Text>
          <Text style={styles.jackpotNote}>
            ¡6 ACIERTOS = JACKPOT DE TICKETS!
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F0F',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 20,
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
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 4,
  },
  balanceIcon: {
    width: 16,
    height: 16,
    resizeMode: 'contain',
    marginRight: 4,
  },
  balanceValue: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: 'bold',
  },
  instructions: {
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 10,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  selectedCount: {
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: 15,
    fontWeight: 'bold',
    fontSize: 14,
  },
  selectedContainer: {
    marginBottom: 15,
    backgroundColor: '#1F2937',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#374151',
  },
  selectedTitle: {
    color: '#FFD700',
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    fontSize: 14,
  },
  selectedNumbers: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  selectedNumberText: {
    color: '#2563EB',
    fontWeight: 'bold',
    marginRight: 12,
    marginBottom: 5,
    fontSize: 16,
  },
  winningContainer: {
    marginBottom: 15,
    backgroundColor: '#1F2937',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#374151',
  },
  winningTitle: {
    color: '#10B981',
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    fontSize: 14,
  },
  winningNumbers: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  winningNumberText: {
    color: '#10B981',
    fontWeight: 'bold',
    marginRight: 12,
    marginBottom: 5,
    fontSize: 16,
  },
  matchedNumberText: {
    color: '#FFD700',
    fontWeight: 'bold',
  },
  numbersContainer: {
    marginBottom: 20,
  },
  numbersGrid: {
    paddingBottom: 10,
  },
  number: {
    width: 40,
    height: 40,
    backgroundColor: '#333',
    margin: 2,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4B5563',
  },
  selectedNumber: {
    backgroundColor: '#2563EB',
    borderColor: '#1D4ED8',
  },
  winningNumber: {
    backgroundColor: '#6B7280',
    borderColor: '#9CA3AF',
  },
  matchedNumber: {
    backgroundColor: '#10B981',
    borderColor: '#047857',
  },
  numberText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  numberTextSelected: {
    color: '#FFF',
  },
  resultContainer: {
    alignItems: 'center',
    backgroundColor: '#1F2937',
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#374151',
  },
  result: {
    color: '#FFD700',
    fontSize: 20,
    textAlign: 'center',
    fontWeight: 'bold',
    marginBottom: 8,
    letterSpacing: 1,
  },
  ticketsWon: {
    color: '#3B82F6',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  ticketsInfo: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: 'bold',
    fontStyle: 'italic',
  },
  noWinText: {
    color: '#EF4444',
    fontSize: 14,
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
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 20,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#6D28D9',
  },
  quickPickText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  betTitle: {
    color: '#FFF',
    fontSize: 16,
    marginBottom: 12,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  betButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 10,
  },
  betButton: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    margin: 6,
    minWidth: 70,
    borderWidth: 2,
    borderColor: '#B45309',
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#374151',
    borderColor: '#6B7280',
  },
  betButtonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 14,
    textAlign: 'center',
  },
  ticketRewardText: {
    color: '#3B82F6',
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 2,
  },
  betInfo: {
    color: '#9CA3AF',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
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
  payouts: {
    backgroundColor: '#1F2937',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#374151',
  },
  payoutsTitle: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  payoutGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  payoutColumn: {
    alignItems: 'center',
  },
  payoutHeader: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  payoutValue: {
    color: '#FFF',
    fontSize: 12,
    marginBottom: 6,
    fontWeight: '600',
  },
  payoutNote: {
    color: '#9CA3AF',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  jackpotNote: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  // Estilos para las animaciones
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  winAnimation: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    padding: 30,
    borderRadius: 20,
    borderWidth: 4,
    borderColor: '#10B981',
  },
  loseAnimation: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 30,
    borderRadius: 20,
    borderWidth: 4,
    borderColor: '#EF4444',
  },
  winAnimationText: {
    color: '#FFD700',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 10,
    textAlign: 'center',
  },
  loseAnimationText: {
    color: '#EF4444',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 10,
    textAlign: 'center',
  },
});