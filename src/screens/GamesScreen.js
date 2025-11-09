// src/screens/GamesScreen.js
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// Cargar todas las imágenes estáticamente fuera del componente
const GAME_IMAGES = {
  blackjack: require('../assets/blackjack.jpg'),
  roulette: require('../assets/roulette.jpg'),
  poker: require('../assets/poker.jpg'),
  baccarat: require('../assets/baccarat.jpg'),
  craps: require('../assets/craps.jpg'),
  americanroulette: require('../assets/americanroulette.jpg'),
  war: require('../assets/war.jpg'),
  reddog: require('../assets/reddog.jpg'),
  sicbo: require('../assets/sicbo.jpg'),
  diceroll: require('../assets/diceroll.jpg'),
  moneywhell: require('../assets/moneywhell.jpg'),
  bigsix: require('../assets/bigsix.jpg'),
  bingo: require('../assets/bingo.jpg'),
  keno: require('../assets/keno.jpg'),
  wheelfortune: require('../assets/wheel of fortune.jpg'),
  lottery: require('../assets/lottery.jpg'),
  scratchcards: require('../assets/scratchcards.jpg'),
  videopoker: require('../assets/videopoker.jpg'),
  caribbanstud: require('../assets/caribbanstud.jpg'),
  threecardpoker: require('../assets/threecardpoker.jpg'),
  pajgow: require('../assets/juego1.jpg'),
  default: require('../assets/juego1.jpg')
};

