// src/hooks/useGameSounds.js
import { useEffect, useState } from "react";
import { Audio } from "expo-av";

export const useGameSounds = () => {
  const [sound, setSound] = useState();

  async function playSound(type) {
    try {
      console.log("Playing sound:", type);

      // Configurar audio
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      // Crear sonidos simples con tonos diferentes
      let soundObject = new Audio.Sound();

      // Frecuencias diferentes para cada tipo de sonido
      const frequencies = {
        win: 800, // Ton alto - victoria
        lose: 300, // Ton bajo - derrota
        card: 500, // Ton medio - carta
        chip: 600, // Ton medio-alto - ficha
      };

      // Crear un sonido simple con la frecuencia
      const frequency = frequencies[type] || 500;
      const duration = 0.3; // 300ms

      // Para simular sonido (en lugar de tonos puros)
      await soundObject.loadAsync(
        require("../../assets/sounds/click.mp3") // Puedes usar cualquier sonido corto
      );

      await soundObject.playAsync();

      // Liberar después de reproducir
      setTimeout(() => {
        soundObject.unloadAsync();
      }, 1000);
    } catch (error) {
      console.log("Error with sound:", error);
    }
  }

  useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  return playSound;
};
