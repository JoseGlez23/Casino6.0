// src/games/table/Bingo.js
import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  FlatList,
  Animated,
  Vibration,
  Dimensions,
  Alert,
  ScrollView,
  SafeAreaView,
  Image,
  BackHandler,
  Modal,
  Easing // AGREGAR ESTE IMPORT
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCoins } from '../../context/CoinsContext';

const { width, height } = Dimensions.get("window");

// Componente de Modal de Bloqueo - MEJORADO como Blackjack
const BlockModal = ({ visible, onClose }) => {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.5));
  const [slideAnim] = useState(new Animated.Value(-100));

  useEffect(() => {
    if (visible) {
      // Animación de entrada
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 120,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 700,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-cierre después de 3 segundos
      const timer = setTimeout(() => {
        // Animación de salida
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 500,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 0.8,
            duration: 500,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 100,
            duration: 500,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: true,
          }),
        ]).start(() => {
          onClose();
        });
      }, 3000);

      return () => clearTimeout(timer);
    } else {
      // Resetear animaciones cuando no es visible
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.5);
      slideAnim.setValue(-100);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlayTransparent}>
        <Animated.View 
          style={[
            styles.blockModalContainerTransparent,
            { 
              transform: [
                { scale: scaleAnim },
                { translateY: slideAnim }
              ],
              opacity: fadeAnim 
            }
          ]}
        >
          <Image 
            source={require("../../assets/notesalgas.png")}
            style={styles.probabilityImageLarge}
            resizeMode="contain"
          />
        </Animated.View>
      </View>
    </Modal>
  );
};

// Componente de animación de victoria
const WinAnimation = ({ show }) => {
  const [scaleAnim] = useState(new Animated.Value(0));
  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    if (show) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1.2,
              duration: 600,
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 600,
              useNativeDriver: true,
            }),
          ])
        ),
      ]).start();
    } else {
      scaleAnim.setValue(0);
      pulseAnim.setValue(1);
    }
  }, [show]);

  if (!show) return null;

  return (
    <Animated.View
      style={[
        styles.animationContainer,
        styles.winAnimation,
        {
          transform: [{ scale: scaleAnim }, { scale: pulseAnim }],
        },
      ]}
    >
      <Ionicons name="trophy" size={60} color="#FFD700" />
      <Text style={styles.winText}>¡BINGO!</Text>
    </Animated.View>
  );
};

