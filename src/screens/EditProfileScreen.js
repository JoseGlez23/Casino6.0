// screens/EditProfileScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../config/supabase';

export default function EditProfileScreen({ navigation, route }) {
  const [userData, setUserData] = useState({
    nombre_completo: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Estado para el modal personalizado
  const [modalVisible, setModalVisible] = useState(false);
  const [modalData, setModalData] = useState({ 
    title: '', 
    message: '', 
    type: 'info',
    onConfirm: null 
  });

  // Cargar datos del usuario
  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      
      // Obtener usuario autenticado
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        showCustomAlert('Error', 'No se pudo obtener la información del usuario', 'error');
        return;
      }

      // Obtener perfil del usuario desde la tabla usuarios
      const { data: profile, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error cargando perfil:', error);
        showCustomAlert('Error', 'No se pudo cargar el perfil del usuario', 'error');
        return;
      }

      setUserProfile(profile);
      setUserData({
        nombre_completo: profile.nombre_completo || '',
        email: profile.email || user.email || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
    } catch (error) {
      console.error('Error:', error);
      showCustomAlert('Error', 'Error al cargar el perfil', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Función para mostrar modales personalizados
  const showCustomAlert = (title, message, type = 'info', onConfirm = null) => {
    setModalData({ title, message, type, onConfirm });
    setModalVisible(true);
  };

  const verifyCurrentPassword = async (email, password) => {
    try {
      // Intentar hacer login con la contraseña actual
      const { error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
      });

      if (error) {
        return false; // Contraseña incorrecta
      }
      return true; // Contraseña correcta
    } catch (error) {
      console.error('Error verificando contraseña:', error);
      return false;
    }
  };

  const handleSaveChanges = async () => {
    // Validaciones básicas
    if (!userData.nombre_completo.trim()) {
      showCustomAlert('Error', 'El nombre no puede estar vacío', 'error');
      return;
    }

    if (!userData.email.trim()) {
      showCustomAlert('Error', 'El email no puede estar vacío', 'error');
      return;
    }

    // Validación de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email)) {
      showCustomAlert('Error', 'Por favor ingresa un email válido', 'error');
      return;
    }

    // Validación de contraseña si se intenta cambiar
    const wantsToChangePassword = userData.newPassword || userData.confirmPassword || userData.currentPassword;
    
    if (wantsToChangePassword) {
      if (!userData.currentPassword) {
        showCustomAlert('Error', 'Debes ingresar tu contraseña actual para cambiar la contraseña', 'error');
        return;
      }

      if (userData.newPassword.length < 6) {
        showCustomAlert('Error', 'La nueva contraseña debe tener al menos 6 caracteres', 'error');
        return;
      }

      if (userData.newPassword !== userData.confirmPassword) {
        showCustomAlert('Error', 'Las contraseñas nuevas no coinciden', 'error');
        return;
      }

      // Verificar que la contraseña actual sea correcta
      try {
        setSaving(true);
        const isCurrentPasswordValid = await verifyCurrentPassword(
          userProfile.email, 
          userData.currentPassword
        );

        if (!isCurrentPasswordValid) {
          showCustomAlert('Error', 'La contraseña actual es incorrecta', 'error');
          setSaving(false);
          return;
        }
      } catch (error) {
        console.error('Error verificando contraseña actual:', error);
        showCustomAlert('Error', 'Error al verificar la contraseña actual', 'error');
        setSaving(false);
        return;
      }
    }

    try {
      setSaving(true);

      // Obtener usuario actual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        showCustomAlert('Error', 'Usuario no autenticado', 'error');
        return;
      }

      // 1. Actualizar email en Auth (si cambió)
      if (userData.email !== userProfile.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: userData.email
        });

        if (emailError) {
          console.error('Error actualizando email:', emailError);
          showCustomAlert('Error', 'No se pudo actualizar el email: ' + emailError.message, 'error');
          return;
        }
      }

      // 2. Actualizar contraseña (si se proporcionó y se validó correctamente)
      if (wantsToChangePassword && userData.newPassword) {
        const { error: passwordError } = await supabase.auth.updateUser({
          password: userData.newPassword
        });

        if (passwordError) {
          console.error('Error actualizando contraseña:', passwordError);
          showCustomAlert('Error', 'No se pudo actualizar la contraseña: ' + passwordError.message, 'error');
          return;
        }
      }

      // 3. Actualizar perfil en la tabla usuarios
      const { error: profileError } = await supabase
        .from('usuarios')
        .update({
          nombre_completo: userData.nombre_completo,
          email: userData.email,
          fecha_creacion: userProfile.fecha_creacion // Mantener la fecha original
        })
        .eq('id', user.id);

      if (profileError) {
        console.error('Error actualizando perfil:', profileError);
        showCustomAlert('Error', 'No se pudo actualizar el perfil: ' + profileError.message, 'error');
        return;
      }

      // Éxito
      showCustomAlert(
        '¡Éxito!', 
        'Tu perfil ha sido actualizado exitosamente', 
        'success',
        () => navigation.goBack()
      );

    } catch (error) {
      console.error('Error general:', error);
      showCustomAlert('Error', 'Ocurrió un error al guardar los cambios', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    // Verificar si hay cambios sin guardar
    const hasChanges = 
      userData.nombre_completo !== userProfile?.nombre_completo ||
      userData.email !== userProfile?.email ||
      userData.newPassword ||
      userData.currentPassword;

    if (hasChanges) {
      showCustomAlert(
        'Cancelar Cambios', 
        '¿Estás seguro de que quieres descartar los cambios?', 
        'warning',
        () => navigation.goBack()
      );
    } else {
      navigation.goBack();
    }
  };

  // Modal personalizado
  const CustomModal = () => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={modalVisible}
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[
          styles.modalContainer,
          {
            backgroundColor: modalData.type === 'error' ? '#8B0000' : 
                            modalData.type === 'warning' ? '#8B7500' : '#006400',
            borderColor: modalData.type === 'error' ? '#FF6B6B' : 
                        modalData.type === 'warning' ? '#FFD700' : '#32CD32'
          }
        ]}>
          <View style={styles.modalHeader}>
            <Ionicons 
              name={
                modalData.type === 'error' ? 'close-circle' : 
                modalData.type === 'warning' ? 'warning' : 'checkmark-circle'
              } 
              size={50} 
              color="#FFD700" 
            />
            <Text style={styles.modalTitle}>{modalData.title}</Text>
          </View>
          
          <Text style={styles.modalMessage}>{modalData.message}</Text>
          
          <View style={styles.modalButtonsContainer}>
            {(modalData.type === 'warning' || modalData.type === 'error') && (
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={[
                styles.modalButton,
                modalData.type === 'success' ? styles.modalButtonSuccess :
                modalData.type === 'warning' ? styles.modalButtonWarning :
                styles.modalButtonError
              ]}
              onPress={() => {
                setModalVisible(false);
                if (modalData.onConfirm) {
                  modalData.onConfirm();
                }
              }}
            >
              <Text style={styles.modalButtonText}>
                {modalData.type === 'warning' ? 'Sí, Cancelar' : 'OK'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFD700" />
        <Text style={styles.loadingText}>Cargando perfil...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >

      <ScrollView style={styles.scrollContainer}>
        {/* Información Personal */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información Personal</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Nombre Completo</Text>
            <TextInput
              style={styles.input}
              value={userData.nombre_completo}
              onChangeText={(text) => setUserData({...userData, nombre_completo: text})}
              placeholder="Ingresa tu nombre completo"
              placeholderTextColor="#888"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Correo Electrónico</Text>
            <TextInput
              style={styles.input}
              value={userData.email}
              onChangeText={(text) => setUserData({...userData, email: text})}
              placeholder="Ingresa tu email"
              placeholderTextColor="#888"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        </View>

        {/* Cambio de Contraseña */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cambiar Contraseña</Text>
          <Text style={styles.sectionSubtitle}>
            Deja estos campos vacíos si no quieres cambiar tu contraseña
          </Text>
          
          {/* Contraseña Actual */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Contraseña Actual</Text>
            <View style={styles.passwordInputContainer}>
              <TextInput
                style={styles.passwordInput}
                value={userData.currentPassword}
                onChangeText={(text) => setUserData({...userData, currentPassword: text})}
                placeholder="Ingresa tu contraseña actual"
                placeholderTextColor="#888"
                secureTextEntry={!showCurrentPassword}
              />
              <TouchableOpacity 
                style={styles.eyeButton}
                onPress={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                <Ionicons
                  name={showCurrentPassword ? "eye-outline" : "eye-off-outline"}
                  size={20}
                  color="#FFD700"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Nueva Contraseña */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Nueva Contraseña</Text>
            <View style={styles.passwordInputContainer}>
              <TextInput
                style={styles.passwordInput}
                value={userData.newPassword}
                onChangeText={(text) => setUserData({...userData, newPassword: text})}
                placeholder="Ingresa nueva contraseña (mínimo 6 caracteres)"
                placeholderTextColor="#888"
                secureTextEntry={!showNewPassword}
              />
              <TouchableOpacity 
                style={styles.eyeButton}
                onPress={() => setShowNewPassword(!showNewPassword)}
              >
                <Ionicons
                  name={showNewPassword ? "eye-outline" : "eye-off-outline"}
                  size={20}
                  color="#FFD700"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirmar Contraseña */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Confirmar Contraseña</Text>
            <View style={styles.passwordInputContainer}>
              <TextInput
                style={styles.passwordInput}
                value={userData.confirmPassword}
                onChangeText={(text) => setUserData({...userData, confirmPassword: text})}
                placeholder="Confirma tu nueva contraseña"
                placeholderTextColor="#888"
                secureTextEntry={!showConfirmPassword}
              />
              <TouchableOpacity 
                style={styles.eyeButton}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Ionicons
                  name={showConfirmPassword ? "eye-outline" : "eye-off-outline"}
                  size={20}
                  color="#FFD700"
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Información adicional (solo lectura) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información de la Cuenta</Text>
          
          <View style={styles.readOnlyContainer}>
            <Text style={styles.readOnlyLabel}>ID del Casino</Text>
            <Text style={styles.readOnlyValue}>{userProfile?.casino_id || 'No asignado'}</Text>
          </View>
          
          <View style={styles.readOnlyContainer}>
            <Text style={styles.readOnlyLabel}>Maneki Coins</Text>
            <Text style={styles.readOnlyValue}>
              {userProfile?.maneki_coins ? userProfile.maneki_coins.toLocaleString() : '0'}
            </Text>
          </View>
          
          <View style={styles.readOnlyContainer}>
            <Text style={styles.readOnlyLabel}>Miembro desde</Text>
            <Text style={styles.readOnlyValue}>
              {userProfile?.fecha_creacion ? new Date(userProfile.fecha_creacion).toLocaleDateString('es-ES') : 'No disponible'}
            </Text>
          </View>
        </View>

        {/* Botones de acción */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={handleCancel}
            disabled={saving}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSaveChanges}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <Text style={styles.saveButtonText}>Guardar Cambios</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal personalizado */}
      <CustomModal />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#8B0000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#8B0000',
  },
  loadingText: {
    color: '#FFD700',
    marginTop: 10,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingTop: 40,
    paddingBottom: 10,
    backgroundColor: '#800000',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  backButton: {
    padding: 5,
  },
  placeholder: {
    width: 32,
  },
  scrollContainer: {
    flex: 1,
    padding: 15,
  },
  section: {
    backgroundColor: '#800000',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  sectionTitle: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  sectionSubtitle: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 15,
    opacity: 0.8,
    fontStyle: 'italic',
  },
  inputContainer: {
    marginBottom: 20,
  },
  readOnlyContainer: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#8B0000',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  label: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  readOnlyLabel: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  readOnlyValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#8B0000',
    borderRadius: 10,
    padding: 15,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8B0000',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  passwordInput: {
    flex: 1,
    padding: 15,
    color: '#fff',
    fontSize: 16,
  },
  eyeButton: {
    padding: 15,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#B22222',
    padding: 15,
    borderRadius: 10,
    marginRight: 10,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FF6B6B',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#32CD32',
    padding: 15,
    borderRadius: 10,
    marginLeft: 10,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  saveButtonDisabled: {
    backgroundColor: '#228B22',
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Estilos para el modal personalizado
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 20,
  },
  modalContainer: {
    width: '85%',
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 3,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 15,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
    marginTop: 15,
    textAlign: 'center',
    textShadowColor: '#000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
  },
  modalMessage: {
    fontSize: 16,
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 22,
    fontWeight: '500',
  },
  modalButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    gap: 10,
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FFD700',
    minWidth: 100,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#8B0000',
  },
  modalButtonSuccess: {
    backgroundColor: '#006400',
  },
  modalButtonWarning: {
    backgroundColor: '#8B7500',
  },
  modalButtonError: {
    backgroundColor: '#8B0000',
  },
  modalButtonText: {
    color: '#FFD700',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});