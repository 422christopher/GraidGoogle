import { useState, useRef, useCallback, useEffect } from 'react';
// Fix: The type `LiveSession` is not exported from `@google/genai`.
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from '@google/genai';
import { ConnectionStatus, TranscriptionEntry } from '../types';
import { encode, decode, decodeAudioData } from '../utils/audio';

const INPUT_SAMPLE_RATE = 16000;
const OUTPUT_SAMPLE_RATE = 24000;
const SCRIPT_PROCESSOR_BUFFER_SIZE = 4096;

export const useGeminiLive = () => {
  const [status, setStatus] = useState<ConnectionStatus>(ConnectionStatus.DISCONNECTED);
  const [error, setError] = useState<string | null>(null);
  const [transcriptionHistory, setTranscriptionHistory] = useState<TranscriptionEntry[]>([]);
  
  // Fix: The type `LiveSession` is not exported from `@google/genai`, so we use `any` here.
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const outputSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextStartTimeRef = useRef<number>(0);
  
  const currentInputTranscriptionRef = useRef('');
  const currentOutputTranscriptionRef = useRef('');

  const statusRef = useRef(status);
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  const cleanupSessionResources = useCallback(() => {
    if (sessionPromiseRef.current) {
      sessionPromiseRef.current.then(session => session.close()).catch(() => {});
      sessionPromiseRef.current = null;
    }
    
    mediaStreamRef.current?.getTracks().forEach(track => track.stop());
    mediaStreamRef.current = null;

    scriptProcessorRef.current?.disconnect();
    scriptProcessorRef.current = null;

    mediaStreamSourceRef.current?.disconnect();
    mediaStreamSourceRef.current = null;
    
    if (inputAudioContextRef.current?.state !== 'closed') {
      inputAudioContextRef.current?.close();
      inputAudioContextRef.current = null;
    }
    if (outputAudioContextRef.current?.state !== 'closed') {
      outputAudioContextRef.current?.close();
      outputAudioContextRef.current = null;
    }

    outputSourcesRef.current.forEach(source => source.stop());
    outputSourcesRef.current.clear();
  }, []);

  const stopSession = useCallback(() => {
    cleanupSessionResources();
    setStatus(ConnectionStatus.DISCONNECTED);
    setError(null);
  }, [cleanupSessionResources]);

  const startSession = useCallback(async () => {
    setStatus(ConnectionStatus.CONNECTING);
    setError(null);
    setTranscriptionHistory([]);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: INPUT_SAMPLE_RATE });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: OUTPUT_SAMPLE_RATE });
      
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      
      sessionPromiseRef.current = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } } },
          systemInstruction: 'You are a patient, encouraging math tutor. Explain concepts clearly and keep answers concise.',
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            setStatus(ConnectionStatus.CONNECTED);
            const source = inputAudioContextRef.current!.createMediaStreamSource(stream);
            mediaStreamSourceRef.current = source;
            const scriptProcessor = inputAudioContextRef.current!.createScriptProcessor(SCRIPT_PROCESSOR_BUFFER_SIZE, 1, 1);
            scriptProcessorRef.current = scriptProcessor;

            scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
              const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
              const l = inputData.length;
              const int16 = new Int16Array(l);
              for (let i = 0; i < l; i++) {
                  int16[i] = inputData[i] * 32768;
              }
              const pcmBlob: Blob = {
                  data: encode(new Uint8Array(int16.buffer)),
                  mimeType: `audio/pcm;rate=${INPUT_SAMPLE_RATE}`,
              };

              sessionPromiseRef.current?.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              }).catch(() => {});
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContextRef.current!.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
             // Handle transcription
            if (message.serverContent?.inputTranscription) {
              currentInputTranscriptionRef.current += message.serverContent.inputTranscription.text;
            }
            if (message.serverContent?.outputTranscription) {
              currentOutputTranscriptionRef.current += message.serverContent.outputTranscription.text;
            }

            if (message.serverContent?.turnComplete) {
              const fullInput = currentInputTranscriptionRef.current.trim();
              const fullOutput = currentOutputTranscriptionRef.current.trim();
              
              setTranscriptionHistory(prev => {
                const newHistory = [...prev];
                if (fullInput) newHistory.push({ speaker: 'user', text: fullInput });
                if (fullOutput) newHistory.push({ speaker: 'model', text: fullOutput });
                return newHistory;
              });

              currentInputTranscriptionRef.current = '';
              currentOutputTranscriptionRef.current = '';
            }
            
            // Handle audio playback
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio && outputAudioContextRef.current) {
              const audioCtx = outputAudioContextRef.current;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, audioCtx.currentTime);
              
              const audioBuffer = await decodeAudioData(decode(base64Audio), audioCtx, OUTPUT_SAMPLE_RATE, 1);
              const source = audioCtx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(audioCtx.destination);

              source.addEventListener('ended', () => {
                outputSourcesRef.current.delete(source);
              });

              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              outputSourcesRef.current.add(source);
            }

            if (message.serverContent?.interrupted) {
              outputSourcesRef.current.forEach(source => source.stop());
              outputSourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onerror: (e: ErrorEvent) => {
            console.error('WebSocket Error Event:', e);
            if (statusRef.current !== ConnectionStatus.ERROR) {
                setError('A connection error occurred.');
                setStatus(ConnectionStatus.ERROR);
            }
          },
          onclose: (e: CloseEvent) => {
            if (e.code !== 1000) { // 1000 is normal closure
              const message = e.reason || `Connection closed unexpectedly (Code: ${e.code}).`;
              console.error(`WebSocket closed: ${message}`);
              setError(message);
              setStatus(ConnectionStatus.ERROR);
            } else {
              setStatus(ConnectionStatus.DISCONNECTED);
            }
            cleanupSessionResources();
          },
        },
      });

    } catch (err: any) {
      console.error("Failed to start session:", err);
      setError(`Failed to start session: ${err.message}`);
      setStatus(ConnectionStatus.ERROR);
    }
  }, [cleanupSessionResources]);

  return { status, error, transcriptionHistory, startSession, stopSession };
};