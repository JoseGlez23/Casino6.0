// src/games/specialty/CaribbeanStud.js
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
  Alert,
  ScrollView,
  SafeAreaView,
  Vibration,
  Image,
  BackHandler,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useCoins } from "../../context/CoinsContext";
import { Audio } from "expo-av";

const { width, height } = Dimensions.get("window");

// Componente de Modal de Bloqueo - Solo imagen grande con auto-cierre de 3 segundos
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

// Hook de sonidos mejorado
const useGameSounds = () => {
  const [sounds, setSounds] = useState({});

  const loadSounds = async () => {
    try {
      console.log("🔊 Cargando sonidos para Caribbean Stud...");

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      const soundObjects = {};

      const soundTypes = [
        { key: "card", file: require("../../assets/sounds/card.mp3") },
        { key: "click", file: require("../../assets/sounds/click.mp3") },
        { key: "coin", file: require("../../assets/sounds/coin.mp3") },
        { key: "error", file: require("../../assets/sounds/error.mp3") },
        { key: "success", file: require("../../assets/sounds/success.mp3") },
        { key: "shuffle", file: require("../../assets/sounds/shuffle.mp3") },
      ];

      for (const { key, file } of soundTypes) {
        try {
          const soundObject = new Audio.Sound();
          await soundObject.loadAsync(file);
          soundObjects[key] = soundObject;
        } catch (error) {
          console.log(`❌ Error cargando sonido ${key}:`, error);
        }
      }

      setSounds(soundObjects);
    } catch (error) {
      console.log("❌ Error inicializando sistema de sonido:", error);
    }
  };

  const playSound = async (type) => {
    try {
      let soundKey;
      switch (type) {
        case "win":
          soundKey = "success";
          break;
        case "lose":
          soundKey = "error";
          break;
        case "card":
          soundKey = "card";
          break;
        case "chip":
        case "coin":
          soundKey = "coin";
          break;
        case "shuffle":
          soundKey = "shuffle";
          break;
        case "click":
        default:
          soundKey = "click";
      }

      if (sounds[soundKey]) {
        await sounds[soundKey].replayAsync();
      } else {
        playVibration(type);
      }
    } catch (error) {
      playVibration(type);
    }
  };

  const playVibration = (type) => {
    switch (type) {
      case "win":
        Vibration.vibrate([0, 100, 50, 100, 50, 100]);
        break;
      case "lose":
        Vibration.vibrate([0, 300, 100, 300]);
        break;
      case "card":
        Vibration.vibrate(30);
        break;
      case "chip":
      case "coin":
        Vibration.vibrate(20);
        break;
      case "shuffle":
        Vibration.vibrate([0, 50, 30, 50]);
        break;
      case "click":
      default:
        Vibration.vibrate(15);
    }
  };

  useEffect(() => {
    loadSounds();

    return () => {
      Object.values(sounds).forEach((sound) => {
        if (sound) {
          sound.unloadAsync();
        }
      });
    };
  }, []);

  return playSound;
};

// Componente de animación de barajeo mejorado
const ShuffleAnimation = ({ show, onComplete }) => {
  const [rotation] = useState(new Animated.Value(0));
  const [progress] = useState(new Animated.Value(0));
  const [cards] = useState([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0)
  ]);

  useEffect(() => {
    if (show) {
      // Animación de progreso
      Animated.timing(progress, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: false,
      }).start();

      // Animación de rotación continua
      Animated.loop(
        Animated.timing(rotation, {
          toValue: 1,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();

      // Animación de cartas volando
      cards.forEach((cardAnim, index) => {
        Animated.sequence([
          Animated.timing(cardAnim, {
            toValue: 1,
            duration: 300,
            delay: index * 200,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(cardAnim, {
            toValue: 0,
            duration: 300,
            delay: 200,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: true,
          }),
        ]).start();
      });

      // Completar después de 2 segundos
      const timeout = setTimeout(() => {
        onComplete?.();
      }, 2000);

      return () => clearTimeout(timeout);
    } else {
      rotation.setValue(0);
      progress.setValue(0);
      cards.forEach(card => card.setValue(0));
    }
  }, [show]);

  if (!show) return null;

  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const rotateInterpolation = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.shuffleContainer}>
      <Text style={styles.shuffleText}>BARAJANDO CARTAS...</Text>
      
      {/* Barra de progreso */}
      <View style={styles.progressBar}>
        <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
      </View>

      {/* Cartas animadas */}
      <View style={styles.shuffleCardsContainer}>
        {cards.map((cardAnim, index) => {
          const cardStyle = {
            transform: [
              {
                translateY: cardAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -40],
                }),
              },
              {
                rotate: cardAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '15deg'],
                }),
              },
            ],
            opacity: cardAnim.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [0.7, 1, 0.7],
            }),
          };

          return (
            <Animated.View 
              key={index}
              style={[
                styles.shuffleCard,
                cardStyle,
                { zIndex: 3 - index }
              ]}
            >
              <View style={styles.shuffleCardContent}>
                <Text style={styles.shuffleCardPattern}>♠♥♦♣</Text>
              </View>
            </Animated.View>
          );
        })}
      </View>

      {/* Mazo giratorio */}
      <Animated.View 
        style={[
          styles.deck,
          {
            transform: [{ rotate: rotateInterpolation }],
          },
        ]}
      >
        <Text style={styles.deckText}>52</Text>
      </Animated.View>
    </View>
  );
};

