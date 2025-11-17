// src/games/table/Keno.js
import React, { useState, useRef, useEffect } from "react";
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
  Dimensions,
  SafeAreaView,
  BackHandler,
  Easing
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useCoins } from "../../context/CoinsContext";

const { width, height } = Dimensions.get("window");

// Componente de Modal de Bloqueo - EXACTAMENTE IGUAL QUE BINGO
const BlockModal = ({ visible, onClose }) => {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.5));

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 120,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();

      // Cerrar automáticamente después de 3 segundos
      const timer = setTimeout(() => {
        onClose();
      }, 3000);

      return () => clearTimeout(timer);
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.5);
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
      <TouchableOpacity 
        style={styles.modalOverlay} 
        activeOpacity={1}
        onPress={onClose}
      >
        <Animated.View 
          style={[
            styles.blockModalContainer,
            { 
              transform: [{ scale: scaleAnim }],
              opacity: fadeAnim 
            }
          ]}
        >
          <Image 
            source={require("../../assets/notesalgas.png")}  // IMAGEN AGREGADA
            style={styles.probabilityImageLarge}
            resizeMode="contain"
          />
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
};

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
    <Modal transparent={true} visible={show} animationType="fade">
      <View style={styles.modalContainer}>
        <Animated.View
          style={[
            styles.winAnimation,
            {
              transform: [{ scale: scaleAnim }, { scale: pulseAnim }],
            },
          ]}
        >
          <Ionicons name="trophy" size={80} color="#FFD700" />
          <Text style={styles.winAnimationText}>¡GANASTE!</Text>
        </Animated.View>
      </View>
    </Modal>
  );
};

// Función para verificar si gana (5% de probabilidad)
const checkWinProbability = () => {
  const random = Math.random(); // Número entre 0 y 1
  return random <= 0.05; // 5% de probabilidad
};

