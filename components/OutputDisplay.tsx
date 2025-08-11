
import React, { useState } from 'react';
import { DocumentDuplicateIcon, ArrowDownTrayIcon, CheckCircleIcon } from './Icons';

interface OutputDisplayProps {
  xml: string;
  catalogName: string;
}

export const OutputDisplay: React.FC<OutputDisplayProps> = ({ xml, catalogName }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(xml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const sanitizedCatalogName = catalogName.replace(/[\s\\/:"*?<>|]+/g, '_');
    const fileName = `${sanitizedCatalogName || 'bmecat_export'}.xml`;

    const blob = new Blob([xml], { type: 'application/xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const sanitizedCatalogName = catalogName.replace(/[\s\\/:"*?<>|]+/g, '_');
  const fileName = `${sanitizedCatalogName || 'bmecat_export'}.xml`;

  return (
    <div className="space-y-8">
        <div className="text-center">
            <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto" />
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Konvertierung erfolgreich!</h2>
            <p className="mt-4 text-lg text-slate-600">Ihr BMEcat-Katalog ist fertig. Sie können den Inhalt überprüfen und die Datei herunterladen.</p>
        </div>

      <div className="bg-slate-800 rounded-2xl shadow-2xl overflow-hidden border border-slate-700">
        <div className="flex justify-between items-center px-4 py-3 bg-slate-900/70 border-b border-slate-700">
            <p className="text-sm font-mono text-sky-300">{fileName}</p>
            <div className="flex space-x-2">
                <button
                    onClick={handleCopy}
                    className="flex items-center px-3 py-1.5 bg-slate-700 text-slate-300 rounded-md hover:bg-slate-600 transition-colors text-xs font-semibold"
                >
                    {copied ? <CheckCircleIcon className="w-4 h-4 text-green-400 mr-2" /> : <DocumentDuplicateIcon className="w-4 h-4 mr-2" />}
                    {copied ? 'Kopiert!' : 'Kopieren'}
                </button>
            </div>
        </div>
        <div className="p-1">
            <pre className="w-full h-96 overflow-auto p-4 text-sm">
                <code className="language-xml text-white/90 font-mono">
                    {xml}
                </code>
            </pre>
        </div>
      </div>

       <div className="flex justify-center pt-4">
          <button
            onClick={handleDownload}
            className="flex justify-center items-center px-12 py-4 text-lg font-semibold text-white rounded-xl transition-all shadow-lg hover:shadow-2xl transform hover:-translate-y-1 bg-gradient-to-br from-green-600 to-teal-500 hover:from-green-700 hover:to-teal-600"
          >
            <ArrowDownTrayIcon className="w-6 h-6 mr-3" />
            BMEcat Herunterladen
          </button>
        </div>
    </div>
  );
};