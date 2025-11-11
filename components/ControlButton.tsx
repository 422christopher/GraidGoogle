
import React from 'react';
import { ConnectionStatus } from '../types';

interface ControlButtonProps {
  isActive: boolean;
  onClick: () => void;
  status: ConnectionStatus;
}

const ControlButton: React.FC<ControlButtonProps> = ({ isActive, onClick, status }) => {
  const MicIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
      <path d="M7 4a3 3 0 016 0v6a3 3 0 11-6 0V4z" />
      <path fillRule="evenodd" d="M5.5 8a.5.5 0 00.5.5v1.5a4 4 0 004 4h.5a.5.5 0 000-1H10a3 3 0 01-3-3V8.5a.5.5 0 00-.5-.5z" clipRule="evenodd" />
      <path fillRule="evenodd" d="M10 18a.5.5 0 00.5-.5v-2.03a.5.5 0 00-.09-.29l-.005-.008a6.953 6.953 0 00-6.81 0l-.005.008a.5.5 0 00-.09.29V17.5a.5.5 0 00.5.5h6z" clipRule="evenodd" />
    </svg>
  );

  const StopIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M5 5a1 1 0 011-1h8a1 1 0 011 1v8a1 1 0 01-1 1H6a1 1 0 01-1-1V5z" clipRule="evenodd" />
    </svg>
  );
  
  const ConnectingIcon = (
    <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );

  const buttonClass = `relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ease-in-out shadow-lg focus:outline-none focus:ring-4 ${
    isActive
      ? 'bg-red-600 hover:bg-red-700 focus:ring-red-400'
      : 'bg-purple-600 hover:bg-purple-700 focus:ring-purple-400'
  }`;

  const buttonText = status === ConnectionStatus.CONNECTING ? 'Connecting' : (isActive ? 'Stop' : 'Start');
  
  return (
    <div className="flex flex-col items-center">
      <button onClick={onClick} className={buttonClass} disabled={status === ConnectionStatus.CONNECTING}>
        <span className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 to-transparent"></span>
        {status === ConnectionStatus.CONNECTING ? ConnectingIcon : (isActive ? StopIcon : MicIcon)}
        {isActive && <span className="absolute inset-0 rounded-full animate-ping bg-red-400 opacity-75"></span>}
      </button>
      <span className="mt-2 text-sm font-semibold text-gray-300">{buttonText}</span>
    </div>
  );
};

export default ControlButton;
