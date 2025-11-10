import React, {
  useState,
  useMemo,
  useEffect,
  useCallback,
  useRef,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Dimensions,
  StatusBar,
  Platform,
  Alert,
  Modal,
  RefreshControl,
  Animated,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useCoins } from "../context/CoinsContext";

const { width } = Dimensions.get("window");

// Componente para manejar imágenes con error
const GameImage = ({ source, style }) => {
  const [imageError, setImageError] = useState(false);

  if (imageError) {
    return (
      <View style={[style, styles.placeholderImage]}>
        <Ionicons name="game-controller" size={40} color="#FFD700" />
        <Text style={styles.placeholderText}>MANEKI CASINO</Text>
      </View>
    );
  }

  return (
    <Image
      source={source}
      style={style}
      resizeMode="cover"
      onError={() => setImageError(true)}
    />
  );
};

// Cargar todas las imágenes estáticamente fuera del componente
const GAME_IMAGES = {
  blackjack: require("../assets/blackjack.jpg"),
  roulette: require("../assets/roulette.jpg"),
  poker: require("../assets/poker.jpg"),
  baccarat: require("../assets/baccarat.jpg"),
  craps: require("../assets/craps.jpg"),
  americanroulette: require("../assets/americanroulette.jpg"),
  classicslots: require("../assets/classicslots.jpg"),
  fruitslots: require("../assets/fruitslots.jpg"),
  diamondslots: require("../assets/diamondslots.jpg"),
  luckyseven: require("../assets/luckyseven.jpg"),
  animalslots: require("../assets/animalslots.jpg"),
  war: require("../assets/war.jpg"),
  reddog: require("../assets/reddog.jpg"),
  sicbo: require("../assets/sicbo.jpg"),
  diceroll: require("../assets/diceroll.jpg"),
  moneywhell: require("../assets/moneywhell.jpg"),
  bigsix: require("../assets/bigsix.jpg"),
  bingo: require("../assets/bingo.jpg"),
  keno: require("../assets/keno.jpg"),
  wheelfortune: require("../assets/wheel of fortune.jpg"),
  lottery: require("../assets/lottery.jpg"),
  scratchcards: require("../assets/scratchcards.jpg"),
  videopoker: require("../assets/videopoker.jpg"),
  caribbanstud: require("../assets/caribbanstud.jpg"),
  threecardpoker: require("../assets/threecardpoker.jpg"),
  pajgow: require("../assets/paigow.jpg"),
  default: require("../assets/blackjack.jpg"), // Usar una imagen existente como fallback
};

// Banners del carrusel
const BANNERS = [
  {
    id: 1,
    image: require("../assets/banner1.png"),
    title: "PROMOCIÓN ESPECIAL",
  },
  { id: 2, image: require("../assets/banner2.png"), title: "NUEVOS JUEGOS" },
  {
    id: 3,
    image: require("../assets/banner3.png"),
    title: "BONO DE BIENVENIDA",
  },
  { id: 4, image: require("../assets/banner4.png"), title: "TORNEOS ACTIVOS" },
  {
    id: 5,
    image: require("../assets/banner5.png"),
    title: "PREMIOS EXCLUSIVOS",
  },
  {
    id: 6,
    image: require("../assets/banner6.png"),
    title: "OFERTAS LIMITADAS",
  },
  {
    id: 7,
    image: require("../assets/banner7.png"),
    title: "EVENTOS ESPECIALES",
  },
];

