// src/games/dice/DiceRoll.js
import React, { useState, useEffect } from 'react';
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
  Vibration,
  Alert,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCoins } from '../../context/CoinsContext';
import { Audio } from 'expo-av';

const { width, height } = Dimensions.get('window');

// Tabla de premios de tickets para Dice Roll
const getTicketRewards = (betAmount, prediction) => {
  const multipliers = {
    'low': 2,
    'high': 2,
    'seven': 4
  };
  
  const baseTickets = betAmount * 0.5; // 0.5 tickets por cada coin apostado
  const multiplier = multipliers[prediction] || 1;
  
  return Math.floor(baseTickets * multiplier);
};

// Hook de sonidos para DiceRoll
const useGameSounds = () => {
  const [sounds, setSounds] = useState({});

  const loadSounds = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      const soundObjects = {};

      const soundTypes = [
        { key: 'card', file: require('../../assets/sounds/card.mp3') },
        { key: 'click', file: require('../../assets/sounds/click.mp3') },
        { key: 'coin', file: require('../../assets/sounds/coin.mp3') },
        { key: 'error', file: require('../../assets/sounds/error.mp3') },
        { key: 'success', file: require('../../assets/sounds/success.mp3') }
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
      console.log('❌ Error inicializando sistema de sonido:', error);
    }
  };

  const playSound = async (type) => {
    try {
      let soundKey;
      switch(type) {
        case 'win':
          soundKey = 'success';
          break;
        case 'lose':
          soundKey = 'error';
          break;
        case 'dice':
          soundKey = 'card';
          break;
        case 'chip':
        case 'coin':
          soundKey = 'coin';
          break;
        case 'click':
        default:
          soundKey = 'click';
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
    switch(type) {
      case 'win':
        Vibration.vibrate([0, 100, 50, 100, 50, 100]);
        break;
      case 'lose':
        Vibration.vibrate([0, 300, 100, 300]);
        break;
      case 'dice':
        Vibration.vibrate([0, 50, 25, 50]);
        break;
      case 'chip':
      case 'coin':
        Vibration.vibrate(20);
        break;
      case 'click':
      default:
        Vibration.vibrate(15);
    }
  };

  useEffect(() => {
    loadSounds();
    
    return () => {
      Object.values(sounds).forEach(sound => {
        if (sound) {
          sound.unloadAsync();
        }
      });
    };
  }, []);

  return playSound;
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
          transform: [
            { scale: scaleAnim },
            { scale: pulseAnim }
          ]
        }
      ]}
    >
      <Ionicons name="trophy" size={50} color="#FFD700" />
      <Text style={styles.winText}>¡GANASTE!</Text>
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
        })
      ]).start();
    } else {
      scaleAnim.setValue(0);
      shakeAnim.setValue(0);
    }
  }, [show]);

  const shakeInterpolation = shakeAnim.interpolate({
    inputRange: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1],
    outputRange: [0, -10, 10, -10, 10, -10, 10, -10, 10, -10, 0]
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
          ]
        }
      ]}
    >
      <Ionicons name="sad-outline" size={50} color="#EF4444" />
      <Text style={styles.loseText}>¡PERDISTE!</Text>
      <Text style={styles.loseSubtext}>Pierdes la apuesta</Text>
    </Animated.View>
  );
};

