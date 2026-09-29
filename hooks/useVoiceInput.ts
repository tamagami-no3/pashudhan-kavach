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
        // Use continuous mode so recognition does not cut off after a 0.5s pause
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;

        const activeLang = targetLang || language;
        recognition.lang = langLocaleMap[activeLang] || 'mr-IN';

        recognition.onstart = () => {
          setIsListening(true);
        };

        recognition.onresult = (event: any) => {
          let fullTranscript = '';
          let hasFinalChunk = false;

          for (let i = 0; i < event.results.length; i++) {
            const res = event.results[i];
            if (res && res[0]) {
              fullTranscript += res[0].transcript + ' ';
              if (res.isFinal) {
                hasFinalChunk = true;
              }
            }
          }

          const trimmed = fullTranscript.trim();
          setTranscript(trimmed);

          if (onTranscriptChange && trimmed) {
            onTranscriptChange(trimmed);
          }

          if (hasFinalChunk && onFinalTranscript && trimmed) {
            onFinalTranscript(trimmed);
          }
        };

        recognition.onerror = (event: any) => {
          console.warn('Speech recognition error event:', event.error);
          if (event.error === 'not-allowed') {
            setIsListening(false);
            toast.error('Microphone access was denied. Please allow microphone permissions.');
          } else if (event.error === 'no-speech') {
            // benign in continuous mode, do not drop session
          } else if (event.error !== 'aborted') {
            setIsListening(false);
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