export default function Keno({ navigation }) {
  const {
    manekiCoins,
    tickets,
    subtractCoins,
    addTickets,
    canAfford,
  } = useCoins();

  const [bet, setBet] = useState(0);
  const [selectedNumbers, setSelectedNumbers] = useState([]);
  const [drawnNumbers, setDrawnNumbers] = useState([]);
  const [gameState, setGameState] = useState("selecting");
  const [result, setResult] = useState("");
  const [matches, setMatches] = useState(0);
  const [ticketsWon, setTicketsWon] = useState(0);
  const [showWinAnimation, setShowWinAnimation] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [hasWon, setHasWon] = useState(false);
  
  // NUEVO: Estado para prevenir múltiples clicks
  const [isLoading, setIsLoading] = useState(false);

  // Animaciones
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const messageAnim = useRef(new Animated.Value(0)).current;

  const navigationListener = useRef(null);
  const backHandler = useRef(null);

  // Manejar navegación y botón de retroceso
  useEffect(() => {
    const handleBackPress = () => {
      if (gameState === "drawing") {
        setShowBlockModal(true);
        return true;
      }
      return false;
    };

    backHandler.current = BackHandler.addEventListener(
      'hardwareBackPress',
      handleBackPress
    );

    navigationListener.current = navigation.addListener('beforeRemove', (e) => {
      if (gameState === "drawing") {
        e.preventDefault();
        setShowBlockModal(true);
      }
    });

    return () => {
      if (backHandler.current) backHandler.current.remove();
      if (navigationListener.current) navigationListener.current();
    };
  }, [navigation, gameState]);

  const handleCloseBlockModal = () => {
    setShowBlockModal(false);
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

  // Función para calcular tickets ganados (solo tickets, no coins)
  const getTicketRewards = (betAmount, matchesCount = 0) => {
    const baseTickets = Math.floor(betAmount * 0.15); // 15% de la apuesta
    const bonusTickets = matchesCount * 3; // Bonus por aciertos
    return Math.max(10, baseTickets + bonusTickets);
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

  // Todos los números del 1 al 80 en una sola lista
  const numbers = Array.from({ length: 80 }, (_, i) => i + 1);

  const toggleNumber = (number) => {
    if (gameState !== "selecting") return;

    const newSelected = [...selectedNumbers];
    const index = newSelected.indexOf(number);

    if (index > -1) {
      newSelected.splice(index, 1);
    } else if (newSelected.length < 10) {
      newSelected.push(number);
    }

    setSelectedNumbers(newSelected);
  };

  // FUNCIÓN MEJORADA: Con protección contra múltiples clicks
  const placeBet = async (amount) => {
    // Prevenir múltiples clicks
    if (isLoading || gameState !== "selecting") {
      return;
    }

    if (!canAfford(amount)) {
      Vibration.vibrate(100);
      return;
    }

    if (selectedNumbers.length === 0) {
      Vibration.vibrate(100);
      return;
    }

    try {
      setIsLoading(true);
      await subtractCoins(amount, "Apuesta en Keno");
      setBet(amount);
      setGameState("drawing");
      setDrawnNumbers([]);
      setResult("");
      setMatches(0);
      setTicketsWon(0);
      setHasWon(false);

      // Simular sorteo con animación
      await drawNumbersWithAnimation(amount);
    } catch (error) {
      Vibration.vibrate(100);
    } finally {
      setIsLoading(false);
    }
  };

  const drawNumbersWithAnimation = async (betAmount) => {
    const newDrawnNumbers = [];
    while (newDrawnNumbers.length < 20) {
      const num = Math.floor(Math.random() * 80) + 1;
      if (!newDrawnNumbers.includes(num)) {
        newDrawnNumbers.push(num);

        // Animación para cada número sorteado
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.2,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
        ]).start();

        // Pequeña pausa entre números para efecto visual
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    setDrawnNumbers(newDrawnNumbers);

    // Calcular aciertos
    const matchesCount = selectedNumbers.filter((num) =>
      newDrawnNumbers.includes(num)
    ).length;
    
    setMatches(matchesCount);

    // Verificar si gana (5% de probabilidad + mínimo 4 aciertos)
    if (matchesCount >= 4 && checkWinProbability()) {
      await handleWin(betAmount, matchesCount);
    } else {
      // No gana
      Vibration.vibrate(100);
      setResult(`${matchesCount} aciertos - Mejor suerte la próxima`);
      setHasWon(false);
    }

    setGameState("result");
    animateMessage();
  };

  const handleWin = async (betAmount, matchesCount) => {
    const calculatedTickets = getTicketRewards(betAmount, matchesCount);
    
    setTicketsWon(calculatedTickets);
    setHasWon(true);
    
    Vibration.vibrate([0, 300, 100, 300]);
    startPulseAnimation();
    setShowWinAnimation(true);

    try {
      await addTickets(calculatedTickets, "Tickets ganados en Keno");
    } catch (error) {
      console.error("Error actualizando tickets:", error);
    }

    setResult(`¡${matchesCount} ACIERTOS! +${calculatedTickets} TICKETS`);
  };

  const resetGame = () => {
    setSelectedNumbers([]);
    setDrawnNumbers([]);
    setBet(0);
    setGameState("selecting");
    setResult("");
    setMatches(0);
    setTicketsWon(0);
    setHasWon(false);
    setIsLoading(false); // Reset loading state
    stopPulseAnimation();
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
          isMatch && styles.matchedNumber,
          gameState === "result" &&
            isMatch &&
            hasWon && {
              transform: [{ scale: pulseAnim }],
            },
        ]}
        onPress={() => toggleNumber(item)}
        disabled={gameState !== "selecting"}
      >
        <Text
          style={[
            styles.numberText,
            (isSelected || isDrawn) && styles.numberTextSelected,
          ]}
        >
          {item}
        </Text>
      </TouchableOpacity>
    );
  };

  const betAmounts = [50, 100, 250, 500];

  return (
    <SafeAreaView style={styles.safeArea}>
      <WinAnimation
        show={showWinAnimation}
        onClose={() => setShowWinAnimation(false)}
      />
      
      <BlockModal visible={showBlockModal} onClose={handleCloseBlockModal} />

      {/* CONTENEDOR PRINCIPAL SIN SCROLLVIEW */}
      <View style={styles.container}>
        
        {/* Header Compacto */}
        <View style={styles.header}>
          <View style={styles.balances}>
            <View style={styles.balanceItem}>
              <Image
                source={require("../../assets/dinero.png")}
                style={styles.balanceIcon}
              />
              <Text style={styles.balanceText}>{manekiCoins.toLocaleString()}</Text>
            </View>
            <View style={styles.balanceItem}>
              <Image
                source={require("../../assets/TICKET.png")}
                style={styles.balanceIcon}
              />
              <Text style={styles.balanceText}>{tickets.toLocaleString()}</Text>
            </View>
          </View>

          <View style={styles.emptySpace} />
        </View>

        <Text style={styles.instructions}>
          SELECCIONA HASTA 10 NÚMEROS (1-80)
        </Text>

        <Text style={styles.selectedCount}>
          SELECCIONADOS: {selectedNumbers.length}/10
        </Text>

        {/* Mensaje del Juego */}
        {result && (
          <Animated.View style={[styles.messageContainer, { transform: [{ scale: messageAnim }] }]}>
            <Text style={styles.message}>{result}</Text>
            {ticketsWon > 0 && (
              <View style={styles.ticketsWonContainer}>
                <Text style={styles.ticketsWonText}>+{ticketsWon} TICKETS</Text>
              </View>
            )}
          </Animated.View>
        )}

        {/* Tablero de números - CENTRADO Y CON SCROLL PROPIO */}
        <View style={styles.numbersContainer}>
          <FlatList
            data={numbers}
            renderItem={renderNumber}
            keyExtractor={(item) => item.toString()}
            numColumns={10}
            scrollEnabled={true}
            showsVerticalScrollIndicator={true}
            contentContainerStyle={styles.numbersGrid}
          />
        </View>

        {/* Números sorteados */}
        {drawnNumbers.length > 0 && (
          <View style={styles.drawnContainer}>
            <Text style={styles.drawnTitle}>NÚMEROS SORTEADOS:</Text>
            <View style={styles.drawnNumbers}>
              {drawnNumbers.map((num, index) => (
                <Text
                  key={index}
                  style={[
                    styles.drawnNumberText,
                    selectedNumbers.includes(num) && styles.matchedNumberText,
                  ]}
                >
                  {num}
                </Text>
              ))}
            </View>
          </View>
        )}

        {/* Controles */}
        <View style={styles.controls}>
          {gameState === "selecting" && (
            <View style={styles.betContainer}>
              <View style={styles.betAmounts}>
                {betAmounts.map((amount) => (
                  <TouchableOpacity
                    key={amount}
                    style={[
                      styles.betAmountButton,
                      (!canAfford(amount) || selectedNumbers.length === 0 || isLoading) &&
                        styles.disabledButton,
                      bet === amount && styles.selectedBet,
                    ]}
                    onPress={() => {
                      if (canAfford(amount) && !isLoading) {
                        setBet(amount);
                      }
                    }}
                    disabled={!canAfford(amount) || selectedNumbers.length === 0 || isLoading}
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
                    (bet === 0 || selectedNumbers.length === 0 || isLoading) && styles.disabledButton
                  ]}
                  onPress={() => placeBet(bet)}
                  disabled={bet === 0 || selectedNumbers.length === 0 || isLoading}
                >
                  <Ionicons name="play" size={18} color="#FFF" />
                  <Text style={styles.actionButtonText}>
                    {isLoading ? "CARGANDO..." : "INICIAR JUEGO"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {gameState === "result" && (
            <TouchableOpacity 
              style={[styles.actionButton, styles.playAgainButton]} 
              onPress={resetGame}
            >
              <Ionicons name="refresh" size={18} color="#FFF" />
              <Text style={styles.actionButtonText}>JUGAR DE NUEVO</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Tabla de pagos */}
        <View style={styles.payouts}>
          <Text style={styles.payoutsTitle}>
            TABLA DE PREMIOS (SOLO TICKETS):
          </Text>
          <View style={styles.payoutGrid}>
            <View style={styles.payoutColumn}>
              <Text style={styles.payoutHeader}>Aciertos</Text>
              <Text style={styles.payoutValue}>4</Text>
              <Text style={styles.payoutValue}>5</Text>
              <Text style={styles.payoutValue}>6</Text>
              <Text style={styles.payoutValue}>7</Text>
            </View>
            <View style={styles.payoutColumn}>
              <Text style={styles.payoutHeader}>Tickets</Text>
              <Text style={styles.payoutValue}>+15%</Text>
              <Text style={styles.payoutValue}>+18%</Text>
              <Text style={styles.payoutValue}>+21%</Text>
              <Text style={styles.payoutValue}>+24%</Text>
            </View>
            <View style={styles.payoutColumn}>
              <Text style={styles.payoutHeader}>Aciertos</Text>
              <Text style={styles.payoutValue}>8</Text>
              <Text style={styles.payoutValue}>9</Text>
              <Text style={styles.payoutValue}>10</Text>
              <Text style={styles.payoutValue}>-</Text>
            </View>
            <View style={styles.payoutColumn}>
              <Text style={styles.payoutHeader}>Tickets</Text>
              <Text style={styles.payoutValue}>+27%</Text>
              <Text style={styles.payoutValue}>+30%</Text>
              <Text style={styles.payoutValue}>+33%</Text>
              <Text style={styles.payoutValue}>-</Text>
            </View>
          </View>
          <Text style={styles.payoutNote}>
            * Más aciertos = más tickets. Mínimo 4 aciertos para ganar.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0A0A0A",
  },
  container: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 15,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  balances: {
    flexDirection: "row",
    gap: 8,
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
  titleContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
  },
  title: {
    color: "#FFD700",
    fontSize: 18,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  emptySpace: {
    width: 70,
  },
  instructions: {
    color: "#FFF",
    textAlign: "center",
    marginBottom: 8,
    fontSize: 14,
    fontWeight: "600",
  },
  selectedCount: {
    color: "#FFD700",
    textAlign: "center",
    marginBottom: 12,
    fontWeight: "bold",
    fontSize: 12,
  },
  messageContainer: {
    alignItems: "center",
    marginVertical: 8,
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
  numbersContainer: {
    flex: 1,
    marginBottom: 16,
  },
  numbersGrid: {
    paddingBottom: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  number: {
    width: 28,
    height: 28,
    backgroundColor: "#333",
    margin: 2,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#4B5563",
  },
  selectedNumber: {
    backgroundColor: "#2563EB",
    borderColor: "#1D4ED8",
  },
  drawnNumber: {
    backgroundColor: "#6B7280",
    borderColor: "#9CA3AF",
  },
  matchedNumber: {
    backgroundColor: "#10B981",
    borderColor: "#047857",
  },
  numberText: {
    color: "#FFF",
    fontSize: 11,
    fontWeight: "bold",
  },
  numberTextSelected: {
    color: "#FFF",
  },
  drawnContainer: {
    marginBottom: 12,
    backgroundColor: "#1F2937",
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#374151",
  },
  drawnTitle: {
    color: "#FFD700",
    fontWeight: "bold",
    marginBottom: 6,
    textAlign: "center",
    fontSize: 12,
  },
  drawnNumbers: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  drawnNumberText: {
    color: "#D1D5DB",
    marginRight: 6,
    marginBottom: 4,
    fontSize: 12,
    fontWeight: "600",
  },
  matchedNumberText: {
    color: "#10B981",
    fontWeight: "bold",
  },
  controls: {
    alignItems: "center",
    marginBottom: 16,
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
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 2,
    gap: 6,
    justifyContent: "center",
  },
  actionButtonText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 11,
  },
  startButton: {
    backgroundColor: "#10B981",
    borderColor: "#059669",
  },
  playAgainButton: {
    backgroundColor: "#10B981",
    borderColor: "#059669",
    paddingHorizontal: 20,
  },
  payouts: {
    backgroundColor: "#1F2937",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#374151",
  },
  payoutsTitle: {
    color: "#FFD700",
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  payoutGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  payoutColumn: {
    alignItems: "center",
  },
  payoutHeader: {
    color: "#9CA3AF",
    fontSize: 11,
    fontWeight: "bold",
    marginBottom: 6,
  },
  payoutValue: {
    color: "#FFF",
    fontSize: 11,
    marginBottom: 4,
    fontWeight: "600",
  },
  payoutNote: {
    color: "#9CA3AF",
    fontSize: 10,
    textAlign: "center",
    fontStyle: "italic",
  },
  // Estilos para las animaciones
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.8)",
  },
  winAnimation: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    padding: 30,
    borderRadius: 20,
    borderWidth: 4,
    borderColor: "#10B981",
  },
  winAnimationText: {
    color: "#FFD700",
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 10,
    textAlign: "center",
  },
  // NUEVO: Estilos para el modal (EXACTAMENTE IGUAL QUE BINGO)
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.95)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  blockModalContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  probabilityImageLarge: {
    width: width * 0.8,  // 80% del ancho de la pantalla
    height: height * 0.6, // 60% del alto de la pantalla
    maxWidth: 400,       // Máximo ancho
    maxHeight: 400,      // Máximo alto
  },
  disabledButton: {
    backgroundColor: "#1A1A1A",
    borderColor: "#333",
    opacity: 0.5,
  },
});