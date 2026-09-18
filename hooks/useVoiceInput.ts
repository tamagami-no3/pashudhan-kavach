'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';

export interface UseVoiceInputOptions {
  language?: 'mr' | 'hi' | 'en';
  onTranscriptChange?: (text: string) => void;
  onFinalTranscript?: (text: string) => void;
}

export function useVoiceInput(options: UseVoiceInputOptions = {}) {
  const { language = 'mr', onTranscriptChange, onFinalTranscript } = options;
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Map app languages to BCP 47 locales for Indian speech recognition
  const langLocaleMap: Record<string, string> = {
    mr: 'mr-IN',
    hi: 'hi-IN',
    en: 'en-IN',
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      setIsSupported(Boolean(SpeechRecognition));
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore already stopped error
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  const startListening = useCallback(
    (targetLang?: 'mr' | 'hi' | 'en') => {
      if (typeof window === 'undefined') return;

      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (!SpeechRecognition) {
        toast.error('Voice input is not supported in this browser. Please use Chrome or Edge.');
        return;
      }

      // Stop existing session if active
      if (recognitionRef.current) {
        stopListening();
      }

      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;

        const activeLang = targetLang || language;
        recognition.lang = langLocaleMap[activeLang] || 'mr-IN';

        recognition.onstart = () => {
          setIsListening(true);
        };

        recognition.onresult = (event: any) => {
          let currentText = '';
          let isFinal = false;

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            currentText += result[0].transcript;
            if (result.isFinal) {
              isFinal = true;
            }
          }

          setTranscript(currentText);
          if (onTranscriptChange) {
            onTranscriptChange(currentText);
          }

          if (isFinal && onFinalTranscript) {
            onFinalTranscript(currentText);
          }
        };

        recognition.onerror = (event: any) => {
          console.warn('Speech recognition error event:', event.error);
          setIsListening(false);
          if (event.error === 'not-allowed') {
            toast.error('Microphone access was denied. Please allow microphone permissions.');
          } else if (event.error === 'no-speech') {
            // benign, no speech detected
          } else if (event.error !== 'aborted') {
            toast.error(`Speech recognition error: ${event.error}`);
          }
        };

        recognition.onend = () => {
          setIsListening(false);
          recognitionRef.current = null;
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch (err: any) {
        console.error('Failed to start speech recognition:', err);
        setIsListening(false);
        toast.error(err.message || 'Failed to access microphone');
      }
    },
    [language, onTranscriptChange, onFinalTranscript, stopListening]
  );

  const toggleListening = useCallback(
    (targetLang?: 'mr' | 'hi' | 'en') => {
      if (isListening) {
        stopListening();
      } else {
        startListening(targetLang);
      }
    },
    [isListening, startListening, stopListening]
  );

  return {
    isListening,
    transcript,
    isSupported,
    startListening,
    stopListening,
    toggleListening,
  };
}

