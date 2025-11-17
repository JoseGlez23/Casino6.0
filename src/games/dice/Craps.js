// src/games/dice/Craps.js
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
  ScrollView,
  SafeAreaView,
  BackHandler,
  Modal,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useCoins } from "../../context/CoinsContext";

const { width, height } = Dimensions.get("window");

// Componente para bloquear la barra de navegación
const TabBlocker = ({ isVisible, onPress }) => {
  if (!isVisible) return null;

  return (
    <TouchableOpacity 
      style={styles.tabBlocker} 
      onPress={onPress}
      activeOpacity={1}
    >
      <View style={styles.tabBlockerContent}>
        <Ionicons name="warning" size={32} color="#FFD700" />
        <Text style={styles.tabBlockerText}>
          Partida en curso{"\n"}
          <Text style={styles.tabBlockerSubtext}>
            Termina el juego primero
          </Text>
        </Text>
      </View>
    </TouchableOpacity>
  );
};

// Componente de Modal de Bloqueo - Solo imagen grande con auto-cierre de 3 segundos
const BlockModal = ({ visible, onClose }) => {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.5));
  const [slideAnim] = useState(new Animated.Value(-100));
  const modalRef = useRef(null);

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
        handleClose();
      }, 3000);

      return () => clearTimeout(timer);
    } else {
      // Resetear animaciones cuando no es visible
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.5);
      slideAnim.setValue(-100);
    }
  }, [visible]);

  const handleClose = () => {
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
  };

  const handleModalPress = () => {
    handleClose();
  };

  if (!visible) return null;

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="none"
      onRequestClose={handleClose}
    >
      <TouchableOpacity 
        style={styles.modalOverlayTransparent} 
        activeOpacity={1}
        onPress={handleModalPress}
      >
        <Animated.View 
          ref={modalRef}
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
      </TouchableOpacity>
    </Modal>
  );
};

// Componente de animación de victoria
const WinAnimation = ({ show, ticketsWon = 0 }) => {
  const [scaleAnim] = useState(new Animated.Value(0));
  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
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
      <Text style={styles.winText}>¡VICTORIA!</Text>
      <Text style={styles.winSubtext}>Ganas tickets</Text>
      {ticketsWon > 0 && (
        <Text style={styles.ticketsWonAnimation}>+{ticketsWon} Tickets</Text>
      )}
    </Animated.View>
  );
};

// Componente de animación de derrota
const LoseAnimation = ({ show }) => {
  const [scaleAnim] = useState(new Animated.Value(0));
  const [shakeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
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
    <Animated.View
      style={[
        styles.animationContainer,
        styles.loseAnimation,
        {
          transform: [{ scale: scaleAnim }, { translateX: shakeInterpolation }],
        },
      ]}
    >
      <Ionicons name="sad-outline" size={60} color="#EF4444" />
      <Text style={styles.loseText}>¡DERROTA!</Text>
      <Text style={styles.loseSubtext}>Pierdes la apuesta</Text>
    </Animated.View>
  );
};

// Tabla de premios de tickets para Craps - VALORES REDUCIDOS
const getTicketRewards = (betAmount, isNaturalWin = false) => {
  const rewards = {
    50: isNaturalWin ? 25 : 15,
    100: isNaturalWin ? 50 : 30,
    250: isNaturalWin ? 125 : 75,
    500: isNaturalWin ? 250 : 150,
  };
  return rewards[betAmount] || 0;
};

