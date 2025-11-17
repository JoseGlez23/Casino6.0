// src/games/cards/Poker.js
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
  Alert,
  Image,
  BackHandler,
  Modal,
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

// Componente de animación de pérdida
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
    outputRange: [0, -10, 8, -8, 6, -6, 4, -4, 2, -2, 0],
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
      <Text style={styles.loseText}>PERDISTE</Text>
    </Animated.View>
  );
};

// Componente de animación de victoria
const WinAnimation = ({ show }) => {
  const [scaleAnim] = useState(new Animated.Value(0));
  const [rotateAnim] = useState(new Animated.Value(0));
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
        Animated.loop(
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 3000,
            easing: Easing.linear,
            useNativeDriver: true,
          })
        ),
      ]).start();
    } else {
      scaleAnim.setValue(0);
      rotateAnim.setValue(0);
      pulseAnim.setValue(1);
    }
  }, [show]);

  const rotateInterpolation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

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
      <Animated.View
        style={{
          transform: [{ rotate: rotateInterpolation }],
        }}
      >
        <Ionicons name="trophy" size={60} color="#FFD700" />
      </Animated.View>
      <Text style={styles.winText}>¡GANASTE!</Text>
    </Animated.View>
  );
};

// Componente de Suerte Aumentada - Solo imagen
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

// Componente de carta profesional con animaciones mejoradas
const Card = ({ card, index, hide = false, delay = 0, type, cardAnim }) => {
  const getCardColor = (suit) => {
    return suit === "♥" || suit === "♦" ? "#DC2626" : "#000000";
  };

  const cardAnimation = {
    transform: [
      {
        translateY: cardAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [-50, 0],
        }),
      },
      {
        scale: cardAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0.8, 1],
        }),
      },
    ],
    opacity: cardAnim,
  };

  if (hide) {
    return (
      <Animated.View style={[styles.card, styles.hiddenCard, cardAnimation]}>
        <View style={styles.cardBackPattern}>
          <View style={styles.cardBackLogo}>
            <Ionicons name="diamond" size={20} color="#8B0000" />
          </View>
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.card, cardAnimation]}>
      <View style={styles.cardContent}>
        {/* Esquina superior izquierda */}
        <View style={styles.cardCornerTop}>
          <Text style={[styles.cardValue, { color: getCardColor(card.suit) }]}>
            {card.value}
          </Text>
          <Text style={[styles.cardSuitSmall, { color: getCardColor(card.suit) }]}>
            {card.suit}
          </Text>
        </View>

        {/* Centro de la carta */}
        <View style={styles.cardCenter}>
          <Text style={[styles.cardSuitLarge, { color: getCardColor(card.suit) }]}>
            {card.suit}
          </Text>
        </View>

        {/* Esquina inferior derecha (rotada) */}
        <View style={styles.cardCornerBottom}>
          <Text style={[styles.cardValue, { color: getCardColor(card.suit) }]}>
            {card.value}
          </Text>
          <Text style={[styles.cardSuitSmall, { color: getCardColor(card.suit) }]}>
            {card.suit}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
};

// Tabla de premios de tickets para Poker - VALORES CONSISTENTES CON BLACKJACK
const getTicketRewards = (betAmount, handRank) => {
  // Mismos valores base que Blackjack para mantener consistencia
  const baseRewards = {
    50: { 
      0: 60,    // Carta Alta
      1: 120,   // Pareja
      2: 180,   // Doble Pareja
      3: 240,   // Trío
      4: 300,   // Escalera
      5: 360,   // Color
      6: 420,   // Full House
      7: 480,   // Póquer
      8: 600,   // Escalera de Color
      9: 750    // Escalera Real
    },
    100: { 
      0: 120,   // Carta Alta
      1: 240,   // Pareja
      2: 360,   // Doble Pareja
      3: 480,   // Trío
      4: 600,   // Escalera
      5: 720,   // Color
      6: 840,   // Full House
      7: 960,   // Póquer
      8: 1200,  // Escalera de Color
      9: 1500   // Escalera Real
    },
    250: { 
      0: 300,   // Carta Alta
      1: 600,   // Pareja
      2: 900,   // Doble Pareja
      3: 1200,  // Trío
      4: 1500,  // Escalera
      5: 1800,  // Color
      6: 2100,  // Full House
      7: 2400,  // Póquer
      8: 3000,  // Escalera de Color
      9: 3750   // Escalera Real
    },
    500: { 
      0: 600,   // Carta Alta
      1: 1200,  // Pareja
      2: 1800,  // Doble Pareja
      3: 2400,  // Trío
      4: 3000,  // Escalera
      5: 3600,  // Color
      6: 4200,  // Full House
      7: 4800,  // Póquer
      8: 6000,  // Escalera de Color
      9: 7500   // Escalera Real
    },
  };
  return baseRewards[betAmount]?.[handRank] || 0;
};

