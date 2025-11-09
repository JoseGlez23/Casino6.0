import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SectionList,
  StatusBar,
  Modal,
  ScrollView,
  RefreshControl,
  Alert,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useCoins } from "../context/CoinsContext";

const { height: screenHeight } = Dimensions.get("window");

export default function WalletScreen({ navigation }) {
  const {
    manekiCoins,
    transactions: allTransactionsFromContext,
    isLoading,
    lastSync,
    refreshCoins,
  } = useCoins();

  const [filter, setFilter] = useState("all");
  const [customDate, setCustomDate] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateType, setDateType] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState("");

  // Sincronización automática cada 30 segundos y actualizar timestamp
  useEffect(() => {
    setLastUpdate(new Date().toLocaleTimeString());

    const interval = setInterval(() => {
      if (!isRefreshing) {
        refreshData();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [manekiCoins, allTransactionsFromContext]);

  const refreshData = async () => {
    try {
      setIsRefreshing(true);
      await refreshCoins();
      setLastUpdate(new Date().toLocaleTimeString());
    } catch (error) {
      console.error("❌ Error en actualización automática:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleManualRefresh = async () => {
    await refreshData();
    Alert.alert("✅", "Datos actualizados correctamente");
  };

  // MEJORADA: Función para formatear fecha con AM/PM
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const timeString = date.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    return {
      date: date.toLocaleDateString("es-ES"),
      time: timeString,
      fullDate: date,
    };
  };

  // Generar opciones de años (últimos 5 años)
  const getYearOptions = () => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => currentYear - i);
  };

  // Generar opciones de meses
  const getMonthOptions = () => {
    return [
      { value: 1, label: "Enero" },
      { value: 2, label: "Febrero" },
      { value: 3, label: "Marzo" },
      { value: 4, label: "Abril" },
      { value: 5, label: "Mayo" },
      { value: 6, label: "Junio" },
      { value: 7, label: "Julio" },
      { value: 8, label: "Agosto" },
      { value: 9, label: "Septiembre" },
      { value: 10, label: "Octubre" },
      { value: 11, label: "Noviembre" },
      { value: 12, label: "Diciembre" },
    ];
  };

  // Generar opciones de semanas (últimas 8 semanas)
  const getWeekOptions = () => {
    const weeks = [];
    const today = new Date();
    for (let i = 0; i < 8; i++) {
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay() - i * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      weeks.push({
        value: i,
        label: `Semana ${i + 1}`,
        start: new Date(weekStart),
        end: new Date(weekEnd),
      });
    }
    return weeks;
  };

  // Generar opciones de días (últimos 30 días)
  const getDayOptions = () => {
    const days = [];
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      days.push({
        value: i,
        label: date.toLocaleDateString("es-ES"),
        date: new Date(date),
      });
    }
    return days;
  };

  // Filtrar transacciones según el filtro seleccionado
  const getFilteredTransactions = () => {
    const now = new Date();

    switch (filter) {
      case "year":
        if (customDate && dateType === "year") {
          const yearStart = new Date(customDate, 0, 1);
          const yearEnd = new Date(customDate, 11, 31);
          return allTransactionsFromContext.filter((t) => {
            const transactionDate = new Date(t.date || t.created_at);
            return transactionDate >= yearStart && transactionDate <= yearEnd;
          });
        }
        return allTransactionsFromContext;

      case "month":
        if (customDate && dateType === "month") {
          const month = customDate.month;
          const year = customDate.year || new Date().getFullYear();
          const monthStart = new Date(year, month - 1, 1);
          const monthEnd = new Date(year, month, 0);
          return allTransactionsFromContext.filter((t) => {
            const transactionDate = new Date(t.date || t.created_at);
            return transactionDate >= monthStart && transactionDate <= monthEnd;
          });
        }
        return allTransactionsFromContext;

      case "week":
        if (customDate && dateType === "week") {
          return allTransactionsFromContext.filter((t) => {
            const transactionDate = new Date(t.date || t.created_at);
            return (
              transactionDate >= customDate.start &&
              transactionDate <= customDate.end
            );
          });
        }
        return allTransactionsFromContext;

      case "day":
        if (customDate && dateType === "day") {
          const dayStart = new Date(customDate);
          dayStart.setHours(0, 0, 0, 0);
          const dayEnd = new Date(customDate);
          dayEnd.setHours(23, 59, 59, 999);
          return allTransactionsFromContext.filter((t) => {
            const transactionDate = new Date(t.date || t.created_at);
            return transactionDate >= dayStart && transactionDate <= dayEnd;
          });
        }
        return allTransactionsFromContext;

      default:
        return allTransactionsFromContext;
    }
  };

  const filteredTransactions = getFilteredTransactions();

  const groupTransactionsByDate = () => {
    const grouped = {};
    filteredTransactions.forEach((transaction) => {
      const { date } = formatDate(transaction.date || transaction.created_at);
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(transaction);
    });

    return Object.keys(grouped).map((date) => ({
      title: date,
      data: grouped[date],
    }));
  };

  // MEJORADA: Función para obtener icono de transacción
  const getTransactionIcon = (type) => {
    const iconMap = {
      deposit: { name: "arrow-down-circle", color: "#32CD32" },
      withdrawal: { name: "arrow-up-circle", color: "#FF6B6B" },
      compra: { name: "add-circle", color: "#32CD32" },
      transferencia_entrante: { name: "download", color: "#32CD32" },
      transferencia_saliente: { name: "arrow-up-circle", color: "#FF6B6B" },
      gasto: { name: "game-controller", color: "#FF6B6B" },
      bono: { name: "gift", color: "#FFD700" },
    };
    return iconMap[type] || { name: "help-circle", color: "#FFD700" };
  };

  // CORREGIDA: Función para extraer información de transferencias
  const getTransferInfo = (transaction) => {
    const { type, user_dest } = transaction;
    
    // Si es una transferencia saliente
    if (type === "transferencia_saliente") {
      return {
        type: "send",
        userName: extractUserNameFromUserDest(user_dest),
        action: "Enviado a",
      };
    }

    // Si es una transferencia entrante
    if (type === "transferencia_entrante") {
      return {
        type: "receive",
        userName: extractUserNameFromUserDest(user_dest),
        action: "Recibido de",
      };
    }

    return null;
  };

  // CORREGIDA: Función para extraer nombre del usuario desde user_dest
  const extractUserNameFromUserDest = (user_dest) => {
    if (!user_dest) return "Usuario";
    
    // NUEVO FORMATO: "Nombre Completo (casino_id - email)"
    const match = user_dest.match(/(.+?)\s+\((.+?)\s+-\s+(.+?)\)/);
    
    if (match && match[1]) {
      // match[1] = Nombre completo
      const nombreCompleto = match[1].trim();
      if (nombreCompleto && nombreCompleto !== '') {
        return nombreCompleto;
      }
    }
    
    // Fallback: intentar con el formato antiguo por si hay transacciones antiguas
    const fallbackMatch = user_dest.match(/(.+?)\s+\((.+?)\)/);
    if (fallbackMatch && fallbackMatch[2]) {
      const email = fallbackMatch[2];
      if (email && email.includes('@')) {
        const username = email.split('@')[0];
        return formatUsername(username);
      }
    }
    
    return "Usuario";
  };

  // Función para formatear el nombre de usuario (para transacciones antiguas)
  const formatUsername = (username) => {
    if (!username) return "Usuario";
    
    // Remover números y caracteres especiales, mantener solo letras
    const cleanName = username.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
    
    if (cleanName.trim() === '') {
      return "Usuario";
    }
    
    // Capitalizar la primera letra
    return cleanName.charAt(0).toUpperCase() + cleanName.slice(1).toLowerCase();
  };

  // MEJORADA: Función para obtener el comentario - USA EL CAMPO MENSAJE
  const getTransferComment = (transaction) => {
    const { mensaje, type } = transaction;

    // Si hay mensaje personalizado, usarlo
    if (mensaje && mensaje.trim() !== "") {
      return mensaje;
    }

    // Si no hay mensaje, mostrar según el tipo de transferencia
    if (type === "transferencia_saliente") {
      return "Sin comentario";
    }

    if (type === "transferencia_entrante") {
      return "Sin comentario";
    }

    return "Sin comentario";
  };

  // CORREGIDA: Función para extraer información del user_dest
  const extractUserDestInfo = (user_dest) => {
    if (!user_dest) return { casino_id: "N/A", email: "N/A", nombre_completo: "N/A" };
    
    // NUEVO FORMATO: "Nombre Completo (casino_id - email)"
    const match = user_dest.match(/(.+?)\s+\((.+?)\s+-\s+(.+?)\)/);
    
    if (match) {
      return {
        nombre_completo: match[1],
        casino_id: match[2],
        email: match[3]
      };
    }
    
    // Fallback para formato antiguo
    const fallbackMatch = user_dest.match(/(.+?)\s+\((.+?)\)/);
    if (fallbackMatch) {
      return {
        nombre_completo: "N/A",
        casino_id: fallbackMatch[1],
        email: fallbackMatch[2]
      };
    }
    
    return {
      nombre_completo: "N/A",
      casino_id: user_dest,
      email: user_dest.includes("@") ? user_dest : "N/A"
    };
  };

  // CORREGIDA: Función para obtener título de transacción
  const getTransactionTitle = (transaction) => {
    const { description, type } = transaction;

    // Manejar transferencias
    const transferInfo = getTransferInfo(transaction);
    if (transferInfo) {
      return `${transferInfo.action} ${transferInfo.userName}`;
    }

    // Manejar otros tipos de transacciones
    const titles = {
      "Bono diario": "Bono Diario",
      "Compra de monedas": "Compra de Monedas",
      "Apuesta en juego": "Apuesta en Juego",
      "Ganancia en juego": "Ganancia en Juego",
      "Recarga rápida": "Recarga Rápida",
      "Recarga manual": "Recarga Manual",
      "Transferencia enviada": "Transferencia Enviada",
      "Transferencia recibida": "Transferencia Recibida",
    };

    return titles[description] || description;
  };

  // CORREGIDA: Función para obtener subtítulo descriptivo - USA EL MENSAJE DIRECTAMENTE
  const getTransactionSubtitle = (transaction) => {
    const { type, user_dest } = transaction;

    if (type.includes("transferencia")) {
      const userInfo = extractUserDestInfo(user_dest);
      const comentario = getTransferComment(transaction);

      // Mostrar comentario, ID y email del usuario
      let subtitle = `Comentario: ${comentario}`;
      
      if (userInfo.casino_id !== "N/A") {
        subtitle += ` | ID: ${userInfo.casino_id}`;
      }
      
      if (userInfo.email !== "N/A") {
        subtitle += ` | Email: ${userInfo.email}`;
      }

      return subtitle;
    }

    // Para otras transacciones, mostrar descripción completa
    return transaction.description || "Sin descripción";
  };

  // MEJORADA: Función para obtener información adicional (email)
  const getTransactionAdditionalInfo = (transaction) => {
    const { user_dest, type } = transaction;

    if (user_dest && type.includes("transferencia")) {
      const userInfo = extractUserDestInfo(user_dest);
      // Ya mostramos el email en el subtítulo, así que podemos omitir esta información adicional
      // o usarla para mostrar algo diferente si es necesario
      return null;
    }

    return null;
  };

  const getFilterButtonStyle = (filterType) => {
    return filter === filterType
      ? styles.filterButtonActive
      : styles.filterButton;
  };

  const getFilterButtonTextStyle = (filterType) => {
    return filter === filterType
      ? styles.filterButtonTextActive
      : styles.filterButtonText;
  };

  const handleFilterSelect = (filterType) => {
    setFilter(filterType);
    setCustomDate(null);
    setDateType("");
    if (filterType !== "all") {
      setDateType(filterType);
      setShowDatePicker(true);
    }
  };

  const handleDateSelect = (date) => {
    setCustomDate(date);
    setShowDatePicker(false);
  };

  const getFilterDisplayText = () => {
    if (!customDate) return "Seleccionar";

    switch (dateType) {
      case "year":
        return `Año ${customDate}`;
      case "month":
        return `${
          getMonthOptions().find((m) => m.value === customDate.month)?.label
        } ${customDate.year}`;
      case "week":
        return `Semana del ${customDate.start.toLocaleDateString("es-ES")}`;
      case "day":
        return customDate.toLocaleDateString("es-ES");
      default:
        return "Seleccionar";
    }
  };

  // MEJORADA: Renderizado de ítem de transacción
  const renderTransactionItem = ({ item }) => {
    const { time } = formatDate(item.date || item.created_at);
    const icon = getTransactionIcon(item.type);
    const title = getTransactionTitle(item);
    const subtitle = getTransactionSubtitle(item);
    const additionalInfo = getTransactionAdditionalInfo(item);

    return (
      <View style={styles.transactionItem}>
        <View style={styles.transactionLeft}>
          <View
            style={[
              styles.transactionIcon,
              { backgroundColor: `${icon.color}20` },
            ]}
          >
            <Ionicons name={icon.name} size={24} color={icon.color} />
          </View>
          <View style={styles.transactionInfo}>
            <Text style={styles.transactionTitle}>{title}</Text>
            <Text style={styles.transactionSubtitle}>{subtitle}</Text>
            {additionalInfo && (
              <Text style={styles.transactionAdditional}>{additionalInfo}</Text>
            )}
            <Text style={styles.transactionTime}>{time}</Text>
          </View>
        </View>
        <View style={styles.transactionRight}>
          <Text
            style={[
              styles.transactionAmount,
              {
                color: item.amount > 0 ? "#32CD32" : "#FF6B6B",
              },
            ]}
          >
            {item.amount > 0 ? "+" : ""}
            {item.amount.toLocaleString()} MC
          </Text>
          <Text style={styles.transactionBalance}>
            Saldo:{" "}
            {item.balance_after?.toLocaleString() ||
              item.balance?.toLocaleString() ||
              "0"}{" "}
            MC
          </Text>
        </View>
      </View>
    );
  };

  const renderSectionHeader = ({ section: { title } }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{title}</Text>
    </View>
  );

  const sections = groupTransactionsByDate();

  // MEJORADA: Calcular estadísticas filtradas
  const filteredDeposits = filteredTransactions.filter(
    (t) => t.amount > 0
  ).length;
  const filteredWithdrawals = filteredTransactions.filter(
    (t) => t.amount < 0
  ).length;
  const filteredTransfers = filteredTransactions.filter(
    (t) =>
      t.type.includes("transferencia") ||
      t.description.includes("Transferencia")
  ).length;

  // Modal para seleccionar fecha
  const DatePickerModal = () => (
    <Modal
      visible={showDatePicker}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowDatePicker(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              Seleccionar{" "}
              {dateType === "year"
                ? "Año"
                : dateType === "month"
                ? "Mes"
                : dateType === "week"
                ? "Semana"
                : "Día"}
            </Text>
            <TouchableOpacity onPress={() => setShowDatePicker(false)}>
              <Ionicons name="close" size={24} color="#FFD700" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.dateOptionsContainer}>
            {dateType === "year" &&
              getYearOptions().map((year) => (
                <TouchableOpacity
                  key={year}
                  style={styles.dateOption}
                  onPress={() => handleDateSelect(year)}
                >
                  <Text style={styles.dateOptionText}>Año {year}</Text>
                </TouchableOpacity>
              ))}

            {dateType === "month" &&
              getMonthOptions().map((month) => (
                <TouchableOpacity
                  key={month.value}
                  style={styles.dateOption}
                  onPress={() =>
                    handleDateSelect({
                      month: month.value,
                      year: new Date().getFullYear(),
                    })
                  }
                >
                  <Text style={styles.dateOptionText}>
                    {month.label} {new Date().getFullYear()}
                  </Text>
                </TouchableOpacity>
              ))}

            {dateType === "week" &&
              getWeekOptions().map((week) => (
                <TouchableOpacity
                  key={week.value}
                  style={styles.dateOption}
                  onPress={() => handleDateSelect(week)}
                >
                  <Text style={styles.dateOptionText}>
                    Semana del {week.start.toLocaleDateString("es-ES")} al{" "}
                    {week.end.toLocaleDateString("es-ES")}
                  </Text>
                </TouchableOpacity>
              ))}

            {dateType === "day" &&
              getDayOptions().map((day) => (
                <TouchableOpacity
                  key={day.value}
                  style={styles.dateOption}
                  onPress={() => handleDateSelect(day.date)}
                >
                  <Text style={styles.dateOptionText}>{day.label}</Text>
                </TouchableOpacity>
              ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />

      {/* Contenido Principal */}
      <View style={styles.content}>
        {/* Resumen de Saldo */}
        <View style={styles.balanceSummary}>
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>SALDO ACTUAL</Text>
            <Text style={styles.balanceAmount}>
              {manekiCoins.toLocaleString()} MC
            </Text>
            <View style={styles.balanceTrend}>
              <Ionicons
                name={
                  filteredTransactions.length > 0
                    ? "trending-up"
                    : "trending-down"
                }
                size={16}
                color={filteredTransactions.length > 0 ? "#32CD32" : "#FF6B6B"}
              />
              <Text
                style={[
                  styles.balanceTrendText,
                  {
                    color:
                      filteredTransactions.length > 0 ? "#32CD32" : "#FF6B6B",
                  },
                ]}
              >
                {filteredTransactions.length} transacciones{" "}
                {customDate && `filtradas`}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={handleManualRefresh}
              disabled={isRefreshing}
            >
              <Ionicons name="refresh" size={16} color="#FFD700" />
              <Text style={styles.refreshButtonText}>
                {isRefreshing ? "Actualizando..." : "Actualizar"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Estadísticas Rápidas */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Ionicons name="arrow-down-circle" size={20} color="#32CD32" />
            <Text style={styles.statNumber}>{filteredDeposits}</Text>
            <Text style={styles.statLabel}>Ingresos</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons name="arrow-up-circle" size={20} color="#FF6B6B" />
            <Text style={styles.statNumber}>{filteredWithdrawals}</Text>
            <Text style={styles.statLabel}>Egresos</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons name="swap-horizontal" size={20} color="#FFD700" />
            <Text style={styles.statNumber}>{filteredTransfers}</Text>
            <Text style={styles.statLabel}>Transferencias</Text>
          </View>
        </View>

        {/* Historial de Transacciones */}
        <View style={styles.historySection}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>HISTORIAL DE TRANSACCIONES</Text>
            <Text style={styles.transactionCount}>
              ({filteredTransactions.length})
            </Text>
          </View>

          {/* Filtros de Tiempo */}
          <View style={styles.filtersContainer}>
            <View style={styles.filtersRow}>
              <TouchableOpacity
                style={getFilterButtonStyle("all")}
                onPress={() => handleFilterSelect("all")}
              >
                <Text style={getFilterButtonTextStyle("all")}>Todo</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={getFilterButtonStyle("year")}
                onPress={() => handleFilterSelect("year")}
              >
                <Text style={getFilterButtonTextStyle("year")}>Año</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={getFilterButtonStyle("month")}
                onPress={() => handleFilterSelect("month")}
              >
                <Text style={getFilterButtonTextStyle("month")}>Mes</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={getFilterButtonStyle("week")}
                onPress={() => handleFilterSelect("week")}
              >
                <Text style={getFilterButtonTextStyle("week")}>Semana</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={getFilterButtonStyle("day")}
                onPress={() => handleFilterSelect("day")}
              >
                <Text style={getFilterButtonTextStyle("day")}>Día</Text>
              </TouchableOpacity>
            </View>

            {/* Selector de fecha específica */}
            {filter !== "all" && customDate && (
              <View style={styles.selectedDateContainer}>
                <Text style={styles.selectedDateText}>
                  Filtrado por: {getFilterDisplayText()}
                </Text>
                <TouchableOpacity
                  style={styles.changeDateButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={styles.changeDateButtonText}>Cambiar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.clearFilterButton}
                  onPress={() => {
                    setFilter("all");
                    setCustomDate(null);
                    setDateType("");
                  }}
                >
                  <Ionicons name="close" size={16} color="#FF6B6B" />
                </TouchableOpacity>
              </View>
            )}

            {filter !== "all" && !customDate && (
              <TouchableOpacity
                style={styles.selectDateButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons name="calendar" size={16} color="#FFD700" />
                <Text style={styles.selectDateButtonText}>
                  Seleccionar{" "}
                  {filter === "year"
                    ? "año"
                    : filter === "month"
                    ? "mes"
                    : filter === "week"
                    ? "semana"
                    : "día"}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* CONTENEDOR CON ALTURA FLEXIBLE PARA EL HISTORIAL */}
          <View style={styles.historyContainer}>
            {filteredTransactions.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="wallet" size={60} color="#666" />
                <Text style={styles.emptyStateTitle}>
                  {filter === "all"
                    ? "No hay transacciones"
                    : `No hay transacciones ${
                        customDate
                          ? "en el período seleccionado"
                          : "selecciona un período"
                      }`}
                </Text>
                <Text style={styles.emptyStateText}>
                  {filter === "all"
                    ? "Tus recargas, transferencias y apuestas aparecerán aquí"
                    : "Prueba con otro período de tiempo"}
                </Text>
                {filter !== "all" && !customDate && (
                  <TouchableOpacity
                    style={styles.emptyStateButton}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <Text style={styles.emptyStateButtonText}>
                      SELECCIONAR PERÍODO
                    </Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[
                    styles.emptyStateButton,
                    { backgroundColor: "#32CD32", marginTop: 10 },
                  ]}
                  onPress={() => navigation.navigate("TransferScreen")}
                >
                  <Text style={styles.emptyStateButtonText}>
                    HACER TRANSFERENCIA
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <SectionList
                sections={sections}
                keyExtractor={(item) => item.id}
                renderItem={renderTransactionItem}
                renderSectionHeader={renderSectionHeader}
                showsVerticalScrollIndicator={true}
                style={styles.transactionList}
                contentContainerStyle={styles.transactionListContent}
                refreshControl={
                  <RefreshControl
                    refreshing={isRefreshing}
                    onRefresh={refreshData}
                    colors={["#FFD700"]}
                    tintColor="#FFD700"
                  />
                }
              />
            )}
          </View>
        </View>
      </View>

      {/* Botón de Acción Rápida - CORREGIDO: Ahora navega a TransferScreen */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => navigation.navigate("Transferir")}
        >
          <Ionicons name="swap-horizontal" size={24} color="#000" />
          <Text style={styles.quickActionText}>TRANSFERIR FONDOS</Text>
        </TouchableOpacity>
      </View>

      {/* Modal para seleccionar fecha */}
      <DatePickerModal />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F0F0F",
  },
  content: {
    flex: 1,
  },
  balanceSummary: {
    padding: 20,
    paddingTop: 10,
  },
  balanceCard: {
    backgroundColor: "#1a1a1a",
    padding: 25,
    borderRadius: 20,
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#FFD700",
    elevation: 8,
  },
  balanceLabel: {
    color: "#FFF",
    fontSize: 16,
    marginBottom: 10,
    fontWeight: "600",
  },
  balanceAmount: {
    color: "#FFD700",
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 8,
  },
  balanceTrend: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },
  balanceTrendText: {
    fontSize: 14,
    fontWeight: "500",
  },
  refreshButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 215, 0, 0.1)",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
    borderWidth: 1,
    borderColor: "#FFD700",
  },
  refreshButtonText: {
    color: "#FFD700",
    fontSize: 12,
    fontWeight: "600",
  },
  statsContainer: {
    flexDirection: "row",
    backgroundColor: "#1a1a1a",
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 15,
    padding: 15,
    borderWidth: 1,
    borderColor: "#FFD700",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statNumber: {
    color: "#FFD700",
    fontSize: 16,
    fontWeight: "bold",
    marginVertical: 4,
  },
  statLabel: {
    color: "#FFF",
    fontSize: 11,
    fontWeight: "500",
    textAlign: "center",
  },
  statDivider: {
    width: 1,
    backgroundColor: "#FFD700",
    opacity: 0.3,
  },
  historySection: {
    flex: 1,
    marginBottom: 80,
  },
  // NUEVO: Contenedor flexible para el historial
  historyContainer: {
    flex: 1,
    minHeight: 300, // Altura mínima para asegurar espacio de scroll
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  sectionTitle: {
    color: "#FFD700",
    fontSize: 18,
    fontWeight: "bold",
  },
  transactionCount: {
    color: "#FFD700",
    fontSize: 14,
    fontWeight: "500",
  },
  filtersContainer: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  filtersRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 5,
    marginBottom: 10,
  },
  filterButton: {
    flex: 1,
    backgroundColor: "#2a2a2a",
    paddingVertical: 10,
    paddingHorizontal: 5,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#444",
  },
  filterButtonActive: {
    flex: 1,
    backgroundColor: "#FFD700",
    paddingVertical: 10,
    paddingHorizontal: 5,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FFD700",
  },
  filterButtonText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
  },
  filterButtonTextActive: {
    color: "#000",
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center",
  },
  selectedDateContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#2a2a2a",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FFD700",
  },
  selectedDateText: {
    color: "#FFD700",
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  changeDateButton: {
    backgroundColor: "#FFD700",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 8,
  },
  changeDateButtonText: {
    color: "#000",
    fontSize: 12,
    fontWeight: "bold",
  },
  clearFilterButton: {
    padding: 4,
  },
  selectDateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2a2a2a",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FFD700",
    gap: 8,
  },
  selectDateButtonText: {
    color: "#FFD700",
    fontSize: 14,
    fontWeight: "500",
  },
  emptyState: {
    alignItems: "center",
    padding: 40,
    marginHorizontal: 20,
  },
  emptyStateTitle: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
  },
  emptyStateText: {
    color: "#999",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
  },
  emptyStateButton: {
    backgroundColor: "#FFD700",
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 25,
  },
  emptyStateButtonText: {
    color: "#000",
    fontSize: 14,
    fontWeight: "bold",
  },
  transactionList: {
    flex: 1,
  },
  transactionListContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionHeader: {
    backgroundColor: "#1a1a1a",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: "#FFD700",
  },
  sectionHeaderText: {
    color: "#FFD700",
    fontSize: 14,
    fontWeight: "bold",
  },
  transactionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.2)",
  },
  transactionLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  transactionSubtitle: {
    color: "#A0A0A0",
    fontSize: 12,
    marginBottom: 2,
    lineHeight: 14,
  },
  transactionAdditional: {
    color: "#888",
    fontSize: 11,
    marginBottom: 2,
  },
  transactionTime: {
    color: "#999",
    fontSize: 11,
  },
  transactionRight: {
    alignItems: "flex-end",
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  transactionBalance: {
    color: "#999",
    fontSize: 11,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#0F0F0F",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#FFD700",
  },
  quickActionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFD700",
    padding: 18,
    borderRadius: 15,
    gap: 10,
    elevation: 4,
  },
  quickActionText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#1a1a1a",
    borderRadius: 15,
    padding: 20,
    width: "90%",
    maxHeight: "80%",
    borderWidth: 2,
    borderColor: "#FFD700",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  modalTitle: {
    color: "#FFD700",
    fontSize: 18,
    fontWeight: "bold",
  },
  dateOptionsContainer: {
    maxHeight: 400,
  },
  dateOption: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  dateOptionText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "500",
  },
});