export default function Craps({ navigation }) {
  const {
    manekiCoins,
    tickets,
    subtractCoins,
    addTickets,
    canAfford,
  } = useCoins();

  const [bet, setBet] = useState(0);
  const [dice1, setDice1] = useState(1);
  const [dice2, setDice2] = useState(1);
  const [gameState, setGameState] = useState("betting");
  const [result, setResult] = useState("");
  const [point, setPoint] = useState(null);
  const [phase, setPhase] = useState("comeOut");
  const [showWinAnimation, setShowWinAnimation] = useState(false);
  const [showLoseAnimation, setShowLoseAnimation] = useState(false);
  const [ticketsWon, setTicketsWon] = useState(0);
  const [showBlockModal, setShowBlockModal] = useState(false);
  
  // Estados para controlar la navegación
  const [gameInProgress, setGameInProgress] = useState(false);
  const [showTabBlocker, setShowTabBlocker] = useState(false);

  const diceAnimations = useState(new Animated.Value(0))[0];
  const resultAnimations = useState(new Animated.Value(0))[0];
  const [pulseAnim] = useState(new Animated.Value(1));
  const navigationListener = useRef(null);
  const backHandler = useRef(null);

  // EFECTO PARA BLOQUEAR LA BARRA INFERIOR
  useEffect(() => {
    navigation.getParent()?.setOptions({
      tabBarStyle: gameInProgress ? { display: 'none' } : {
        backgroundColor: "#1a1a1a",
        borderTopWidth: 2,
        borderTopColor: "#FFD700",
        paddingBottom: 8,
        paddingTop: 8,
        height: 65,
      }
    });

    if (gameInProgress) {
      const unsubscribe = navigation.getParent()?.addListener('tabPress', (e) => {
        e.preventDefault();
        setShowTabBlocker(true);
        setTimeout(() => setShowTabBlocker(false), 2000);
      });

      return () => {
        if (unsubscribe) unsubscribe();
        navigation.getParent()?.setOptions({
          tabBarStyle: {
            backgroundColor: "#1a1a1a",
            borderTopWidth: 2,
            borderTopColor: "#FFD700",
            paddingBottom: 8,
            paddingTop: 8,
            height: 65,
          }
        });
      };
    }
  }, [navigation, gameInProgress]);

  // Manejar navegación y botón de retroceso
  useEffect(() => {
    backHandler.current = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        if (gameState === "rolling" || gameInProgress) {
          setShowBlockModal(true);
          return true;
        }
        return false;
      }
    );

    navigationListener.current = navigation.addListener('beforeRemove', (e) => {
      if (gameState === "rolling" || gameInProgress) {
        e.preventDefault();
        setShowBlockModal(true);
      }
    });

    return () => {
      if (backHandler.current?.remove) backHandler.current.remove();
      if (navigationListener.current) navigationListener.current();
    };
  }, [navigation, gameState, gameInProgress]);

  const diceFaces = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];
  const diceValues = [1, 2, 3, 4, 5, 6];

  // Función para determinar si el jugador gana automáticamente (5% de probabilidad)
  const shouldAutoWin = () => {
    return Math.random() < 0.05;
  };

  const animateDice = () => {
    diceAnimations.setValue(0);
    Animated.sequence([
      Animated.timing(diceAnimations, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(diceAnimations, {
        toValue: 0.8,
        duration: 200,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(diceAnimations, {
        toValue: 1,
        tension: 100,
        friction: 5,
        useNativeDriver: true,
      })
    ]).start();
  };

  const animateResult = () => {
    resultAnimations.setValue(0);
    Animated.spring(resultAnimations, {
      toValue: 1,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const pulseAnimation = () => {
    Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: 1.1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const triggerWinAnimation = (tickets = 0) => {
    setTicketsWon(tickets);
    setShowWinAnimation(true);
    setTimeout(() => {
      setShowWinAnimation(false);
      setTicketsWon(0);
    }, 3000);
  };

  const triggerLoseAnimation = () => {
    setShowLoseAnimation(true);
    setTimeout(() => setShowLoseAnimation(false), 3000);
  };

  const handleCloseBlockModal = () => {
    setShowBlockModal(false);
  };

  const placeBet = async (amount) => {
    if (!canAfford(amount)) {
      Alert.alert(
        "Fondos Insuficientes",
        "No tienes suficientes Maneki Coins para esta apuesta"
      );
      return;
    }

    setBet(amount);
    subtractCoins(amount, `Apuesta en Craps`);
    pulseAnimation();

    setGameState("rolling");
    setResult("");
    setPoint(null);
    setPhase("comeOut");
    setShowWinAnimation(false);
    setShowLoseAnimation(false);
    setTicketsWon(0);
    setGameInProgress(true);
  };

  const rollDice = async () => {
    animateDice();

    setGameState("rolling");

    let rollCount = 0;
    const maxRolls = 10;
    const rollInterval = setInterval(() => {
      const tempRoll1 = diceValues[Math.floor(Math.random() * 6)];
      const tempRoll2 = diceValues[Math.floor(Math.random() * 6)];

      setDice1(tempRoll1);
      setDice2(tempRoll2);

      rollCount++;
      if (rollCount >= maxRolls) {
        clearInterval(rollInterval);

        setTimeout(() => {
          const autoWin = shouldAutoWin();
          let finalRoll1, finalRoll2;

          if (autoWin) {
            // Victoria automática - generar dados que aseguren la victoria
            if (phase === "comeOut") {
              // En fase de salida, hacer que salga 7 u 11
              const winningValues = [7, 11];
              const targetTotal = winningValues[Math.floor(Math.random() * 2)];
              finalRoll1 = Math.floor(Math.random() * 6) + 1;
              finalRoll2 = targetTotal - finalRoll1;
              
              // Asegurar que el segundo dado sea válido
              if (finalRoll2 < 1 || finalRoll2 > 6) {
                finalRoll1 = 6;
                finalRoll2 = 1; // Total 7
              }
            } else {
              // En fase de punto, hacer que salga el punto
              finalRoll1 = Math.floor(Math.random() * 6) + 1;
              finalRoll2 = point - finalRoll1;
              
              // Asegurar que el segundo dado sea válido
              if (finalRoll2 < 1 || finalRoll2 > 6) {
                finalRoll1 = Math.ceil(point / 2);
                finalRoll2 = point - finalRoll1;
              }
            }
          } else {
            // Juego normal
            finalRoll1 = diceValues[Math.floor(Math.random() * 6)];
            finalRoll2 = diceValues[Math.floor(Math.random() * 6)];
          }

          setDice1(finalRoll1);
          setDice2(finalRoll2);
          determineResult(finalRoll1 + finalRoll2, autoWin);
        }, 300);
      }
    }, 120);
  };

  const determineResult = async (total, autoWin = false) => {
    let ticketReward = 0;
    let resultMessage = "";
    let newPoint = point;
    let newPhase = phase;
    let isNaturalWin = false;

    if (phase === "comeOut") {
      if (autoWin || total === 7 || total === 11) {
        // GANADOR NATURAL - Solo tickets
        isNaturalWin = true;
        ticketReward = getTicketRewards(bet, isNaturalWin);
        if (autoWin) {
          resultMessage = `¡GANANCIA SORPRESA! - ${total}`;
        } else {
          resultMessage = `GANADOR NATURAL - ${total}`;
        }
        triggerWinAnimation(ticketReward);
      } else if (total === 2 || total === 3 || total === 12) {
        // CRAPS - Pierdes la apuesta
        resultMessage = `CRAPS - ${total} - Pierdes`;
        triggerLoseAnimation();
      } else {
        // Establecer punto
        newPoint = total;
        newPhase = "point";
        resultMessage = `PUNTO ESTABLECIDO: ${total}`;
      }
    } else {
      if (autoWin || total === point) {
        // GANAR PUNTO - Solo tickets
        ticketReward = getTicketRewards(bet, false);
        if (autoWin) {
          resultMessage = `¡GANANCIA SORPRESA! - Punto ${total}`;
        } else {
          resultMessage = `PUNTO GANADO - ${total}`;
        }
        triggerWinAnimation(ticketReward);
        newPoint = null;
        newPhase = "comeOut";
      } else if (total === 7) {
        // SIETE FUERA - Pierdes
        resultMessage = `SIETE FUERA - ${total} - Pierdes`;
        triggerLoseAnimation();
        newPoint = null;
        newPhase = "comeOut";
      } else {
        // Continuar buscando punto
        resultMessage = `Rodada: ${total} - Buscando Punto ${point}`;
      }
    }

    // Procesar SOLO tickets si hay ganancia
    if (ticketReward > 0) {
      await addTickets(ticketReward, `Ganancia en Craps - Tickets`);
    }

    setResult(resultMessage);
    setPoint(newPoint);
    setPhase(newPhase);
    setGameState("result");
    animateResult();
    pulseAnimation();

    // Si el juego terminó, marcar como no en progreso
    if (newPhase === "comeOut" && (ticketReward > 0 || result.includes("Pierdes"))) {
      setGameInProgress(false);
    }
  };

  const resetGame = async () => {
    setBet(0);
    setGameState("betting");
    setResult("");
    setPoint(null);
    setPhase("comeOut");
    setShowWinAnimation(false);
    setShowLoseAnimation(false);
    setTicketsWon(0);
    setGameInProgress(false);
  };

  const continueGame = async () => {
    setGameState("rolling");
    await rollDice();
  };

  const renderDice = (diceValue, index) => {
    const diceAnimation = {
      transform: [
        {
          rotate: diceAnimations.interpolate({
            inputRange: [0, 1],
            outputRange: ["0deg", "360deg"],
          }),
        },
        {
          scale: diceAnimations.interpolate({
            inputRange: [0, 0.3, 0.6, 1],
            outputRange: [1, 1.3, 0.9, 1],
          }),
        },
        {
          translateY: diceAnimations.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [0, -20, 0],
          }),
        },
      ],
    };

    return (
      <Animated.View key={index} style={[styles.dice, diceAnimation]}>
        <Text style={styles.diceFace}>{diceFaces[diceValue - 1]}</Text>
        <Text style={styles.diceValue}>{diceValue}</Text>
      </Animated.View>
    );
  };

  const betAmounts = [50, 100, 250, 500];

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Animaciones centradas */}
      <WinAnimation show={showWinAnimation} ticketsWon={ticketsWon} />
      <LoseAnimation show={showLoseAnimation} />
      
      <BlockModal
        visible={showBlockModal}
        onClose={handleCloseBlockModal}
      />

      {/* Bloqueador de pestañas */}
      <TabBlocker 
        isVisible={showTabBlocker} 
        onPress={() => setShowTabBlocker(false)}
      />

      {/* Indicador de juego en progreso */}
      {gameInProgress && (
        <View style={styles.gameInProgressIndicator}>
          <Ionicons name="lock-closed" size={16} color="#FFF" />
          <Text style={styles.gameInProgressText}>
            PARTIDA EN CURSO - NO PUEDES SALIR
          </Text>
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header compacto con saldo y tickets */}
        <Animated.View
          style={[styles.header, { transform: [{ scale: pulseAnim }] }]}
        >
          {/* Saldo y Tickets al lado izquierdo */}
          <View style={styles.balancesContainer}>
            <View style={styles.balanceRow}>
              {/* Saldo */}
              <View style={styles.balanceItem}>
                <View style={styles.coinsDisplay}>
                  <Image
                    source={require("../../assets/dinero.png")}
                    style={styles.coinIcon}
                  />
                  <Text style={styles.balanceText}>
                    {manekiCoins.toLocaleString()}
                  </Text>
                </View>
              </View>

              {/* Tickets */}
              <View style={styles.balanceItem}>
                <View style={styles.ticketsDisplay}>
                  <Image
                    source={require("../../assets/TICKET.png")}
                    style={styles.ticketIcon}
                  />
                  <Text style={styles.balanceText}>
                    {tickets.toLocaleString()}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Espacio vacío para mantener balance */}
          <View style={styles.emptySpace} />
        </Animated.View>

        {/* Área de dados compacta */}
        <View style={styles.diceArea}>
          <View style={styles.areaHeader}>
            <Text style={styles.areaTitle}>TIRADA</Text>
            <Text style={styles.areaScore}>{dice1 + dice2}</Text>
          </View>

          <View style={styles.diceContainer}>
            {renderDice(dice1, 1)}
            {renderDice(dice2, 2)}
          </View>

          <Text style={styles.total}>Total: {dice1 + dice2}</Text>

          {point && (
            <View style={styles.pointContainer}>
              <Text style={styles.pointText}>PUNTO: {point}</Text>
            </View>
          )}
        </View>

        {/* Información de fase compacta */}
        <View style={styles.phaseContainer}>
          <Text style={styles.phaseTitle}>
            {phase === "comeOut" ? "FASE SALIDA" : "FASE PUNTO"}
          </Text>
          <Text style={styles.phaseDescription}>
            {phase === "comeOut"
              ? "Gana: 7, 11 • Pierde: 2, 3, 12"
              : `Gana: ${point} • Pierde: 7`}
          </Text>
        </View>

        {/* Mensaje de resultado compacto */}
        {result && (
          <Animated.View
            style={[
              styles.messageContainer,
              {
                transform: [
                  {
                    scale: resultAnimations.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.9, 1],
                    }),
                  },
                  {
                    scale: pulseAnim,
                  },
                ],
                borderColor:
                  result.includes("GANANCIA") || result.includes("GANADOR") || result.includes("PUNTO GANADO")
                    ? "#10B981"
                    : result.includes("Pierdes")
                    ? "#EF4444"
                    : "#2563EB",
                backgroundColor:
                  result.includes("GANANCIA") || result.includes("GANADOR") || result.includes("PUNTO GANADO")
                    ? "rgba(16, 185, 129, 0.1)"
                    : result.includes("Pierdes")
                    ? "rgba(239, 68, 68, 0.1)"
                    : "rgba(37, 99, 235, 0.1)",
              },
            ]}
          >
            <Text
              style={[
                styles.message,
                {
                  color:
                    result.includes("GANANCIA") || result.includes("GANADOR") || result.includes("PUNTO GANADO")
                      ? "#10B981"
                      : result.includes("Pierdes")
                      ? "#EF4444"
                      : "#2563EB",
                },
              ]}
            >
              {result}
            </Text>
            {ticketsWon > 0 && (
              <View style={styles.winContainer}>
                <Text style={styles.ticketsWonText}>+{ticketsWon} Tickets</Text>
                <Text style={styles.winSubtext}>¡Premio en tickets!</Text>
              </View>
            )}
            {bet > 0 && gameState === "result" && (
              <Text style={styles.betInfo}>
                Apuesta: {bet.toLocaleString()} MC
              </Text>
            )}
          </Animated.View>
        )}

        {/* Controles compactos */}
        <View style={styles.controls}>
          {gameState === "betting" && (
            <View style={styles.betContainer}>
              <Text style={styles.betTitle}>SELECCIONE APUESTA</Text>

              <View style={styles.betAmounts}>
                {betAmounts.map((amount) => (
                  <TouchableOpacity
                    key={amount}
                    style={[
                      styles.betAmountButton,
                      !canAfford(amount) && styles.disabledButton,
                      bet === amount && styles.selectedBet,
                    ]}
                    onPress={async () => {
                      if (canAfford(amount)) {
                        setBet(amount);
                        pulseAnimation();
                      }
                    }}
                    disabled={!canAfford(amount)}
                  >
                    <Text style={styles.betAmountText}>
                      {amount.toLocaleString()}
                    </Text>
                    <Text style={styles.ticketRewardText}>MANEKI COINS</Text>
                    <Text style={styles.ticketRewardInfo}>
                      +{getTicketRewards(amount, true)} tickets
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.currentBet}>
                {bet > 0
                  ? `Apuesta: ${bet.toLocaleString()} MC`
                  : "Seleccione monto"}
              </Text>

              <TouchableOpacity
                style={[styles.startButton, bet === 0 && styles.disabledButton]}
                onPress={() => bet > 0 && placeBet(bet)}
                disabled={bet === 0}
              >
                <Ionicons name="play" size={16} color="#FFF" />
                <Text style={styles.startButtonText}>INICIAR JUEGO</Text>
              </TouchableOpacity>
            </View>
          )}

          {gameState === "rolling" && (
            <TouchableOpacity style={styles.rollButton} onPress={rollDice}>
              <Ionicons name="dice" size={16} color="#FFF" />
              <Text style={styles.rollButtonText}>LANZAR DADOS</Text>
            </TouchableOpacity>
          )}

          {gameState === "result" && phase === "point" && (
            <View style={styles.pointActions}>
              <TouchableOpacity
                style={styles.continueButton}
                onPress={continueGame}
              >
                <Ionicons name="refresh" size={16} color="#FFF" />
                <Text style={styles.continueButtonText}>CONTINUAR</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.resetButton} onPress={resetGame}>
                <Ionicons name="stop" size={16} color="#FFF" />
                <Text style={styles.resetButtonText}>FINALIZAR</Text>
              </TouchableOpacity>
            </View>
          )}

          {gameState === "result" && phase === "comeOut" && (
            <TouchableOpacity
              style={styles.playAgainButton}
              onPress={resetGame}
            >
              <Ionicons name="refresh" size={16} color="#FFF" />
              <Text style={styles.playAgainText}>JUGAR DE NUEVO</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Reglas compactas */}
        <View style={styles.rulesContainer}>
          <Text style={styles.rulesTitle}>REGLAS Y PREMIOS</Text>
          <View style={styles.rulesGrid}>
            <View style={styles.ruleItem}>
              <Text style={styles.ruleNumbers}>7 • 11</Text>
              <Text style={styles.ruleText}>Gana Natural</Text>
              <Text style={styles.ruleMultiplier}>Solo Tickets</Text>
            </View>
            <View style={styles.ruleItem}>
              <Text style={styles.ruleNumbers}>2 • 3 • 12</Text>
              <Text style={styles.ruleText}>Pierde</Text>
              <Text style={styles.ruleMultiplier}>0x</Text>
            </View>
            <View style={styles.ruleItem}>
              <Text style={styles.ruleNumbers}>Punto</Text>
              <Text style={styles.ruleText}>Gana</Text>
              <Text style={styles.ruleMultiplier}>Solo Tickets</Text>
            </View>
          </View>
        </View>

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
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 15,
    paddingHorizontal: 5,
  },
  balancesContainer: {
    flex: 1,
  },
  balanceRow: {
    flexDirection: "row",
    gap: 10,
  },
  balanceItem: {
    alignItems: "flex-start",
  },
  coinsDisplay: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1A1A",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#FFD700",
    gap: 5,
    minWidth: 80,
  },
  ticketsDisplay: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1A1A",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#10B981",
    gap: 5,
    minWidth: 80,
  },
  coinIcon: {
    width: 14,
    height: 14,
    resizeMode: "contain",
  },
  ticketIcon: {
    width: 14,
    height: 14,
    resizeMode: "contain",
  },
  balanceText: {
    color: "#FFD700",
    fontSize: 12,
    fontWeight: "bold",
  },
  emptySpace: {
    width: 80,
  },
  diceArea: {
    backgroundColor: "rgba(26, 26, 26, 0.9)",
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#333",
    alignItems: "center",
  },
  areaHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginBottom: 15,
  },
  areaTitle: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  areaScore: {
    color: "#FFD700",
    fontSize: 16,
    fontWeight: "bold",
    backgroundColor: "rgba(139, 0, 0, 0.3)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#FFD700",
  },
  diceContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 15,
  },
  dice: {
    width: 80, // DADOS MÁS GRANDES
    height: 80, // DADOS MÁS GRANDES
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginHorizontal: 10,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    borderWidth: 3,
    borderColor: "#E5E5E5",
  },
  diceFace: {
    fontSize: 40, // CARA MÁS GRANDE
  },
  diceValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#000",
    marginTop: 4,
  },
  total: {
    color: "#FFD700",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  pointContainer: {
    backgroundColor: "rgba(245, 158, 11, 0.2)",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#F59E0B",
  },
  pointText: {
    color: "#F59E0B",
    fontSize: 14,
    fontWeight: "bold",
  },
  phaseContainer: {
    backgroundColor: "rgba(26, 26, 26, 0.9)",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#2563EB",
  },
  phaseTitle: {
    color: "#2563EB",
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 6,
  },
  phaseDescription: {
    color: "#FFF",
    fontSize: 11,
    textAlign: "center",
    lineHeight: 14,
  },
  messageContainer: {
    alignItems: "center",
    marginVertical: 12,
    padding: 15,
    borderRadius: 10,
    borderWidth: 2,
    minHeight: 60,
    justifyContent: "center",
  },
  message: {
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
    lineHeight: 18,
  },
  winContainer: {
    alignItems: "center",
    marginTop: 8,
  },
  ticketsWonText: {
    color: "#10B981",
    fontSize: 16,
    fontWeight: "bold",
  },
  winSubtext: {
    color: "#FFF",
    fontSize: 12,
    marginTop: 2,
    opacity: 0.9,
  },
  betInfo: {
    color: "#FFF",
    fontSize: 12,
    marginTop: 6,
    opacity: 0.8,
  },
  controls: {
    marginTop: 8,
    marginBottom: 20,
  },
  betContainer: {
    alignItems: "center",
  },
  betTitle: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  betAmounts: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    marginBottom: 15,
    gap: 8,
  },
  betAmountButton: {
    backgroundColor: "#2A2A2A",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#444",
    minWidth: 80,
  },
  selectedBet: {
    borderColor: "#FFD700",
    backgroundColor: "rgba(255, 215, 0, 0.1)",
  },
  betAmountText: {
    color: "#FFD700",
    fontSize: 14,
    fontWeight: "bold",
  },
  ticketRewardText: {
    color: "#FFD700",
    fontSize: 10,
    marginTop: 2,
  },
  ticketRewardInfo: {
    color: "#10B981",
    fontSize: 9,
    marginTop: 2,
    fontStyle: "italic",
  },
  currentBet: {
    color: "#FFD700",
    fontSize: 13,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
    backgroundColor: "rgba(139, 0, 0, 0.3)",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#FFD700",
  },
  startButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#10B981",
    paddingHorizontal: 25,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#059669",
    gap: 6,
  },
  startButtonText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 14,
  },
  rollButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2563EB",
    paddingHorizontal: 25,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#1D4ED8",
    gap: 6,
  },
  rollButtonText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 14,
  },
  pointActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  continueButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2563EB",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#1D4ED8",
    gap: 6,
    flex: 1,
  },
  continueButtonText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 12,
  },
  resetButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#6B7280",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#4B5563",
    gap: 6,
    flex: 1,
  },
  resetButtonText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 12,
  },
  playAgainButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#10B981",
    paddingHorizontal: 25,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#059669",
    gap: 6,
  },
  playAgainText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 14,
  },
  rulesContainer: {
    backgroundColor: "rgba(26, 26, 26, 0.9)",
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#333",
  },
  rulesTitle: {
    color: "#FFD700",
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 12,
  },
  rulesGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  ruleItem: {
    alignItems: "center",
    flex: 1,
    padding: 6,
  },
  ruleNumbers: {
    color: "#FFD700",
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 4,
  },
  ruleText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 2,
  },
  ruleMultiplier: {
    color: "#10B981",
    fontSize: 9,
    fontWeight: "bold",
    textAlign: "center",
  },
  bottomSpacer: {
    height: 10,
  },
  disabledButton: {
    backgroundColor: "#1A1A1A",
    borderColor: "#333",
    opacity: 0.5,
  },
  // Estilos para animaciones
  animationContainer: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginLeft: -100,
    marginTop: -80,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    backgroundColor: "rgba(0, 0, 0, 0.95)",
    padding: 20,
    borderRadius: 15,
    borderWidth: 4,
    width: 200,
    height: 160,
  },
  winAnimation: {
    borderColor: "#FFD700",
  },
  loseAnimation: {
    borderColor: "#EF4444",
  },
  winText: {
    color: "#FFD700",
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 8,
  },
  loseText: {
    color: "#EF4444",
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 8,
  },
  winSubtext: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
    textAlign: "center",
  },
  loseSubtext: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
    textAlign: "center",
  },
  ticketsWonAnimation: {
    color: "#10B981",
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 6,
    textAlign: "center",
  },
  // Estilos para el modal transparente (solo imagen)
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
    width: width * 0.8,
    height: height * 0.6,
    maxWidth: 400,
    maxHeight: 400,
  },
  // NUEVOS ESTILOS para el bloqueo de navegación
  gameInProgressIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#DC2626",
    paddingVertical: 10,
    paddingHorizontal: 16,
    justifyContent: "center",
    borderBottomWidth: 2,
    borderBottomColor: "#B91C1C",
    gap: 8,
  },
  gameInProgressText: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "bold",
    textAlign: "center",
  },
  tabBlocker: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  tabBlockerContent: {
    backgroundColor: '#1a1a1a',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFD700',
    maxWidth: '80%',
  },
  tabBlockerText: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 24,
  },
  tabBlockerSubtext: {
    fontSize: 14,
    fontWeight: 'normal',
    color: '#FFF',
  },
});