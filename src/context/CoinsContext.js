// src/context/CoinsContext.js
import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useRef,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../config/supabase";

const CoinsContext = createContext();

export const useCoins = () => {
  const context = useContext(CoinsContext);
  if (!context) {
    throw new Error("useCoins debe ser usado dentro de un CoinsProvider");
  }
  return context;
};

export const CoinsProvider = ({ children }) => {
  const [manekiCoins, setManekiCoins] = useState(10000);
  const [tickets, setTickets] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastSync, setLastSync] = useState(null);

  // Referencias para evitar bucles
  const isInitialized = useRef(false);
  const subscriptionRef = useRef(null);
  const userIdRef = useRef(null);

  // Cargar datos iniciales y configurar tiempo real
  useEffect(() => {
    if (isInitialized.current) return;

    initializeCoinsSystem();

    return () => {
      // Limpiar suscripciones al desmontar
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, []);

  const initializeCoinsSystem = async () => {
    try {
      setIsLoading(true);
      console.log("🔄 Inicializando sistema de coins y tickets...");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        userIdRef.current = user.id;
        console.log("👤 Usuario autenticado:", user.id);

        // Cargar datos iniciales
        await loadInitialData(user.id);

        // Configurar suscripciones en tiempo real
        await setupRealtimeSubscriptions(user.id);

        isInitialized.current = true;
      } else {
        console.log("🚫 Usuario no autenticado, cargando datos locales");
        await loadFromAsyncStorage();
        isInitialized.current = true;
      }
    } catch (error) {
      console.error("❌ Error inicializando sistema:", error);
      await loadFromAsyncStorage();
    } finally {
      setIsLoading(false);
    }
  };

  const loadInitialData = async (userId) => {
    try {
      console.log("📥 Cargando datos iniciales para usuario:", userId);

      // Cargar coins, tickets y transacciones en paralelo
      const [coinsData, ticketsData, transactionsData] = await Promise.all([
        loadCoinsFromSupabase(userId),
        loadTicketsFromSupabase(userId),
        loadTransactionsFromSupabase(userId),
      ]);

      // Actualizar estado
      setManekiCoins(coinsData);
      setTickets(ticketsData);
      setTransactions(transactionsData);
      setLastSync(new Date().toISOString());

      console.log(
        "✅ Datos cargados - Coins:",
        coinsData,
        "Tickets:",
        ticketsData,
        "Transacciones:",
        transactionsData.length
      );
    } catch (error) {
      console.error("❌ Error cargando datos iniciales:", error);
      throw error;
    }
  };

  const loadCoinsFromSupabase = async (userId) => {
    try {
      const { data, error } = await supabase
        .from("user_coins")
        .select("maneki_coins")
        .eq("user_id", userId)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // No existe registro, crear uno
          console.log("📝 Creando registro inicial de coins");
          await initializeUserData(userId);
          return 10000;
        }
        throw error;
      }

      return data?.maneki_coins || 10000;
    } catch (error) {
      console.error("❌ Error cargando coins:", error);
      return 10000;
    }
  };

  const loadTicketsFromSupabase = async (userId) => {
    try {
      const { data, error } = await supabase
        .from("user_coins")
        .select("tickets")
        .eq("user_id", userId)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return 0;
        }
        throw error;
      }

      return data?.tickets || 0;
    } catch (error) {
      console.error("❌ Error cargando tickets:", error);
      return 0;
    }
  };

  const loadTransactionsFromSupabase = async (userId, limit = 50) => {
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;

      // CORREGIDO: Incluir el campo mensaje en las transacciones
      return data.map((transaction) => ({
        id: transaction.id,
        amount: transaction.amount,
        type: transaction.type,
        description: transaction.description,
        date: transaction.created_at,
        created_at: transaction.created_at, // Añadido para compatibilidad
        balance: transaction.balance_after || 0,
        balance_after: transaction.balance_after || 0, // Añadido para compatibilidad
        user_dest: transaction.user_dest,
        mensaje: transaction.mensaje || null, // CORREGIDO: Incluir campo mensaje
      }));
    } catch (error) {
      console.error("❌ Error cargando transacciones:", error);
      return [];
    }
  };

  const initializeUserData = async (userId) => {
    try {
      const { error } = await supabase.from("user_coins").insert({
        user_id: userId,
        maneki_coins: 10000,
        tickets: 0,
        last_updated: new Date().toISOString(),
      });

      if (error) throw error;
      console.log("✅ Registro de coins y tickets inicializado");
    } catch (error) {
      console.error("❌ Error inicializando datos:", error);
    }
  };

  // FUNCIÓN CRÍTICA: Actualizar coins y tickets en la base de datos
  const updateUserDataInDatabase = async (userId, newCoins, newTickets) => {
    try {
      console.log(
        `💾 Actualizando base de datos: ${newCoins} coins, ${newTickets} tickets`
      );

      const { error } = await supabase.from("user_coins").upsert(
        {
          user_id: userId,
          maneki_coins: newCoins,
          tickets: newTickets,
          last_updated: new Date().toISOString(),
        },
        {
          onConflict: "user_id",
        }
      );

      if (error) throw error;
      console.log("✅ Base de datos actualizada correctamente");
      return true;
    } catch (error) {
      console.error("❌ Error actualizando base de datos:", error);
      throw error;
    }
  };

  const setupRealtimeSubscriptions = async (userId) => {
    try {
      console.log("🔔 Configurando suscripciones en tiempo real...");

      // Suscripción a cambios en user_coins
      const coinsSubscription = supabase
        .channel("coins-changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "user_coins",
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            console.log("🔄 Cambio en coins detectado:", payload);
            if (payload.new) {
              if (payload.new.maneki_coins !== undefined) {
                setManekiCoins(payload.new.maneki_coins);
                console.log("💰 Coins actualizados:", payload.new.maneki_coins);
              }
              if (payload.new.tickets !== undefined) {
                setTickets(payload.new.tickets);
                console.log("🎫 Tickets actualizados:", payload.new.tickets);
              }
            }
          }
        )
        .subscribe((status) => {
          console.log("📡 Estado suscripción coins:", status);
        });

      // Suscripción a nuevas transacciones
      const transactionsSubscription = supabase
        .channel("transactions-changes")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "transactions",
            filter: `user_id=eq.${userId}`,
          },
          async (payload) => {
            console.log("🔄 Nueva transacción detectada:", payload);

            // Recargar transacciones más recientes
            const newTransactions = await loadTransactionsFromSupabase(userId);
            setTransactions(newTransactions);

            console.log(
              "📊 Transacciones actualizadas:",
              newTransactions.length
            );
          }
        )
        .subscribe((status) => {
          console.log("📡 Estado suscripción transacciones:", status);
        });

      subscriptionRef.current = {
        coins: coinsSubscription,
        transactions: transactionsSubscription,
      };

      console.log("✅ Suscripciones configuradas correctamente");
    } catch (error) {
      console.error("❌ Error configurando suscripciones:", error);
    }
  };

  const loadFromAsyncStorage = async () => {
    try {
      const [savedCoins, savedTickets, savedTransactions] = await Promise.all([
        AsyncStorage.getItem("manekiCoins"),
        AsyncStorage.getItem("manekiTickets"),
        AsyncStorage.getItem("coinTransactions"),
      ]);

      if (savedCoins) {
        setManekiCoins(parseInt(savedCoins));
      }
      if (savedTickets) {
        setTickets(parseInt(savedTickets));
      }
      if (savedTransactions) {
        setTransactions(JSON.parse(savedTransactions));
      }

      console.log("📱 Datos cargados desde almacenamiento local");
    } catch (error) {
      console.error("❌ Error cargando desde AsyncStorage:", error);
    }
  };

  // FUNCIONES PRINCIPALES CORREGIDAS

  const refreshCoins = async () => {
    try {
      console.log("🔄 Forzando actualización de coins y tickets...");
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const [currentCoins, currentTickets, currentTransactions] =
          await Promise.all([
            loadCoinsFromSupabase(user.id),
            loadTicketsFromSupabase(user.id),
            loadTransactionsFromSupabase(user.id),
          ]);

        setManekiCoins(currentCoins);
        setTickets(currentTickets);
        setTransactions(currentTransactions);
        setLastSync(new Date().toISOString());

        console.log("✅ Datos actualizados manualmente");
      }
    } catch (error) {
      console.error("❌ Error refrescando datos:", error);
    }
  };

  const addCoins = async (amount, description = "Compra de monedas") => {
    try {
      console.log(`💰 Agregando ${amount} coins: ${description}`);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Usuario no autenticado");
      }

      const newBalance = manekiCoins + amount;

      // 1. Actualizar estado local inmediatamente
      setManekiCoins(newBalance);

      // 2. Actualizar la base de datos (CRÍTICO)
      await updateUserDataInDatabase(user.id, newBalance, tickets);

      // 3. Registrar transacción en Supabase
      const { data: transaction, error } = await supabase
        .from("transactions")
        .insert({
          user_id: user.id,
          type: "compra",
          amount: amount,
          description: description,
          balance_after: newBalance,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      console.log("✅ Coins agregados correctamente");
      return newBalance;
    } catch (error) {
      console.error("❌ Error agregando coins:", error);
      // Revertir cambios locales en caso de error
      await refreshCoins();
      throw error;
    }
  };

  const subtractCoins = async (amount, description = "Apuesta en juego") => {
    try {
      console.log(`💰 Restando ${amount} coins: ${description}`);

      if (manekiCoins < amount) {
        throw new Error("Fondos insuficientes");
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Usuario no autenticado");
      }

      const newBalance = manekiCoins - amount;

      // 1. Actualizar estado local inmediatamente
      setManekiCoins(newBalance);

      // 2. Actualizar la base de datos (CRÍTICO)
      await updateUserDataInDatabase(user.id, newBalance, tickets);

      // 3. Registrar transacción en Supabase
      const { data: transaction, error } = await supabase
        .from("transactions")
        .insert({
          user_id: user.id,
          type: "gasto",
          amount: -amount,
          description: description,
          balance_after: newBalance,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      console.log("✅ Coins restados correctamente");
      return newBalance;
    } catch (error) {
      console.error("❌ Error restando coins:", error);
      await refreshCoins();
      throw error;
    }
  };

  // NUEVA FUNCIÓN: Agregar tickets
  const addTickets = async (amount, description = "Ganancia en juego") => {
    try {
      console.log(`🎫 Agregando ${amount} tickets: ${description}`);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Usuario no autenticado");
      }

      const newTickets = tickets + amount;

      // 1. Actualizar estado local inmediatamente
      setTickets(newTickets);

      // 2. Actualizar la base de datos (CRÍTICO)
      await updateUserDataInDatabase(user.id, manekiCoins, newTickets);

      // 3. Registrar transacción de tickets en Supabase
      const { data: transaction, error } = await supabase
        .from("transactions")
        .insert({
          user_id: user.id,
          type: "tickets",
          amount: amount,
          description: description,
          balance_after: newTickets,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      console.log("✅ Tickets agregados correctamente");
      return newTickets;
    } catch (error) {
      console.error("❌ Error agregando tickets:", error);
      await refreshCoins();
      throw error;
    }
  };

  // NUEVA FUNCIÓN: Canjear tickets por coins
  const redeemTickets = async (
    ticketAmount,
    coinAmount,
    description = "Canje de tickets"
  ) => {
    try {
      console.log(
        `🔄 Canjeando ${ticketAmount} tickets por ${coinAmount} coins`
      );

      if (tickets < ticketAmount) {
        throw new Error("Tickets insuficientes");
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Usuario no autenticado");
      }

      const newTickets = tickets - ticketAmount;
      const newCoins = manekiCoins + coinAmount;

      // 1. Actualizar estado local inmediatamente
      setTickets(newTickets);
      setManekiCoins(newCoins);

      // 2. Actualizar la base de datos
      await updateUserDataInDatabase(user.id, newCoins, newTickets);

      // 3. Registrar transacción de canje
      const { data: transaction, error } = await supabase
        .from("transactions")
        .insert({
          user_id: user.id,
          type: "canje",
          amount: coinAmount,
          description: `${description} (${ticketAmount} tickets)`,
          balance_after: newCoins,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      console.log("✅ Canje realizado correctamente");
      return { newTickets, newCoins };
    } catch (error) {
      console.error("❌ Error canjeando tickets:", error);
      await refreshCoins();
      throw error;
    }
  };

  // CORREGIDA: Función de transferencia con soporte para mensaje
  const transferCoins = async (
    amount,
    recipientIdentifier,
    description = "Transferencia",
    mensaje = null // NUEVO: parámetro para el mensaje personalizado
  ) => {
    try {
      console.log(`🔄 Transferiendo ${amount} coins a: ${recipientIdentifier}`);
      console.log(`💬 Mensaje: ${mensaje || "Sin mensaje"}`);

      // Validaciones
      if (!recipientIdentifier?.trim()) {
        throw new Error("Ingresa el email o ID de casino del destinatario");
      }

      if (!amount || amount <= 0) {
        throw new Error("Ingresa un monto válido");
      }

      if (amount < 10) {
        throw new Error("El monto mínimo de transferencia es 10 monedas");
      }

      if (amount > manekiCoins) {
        throw new Error("Fondos insuficientes");
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Usuario no autenticado");
      }

      // Usar la función de PostgreSQL (actualizada con mensaje)
      const { data: result, error: transferError } = await supabase.rpc(
        "transferir_monedas",
        {
          remitente_id: user.id,
          destinatario_identificador: recipientIdentifier.trim(),
          monto: amount,
          descripcion: description,
          mensaje_transferencia: mensaje, // NUEVO: pasar el mensaje a la función
        }
      );

      if (transferError) {
        console.error("❌ Error en RPC transferir_monedas:", transferError);
        throw new Error("Error de conexión con el servidor");
      }

      if (!result.exito) {
        throw new Error(result.error);
      }

      console.log("✅ Transferencia exitosa:", result);

      // Actualizar estado local con el nuevo saldo
      setManekiCoins(result.nuevo_saldo);

      // Recargar transacciones para incluir la nueva transferencia con mensaje
      await refreshCoins();

      return {
        success: true,
        newBalance: result.nuevo_saldo,
        recipientName: result.nombre_destinatario,
        recipientId: result.identificador_destinatario,
        amount: result.monto_transferido,
        mensaje: result.mensaje || mensaje,
      };
    } catch (error) {
      console.error("❌ Error en transferencia:", error);
      await refreshCoins(); // Sincronizar estado actual
      throw error;
    }
  };

  const getTransactionHistory = (limit = 50) => {
    return transactions.slice(0, limit);
  };

  const canAfford = (amount) => manekiCoins >= amount;

  const getDailyBonus = async () => {
    return await addCoins(1000, "Bono diario");
  };

  const resetCoins = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await initializeUserData(user.id);
      await refreshCoins();
    }
  };

  const value = {
    manekiCoins,
    tickets,
    transactions,
    isLoading,
    lastSync,
    addCoins,
    subtractCoins,
    addTickets,
    redeemTickets,
    transferCoins,
    resetCoins,
    refreshCoins,
    getTransactionHistory,
    canAfford,
    getDailyBonus,
  };

  return (
    <CoinsContext.Provider value={value}>{children}</CoinsContext.Provider>
  );
};
