// src/screens/BuyCoinsScreen.js
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useCoins } from "../context/CoinsContext";

export default function BuyCoinsScreen({ navigation }) {
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { addCoins, manekiCoins } = useCoins();

  const coinPackages = [
    {
      id: 1,
      coins: 500,
      price: 200.0,
      image: require("../assets/PAC1SINFONDO.png"),
      name: "Paquete Económico",
      tag: "ECONÓMICO",
      color: "#8B0000",
      description: "Perfecto para empezar",
    },
    {
      id: 2,
      coins: 1200, // ⬆️ Aumenté de 1000 a 1200
      price: 500.0,
      image: require("../assets/PAC2SINFONDO.png"),
      name: "Paquete Popular",
      popular: true,
      tag: "MÁS POPULAR",
      color: "#FFD700",
      description: "Mejor relación calidad-precio",
    },
    {
      id: 3,
      coins: 6000, // ⬆️ Aumenté de 5000 a 6000
      price: 2000.0,
      image: require("../assets/PAC4SINFONDO.png"),
      name: "Paquete Premium",
      tag: "PREMIUM",
      color: "#32CD32",
      description: "Para jugadores avanzados",
    },
    {
      id: 4,
      coins: 15000, // ⬆️ Aumenté de 10000 a 15000
      price: 5000.0,
      image: require("../assets/PAC3SINFONDO.png"),
      name: "Paquete Máximo Valor",
      tag: "MAXIMO VALOR",
      color: "#4169E1",
      description: "Máximo ahorro por moneda",
    },
  ];

  const calculatePricePerCoin = (price, coins) => {
    return (price / coins).toFixed(3);
  };

  const getBestValuePackage = () => {
    const values = coinPackages.map((pkg) => pkg.coins / pkg.price);
    const maxValue = Math.max(...values);
    return coinPackages.find((pkg) => pkg.coins / pkg.price === maxValue)?.id;
  };

  const handleBuyCoins = (packageItem) => {
    Alert.alert(
      "Confirmar Compra",
      `¿Estás seguro de que quieres comprar ${packageItem.coins.toLocaleString()} Maneki Coins por $${packageItem.price.toFixed(
        2
      )} MXN?\n\nRecibirás: ${packageItem.coins.toLocaleString()} MC\nNuevo saldo: ${(
        manekiCoins + packageItem.coins
      ).toLocaleString()} MC`,
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Comprar Ahora",
          onPress: async () => {
            try {
              setIsProcessing(true);
              // Simulación de procesamiento
              await new Promise((resolve) => setTimeout(resolve, 1500));

              addCoins(packageItem.coins, `Compra de ${packageItem.name}`);

              Alert.alert(
                "Compra Exitosa",
                `Has adquirido ${packageItem.coins.toLocaleString()} Maneki Coins exitosamente.\n\nTu nuevo saldo es: ${(
                  manekiCoins + packageItem.coins
                ).toLocaleString()} MC`,
                [
                  {
                    text: "Continuar",
                    onPress: () => navigation.goBack(),
                  },
                ]
              );
            } catch (error) {
              Alert.alert(
                "Error",
                "No se pudo completar la compra. Por favor, intenta nuevamente."
              );
            } finally {
              setIsProcessing(false);
            }
          },
        },
      ]
    );
  };

  const bestValueId = getBestValuePackage();

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* SALDO ACTUAL DEL USUARIO */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceHeader}>
            <Ionicons name="wallet" size={24} color="#FFD700" />
            <Text style={styles.balanceTitle}>TU SALDO ACTUAL</Text>
          </View>
          <Text style={styles.balanceAmount}>
            {manekiCoins.toLocaleString()} MC
          </Text>
          <Text style={styles.balanceSubtitle}>Maneki Coins disponibles</Text>
        </View>

        {/* BANNER PROMOCIONAL */}
        <View style={styles.promoBanner}>
          <View style={styles.promoIcon}>
            <Ionicons name="diamond" size={32} color="#FFD700" />
          </View>
          <View style={styles.promoContent}>
            <Text style={styles.promoTitle}>OFERTAS EXCLUSIVAS</Text>
            <Text style={styles.promoText}>
              Potencia tu experiencia de juego con nuestros paquetes premium
            </Text>
          </View>
        </View>

        {/* INDICADOR DE MEJOR VALOR */}
        <View style={styles.bestValueInfo}>
          <Ionicons name="trophy" size={16} color="#FFD700" />
          <Text style={styles.bestValueText}>
            El {coinPackages.find((p) => p.id === bestValueId)?.name} ofrece el
            mejor valor por tu dinero
          </Text>
        </View>

        {/* SELECCIÓN DE PAQUETES */}
        <Text style={styles.sectionTitle}>SELECCIONA TU PAQUETE</Text>

        {coinPackages.map((pkg) => (
          <TouchableOpacity
            key={pkg.id}
            style={[
              styles.packageCard,
              selectedPackage === pkg.id && styles.packageSelected,
              pkg.popular && styles.popularPackage,
              pkg.id === bestValueId && styles.bestValuePackage,
            ]}
            onPress={() => setSelectedPackage(pkg.id)}
            activeOpacity={0.7}
          >
            {/* ETIQUETAS SUPERIORES */}
            <View style={styles.cardHeader}>
              <View style={[styles.packageTag, { backgroundColor: pkg.color }]}>
                <Text style={styles.packageTagText}>{pkg.tag}</Text>
              </View>
              {pkg.popular && (
                <View style={styles.popularIndicator}>
                  <Ionicons name="flash" size={12} color="#000" />
                  <Text style={styles.popularIndicatorText}>POPULAR</Text>
                </View>
              )}
            </View>

            {/* CONTENIDO DEL PAQUETE */}
            <View style={styles.cardContent}>
              <View style={styles.imageContainer}>
                <Image
                  source={pkg.image}
                  style={styles.image}
                  resizeMode="contain"
                />
              </View>

              <View style={styles.packageInfo}>
                <Text style={styles.coinAmount}>
                  {pkg.coins.toLocaleString()} MC
                </Text>
                <Text style={styles.packageDescription}>{pkg.description}</Text>

                <View style={styles.priceSection}>
                  <Text style={styles.price}>${pkg.price.toFixed(2)} MXN</Text>
                  <Text style={styles.pricePerCoin}>
                    ${calculatePricePerCoin(pkg.price, pkg.coins)} por moneda
                  </Text>
                </View>
              </View>

              <View style={styles.selectionIndicator}>
                <Ionicons
                  name={
                    selectedPackage === pkg.id
                      ? "checkmark-circle"
                      : "radio-button-off"
                  }
                  size={24}
                  color={selectedPackage === pkg.id ? "#32CD32" : "#666"}
                />
              </View>
            </View>

            <Text style={styles.packageName}>{pkg.name}</Text>
          </TouchableOpacity>
        ))}

        {/* RESUMEN DE COMPRA */}
        {selectedPackage && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>RESUMEN DE COMPRA</Text>
            <View style={styles.summaryDetails}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Paquete seleccionado:</Text>
                <Text style={styles.summaryValue}>
                  {coinPackages.find((p) => p.id === selectedPackage).name}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Monedas a recibir:</Text>
                <Text style={styles.summaryValue}>
                  {coinPackages
                    .find((p) => p.id === selectedPackage)
                    .coins.toLocaleString()}{" "}
                  MC
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Precio total:</Text>
                <Text style={styles.summaryPrice}>
                  $
                  {coinPackages
                    .find((p) => p.id === selectedPackage)
                    .price.toFixed(2)}{" "}
                  MXN
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Nuevo saldo:</Text>
                <Text style={styles.summaryNewBalance}>
                  {(
                    manekiCoins +
                    coinPackages.find((p) => p.id === selectedPackage).coins
                  ).toLocaleString()}{" "}
                  MC
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* BOTÓN DE COMPRA */}
        {selectedPackage && (
          <TouchableOpacity
            style={[styles.buyButton, isProcessing && styles.buyButtonDisabled]}
            onPress={() =>
              handleBuyCoins(coinPackages.find((p) => p.id === selectedPackage))
            }
            disabled={isProcessing}
          >
            {isProcessing ? (
              <View style={styles.processingContainer}>
                <ActivityIndicator size="small" color="#000" />
                <Text style={styles.processingText}>Procesando compra...</Text>
              </View>
            ) : (
              <View style={styles.buyButtonContent}>
                <Ionicons name="cart" size={20} color="#000" />
                <View style={styles.buyButtonTexts}>
                  <Text style={styles.buyButtonText}>COMPRAR AHORA</Text>
                  <Text style={styles.buyButtonSubtext}>
                    $
                    {coinPackages
                      .find((p) => p.id === selectedPackage)
                      .price.toFixed(2)}{" "}
                    MXN
                  </Text>
                </View>
                <Ionicons name="lock-closed" size={16} color="#000" />
              </View>
            )}
          </TouchableOpacity>
        )}

        {/* INFORMACIÓN DE SEGURIDAD */}
        <View style={styles.securitySection}>
          <View style={styles.securityHeader}>
            <Ionicons name="shield-checkmark" size={18} color="#32CD32" />
            <Text style={styles.securityTitle}>Compra 100% Segura</Text>
          </View>
          <View style={styles.securityFeatures}>
            <View style={styles.securityItem}>
              <Ionicons name="flash" size={14} color="#FFD700" />
              <Text style={styles.securityItemText}>Entrega Inmediata</Text>
            </View>
            <View style={styles.securityItem}>
              <Ionicons name="lock-closed" size={14} color="#FFD700" />
              <Text style={styles.securityItemText}>Pago Seguro</Text>
            </View>
            <View style={styles.securityItem}>
              <Ionicons name="headset" size={14} color="#FFD700" />
              <Text style={styles.securityItemText}>Soporte 24/7</Text>
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
    backgroundColor: "#0F0F0F",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 30,
  },
  // Tarjeta de Saldo
  balanceCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: "#FFD700",
    alignItems: "center",
  },
  balanceHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  balanceTitle: {
    color: "#FFD700",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  balanceAmount: {
    color: "#FFD700",
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 5,
  },
  balanceSubtitle: {
    color: "#FFFFFF",
    fontSize: 14,
    opacity: 0.8,
  },
  // Banner Promocional
  promoBanner: {
    backgroundColor: "rgba(139, 0, 0, 0.3)",
    borderRadius: 15,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#FFD700",
  },
  promoIcon: {
    backgroundColor: "rgba(255, 215, 0, 0.2)",
    padding: 12,
    borderRadius: 12,
    marginRight: 15,
  },
  promoContent: {
    flex: 1,
  },
  promoTitle: {
    color: "#FFD700",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },
  promoText: {
    color: "#FFFFFF",
    fontSize: 14,
    lineHeight: 18,
    opacity: 0.9,
  },
  // Mejor Valor
  bestValueInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 215, 0, 0.1)",
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
    borderLeftWidth: 3,
    borderLeftColor: "#FFD700",
  },
  bestValueText: {
    color: "#FFD700",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 8,
    flex: 1,
  },
  // Sección de Paquetes
  sectionTitle: {
    color: "#FFD700",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  // Tarjetas de Paquetes
  packageCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: "#333",
  },
  packageSelected: {
    borderColor: "#FFD700",
    backgroundColor: "rgba(255, 215, 0, 0.05)",
  },
  popularPackage: {
    borderColor: "#32CD32",
  },
  bestValuePackage: {
    borderColor: "#FFD700",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  packageTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  packageTagText: {
    color: "#000",
    fontSize: 10,
    fontWeight: "bold",
  },
  popularIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#32CD32",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  popularIndicatorText: {
    color: "#000",
    fontSize: 10,
    fontWeight: "bold",
    marginLeft: 4,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  imageContainer: {
    width: 80,
    height: 80,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  image: {
    width: 70,
    height: 70,
  },
  packageInfo: {
    flex: 1,
  },
  coinAmount: {
    color: "#FFD700",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  packageDescription: {
    color: "#FFFFFF",
    fontSize: 12,
    marginBottom: 8,
    opacity: 0.8,
  },
  priceSection: {
    marginTop: 5,
  },
  price: {
    color: "#32CD32",
    fontSize: 20,
    fontWeight: "bold",
  },
  pricePerCoin: {
    color: "#999",
    fontSize: 11,
    marginTop: 2,
  },
  selectionIndicator: {
    marginLeft: 10,
  },
  packageName: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#333",
  },
  // Resumen de Compra
  summaryCard: {
    backgroundColor: "rgba(255, 215, 0, 0.1)",
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: "#FFD700",
  },
  summaryTitle: {
    color: "#FFD700",
    fontWeight: "bold",
    fontSize: 18,
    marginBottom: 15,
    textAlign: "center",
  },
  summaryDetails: {
    gap: 10,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryLabel: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
  },
  summaryValue: {
    color: "#FFD700",
    fontSize: 14,
    fontWeight: "600",
  },
  summaryPrice: {
    color: "#32CD32",
    fontSize: 16,
    fontWeight: "bold",
  },
  summaryNewBalance: {
    color: "#FFD700",
    fontSize: 16,
    fontWeight: "bold",
  },
  // Botón de Compra
  buyButton: {
    backgroundColor: "#FFD700",
    borderRadius: 25,
    paddingVertical: 18,
    marginBottom: 25,
  },
  buyButtonDisabled: {
    opacity: 0.7,
  },
  buyButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  buyButtonTexts: {
    flex: 1,
    alignItems: "center",
  },
  buyButtonText: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 18,
  },
  buyButtonSubtext: {
    color: "#000",
    fontSize: 12,
    opacity: 0.8,
    marginTop: 2,
  },
  processingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  processingText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "600",
  },
  // Sección de Seguridad
  securitySection: {
    backgroundColor: "rgba(139, 0, 0, 0.2)",
    borderRadius: 15,
    padding: 20,
    borderWidth: 1,
    borderColor: "#333",
  },
  securityHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
  },
  securityTitle: {
    color: "#32CD32",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  securityFeatures: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  securityItem: {
    alignItems: "center",
    flex: 1,
  },
  securityItemText: {
    color: "#FFD700",
    fontSize: 10,
    marginTop: 4,
    textAlign: "center",
  },
});
