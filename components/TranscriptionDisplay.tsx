
import React, { useRef, useEffect } from 'react';
import { TranscriptionEntry } from '../types';

interface TranscriptionDisplayProps {
  history: TranscriptionEntry[];
}

const TranscriptionDisplay: React.FC<TranscriptionDisplayProps> = ({ history }) => {
  const endOfMessagesRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  if (history.length === 0) {
    return (
      <div className="flex-grow flex items-center justify-center">
        <div className="text-center text-gray-500">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8s-9-3.582-9-8 4.03-8 9-8 9 3.582 9 8z" />
          </svg>
          <p className="mt-2 text-lg font-medium">Start talking to see the conversation here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-grow overflow-y-auto space-y-6 pr-2">
      {history.map((entry, index) => (
        <div
          key={index}
          className={`flex items-start gap-3 ${
            entry.speaker === 'user' ? 'justify-end' : 'justify-start'
          }`}
        >
          {entry.speaker === 'model' && (
            <div className="w-8 h-8 rounded-full bg-purple-500 flex-shrink-0 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" /></svg>
            </div>
          )}
          <div
            className={`max-w-xs md:max-w-md lg:max-w-2xl px-4 py-3 rounded-2xl shadow ${
              entry.speaker === 'user'
                ? 'bg-blue-600 text-white rounded-br-lg'
                : 'bg-gray-700 text-gray-200 rounded-bl-lg'
            }`}
          >
            <p className="text-sm leading-relaxed">{entry.text}</p>
          </div>
          {entry.speaker === 'user' && (
            <div className="w-8 h-8 rounded-full bg-blue-500 flex-shrink-0 flex items-center justify-center">
             <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
            </div>
          )}
        </div>
      ))}
      <div ref={endOfMessagesRef} />
    </div>
  );
};

export default TranscriptionDisplay;