export default function Poker({ navigation }) {
  const {
    manekiCoins,
    tickets,
    subtractCoins,
    addTickets,
    canAfford,
  } = useCoins();

  const [bet, setBet] = useState(100);
  const [gameState, setGameState] = useState("betting");
  const [playerCards, setPlayerCards] = useState([]);
  const [communityCards, setCommunityCards] = useState([]);
  const [dealerCards, setDealerCards] = useState([]);
  const [result, setResult] = useState("");
  const [round, setRound] = useState(0);
  const [showWinAnimation, setShowWinAnimation] = useState(false);
  const [showLoseAnimation, setShowLoseAnimation] = useState(false);
  const [ticketsWon, setTicketsWon] = useState(0);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [message, setMessage] = useState("SELECCIONE SU APUESTA");
  const [cardDealAnims] = useState([]);
  
  // Estados CORREGIDOS: ahora es racha de victorias
  const [winStreak, setWinStreak] = useState(0);
  const [showLuckBoost, setShowLuckBoost] = useState(false);

  // NUEVOS ESTADOS para controlar la navegación
  const [gameInProgress, setGameInProgress] = useState(false);
  const [showTabBlocker, setShowTabBlocker] = useState(false);

  const messageAnim = useRef(new Animated.Value(0)).current;
  const [pulseAnim] = useState(new Animated.Value(1));
  const navigationListener = useRef(null);
  const backHandler = useRef(null);

  // Inicializar animaciones para cada carta
  useEffect(() => {
    cardDealAnims.length = 0;
    for (let i = 0; i < 9; i++) { // 2 player + 2 dealer + 5 community
      cardDealAnims.push(new Animated.Value(0));
    }
  }, []);

  // EFECTO PARA BLOQUEAR LA BARRA INFERIOR - NUEVO
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

  // Manejar navegación y botón de retroceso - CORREGIDO
  useEffect(() => {
    backHandler.current = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        if (gameState === "dealing" || gameState === "flop" || gameState === "turn" || gameState === "river" || gameInProgress) {
          setShowBlockModal(true);
          return true;
        }
        return false;
      }
    );

    navigationListener.current = navigation.addListener('beforeRemove', (e) => {
      if (gameState === "dealing" || gameState === "flop" || gameState === "turn" || gameState === "river" || gameInProgress) {
        e.preventDefault();
        setShowBlockModal(true);
      }
    });

    return () => {
      if (backHandler.current?.remove) backHandler.current.remove();
      if (navigationListener.current) navigationListener.current();
    };
  }, [navigation, gameState, gameInProgress]);

  // Función para determinar si el jugador gana automáticamente (5% de probabilidad)
  const shouldAutoWin = () => {
    return Math.random() < 0.05;
  };

  const cardValues = {
    A: 14,
    2: 2,
    3: 3,
    4: 4,
    5: 5,
    6: 6,
    7: 7,
    8: 8,
    9: 9,
    10: 10,
    J: 11,
    Q: 12,
    K: 13,
  };

  const suits = ["♠", "♥", "♦", "♣"];

  const dealCard = () => {
    const values = Object.keys(cardValues);
    const value = values[Math.floor(Math.random() * values.length)];
    const suit = suits[Math.floor(Math.random() * suits.length)];
    return { value, suit };
  };

  // Función CORREGIDA para animar cartas
  const animateCardDeal = (cardIndex, delay = 0) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        Animated.sequence([
          Animated.timing(cardDealAnims[cardIndex], {
            toValue: 1,
            duration: 400,
            easing: Easing.out(Easing.back(1.5)),
            useNativeDriver: true,
          }),
          Animated.spring(cardDealAnims[cardIndex], {
            toValue: 1,
            tension: 150,
            friction: 5,
            useNativeDriver: true,
          }),
        ]).start(resolve);
      }, delay);
    });
  };

  const animateCards = async () => {
    // Resetear animaciones
    cardDealAnims.forEach(anim => anim.setValue(0));
    
    // Animar cartas en secuencia
    await animateCardDeal(0, 200);  // Player carta 1
    await animateCardDeal(1, 200);  // Player carta 2
    await animateCardDeal(2, 200);  // Dealer carta 1
    await animateCardDeal(3, 200);  // Dealer carta 2
    await animateCardDeal(4, 200);  // Community 1 (Flop)
    await animateCardDeal(5, 200);  // Community 2 (Flop)
    await animateCardDeal(6, 200);  // Community 3 (Flop)
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

  const triggerWinAnimation = () => {
    setShowWinAnimation(true);
    setTimeout(() => setShowWinAnimation(false), 2500);
  };

  const triggerLoseAnimation = () => {
    setShowLoseAnimation(true);
    setTimeout(() => setShowLoseAnimation(false), 2500);
  };

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

  const evaluateHand = (cards) => {
    const values = cards.map((card) => cardValues[card.value]);
    const suits = cards.map((card) => card.suit);

    values.sort((a, b) => a - b);

    const valueCounts = {};
    values.forEach((value) => {
      valueCounts[value] = (valueCounts[value] || 0) + 1;
    });

    const counts = Object.values(valueCounts);
    const uniqueValues = Object.keys(valueCounts).map(Number);

    let isStraight = false;
    if (uniqueValues.length >= 5) {
      for (let i = 0; i <= uniqueValues.length - 5; i++) {
        if (uniqueValues[i + 4] - uniqueValues[i] === 4) {
          isStraight = true;
          break;
        }
      }
      // Escalera A-5
      if (
        uniqueValues.includes(14) &&
        uniqueValues.includes(2) &&
        uniqueValues.includes(3) &&
        uniqueValues.includes(4) &&
        uniqueValues.includes(5)
      ) {
        isStraight = true;
      }
    }

    const isFlush = suits.every((suit) => suit === suits[0]);

    if (isStraight && isFlush && values.includes(14) && values.includes(13))
      return { rank: 9, name: "ESCALERA REAL" };
    if (isStraight && isFlush) return { rank: 8, name: "ESCALERA DE COLOR" };
    if (counts.includes(4)) return { rank: 7, name: "PÓQUER" };
    if (counts.includes(3) && counts.includes(2))
      return { rank: 6, name: "FULL HOUSE" };
    if (isFlush) return { rank: 5, name: "COLOR" };
    if (isStraight) return { rank: 4, name: "ESCALERA" };
    if (counts.includes(3)) return { rank: 3, name: "TRÍO" };
    if (counts.filter((count) => count === 2).length === 2)
      return { rank: 2, name: "DOBLE PAREJA" };
    if (counts.includes(2)) return { rank: 1, name: "PAREJA" };
    return { rank: 0, name: "CARTA ALTA" };
  };

  const startGame = async () => {
    if (!canAfford(bet)) {
      Alert.alert("Fondos Insuficientes", "No tienes suficientes Maneki Coins");
      return;
    }

    // Marcar que el juego está en progreso
    setGameInProgress(true);

    // Mostrar boost de suerte si hay racha de victorias
    if (winStreak >= 3) {
      setShowLuckBoost(true);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    subtractCoins(bet, `Apuesta en Poker Texas Hold'em`);
    pulseAnimation();

    setGameState("dealing");
    setResult("");
    setRound(1);
    setTicketsWon(0);
    setMessage("REPARTIENDO CARTAS...");
    animateMessage();

    // Animar cartas
    await animateCards();

    // Repartir cartas iniciales
    const newPlayerCards = [dealCard(), dealCard()];
    const newDealerCards = [dealCard(), dealCard()];
    const newCommunityCards = [dealCard(), dealCard(), dealCard()];

    setPlayerCards(newPlayerCards);
    setDealerCards(newDealerCards);
    setCommunityCards(newCommunityCards);

    setMessage("FLOP - REVELA LA SIGUIENTE CARTA");
    setGameState("flop");
    animateMessage();
  };

  const continueGame = async () => {
    if (round === 1) {
      // Animar nueva carta del Turn
      await animateCardDeal(7, 200);
      
      const newCard = dealCard();
      setCommunityCards((prev) => [...prev, newCard]);
      setRound(2);
      setMessage("TURN - REVELA LA ÚLTIMA CARTA");
      setGameState("turn");
      animateMessage();
    } else if (round === 2) {
      // Animar nueva carta del River
      await animateCardDeal(8, 200);
      
      const newCard = dealCard();
      setCommunityCards((prev) => [...prev, newCard]);
      setRound(3);
      setMessage("RIVER - CALCULANDO RESULTADO...");
      setGameState("river");
      animateMessage();
      
      setTimeout(() => determineWinner(), 1500);
    }
  };

  const determineWinner = async () => {
    const autoWin = shouldAutoWin();
    const allPlayerCards = [...playerCards, ...communityCards];
    const allDealerCards = [...dealerCards, ...communityCards];

    const playerHand = evaluateHand(allPlayerCards);
    const dealerHand = evaluateHand(allDealerCards);

    let winner = "";
    let ticketReward = 0;

    if (autoWin || playerHand.rank > dealerHand.rank) {
      winner = "player";
      ticketReward = getTicketRewards(bet, playerHand.rank);
      if (autoWin) {
        setResult(`¡GANANCIA SORPRESA! - ${playerHand.name}`);
      } else {
        setResult(`¡GANASTE! - ${playerHand.name}`);
      }
      triggerWinAnimation();
      // AUMENTAR racha de victorias
      setWinStreak(prev => prev + 1);
    } else if (dealerHand.rank > playerHand.rank) {
      winner = "dealer";
      setResult(`MANEKI GANA - ${dealerHand.name}`);
      triggerLoseAnimation();
      // RESET racha de victorias al perder
      setWinStreak(0);
    } else {
      winner = "tie";
      ticketReward = getTicketRewards(bet, playerHand.rank) / 2;
      setResult(`EMPATE - ${playerHand.name}`);
      // En empate, mantener la racha actual
    }

    // SOLO GANAS TICKETS, NO MANEKI COINS
    if (ticketReward > 0) {
      await addTickets(ticketReward, `Ganancia en Poker - ${playerHand.name}`);
      setTicketsWon(ticketReward);
    }

    setGameState("result");
    setGameInProgress(false); // Terminar el estado de juego en progreso
    setMessage("RONDA TERMINADA");
    animateMessage();
    pulseAnimation();

    // Verificar si debemos mostrar el boost de suerte después de una VICTORIA
    if (winner === "player") {
      setTimeout(() => {
        checkAndShowLuckBoost();
      }, 1500);
    }
  };

  const resetGame = async () => {
    setBet(100);
    setGameState("betting");
    setPlayerCards([]);
    setCommunityCards([]);
    setDealerCards([]);
    setResult("");
    setRound(0);
    setShowWinAnimation(false);
    setShowLoseAnimation(false);
    setTicketsWon(0);
    setGameInProgress(false); // Asegurar que se reinicie el estado
    setMessage("SELECCIONE SU APUESTA");
    // NO resetear la racha de victorias aquí
    cardDealAnims.forEach(anim => anim.setValue(0));
    animateMessage();
  };

  const renderCard = (card, index, type, hide = false) => {
    let animIndex;
    if (type === 'player') {
      animIndex = index; // 0, 1
    } else if (type === 'dealer') {
      animIndex = index + 2; // 2, 3
    } else if (type === 'community') {
      animIndex = index + 4; // 4, 5, 6, 7, 8
    }
    
    const cardAnim = cardDealAnims[animIndex] || new Animated.Value(0);

    return (
      <Card
        key={index}
        card={card}
        index={index}
        hide={hide}
        type={type}
        cardAnim={cardAnim}
      />
    );
  };

  const betAmounts = [50, 100, 250, 500];

  return (
    <SafeAreaView style={styles.safeArea}>
      <WinAnimation show={showWinAnimation} />
      <LoseAnimation show={showLoseAnimation} />
      
      <BlockModal visible={showBlockModal} onClose={handleCloseBlockModal} />

      <LuckBoostImage 
        show={showLuckBoost} 
        winStreak={winStreak}
        onHide={handleHideLuckBoost}
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

        {/* Mensaje del juego */}
        <Animated.View style={[styles.messageContainer, { transform: [{ scale: messageAnim }] }]}>
          <Text style={styles.message}>{message}</Text>
          {ticketsWon > 0 && (
            <View style={styles.ticketsWonContainer}>
              <Text style={styles.ticketsWonText}>+{ticketsWon} TICKETS</Text>
            </View>
          )}
        </Animated.View>

        {/* Área de Maneki */}
        {gameState !== "betting" && (
          <View style={styles.area}>
            <View style={styles.areaHeader}>
              <Text style={styles.areaTitle}>MANEKI</Text>
              <View style={styles.scoreContainer}>
                <Text style={styles.areaScore}>
                  {gameState === "result" ? "REVELADO" : "OCULTO"}
                </Text>
              </View>
            </View>
            <View style={styles.cardsContainer}>
              {dealerCards.map((card, index) => (
                renderCard(card, index, 'dealer', gameState !== "result")
              ))}
            </View>
          </View>
        )}

        {/* Cartas Comunitarias */}
        {communityCards.length > 0 && (
          <View style={styles.area}>
            <View style={styles.areaHeader}>
              <Text style={styles.areaTitle}>CARTAS COMUNITARIAS</Text>
              <View style={styles.scoreContainer}>
                <Text style={styles.areaScore}>
                  {round === 1 ? "FLOP" : round === 2 ? "TURN" : "RIVER"}
                </Text>
              </View>
            </View>
            <View style={styles.cardsContainer}>
              {communityCards.map((card, index) => (
                renderCard(card, index, 'community')
              ))}
            </View>
          </View>
        )}

        {/* Cartas del Jugador */}
        {playerCards.length > 0 && (
          <View style={styles.area}>
            <View style={styles.areaHeader}>
              <Text style={styles.areaTitle}>TUS CARTAS</Text>
              <View style={styles.scoreContainer}>
                <Text style={styles.areaScore}>JUGADOR</Text>
              </View>
            </View>
            <View style={styles.cardsContainer}>
              {playerCards.map((card, index) => (
                renderCard(card, index, 'player')
              ))}
            </View>
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
                    onPress={() => {
                      if (canAfford(amount)) {
                        setBet(amount);
                        pulseAnimation();
                      }
                    }}
                    disabled={!canAfford(amount)}
                  >
                    <Text style={styles.betAmountText}>{amount.toLocaleString()}</Text>
                    <Text style={styles.ticketRewardText}>
                      +{getTicketRewards(amount, 1)} TICKETS
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.betActions}>
                <Text style={styles.currentBet}>
                  {bet > 0 ? `APUESTA: ${bet.toLocaleString()} MC` : "SELECCIONE MONTO"}
                </Text>
                
                <TouchableOpacity
                  style={[styles.actionButton, styles.startButton, bet === 0 && styles.disabledButton]}
                  onPress={startGame}
                  disabled={bet === 0}
                >
                  <Ionicons name="play" size={16} color="#FFF" />
                  <Text style={styles.actionButtonText}>INICIAR JUEGO</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {(gameState === "flop" || gameState === "turn") && (
            <View style={styles.gameActions}>
              <TouchableOpacity style={[styles.actionButton, styles.continueButton]} onPress={continueGame}>
                <Ionicons name="arrow-forward" size={16} color="#FFF" />
                <Text style={styles.actionButtonText}>
                  {round === 1 ? "REVELAR TURN" : "REVELAR RIVER"}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {gameState === "result" && (
            <View style={styles.endActions}>
              <TouchableOpacity style={[styles.actionButton, styles.playAgainButton]} onPress={resetGame}>
                <Ionicons name="refresh" size={16} color="#FFF" />
                <Text style={styles.actionButtonText}>JUGAR DE NUEVO</Text>
              </TouchableOpacity>
            </View>
          )}
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
    backgroundColor: "rgba(16, 185, 129, 0.6)", // Verde para victorias
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
  area: {
    backgroundColor: "rgba(26, 26, 26, 0.95)",
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#333",
  },
  areaHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  areaTitle: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "bold",
  },
  scoreContainer: {
    backgroundColor: "rgba(139, 0, 0, 0.4)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#FFD700",
  },
  areaScore: {
    color: "#FFD700",
    fontSize: 12,
    fontWeight: "bold",
  },
  cardsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    minHeight: 80,
    gap: 6,
  },
  card: {
    width: 56,
    height: 78,
    backgroundColor: "#FFFFFF",
    borderRadius: 6,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    overflow: 'hidden',
  },
  cardContent: {
    width: "100%",
    height: "100%",
    padding: 4,
  },
  cardCornerTop: {
    position: "absolute",
    top: 4,
    left: 4,
    alignItems: "flex-start",
  },
  cardCornerBottom: {
    position: "absolute",
    bottom: 4,
    right: 4,
    alignItems: "flex-start",
    transform: [{ rotate: "180deg" }],
  },
  cardValue: {
    fontSize: 12,
    fontWeight: "bold",
    lineHeight: 12,
  },
  cardSuitSmall: {
    fontSize: 10,
    lineHeight: 10,
  },
  cardCenter: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -10 }, { translateY: -10 }],
  },
  cardSuitLarge: {
    fontSize: 18,
  },
  hiddenCard: {
    backgroundColor: "#8B0000",
  },
  cardBackPattern: {
    width: "100%",
    height: "100%",
    backgroundColor: "#8B0000",
    justifyContent: "center",
    alignItems: "center",
  },
  cardBackLogo: {
    width: 24,
    height: 24,
    backgroundColor: "#A52A2A",
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
    opacity: 0.6,
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
  controls: {
    marginTop: 8,
  },
  betContainer: {
    alignItems: "center",
  },
  betTitle: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
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
  gameActions: {
    alignItems: "center",
  },
  endActions: {
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
  },
  startButton: {
    backgroundColor: "#10B981",
    borderColor: "#059669",
  },
  continueButton: {
    backgroundColor: "#2563EB",
    borderColor: "#1D4ED8",
  },
  playAgainButton: {
    backgroundColor: "#10B981",
    borderColor: "#059669",
  },
  actionButtonText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 12,
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
  loseAnimation: {
    borderColor: "#EF4444",
  },
  winText: {
    color: "#FFD700",
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 6,
    textAlign: "center",
  },
  loseText: {
    color: "#EF4444",
    fontSize: 16,
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
    width: width * 0.8,  // 80% del ancho de la pantalla
    height: height * 0.6, // 60% del alto de la pantalla
    maxWidth: 400,       // Máximo ancho
    maxHeight: 400,      // Máximo alto
  },
  // Estilos para el sistema de suerte aumentada (solo imagen)
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
    width: width * 0.7,  // 70% del ancho de la pantalla
    height: height * 0.5, // 50% del alto de la pantalla
    maxWidth: 350,       // Máximo ancho
    maxHeight: 300,      // Máximo alto
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