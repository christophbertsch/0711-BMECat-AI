import React, { useState } from 'react';
import { BmecatFormat } from './types';
import { FormatSelector } from './components/FormatSelector';
import { SparklesIcon } from './components/Icons';

export default function SimpleApp() {
  const [selectedFormat, setSelectedFormat] = useState<BmecatFormat>('1.2');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200/80 sticky top-0 z-50">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <h1 className="text-2xl font-bold text-slate-800 flex items-center">
              <SparklesIcon className="w-8 h-8 mr-3 text-transparent bg-clip-text bg-gradient-to-tr from-indigo-500 to-sky-500" />
              <span>Hollys BMEcat AI Konverter</span>
            </h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-5xl w-full px-4 sm:px-6 lg:px-8 py-10 flex-grow">
        <div className="mt-8">
          <FormatSelector 
            selectedFormat={selectedFormat}
            onFormatChange={setSelectedFormat}
          />
        </div>
      </main>
    </div>
  );
}