// Componente de Suerte Aumentada - Solo imagen (igual que en Blackjack)
const LuckBoostImage = ({ show, winStreak, onHide }) => {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.5));

  useEffect(() => {
    if (show) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 150,
          friction: 5,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        onHide();
      }, 3000);

      return () => clearTimeout(timer);
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.5);
    }
  }, [show]);

  if (!show) return null;

  const getImageSource = () => {
    if (winStreak >= 8) {
      return require("../../assets/suertex50.png");
    } else if (winStreak >= 5) {
      return require("../../assets/suertex20.png");
    } else {
      return require("../../assets/suertex10.png");
    }
  };

  return (
    <Animated.View
      style={[
        styles.luckBoostImageContainer,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <Image 
        source={getImageSource()} 
        style={styles.luckBoostImageLarge}
        resizeMode="contain"
      />
    </Animated.View>
  );
};

// Función para calcular tickets ganados (solo tickets, no coins)
const getTicketRewards = (betAmount) => {
  // 20% de tickets por apuesta
  const baseTickets = Math.floor(betAmount * 0.20);
  return Math.max(10, baseTickets); // Mínimo 10 tickets
};

// Función para verificar si gana (5% de probabilidad) - CORREGIDA
const checkWinProbability = () => {
  const random = Math.random();
  return random <= 0.05; // 5% de probabilidad REAL
};

export default function Bingo({ navigation }) {
  const { 
    manekiCoins, 
    tickets, 
    subtractCoins, 
    addTickets,
    canAfford 
  } = useCoins();
  
  const [bet, setBet] = useState(0);
  const [card, setCard] = useState([]);
  const [calledNumbers, setCalledNumbers] = useState([]);
  const [currentNumber, setCurrentNumber] = useState(null);
  const [gameState, setGameState] = useState('betting');
  const [markedNumbers, setMarkedNumbers] = useState([]);
  const [ticketsWon, setTicketsWon] = useState(0);
  const [showWinAnimation, setShowWinAnimation] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [hasWon, setHasWon] = useState(false);
  
  // Estados para el sistema de rachas
  const [winStreak, setWinStreak] = useState(0);
  const [showLuckBoost, setShowLuckBoost] = useState(false);
  
  // NUEVO: Estado para prevenir múltiples clicks
  const [isLoading, setIsLoading] = useState(false);
  
  // Animaciones
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const messageAnim = useRef(new Animated.Value(0)).current;
  const [pulseAnimState] = useState(new Animated.Value(1));

  const navigationListener = useRef(null);
  const backHandler = useRef(null);

  // Manejar navegación y botón de retroceso
  useEffect(() => {
    backHandler.current = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        if (gameState === 'playing') {
          setShowBlockModal(true);
          return true;
        }
        return false;
      }
    );

    navigationListener.current = navigation.addListener('beforeRemove', (e) => {
      if (gameState === 'playing') {
        e.preventDefault();
        setShowBlockModal(true);
      }
    });

    return () => {
      if (backHandler.current?.remove) backHandler.current.remove();
      if (navigationListener.current) navigationListener.current();
    };
  }, [navigation, gameState]);

  const handleCloseBlockModal = () => {
    setShowBlockModal(false);
  };

  const handleHideLuckBoost = () => {
    setShowLuckBoost(false);
  };

  // Verificar y mostrar boost de suerte basado en racha de VICTORIAS
  const checkAndShowLuckBoost = () => {
    if (winStreak >= 3) {
      setShowLuckBoost(true);
    }
  };

  const triggerWinAnimation = () => {
    setShowWinAnimation(true);
    setTimeout(() => setShowWinAnimation(false), 2500);
  };

  const animateMessage = () => {
    messageAnim.setValue(0);
    Animated.spring(messageAnim, {
      toValue: 1,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const pulseAnimation = () => {
    Animated.sequence([
      Animated.timing(pulseAnimState, {
        toValue: 1.1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnimState, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
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

  // FUNCIÓN CORREGIDA: Generar cartón con números únicos por columna
  const generateCard = () => {
    const newCard = [];
    
    // Para cada columna (B, I, N, G, O)
    for (let col = 0; col < 5; col++) {
      const min = col * 15 + 1;
      const max = min + 14;
      const columnNumbers = [];
      
      // Generar 5 números únicos para esta columna
      for (let row = 0; row < 5; row++) {
        let number;
        do {
          number = Math.floor(Math.random() * (max - min + 1)) + min;
        } while (columnNumbers.includes(number));
        columnNumbers.push(number);
      }
      
      // Ordenar números de la columna
      columnNumbers.sort((a, b) => a - b);
      
      // Asignar a las celdas
      for (let row = 0; row < 5; row++) {
        const index = row * 5 + col;
        if (index === 12) { // Centro libre
          newCard[12] = { number: 'FREE', called: true, marked: true };
        } else {
          newCard[index] = { 
            number: columnNumbers[row],
            called: false,
            marked: false
          };
        }
      }
    }
    
    return newCard;
  };

  // FUNCIÓN MEJORADA: Con protección contra múltiples clicks
  const placeBet = async (amount) => {
    // Prevenir múltiples clicks
    if (isLoading || gameState !== 'betting') {
      return;
    }

    if (!canAfford(amount)) {
      Vibration.vibrate(100);
      return;
    }

    try {
      setIsLoading(true);
      await subtractCoins(amount, 'Apuesta en Bingo');
      setBet(amount);
      const newCard = generateCard();
      setCard(newCard);
      setGameState('playing');
      setCalledNumbers([]);
      setMarkedNumbers([12]); // El centro libre siempre está marcado
      setCurrentNumber(null);
      setTicketsWon(0);
      setHasWon(false);
      setMessage("¡QUE COMIENCE EL BINGO!");
      animateMessage();
    } catch (error) {
      Vibration.vibrate(100);
    } finally {
      // Re-enable button after a short delay
      setTimeout(() => setIsLoading(false), 500);
    }
  };

  const callNumber = async () => {
    // CORREGIDO: Reducido de 75 a 35 números máximos
    if (calledNumbers.length >= 35) {
      setGameState('ended');
      setMessage("¡JUEGO TERMINADO! SIN BINGO");
      animateMessage();
      // Reset racha al perder
      setWinStreak(0);
      return;
    }

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
      .map((cell, index) => cell.marked ? index : -1)
      .filter(index => index !== -1);
    setMarkedNumbers(newMarkedNumbers);

    // CORREGIDO: Verificar si TODAS las celdas están marcadas (BINGO completo)
    const allMarked = updatedCard.every(cell => cell.marked);
    
    if (allMarked) {
      // Solo gana si pasa la probabilidad del 5%
      if (checkWinProbability()) {
        await handleWin();
      } else {
        // Si no pasa la probabilidad, continúa el juego
        if (calledNumbers.length >= 34) { // Último número
          setGameState('ended');
          setMessage("¡CASI! MEJOR SUERTE LA PRÓXIMA");
          animateMessage();
          setWinStreak(0);
        }
      }
    } else if (calledNumbers.length >= 35) {
      // Si llega al final sin completar el cartón
      setGameState('ended');
      setMessage("¡JUEGO TERMINADO! SIN BINGO");
      animateMessage();
      setWinStreak(0);
    }
  };

  // FUNCIÓN SIMPLIFICADA: Solo verifica si TODAS las celdas están marcadas
  const checkBingo = (currentCard) => {
    return currentCard.every(cell => cell.marked);
  };

  const handleWin = async () => {
    const calculatedTickets = getTicketRewards(bet);
    
    setTicketsWon(calculatedTickets);
    setHasWon(true);
    
    Vibration.vibrate([0, 300, 100, 300]);
    startPulseAnimation();

    try {
      await addTickets(calculatedTickets, 'Tickets ganados en Bingo');
    } catch (error) {
      console.error('Error actualizando tickets:', error);
    }

    setGameState('ended');
    setMessage(`¡BINGO COMPLETO! +${calculatedTickets} TICKETS`);
    animateMessage();
    triggerWinAnimation();
    
    // AUMENTAR racha de victorias y verificar boost
    setWinStreak(prev => prev + 1);
    setTimeout(() => {
      checkAndShowLuckBoost();
    }, 1500);
  };

  const resetGame = () => {
    setBet(0);
    setGameState('betting');
    setCurrentNumber(null);
    setTicketsWon(0);
    setHasWon(false);
    setIsLoading(false); // Reset loading state
    setMessage("SELECCIONE SU APUESTA");
    animateMessage();
    stopPulseAnimation();
  };

  const [message, setMessage] = useState("SELECCIONE SU APUESTA");

  const renderCardCell = ({ item, index }) => (
    <Animated.View style={[
      styles.cell,
      item.number === 'FREE' && styles.freeCell,
      item.marked && styles.markedCell,
      gameState === 'ended' && item.marked && hasWon && {
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

  const betAmounts = [50, 100, 250, 500];

  return (
    <SafeAreaView style={styles.safeArea}>
      <WinAnimation show={showWinAnimation} />
      
      <LuckBoostImage 
        show={showLuckBoost} 
        winStreak={winStreak}
        onHide={handleHideLuckBoost}
      />
      
      <BlockModal visible={showBlockModal} onClose={handleCloseBlockModal} />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header Compacto */}
        <View style={styles.header}>
          <View style={styles.balances}>
            <View style={styles.balanceItem}>
              <Image source={require("../../assets/dinero.png")} style={styles.balanceIcon} />
              <Text style={styles.balanceText}>{manekiCoins.toLocaleString()}</Text>
            </View>
            <View style={styles.balanceItem}>
              <Image source={require("../../assets/TICKET.png")} style={styles.balanceIcon} />
              <Text style={styles.balanceText}>{tickets.toLocaleString()}</Text>
            </View>
            {/* Indicador de RACHA DE VICTORIAS */}
            {winStreak > 0 && (
              <View style={styles.streakIndicator}>
                <Ionicons name="trophy" size={14} color="#FFD700" />
                <Text style={styles.streakText}>Racha: {winStreak}</Text>
              </View>
            )}
          </View>

          <View style={styles.emptySpace} />
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

        {/* Mensaje del Juego */}
        <Animated.View style={[styles.messageContainer, { transform: [{ scale: messageAnim }] }]}>
          <Text style={styles.message}>{message}</Text>
          {ticketsWon > 0 && (
            <View style={styles.ticketsWonContainer}>
              <Text style={styles.ticketsWonText}>+{ticketsWon} TICKETS</Text>
            </View>
          )}
        </Animated.View>

        {/* Fase de Apuesta */}
        {gameState === 'betting' && (
          <View style={styles.betContainer}>
            <View style={styles.betAmounts}>
              {betAmounts.map((amount) => (
                <TouchableOpacity
                  key={amount}
                  style={[
                    styles.betAmountButton,
                    (!canAfford(amount) || isLoading) && styles.disabledButton,
                    bet === amount && styles.selectedBet,
                  ]}
                  onPress={() => {
                    if (canAfford(amount) && !isLoading) {
                      setBet(amount);
                      pulseAnimation();
                    }
                  }}
                  disabled={!canAfford(amount) || isLoading}
                >
                  <Text style={styles.betAmountText}>{amount.toLocaleString()}</Text>
                  <Text style={styles.ticketRewardText}>
                    +{getTicketRewards(amount)} TICKETS
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.betActions}>
              <Text style={styles.currentBet}>
                {bet > 0 ? `APUESTA: ${bet.toLocaleString()} MC` : "SELECCIONE MONTO"}
              </Text>
              
              <TouchableOpacity
                style={[
                  styles.actionButton, 
                  styles.startButton, 
                  (bet === 0 || isLoading) && styles.disabledButton
                ]}
                onPress={() => placeBet(bet)}
                disabled={bet === 0 || isLoading}
              >
                <Ionicons name="play" size={18} color="#FFF" />
                <Text style={styles.actionButtonText}>
                  {isLoading ? "CARGANDO..." : "INICIAR JUEGO"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Fase de Juego */}
        {gameState === 'playing' && (
          <View style={styles.gameArea}>
            <Text style={styles.gameInfo}>
              Números llamados: {calledNumbers.length}/35
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
                style={styles.actionButton} 
                onPress={callNumber}
              >
                <Ionicons name="add" size={18} color="#FFF" />
                <Text style={styles.actionButtonText}>LLAMAR NÚMERO</Text>
              </TouchableOpacity>
            
            </View>
          </View>
        )}

        {/* Resultados */}
        {gameState === 'ended' && (
          <View style={styles.endActions}>
            <View style={styles.resultStats}>
              <Text style={styles.statsText}>
                Números llamados: {calledNumbers.length}/35
              </Text>
              <Text style={styles.statsText}>
                Celdas marcadas: {markedNumbers.length}/25
              </Text>
              <Text style={styles.statsText}>
                {hasWon ? '¡FELICIDADES! BINGO COMPLETO' : 'MEJOR SUERTE LA PRÓXIMA'}
              </Text>
              {hasWon && (
                <Text style={styles.winStatsText}>
                  Tickets ganados: +{ticketsWon}
                </Text>
              )}
            </View>
            
            <TouchableOpacity 
              style={[styles.actionButton, styles.playAgainButton]} 
              onPress={resetGame}
            >
              <Ionicons name="refresh" size={18} color="#FFF" />
              <Text style={styles.actionButtonText}>JUGAR DE NUEVO</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0A0A0A",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 15,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  balances: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  balanceItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1A1A",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#333",
    gap: 6,
    minWidth: 80,
  },
  balanceIcon: {
    width: 18,
    height: 18,
    resizeMode: "contain",
  },
  balanceText: {
    color: "#FFD700",
    fontSize: 13,
    fontWeight: "bold",
  },
  streakIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(16, 185, 129, 0.6)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FFD700",
    gap: 4,
  },
  streakText: {
    color: "#FFD700",
    fontSize: 11,
    fontWeight: "bold",
  },
  emptySpace: {
    width: 70,
  },
  probabilityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3B82F6',
    marginBottom: 12,
    gap: 6,
  },
  probabilityText: {
    color: '#3B82F6',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  currentNumber: {
    backgroundColor: '#DC2626',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  currentNumberText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  messageContainer: {
    alignItems: "center",
    marginVertical: 10,
    padding: 10,
    backgroundColor: "rgba(26, 26, 26, 0.95)",
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#FFD700",
    minHeight: 50,
    justifyContent: "center",
  },
  message: {
    color: "#FFD700",
    fontSize: 13,
    fontWeight: "bold",
    textAlign: "center",
  },
  ticketsWonContainer: {
    marginTop: 4,
    backgroundColor: "rgba(16, 185, 129, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#10B981",
  },
  ticketsWonText: {
    color: "#10B981",
    fontSize: 11,
    fontWeight: "bold",
  },
  betContainer: {
    alignItems: "center",
  },
  betAmounts: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    marginBottom: 12,
    gap: 6,
  },
  betAmountButton: {
    backgroundColor: "#2A2A2A",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#444",
    minWidth: 65,
  },
  selectedBet: {
    borderColor: "#FFD700",
    backgroundColor: "rgba(255, 215, 0, 0.15)",
  },
  betAmountText: {
    color: "#FFD700",
    fontSize: 12,
    fontWeight: "bold",
  },
  ticketRewardText: {
    color: "#10B981",
    fontSize: 9,
    marginTop: 2,
    fontWeight: "600",
  },
  betActions: {
    width: "100%",
    alignItems: "center",
    gap: 8,
  },
  currentBet: {
    color: "#FFD700",
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center",
    backgroundColor: "rgba(139, 0, 0, 0.4)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FFD700",
  },
  gameArea: {
    alignItems: "center",
  },
  gameInfo: {
    color: "#FFF",
    fontSize: 14,
    marginBottom: 12,
    fontWeight: "600",
  },
  card: {
    marginBottom: 20,
    backgroundColor: "#1F2937",
    padding: 8,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#374151",
  },
  cell: {
    width: 48,
    height: 48,
    backgroundColor: "#FFF",
    margin: 2,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  freeCell: {
    backgroundColor: "#FFD700",
    borderColor: "#B45309",
  },
  markedCell: {
    backgroundColor: "#10B981",
    borderColor: "#047857",
  },
  cellText: {
    fontWeight: "bold",
    fontSize: 11,
    color: "#000",
  },
  freeCellText: {
    color: "#000",
    fontWeight: "900",
  },
  markedCellText: {
    color: "#FFF",
  },
  gameControls: {
    alignItems: "center",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 2,
    gap: 6,
    justifyContent: "center",
    backgroundColor: "#2563EB",
    borderColor: "#1D4ED8",
  },
  actionButtonText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 11,
  },
  gameHelp: {
    color: "#9CA3AF",
    fontSize: 12,
    textAlign: "center",
    marginTop: 8,
  },
  endActions: {
    alignItems: "center",
    gap: 12,
  },
  resultStats: {
    alignItems: "center",
    backgroundColor: "rgba(26, 26, 26, 0.95)",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#333",
  },
  statsText: {
    color: "#D1D5DB",
    fontSize: 12,
    marginBottom: 4,
  },
  winStatsText: {
    color: "#10B981",
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 4,
  },
  playAgainButton: {
    backgroundColor: "#10B981",
    borderColor: "#059669",
    paddingHorizontal: 20,
  },
  startButton: {
    backgroundColor: "#10B981",
    borderColor: "#059669",
  },
  bottomSpacer: {
    height: 10,
  },
  disabledButton: {
    backgroundColor: "#1A1A1A",
    borderColor: "#333",
    opacity: 0.5,
  },
  animationContainer: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginLeft: -80,
    marginTop: -60,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    padding: 16,
    borderRadius: 12,
    borderWidth: 3,
    width: 160,
    height: 120,
  },
  winAnimation: {
    borderColor: "#FFD700",
  },
  winText: {
    color: "#FFD700",
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 6,
    textAlign: "center",
  },
  // NUEVO: Estilos para el modal transparente (solo imagen) - MEJORADO
  modalOverlayTransparent: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: "center",
    alignItems: "center",
  },
  blockModalContainerTransparent: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: 'transparent',
  },
  probabilityImageLarge: {
    width: width * 0.8,  // 80% del ancho de la pantalla
    height: height * 0.6, // 60% del alto de la pantalla
    maxWidth: 400,       // Máximo ancho
    maxHeight: 400,      // Máximo alto
  },
  // Estilos para el sistema de suerte aumentada
  luckBoostImageContainer: {
    position: "absolute",
    top: "30%",
    left: "10%",
    right: "10%",
    zIndex: 1001,
    alignItems: "center",
    justifyContent: "center",
  },
  luckBoostImageLarge: {
    width: width * 0.7,
    height: height * 0.5,
    maxWidth: 350,
    maxHeight: 300,
  },
});