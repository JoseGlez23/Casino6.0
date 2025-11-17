// src/screens/SlotsScreen.js
import React, { useState } from 'react';
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
const SLOT_IMAGES = {
  classic: require('../assets/classicslots.jpg'),
  fruit: require('../assets/fruitslots.jpg'),
  diamond: require('../assets/diamondslots.jpg'),
  luckyseven: require('../assets/luckyseven.jpg'),
  safari: require('../assets/animalslots.jpg'),
  default: require('../assets/classicslots.jpg')
};

export default function SlotsScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');

  // Solo juegos de tragamonedas con sus imágenes reales (los mismos que tenías)
  const slotGames = [
    { 
      id: 1, 
      name: 'TRAGAPERRAS CLÁSICA', 
      image: SLOT_IMAGES.classic,
      screen: 'ClassicSlots',
      color: '#059669',
      description: 'Tragamonedas clásica con símbolos tradicionales'
    },
    { 
      id: 2, 
      name: 'FRUIT SLOTS', 
      image: SLOT_IMAGES.fruit,
      screen: 'FruitSlots',
      color: '#EA580C',
      description: 'Frutas coloridas y premios jugosos'
    },
    { 
      id: 3, 
      name: 'DIAMOND SLOTS', 
      image: SLOT_IMAGES.diamond,
      screen: 'DiamondSlots',
      color: '#7C3AED',
      description: 'Diamantes brillantes y grandes premios'
    },
    { 
      id: 4, 
      name: 'LUCKY 7 SLOTS', 
      image: SLOT_IMAGES.luckyseven,
      screen: 'LuckySevenSlots',
      color: '#CA8A04',
      description: 'Símbolos de la suerte y jackpots'
    },
    { 
      id: 5, 
      name: 'SAFARI SLOTS', 
      image: SLOT_IMAGES.safari,
      screen: 'AnimalSlots',
      color: '#16A34A',
      description: 'Aventura salvaje con animales exóticos'
    }
  ];

  const filteredGames = slotGames.filter(game => 
    game.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    game.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleGamePress = (game) => {
    navigation.navigate(game.screen);
  };

  const GameCard = ({ game }) => (
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
  );

  return (
    <View style={styles.container}>
      {/* Header idéntico al de GamesScreen */}
      <View style={styles.header}>
        <View style={styles.titleGlow}>
          <Text style={styles.japaneseTitle}>招きカジノ</Text>
        </View>
        <View style={styles.subtitleGlow}>
          <Text style={styles.englishTitle}>MANEKI CASINO</Text>
        </View>
        <Text style={styles.headerSubtitle}>
          {filteredGames.length} tragamonedas disponibles
        </Text>
      </View>

      {/* Barra de búsqueda idéntica */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={24} color="#FF6B6B" style={styles.searchIcon} />
        <TextInput
          placeholder="Buscar tragamonedas..."
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

      {/* Grid de tragamonedas - Grandes como en GamesScreen */}
      <ScrollView 
        style={styles.gamesContainer} 
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.gamesGrid}>
          {filteredGames.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </View>

        {filteredGames.length === 0 && (
          <View style={styles.noGames}>
            <Ionicons name="search-outline" size={60} color="#666" />
            <Text style={styles.noGamesText}>No se encontraron tragamonedas</Text>
            <Text style={styles.noGamesSubtext}>
              Intenta con otros términos de búsqueda
            </Text>
          </View>
        )}

        {/* Información adicional sobre tragamonedas */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>🎰 Características de las Tragamonedas</Text>
          <View style={styles.featuresGrid}>
            <View style={styles.feature}>
              <Ionicons name="trophy" size={24} color="#FFD700" />
              <Text style={styles.featureText}>Jackpots Progresivos</Text>
            </View>
            <View style={styles.feature}>
              <Ionicons name="sync" size={24} color="#FFD700" />
              <Text style={styles.featureText}>Giros Gratis</Text>
            </View>
            <View style={styles.feature}>
              <Ionicons name="diamond" size={24} color="#FFD700" />
              <Text style={styles.featureText}>Símbolos Wild</Text>
            </View>
            <View style={styles.feature}>
              <Ionicons name="bonfire" size={24} color="#FFD700" />
              <Text style={styles.featureText}>Bonus Multiplicadores</Text>
            </View>
          </View>
        </View>
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
    width: (width - 60) / 2,
    height: 200,
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
  infoSection: {
    backgroundColor: 'rgba(26, 26, 26, 0.8)',
    padding: 20,
    borderRadius: 15,
    marginTop: 10,
    marginBottom: 30,
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  infoTitle: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  feature: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    color: '#FFF',
    fontSize: 14,
    marginLeft: 10,
    fontWeight: '500',
  },
});