export default function HomeScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const flatListRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const {
    manekiCoins,
    addCoins,
    subtractCoins,
    canAfford,
    getDailyBonus,
    refreshCoins,
    isLoading,
    tickets
  } = useCoins();

  // Efecto para el carrusel automático
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBannerIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % BANNERS.length;
        flatListRef.current?.scrollToIndex({
          index: nextIndex,
          animated: true,
        });
        return nextIndex;
      });
    }, 5000); // Cambia cada 5 segundos

    return () => clearInterval(interval);
  }, []);

  // Función para manejar el refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshCoins();
    } catch (error) {
      console.error("Error en refresh:", error);
    } finally {
      setRefreshing(false);
    }
  }, [refreshCoins]);

  // Función optimizada para obtener imágenes
  const getGameImage = (imageKey) => {
    return GAME_IMAGES[imageKey] || GAME_IMAGES.default;
  };

  // Todos los juegos con referencias optimizadas
  const featuredGames = useMemo(
    () => [
      {
        id: 1,
        name: "BLACKJACK",
        image: GAME_IMAGES.blackjack,
        screen: "Blackjack",
        category: "cards",
        color: "#8B0000",
        popular: true,
        minBet: 100,
        featured: true,
      },
      {
        id: 2,
        name: "RULETA EUROPEA",
        image: GAME_IMAGES.roulette,
        screen: "Roulette",
        category: "roulette",
        color: "#8B0000",
        popular: true,
        minBet: 50,
        featured: true,
      },
      {
        id: 3,
        name: "POKER TEXAS",
        image: GAME_IMAGES.poker,
        screen: "Poker",
        category: "cards",
        color: "#8B0000",
        popular: true,
        minBet: 200,
        featured: true,
      },
      {
        id: 4,
        name: "BACCARAT",
        image: GAME_IMAGES.baccarat,
        screen: "Baccarat",
        category: "cards",
        color: "#8B0000",
        popular: true,
        minBet: 100,
        featured: true,
      },
      {
        id: 5,
        name: "CRAPS",
        image: GAME_IMAGES.craps,
        screen: "Craps",
        category: "dice",
        color: "#8B0000",
        popular: true,
        minBet: 50,
      },
      {
        id: 6,
        name: "RULETA AMERICANA",
        image: GAME_IMAGES.americanroulette,
        screen: "AmericanRoulette",
        category: "roulette",
        color: "#8B0000",
        popular: true,
        minBet: 50,
      },
      {
        id: 7,
        name: "TRAGAPERRAS CLÁSICA",
        image: GAME_IMAGES.classicslots,
        screen: "ClassicSlots",
        category: "slots",
        color: "#8B0000",
        minBet: 10,
        featured: true,
      },
      {
        id: 8,
        name: "FRUIT SLOTS",
        image: GAME_IMAGES.fruitslots,
        screen: "FruitSlots",
        category: "slots",
        color: "#8B0000",
        minBet: 10,
      },
      {
        id: 9,
        name: "DIAMOND SLOTS",
        image: GAME_IMAGES.diamondslots,
        screen: "DiamondSlots",
        category: "slots",
        color: "#8B0000",
        minBet: 25,
      },
      {
        id: 10,
        name: "LUCKY 7 SLOTS",
        image: GAME_IMAGES.luckyseven,
        screen: "LuckySevenSlots",
        category: "slots",
        color: "#8B0000",
        minBet: 15,
      },
      {
        id: 11,
        name: "SAFARI SLOTS",
        image: GAME_IMAGES.animalslots,
        screen: "AnimalSlots",
        category: "slots",
        color: "#8B0000",
        minBet: 20,
      },
      {
        id: 12,
        name: "WAR CARD GAME",
        image: GAME_IMAGES.war,
        screen: "War",
        category: "cards",
        color: "#8B0000",
        minBet: 25,
      },
      {
        id: 13,
        name: "RED DOG",
        image: GAME_IMAGES.reddog,
        screen: "RedDog",
        category: "cards",
        color: "#8B0000",
        minBet: 50,
      },
      {
        id: 14,
        name: "SIC BO",
        image: GAME_IMAGES.sicbo,
        screen: "SicBo",
        category: "dice",
        color: "#8B0000",
        minBet: 25,
      },
      {
        id: 15,
        name: "DICE ROLL",
        image: GAME_IMAGES.diceroll,
        screen: "DiceRoll",
        category: "dice",
        color: "#8B0000",
        minBet: 10,
      },
      {
        id: 16,
        name: "MONEY WHEEL",
        image: GAME_IMAGES.moneywhell,
        screen: "MoneyWheel",
        category: "wheels",
        color: "#8B0000",
        minBet: 25,
      },
      {
        id: 17,
        name: "BIG SIX WHEEL",
        image: GAME_IMAGES.bigsix,
        screen: "BigSix",
        category: "wheels",
        color: "#8B0000",
        minBet: 25,
      },
      {
        id: 18,
        name: "BINGO",
        image: GAME_IMAGES.bingo,
        screen: "Bingo",
        category: "table",
        color: "#8B0000",
        minBet: 20,
      },
      {
        id: 19,
        name: "KENO",
        image: GAME_IMAGES.keno,
        screen: "Keno",
        category: "table",
        color: "#8B0000",
        minBet: 5,
      },
      {
        id: 20,
        name: "WHEEL OF FORTUNE",
        image: GAME_IMAGES.wheelfortune,
        screen: "WheelOfFortune",
        category: "table",
        color: "#8B0000",
        minBet: 50,
      },
      {
        id: 21,
        name: "LOTTERY",
        image: GAME_IMAGES.lottery,
        screen: "Lottery",
        category: "table",
        color: "#8B0000",
        minBet: 10,
      },
      {
        id: 22,
        name: "SCRATCH CARDS",
        image: GAME_IMAGES.scratchcards,
        screen: "ScratchCards",
        category: "table",
        color: "#8B0000",
        minBet: 15,
      },
      {
        id: 23,
        name: "VIDEO POKER",
        image: GAME_IMAGES.videopoker,
        screen: "VideoPoker",
        category: "specialty",
        color: "#8B0000",
        minBet: 25,
      },
      {
        id: 24,
        name: "CARIBBEAN STUD",
        image: GAME_IMAGES.caribbanstud,
        screen: "CaribbeanStud",
        category: "specialty",
        color: "#8B0000",
        minBet: 100,
      },
      {
        id: 25,
        name: "THREE CARD POKER",
        image: GAME_IMAGES.threecardpoker,
        screen: "ThreeCardPoker",
        category: "specialty",
        color: "#8B0000",
        minBet: 50,
      },
      {
        id: 26,
        name: "PAI GOW POKER",
        image: GAME_IMAGES.pajgow,
        screen: "PaiGow",
        category: "specialty",
        color: "#8B0000",
        minBet: 50,
      },
    ],
    []
  );

  // Filtrar juegos basado en la búsqueda
  const filteredGames = useMemo(() => {
    if (!searchQuery.trim()) {
      return featuredGames;
    }
    const query = searchQuery.toLowerCase().trim();
    return featuredGames.filter(
      (game) =>
        game.name.toLowerCase().includes(query) ||
        game.category.toLowerCase().includes(query)
    );
  }, [searchQuery, featuredGames]);

  const featuredGamesList = filteredGames.filter((game) => game.featured);
  const popularGames = filteredGames.filter((game) => game.popular);
  const slotGames = filteredGames.filter((game) => game.category === "slots");
  const cardGames = filteredGames.filter((game) => game.category === "cards");
  const diceGames = filteredGames.filter((game) => game.category === "dice");
  const tableGames = filteredGames.filter((game) => game.category === "table");
  const wheelGames = filteredGames.filter((game) => game.category === "wheels");
  const specialtyGames = filteredGames.filter(
    (game) => game.category === "specialty"
  );

  const handleGamePress = (game) => {
    if (!canAfford(game.minBet)) {
      Alert.alert(
        "FONDOS INSUFICIENTES",
        `Necesitas al menos ${game.minBet} Maneki Coins para jugar a ${game.name}.`,
        [
          { text: "ENTENDIDO", style: "cancel" },
          {
            text: "RECARGAR FICHAS",
            onPress: () => navigation.navigate("BuyCoinsScreen"),
          },
        ]
      );
      return;
    }

    if (game.category === "slots") {
      navigation.navigate("Tragamonedas", { screen: "SlotsMain" });
      setTimeout(() => {
        navigation.navigate("Tragamonedas", {
          screen: game.screen,
          params: { availableCoins: manekiCoins },
        });
      }, 100);
    } else {
      navigation.navigate("Juegos", { screen: "GamesMain" });
      setTimeout(() => {
        navigation.navigate("Juegos", {
          screen: game.screen,
          params: { availableCoins: manekiCoins },
        });
      }, 100);
    }
  };

  const navigateToCategory = (category) => {
    if (category === "Tragamonedas") {
      navigation.navigate("Tragamonedas", { screen: "SlotsMain" });
    } else {
      navigation.navigate("Juegos", { screen: "GamesMain" });
    }
  };

  const handleAddCoins = () => {
    navigation.navigate("BuyCoinsScreen");
  };

  // Componente GameCard optimizado con React.memo
  const GameCard = React.memo(({ game, size = "medium", featured = false }) => (
    <TouchableOpacity
      style={[
        styles.gameCard,
        size === "large" && styles.gameCardLarge,
        featured && styles.featuredGameCard,
        { backgroundColor: game.color },
      ]}
      onPress={() => handleGamePress(game)}
    >
      <GameImage
        source={game.image}
        style={[
          styles.gameImage,
          size === "large" && styles.gameImageLarge,
          featured && styles.featuredGameImage,
        ]}
      />
      <View style={styles.gameOverlay}>
        <View style={styles.gameInfo}>
          <Text
            style={[
              styles.gameName,
              size === "large" && styles.gameNameLarge,
              featured && styles.featuredGameName,
            ]}
          >
            {game.name}
          </Text>
          <View
            style={[styles.playButton, featured && styles.featuredPlayButton]}
          >
            <Text
              style={[
                styles.playButtonText,
                featured && styles.featuredPlayButtonText,
              ]}
            >
              JUGAR
            </Text>
            <Ionicons
              name="play"
              size={16}
              color={featured ? "#FFD700" : "#000"}
            />
          </View>
        </View>
        <View
          style={[styles.minBetBadge, featured && styles.featuredMinBetBadge]}
        >
          <Text
            style={[styles.minBetText, featured && styles.featuredMinBetText]}
          >
            MIN: {game.minBet} MC
          </Text>
        </View>
      </View>
      {game.popular && (
        <View style={styles.popularBadge}>
          <Ionicons name="flame" size={14} color="#FFF" />
          <Text style={styles.popularText}>POPULAR</Text>
        </View>
      )}
      {featured && (
        <View style={styles.featuredBadge}>
          <Ionicons name="star" size={14} color="#FFF" />
          <Text style={styles.featuredBadgeText}>DESTACADO</Text>
        </View>
      )}
    </TouchableOpacity>
  ));

  // Componente Banner para el carrusel
  const BannerItem = ({ item, index }) => (
    <TouchableOpacity
      style={styles.bannerItem}
      activeOpacity={0.9}
      onPress={() => {
        // Acción al presionar el banner
        Alert.alert(item.title, "Promoción especial activa");
      }}
    >
      <Image
        source={item.image}
        style={styles.bannerImage}
        resizeMode="cover"
      />
      <View style={styles.bannerOverlay}>
        <Text style={styles.bannerTitle}>{item.title}</Text>
        <View style={styles.bannerCta}>
          <Text style={styles.bannerCtaText}>VER MÁS</Text>
          <Ionicons name="arrow-forward" size={16} color="#FFD700" />
        </View>
      </View>
    </TouchableOpacity>
  );

  // Indicadores del carrusel
  const renderBannerIndicators = () => (
    <View style={styles.indicatorsContainer}>
      {BANNERS.map((_, index) => {
        const inputRange = [
          (index - 1) * width,
          index * width,
          (index + 1) * width,
        ];

        const dotWidth = scrollX.interpolate({
          inputRange,
          outputRange: [8, 20, 8],
          extrapolate: "clamp",
        });

        const opacity = scrollX.interpolate({
          inputRange,
          outputRange: [0.3, 1, 0.3],
          extrapolate: "clamp",
        });

        return (
          <Animated.View
            key={index}
            style={[
              styles.indicator,
              {
                width: dotWidth,
                opacity,
              },
            ]}
          />
        );
      })}
    </View>
  );

  const renderGameSection = (
    title,
    games,
    showSeeAll = true,
    category = null
  ) => {
    if (games.length === 0) return null;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{title}</Text>
          {showSeeAll && (
            <TouchableOpacity
              style={styles.seeAllButton}
              onPress={() => navigateToCategory(category || "Juegos")}
            >
              <Text style={styles.seeAllText}>VER TODOS</Text>
              <Ionicons name="chevron-forward" size={16} color="#FFD700" />
            </TouchableOpacity>
          )}
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.horizontalScroll}
        >
          {games.map((game) => (
            <GameCard key={game.id} game={game} size="large" />
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderFeaturedGames = () => {
    if (featuredGamesList.length === 0) return null;

    return (
      <View style={styles.featuredSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.featuredSectionTitle}>JUEGOS DESTACADOS</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.featuredScroll}
          pagingEnabled
        >
          {featuredGamesList.map((game) => (
            <GameCard key={game.id} game={game} featured={true} />
          ))}
        </ScrollView>
      </View>
    );
  };

  // Formatear número con separadores de miles
  const formatCoins = (coins) => {
    return coins.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#8B0000" />

      {/* Header Mejorado */}
      <View style={styles.header}>
        {/* Logo y Título - SIN ICONO DE HUELLA */}
        <View style={styles.logoContainer}>
          <View style={styles.titleContainer}>
            <Text style={styles.japaneseTitle}>招きカジノ</Text>
            <Text style={styles.englishTitle}>MANEKI CASINO</Text>
          </View>
        </View>

        {/* Saldo y Perfil */}
        <View style={styles.headerRight}>
          {/* Coins */}
          <TouchableOpacity
            style={styles.coinsDisplay}
            onPress={handleAddCoins}
          >
            <View style={styles.coinsContent}>
              <Ionicons name="diamond" size={18} color="#FFD700" />
              <Text style={styles.coinsText}>{formatCoins(manekiCoins)}</Text>
              <Ionicons
                name="add-circle"
                size={20}
                color="#FFD700"
                style={styles.addIcon}
              />
            </View>
          </TouchableOpacity>

          {/* Tickets NEW */}
          <TouchableOpacity
            style={[styles.coinsDisplay, { marginLeft: 8 }]}
            onPress={() => navigation.navigate("Tickets")}
          >
            <View style={styles.coinsContent}>
              <Ionicons name="ticket-outline" size={18} color="#FFD700" />
              <Text style={styles.coinsText}>{formatCoins(tickets)}</Text>
            </View>
          </TouchableOpacity>

          {/* Perfil */}
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => navigation.navigate("Profile")}
          >
            <Ionicons name="person-circle" size={38} color="#FFD700" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Contenido principal */}
      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#FFD700"]}
            tintColor="#FFD700"
            title="Actualizando monedas..."
            titleColor="#FFD700"
          />
        }
      >
        {/* Carrusel de Banners */}
        <View style={styles.bannerSection}>
          <FlatList
            ref={flatListRef}
            data={BANNERS}
            renderItem={BannerItem}
            keyExtractor={(item) => item.id.toString()}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { x: scrollX } } }],
              { useNativeDriver: false }
            )}
            onMomentumScrollEnd={(event) => {
              const newIndex = Math.round(
                event.nativeEvent.contentOffset.x / width
              );
              setCurrentBannerIndex(newIndex);
            }}
            scrollEventThrottle={16}
          />
          {renderBannerIndicators()}
        </View>

        {/* Barra de búsqueda */}
        <View style={styles.searchContainer}>
          <Ionicons
            name="search"
            size={20}
            color="#FF6B6B"
            style={styles.searchIcon}
          />
          <TextInput
            placeholder="Buscar juegos..."
            placeholderTextColor="#999"
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={18} color="#FF6B6B" />
            </TouchableOpacity>
          )}
        </View>

        {/* Mostrar resultados de búsqueda o secciones normales */}
        {searchQuery.trim() ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                RESULTADOS DE BÚSQUEDA ({filteredGames.length})
              </Text>
            </View>
            {filteredGames.length === 0 ? (
              <View style={styles.noResults}>
                <Ionicons name="search-outline" size={50} color="#666" />
                <Text style={styles.noResultsText}>
                  No se encontraron juegos
                </Text>
                <Text style={styles.noResultsSubtext}>
                  Intenta con otros términos de búsqueda
                </Text>
              </View>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.horizontalScroll}
                removeClippedSubviews={true}
              >
                {filteredGames.map((game) => (
                  <GameCard key={game.id} game={game} size="large" />
                ))}
              </ScrollView>
            )}
          </View>
        ) : (
          <>
            {/* Juegos Destacados */}
            {renderFeaturedGames()}

            {/* Juegos Populares */}
            {renderGameSection(
              "JUEGOS POPULARES",
              popularGames,
              true,
              "Juegos"
            )}

            {/* Tragamonedas */}
            {renderGameSection("TRAGAMONEDAS", slotGames, true, "Tragamonedas")}

            {/* Juegos de Cartas */}
            {renderGameSection("JUEGOS DE CARTAS", cardGames, true, "Juegos")}

            {/* Juegos de Dados */}
            {renderGameSection("JUEGOS DE DADOS", diceGames, true, "Juegos")}

            {/* Juegos de Ruedas */}
            {renderGameSection("JUEGOS DE RUEDAS", wheelGames, true, "Juegos")}

            {/* Juegos de Mesa */}
            {renderGameSection("JUEGOS DE MESA", tableGames, true, "Juegos")}

            {/* Juegos Especiales */}
            {renderGameSection(
              "JUEGOS ESPECIALES",
              specialtyGames,
              true,
              "Juegos"
            )}

            {/* Estadísticas */}
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <Ionicons name="trophy" size={24} color="#FFD700" />
                <Text style={styles.statNumber}>{featuredGames.length}+</Text>
                <Text style={styles.statLabel}>JUEGOS</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="people" size={24} color="#FFD700" />
                <Text style={styles.statNumber}>50K+</Text>
                <Text style={styles.statLabel}>JUGADORES</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="star" size={24} color="#FFD700" />
                <Text style={styles.statNumber}>99%</Text>
                <Text style={styles.statLabel}>SATISFACCIÓN</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="shield-checkmark" size={24} color="#FFD700" />
                <Text style={styles.statNumber}>100%</Text>
                <Text style={styles.statLabel}>SEGURO</Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F0F0F",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: 15,
    backgroundColor: "#8B0000",
    borderBottomWidth: 3,
    borderBottomColor: "#FFD700",
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  titleContainer: {
    flex: 1,
  },
  japaneseTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFD700",
    fontFamily: Platform.OS === "ios" ? "Hiragino Mincho ProN" : "serif",
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  englishTitle: {
    fontSize: 12,
    color: "#FFF",
    fontWeight: "300",
    letterSpacing: 2,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  coinsDisplay: {
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#FFD700",
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  coinsContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  coinsText: {
    color: "#FFD700",
    fontSize: 16,
    fontWeight: "bold",
  },
  addIcon: {
    marginLeft: 4,
  },
  profileButton: {
    padding: 2,
  },
  scrollContainer: {
    flex: 1,
  },
  // Estilos del carrusel de banners
  bannerSection: {
    height: 200,
    marginBottom: 20,
    position: "relative",
  },
  bannerItem: {
    width: width,
    height: 200,
    position: "relative",
  },
  bannerImage: {
    width: "100%",
    height: "100%",
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "flex-end",
    padding: 20,
  },
  bannerTitle: {
    color: "#FFD700",
    fontSize: 24,
    fontWeight: "bold",
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
    marginBottom: 10,
  },
  bannerCta: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "rgba(139, 0, 0, 0.8)",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 5,
  },
  bannerCtaText: {
    color: "#FFD700",
    fontSize: 14,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  indicatorsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    bottom: 15,
    left: 0,
    right: 0,
    gap: 8,
  },
  indicator: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FFD700",
    marginHorizontal: 4,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(26, 26, 26, 0.8)",
    marginHorizontal: 20,
    marginVertical: 10,
    borderRadius: 15,
    paddingHorizontal: 15,
    height: 50,
    borderWidth: 2,
    borderColor: "rgba(255, 107, 107, 0.6)",
  },
  searchInput: {
    flex: 1,
    color: "#FFF",
    fontSize: 16,
    paddingHorizontal: 10,
    fontWeight: "500",
  },
  searchIcon: {
    marginRight: 8,
  },
  section: {
    marginBottom: 30,
  },
  featuredSection: {
    marginBottom: 25,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  sectionTitle: {
    color: "#FFD700",
    fontSize: 18,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  featuredSectionTitle: {
    color: "#FFD700",
    fontSize: 22,
    fontWeight: "bold",
    letterSpacing: 1,
    textAlign: "center",
    width: "100%",
  },
  seeAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  seeAllText: {
    color: "#FFD700",
    fontSize: 12,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  horizontalScroll: {
    paddingLeft: 20,
  },
  featuredScroll: {
    paddingLeft: 20,
  },
  gameCard: {
    width: width * 0.75,
    height: 200,
    borderRadius: 15,
    marginRight: 15,
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#8B0000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  featuredGameCard: {
    width: width * 0.85,
    height: 250,
    borderWidth: 3,
    borderColor: "#FFD700",
    elevation: 12,
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
  },
  gameCardLarge: {
    width: width * 0.8,
    height: 220,
  },
  gameImage: {
    width: "100%",
    height: "100%",
  },
  gameImageLarge: {
    height: "100%",
  },
  featuredGameImage: {
    height: "100%",
  },
  placeholderImage: {
    width: "100%",
    height: "100%",
    backgroundColor: "#1a1a1a",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFD700",
    borderStyle: "dashed",
  },
  placeholderText: {
    color: "#FFD700",
    fontSize: 12,
    fontWeight: "bold",
    marginTop: 8,
    textAlign: "center",
  },
  gameOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
    padding: 15,
  },
  gameInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  gameName: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
    flex: 1,
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    letterSpacing: 0.5,
  },
  gameNameLarge: {
    fontSize: 18,
  },
  featuredGameName: {
    fontSize: 20,
    color: "#FFD700",
    textShadowColor: "rgba(0,0,0,0.9)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
  },
  playButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFD700",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  featuredPlayButton: {
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    borderWidth: 1,
    borderColor: "#FFD700",
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  playButtonText: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 12,
    letterSpacing: 0.5,
  },
  featuredPlayButtonText: {
    color: "#FFD700",
    fontSize: 14,
  },
  minBetBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  featuredMinBetBadge: {
    backgroundColor: "rgba(255, 215, 0, 0.9)",
  },
  minBetText: {
    color: "#FFD700",
    fontSize: 10,
    fontWeight: "bold",
  },
  featuredMinBetText: {
    color: "#000",
    fontSize: 11,
  },
  popularBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FF6B6B",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  popularText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  featuredBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFD700",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  featuredBadgeText: {
    color: "#000",
    fontSize: 10,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  noResults: {
    alignItems: "center",
    padding: 40,
    marginHorizontal: 20,
  },
  noResultsText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
  },
  noResultsSubtext: {
    color: "#999",
    fontSize: 14,
    textAlign: "center",
  },
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 30,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#1a1a1a",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#333",
    gap: 8,
  },
  statNumber: {
    color: "#FFD700",
    fontSize: 16,
    fontWeight: "bold",
  },
  statLabel: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "500",
    textAlign: "center",
  },
});
