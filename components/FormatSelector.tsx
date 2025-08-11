import React from 'react';
import { BmecatFormat } from '../types';

interface FormatSelectorProps {
  selectedFormat: BmecatFormat;
  onFormatChange: (format: BmecatFormat) => void;
}

export const FormatSelector: React.FC<FormatSelectorProps> = ({
  selectedFormat,
  onFormatChange,
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 p-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-800 mb-3">
          BMECat Format auswählen
        </h2>
        <p className="text-slate-600 text-lg">
          Wählen Sie das gewünschte BMECat-Format für Ihren Export
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* BMECat 1.2 Option */}
        <div
          className={`relative p-6 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
            selectedFormat === '1.2'
              ? 'border-indigo-500 bg-indigo-50 shadow-lg'
              : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
          }`}
          onClick={() => onFormatChange('1.2')}
        >
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  selectedFormat === '1.2'
                    ? 'border-indigo-500 bg-indigo-500'
                    : 'border-slate-300'
                }`}
              >
                {selectedFormat === '1.2' && (
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                )}
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-slate-800 mb-2">
                BMECat 1.2
              </h3>
              <p className="text-slate-600 text-sm mb-3">
                Standard BMECat Format - weit verbreitet und kompatibel mit den meisten Systemen
              </p>
              <div className="space-y-1 text-xs text-slate-500">
                <div>✓ Einfache Struktur</div>
                <div>✓ Hohe Kompatibilität</div>
                <div>✓ Bewährter Standard</div>
              </div>
            </div>
          </div>
        </div>

        {/* BMECat 2005 Option */}
        <div
          className={`relative p-6 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
            selectedFormat === '2005'
              ? 'border-indigo-500 bg-indigo-50 shadow-lg'
              : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
          }`}
          onClick={() => onFormatChange('2005')}
        >
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  selectedFormat === '2005'
                    ? 'border-indigo-500 bg-indigo-500'
                    : 'border-slate-300'
                }`}
              >
                {selectedFormat === '2005' && (
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                )}
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-slate-800 mb-2">
                BMECat 2005
              </h3>
              <p className="text-slate-600 text-sm mb-3">
                Erweiterte Version mit zusätzlichen Feldern und Funktionen
              </p>
              <div className="space-y-1 text-xs text-slate-500">
                <div>✓ Erweiterte Metadaten</div>
                <div>✓ Mehrsprachigkeit</div>
                <div>✓ Zusätzliche Kontaktfelder</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h4 className="text-sm font-medium text-blue-800 mb-1">
              Hinweis zur Formatwahl
            </h4>
            <p className="text-sm text-blue-700">
              {selectedFormat === '1.2' 
                ? 'BMECat 1.2 ist der bewährte Standard und wird von den meisten E-Procurement-Systemen unterstützt.'
                : 'BMECat 2005 bietet erweiterte Funktionen, erfordert aber möglicherweise spezielle Unterstützung im Zielsystem.'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};