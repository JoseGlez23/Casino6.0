// src/games/specialty/ThreeCardPoker.js
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
  const [soundEnabled, setSoundEnabled] = useState(true);

  const loadSounds = async () => {
    try {
      console.log("🔊 Cargando sonidos para Three Card Poker...");

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
        { key: "chip", file: require("../../assets/sounds/chip.mp3") },
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
    if (!soundEnabled) return;
    
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
        case "shuffle":
          soundKey = "shuffle";
          break;
        case "chip":
        case "coin":
          soundKey = "coin";
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
      case "shuffle":
        Vibration.vibrate([0, 50, 20, 50]);
        break;
      case "chip":
      case "coin":
        Vibration.vibrate(20);
        break;
      case "click":
      default:
        Vibration.vibrate(15);
    }
  };

  const toggleSound = () => setSoundEnabled(!soundEnabled);

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

  return { playSound, soundEnabled, toggleSound };
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
          duration: 600,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();

      // Animación de cartas volando
      const cardAnimations = cards.map((anim, index) =>
        Animated.sequence([
          Animated.delay(index * 200),
          Animated.parallel([
            Animated.timing(anim, {
              toValue: 1,
              duration: 400,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
            Animated.timing(anim, {
              toValue: 0,
              duration: 400,
              delay: 600,
              easing: Easing.in(Easing.cubic),
              useNativeDriver: true,
            })
          ])
        ])
      );

      Animated.stagger(150, cardAnimations).start();

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

      {/* Cartas giratorias */}
      <View style={styles.shuffleCardsContainer}>
        {cards.map((cardAnim, index) => {
          const cardStyle = {
            transform: [
              {
                translateY: cardAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -30],
                }),
              },
              {
                rotate: rotateInterpolation,
              },
              {
                scale: cardAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1.2],
                }),
              }
            ],
            opacity: cardAnim.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [0, 1, 0],
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
    </View>
  );
};

// Componente de animación de victoria mejorado
const WinAnimation = ({ show, ticketsWon }) => {
  const [scaleAnim] = useState(new Animated.Value(0));
  const [pulseAnim] = useState(new Animated.Value(1));
  const [confettiAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (show) {
      // Animación principal
      Animated.sequence([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(confettiAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start();

      // Animación de pulso continua
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
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
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <Ionicons name="trophy" size={80} color="#FFD700" />
      </Animated.View>
      <Text style={styles.winText}>¡GANASTE!</Text>
      {ticketsWon > 0 && (
        <Animated.Text 
          style={[
            styles.ticketsWonAnimation,
            { opacity: confettiAnim }
          ]}
        >
          +{ticketsWon} Tickets
        </Animated.Text>
      )}
    </Animated.View>
  );
};

// Componente de animación de pérdida mejorado
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
        Animated.sequence([
          Animated.timing(shakeAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: -1, duration: 100, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: -1, duration: 100, useNativeDriver: true }),
          Animated.timing(shakeAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
        ])
      ]).start();
    } else {
      scaleAnim.setValue(0);
      shakeAnim.setValue(0);
    }
  }, [show]);

  const shakeInterpolation = shakeAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: [-10, 0, 10],
  });

  if (!show) return null;

  return (
    <Animated.View
      style={[
        styles.animationContainer,
        styles.loseAnimation,
        {
          transform: [
            { scale: scaleAnim }, 
            { translateX: shakeInterpolation }
          ],
        },
      ]}
    >
      <Ionicons name="close-circle" size={80} color="#EF4444" />
      <Text style={styles.loseText}>¡PERDISTE!</Text>
    </Animated.View>
  );
};

// Componente de animación de reparto de cartas
const CardDealAnimation = ({ cards, position, onComplete }) => {
  const [animatedCards, setAnimatedCards] = useState([]);

  useEffect(() => {
    if (cards.length === 0) return;

    // Inicializar animaciones para cada carta
    const cardAnimations = cards.map((_, index) => new Animated.Value(0));
    setAnimatedCards(cardAnimations);

    // Animar cartas en secuencia
    const animations = cardAnimations.map((anim, index) =>
      Animated.sequence([
        Animated.delay(index * 200),
        Animated.spring(anim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        })
      ])
    );

    Animated.stagger(150, animations).start(() => {
      if (onComplete) onComplete();
    });
  }, [cards]);

  if (cards.length === 0 || animatedCards.length === 0) return null;

  return (
    <View style={styles.cardsContainer}>
      {cards.map((card, index) => {
        const cardAnimation = animatedCards[index];
        
        if (!cardAnimation) return null;

        const animatedStyle = {
          transform: [
            {
              translateY: cardAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [position === 'dealer' ? -100 : 100, 0],
              }),
            },
            {
              scale: cardAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [0.5, 1],
              }),
            },
            {
              rotate: cardAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: ['-5deg', '0deg'],
              }),
            }
          ],
          opacity: cardAnimation,
        };

        return (
          <Animated.View key={index} style={[styles.card, animatedStyle]}>
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
          </Animated.View>
        );
      })}
    </View>
  );
};