export default function DiceRoll({ navigation }) {
  const { manekiCoins, tickets, subtractCoins, addTickets, canAfford } = useCoins();
  const playSound = useGameSounds();
  
  const [bet, setBet] = useState(0);
  const [dice, setDice] = useState([1, 1]);
  const [gameState, setGameState] = useState('betting');
  const [result, setResult] = useState('');
  const [ticketsWon, setTicketsWon] = useState(0);
  const [showWinAnimation, setShowWinAnimation] = useState(false);
  const [showLoseAnimation, setShowLoseAnimation] = useState(false);
  
  const diceAnimations = useState(new Animated.Value(0))[0];
  const resultAnimations = useState(new Animated.Value(0))[0];
  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    const initializeAudio = async () => {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
    };
    initializeAudio();
  }, []);

  const diceFaces = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
  const diceValues = [1, 2, 3, 4, 5, 6];

  const animateDice = () => {
    diceAnimations.setValue(0);
    Animated.timing(diceAnimations, {
      toValue: 1,
      duration: 600,
      easing: Easing.out(Easing.cubic),
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

  const triggerWinAnimation = (tickets = 0) => {
    setTicketsWon(tickets);
    setShowWinAnimation(true);
    setTimeout(() => {
      setShowWinAnimation(false);
      setTicketsWon(0);
    }, 2000);
  };

  const triggerLoseAnimation = () => {
    setShowLoseAnimation(true);
    setTimeout(() => setShowLoseAnimation(false), 2000);
  };

  const placeBet = async (amount, prediction) => {
    if (!canAfford(amount)) {
      await playSound('error');
      Alert.alert('Fondos Insuficientes', 'No tienes suficientes Maneki Coins para esta apuesta');
      return;
    }

    setBet(amount);
    subtractCoins(amount, `Apuesta en Dice Roll`);
    await playSound('coin');
    pulseAnimation();

    setGameState('rolling');
    setResult('');
    setTicketsWon(0);
    setShowWinAnimation(false);
    setShowLoseAnimation(false);

    // Animación de dados rodando
    await playSound('dice');
    animateDice();

    let rollCount = 0;
    const maxRolls = 6;
    const rollInterval = setInterval(() => {
      const tempRoll1 = diceValues[Math.floor(Math.random() * 6)];
      const tempRoll2 = diceValues[Math.floor(Math.random() * 6)];
      
      setDice([tempRoll1, tempRoll2]);
      
      rollCount++;
      if (rollCount >= maxRolls) {
        clearInterval(rollInterval);
        
        setTimeout(() => {
          const finalRoll1 = diceValues[Math.floor(Math.random() * 6)];
          const finalRoll2 = diceValues[Math.floor(Math.random() * 6)];
          const total = finalRoll1 + finalRoll2;
          
          setDice([finalRoll1, finalRoll2]);
          determineResult(total, prediction, amount);
        }, 150);
      }
    }, 80);
  };

  const determineResult = async (total, prediction, betAmount) => {
    let ticketsReward = 0;
    let resultMessage = '';

    if (prediction === 'high' && total > 7) {
      ticketsReward = getTicketRewards(betAmount, 'high');
      resultMessage = `ALTO - ${total} > 7`;
      await playSound('win');
      triggerWinAnimation(ticketsReward);
    } else if (prediction === 'low' && total < 7) {
      ticketsReward = getTicketRewards(betAmount, 'low');
      resultMessage = `BAJO - ${total} < 7`;
      await playSound('win');
      triggerWinAnimation(ticketsReward);
    } else if (prediction === 'seven' && total === 7) {
      ticketsReward = getTicketRewards(betAmount, 'seven');
      resultMessage = `SIETE - ${total} = 7`;
      await playSound('win');
      triggerWinAnimation(ticketsReward);
    } else {
      resultMessage = `TOTAL ${total} - SIN PREMIO`;
      await playSound('lose');
      triggerLoseAnimation();
    }

    // Procesar SOLO tickets si hay ganancia
    // NO agregar coins adicionales
    if (ticketsReward > 0) {
      await addTickets(ticketsReward, `Ganancia en Dice Roll - ${resultMessage.split(' - ')[0]}`);
    }

    setTicketsWon(ticketsReward);
    setResult(resultMessage);
    setGameState('result');
    animateResult();
    pulseAnimation();
  };

  const resetGame = async () => {
    setBet(0);
    setGameState('betting');
    setResult('');
    setTicketsWon(0);
    setShowWinAnimation(false);
    setShowLoseAnimation(false);
    await playSound('click');
  };

  const renderDice = (diceValue, index) => {
    const diceAnimation = {
      transform: [
        {
          rotate: diceAnimations.interpolate({
            inputRange: [0, 1],
            outputRange: ['0deg', '360deg'],
          }),
        },
        {
          scale: diceAnimations.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [1, 1.1, 1],
          }),
        },
      ],
      opacity: diceAnimations,
    };

    return (
      <Animated.View key={index} style={[styles.dice, diceAnimation]}>
        <Text style={styles.diceFace}>{diceFaces[diceValue - 1]}</Text>
      </Animated.View>
    );
  };

  const betAmounts = [50, 100, 250, 500];

  return (
    <SafeAreaView style={styles.safeArea}>
      <WinAnimation show={showWinAnimation} ticketsWon={ticketsWon} />
      <LoseAnimation show={showLoseAnimation} />

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header compacto */}
        <View style={styles.header}>
          {/* Saldo y Tickets */}
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
          
          <View style={styles.titleContainer}>
            <Text style={styles.title}>DICE ROLL</Text>
          </View>

          <View style={styles.emptySpace} />
        </View>

        {/* Área de dados compacta */}
        <View style={styles.diceArea}>
          <View style={styles.diceContainer}>
            {renderDice(dice[0], 1)}
            {renderDice(dice[1], 2)}
          </View>
          
          <View style={styles.diceInfo}>
            <Text style={styles.total}>{dice[0] + dice[1]}</Text>
          </View>
        </View>

        {/* Mensaje de resultado mini */}
        {result && (
          <Animated.View style={[
            styles.messageContainer,
            {
              transform: [
                {
                  scale: resultAnimations.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.9, 1],
                  })
                }
              ],
              borderColor: result.includes('SIN PREMIO') ? '#EF4444' : '#10B981',
              backgroundColor: result.includes('SIN PREMIO') ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
            }
          ]}>
            <Text style={[
              styles.message,
              { color: result.includes('SIN PREMIO') ? '#EF4444' : '#10B981' }
            ]}>
              {result}
            </Text>
            {ticketsWon > 0 && (
              <View style={styles.ticketsWonContainer}>
                <Text style={styles.ticketsWonText}>+{ticketsWon} Tickets</Text>
              </View>
            )}
            {bet > 0 && (
              <Text style={styles.betInfo}>
                Apuesta: {bet.toLocaleString()} MC
              </Text>
            )}
          </Animated.View>
        )}

        {/* Controles ultra compactos */}
        <View style={styles.controls}>
          {gameState === 'betting' && (
            <View style={styles.betContainer}>
              <Text style={styles.betTitle}>APUESTA</Text>
              
              <View style={styles.betAmounts}>
                {betAmounts.map(amount => (
                  <TouchableOpacity 
                    key={amount}
                    style={[
                      styles.betAmountButton,
                      !canAfford(amount) && styles.disabledButton,
                      bet === amount && styles.selectedBet
                    ]}
                    onPress={async () => {
                      if (canAfford(amount)) {
                        setBet(amount);
                        await playSound('click');
                      }
                    }}
                    disabled={!canAfford(amount)}
                  >
                    <Text style={styles.betAmountText}>{amount}</Text>
                    <Text style={styles.ticketRewardInfo}>
                      +{getTicketRewards(amount, 'low')} tickets
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.currentBet}>
                {bet > 0 ? `${bet} MC` : 'Selecciona'}
              </Text>

              <View style={styles.predictionContainer}>
                <TouchableOpacity 
                  style={[styles.predictionButton, styles.lowButton]}
                  onPress={() => bet > 0 && placeBet(bet, 'low')}
                  disabled={bet === 0}
                >
                  <Text style={styles.predictionButtonText}>BAJO {"<7"}</Text>
                  <Text style={styles.multiplierText}>+{getTicketRewards(bet, 'low')} tickets</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.predictionButton, styles.sevenButton]}
                  onPress={() => bet > 0 && placeBet(bet, 'seven')}
                  disabled={bet === 0}
                >
                  <Text style={styles.predictionButtonText}>SIETE =7</Text>
                  <Text style={styles.multiplierText}>+{getTicketRewards(bet, 'seven')} tickets</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.predictionButton, styles.highButton]}
                  onPress={() => bet > 0 && placeBet(bet, 'high')}
                  disabled={bet === 0}
                >
                  <Text style={styles.predictionButtonText}>ALTO {">7"}</Text>
                  <Text style={styles.multiplierText}>+{getTicketRewards(bet, 'high')} tickets</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {gameState === 'rolling' && (
            <TouchableOpacity style={styles.rollButton} onPress={() => {}} disabled>
              <Text style={styles.rollButtonText}>TIRANDO...</Text>
            </TouchableOpacity>
          )}

          {gameState === 'result' && (
            <TouchableOpacity style={styles.playAgainButton} onPress={resetGame}>
              <Text style={styles.playAgainText}>OTRA VEZ</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Reglas mini */}
        <View style={styles.rulesContainer}>
          <View style={styles.ruleItem}>
            <Text style={styles.ruleTitle}>BAJO {"<7"}</Text>
            <Text style={styles.ruleMultiplier}>Solo Tickets</Text>
          </View>
          <View style={styles.ruleItem}>
            <Text style={styles.ruleTitle}>SIETE =7</Text>
            <Text style={styles.ruleMultiplier}>Solo Tickets</Text>
          </View>
          <View style={styles.ruleItem}>
            <Text style={styles.ruleTitle}>ALTO {">7"}</Text>
            <Text style={styles.ruleMultiplier}>Solo Tickets</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0A0A0A',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingHorizontal: 5,
  },
  balancesContainer: {
    flex: 1,
  },
  balanceRow: {
    flexDirection: 'row',
    gap: 10,
  },
  balanceItem: {
    alignItems: 'flex-start',
  },
  coinsDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#FFD700',
    gap: 5,
    minWidth: 80,
  },
  ticketsDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#10B981',
    gap: 5,
    minWidth: 80,
  },
  coinIcon: {
    width: 14,
    height: 14,
    resizeMode: 'contain',
  },
  ticketIcon: {
    width: 14,
    height: 14,
    resizeMode: 'contain',
  },
  balanceText: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: 'bold',
  },
  titleContainer: {
    alignItems: 'center',
    flex: 1,
    marginTop: 5,
  },
  title: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptySpace: {
    width: 30,
  },
  diceArea: {
    backgroundColor: 'rgba(26, 26, 26, 0.9)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#333',
    alignItems: 'center',
  },
  diceContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 8,
  },
  dice: {
    width: 45,
    height: 45,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  diceFace: {
    fontSize: 22,
  },
  diceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  total: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
  },
  messageContainer: {
    alignItems: 'center',
    marginVertical: 10,
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    minHeight: 50,
    justifyContent: 'center',
  },
  message: {
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 16,
  },
  ticketsWonContainer: {
    marginTop: 5,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  ticketsWonText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: 'bold',
  },
  betInfo: {
    color: '#FFF',
    fontSize: 11,
    marginTop: 6,
    opacity: 0.8,
  },
  controls: {
    marginTop: 6,
    marginBottom: 15,
  },
  betContainer: {
    alignItems: 'center',
  },
  betTitle: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  betAmounts: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginBottom: 12,
    gap: 6,
  },
  betAmountButton: {
    backgroundColor: '#2A2A2A',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#444',
    minWidth: 60,
  },
  selectedBet: {
    borderColor: '#FFD700',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
  },
  betAmountText: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: 'bold',
  },
  ticketRewardInfo: {
    color: '#10B981',
    fontSize: 8,
    marginTop: 2,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  currentBet: {
    color: '#FFD700',
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
    backgroundColor: 'rgba(139, 0, 0, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  predictionContainer: {
    width: '100%',
    gap: 8,
  },
  predictionButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  lowButton: {
    backgroundColor: '#DC2626',
  },
  sevenButton: {
    backgroundColor: '#F59E0B',
  },
  highButton: {
    backgroundColor: '#2563EB',
  },
  predictionButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 12,
    flex: 1,
  },
  multiplierText: {
    color: '#FFD700',
    fontWeight: 'bold',
    fontSize: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  rollButton: {
    backgroundColor: '#6B7280',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#4B5563',
    alignItems: 'center',
  },
  rollButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  playAgainButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#059669',
    alignItems: 'center',
  },
  playAgainText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  rulesContainer: {
    backgroundColor: 'rgba(26, 26, 26, 0.9)',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#333',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  ruleItem: {
    alignItems: 'center',
    flex: 1,
  },
  ruleTitle: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 2,
  },
  ruleMultiplier: {
    color: '#10B981',
    fontSize: 9,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  disabledButton: {
    backgroundColor: '#1A1A1A',
    borderColor: '#333',
    opacity: 0.5,
  },
  // Estilos para animaciones
  animationContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -80,
    marginTop: -60,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    padding: 15,
    borderRadius: 12,
    borderWidth: 3,
    width: 160,
    height: 120,
  },
  winAnimation: {
    borderColor: '#FFD700',
  },
  loseAnimation: {
    borderColor: '#EF4444',
  },
  winText: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 6,
  },
  loseText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 6,
  },
  winSubtext: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
  loseSubtext: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
  ticketsWonAnimation: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 4,
    textAlign: 'center',
  },
});