// Componente de animación de victoria mejorado
const WinAnimation = ({ show, handName, winAmount }) => {
  const [scaleAnim] = useState(new Animated.Value(0));
  const [pulseAnim] = useState(new Animated.Value(1));
  const [confettiAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (show) {
      // Animación principal
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(confettiAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      ]).start();

      // Animación de pulso continua
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
      ).start();
    } else {
      scaleAnim.setValue(0);
      pulseAnim.setValue(1);
      confettiAnim.setValue(0);
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
      {/* Confeti animado */}
      <Animated.View 
        style={[
          styles.confetti,
          {
            opacity: confettiAnim,
            transform: [
              {
                scale: confettiAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.5, 1],
                })
              }
            ]
          }
        ]}
      >
        <Text style={styles.confettiText}>🎉</Text>
      </Animated.View>

      <Ionicons name="trophy" size={70} color="#FFD700" />
      <Text style={styles.winText}>¡{handName}!</Text>
      <Text style={styles.winAmountText}>+{winAmount} Tickets</Text>
    </Animated.View>
  );
};

// Componente de animación de pérdida mejorado
const LoseAnimation = ({ show }) => {
  const [scaleAnim] = useState(new Animated.Value(0));
  const [shakeAnim] = useState(new Animated.Value(0));
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (show) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(shakeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      ]).start();
    } else {
      scaleAnim.setValue(0);
      shakeAnim.setValue(0);
      fadeAnim.setValue(0);
    }
  }, [show]);

  const shakeInterpolation = shakeAnim.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [0, -15, 15, -15, 0],
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
      <Ionicons name="sad-outline" size={70} color="#EF4444" />
      <Animated.Text 
        style={[
          styles.loseText,
          {
            opacity: fadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 1]
            })
          }
        ]}
      >
        ¡MEJOR SUERTE!
      </Animated.Text>
    </Animated.View>
  );
};

// Función para calcular tickets según apuesta
const getTicketRewards = (betAmount, multiplier = 1) => {
  const baseRewards = {
    10: 12,
    25: 30,
    50: 60,
    100: 120,
  };
  
  const baseTickets = baseRewards[betAmount] || Math.floor(betAmount * 1.2);
  return Math.floor(baseTickets * multiplier);
};

