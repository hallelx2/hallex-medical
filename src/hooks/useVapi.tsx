import { useState, useCallback, useEffect } from "react";
import Vapi from "@vapi-ai/web";

interface VapiConfig {
  publicKey?: string;
  assistantId: string;
  baseUrl?: string;
}

export interface TranscriptMessage {
  id: string;
  role: "user" | "assistant" | "system";
  type: string;
  transcript: string;
  timestamp: Date;
}

interface VapiState {
  isSessionActive: boolean;
  isLoading: boolean;
  error: string | null;
  volumeLevel: number;
  isSpeaking: boolean;
  messages: TranscriptMessage[];
}

export const useVapi = (config: VapiConfig) => {
  const [vapi, setVapi] = useState<Vapi | null>(null);
  const [state, setState] = useState<VapiState>({
    isSessionActive: false,
    isLoading: false,
    error: null,
    volumeLevel: 0,
    isSpeaking: false,
    messages: [],
  });

  useEffect(() => {
    // Initialize Vapi with the public key directly
    const tokenToUse = config.publicKey || "";
    const vapiInstance = new Vapi(tokenToUse, config.baseUrl);

    setVapi(vapiInstance);

    const handleCallStart = () => {
      setState((prev) => ({
        ...prev,
        isSessionActive: true,
        isLoading: false,
        messages: [],
      }));
    };

    const handleCallEnd = () => {
      setState((prev) => ({
        ...prev,
        isSessionActive: false,
        isLoading: false,
        volumeLevel: 0,
        isSpeaking: false,
      }));
    };

    const handleError = (error: any) => {
      setState((prev) => ({
        ...prev,
        error: error?.message || "Unknown error occurred",
        isLoading: false,
      }));
    };

    const handleVolumeLevel = (volume: number) => {
      setState((prev) => ({ ...prev, volumeLevel: volume }));
    };

    const handleSpeechStart = () => {
      setState((prev) => ({ ...prev, isSpeaking: true }));
    };

    const handleSpeechEnd = () => {
      setState((prev) => ({ ...prev, isSpeaking: false }));
    };

    const handleMessage = (message: any) => {
      if (message.type === "transcript" || message.type === "model-output") {
        if (message.transcript || message.output) {
          const newMsg: TranscriptMessage = {
            id: Math.random().toString(36).substring(7),
            role:
              message.role ||
              (message.type === "transcript" ? "user" : "assistant"),
            type: message.type,
            transcript: message.transcript || message.output || "",
            timestamp: new Date(),
          };

          setState((prev) => ({
            ...prev,
            messages: [...prev.messages, newMsg],
          }));
        }
      }
    };

    vapiInstance.on("call-start", handleCallStart);
    vapiInstance.on("call-end", handleCallEnd);
    vapiInstance.on("error", handleError);
    vapiInstance.on("volume-level", handleVolumeLevel);
    vapiInstance.on("speech-start", handleSpeechStart);
    vapiInstance.on("speech-end", handleSpeechEnd);
    vapiInstance.on("message", handleMessage);

    return () => {
      vapiInstance.off("call-start", handleCallStart);
      vapiInstance.off("call-end", handleCallEnd);
      vapiInstance.off("error", handleError);
      vapiInstance.off("volume-level", handleVolumeLevel);
      vapiInstance.off("speech-start", handleSpeechStart);
      vapiInstance.off("speech-end", handleSpeechEnd);
      vapiInstance.off("message", handleMessage);
      vapiInstance.stop();
    };
  }, [config.publicKey, config.baseUrl]);

  const startCall = useCallback(async () => {
    if (!vapi) return;

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      await vapi.start(config.assistantId);
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        error: error?.message || "Failed to start call",
        isLoading: false,
      }));
    }
  }, [vapi, config.assistantId]);

  const endCall = useCallback(() => {
    if (!vapi) return;
    vapi.stop();
  }, [vapi]);

  return {
    startCall,
    endCall,
    ...state,
  };
};
