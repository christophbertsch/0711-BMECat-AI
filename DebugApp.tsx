import React, { useState } from 'react';
import { StepIndicator } from './components/StepIndicator';
import { FormatSelector } from './components/FormatSelector';
import { UserGuide } from './components/UserGuide';
import { SpecificationManager } from './components/SpecificationManager';
import { BmecatFormat, BmecatHeaderInfo, StoredSpecification } from './types';
import { SparklesIcon } from './components/Icons';

export default function DebugApp() {
  console.log('DebugApp rendering...');
  
  const [currentStep] = useState(1);
  const [selectedSpecification, setSelectedSpecification] = useState<StoredSpecification | null>(null);
  const [headerInfo, setHeaderInfo] = useState<BmecatHeaderInfo>({
    catalogId: '',
    catalogName: '',
    catalogVersion: '',
    supplierName: '',
    generationDate: new Date().toISOString().split('T')[0],
    format: '1.2' as BmecatFormat,
    // BMECat 2005 specific fields
    language: 'de',
    fabDis: '',
    edition: '',
    contactName: '',
    contactEmail: '',
    contactPhone: ''
  });

  const handleFormatChange = (format: BmecatFormat) => {
    console.log('Format changed to:', format);
    setHeaderInfo(prev => ({ ...prev, format }));
  };

  const handleSpecChange = (spec: StoredSpecification | null) => {
    console.log('Spec changed to:', spec);
    setSelectedSpecification(spec);
  };

  console.log('Rendering with currentStep:', currentStep);
  console.log('HeaderInfo format:', headerInfo.format);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200/80 sticky top-0 z-50">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <h1 className="text-2xl font-bold text-slate-800 flex items-center">
              <SparklesIcon className="w-8 h-8 mr-3 text-transparent bg-clip-text bg-gradient-to-tr from-indigo-500 to-sky-500" />
              <span>Hollys BMEcat AI Konverter - Debug</span>
            </h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-5xl w-full px-4 sm:px-6 lg:px-8 py-10 flex-grow">
        <div className="py-12">
          <StepIndicator currentStep={currentStep} />
        </div>
        
        <div className="mt-8">
          <div className="space-y-12">
            <UserGuide />
            <FormatSelector 
              selectedFormat={headerInfo.format} 
              onFormatChange={handleFormatChange} 
            />
            <SpecificationManager onSpecChange={handleSpecChange} initialSpec={selectedSpecification} />
            <div className="bg-white p-4 rounded-lg">
              <h3 className="font-bold">Debug Info:</h3>
              <p>Current Step: {currentStep}</p>
              <p>Selected Format: {headerInfo.format}</p>
              <p>Selected Spec: {selectedSpecification?.name || 'None'}</p>
            </div>
          </div>
        </div>
      </main>
      
      <footer className="text-center py-8 text-slate-500 text-sm border-t border-slate-200/80 bg-white/60 backdrop-blur-sm mt-16">
        <p>Debug version - Geführte Konvertierung für perfekte BMEcat-Dateien mit KI-Unterstützung.</p>
        <p className="mt-1 text-xs text-slate-400">Powered by Gemini AI</p>
      </footer>
    </div>
  );
}