// Evaluación de manos mejorada
const evaluateHand = (cards) => {
  const values = cards.map(card => card.numeric);
  const suits = cards.map(card => card.suit);
  
  // Contar valores y palos
  const valueCounts = getValueCounts(values);
  const suitCounts = getValueCounts(suits);
  
  const maxSameValue = Math.max(...Object.values(valueCounts));
  const maxSameSuit = Math.max(...Object.values(suitCounts));
  const isFlush = maxSameSuit === 5;
  
  // Verificar escalera
  const sortedValues = [...new Set(values)].sort((a, b) => a - b);
  const isStraight = checkStraight(sortedValues);
  
  // Determinar ranking de mano
  if (isFlush && isStraight) {
    // Escalera Real o Escalera de Color
    if (sortedValues.includes(14) && sortedValues.includes(13) && 
        sortedValues.includes(12) && sortedValues.includes(11) && sortedValues.includes(10)) {
      return { rank: 10, name: "ESCALERA REAL", multiplier: 100 };
    }
    return { rank: 9, name: "ESCALERA DE COLOR", multiplier: 50 };
  }
  
  if (maxSameValue === 4) {
    return { rank: 8, name: "PÓKER", multiplier: 20 };
  }
  
  if (maxSameValue === 3 && Object.values(valueCounts).includes(2)) {
    return { rank: 7, name: "FULL HOUSE", multiplier: 7 };
  }
  
  if (isFlush) {
    return { rank: 6, name: "COLOR", multiplier: 5 };
  }
  
  if (isStraight) {
    return { rank: 5, name: "ESCALERA", multiplier: 4 };
  }
  
  if (maxSameValue === 3) {
    return { rank: 4, name: "TRÍO", multiplier: 3 };
  }
  
  const pairs = Object.values(valueCounts).filter(count => count === 2).length;
  if (pairs === 2) {
    return { rank: 3, name: "DOBLE PAREJA", multiplier: 2 };
  }
  
  if (pairs === 1) {
    // Verificar si es pareja de Jotas o mejor
    const pairValue = Object.keys(valueCounts).find(key => valueCounts[key] === 2);
    if (['J', 'Q', 'K', 'A'].includes(pairValue)) {
      return { rank: 2, name: "PAREJA J+", multiplier: 1 };
    }
  }
  
  return { rank: 1, name: "CARTA ALTA", multiplier: 0 };
};

const getValueCounts = (values) => {
  return values.reduce((counts, value) => {
    counts[value] = (counts[value] || 0) + 1;
    return counts;
  }, {});
};

const checkStraight = (sortedValues) => {
  if (sortedValues.length < 5) return false;
  
  // Verificar escalera normal
  for (let i = 0; i <= sortedValues.length - 5; i++) {
    if (sortedValues[i + 4] - sortedValues[i] === 4) return true;
  }
  
  // Verificar escalera con As como 1 (A,2,3,4,5)
  if (sortedValues.includes(14) && sortedValues.includes(2) && 
      sortedValues.includes(3) && sortedValues.includes(4) && sortedValues.includes(5)) {
    return true;
  }
  
  return false;
};

const compareHands = (playerHand, dealerHand) => {
  if (playerHand.rank > dealerHand.rank) return 1;
  if (playerHand.rank < dealerHand.rank) return -1;
  
  // Si mismo rango, comparar por cartas altas
  const playerValues = playerHand.cards.map(c => c.numeric).sort((a, b) => b - a);
  const dealerValues = dealerHand.cards.map(c => c.numeric).sort((a, b) => b - a);
  
  for (let i = 0; i < 5; i++) {
    if (playerValues[i] > dealerValues[i]) return 1;
    if (playerValues[i] < dealerValues[i]) return -1;
  }
  
  return 0; // Empate exacto
};

// Función para determinar si el jugador gana (5% de probabilidad)
const shouldPlayerWin = () => {
  return Math.random() < 0.05;
};

// Función para generar mano ganadora forzada
const generateWinningHand = () => {
  return [
    { value: 'A', suit: '♥', numeric: 14 },
    { value: 'K', suit: '♥', numeric: 13 },
    { value: 'Q', suit: '♥', numeric: 12 },
    { value: 'J', suit: '♥', numeric: 11 },
    { value: '10', suit: '♥', numeric: 10 }
  ];
};

// Función para generar mano perdedora para el dealer
const generateLosingDealerHand = () => {
  return [
    { value: '2', suit: '♠', numeric: 2 },
    { value: '3', suit: '♠', numeric: 3 },
    { value: '4', suit: '♠', numeric: 4 },
    { value: '5', suit: '♠', numeric: 5 },
    { value: '7', suit: '♣', numeric: 7 }
  ];
};

