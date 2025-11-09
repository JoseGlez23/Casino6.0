import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Linking,
  ImageBackground,
  StatusBar,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function SupportScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const faqItems = [
    {
      question: '¿Cómo deposito dinero?',
      answer: 'Ve a la sección de "Comprar Fichas" y elige tu método de pago preferido.'
    },
    {
      question: '¿Cuánto tarda una transferencia?',
      answer: 'Las transferencias entre usuarios son instantáneas.'
    },
    {
      question: '¿Hay comisiones por transferir?',
      answer: 'No, todas las transferencias entre usuarios son sin comisión.'
    },
    {
      question: '¿Cómo retiro mis ganancias?',
      answer: 'Actualmente las retiros están disponibles contactando a soporte.'
    },
    {
      question: '¿Qué es el bono diario?',
      answer: 'Puedes reclamar bonos diarios en la sección de Perfil.'
    },
    {
      question: '¿Los juegos son justos?',
      answer: 'Todos nuestros juegos usan generadores aleatorios certificados.'
    },
  ];

  const handleSubmit = () => {
    if (!name || !email || !subject || !message) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    // Enviar email
    const emailUrl = `mailto:soporte@manekicasino.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
      `Nombre: ${name}\nEmail: ${email}\n\nMensaje:\n${message}`
    )}`;
    
    Linking.openURL(emailUrl).catch(() => {
      Alert.alert('Error', 'No se pudo abrir la aplicación de email');
    });

    Alert.alert(
      'Mensaje Enviado',
      'Tu consulta ha sido enviada a nuestro equipo de soporte.',
      [{ text: 'ENTENDIDO' }]
    );
    
    // Limpiar formulario
    setName('');
    setEmail('');
    setSubject('');
    setMessage('');
  };

  const contactMethods = [
    {
      method: 'Email',
      details: 'soporte@manekicasino.com',
      icon: 'mail',
      action: () => Linking.openURL('mailto:soporte@manekicasino.com')
    },
    {
      method: 'Teléfono',
      details: '+1-800-MANEKI',
      icon: 'call',
      action: () => Linking.openURL('tel:+1800626354')
    },
    {
 
    
      method: 'WhatsApp',
      details: '+1-555-MANEKI',
      icon: 'logo-whatsapp',
      action: () => Linking.openURL('https://wa.me/1555626354')
    },
  ];

  const openPhoneCall = () => {
    Linking.openURL('tel:+1800626354').catch(() => {
      Alert.alert('Error', 'No se pudo realizar la llamada');
    });
  };

  const openEmail = () => {
    Linking.openURL('mailto:soporte@manekicasino.com').catch(() => {
      Alert.alert('Error', 'No se pudo abrir la aplicación de email');
    });
  };

  return (
    <ImageBackground 
      source={require('../assets/fondologin.jpg')} 
      style={styles.background}
      blurRadius={2}
    >
      <StatusBar barStyle="light-content" backgroundColor="#8B0000" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <Ionicons name="paw" size={28} color="#FFD700" />
          </View>
          <View style={styles.titleContainer}>
            <Text style={styles.japaneseTitle}>招きカジノ</Text>
            <Text style={styles.englishTitle}>MANEKI CASINO</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Título de la pantalla */}
        <View style={styles.screenHeader}>
          <Text style={styles.screenTitle}>CENTRO DE SOPORTE</Text>
          <Text style={styles.screenSubtitle}>Estamos aquí para ayudarte</Text>
        </View>

        {/* Métodos de contacto rápidos */}
        <View style={styles.contactMethods}>
          <View style={styles.cardHeader}>
            <Text style={styles.sectionTitle}>CONTACTO INMEDIATO</Text>
            <Text style={styles.sectionSubtitle}>Elige tu método preferido</Text>
          </View>
          
          <View style={styles.contactGrid}>
            {contactMethods.map((item, index) => (
              <TouchableOpacity 
                key={index}
                style={styles.contactMethodCard}
                onPress={item.action}
              >
                <View style={styles.contactIcon}>
                  <Ionicons name={item.icon} size={24} color="#FFD700" />
                </View>
                <Text style={styles.contactMethod}>{item.method}</Text>
                <Text style={styles.contactDetails}>{item.details}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Preguntas frecuentes */}
        <View style={styles.faqSection}>
          <View style={styles.cardHeader}>
            <Text style={styles.sectionTitle}>PREGUNTAS FRECUENTES</Text>
            <Text style={styles.sectionSubtitle}>Encuentra respuestas rápidas</Text>
          </View>
          
          <View style={styles.faqGrid}>
            {faqItems.map((item, index) => (
              <View key={index} style={styles.faqItem}>
                <View style={styles.faqHeader}>
                  <Ionicons name="help-circle" size={20} color="#FFD700" />
                  <Text style={styles.faqQuestion}>{item.question}</Text>
                </View>
                <View style={styles.faqAnswerContainer}>
                  <Ionicons name="information-circle" size={16} color="#FF6B6B" />
                  <Text style={styles.faqAnswer}>{item.answer}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Formulario de contacto */}
        <View style={styles.formSection}>
          <View style={styles.cardHeader}>
            <Text style={styles.sectionTitle}>FORMULARIO DE CONTACTO</Text>
            <Text style={styles.sectionSubtitle}>Envíanos tu consulta detallada</Text>
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>NOMBRE COMPLETO</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="person" size={20} color="#FF6B6B" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Ingresa tu nombre completo"
                placeholderTextColor="#A0A0A0"
                value={name}
                onChangeText={setName}
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>EMAIL</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail" size={20} color="#FF6B6B" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="tu@email.com"
                placeholderTextColor="#A0A0A0"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>ASUNTO</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="document-text" size={20} color="#FF6B6B" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Describe brevemente tu consulta"
                placeholderTextColor="#A0A0A0"
                value={subject}
                onChangeText={setSubject}
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>MENSAJE</Text>
            <TextInput
              style={[styles.input, styles.messageInput]}
              placeholder="Describe detalladamente tu problema o consulta..."
              placeholderTextColor="#A0A0A0"
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />
          </View>

          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>ENVIAR MENSAJE</Text>
            <Ionicons name="send" size={20} color="#000" />
          </TouchableOpacity>
        </View>

        {/* Información de seguridad */}
        <View style={styles.securityInfo}>
          <View style={styles.cardHeader}>
            <Text style={styles.sectionTitle}>SEGURIDAD Y CONFIANZA</Text>
            <Text style={styles.sectionSubtitle}>Tu seguridad es nuestra prioridad</Text>
          </View>
          
          <View style={styles.securityGrid}>
            <View style={styles.securityItem}>
              <Ionicons name="shield-checkmark" size={24} color="#FFD700" />
              <Text style={styles.securityText}>Comunicaciones encriptadas</Text>
            </View>
            <View style={styles.securityItem}>
              <Ionicons name="time" size={24} color="#FFD700" />
              <Text style={styles.securityText}>Respuesta en menos de 24h</Text>
            </View>
            <View style={styles.securityItem}>
              <Ionicons name="lock-closed" size={24} color="#FFD700" />
              <Text style={styles.securityText}>Datos protegidos</Text>
            </View>
            <View style={styles.securityItem}>
              <Ionicons name="thumbs-up" size={24} color="#FFD700" />
              <Text style={styles.securityText}>Soporte 24/7</Text>
            </View>
          </View>
        </View>

        {/* Información de contacto directa */}
        <View style={styles.directContact}>
          <Text style={styles.directContactTitle}>CONTACTO DIRECTO</Text>
          <View style={styles.directContactButtons}>
            <TouchableOpacity style={styles.callButton} onPress={openPhoneCall}>
              <Ionicons name="call" size={20} color="#FFF" />
              <Text style={styles.callButtonText}>LLAMAR AHORA</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.emailButton} onPress={openEmail}>
              <Ionicons name="mail" size={20} color="#FFF" />
              <Text style={styles.emailButtonText}>ENVIAR EMAIL</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    resizeMode: 'cover',
  },
  container: {
    flex: 1,
    backgroundColor: 'rgba(15, 15, 15, 0.95)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 15,
    backgroundColor: '#8B0000',
    borderBottomWidth: 3,
    borderBottomColor: '#FFD700',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logo: {
    width: 45,
    height: 45,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  titleContainer: {
    flex: 1,
  },
  japaneseTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFD700",
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
  screenHeader: {
    alignItems: 'center',
    paddingVertical: 25,
    paddingHorizontal: 20,
  },
  screenTitle: {
    color: '#FFD700',
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 2,
    marginBottom: 8,
    textAlign: 'center',
  },
  screenSubtitle: {
    color: '#FFF',
    fontSize: 14,
    opacity: 0.9,
    letterSpacing: 1,
    textAlign: 'center',
  },
  contactMethods: {
    backgroundColor: 'rgba(40, 40, 40, 0.95)',
    padding: 25,
    marginHorizontal: 20,
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.3)',
  },
  cardHeader: {
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    letterSpacing: 1,
  },
  sectionSubtitle: {
    color: '#A0A0A0',
    fontSize: 14,
  },
  contactGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  contactMethodCard: {
    width: '48%',
    backgroundColor: 'rgba(139, 0, 0, 0.3)',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  contactIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  contactMethod: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
  },
  contactDetails: {
    color: '#FFF',
    fontSize: 12,
    textAlign: 'center',
  },
  faqSection: {
    backgroundColor: 'rgba(40, 40, 40, 0.95)',
    padding: 25,
    marginHorizontal: 20,
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.3)',
  },
  faqGrid: {
    gap: 12,
  },
  faqItem: {
    backgroundColor: 'rgba(139, 0, 0, 0.2)',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 10,
  },
  faqQuestion: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: 'bold',
    flex: 1,
  },
  faqAnswerContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  faqAnswer: {
    color: '#FFF',
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
  formSection: {
    backgroundColor: 'rgba(40, 40, 40, 0.95)',
    padding: 25,
    marginHorizontal: 20,
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.3)',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    color: '#E8E8E8',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    color: 'white',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.3)',
  },
  messageInput: {
    height: 120,
    textAlignVertical: 'top',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFD700',
    padding: 18,
    borderRadius: 12,
    marginTop: 10,
    gap: 10,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  submitButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  securityInfo: {
    backgroundColor: 'rgba(40, 40, 40, 0.95)',
    padding: 25,
    marginHorizontal: 20,
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.3)',
  },
  securityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  securityItem: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 10,
    gap: 10,
  },
  securityText: {
    color: '#FFF',
    fontSize: 12,
    flex: 1,
  },
  directContact: {
    backgroundColor: 'rgba(139, 0, 0, 0.3)',
    padding: 25,
    marginHorizontal: 20,
    borderRadius: 20,
    marginBottom: 30,
    borderWidth: 2,
    borderColor: '#FFD700',
    alignItems: 'center',
  },
  directContactTitle: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    letterSpacing: 1,
  },
  directContactButtons: {
    flexDirection: 'row',
    gap: 15,
    width: '100%',
  },
  callButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 12,
    gap: 8,
  },
  callButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  emailButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B6B',
    padding: 15,
    borderRadius: 12,
    gap: 8,
  },
  emailButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});