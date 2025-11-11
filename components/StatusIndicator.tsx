
import React from 'react';
import { ConnectionStatus } from '../types';

interface StatusIndicatorProps {
  status: ConnectionStatus;
}

const statusConfig = {
  [ConnectionStatus.DISCONNECTED]: {
    text: 'Disconnected',
    color: 'bg-gray-500',
  },
  [ConnectionStatus.CONNECTING]: {
    text: 'Connecting...',
    color: 'bg-yellow-500 animate-pulse',
  },
  [ConnectionStatus.CONNECTED]: {
    text: 'Connected',
    color: 'bg-green-500',
  },
  [ConnectionStatus.ERROR]: {
    text: 'Error',
    color: 'bg-red-500',
  },
};

const StatusIndicator: React.FC<StatusIndicatorProps> = ({ status }) => {
  const { text, color } = statusConfig[status];

  return (
    <div className="flex items-center space-x-2">
      <span className={`w-3 h-3 rounded-full ${color}`}></span>
      <span className="text-sm font-medium text-gray-300">{text}</span>
    </div>
  );
};

export default StatusIndicator;
