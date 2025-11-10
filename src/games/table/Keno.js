// src/games/table/Keno.js
import React, { useState, useRef } from "react";
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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useCoins } from "../../context/CoinsContext";
import { useSounds } from "../../hooks/useSounds";

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
    <Modal transparent={true} visible={show} animationType="fade">
      <View style={styles.modalContainer}>
        <Animated.View
          style={[
            styles.loseAnimation,
            {
              transform: [
                { scale: scaleAnim },
                { translateX: shakeInterpolation },
              ],
            },
          ]}
        >
          <Ionicons name="sad-outline" size={80} color="#EF4444" />
          <Text style={styles.loseAnimationText}>¡PERDISTE!</Text>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default function Keno({ navigation }) {
  const {
    manekiCoins,
    tickets,
    subtractCoins,
    addCoins,
    addTickets,
    canAfford,
  } = useCoins();

  const { playSound } = useSounds();
  const [bet, setBet] = useState(0);
  const [selectedNumbers, setSelectedNumbers] = useState([]);
  const [drawnNumbers, setDrawnNumbers] = useState([]);
  const [gameState, setGameState] = useState("selecting");
  const [result, setResult] = useState("");
  const [matches, setMatches] = useState(0);
  const [winAmount, setWinAmount] = useState(0);
  const [ticketsWon, setTicketsWon] = useState(0);
  const [showWinAnimation, setShowWinAnimation] = useState(false);
  const [showLoseAnimation, setShowLoseAnimation] = useState(false);

  // Animaciones
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Todos los números del 1 al 80 en una sola lista
  const numbers = Array.from({ length: 80 }, (_, i) => i + 1);

  // Función para calcular tickets ganados
  const getTicketRewards = (betAmount, matchesCount = 0) => {
    const baseTickets = Math.floor(betAmount * 0.08); // 8% de la apuesta
    const bonusTickets = matchesCount * 2; // Bonus por aciertos
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
    if (gameState !== "selecting") return;

    playSound("click");

    const newSelected = [...selectedNumbers];
    const index = newSelected.indexOf(number);

    if (index > -1) {
      newSelected.splice(index, 1);
    } else if (newSelected.length < 10) {
      newSelected.push(number);
    }

    setSelectedNumbers(newSelected);
  };

  const placeBet = async (amount) => {
    if (!canAfford(amount)) {
      playSound("error");
      Vibration.vibrate(100);
      return;
    }

    if (selectedNumbers.length === 0) {
      playSound("error");
      Vibration.vibrate(100);
      return;
    }

    try {
      playSound("coin");
      await subtractCoins(amount, "Apuesta en Keno");
      setBet(amount);
      setGameState("drawing");
      setDrawnNumbers([]);
      setResult("");
      setMatches(0);
      setWinAmount(0);
      setTicketsWon(0);

      // Simular sorteo con animación
      await drawNumbersWithAnimation(amount);
    } catch (error) {
      playSound("error");
      Vibration.vibrate(100);
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

    // Calcular aciertos y premio
    const matchesCount = selectedNumbers.filter((num) =>
      newDrawnNumbers.includes(num)
    ).length;
    const calculatedWin = calculateWin(matchesCount, betAmount);
    const calculatedTickets = getTicketRewards(betAmount, matchesCount);

    setMatches(matchesCount);
    setWinAmount(calculatedWin);
    setTicketsWon(calculatedTickets);

    if (calculatedWin > 0) {
      playSound("success");
      Vibration.vibrate([0, 300, 100, 300]);
      startPulseAnimation();
      setShowWinAnimation(true);

      try {
        await addCoins(
          calculatedWin,
          `Victoria en Keno - ${matchesCount} aciertos`
        );
        await addTickets(calculatedTickets, "Tickets ganados en Keno");
      } catch (error) {
        console.error("Error actualizando premios:", error);
      }

      setResult(`¡${matchesCount} ACIERTOS!`);
    } else {
      playSound("error");
      setShowLoseAnimation(true);
      setResult(`${matchesCount} aciertos`);
    }

    setGameState("result");
  };

  const calculateWin = (matchesCount, betAmount) => {
    const payoutTable = {
      0: 0,
      1: 0,
      2: 0,
      3: 0,
      4: 1,
      5: 2,
      6: 10,
      7: 50,
      8: 100,
      9: 500,
      10: 1000,
    };
    return betAmount * payoutTable[matchesCount] || 0;
  };

  const resetGame = () => {
    setSelectedNumbers([]);
    setDrawnNumbers([]);
    setBet(0);
    setGameState("selecting");
    setResult("");
    setMatches(0);
    setWinAmount(0);
    setTicketsWon(0);
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
            isMatch && {
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

        <Text style={styles.title}>KENO</Text>

        <View style={styles.balanceContainer}>
          <View style={styles.balanceItem}>
            <Image
              source={require("../../assets/dinero.png")}
              style={styles.balanceIcon}
            />
            <Text style={styles.balanceValue}>{manekiCoins}</Text>
          </View>
          <View style={styles.balanceItem}>
            <Image
              source={require("../../assets/TICKET.png")}
              style={styles.balanceIcon}
            />
            <Text style={styles.balanceValue}>{tickets}</Text>
          </View>
        </View>
      </View>

      <Text style={styles.instructions}>
        SELECCIONA HASTA 10 NÚMEROS (1-80)
      </Text>

      <Text style={styles.selectedCount}>
        SELECCIONADOS: {selectedNumbers.length}/10
      </Text>

      {/* Tablero de números - TODOS LOS NÚMEROS EN UNA SOLA LISTA */}
      <View style={styles.numbersContainer}>
        <FlatList
          data={numbers}
          renderItem={renderNumber}
          keyExtractor={(item) => item.toString()}
          numColumns={10}
          scrollEnabled={true}
          showsVerticalScrollIndicator={false}
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

      {/* Resultados */}
      {gameState === "result" && (
        <Animated.View
          style={[
            styles.resultContainer,
            winAmount > 0 && { transform: [{ scale: pulseAnim }] },
          ]}
        >
          <Text style={styles.result}>{result}</Text>
          {winAmount > 0 && (
            <>
              <Text style={styles.winAmount}>+{winAmount} MANEKI COINS</Text>
              <Text style={styles.ticketsWon}>+{ticketsWon} TICKETS</Text>
            </>
          )}
          {winAmount === 0 && matches > 0 && (
            <Text style={styles.noWinText}>Sin premio esta vez</Text>
          )}
        </Animated.View>
      )}

      {/* Controles */}
      <View style={styles.controls}>
        {gameState === "selecting" && (
          <View style={styles.betContainer}>
            <Text style={styles.betTitle}>SELECCIONA APUESTA</Text>
            <View style={styles.betButtons}>
              {[50, 100, 250, 500].map((amount) => (
                <TouchableOpacity
                  key={amount}
                  style={[
                    styles.betButton,
                    (!canAfford(amount) || selectedNumbers.length === 0) &&
                      styles.disabledButton,
                  ]}
                  onPress={() => placeBet(amount)}
                  disabled={!canAfford(amount) || selectedNumbers.length === 0}
                >
                  <Text style={styles.betButtonText}>{amount}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.betInfo}>
              Tickets: +{getTicketRewards(100)} por 100 coins + bonus por
              aciertos
            </Text>
          </View>
        )}

        {gameState === "result" && (
          <TouchableOpacity style={styles.resetButton} onPress={resetGame}>
            <Text style={styles.resetButtonText}>JUGAR OTRA VEZ</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Tabla de pagos */}
      <View style={styles.payouts}>
        <Text style={styles.payoutsTitle}>
          TABLA DE PREMIOS (MULTIPLICADOR):
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
            <Text style={styles.payoutHeader}>Premio</Text>
            <Text style={styles.payoutValue}>1x</Text>
            <Text style={styles.payoutValue}>2x</Text>
            <Text style={styles.payoutValue}>10x</Text>
            <Text style={styles.payoutValue}>50x</Text>
          </View>
          <View style={styles.payoutColumn}>
            <Text style={styles.payoutHeader}>Aciertos</Text>
            <Text style={styles.payoutValue}>8</Text>
            <Text style={styles.payoutValue}>9</Text>
            <Text style={styles.payoutValue}>10</Text>
            <Text style={styles.payoutValue}>-</Text>
          </View>
          <View style={styles.payoutColumn}>
            <Text style={styles.payoutHeader}>Premio</Text>
            <Text style={styles.payoutValue}>100x</Text>
            <Text style={styles.payoutValue}>500x</Text>
            <Text style={styles.payoutValue}>1000x</Text>
            <Text style={styles.payoutValue}>-</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F0F0F",
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingHorizontal: 5,
  },
  backButton: {
    padding: 8,
  },
  title: {
    color: "#FFD700",
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    letterSpacing: 2,
    flex: 1,
  },
  balanceContainer: {
    alignItems: "flex-end",
  },
  balanceItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1A1A",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#333",
    marginBottom: 4,
  },
  balanceIcon: {
    width: 16,
    height: 16,
    resizeMode: "contain",
    marginRight: 4,
  },
  balanceValue: {
    color: "#FFD700",
    fontSize: 14,
    fontWeight: "bold",
  },
  instructions: {
    color: "#FFF",
    textAlign: "center",
    marginBottom: 10,
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  selectedCount: {
    color: "#FFD700",
    textAlign: "center",
    marginBottom: 15,
    fontWeight: "bold",
    fontSize: 14,
  },
  numbersContainer: {
    flex: 1,
    marginBottom: 20,
    maxHeight: 300,
  },
  numbersGrid: {
    paddingBottom: 10,
  },
  number: {
    width: 30,
    height: 30,
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
    fontSize: 12,
    fontWeight: "bold",
  },
  numberTextSelected: {
    color: "#FFF",
  },
  drawnContainer: {
    marginBottom: 15,
    backgroundColor: "#1F2937",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#374151",
  },
  drawnTitle: {
    color: "#FFD700",
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
    fontSize: 14,
  },
  drawnNumbers: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  drawnNumberText: {
    color: "#D1D5DB",
    marginRight: 8,
    marginBottom: 5,
    fontSize: 14,
    fontWeight: "600",
  },
  matchedNumberText: {
    color: "#10B981",
    fontWeight: "bold",
  },
  resultContainer: {
    alignItems: "center",
    backgroundColor: "#1F2937",
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: "#374151",
  },
  result: {
    color: "#FFD700",
    fontSize: 20,
    textAlign: "center",
    fontWeight: "bold",
    marginBottom: 8,
    letterSpacing: 1,
  },
  winAmount: {
    color: "#10B981",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  ticketsWon: {
    color: "#3B82F6",
    fontSize: 16,
    fontWeight: "bold",
  },
  noWinText: {
    color: "#EF4444",
    fontSize: 14,
    fontWeight: "bold",
  },
  controls: {
    alignItems: "center",
    marginBottom: 20,
  },
  betContainer: {
    alignItems: "center",
  },
  betTitle: {
    color: "#FFF",
    fontSize: 16,
    marginBottom: 12,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  betButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: 10,
  },
  betButton: {
    backgroundColor: "#FFD700",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    margin: 6,
    minWidth: 70,
    borderWidth: 2,
    borderColor: "#B45309",
  },
  disabledButton: {
    backgroundColor: "#374151",
    borderColor: "#6B7280",
  },
  betButtonText: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 14,
    textAlign: "center",
  },
  betInfo: {
    color: "#9CA3AF",
    fontSize: 12,
    textAlign: "center",
    marginTop: 8,
  },
  resetButton: {
    backgroundColor: "#DC2626",
    paddingHorizontal: 35,
    paddingVertical: 16,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: "#B91C1C",
  },
  resetButtonText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 16,
    letterSpacing: 1,
  },
  payouts: {
    backgroundColor: "#1F2937",
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#374151",
  },
  payoutsTitle: {
    color: "#FFD700",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
    letterSpacing: 0.5,
  },
  payoutGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  payoutColumn: {
    alignItems: "center",
  },
  payoutHeader: {
    color: "#9CA3AF",
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 8,
  },
  payoutValue: {
    color: "#FFF",
    fontSize: 12,
    marginBottom: 6,
    fontWeight: "600",
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
  loseAnimation: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    padding: 30,
    borderRadius: 20,
    borderWidth: 4,
    borderColor: "#EF4444",
  },
  winAnimationText: {
    color: "#FFD700",
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 10,
    textAlign: "center",
  },
  loseAnimationText: {
    color: "#EF4444",
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 10,
    textAlign: "center",
  },
});
