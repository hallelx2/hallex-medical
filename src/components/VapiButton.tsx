import React from "react";
import { useVapi } from "../hooks/useVapi";

interface VapiButtonProps {
  publicKey?: string;
  assistantId?: string;
  baseUrl?: string;
  className?: string;
}

export const VapiButton: React.FC<VapiButtonProps> = ({
  publicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY,
  assistantId = "64414234-62a2-4f9b-95d5-5dd4a50bb51e",
  baseUrl = process.env.NEXT_PUBLIC_VAPI_BASE_URL,
  className = "",
}) => {
  const { startCall, endCall, isSessionActive, isLoading, error, volumeLevel } =
    useVapi({
      publicKey,
      assistantId: assistantId || "",
      baseUrl,
    });

  const handleClick = () => {
    if (isSessionActive) {
      endCall();
    } else {
      startCall();
    }
  };

  if (!assistantId) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
        Missing Vapi configuration. Please set an assistant ID.
      </div>
    );
  }

  // Calculate dynamic style for pulsing based on volume
  const pulseStyle = isSessionActive
    ? {
        boxShadow: `0 0 0 ${Math.max(0, volumeLevel * 40)}px rgba(59, 130, 246, 0.2)`,
      }
    : {};

  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      <button
        type="button"
        onClick={handleClick}
        disabled={isLoading}
        style={pulseStyle}
        className={`
          relative flex h-24 w-24 items-center justify-center rounded-full text-white transition-all duration-300
          ${
            isLoading
              ? "bg-blue-400 cursor-not-allowed"
              : isSessionActive
                ? "bg-red-500 hover:bg-red-600"
                : "bg-blue-600 hover:bg-blue-700 hover:scale-105"
          }
        `}
      >
        {isLoading ? (
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-white border-t-transparent" />
        ) : isSessionActive ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            role="img"
            aria-label="End Call"
          >
            <title>End Call</title>
            <path d="M10.73 5.08A2 2 0 0 1 14 6v12a2 2 0 0 1-3.27.92L6 15H4a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2h2l4.73-3.92z" />
            <line x1="23" y1="9" x2="17" y2="15" />
            <line x1="17" y1="9" x2="23" y2="15" />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            role="img"
            aria-label="Start Call"
          >
            <title>Start Call</title>
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
        )}
      </button>

      <div className="text-center font-medium text-slate-700 dark:text-slate-300">
        {isLoading
          ? "Connecting to Assistant..."
          : isSessionActive
            ? "Call in Progress"
            : "Start Triage Call"}
      </div>

      {error && (
        <div className="max-w-xs rounded-md bg-red-50 p-3 text-sm text-red-600 border border-red-200 text-center">
          {error}
        </div>
      )}
    </div>
  );
};