// Función auxiliar para color de cartas
const getCardColor = (suit) => {
  return suit === "♥" || suit === "♦" ? "#DC2626" : "#000000";
};

// Función para calcular tickets según apuesta
const getTicketRewards = (betAmount, isWin = false, handMultiplier = 1) => {
  const baseRewards = {
    10: 10,
    25: 25,
    50: 50,
    100: 100,
  };
  
  const baseTickets = baseRewards[betAmount] || betAmount;
  return isWin ? Math.floor(baseTickets * handMultiplier) : 0;
};

// Evaluación de manos mejorada para Three Card Poker
const evaluateThreeCardHand = (cards) => {
  const values = cards.map(c => c.numeric).sort((a, b) => a - b);
  const suits = cards.map(c => c.suit);
  
  // Verificar escalera de color (Straight Flush)
  const isSameSuit = new Set(suits).size === 1;
  const isStraight = values[2] - values[0] === 2 || 
                    (values[0] === 2 && values[1] === 3 && values[2] === 14); // A-2-3
  
  if (isSameSuit && isStraight) {
    return { rank: 6, name: 'ESCALERA DE COLOR', multiplier: 5 };
  }
  
  // Trío (Three of a Kind)
  if (values[0] === values[1] && values[1] === values[2]) {
    return { rank: 5, name: 'TRÍO', multiplier: 4 };
  }
  
  // Escalera (Straight)
  if (isStraight) {
    return { rank: 4, name: 'ESCALERA', multiplier: 2 };
  }
  
  // Color (Flush)
  if (isSameSuit) {
    return { rank: 3, name: 'COLOR', multiplier: 1.5 };
  }
  
  // Par (Pair)
  if (values[0] === values[1] || values[1] === values[2] || values[0] === values[2]) {
    return { rank: 2, name: 'PAR', multiplier: 1 };
  }
  
  // Carta alta
  return { rank: 1, name: 'CARTA ALTA', multiplier: 0.5 };
};

// Comparar manos para determinar ganador
const compareHands = (playerHand, dealerHand) => {
  if (playerHand.rank > dealerHand.rank) return 1;
  if (playerHand.rank < dealerHand.rank) return -1;
  
  // Si mismo rango, comparar por cartas altas
  const playerValues = playerHand.cards.map(c => c.numeric).sort((a, b) => b - a);
  const dealerValues = dealerHand.cards.map(c => c.numeric).sort((a, b) => b - a);
  
  for (let i = 0; i < 3; i++) {
    if (playerValues[i] > dealerValues[i]) return 1;
    if (playerValues[i] < dealerValues[i]) return -1;
  }
  
  return 0; // Empate exacto
};

// Función para determinar si el dealer califica
const dealerQualifies = (dealerHand) => {
  // Dealer debe tener al menos Q-high para calificar
  const highCard = Math.max(...dealerHand.cards.map(c => c.numeric));
  return dealerHand.rank >= 2 || highCard >= 12; // Par o Q-high o mejor
};

// Función para determinar si el jugador gana (probabilidad ajustable)
const shouldPlayerWin = (difficulty = "normal") => {
  const probabilities = {
    easy: 0.15,    // 15%
    normal: 0.05,  // 5%
    hard: 0.02     // 2%
  };
  
  return Math.random() < (probabilities[difficulty] || probabilities.normal);
};

// Función para generar mano ganadora forzada
const generateWinningHand = () => {
  // Crear una mano que garantice victoria (escalera de color)
  return [
    { value: 'A', suit: '♥', numeric: 14 },
    { value: 'K', suit: '♥', numeric: 13 },
    { value: 'Q', suit: '♥', numeric: 12 }
  ];
};