export default function CaribbeanStud({ navigation }) {
  const {
    manekiCoins,
    tickets,
    subtractCoins,
    addCoins,
    addTickets,
    canAfford,
  } = useCoins();
  const playSound = useGameSounds();

  const [bet, setBet] = useState(0);
  const [playerCards, setPlayerCards] = useState([]);
  const [dealerCards, setDealerCards] = useState([]);
  const [gameState, setGameState] = useState("betting");
  const [result, setResult] = useState("");
  const [ticketsWon, setTicketsWon] = useState(0);
  const [showWinAnimation, setShowWinAnimation] = useState(false);
  const [showLoseAnimation, setShowLoseAnimation] = useState(false);
  const [showShuffleAnimation, setShowShuffleAnimation] = useState(false);
  const [gameInProgress, setGameInProgress] = useState(false);
  const [playerHand, setPlayerHand] = useState(null);
  const [dealerHand, setDealerHand] = useState(null);
  const [showBlockModal, setShowBlockModal] = useState(false);

  const cardAnimations = useState(new Animated.Value(0))[0];
  const resultAnimations = useState(new Animated.Value(0))[0];
  const [pulseAnim] = useState(new Animated.Value(1));

  // Bloquear navegación con modal de imagen
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (gameInProgress) {
        setShowBlockModal(true);
        return true;
      }
      return false;
    });

    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (gameInProgress) {
        e.preventDefault();
        setShowBlockModal(true);
      }
    });

    return () => {
      backHandler.remove();
      unsubscribe();
    };
  }, [navigation, gameInProgress]);

  // Bloquear la barra de pestañas con modal de imagen
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
        setShowBlockModal(true);
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

  const handleCloseBlockModal = () => {
    setShowBlockModal(false);
  };

  const cardValues = {
    'A': 14, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, 
    '10': 10, 'J': 11, 'Q': 12, 'K': 13
  };

  const suits = ['♠', '♥', '♦', '♣'];

  const dealCard = () => {
    const values = Object.keys(cardValues);
    const value = values[Math.floor(Math.random() * values.length)];
    const suit = suits[Math.floor(Math.random() * suits.length)];
    return { value, suit, numeric: cardValues[value] };
  };

  const animateCards = () => {
    cardAnimations.setValue(0);
    Animated.timing(cardAnimations, {
      toValue: 1,
      duration: 800,
      easing: Easing.out(Easing.back(1.5)),
      useNativeDriver: true,
    }).start();
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

  const triggerWinAnimation = (handName, winAmount) => {
    setShowWinAnimation(true);
    setTimeout(() => setShowWinAnimation(false), 3000);
  };

  const triggerLoseAnimation = () => {
    setShowLoseAnimation(true);
    setTimeout(() => setShowLoseAnimation(false), 2500);
  };

  // Función cuando termina el barajeo
  const handleShuffleComplete = () => {
    setShowShuffleAnimation(false);
    playSound("card");
    
    setTimeout(() => {
      animateCards();
      dealInitialCards();
    }, 500);
  };

  const dealInitialCards = async () => {
    // Determinar si el jugador ganará (5% de probabilidad)
    const playerWillWin = shouldPlayerWin();
    
    let newPlayerCards, newDealerCards;
    
    if (playerWillWin) {
      // Forzar mano ganadora para el jugador y perdedora para el dealer
      newPlayerCards = generateWinningHand();
      newDealerCards = generateLosingDealerHand();
    } else {
      // Mano normal (95% de probabilidad de perder)
      newPlayerCards = Array(5).fill().map(() => dealCard());
      newDealerCards = Array(5).fill().map(() => dealCard());
    }
    
    // Evaluar manos
    const playerEvaluation = { 
      ...evaluateHand(newPlayerCards), 
      cards: newPlayerCards 
    };
    const dealerEvaluation = { 
      ...evaluateHand(newDealerCards), 
      cards: newDealerCards 
    };
    
    setPlayerCards(newPlayerCards);
    setDealerCards(newDealerCards);
    setPlayerHand(playerEvaluation);
    setDealerHand(dealerEvaluation);
    setGameState("playing");
    setResult("¿RETIRARSE O APOSTAR?");

    // Sonidos de reparto de cartas
    for (let i = 0; i < 3; i++) {
      setTimeout(() => playSound("card"), i * 200);
    }
  };

  const startGame = async (betAmount) => {
    if (!canAfford(betAmount)) {
      await playSound("error");
      Alert.alert("Fondos Insuficientes", "No tienes suficientes Maneki Coins para esta apuesta");
      return;
    }

    setBet(betAmount);
    await subtractCoins(betAmount, `Apuesta en Caribbean Stud`);
    await playSound("coin");
    pulseAnimation();

    // Marcar que el juego está en progreso
    setGameInProgress(true);

    // Mostrar animación de barajeo
    setShowShuffleAnimation(true);
    setResult("BARAJANDO CARTAS...");
    await playSound("shuffle");
  };

  const fold = async () => {
    setResult("Te retiras. Pierdes la apuesta");
    setGameState("result");
    setTicketsWon(0);
    setGameInProgress(false);
    await playSound("lose");
    triggerLoseAnimation();
  };

  const call = async () => {
    await playSound("click");
    pulseAnimation();

    // Revelar cartas del dealer con animación
    setResult("REVELANDO CARTAS...");
    
    setTimeout(async () => {
      const dealerQualifies = dealerHand.rank >= 2 || 
        dealerCards.some(card => card.value === 'A' || card.value === 'K' || card.value === 'Q');
      
      let winAmount = 0;
      let ticketReward = 0;
      let resultMessage = "";

      if (!dealerQualifies) {
        // Dealer no califica - recupera apuesta
        winAmount = bet;
        resultMessage = "MANEKI NO CALIFICA. RECUPERAS TU APUESTA";
        await playSound("click");
      } else {
        const comparison = compareHands(playerHand, dealerHand);
        
        if (comparison > 0) {
          // Jugador gana - solo dar tickets
          ticketReward = getTicketRewards(bet, playerHand.multiplier);
          await addTickets(ticketReward, `Ganancia - ${playerHand.name}`);
          resultMessage = `¡${playerHand.name}! GANAS ${ticketReward} TICKETS`;
          await playSound("win");
          triggerWinAnimation(playerHand.name, ticketReward);
        } else if (comparison < 0) {
          // Dealer gana - NO dar nada
          resultMessage = `MANEKI GANA CON ${dealerHand.name}`;
          ticketReward = 0;
          await playSound("lose");
          triggerLoseAnimation();
        } else {
          // Empate - recupera apuesta
          winAmount = bet;
          resultMessage = "EMPATE. RECUPERAS TU APUESTA";
          await playSound("click");
        }
      }

      // Solo agregar monedas si hay ganancia (solo en casos de recuperación)
      if (winAmount > 0) {
        await addCoins(winAmount, "Recupera apuesta - Caribbean Stud");
      }

      setResult(resultMessage);
      setTicketsWon(ticketReward);
      setGameState("result");
      setGameInProgress(false);
      animateResult();
    }, 1000);
  };

  const resetGame = async () => {
    setBet(0);
    setPlayerCards([]);
    setDealerCards([]);
    setGameState("betting");
    setResult("");
    setTicketsWon(0);
    setShowWinAnimation(false);
    setShowLoseAnimation(false);
    setShowShuffleAnimation(false);
    setPlayerHand(null);
    setDealerHand(null);
    setGameInProgress(false);
    await playSound("click");
  };

  const renderCard = (card, index, hide = false) => {
    const cardAnimation = {
      transform: [
        {
          translateY: cardAnimations.interpolate({
            inputRange: [0, 1],
            outputRange: [-50, 0],
          }),
        },
        {
          scale: cardAnimations.interpolate({
            inputRange: [0, 1],
            outputRange: [0.5, 1],
          }),
        },
        {
          rotate: cardAnimations.interpolate({
            inputRange: [0, 1],
            outputRange: ['-10deg', '0deg'],
          }),
        },
      ],
      opacity: cardAnimations,
    };

    const getCardColor = (suit) => {
      return suit === "♥" || suit === "♦" ? "#DC2626" : "#000000";
    };

    return (
      <Animated.View 
        key={index} 
        style={[
          styles.card, 
          cardAnimation,
          { zIndex: 5 - index }
        ]}
      >
        {hide ? (
          <View style={styles.hiddenCard}>
            <View style={styles.cardBackPattern}>
              <Text style={styles.cardBackText}>MANEKI</Text>
              <View style={styles.cardBackDesign} />
            </View>
          </View>
        ) : (
          <>
            <Text style={[styles.cardValue, { color: getCardColor(card.suit) }]}>
              {card.value}
            </Text>
            <Text style={[styles.cardSuit, { color: getCardColor(card.suit) }]}>
              {card.suit}
            </Text>
            <View style={styles.cardCorner}>
              <Text style={[styles.cardCornerValue, { color: getCardColor(card.suit) }]}>
                {card.value}
              </Text>
              <Text style={[styles.cardCornerSuit, { color: getCardColor(card.suit) }]}>
                {card.suit}
              </Text>
            </View>
          </>
        )}
      </Animated.View>
    );
  };

  const betAmounts = [10, 25, 50, 100];

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Modal de bloqueo con imagen */}
      <BlockModal visible={showBlockModal} onClose={handleCloseBlockModal} />

      {/* Animaciones */}
      <ShuffleAnimation show={showShuffleAnimation} onComplete={handleShuffleComplete} />
      <WinAnimation show={showWinAnimation} />
      <LoseAnimation show={showLoseAnimation} />

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
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.balancesContainer}>
            <View style={styles.balanceRow}>
              <View style={styles.balanceItem}>
                <View style={styles.coinsDisplay}>
                  <Image source={require("../../assets/dinero.png")} style={styles.coinIcon} />
                  <Text style={styles.balanceText}>{manekiCoins.toLocaleString()}</Text>
                </View>
              </View>
              <View style={styles.balanceItem}>
                <View style={styles.ticketsDisplay}>
                  <Image source={require("../../assets/TICKET.png")} style={styles.ticketIcon} />
                  <Text style={styles.balanceText}>{tickets.toLocaleString()}</Text>
                </View>
              </View>
            </View>
          </View>
          <View style={styles.emptySpace} />
        </View>

        {/* Cartas del Dealer */}
        <View style={styles.area}>
          <View style={styles.areaHeader}>
            <Text style={styles.areaTitle}>MANEKI</Text>
            <Text style={styles.areaScore}>
              {dealerHand ? dealerHand.name : (gameState === "playing" ? "???" : "")}
            </Text>
          </View>
          <View style={styles.cardsContainer}>
            {dealerCards.map((card, index) => 
              renderCard(card, index, gameState === "playing")
            )}
          </View>
        </View>

        {/* Mensaje y resultado */}
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
            },
          ]}
        >
          <Text style={styles.message}>
            {result || (gameState === "betting" ? "SELECCIONE SU APUESTA" : "")}
          </Text>
          {ticketsWon > 0 && gameState === "result" && (
            <View style={styles.ticketsWonContainer}>
              <Ionicons name="ticket" size={16} color="#10B981" />
              <Text style={styles.ticketsWonText}>+{ticketsWon} Tickets</Text>
            </View>
          )}
        </Animated.View>

        {/* Cartas del Jugador */}
        <View style={styles.area}>
          <View style={styles.areaHeader}>
            <Text style={styles.areaTitle}>JUGADOR</Text>
            <Text style={styles.areaScore}>
              {playerHand ? playerHand.name : ""}
            </Text>
          </View>
          <View style={styles.cardsContainer}>
            {playerCards.map((card, index) => renderCard(card, index))}
          </View>
        </View>

        {/* Controles del juego */}
        <View style={styles.controls}>
          {gameState === "betting" && (
            <View style={styles.betContainer}>
              <Text style={styles.betTitle}>SELECCIONE SU APUESTA</Text>
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
                        await playSound("click");
                        pulseAnimation();
                      } else {
                        await playSound("error");
                      }
                    }}
                    disabled={!canAfford(amount)}
                  >
                    <Text style={styles.betAmountText}>{amount.toLocaleString()}</Text>
                    <Text style={styles.ticketRewardText}>
                      +{getTicketRewards(amount, 1)} tickets
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.currentBet}>
                {bet > 0 ? `Apuesta: ${bet.toLocaleString()} MC` : "Seleccione un monto"}
              </Text>
              <TouchableOpacity
                style={[styles.startButton, bet === 0 && styles.disabledButton]}
                onPress={() => bet > 0 && startGame(bet)}
                disabled={bet === 0}
              >
                <Ionicons name="play" size={20} color="#FFF" />
                <Text style={styles.startButtonText}>INICIAR JUEGO</Text>
              </TouchableOpacity>
            </View>
          )}

          {gameState === "playing" && (
            <View style={styles.gameButtons}>
              <TouchableOpacity style={styles.foldButton} onPress={fold}>
                <Ionicons name="exit-outline" size={20} color="#FFF" />
                <Text style={styles.actionButtonText}>RETIRARSE</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.callButton} onPress={call}>
                <Ionicons name="trending-up" size={20} color="#FFF" />
                <Text style={styles.actionButtonText}>APOSTAR</Text>
              </TouchableOpacity>
            </View>
          )}

          {gameState === "result" && (
            <View style={styles.endButtons}>
              <TouchableOpacity style={styles.playAgainButton} onPress={resetGame}>
                <Ionicons name="refresh" size={20} color="#FFF" />
                <Text style={styles.playAgainText}>JUGAR DE NUEVO</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Tabla de pagos */}
        <View style={styles.payouts}>
          <Text style={styles.payoutsTitle}>TABLA DE PREMIOS</Text>
          <View style={styles.payoutGrid}>
            <View style={styles.payoutRow}>
              <Text style={styles.payoutHand}>ESCALERA REAL</Text>
              <Text style={styles.payoutMultiplier}>100x</Text>
            </View>
            <View style={styles.payoutRow}>
              <Text style={styles.payoutHand}>ESCALERA DE COLOR</Text>
              <Text style={styles.payoutMultiplier}>50x</Text>
            </View>
            <View style={styles.payoutRow}>
              <Text style={styles.payoutHand}>PÓKER</Text>
              <Text style={styles.payoutMultiplier}>20x</Text>
            </View>
            <View style={styles.payoutRow}>
              <Text style={styles.payoutHand}>FULL HOUSE</Text>
              <Text style={styles.payoutMultiplier}>7x</Text>
            </View>
            <View style={styles.payoutRow}>
              <Text style={styles.payoutHand}>COLOR</Text>
              <Text style={styles.payoutMultiplier}>5x</Text>
            </View>
            <View style={styles.payoutRow}>
              <Text style={styles.payoutHand}>ESCALERA</Text>
              <Text style={styles.payoutMultiplier}>4x</Text>
            </View>
            <View style={styles.payoutRow}>
              <Text style={styles.payoutHand}>TRÍO</Text>
              <Text style={styles.payoutMultiplier}>3x</Text>
            </View>
            <View style={styles.payoutRow}>
              <Text style={styles.payoutHand}>DOBLE PAREJA</Text>
              <Text style={styles.payoutMultiplier}>2x</Text>
            </View>
            <View style={styles.payoutRow}>
              <Text style={styles.payoutHand}>PAREJA J+</Text>
              <Text style={styles.payoutMultiplier}>1x</Text>
            </View>
          </View>
          <Text style={styles.payoutNote}>
            * Maneki debe tener A-K-Q o mejor para calificar
          </Text>
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
    marginBottom: 20,
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
    paddingVertical: 8,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#FFD700",
    gap: 6,
    minWidth: 85,
  },
  ticketsDisplay: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1A1A",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#10B981",
    gap: 6,
    minWidth: 85,
  },
  coinIcon: {
    width: 16,
    height: 16,
    resizeMode: "contain",
  },
  ticketIcon: {
    width: 16,
    height: 16,
    resizeMode: "contain",
  },
  balanceText: {
    color: "#FFD700",
    fontSize: 13,
    fontWeight: "bold",
  },
  emptySpace: {
    width: 85,
  },
  area: {
    backgroundColor: "rgba(26, 26, 26, 0.9)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "#333",
    minHeight: 150,
  },
  areaHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  areaTitle: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  areaScore: {
    color: "#FFD700",
    fontSize: 13,
    fontWeight: "bold",
    backgroundColor: "rgba(139, 0, 0, 0.3)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FFD700",
  },
  cardsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
  },
  card: {
    width: 60,
    height: 84,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    position: "relative",
  },
  cardValue: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  cardSuit: {
    fontSize: 20,
  },
  cardCorner: {
    position: "absolute",
    top: 4,
    left: 4,
    alignItems: "center",
  },
  cardCornerValue: {
    fontSize: 9,
    fontWeight: "bold",
  },
  cardCornerSuit: {
    fontSize: 7,
  },
  hiddenCard: {
    width: "100%",
    height: "100%",
    backgroundColor: "#8B0000",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  cardBackPattern: {
    width: "80%",
    height: "80%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#A52A2A",
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#FFF",
  },
  cardBackText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "bold",
    marginBottom: 4,
  },
  cardBackDesign: {
    width: 20,
    height: 20,
    backgroundColor: "#FFF",
    borderRadius: 10,
    opacity: 0.3,
  },
  messageContainer: {
    alignItems: "center",
    marginVertical: 16,
    padding: 16,
    backgroundColor: "rgba(26, 26, 26, 0.9)",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#FFD700",
    minHeight: 70,
    justifyContent: "center",
  },
  message: {
    color: "#FFD700",
    fontSize: 15,
    fontWeight: "bold",
    textAlign: "center",
    lineHeight: 20,
  },
  ticketsWonContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    backgroundColor: "rgba(16, 185, 129, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#10B981",
    gap: 6,
  },
  ticketsWonText: {
    color: "#10B981",
    fontSize: 13,
    fontWeight: "bold",
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
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  betAmounts: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    marginBottom: 16,
    gap: 10,
  },
  betAmountButton: {
    backgroundColor: "#2A2A2A",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#444",
    minWidth: 95,
  },
  selectedBet: {
    borderColor: "#FFD700",
    backgroundColor: "rgba(255, 215, 0, 0.1)",
  },
  betAmountText: {
    color: "#FFD700",
    fontSize: 15,
    fontWeight: "bold",
  },
  ticketRewardText: {
    color: "#10B981",
    fontSize: 11,
    marginTop: 3,
    textAlign: "center",
  },
  currentBet: {
    color: "#FFD700",
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
    backgroundColor: "rgba(139, 0, 0, 0.3)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#FFD700",
  },
  startButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#10B981",
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: "#059669",
    gap: 10,
  },
  startButtonText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  gameButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  foldButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#DC2626",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: "#B91C1C",
    flex: 1,
    justifyContent: "center",
    gap: 8,
  },
  callButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2563EB",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: "#1D4ED8",
    flex: 1,
    justifyContent: "center",
    gap: 8,
  },
  actionButtonText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 14,
  },
  endButtons: {
    alignItems: "center",
  },
  playAgainButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#10B981",
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: "#059669",
    gap: 10,
  },
  playAgainText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  payouts: {
    backgroundColor: "rgba(26, 26, 26, 0.9)",
    padding: 18,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#333",
  },
  payoutsTitle: {
    color: "#FFD700",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 14,
    textAlign: "center",
  },
  payoutGrid: {
    gap: 6,
  },
  payoutRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  payoutHand: {
    color: "#FFF",
    fontSize: 13,
    flex: 2,
  },
  payoutMultiplier: {
    color: "#10B981",
    fontSize: 13,
    fontWeight: "bold",
    flex: 1,
    textAlign: "right",
  },
  payoutNote: {
    color: "#888",
    fontSize: 11,
    textAlign: "center",
    marginTop: 12,
    fontStyle: "italic",
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
    top: "40%",
    left: "50%",
    marginLeft: -120,
    marginTop: -90,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    backgroundColor: "rgba(0, 0, 0, 0.92)",
    padding: 28,
    borderRadius: 24,
    borderWidth: 4,
    width: 240,
    height: 180,
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
    marginTop: 8,
    textAlign: "center",
  },
  winAmountText: {
    color: "#10B981",
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 4,
  },
  loseText: {
    color: "#EF4444",
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 8,
    textAlign: "center",
  },
  confetti: {
    position: "absolute",
    top: -20,
    right: -20,
  },
  confettiText: {
    fontSize: 24,
  },
  // Estilos para animación de barajeo
  shuffleContainer: {
    position: "absolute",
    top: "35%",
    left: "50%",
    marginLeft: -120,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    backgroundColor: "rgba(0, 0, 0, 0.95)",
    padding: 28,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: "#FFD700",
    width: 240,
    minHeight: 160,
  },
  shuffleText: {
    color: "#FFD700",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#333',
    borderRadius: 4,
    marginVertical: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFD700',
    borderRadius: 4,
  },
  shuffleCardsContainer: {
    flexDirection: "row",
    marginBottom: 16,
    position: "relative",
    height: 60,
  },
  shuffleCard: {
    width: 45,
    height: 60,
    backgroundColor: "#1a365d",
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#2d3748",
    position: "absolute",
    left: 0,
    right: 0,
    marginHorizontal: "auto",
  },
  shuffleCardContent: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shuffleCardPattern: {
    color: "#e53e3e",
    fontSize: 14,
    fontWeight: "bold",
    textAlign: 'center',
  },
  deck: {
    width: 50,
    height: 70,
    backgroundColor: "#8B0000",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#A52A2A",
  },
  deckText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  // Estilos para el indicador de juego en progreso
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
  // NUEVOS ESTILOS PARA EL MODAL TRANSPARENTE
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
});