export default function GamesScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Todos los juegos (excepto tragamonedas) con imágenes reales
  const allGames = useMemo(() => [
    { 
      id: 1, 
      name: 'BLACKJACK', 
      image: GAME_IMAGES.blackjack,
      screen: 'Blackjack',
      category: 'cards',
      color: '#8B0000',
      description: 'Juego de cartas clásico contra el dealer'
    },
    { 
      id: 2, 
      name: 'RULETA EUROPEA', 
      image: GAME_IMAGES.roulette,
      screen: 'Roulette',
      category: 'roulette',
      color: '#8B0000',
      description: 'Ruleta con un solo cero'
    },
    { 
      id: 3, 
      name: 'POKER TEXAS', 
      image: GAME_IMAGES.poker,
      screen: 'Poker',
      category: 'cards',
      color: '#8B0000',
      description: 'Poker Texas Hold\'em tradicional'
    },
    { 
      id: 4, 
      name: 'BACCARAT', 
      image: GAME_IMAGES.baccarat,
      screen: 'Baccarat',
      category: 'cards',
      color: '#8B0000',
      description: 'Juego elegante de cartas'
    },
    { 
      id: 5, 
      name: 'CRAPS', 
      image: GAME_IMAGES.craps,
      screen: 'Craps',
      category: 'dice',
      color: '#8B0000',
      description: 'Emocionante juego de dados'
    },
    { 
      id: 6, 
      name: 'RULETA AMERICANA', 
      image: GAME_IMAGES.americanroulette,
      screen: 'AmericanRoulette',
      category: 'roulette',
      color: '#8B0000',
      description: 'Ruleta con doble cero'
    },
    { 
      id: 12, 
      name: 'WAR CARD GAME', 
      image: GAME_IMAGES.war,
      screen: 'War',
      category: 'cards',
      color: '#8B0000',
      description: 'Simple juego de cartas Guerra'
    },
    { 
      id: 13, 
      name: 'RED DOG', 
      image: GAME_IMAGES.reddog,
      screen: 'RedDog',
      category: 'cards',
      color: '#8B0000',
      description: 'Juego de cartas con spread'
    },
    { 
      id: 14, 
      name: 'SIC BO', 
      image: GAME_IMAGES.sicbo,
      screen: 'SicBo',
      category: 'dice',
      color: '#8B0000',
      description: 'Juego de dados chino'
    },
    { 
      id: 15, 
      name: 'DICE ROLL', 
      image: GAME_IMAGES.diceroll,
      screen: 'DiceRoll',
      category: 'dice',
      color: '#8B0000',
      description: 'Apuestas en tiradas de dados'
    },
    { 
      id: 16, 
      name: 'MONEY WHEEL', 
      image: GAME_IMAGES.moneywhell,
      screen: 'MoneyWheel',
      category: 'wheels',
      color: '#8B0000',
      description: 'Rueda del dinero con grandes premios'
    },
    { 
      id: 17, 
      name: 'BIG SIX WHEEL', 
      image: GAME_IMAGES.bigsix,
      screen: 'BigSix',
      category: 'wheels',
      color: '#8B0000',
      description: 'Gran rueda de premios'
    },
    { 
      id: 18, 
      name: 'BINGO', 
      image: GAME_IMAGES.bingo,
      screen: 'Bingo',
      category: 'table',
      color: '#8B0000',
      description: 'Clásico juego de bingo'
    },
    { 
      id: 19, 
      name: 'KENO', 
      image: GAME_IMAGES.keno,
      screen: 'Keno',
      category: 'table',
      color: '#8B0000',
      description: 'Lotería rápida y emocionante'
    },
    { 
      id: 20, 
      name: 'WHEEL OF FORTUNE', 
      image: GAME_IMAGES.wheelfortune,
      screen: 'WheelOfFortune',
      category: 'table',
      color: '#8B0000',
      description: 'Rueda de la fortuna'
    },
    { 
      id: 21, 
      name: 'LOTTERY', 
      image: GAME_IMAGES.lottery,
      screen: 'Lottery',
      category: 'table',
      color: '#8B0000',
      description: 'Lotería de 6 números'
    },
    { 
      id: 22, 
      name: 'SCRATCH CARDS', 
      image: GAME_IMAGES.scratchcards,
      screen: 'ScratchCards',
      category: 'table',
      color: '#8B0000',
      description: 'Rasca y gana instantáneo'
    },
    { 
      id: 23, 
      name: 'VIDEO POKER', 
      image: GAME_IMAGES.videopoker,
      screen: 'VideoPoker',
      category: 'specialty',
      color: '#8B0000',
      description: 'Poker contra la máquina'
    },
    { 
      id: 24, 
      name: 'CARIBBEAN STUD', 
      image: GAME_IMAGES.caribbanstud,
      screen: 'CaribbeanStud',
      category: 'specialty',
      color: '#8B0000',
      description: 'Poker caribeño'
    },
    { 
      id: 25, 
      name: 'THREE CARD POKER', 
      image: GAME_IMAGES.threecardpoker,
      screen: 'ThreeCardPoker',
      category: 'specialty',
      color: '#8B0000',
      description: 'Poker de tres cartas'
    },
    { 
      id: 26, 
      name: 'PAI GOW POKER', 
      image: GAME_IMAGES.pajgow,
      screen: 'PaiGow',
      category: 'specialty',
      color: '#8B0000',
      description: 'Poker chino tradicional'
    }
  ], []);

  const categories = [
    { id: 'all', name: 'Todos', icon: 'game-controller' },
    { id: 'cards', name: 'Cartas', icon: 'card' },
    { id: 'dice', name: 'Dados', icon: 'cube' },
    { id: 'roulette', name: 'Ruletas', icon: 'disc' },
    { id: 'wheels', name: 'Ruedas', icon: 'help-circle' },
    { id: 'table', name: 'Mesa', icon: 'grid' },
    { id: 'specialty', name: 'Especiales', icon: 'star' },
  ];

  const filteredGames = useMemo(() => {
    return allGames.filter(game => {
      const matchesSearch = game.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           game.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || game.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory, allGames]);

  const handleGamePress = (game) => {
    navigation.navigate(game.screen);
  };

  // Componente GameCard grande como antes
  const GameCard = React.memo(({ game }) => (
    <TouchableOpacity
      style={[styles.gameCard, { backgroundColor: game.color }]}
      onPress={() => handleGamePress(game)}
    >
      <Image
        source={game.image}
        style={styles.gameImage}
        resizeMode="cover"
      />
      <View style={styles.gameOverlay}>
        <View style={styles.gameInfo}>
          <Text style={styles.gameName}>{game.name}</Text>
          <Text style={styles.gameDescription}>{game.description}</Text>
          <View style={styles.playButton}>
            <Text style={styles.playButtonText}>JUGAR</Text>
            <Ionicons name="play" size={16} color="#000" />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  ));

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleGlow}>
          <Text style={styles.japaneseTitle}>招きカジノ</Text>
        </View>
        <View style={styles.subtitleGlow}>
          <Text style={styles.englishTitle}>MANEKI CASINO</Text>
        </View>
        <Text style={styles.headerSubtitle}>
          {filteredGames.length} juegos disponibles
        </Text>
      </View>

      {/* Barra de búsqueda */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={24} color="#FF6B6B" style={styles.searchIcon} />
        <TextInput
          placeholder="Buscar juegos..."
          placeholderTextColor="#999"
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#FF6B6B" />
          </TouchableOpacity>
        )}
      </View>

      {/* Categorías - Pequeñas como solicitaste */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesScroll}
        removeClippedSubviews={true}
      >
        {categories.map(category => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryButton,
              selectedCategory === category.id && styles.categoryButtonActive
            ]}
            onPress={() => setSelectedCategory(category.id)}
          >
            <Ionicons 
              name={category.icon} 
              size={16} 
              color={selectedCategory === category.id ? '#000' : '#FFD700'} 
            />
            <Text style={[
              styles.categoryText,
              selectedCategory === category.id && styles.categoryTextActive
            ]}>
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Grid de juegos - Grandes como antes */}
      <ScrollView 
        style={styles.gamesContainer} 
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
      >
        <View style={styles.gamesGrid}>
          {filteredGames.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </View>

        {filteredGames.length === 0 && (
          <View style={styles.noGames}>
            <Ionicons name="search-outline" size={60} color="#666" />
            <Text style={styles.noGamesText}>No se encontraron juegos</Text>
            <Text style={styles.noGamesSubtext}>
              Intenta con otros términos de búsqueda o categoría
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F0F',
  },
  header: {
    paddingHorizontal: 25,
    paddingTop: 60,
    paddingBottom: 15,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 3,
    borderBottomColor: '#FFD700',
    alignItems: 'center',
  },
  titleGlow: {
    shadowColor: "#8B0000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 10,
  },
  japaneseTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FF0000",
    textShadowColor: "#FF6B6B",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
    marginBottom: 4,
  },
  subtitleGlow: {
    shadowColor: "#D4AF37",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 8,
  },
  englishTitle: {
    fontSize: 16,
    color: "#FFD700",
    fontWeight: "300",
    letterSpacing: 3,
    marginBottom: 8,
  },
  headerSubtitle: {
    color: '#FFF',
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(26, 26, 26, 0.8)',
    marginHorizontal: 25,
    marginVertical: 20,
    borderRadius: 15,
    paddingHorizontal: 20,
    height: 55,
    borderWidth: 2,
    borderColor: 'rgba(255, 107, 107, 0.6)',
    elevation: 8,
    shadowColor: '#8B0000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  searchInput: {
    flex: 1,
    color: '#FFF',
    fontSize: 16,
    paddingHorizontal: 15,
    fontWeight: '500',
  },
  searchIcon: {
    marginRight: 10,
  },
  categoriesScroll: {
    paddingHorizontal: 20,
    marginBottom: 20,
    maxHeight: 45,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 0, 0, 0.3)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1.5,
    borderColor: '#FFD700',
    minHeight: 35,
  },
  categoryButtonActive: {
    backgroundColor: '#FFD700',
    borderColor: '#FFD700',
  },
  categoryText: {
    color: '#FFD700',
    fontWeight: '600',
    marginLeft: 5,
    fontSize: 11,
  },
  categoryTextActive: {
    color: '#000',
    fontWeight: 'bold',
  },
  gamesContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  gamesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gameCard: {
    width: (width - 60) / 2, // 2 columnas como antes
    height: 200, // Grande como antes
    borderRadius: 15,
    marginBottom: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#8B0000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  gameImage: {
    width: '100%',
    height: '100%',
  },
  gameOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
    padding: 15,
  },
  gameInfo: {
    alignItems: 'flex-start',
  },
  gameName: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  gameDescription: {
    color: '#DDD',
    fontSize: 12,
    marginBottom: 10,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFD700',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    gap: 4,
  },
  playButtonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 12,
  },
  noGames: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  noGamesText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  noGamesSubtext: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
  },
});