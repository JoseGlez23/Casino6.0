// src/games/cards/Blackjack.js
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

// Componente de carta profesional con animaciones corregidas
const Card = ({ card, index, hide = false, type, cardAnim }) => {
  const getCardColor = (suit) => {
    return suit === "♥" || suit === "♦" ? "#DC2626" : "#000000";
  };

  const cardAnimation = {
    transform: [
      {
        translateY: cardAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [-100, 0],
        }),
      },
      {
        scale: cardAnim.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0.5, 1.1, 1],
        }),
      },
      {
        rotate: cardAnim.interpolate({
          inputRange: [0, 1],
          outputRange: ['-180deg', '0deg'],
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
            <Ionicons name="diamond" size={24} color="#8B0000" />
          </View>
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.card, cardAnimation]}>
      <View style={styles.cardInner}>
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
    </Animated.View>
  );
};

// Tabla de premios de tickets
const getTicketRewards = (betAmount, isBlackjack = false) => {
  const rewards = {
    100: isBlackjack ? 250 : 150,
    250: isBlackjack ? 625 : 375,
    500: isBlackjack ? 1250 : 750,
    1000: isBlackjack ? 2500 : 1500,
  };
  return rewards[betAmount] || 0;
};

export default function Blackjack({ navigation }) {
  const {
    manekiCoins,
    tickets,
    addCoins,
    subtractCoins,
    addTickets,
    canAfford,
  } = useCoins();

  const [bet, setBet] = useState(0);
  const [playerCards, setPlayerCards] = useState([]);
  const [dealerCards, setDealerCards] = useState([]);
  const [playerScore, setPlayerScore] = useState(0);
  const [dealerScore, setDealerScore] = useState(0);
  const [gameStatus, setGameStatus] = useState("betting");
  const [message, setMessage] = useState("HAGA SU APUESTA");
  const [showWinAnimation, setShowWinAnimation] = useState(false);
  const [showLoseAnimation, setShowLoseAnimation] = useState(false);
  const [ticketsWon, setTicketsWon] = useState(0);
  const [showBlockModal, setShowBlockModal] = useState(false);
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
    for (let i = 0; i < 12; i++) {
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

  // Manejar navegación y botón de retroceso - CORREGIDO para incluir "dealing"
  useEffect(() => {
    backHandler.current = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        if (gameStatus === "playing" || gameStatus === "dealer" || gameStatus === "dealing" || gameInProgress) {
          setShowBlockModal(true);
          return true;
        }
        return false;
      }
    );

    navigationListener.current = navigation.addListener('beforeRemove', (e) => {
      if (gameStatus === "playing" || gameStatus === "dealer" || gameStatus === "dealing" || gameInProgress) {
        e.preventDefault();
        setShowBlockModal(true);
      }
    });

    return () => {
      if (backHandler.current?.remove) backHandler.current.remove();
      if (navigationListener.current) navigationListener.current();
    };
  }, [navigation, gameStatus, gameInProgress]);

  // Sistema de valores de cartas CORREGIDO
  const cardValues = {
    A: 1, // Cambiado a 1 para mejor manejo del Blackjack
    2: 2,
    3: 3,
    4: 4,
    5: 5,
    6: 6,
    7: 7,
    8: 8,
    9: 9,
    10: 10,
    J: 10,
    Q: 10,
    K: 10,
  };

  const suits = ["♠", "♥", "♦", "♣"];

  // Función para determinar si el jugador gana automáticamente (5% de probabilidad)
  const shouldAutoWin = () => {
    return Math.random() < 0.05;
  };

  // Función CORREGIDA para calcular puntuación
  const calculateScore = (cards) => {
    let score = 0;
    let aces = 0;

    // Primero sumamos todas las cartas excepto los ases
    cards.forEach(card => {
      if (card.value === "A") {
        aces++;
      } else {
        score += cardValues[card.value];
      }
    });

    // Ahora manejamos los ases
    for (let i = 0; i < aces; i++) {
      if (score + 11 <= 21) {
        score += 11;
      } else {
        score += 1;
      }
    }

    return score;
  };

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
    await animateCardDeal(1, 200);  // Dealer carta 1  
    await animateCardDeal(2, 200);  // Player carta 2
    await animateCardDeal(3, 200);  // Dealer carta 2
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

  const startGame = async (betAmount) => {
    if (!canAfford(betAmount)) {
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

    setBet(betAmount);
    subtractCoins(betAmount, `Apuesta en Blackjack`);
    setGameStatus("dealing"); // NUEVO ESTADO: repartiendo cartas
    setMessage("REPARTIENDO CARTAS...");
    animateMessage();

    // Repartir cartas iniciales
    const playerCard1 = dealCard();
    const playerCard2 = dealCard();
    const dealerCard1 = dealCard();
    const dealerCard2 = dealCard();

    setPlayerCards([playerCard1, playerCard2]);
    setDealerCards([dealerCard1, dealerCard2]);

    // Calcular puntuaciones INMEDIATAMENTE
    const playerTotal = calculateScore([playerCard1, playerCard2]);
    const dealerTotal = calculateScore([dealerCard1]); // Solo primera carta del dealer

    setPlayerScore(playerTotal);
    setDealerScore(dealerTotal);

    // Animar cartas
    await animateCards();

    setGameStatus("playing");
    
    // Verificar Blackjack
    if (playerTotal === 21) {
      setTimeout(() => {
        handleBlackjack(false);
      }, 1000);
    } else {
      setMessage("SU TURNO - PEDIR O PLANTARSE");
    }
    animateMessage();
  };

  const handleBlackjack = async (isAutoWin = false) => {
    const winAmount = Math.floor(bet * 2.5);
    const ticketReward = getTicketRewards(bet, true);

    addCoins(winAmount, `Blackjack Natural`);
    await addTickets(ticketReward, `Blackjack Natural - Tickets`);

    setGameStatus("ended");
    setGameInProgress(false); // Terminar el estado de juego en progreso
    if (isAutoWin) {
      setMessage(`¡GANANCIA SORPRESA! +${winAmount} MC + ${ticketReward} TICKETS`);
    } else {
      setMessage(`¡BLACKJACK! +${winAmount} MC + ${ticketReward} TICKETS`);
    }
    setTicketsWon(ticketReward);
    // AUMENTAR racha de victorias
    setWinStreak(prev => prev + 1);
    animateMessage();
    triggerWinAnimation();
  };

  const hit = async () => {
    const newCard = dealCard();
    const newPlayerCards = [...playerCards, newCard];
    const newScore = calculateScore(newPlayerCards);

    setPlayerCards(newPlayerCards);
    
    // Animar nueva carta
    const newCardIndex = playerCards.length + 2;
    await animateCardDeal(newCardIndex, 100);

    // ACTUALIZAR PUNTAJE DESPUÉS de la animación
    setTimeout(() => {
      setPlayerScore(newScore);

      if (newScore > 21) {
        setGameStatus("ended");
        setGameInProgress(false); // Terminar el estado de juego en progreso
        setMessage("TE PASASTE - PIERDES");
        animateMessage();
        triggerLoseAnimation();
        // RESET racha de victorias al perder
        setWinStreak(0);
      } else if (newScore === 21) {
        stand();
      }
    }, 400);
  };

  const stand = async () => {
    setGameStatus("dealer");
    setMessage("TURNO DE MANEKI...");
    animateMessage();

    // Mostrar carta oculta del dealer
    await animateCardDeal(3, 100);

    setTimeout(async () => {
      let currentDealerCards = [...dealerCards];
      let currentDealerScore = calculateScore(currentDealerCards);

      // Revelar todas las cartas del dealer
      setDealerScore(currentDealerScore);

      // Turno del dealer
      while (currentDealerScore < 17) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const newCard = dealCard();
        currentDealerCards.push(newCard);
        currentDealerScore = calculateScore(currentDealerCards);

        setDealerCards([...currentDealerCards]);
        
        // Animar nueva carta del dealer
        const newCardIndex = 4 + (currentDealerCards.length - 2);
        await animateCardDeal(newCardIndex, 100);

        // Actualizar puntuación después de animación
        setTimeout(() => {
          setDealerScore(currentDealerScore);
        }, 400);
      }

      // Determinar ganador después de que termine el turno del dealer
      setTimeout(() => {
        determineWinner(currentDealerScore);
      }, 800);
    }, 1000);
  };

  const determineWinner = async (finalDealerScore) => {
    let resultMessage = "";
    let winAmount = 0;
    let ticketReward = 0;
    let isWin = false;

    if (playerScore > 21) {
      resultMessage = "TE PASASTE - PIERDES";
      winAmount = 0;
      setWinStreak(0); // Reset racha al perder
    } else if (finalDealerScore > 21) {
      resultMessage = "MANEKI SE PASA - ¡GANAS!";
      winAmount = bet * 2;
      ticketReward = getTicketRewards(bet, false);
      isWin = true;
      setWinStreak(prev => prev + 1); // Aumentar racha al ganar
    } else if (playerScore > finalDealerScore) {
      resultMessage = "¡FELICIDADES! GANAS";
      winAmount = bet * 2;
      ticketReward = getTicketRewards(bet, false);
      isWin = true;
      setWinStreak(prev => prev + 1); // Aumentar racha al ganar
    } else if (playerScore === finalDealerScore) {
      resultMessage = "EMPATE - RECUPERAS APUESTA";
      winAmount = bet;
      // En empate, mantener la racha actual
    } else {
      resultMessage = "MANEKI GANA - PIERDES";
      winAmount = 0;
      setWinStreak(0); // Reset racha al perder
    }

    if (winAmount > 0) {
      if (winAmount > bet) {
        const netWin = winAmount - bet;
        addCoins(netWin, `Ganancia en Blackjack`);
      }
      if (ticketReward > 0) {
        await addTickets(ticketReward, `Ganancia en Blackjack - Tickets`);
        setTicketsWon(ticketReward);
      }
    }

    setGameStatus("ended");
    setGameInProgress(false); // Terminar el estado de juego en progreso
    setMessage(resultMessage);
    animateMessage();

    // Verificar si debemos mostrar el boost de suerte después de una VICTORIA
    if (isWin) {
      setTimeout(() => {
        checkAndShowLuckBoost();
      }, 1500);
    }

    if (isWin) {
      triggerWinAnimation();
    } else if (playerScore > 21 || (finalDealerScore <= 21 && finalDealerScore > playerScore)) {
      triggerLoseAnimation();
    }
  };

  const resetGame = async () => {
    setBet(0);
    setPlayerCards([]);
    setDealerCards([]);
    setPlayerScore(0);
    setDealerScore(0);
    setGameStatus("betting");
    setMessage("HAGA SU APUESTA");
    setShowWinAnimation(false);
    setShowLoseAnimation(false);
    setTicketsWon(0);
    setGameInProgress(false); // Asegurar que se reinicie el estado
    // NO resetear la racha de victorias aquí
    cardDealAnims.forEach(anim => anim.setValue(0));
    animateMessage();
  };

  const renderCard = (card, index, type, hide = false) => {
    let animIndex;
    if (type === 'player') {
      animIndex = index;
    } else {
      // Para dealer: cartas en índices 1, 3, 5, 7, etc.
      animIndex = index === 0 ? 1 : 3 + (index - 1) * 2;
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

  const betAmounts = [100, 250, 500, 1000];

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

        {/* Área del Dealer */}
        <View style={styles.area}>
          <View style={styles.areaHeader}>
            <Text style={styles.areaTitle}>MANEKI</Text>
            <View style={styles.scoreContainer}>
              <Text style={styles.areaScore}>
                {gameStatus === "playing" || gameStatus === "dealing" ? "?" : dealerScore}
              </Text>
            </View>
          </View>
          <View style={styles.cardsContainer}>
            {dealerCards.map((card, index) => 
              renderCard(card, index, 'dealer', (index === 1 && (gameStatus === "playing" || gameStatus === "dealing")))
            )}
          </View>
        </View>

        {/* Mensaje del Juego */}
        <Animated.View style={[styles.messageContainer, { transform: [{ scale: messageAnim }] }]}>
          <Text style={styles.message}>{message}</Text>
          {ticketsWon > 0 && (
            <View style={styles.ticketsWonContainer}>
              <Text style={styles.ticketsWonText}>+{ticketsWon} TICKETS</Text>
            </View>
          )}
        </Animated.View>

        {/* Área del Jugador */}
        <View style={styles.area}>
          <View style={styles.areaHeader}>
            <Text style={styles.areaTitle}>JUGADOR</Text>
            <View style={styles.scoreContainer}>
              <Text style={styles.areaScore}>{playerScore}</Text>
            </View>
          </View>
          <View style={styles.cardsContainer}>
            {playerCards.map((card, index) => 
              renderCard(card, index, 'player')
            )}
          </View>
        </View>

        {/* Controles del Juego */}
        <View style={styles.controls}>
          {gameStatus === "betting" && (
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
                      +{getTicketRewards(amount, false)} TICKETS
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
                  onPress={() => startGame(bet)}
                  disabled={bet === 0}
                >
                  <Ionicons name="play" size={18} color="#FFF" />
                  <Text style={styles.actionButtonText}>INICIAR JUEGO</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {gameStatus === "playing" && (
            <View style={styles.gameActions}>
              <TouchableOpacity style={[styles.actionButton, styles.hitButton]} onPress={hit}>
                <Ionicons name="add" size={18} color="#FFF" />
                <Text style={styles.actionButtonText}>PEDIR CARTA</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={[styles.actionButton, styles.standButton]} onPress={stand}>
                <Ionicons name="hand-left" size={18} color="#FFF" />
                <Text style={styles.actionButtonText}>PLANTARSE</Text>
              </TouchableOpacity>
            </View>
          )}

          {gameStatus === "ended" && (
            <View style={styles.endActions}>
              <TouchableOpacity style={[styles.actionButton, styles.playAgainButton]} onPress={resetGame}>
                <Ionicons name="refresh" size={18} color="#FFF" />
                <Text style={styles.actionButtonText}>JUGAR DE NUEVO</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Mostrar mensaje cuando se están repartiendo cartas */}
          {gameStatus === "dealing" && (
            <View style={styles.dealingContainer}>
              <Text style={styles.dealingText}>REPARTIENDO CARTAS...</Text>
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
    fontSize: 14,
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
    width: 60,
    height: 84,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    margin: 4,
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    position: "relative",
    overflow: 'hidden',
  },
  cardInner: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
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
    fontSize: 10,
    fontWeight: "bold",
  },
  cardCornerSuit: {
    fontSize: 8,
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
    width: 30,
    height: 30,
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
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  endActions: {
    alignItems: "center",
  },
  // Nuevo estilo para el estado "dealing"
  dealingContainer: {
    alignItems: "center",
    padding: 16,
    backgroundColor: "rgba(26, 26, 26, 0.95)",
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#FFD700",
  },
  dealingText: {
    color: "#FFD700",
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
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
    flex: 1,
  },
  startButton: {
    backgroundColor: "#10B981",
    borderColor: "#059669",
  },
  hitButton: {
    backgroundColor: "#2563EB",
    borderColor: "#1D4ED8",
  },
  standButton: {
    backgroundColor: "#DC2626",
    borderColor: "#B91C1C",
  },
  playAgainButton: {
    backgroundColor: "#10B981",
    borderColor: "#059669",
    paddingHorizontal: 20,
  },
  actionButtonText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 11,
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
    width: width * 0.8,  // 80% del ancho de la pantalla - MODIFICABLE
    height: height * 0.6, // 60% del alto de la pantalla - MODIFICABLE
    maxWidth: 400,       // Máximo ancho - MODIFICABLE
    maxHeight: 400,      // Máximo alto - MODIFICABLE
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
    width: width * 0.7,  // 70% del ancho de la pantalla - MODIFICABLE
    height: height * 0.5, // 50% del alto de la pantalla - MODIFICABLE
    maxWidth: 350,       // Máximo ancho - MODIFICABLE
    maxHeight: 300,      // Máximo alto - MODIFICABLE
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