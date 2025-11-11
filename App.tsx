
import React from 'react';
import { useGeminiLive } from './hooks/useGeminiLive';
import { ConnectionStatus } from './types';
import TranscriptionDisplay from './components/TranscriptionDisplay';
import StatusIndicator from './components/StatusIndicator';
import ControlButton from './components/ControlButton';
import ErrorDisplay from './components/ErrorDisplay';

const App: React.FC = () => {
  const {
    status,
    error,
    transcriptionHistory,
    startSession,
    stopSession,
  } = useGeminiLive();

  const isSessionActive = status === ConnectionStatus.CONNECTED || status === ConnectionStatus.CONNECTING;

  const handleToggleSession = () => {
    if (isSessionActive) {
      stopSession();
    } else {
      startSession();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-gray-100 font-sans">
      <header className="flex-shrink-0 bg-gray-800/50 backdrop-blur-sm shadow-lg z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <svg
              className="w-8 h-8 text-purple-400"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 2.25c-5.376 0-9.75 4.374-9.75 9.75s4.374 9.75 9.75 9.75 9.75-4.374 9.75-9.75S17.376 2.25 12 2.25Zm0 1.5a8.25 8.25 0 1 1 0 16.5 8.25 8.25 0 0 1 0-16.5ZM12 6a.75.75 0 0 0-.75.75v1.5a.75.75 0 0 0 1.5 0v-1.5A.75.75 0 0 0 12 6Zm-2.625 4.5a.75.75 0 0 0-1.5 0v3a.75.75 0 0 0 1.5 0v-3Zm5.25 0a.75.75 0 0 0-1.5 0v3a.75.75 0 0 0 1.5 0v-3Zm-2.625 4.5a.75.75 0 0 0-1.5 0v1.5a.75.75 0 0 0 1.5 0v-1.5Z" />
            </svg>
            <h1 className="text-xl font-bold tracking-tight text-white">
              Gemini Live
            </h1>
          </div>
          <StatusIndicator status={status} />
        </div>
      </header>

      <main className="flex-grow flex flex-col p-4 sm:p-6 lg:p-8 overflow-hidden">
        {error && <ErrorDisplay message={error} />}
        <TranscriptionDisplay history={transcriptionHistory} />
      </main>

      <footer className="flex-shrink-0 p-4 sm:p-6 lg:p-8 bg-gray-900/50 border-t border-gray-700/50">
        <div className="flex flex-col items-center justify-center space-y-4">
          <ControlButton
            isActive={isSessionActive}
            onClick={handleToggleSession}
            status={status}
          />
          <p className="text-xs text-gray-500 text-center">
            Click the button to start a conversation. Your privacy is respected.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
