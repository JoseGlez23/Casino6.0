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
  const [manekiCoins, setManekiCoins] = useState(1000);
  const [tickets, setTickets] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastSync, setLastSync] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const isInitialized = useRef(false);
  const subscriptionRef = useRef(null);
  const userIdRef = useRef(null);
  const mountedRef = useRef(true);

  // ===== FUNCIÓN MEJORADA PARA VERIFICAR AUTENTICACIÓN =====
  const checkAuthStatus = async () => {
    try {
      console.log("🔐 Verificando estado de autenticación...");
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (!sessionError && session?.user) {
        console.log("✅ Sesión activa encontrada:", session.user.id);
        setIsAuthenticated(true);
        userIdRef.current = session.user.id;
        return { user: session.user, error: null };
      }
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (!userError && user) {
        console.log("✅ Usuario autenticado encontrado:", user.id);
        setIsAuthenticated(true);
        userIdRef.current = user.id;
        return { user, error: null };
      }
      
      console.log("⚠️ Usuario no autenticado o sesión expirada");
      setIsAuthenticated(false);
      userIdRef.current = null;
      
      return { user: null, error: sessionError || userError };
      
    } catch (error) {
      console.error("❌ Error verificando autenticación:", error);
      setIsAuthenticated(false);
      userIdRef.current = null;
      return { user: null, error };
    }
  };

  // ===== EFECTOS PRINCIPALES MEJORADOS =====
  useEffect(() => {
    mountedRef.current = true;
    
    const initializeApp = async () => {
      if (isInitialized.current || !mountedRef.current) return;
      
      try {
        console.log("🚀 Inicializando aplicación...");
        setIsLoading(true);
        
        const { user, error: authError } = await checkAuthStatus();
        
        if (authError) {
          console.log("⚠️ Error de autenticación, usando modo offline:", authError.message);
          await loadFromAsyncStorage();
          if (mountedRef.current) {
            isInitialized.current = true;
            setIsLoading(false);
          }
          return;
        }
        
        if (user) {
          console.log("🎯 Usuario autenticado, cargando datos...");
          await loadInitialData(user.id);
          await setupRealtimeSubscriptions(user.id);
          if (mountedRef.current) {
            isInitialized.current = true;
          }
        } else {
          console.log("🔒 Usuario no autenticado, modo offline");
          await loadFromAsyncStorage();
          if (mountedRef.current) {
            isInitialized.current = true;
          }
        }
        
      } catch (error) {
        console.error("❌ Error crítico en inicialización:", error);
        await loadFromAsyncStorage();
        if (mountedRef.current) {
          isInitialized.current = true;
        }
      } finally {
        if (mountedRef.current) {
          setIsLoading(false);
        }
      }
    };

    initializeApp();

    return () => {
      mountedRef.current = false;
      if (subscriptionRef.current?.coins)
        subscriptionRef.current.coins.unsubscribe();
      if (subscriptionRef.current?.transactions)
        subscriptionRef.current.transactions.unsubscribe();
    };
  }, []);

  // ===== LISTENER MEJORADO DE AUTENTICACIÓN =====
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("🔄 Cambio de estado de autenticación:", event);
        
        if (!mountedRef.current) return;
        
        try {
          switch (event) {
            case 'SIGNED_IN':
              if (session?.user) {
                console.log("✅ Usuario inició sesión:", session.user.id);
                setIsAuthenticated(true);
                userIdRef.current = session.user.id;
                await loadInitialData(session.user.id);
                await setupRealtimeSubscriptions(session.user.id);
                isInitialized.current = true;
              }
              break;
              
            case 'SIGNED_OUT':
              console.log("🚪 Usuario cerró sesión");
              setIsAuthenticated(false);
              userIdRef.current = null;
              isInitialized.current = false;
              setManekiCoins(1000);
              setTickets(0);
              setTransactions([]);
              await clearAsyncStorage();
              break;
              
            case 'USER_UPDATED':
              if (session?.user) {
                console.log("📝 Usuario actualizado, recargando datos...");
                await refreshCoins();
              }
              break;
              
            case 'TOKEN_REFRESHED':
              if (session?.user) {
                console.log("🔄 Token refrescado");
              }
              break;
              
            default:
              console.log("🔍 Evento de auth no manejado:", event);
          }
        } catch (error) {
          console.error("❌ Error en listener de auth:", error);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // ===== FUNCIÓN PARA LIMPIAR ASYNC STORAGE =====
  const clearAsyncStorage = async () => {
    try {
      await AsyncStorage.multiRemove([
        "manekiCoins",
        "manekiTickets", 
        "coinTransactions",
        "lastSync"
      ]);
      console.log("🧹 AsyncStorage limpiado");
    } catch (error) {
      console.error("❌ Error limpiando AsyncStorage:", error);
    }
  };

  // ===== SISTEMA UNIFICADO DE CARGA DE DATOS =====
  const loadInitialData = async (userId) => {
    try {
      console.log("📥 Cargando datos iniciales para usuario:", userId);
      
      const [currentCoins, currentTickets, currentTransactions] = await Promise.allSettled([
        loadCoinsFromSupabase(userId),
        loadTicketsFromSupabase(userId),
        loadTransactionsFromSupabase(userId),
      ]);

      // Manejar resultados exitosos o fallidos
      const coinsData = currentCoins.status === 'fulfilled' ? currentCoins.value : 1000;
      const ticketsData = currentTickets.status === 'fulfilled' ? currentTickets.value : 0;
      const transactionsData = currentTransactions.status === 'fulfilled' ? currentTransactions.value : [];

      // Actualizar estado
      if (mountedRef.current) {
        setManekiCoins(coinsData);
        setTickets(ticketsData);
        setTransactions(transactionsData);
        setLastSync(new Date().toISOString());
      }
      
      // Guardar en AsyncStorage como respaldo
      await saveToAsyncStorage(coinsData, ticketsData, transactionsData);
      
      console.log(`✅ Datos cargados: Coins=${coinsData}, Tickets=${ticketsData}`);
      
    } catch (error) {
      console.error("❌ Error cargando datos iniciales:", error);
      await loadFromAsyncStorage();
      throw error;
    }
  };

  // ✅ ACTUALIZADO: Cargar coins y tickets desde user_coins
  const loadCoinsFromSupabase = async (userId) => {
    try {
      const { data, error } = await supabase
        .from("user_coins")
        .select("maneki_coins, tickets")
        .eq("user_id", userId)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          await initializeUserData(userId);
          return 1000;
        }
        throw error;
      }
      return data?.maneki_coins ?? 1000;
    } catch (error) {
      console.error("❌ Error cargando coins:", error);
      return 1000;
    }
  };

  // ✅ ACTUALIZADO: Cargar tickets desde user_coins (sistema unificado)
  const loadTicketsFromSupabase = async (userId) => {
    try {
      const { data, error } = await supabase
        .from("user_coins")
        .select("tickets")
        .eq("user_id", userId)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          await initializeUserData(userId);
          return 0;
        }
        throw error;
      }
      return data?.tickets ?? 0;
    } catch (error) {
      console.error("❌ Error cargando tickets:", error);
      return 0;
    }
  };

  // ✅ ACTUALIZADO: Cargar transacciones de ambas tablas
  const loadTransactionsFromSupabase = async (userId, limit = 50) => {
    try {
      // Cargar transacciones de coins
      const { data: coinsTransactions, error: coinsError } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (coinsError) throw coinsError;

      // Cargar transacciones de tickets
      const { data: ticketsTransactions, error: ticketsError } = await supabase
        .from("tickets_transactions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (ticketsError) throw ticketsError;

      // Combinar y ordenar todas las transacciones
      const allTransactions = [
        ...(coinsTransactions ?? []).map(t => ({
          ...t,
          source: 'coins',
          id: `coins_${t.id}`
        })),
        ...(ticketsTransactions ?? []).map(t => ({
          ...t,
          source: 'tickets',
          id: `tickets_${t.id}`
        }))
      ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
       .slice(0, limit);

      return allTransactions;
    } catch (error) {
      console.error("❌ Error cargando transacciones:", error);
      return [];
    }
  };

  // ===== SISTEMA DE RESPALDO LOCAL MEJORADO =====
  const saveToAsyncStorage = async (coins, tickets, transactions) => {
    try {
      await Promise.all([
        AsyncStorage.setItem("manekiCoins", coins.toString()),
        AsyncStorage.setItem("manekiTickets", tickets.toString()),
        AsyncStorage.setItem("coinTransactions", JSON.stringify(transactions)),
        AsyncStorage.setItem("lastSync", new Date().toISOString()),
      ]);
      console.log("💾 Datos guardados en respaldo local");
    } catch (error) {
      console.error("❌ Error guardando en respaldo local:", error);
    }
  };

  const loadFromAsyncStorage = async () => {
    try {
      console.log("📤 Cargando desde respaldo local...");
      
      const [savedCoins, savedTickets, savedTransactions, lastSaved] = await Promise.all([
        AsyncStorage.getItem("manekiCoins"),
        AsyncStorage.getItem("manekiTickets"),
        AsyncStorage.getItem("coinTransactions"),
        AsyncStorage.getItem("lastSync"),
      ]);

      if (mountedRef.current) {
        if (savedCoins) {
          const coins = parseInt(savedCoins);
          setManekiCoins(coins);
          console.log("✅ Coins cargados desde respaldo:", coins);
        } else {
          setManekiCoins(1000);
        }
        
        if (savedTickets) {
          const ticketsValue = parseInt(savedTickets);
          setTickets(ticketsValue);
          console.log("✅ Tickets cargados desde respaldo:", ticketsValue);
        } else {
          setTickets(0);
        }
        
        if (savedTransactions) {
          setTransactions(JSON.parse(savedTransactions));
        }
        
        if (lastSaved) {
          setLastSync(lastSaved);
        }
      }
    } catch (error) {
      console.error("❌ Error cargando AsyncStorage:", error);
      if (mountedRef.current) {
        setManekiCoins(1000);
        setTickets(0);
        setTransactions([]);
      }
    }
  };

  // ===== INICIALIZACIÓN DE USUARIO (ACTUALIZADA) =====
  const initializeUserData = async (userId) => {
    try {
      // ✅ ACTUALIZADO: Solo una tabla para user_coins
      const { error: upsertErr } = await supabase.from("user_coins").upsert(
        {
          user_id: userId,
          maneki_coins: 1000,
          tickets: 0,
          last_updated: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );
      if (upsertErr) throw upsertErr;

      // Registrar transacción inicial (bonus)
      const { error: txErr } = await supabase.from("transactions").insert({
        user_id: userId,
        type: "bonus_inicial",
        amount: 1000,
        description: "Bono inicial por registro",
        balance_after: 1000,
        created_at: new Date().toISOString(),
      });
      if (txErr) throw txErr;

      console.log("✅ Registro inicial creado + bonus_inicial cargado");
    } catch (error) {
      console.error("❌ Error inicializando datos:", error);
    }
  };

  // ===== SISTEMA DE SUSCRIPCIONES EN TIEMPO REAL (ACTUALIZADO) =====
  const setupRealtimeSubscriptions = async (userId) => {
    try {
      // Cancelar suscripciones existentes
      if (subscriptionRef.current?.coins) subscriptionRef.current.coins.unsubscribe();
      if (subscriptionRef.current?.transactions) subscriptionRef.current.transactions.unsubscribe();

      // ✅ ACTUALIZADO: Una sola suscripción para user_coins (coins y tickets)
      const coinsSubscription = supabase
        .channel("user-coins-changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "user_coins",
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            if (payload.new && mountedRef.current) {
              if (payload.new.maneki_coins !== undefined) {
                setManekiCoins(payload.new.maneki_coins);
              }
              if (payload.new.tickets !== undefined) {
                setTickets(payload.new.tickets);
              }
              saveToAsyncStorage(
                payload.new.maneki_coins ?? manekiCoins,
                payload.new.tickets ?? tickets,
                transactions
              );
            }
          }
        )
        .subscribe();

      // Suscripción para transacciones combinadas
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
          async () => {
            if (mountedRef.current) {
              const newTx = await loadTransactionsFromSupabase(userId);
              setTransactions(newTx);
            }
          }
        )
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "tickets_transactions",
            filter: `user_id=eq.${userId}`,
          },
          async () => {
            if (mountedRef.current) {
              const newTx = await loadTransactionsFromSupabase(userId);
              setTransactions(newTx);
            }
          }
        )
        .subscribe();

      subscriptionRef.current = {
        coins: coinsSubscription,
        transactions: transactionsSubscription,
      };
      
      console.log("✅ Suscripciones realtime configuradas");
    } catch (error) {
      console.error("❌ Error suscripciones realtime:", error);
    }
  };

  // ===== API PRINCIPAL MEJORADA =====
  const refreshCoins = async () => {
    try {
      const { user } = await checkAuthStatus();

      if (user) {
        const [currentCoins, currentTickets, currentTransactions] =
          await Promise.all([
            loadCoinsFromSupabase(user.id),
            loadTicketsFromSupabase(user.id),
            loadTransactionsFromSupabase(user.id),
          ]);

        console.log(`🔄 Refresh: Coins=${currentCoins}, Tickets=${currentTickets}`);

        if (mountedRef.current) {
          setManekiCoins(currentCoins);
          setTickets(currentTickets);
          setTransactions(currentTransactions);
          setLastSync(new Date().toISOString());
        }
        
        await saveToAsyncStorage(currentCoins, currentTickets, currentTransactions);
      }
    } catch (error) {
      console.error("❌ Error refrescando datos:", error);
      throw error;
    }
  };

  // ===== FUNCIONES DE TICKETS MEJORADAS =====
  const addTickets = async (amount, description = "Ganancia en juego") => {
    try {
      const { user } = await checkAuthStatus();
      if (!user) throw new Error("Usuario no autenticado");

      console.log(`🎯 Agregando ${amount} tickets para usuario: ${user.id}`);

      // ✅ ACTUALIZADO: Usar la función RPC unificada
      const { data: result, error } = await supabase.rpc('agregar_tickets', {
        p_user_id: user.id,
        p_cantidad: amount,
        p_descripcion: description
      });

      if (error) {
        console.error("❌ Error RPC agregar_tickets:", error);
        throw error;
      }

      if (mountedRef.current) {
        setTickets(result.nuevo_balance);
      }

      await saveToAsyncStorage(manekiCoins, result.nuevo_balance, transactions);

      console.log(`✅ Tickets agregados: ${amount}. Nuevo total: ${result.nuevo_balance}`);
      return result.nuevo_balance;
    } catch (error) {
      console.error("❌ Error agregando tickets:", error);
      await refreshCoins();
      throw error;
    }
  };

  // ✅ ACTUALIZADO: Retirar tickets con función RPC unificada
  const solicitarRetiroTickets = async (ticketAmount) => {
    try {
      if (!ticketAmount || ticketAmount <= 0)
        throw new Error("Ingresa una cantidad válida de tickets");

      const { user } = await checkAuthStatus();
      if (!user) throw new Error("Usuario no autenticado");

      console.log(`🎫 Solicitando retiro de ${ticketAmount} tickets para usuario: ${user.id}`);

      // ✅ ACTUALIZADO: Usar función RPC unificada
      const { data: result, error } = await supabase.rpc(
        "retirar_tickets",
        {
          usuario_id: user.id,
          tickets_retirar: ticketAmount
        }
      );

      if (error) {
        console.error("❌ Error RPC retirar_tickets:", error);
        throw error;
      }

      if (!result?.exito) {
        throw new Error(result?.error || "No se pudo procesar el retiro");
      }

      // Actualizar estado local
      if (mountedRef.current) {
        setTickets(result.tickets_restantes);
      }

      await saveToAsyncStorage(manekiCoins, result.tickets_restantes, transactions);

      console.log(`✅ Retiro exitoso. Tickets restantes: ${result.tickets_restantes}`);
      return result;
    } catch (error) {
      console.error("❌ Error solicitando retiro de tickets:", error);
      await refreshCoins();
      throw error;
    }
  };

  // ===== FUNCIONES EXISTENTES (MANTENIDAS) =====
  const updateUserDataInDatabase = async (userId, newCoins, newTickets) => {
    try {
      const { error } = await supabase.from("user_coins").upsert(
        {
          user_id: userId,
          maneki_coins: newCoins,
          tickets: newTickets,
          last_updated: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );
      if (error) throw error;
      
      await saveToAsyncStorage(newCoins, newTickets, transactions);
      
      return true;
    } catch (error) {
      console.error("❌ Error actualizando base:", error);
      throw error;
    }
  };

  const addCoins = async (amount, description = "Compra de monedas") => {
    try {
      const { user } = await checkAuthStatus();
      if (!user) throw new Error("Usuario no autenticado");

      const newBalance = manekiCoins + amount;
      if (mountedRef.current) {
        setManekiCoins(newBalance);
      }
      
      await updateUserDataInDatabase(user.id, newBalance, tickets);

      const lower = (description || "").toLowerCase();
      const txType = lower.includes("compra")
        ? "compra_coins"
        : "ganancia_coins";

      const { error: txErr } = await supabase.from("transactions").insert({
        user_id: user.id,
        type: txType,
        amount: amount,
        description,
        balance_after: newBalance,
        created_at: new Date().toISOString(),
      });
      if (txErr) throw txErr;

      return newBalance;
    } catch (error) {
      console.error("❌ Error agregando coins:", error);
      await refreshCoins();
      throw error;
    }
  };

  const subtractCoins = async (amount, description = "Apuesta en juego") => {
    try {
      if (manekiCoins < amount) throw new Error("Fondos insuficientes");

      const { user } = await checkAuthStatus();
      if (!user) throw new Error("Usuario no autenticado");

      const newBalance = manekiCoins - amount;
      if (mountedRef.current) {
        setManekiCoins(newBalance);
      }
      
      await updateUserDataInDatabase(user.id, newBalance, tickets);

      const { error: txErr } = await supabase.from("transactions").insert({
        user_id: user.id,
        type: "gasto_juego",
        amount: -amount,
        description,
        balance_after: newBalance,
        created_at: new Date().toISOString(),
      });
      if (txErr) throw txErr;

      return newBalance;
    } catch (error) {
      console.error("❌ Error restando coins:", error);
      await refreshCoins();
      throw error;
    }
  };

  const transferCoins = async (
    amount,
    recipientIdentifier,
    description = "Transferencia",
    mensaje = null
  ) => {
    try {
      if (!recipientIdentifier?.trim())
        throw new Error("Ingresa el email o ID de casino del destinatario");
      if (!amount || amount <= 0) throw new Error("Ingresa un monto válido");
      if (amount < 10)
        throw new Error("El monto mínimo de transferencia es 10 monedas");
      if (amount > manekiCoins) throw new Error("Fondos insuficientes");

      const { user } = await checkAuthStatus();
      if (!user) throw new Error("Usuario no autenticado");

      const { data: result, error: transferError } = await supabase.rpc(
        "transferir_monedas",
        {
          remitente_id: user.id,
          destinatario_identificador: recipientIdentifier.trim(),
          monto: amount,
          descripcion: description,
          mensaje_transferencia: mensaje,
        }
      );
      if (transferError) throw transferError;
      if (!result?.exito)
        throw new Error(result?.error || "Transferencia rechazada");

      if (mountedRef.current) {
        setManekiCoins(result.nuevo_saldo);
      }
      
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
      await refreshCoins();
      throw error;
    }
  };

  // ===== FUNCIONES AUXILIARES =====
  const getTransactionHistory = (limit = 50) => transactions.slice(0, limit);
  const canAfford = (amount) => manekiCoins >= amount;

  const getDailyBonus = async () => {
    return await addCoins(1000, "Bono diario");
  };

  const resetCoins = async () => {
    const { user } = await checkAuthStatus();
    if (user) {
      await initializeUserData(user.id);
      await refreshCoins();
    }
  };

  const debugState = async () => {
    const { user } = await checkAuthStatus();

    if (user) {
      const dbCoins = await loadCoinsFromSupabase(user.id);
      const dbTickets = await loadTicketsFromSupabase(user.id);
      console.log(
        `🔍 DEBUG - Estado local: Coins=${manekiCoins}, Tickets=${tickets}`
      );
      console.log(
        `🔍 DEBUG - Estado BD: Coins=${dbCoins}, Tickets=${dbTickets}, User: ${user.id}`
      );
      console.log(
        `🔍 DEBUG - Autenticado: ${isAuthenticated}, Inicializado: ${isInitialized.current}`
      );
    }
  };

  const forceRefresh = async () => {
    console.log("🔄 Forzando recarga de datos...");
    isInitialized.current = false;
    await refreshCoins();
  };

  const value = {
    manekiCoins,
    tickets,
    transactions,
    isLoading,
    lastSync,
    isAuthenticated,
    addCoins,
    subtractCoins,
    addTickets,
    solicitarRetiroTickets,
    transferCoins,
    resetCoins,
    refreshCoins,
    getTransactionHistory,
    canAfford,
    getDailyBonus,
    debugState,
    forceRefresh,
  };

  return (
    <CoinsContext.Provider value={value}>{children}</CoinsContext.Provider>
  );
};