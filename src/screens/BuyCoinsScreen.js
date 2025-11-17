// src/screens/BuyCoinsScreen.js
import React, { useState, useEffect } from "react";
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
import { supabase } from "../config/supabase";
import { StripeProvider, useStripe } from '@stripe/stripe-react-native';

// ✅ URL DE NGROK - CAMBIAR POR TU URL
const API_URL = "https://semimanneristic-flurried-carolann.ngrok-free.dev";

// Componente principal envuelto en StripeProvider
export default function BuyCoinsScreen({ navigation }) {
  return (
    <StripeProvider
      publishableKey="pk_test_51SS2vZ3KzYA7b3meOUWmJUmoq5nSVqr5HcDjjuqY33TnxYfzJtrW25cyu9H46BMaHmIzrhB98lOoVBokaSJ7kwZh00SZoBZ9dw"
      merchantIdentifier="merchant.com.manekicasino"
      urlScheme="manekicasino"
    >
      <BuyCoinsContent navigation={navigation} />
    </StripeProvider>
  );
}

// Componente de contenido
function BuyCoinsContent({ navigation }) {
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const { addCoins, manekiCoins } = useCoins();
  
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

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
      coins: 1200,
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
      coins: 6000,
      price: 2000.0,
      image: require("../assets/PAC4SINFONDO.png"),
      name: "Paquete Premium",
      tag: "PREMIUM",
      color: "#32CD32",
      description: "Para jugadores avanzados",
    },
    {
      id: 4,
      coins: 15000,
      price: 5000.0,
      image: require("../assets/PAC3SINFONDO.png"),
      name: "Paquete Máximo Valor",
      tag: "MAXIMO VALOR",
      color: "#4169E1",
      description: "Máximo ahorro por moneda",
    },
  ];

  useEffect(() => {
    getCurrentUser();
  }, []);

  const getCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUser(user);
      }
    } catch (error) {
      console.error('❌ Error obteniendo usuario:', error);
    }
  };

  const calculatePricePerCoin = (price, coins) => {
    return (price / coins).toFixed(3);
  };

  const getBestValuePackage = () => {
    const values = coinPackages.map((pkg) => pkg.coins / pkg.price);
    const maxValue = Math.max(...values);
    return coinPackages.find((pkg) => pkg.coins / pkg.price === maxValue)?.id;
  };

  // ✅ ALERTAS MEJORADAS - ESTILO MANEKI CASINO
  const showSuccessAlert = (coins, transactionId) => {
    Alert.alert(
      "🎉 ¡COMPRA EXITOSA!",
      `Acabas de adquirir ${coins.toLocaleString()} Maneki Coins\n\nTu transacción fue procesada correctamente.`,
      [
        {
          text: "CONTINUAR",
          style: "default",
          onPress: () => {
            setIsProcessing(false);
            navigation.goBack();
          },
        },
      ]
    );
  };

  const showErrorAlert = (message) => {
    Alert.alert(
      "❌ ERROR EN PAGO",
      message,
      [
        {
          text: "ENTENDIDO",
          style: "cancel",
        },
      ]
    );
  };

  const showCancelAlert = () => {
    Alert.alert(
      "⚠️ PAGO CANCELADO",
      "El proceso de pago fue cancelado. Puedes intentarlo nuevamente cuando lo desees.",
      [
        {
          text: "CONTINUAR",
          style: "cancel",
        },
      ]
    );
  };

  const handleBuyCoins = async (packageItem) => {
    if (!currentUser) {
      Alert.alert(
        "🔐 SESIÓN REQUERIDA",
        "Necesitas iniciar sesión para realizar compras en Maneki Casino",
        [
          { 
            text: "INICIAR SESIÓN", 
            onPress: () => navigation.navigate('Login') 
          },
          {
            text: "MÁS TARDE",
            style: "cancel"
          }
        ]
      );
      return;
    }

    Alert.alert(
      "💰 CONFIRMAR COMPRA",
      `¿Estás seguro de comprar ${packageItem.coins.toLocaleString()} Maneki Coins por $${packageItem.price.toFixed(2)} MXN?`,
      [
        {
          text: "CANCELAR",
          style: "cancel",
        },
        {
          text: "PAGAR CON STRIPE",
          onPress: () => processStripePayment(packageItem),
        },
      ]
    );
  };

  // ✅ MÉTODO CORREGIDO: Procesar pago con Stripe real
  const processStripePayment = async (packageItem) => {
    try {
      setIsProcessing(true);

      // ✅ 1. Crear Payment Intent
      const response = await fetch(`${API_URL}/create-payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: packageItem.price,
          currency: 'mxn',
          userId: currentUser.id,
          packageId: packageItem.id,
          packageName: packageItem.name,
          coins: packageItem.coins
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error ${response.status}: ${errorText}`);
      }

      const result = await response.json();

      // 2. Configurar Payment Sheet de Stripe
      const { error: initError } = await initPaymentSheet({
        paymentIntentClientSecret: result.clientSecret,
        merchantDisplayName: 'Maneki Casino',
        returnURL: 'manekicasino://stripe-redirect',
        style: 'automatic',
        allowsDelayedPaymentMethods: false,
      });

      if (initError) {
        throw new Error(`Error Stripe: ${initError.message}`);
      }

      // 3. Mostrar Payment Sheet
      const { error: paymentError } = await presentPaymentSheet();

      if (paymentError) {
        if (paymentError.code === 'Canceled') {
          showCancelAlert();
        } else {
          showErrorAlert(`No se pudo procesar el pago: ${paymentError.message}`);
        }
        setIsProcessing(false);
        return;
      }

      // 4. ✅ PAGO EXITOSO - Confirmar en nuestro servidor
      await confirmPayment(result.paymentIntentId, packageItem);

    } catch (error) {
      console.error('❌ Error en proceso de pago:', error);
      showErrorAlert(`No se pudo completar la transacción: ${error.message}`);
      setIsProcessing(false);
    }
  };

  // ✅ MÉTODO CORREGIDO: Confirmar pago
  const confirmPayment = async (paymentIntentId, packageItem) => {
    try {
      const response = await fetch(`${API_URL}/confirm-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentIntentId: paymentIntentId,
          userId: currentUser.id,
          coins: packageItem.coins,
          packageName: packageItem.name,
          packageId: packageItem.id
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        // Agregar coins al contexto local
        addCoins(packageItem.coins, `Compra de ${packageItem.name} via Stripe`);
        showSuccessAlert(packageItem.coins, result.transactionId);
      } else {
        throw new Error(result.error || 'Error desconocido');
      }
    } catch (error) {
      console.error('❌ Error confirmando pago:', error);
      showErrorAlert(`Error al confirmar el pago: ${error.message}`);
      setIsProcessing(false);
    }
  };

  const bestValueId = getBestValuePackage();

  // Si está procesando, mostrar pantalla de carga
  if (isProcessing) {
    return (
      <View style={styles.processingContainer}>
        <View style={styles.processingCard}>
          <ActivityIndicator size="large" color="#FFD700" />
          <Text style={styles.processingTitle}>PROCESANDO PAGO</Text>
          <Text style={styles.processingText}>
            Estamos procesando tu transacción...
          </Text>
          <Text style={styles.processingSubtext}>
            No cierres la aplicación
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ALERTA DE NO AUTENTICADO */}
        {!currentUser && (
          <View style={styles.authAlert}>
            <Ionicons name="warning" size={20} color="#FFD700" />
            <Text style={styles.authAlertText}>
              Debes iniciar sesión para comprar coins
            </Text>
            <TouchableOpacity 
              style={styles.loginButton}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.loginButtonText}>INICIAR SESIÓN</Text>
            </TouchableOpacity>
          </View>
        )}

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
              (!currentUser) && styles.packageDisabled,
            ]}
            onPress={() => setSelectedPackage(pkg.id)}
            activeOpacity={0.7}
            disabled={isProcessing || !currentUser}
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
        {selectedPackage && currentUser && (
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
        {selectedPackage && currentUser && (
          <TouchableOpacity
            style={[
              styles.buyButton, 
              isProcessing && styles.buyButtonDisabled
            ]}
            onPress={() =>
              handleBuyCoins(coinPackages.find((p) => p.id === selectedPackage))
            }
            disabled={isProcessing}
          >
            {isProcessing ? (
              <View style={styles.buttonProcessingContainer}>
                <ActivityIndicator size="small" color="#000" />
                <Text style={styles.buttonProcessingText}>PROCESANDO...</Text>
              </View>
            ) : (
              <View style={styles.buyButtonContent}>
                <Ionicons name="card" size={20} color="#000" />
                <View style={styles.buyButtonTexts}>
                  <Text style={styles.buyButtonText}>PAGAR CON STRIPE</Text>
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
            <Text style={styles.securityTitle}>COMPRA 100% SEGURA</Text>
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
  authAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,215,0,0.1)',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#FFD700',
  },
  authAlertText: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    marginLeft: 10,
  },
  loginButton: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  loginButtonText: {
    color: '#000',
    fontSize: 12,
    fontWeight: 'bold',
  },
  processingContainer: {
    flex: 1,
    backgroundColor: "#0F0F0F",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  processingCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: 20,
    padding: 40,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFD700",
  },
  processingTitle: {
    color: "#FFD700",
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
  },
  processingText: {
    color: "#FFFFFF",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 5,
  },
  processingSubtext: {
    color: "#999",
    fontSize: 14,
    textAlign: "center",
  },
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
  sectionTitle: {
    color: "#FFD700",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
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
  packageDisabled: {
    opacity: 0.5,
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
  buyButton: {
    backgroundColor: "#FFD700",
    borderRadius: 25,
    paddingVertical: 18,
    marginBottom: 25,
  },
  buyButtonDisabled: {
    opacity: 0.6,
    backgroundColor: "#666",
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
  buttonProcessingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  buttonProcessingText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "600",
  },
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