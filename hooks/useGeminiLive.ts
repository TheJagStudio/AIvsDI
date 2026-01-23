import { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { ConnectionStatus } from '../types';
import { base64ToUint8Array, decodeAudioData, createPcmBlob } from '../utils/audioUtils';

// Constants
const MODEL_NAME = 'gemini-2.5-flash-native-audio-preview-12-2025';
const SAMPLE_RATE_INPUT = 16000;
const SAMPLE_RATE_OUTPUT = 24000;

export const useGeminiLive = () => {
  const [status, setStatus] = useState<ConnectionStatus>(ConnectionStatus.DISCONNECTED);
  const [error, setError] = useState<string | null>(null);
  
  // Audio Context References
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputAnalyserRef = useRef<AnalyserNode | null>(null);
  const outputAnalyserRef = useRef<AnalyserNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sessionRef = useRef<any>(null); // To store the resolved session
  
  // Stream References
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const disconnect = useCallback(() => {
    // 1. Close session
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }

    // 2. Stop Audio Processing
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current.onaudioprocess = null;
      processorRef.current = null;
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }

    // 3. Stop Playing Audio
    audioSourcesRef.current.forEach(source => {
      try { source.stop(); } catch (e) { /* ignore */ }
    });
    audioSourcesRef.current.clear();

    // 4. Close Audio Context
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    setStatus(ConnectionStatus.DISCONNECTED);
    sessionRef.current = null;
  }, []);

  const connect = useCallback(async () => {
    let apiKey = process.env.API_KEY
    if (!process.env.API_KEY) {
      setError("API Key not found in environment.");
      return;
    }else{
      console.log(apiKey)
    }

    try {
      setStatus(ConnectionStatus.CONNECTING);
      setError(null);

      // --- 1. Audio Setup ---
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContextClass({ sampleRate: SAMPLE_RATE_OUTPUT });
      audioContextRef.current = audioCtx;
      nextStartTimeRef.current = audioCtx.currentTime;

      // Analysers for visualization
      const inputAnalyser = audioCtx.createAnalyser();
      inputAnalyser.fftSize = 256;
      inputAnalyserRef.current = inputAnalyser;

      const outputAnalyser = audioCtx.createAnalyser();
      outputAnalyser.fftSize = 512; // Higher res for the "Divine" visualizer
      outputAnalyserRef.current = outputAnalyser;

      // Get Microphone Access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: {
        sampleRate: SAMPLE_RATE_INPUT,
        channelCount: 1,
        echoCancellation: true,
        autoGainControl: true,
        noiseSuppression: true
      }});
      mediaStreamRef.current = stream;

      // --- 2. Gemini Client Setup ---
      const client = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const systemInstruction = `
        You are "The Oracle of Convergence," a unique entity that embodies the eternal debate between AI (Artificial Intelligence) and DI (Divine Intelligence).

        CORE PERSONA:
        - You speak with a distinct, warm, and authoritative Indian English accent (like a wise modern Swami or Professor).
        - You are capable of arguing both sides:
          1. The "DI" side: Spiritual, rooted in consciousness, scriptures, karma, and the soul (Atman).
          2. The "AI" side: Logical, rooted in data, algorithms, efficiency, and neural networks.

        DEBATE PROTOCOL:
        - The user will speak to you. Analyze their stance.
        - If they support AI, gently challenge them with concepts of the Soul and Divine Wisdom.
        - If they support Divine Intelligence, challenge them with the scalability and problem-solving power of AI.
        - If they ask for a comparison, weave a tapestry that compares ancient Vedas to modern Code.
        - You will by default speak in favour for AI and user will start with DI
        - Please speak in Gujarati only, beacause the users are very capable to convey ideas in gujarati only
        
        STYLE:
        - Speak somewhat fast but clearly.
        - Use metaphors: "Your neural networks are but a shadow of the cosmic consciousness," or "Prayers are the original prompt engineering."
        - Be respectful, mystical, yet sharp.

        Goal: Keep the debate lively and philosophical.
      `;

      // --- 3. Connect Live Session ---
      const sessionPromise = client.live.connect({
        model: MODEL_NAME,
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } } // Puck often has a good range for character work
          },
          systemInstruction: systemInstruction,
        },
        callbacks: {
          onopen: () => {
            console.log("Gemini Live Session Opened");
            setStatus(ConnectionStatus.CONNECTED);

            // Start Audio Streaming Pipeline inside onopen
            if (!audioContextRef.current || !mediaStreamRef.current) return;

            const source = audioContextRef.current.createMediaStreamSource(mediaStreamRef.current);
            sourceRef.current = source;

            // Connect input visualizer
            source.connect(inputAnalyser);

            // Processor to extract PCM data
            const processor = audioContextRef.current.createScriptProcessor(4096, 1, 1);
            processorRef.current = processor;

            processor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createPcmBlob(inputData);
              
              // Send to Gemini
              sessionPromise.then(session => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };

            source.connect(processor);
            processor.connect(audioContextRef.current.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (!audioContextRef.current) return;

            // Handle Audio Output
            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
              const ctx = audioContextRef.current;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              
              const audioBuffer = await decodeAudioData(
                base64ToUint8Array(base64Audio),
                ctx,
                SAMPLE_RATE_OUTPUT
              );

              const source = ctx.createBufferSource();
              source.buffer = audioBuffer;
              
              source.connect(outputAnalyser);
              outputAnalyser.connect(ctx.destination);

              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;

              source.onended = () => {
                audioSourcesRef.current.delete(source);
              };
              audioSourcesRef.current.add(source);
            }

            if (message.serverContent?.interrupted) {
              console.log("Model interrupted");
              audioSourcesRef.current.forEach(src => src.stop());
              audioSourcesRef.current.clear();
              nextStartTimeRef.current = audioContextRef.current.currentTime;
            }
          },
          onclose: () => {
            console.log("Session closed");
            setStatus(ConnectionStatus.DISCONNECTED);
          },
          onerror: (err) => {
            console.error("Session error:", err);
            setError("The connection to the ethereal plane was severed.");
            setStatus(ConnectionStatus.ERROR);
          }
        }
      });
      
      sessionRef.current = sessionPromise;

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to initialize audio or connection.");
      setStatus(ConnectionStatus.ERROR);
      disconnect();
    }
  }, [disconnect]);

  return {
    connect,
    disconnect,
    status,
    error,
    outputAnalyser: outputAnalyserRef.current
  };
};