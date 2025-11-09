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

export default function SlotsScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');

  // Solo juegos de tragamonedas con sus imágenes reales
  const slotGames = [
    { 
      id: 1, 
      name: 'TRAGAPERRAS CLÁSICA', 
      image: require('../assets/classicslots.jpg'),
      screen: 'ClassicSlots',
      color: '#059669',
      description: 'Tragamonedas clásica con símbolos tradicionales'
    },
    { 
      id: 2, 
      name: 'FRUIT SLOTS', 
      image: require('../assets/fruitslots.jpg'),
      screen: 'FruitSlots',
      color: '#EA580C',
      description: 'Frutas coloridas y premios jugosos'
    },
    { 
      id: 3, 
      name: 'DIAMOND SLOTS', 
      image: require('../assets/diamondslots.jpg'),
      screen: 'DiamondSlots',
      color: '#7C3AED',
      description: 'Diamantes brillantes y grandes premios'
    },
    { 
      id: 4, 
      name: 'LUCKY 7 SLOTS', 
      image: require('../assets/luckyseven.jpg'),
      screen: 'LuckySevenSlots',
      color: '#CA8A04',
      description: 'Símbolos de la suerte y jackpots'
    },
    { 
      id: 5, 
      name: 'SAFARI SLOTS', 
      image: require('../assets/animalslots.jpg'),
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
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>TRAGAMONEDAS</Text>
        <Text style={styles.headerSubtitle}>
          {filteredGames.length} máquinas disponibles
        </Text>
      </View>

      {/* Barra de búsqueda */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={24} color="#666" style={styles.searchIcon} />
        <TextInput
          placeholder="Buscar tragamonedas..."
          placeholderTextColor="#666"
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={24} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      {/* Grid de tragamonedas */}
      <ScrollView style={styles.gamesContainer} showsVerticalScrollIndicator={false}>
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

        {/* Información adicional */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>✨ Características de las Tragamonedas</Text>
          <View style={styles.featuresGrid}>
            <View style={styles.feature}>
              <Ionicons name="trophy" size={24} color="#FFD700" />
              <Text style={styles.featureText}>Jackpots Grandes</Text>
            </View>
            <View style={styles.feature}>
              <Ionicons name="sync" size={24} color="#FFD700" />
              <Text style={styles.featureText}>Giros Gratis</Text>
            </View>
            <View style={styles.feature}>
              <Ionicons name="diamond" size={24} color="#FFD700" />
              <Text style={styles.featureText}>Símbolos Especiales</Text>
            </View>
            <View style={styles.feature}>
              <Ionicons name="bonfire" size={24} color="#FFD700" />
              <Text style={styles.featureText}>Bonus Rounds</Text>
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
    paddingTop: 20,
    paddingBottom: 15,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 2,
    borderBottomColor: '#FFD700',
  },
  headerTitle: {
    color: '#FFD700',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  headerSubtitle: {
    color: '#FFF',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 5,
    opacity: 0.8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    marginHorizontal: 25,
    marginVertical: 20,
    borderRadius: 15,
    paddingHorizontal: 20,
    height: 55,
    borderWidth: 2,
    borderColor: '#333',
  },
  searchInput: {
    flex: 1,
    color: '#FFF',
    fontSize: 16,
    paddingHorizontal: 15,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  gameImage: {
    width: '100%',
    height: '100%',
  },
  gameOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
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
  },
  gameDescription: {
    color: '#CCC',
    fontSize: 12,
    marginBottom: 10,
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
    backgroundColor: '#1a1a1a',
    padding: 20,
    borderRadius: 15,
    marginTop: 10,
    marginBottom: 30,
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
  },
});