// Función para generar mano perdedora para el dealer
const generateLosingDealerHand = () => {
  // Crear una mano que no califique (carta alta baja)
  return [
    { value: '2', suit: '♠', numeric: 2 },
    { value: '4', suit: '♦', numeric: 4 },
    { value: '7', suit: '♣', numeric: 7 }
  ];
};

// Función para generar mano perdedora para el jugador
const generateLosingPlayerHand = () => {
  // Crear una mano que probablemente pierda
  return [
    { value: '2', suit: '♠', numeric: 2 },
    { value: '5', suit: '♦', numeric: 5 },
    { value: '8', suit: '♣', numeric: 8 }
  ];
};

export default function ThreeCardPoker({ navigation }) {
  const {
    manekiCoins,
    tickets,
    subtractCoins,
    addCoins,
    addTickets,
    canAfford,
  } = useCoins();
  const { playSound, soundEnabled, toggleSound } = useGameSounds();

  const [bet, setBet] = useState(0);
  const [playerCards, setPlayerCards] = useState([]);
  const [dealerCards, setDealerCards] = useState([]);
  const [gameState, setGameState] = useState("betting");
  const [result, setResult] = useState("");
  const [ticketsWon, setTicketsWon] = useState(0);
  const [showWinAnimation, setShowWinAnimation] = useState(false);
  const [showLoseAnimation, setShowLoseAnimation] = useState(false);
  const [showShuffleAnimation, setShowShuffleAnimation] = useState(false);
  const [playerHand, setPlayerHand] = useState(null);
  const [dealerHand, setDealerHand] = useState(null);
  const [gameInProgress, setGameInProgress] = useState(false);
  const [dealingCards, setDealingCards] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false); // NUEVO ESTADO

  const resultAnimations = useState(new Animated.Value(0))[0];
  const [pulseAnim] = useState(new Animated.Value(1));

  // MODIFICADO: Bloquear navegación con modal de imagen
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        if (gameInProgress) {
          setShowBlockModal(true); // MOSTRAR MODAL EN VEZ DE ALERTA
          return true;
        }
        return false;
      }
    );

    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (gameInProgress) {
        e.preventDefault();
        setShowBlockModal(true); // MOSTRAR MODAL EN VEZ DE BLOQUEADOR
      }
    });

    return () => {
      backHandler.remove();
      unsubscribe();
    };
  }, [navigation, gameInProgress]);

  // MODIFICADO: Bloquear la barra de pestañas con modal de imagen
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
        setShowBlockModal(true); // MOSTRAR MODAL EN VEZ DE BLOQUEADOR
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

  // AÑADIR FUNCIÓN PARA CERRAR EL MODAL
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

  const triggerWinAnimation = (tickets) => {
    setShowWinAnimation(true);
    setTimeout(() => setShowWinAnimation(false), 3000);
  };

  const triggerLoseAnimation = () => {
    setShowLoseAnimation(true);
    setTimeout(() => setShowLoseAnimation(false), 3000);
  };

  // Función cuando termina el barajeo
  const handleShuffleComplete = () => {
    setShowShuffleAnimation(false);
    setDealingCards(true);
    setResult("REPARTIENDO CARTAS...");
  };

  // Función cuando terminan de repartirse las cartas del dealer
  const handleDealerDealComplete = () => {
    // Pequeña pausa antes de mostrar las cartas del jugador
    setTimeout(() => {
      setGameState("playing");
      setResult("¿RETIRARSE O JUGAR?");
    }, 500);
  };

  // Función cuando terminan de repartirse las cartas del jugador
  const handlePlayerDealComplete = () => {
    // Las cartas del jugador se muestran inmediatamente
  };

  const startGame = async (betAmount) => {
    if (!canAfford(betAmount)) {
      await playSound("error");
      Alert.alert(
        "Fondos Insuficientes",
        "No tienes suficientes Maneki Coins para esta apuesta"
      );
      return;
    }

    setBet(betAmount);
    await subtractCoins(betAmount, `Apuesta en Three Card Poker`);
    await playSound("coin");
    pulseAnimation();

    setGameInProgress(true);

    // Mostrar animación de barajeo
    setShowShuffleAnimation(true);
    setResult("BARAJANDO CARTAS...");
    await playSound("shuffle");
  };

  // Generar cartas después del barajeo
  useEffect(() => {
    if (dealingCards) {
      // Determinar si el jugador ganará
      const playerWillWin = shouldPlayerWin("normal");
      
      let newPlayerCards, newDealerCards;
      
      if (playerWillWin) {
        // Forzar mano ganadora para el jugador y perdedora para el dealer
        newPlayerCards = generateWinningHand();
        newDealerCards = generateLosingDealerHand();
      } else {
        // Mano normal (95% de probabilidad de perder)
        newPlayerCards = generateLosingPlayerHand();
        newDealerCards = Array(3).fill().map(() => dealCard());
        
        // Asegurar que el dealer tenga una mano decente
        const dealerEvaluation = evaluateThreeCardHand(newDealerCards);
        if (!dealerQualifies({ ...dealerEvaluation, cards: newDealerCards })) {
          // Si el dealer no califica, mejorar su mano
          newDealerCards = [dealCard(), dealCard(), dealCard()];
        }
      }
      
      const playerEvaluation = { 
        ...evaluateThreeCardHand(newPlayerCards), 
        cards: newPlayerCards 
      };
      const dealerEvaluation = { 
        ...evaluateThreeCardHand(newDealerCards), 
        cards: newDealerCards 
      };
      
      setPlayerCards(newPlayerCards);
      setDealerCards(newDealerCards);
      setPlayerHand(playerEvaluation);
      setDealerHand(dealerEvaluation);

      // Reproducir sonidos de cartas
      setTimeout(async () => await playSound("card"), 300);
      setTimeout(async () => await playSound("card"), 600);
      setTimeout(async () => await playSound("card"), 900);
    }
  }, [dealingCards]);

  const fold = async () => {
    setResult("Te retiras. Pierdes la apuesta");
    setGameState("result");
    setTicketsWon(0);
    setGameInProgress(false);
    await playSound("lose");
    triggerLoseAnimation();
    animateResult();
  };

  const play = async () => {
    const qualifies = dealerQualifies(dealerHand);
    
    let winAmount = 0;
    let ticketReward = 0;
    let resultMessage = "";
    let isWin = false;
    let isLose = false;

    if (!qualifies) {
      // Dealer no califica - recupera apuesta
      winAmount = bet;
      resultMessage = "MANEKI NO CALIFICA. RECUPERAS TU APUESTA";
      ticketReward = 0;
      await playSound("click");
    } else {
      const comparison = compareHands(playerHand, dealerHand);
      
      if (comparison > 0) {
        // JUGADOR GANA - solo dar tickets, NO coins
        ticketReward = getTicketRewards(bet, true, playerHand.multiplier);
        
        await addTickets(ticketReward, `Ganancia - ${playerHand.name}`);
        
        resultMessage = `¡${playerHand.name}! GANAS ${ticketReward} Tickets`;
        isWin = true;
        await playSound("win");
      } else if (comparison < 0) {
        // JUGADOR PIERDE - NO dar nada
        resultMessage = `MANEKI GANA CON ${dealerHand.name}`;
        ticketReward = 0;
        isLose = true;
        await playSound("lose");
      } else {
        // Empate - recupera apuesta pero NO dar tickets
        winAmount = bet;
        resultMessage = "EMPATE. RECUPERAS TU APUESTA";
        ticketReward = 0;
        await playSound("click");
      }
    }

    // Solo agregar monedas si hay ganancia (solo en casos de recuperación)
    if (winAmount > 0) {
      await addCoins(winAmount, "Recupera apuesta - Three Card Poker");
    }

    setResult(resultMessage);
    setTicketsWon(ticketReward);
    setGameState("result");
    setGameInProgress(false);
    animateResult();
    pulseAnimation();

    if (isWin) triggerWinAnimation(ticketReward);
    else if (isLose) triggerLoseAnimation();
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
    setDealingCards(false);
    await playSound("click");
  };

  const renderCard = (card, index) => {
    const getCardColor = (suit) => {
      return suit === "♥" || suit === "♦" ? "#DC2626" : "#000000";
    };

    return (
      <View key={index} style={styles.card}>
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
      </View>
    );
  };

  const betAmounts = [10, 25, 50, 100];

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* AÑADIR MODAL DE BLOQUEO */}
      <BlockModal visible={showBlockModal} onClose={handleCloseBlockModal} />

      {/* Animaciones */}
      <WinAnimation show={showWinAnimation} ticketsWon={ticketsWon} />
      <LoseAnimation show={showLoseAnimation} />
      <ShuffleAnimation show={showShuffleAnimation} onComplete={handleShuffleComplete} />

      {/* ELIMINAR BLOQUEADOR DE PESTAÑAS ORIGINAL */}

      {/* Indicador de juego en progreso */}
      {gameInProgress && (
        <View style={styles.gameInProgressIndicator}>
          <Text style={styles.gameInProgressText}>
            ⚠️ PARTIDA EN CURSO - NO PUEDES SALIR
          </Text>
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header mejorado */}
        <View style={styles.header}>
          <View style={styles.balancesContainer}>
            <View style={styles.balanceRow}>
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

          {/* Botón de sonido */}
          <TouchableOpacity onPress={toggleSound} style={styles.soundButton}>
            <Ionicons 
              name={soundEnabled ? "volume-high" : "volume-mute"} 
              size={24} 
              color="#FFD700" 
            />
          </TouchableOpacity>
        </View>

        {/* Cartas de Maneki */}
        {dealerCards.length > 0 && (
          <View style={styles.area}>
            <View style={styles.areaHeader}>
              <Text style={styles.areaTitle}>MANEKI</Text>
              <Text style={styles.areaScore}>
                {dealerHand ? dealerHand.name : ""}
              </Text>
            </View>
            
            {dealingCards ? (
              <CardDealAnimation 
                cards={dealerCards} 
                position="dealer"
                onComplete={handleDealerDealComplete}
              />
            ) : (
              <View style={styles.cardsContainer}>
                {dealerCards.map((card, index) => renderCard(card, index))}
              </View>
            )}
          </View>
        )}

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
              <Text style={styles.ticketsWonText}>+{ticketsWon} Tickets</Text>
            </View>
          )}
        </Animated.View>

        {/* Cartas del Jugador */}
        {playerCards.length > 0 && (
          <View style={styles.area}>
            <View style={styles.areaHeader}>
              <Text style={styles.areaTitle}>JUGADOR</Text>
              <Text style={styles.areaScore}>
                {playerHand ? playerHand.name : ""}
              </Text>
            </View>
            
            {dealingCards ? (
              <CardDealAnimation 
                cards={playerCards} 
                position="player"
                onComplete={handlePlayerDealComplete}
              />
            ) : (
              <View style={styles.cardsContainer}>
                {playerCards.map((card, index) => renderCard(card, index))}
              </View>
            )}
          </View>
        )}

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
                    <Text style={styles.betAmountText}>
                      {amount.toLocaleString()}
                    </Text>
                    <Text style={styles.ticketRewardText}>
                      +{getTicketRewards(amount, true)} tickets
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.currentBet}>
                {bet > 0
                  ? `Apuesta: ${bet.toLocaleString()} MC`
                  : "Seleccione un monto"}
              </Text>

              <TouchableOpacity
                style={[styles.startButton, bet === 0 && styles.disabledButton]}
                onPress={() => bet > 0 && startGame(bet)}
                disabled={bet === 0}
              >
                <Ionicons name="play" size={18} color="#FFF" />
                <Text style={styles.startButtonText}>INICIAR JUEGO</Text>
              </TouchableOpacity>
            </View>
          )}

          {gameState === "playing" && (
            <View style={styles.gameButtons}>
              <TouchableOpacity style={styles.foldButton} onPress={fold}>
                <Ionicons name="exit-outline" size={18} color="#FFF" />
                <Text style={styles.actionButtonText}>RETIRARSE</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.playButton} onPress={play}>
                <Ionicons name="game-controller" size={18} color="#FFF" />
                <Text style={styles.actionButtonText}>JUGAR</Text>
              </TouchableOpacity>
            </View>
          )}

          {gameState === "result" && (
            <View style={styles.endButtons}>
              <TouchableOpacity
                style={styles.playAgainButton}
                onPress={resetGame}
              >
                <Ionicons name="refresh" size={18} color="#FFF" />
                <Text style={styles.playAgainText}>JUGAR DE NUEVO</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Tabla de pagos */}
        <View style={styles.payouts}>
          <Text style={styles.payoutsTitle}>JERARQUÍA DE MANOS</Text>
          <View style={styles.payoutRow}>
            <Text style={styles.payoutHand}>ESCALERA DE COLOR</Text>
            <Text style={styles.payoutMultiplier}>5x</Text>
          </View>
          <View style={styles.payoutRow}>
            <Text style={styles.payoutHand}>TRÍO</Text>
            <Text style={styles.payoutMultiplier}>4x</Text>
          </View>
          <View style={styles.payoutRow}>
            <Text style={styles.payoutHand}>ESCALERA</Text>
            <Text style={styles.payoutMultiplier}>2x</Text>
          </View>
          <View style={styles.payoutRow}>
            <Text style={styles.payoutHand}>COLOR</Text>
            <Text style={styles.payoutMultiplier}>1.5x</Text>
          </View>
          <View style={styles.payoutRow}>
            <Text style={styles.payoutHand}>PAR</Text>
            <Text style={styles.payoutMultiplier}>1x</Text>
          </View>
          <Text style={styles.payoutNote}>Maneki debe tener Q-high o mejor para calificar</Text>
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
  soundButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "#1A1A1A",
    borderWidth: 1,
    borderColor: "#FFD700",
  },
  area: {
    backgroundColor: "rgba(26, 26, 26, 0.9)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#333",
    minHeight: 140,
  },
  areaHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  areaTitle: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  areaScore: {
    color: "#FFD700",
    fontSize: 12,
    fontWeight: "bold",
    backgroundColor: "rgba(139, 0, 0, 0.3)",
    paddingHorizontal: 10,
    paddingVertical: 4,
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
    width: 65,
    height: 90,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    position: "relative",
  },
  cardValue: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 2,
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
    fontSize: 8,
    fontWeight: "bold",
  },
  cardCornerSuit: {
    fontSize: 6,
  },
  messageContainer: {
    alignItems: "center",
    marginVertical: 10,
    padding: 12,
    backgroundColor: "rgba(26, 26, 26, 0.9)",
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#FFD700",
    minHeight: 60,
    justifyContent: "center",
  },
  message: {
    color: "#FFD700",
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
    lineHeight: 18,
  },
  ticketsWonContainer: {
    marginTop: 5,
    backgroundColor: "rgba(16, 185, 129, 0.2)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#10B981",
  },
  ticketsWonText: {
    color: "#10B981",
    fontSize: 12,
    fontWeight: "bold",
  },
  controls: {
    marginTop: 5,
    marginBottom: 15,
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
    minWidth: 90,
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
    color: "#10B981",
    fontSize: 10,
    marginTop: 2,
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
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#059669",
    gap: 8,
  },
  startButtonText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 14,
  },
  gameButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  foldButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#DC2626",
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#B91C1C",
    flex: 1,
    justifyContent: "center",
    gap: 6,
  },
  playButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2563EB",
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#1D4ED8",
    flex: 1,
    justifyContent: "center",
    gap: 6,
  },
  actionButtonText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 12,
  },
  endButtons: {
    alignItems: "center",
  },
  playAgainButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#10B981",
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#059669",
    gap: 8,
  },
  playAgainText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 14,
  },
  payouts: {
    backgroundColor: "rgba(26, 26, 26, 0.9)",
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#333",
  },
  payoutsTitle: {
    color: "#FFD700",
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  payoutRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
    paddingHorizontal: 10,
  },
  payoutHand: {
    color: "#FFF",
    fontSize: 12,
    flex: 2,
  },
  payoutMultiplier: {
    color: "#10B981",
    fontSize: 12,
    fontWeight: "bold",
    flex: 1,
    textAlign: "right",
  },
  payoutNote: {
    color: "#999",
    fontSize: 10,
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 8,
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
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    padding: 25,
    borderRadius: 20,
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
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 10,
    textAlign: "center",
  },
  loseText: {
    color: "#EF4444",
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 10,
    textAlign: "center",
  },
  ticketsWonAnimation: {
    color: "#10B981",
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 5,
  },
  // Estilos para animación de barajeo mejorada
  shuffleContainer: {
    position: "absolute",
    top: "40%",
    left: "50%",
    marginLeft: -100,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    backgroundColor: "rgba(0, 0, 0, 0.95)",
    padding: 25,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: "#FFD700",
    width: 200,
    minHeight: 160,
  },
  shuffleText: {
    color: "#FFD700",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
    textAlign: "center",
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: '#333',
    borderRadius: 3,
    marginVertical: 10,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFD700',
    borderRadius: 3,
  },
  shuffleCardsContainer: {
    position: 'relative',
    height: 80,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shuffleCard: {
    position: 'absolute',
    width: 50,
    height: 70,
    backgroundColor: "#1a365d",
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#2d3748",
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
  // Estilos para el indicador de juego en progreso
  gameInProgressIndicator: {
    backgroundColor: "#DC2626",
    paddingVertical: 8,
    paddingHorizontal: 15,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "#B91C1C",
  },
  gameInProgressText: {
    color: "#FFF",
    fontSize: 12,
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