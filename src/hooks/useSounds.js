// src/hooks/useSounds.js
import { useEffect, useState } from "react";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";

const SOUNDS = {
  click: require("../assets/sounds/click.mp3"),
  coin: require("../assets/sounds/coin.mp3"),
  error: require("../assets/sounds/error.mp3"),
  success: require("../assets/sounds/success.mp3"),
  slots: require("../assets/sounds/slots.mp3"),
  card: require("../assets/sounds/card.mp3"),
};

export const useSounds = () => {
  const [soundObjects, setSoundObjects] = useState({});

  useEffect(() => {
    const loadSounds = async () => {
      const loadedSounds = {};

      for (const [key, sound] of Object.entries(SOUNDS)) {
        try {
          const { sound: soundObject } = await Audio.Sound.createAsync(sound);
          loadedSounds[key] = soundObject;
        } catch (error) {
          console.warn(`Error loading sound ${key}:`, error);
        }
      }

      setSoundObjects(loadedSounds);
    };

    loadSounds();

    return () => {
      // Cleanup sounds
      Object.values(soundObjects).forEach((sound) => {
        if (sound) {
          sound.unloadAsync();
        }
      });
    };
  }, []);

  const playSound = async (soundName) => {
    try {
      const sound = soundObjects[soundName];
      if (sound) {
        await sound.replayAsync();
      }
    } catch (error) {
      console.warn(`Error playing sound ${soundName}:`, error);
    }
  };

  return { playSound };
};
