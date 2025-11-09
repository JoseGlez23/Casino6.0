// src/hooks/useGameEffects.js
import { Vibration, Platform } from 'react-native';

export const useGameEffects = () => {
  const playEffect = (type) => {
    // Efectos de vibración
    if (Platform.OS !== 'web') {
      switch(type) {
        case 'win':
          Vibration.vibrate([0, 100, 50, 100]);
          break;
        case 'lose':
          Vibration.vibrate([0, 200, 100, 200]);
          break;
        case 'card':
          Vibration.vibrate(30);
          break;
        case 'chip':
          Vibration.vibrate(20);
          break;
        default:
          Vibration.vibrate(50);
      }
    }

    // También puedes agregar efectos visuales aquí
    return type;
  };

  return playEffect;
};