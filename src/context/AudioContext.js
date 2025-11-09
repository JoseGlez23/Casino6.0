// src/context/AudioContext.js
import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { Audio } from 'expo-av';

const AudioContext = createContext();

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio debe ser usado dentro de un AudioProvider');
  }
  return context;
};

export const AudioProvider = ({ children }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.1); // Volumen inicial al 10%
  const soundRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);

  // Cargar el sonido
  const loadSound = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }

      setIsLoading(true);
      const { sound } = await Audio.Sound.createAsync(
        require('../assets/sounds/musicalogin.mp3'),
        { 
          isLooping: true,
          volume: volume,
          shouldPlay: false
        }
      );
      
      soundRef.current = sound;
      setIsLoading(false);
      return sound;
    } catch (error) {
      console.log('Error al cargar el sonido:', error);
      setIsLoading(false);
      return null;
    }
  };

  // Reproducir música
  const playMusic = async () => {
    try {
      if (!soundRef.current) {
        await loadSound();
      }

      if (soundRef.current) {
        await soundRef.current.setVolumeAsync(volume);
        await soundRef.current.playAsync();
        setIsPlaying(true);
      }
    } catch (error) {
      console.log('Error al reproducir música:', error);
    }
  };

  // Pausar música
  const pauseMusic = async () => {
    try {
      if (soundRef.current && isPlaying) {
        await soundRef.current.pauseAsync();
        setIsPlaying(false);
      }
    } catch (error) {
      console.log('Error al pausar música:', error);
    }
  };

  // Detener música completamente
  const stopMusic = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
        setIsPlaying(false);
      }
    } catch (error) {
      console.log('Error al detener música:', error);
    }
  };

  // Cambiar volumen
  const changeVolume = async (newVolume) => {
    try {
      const clampedVolume = Math.max(0, Math.min(1, newVolume));
      setVolume(clampedVolume);
      
      if (soundRef.current) {
        await soundRef.current.setVolumeAsync(clampedVolume);
      }
    } catch (error) {
      console.log('Error al cambiar volumen:', error);
    }
  };

  // Silenciar/Desilenciar
  const toggleMute = async () => {
    if (volume === 0) {
      await changeVolume(0.1); // Restaurar volumen a 10%
    } else {
      await changeVolume(0); // Silenciar
    }
  };

  // Limpiar recursos
  const cleanup = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
    } catch (error) {
      console.log('Error al limpiar audio:', error);
    }
  };

  // Efecto para limpiar al desmontar
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  const value = {
    isPlaying,
    volume,
    isLoading,
    playMusic,
    pauseMusic,
    stopMusic,
    changeVolume,
    toggleMute
  };

  return (
    <AudioContext.Provider value={value}>
      {children}
    </AudioContext.Provider>
  );
};