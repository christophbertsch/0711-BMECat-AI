import React, { useState, useCallback } from 'react';
import { FormatSelector } from './components/FormatSelector';
import { FileUpload } from './components/FileUpload';
import { HeaderForm } from './components/HeaderForm';
import { StepIndicator } from './components/StepIndicator';
import { BmecatFormat, BmecatHeaderInfo, ParsedCsvRow } from './types';
import { SparklesIcon, ArrowPathIcon } from './components/Icons';
import { parseCsv } from './services/csvParser';

export default function FullWorkflowTest() {
  const [currentStep, setCurrentStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [headerInfo, setHeaderInfo] = useState<BmecatHeaderInfo>({
    catalogId: 'TEST-001',
    catalogName: 'Test Katalog',
    catalogVersion: '1.0',
    supplierName: 'Test Supplier',
    generationDate: new Date().toISOString().split('T')[0],
    format: '1.2' as BmecatFormat,
    language: 'de',
    fabDis: '',
    edition: '',
    contactName: '',
    contactEmail: '',
    contactPhone: ''
  });

  const [csvData, setCsvData] = useState<ParsedCsvRow[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvFileName, setCsvFileName] = useState<string | null>(null);
  const [generatedXml, setGeneratedXml] = useState<string>('');

  const handleFormatChange = (format: BmecatFormat) => {
    setHeaderInfo(prev => ({ ...prev, format }));
  };

  const handleFileLoaded = useCallback((content: string, name: string) => {
    try {
      setError(null);
      const { data, headers } = parseCsv(content);
      setCsvData(data);
      setCsvHeaders(headers);
      setCsvFileName(name);
    } catch (err) {
      setError(`Fehler beim Laden der CSV: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, []);

  const handleCsvFileRemoved = useCallback(() => {
    setCsvData([]);
    setCsvHeaders([]);
    setCsvFileName(null);
    setError(null);
  }, []);

  const handleNextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const generateTestXml = (data: ParsedCsvRow[], headerInfo: BmecatHeaderInfo) => {
    const currentDate = new Date().toISOString();
    
    if (headerInfo.format === '1.2') {
      return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE BMECAT SYSTEM "bmecat_new_catalog.dtd">
<BMECAT version="1.2" xmlns="http://www.bmecat.org/bmecat/1.2/bmecat_new_catalog">
  <HEADER>
    <CATALOG>
      <LANGUAGE>de</LANGUAGE>
      <CATALOG_ID>${headerInfo.catalogId}</CATALOG_ID>
      <CATALOG_VERSION>${headerInfo.catalogVersion}</CATALOG_VERSION>
      <CATALOG_NAME>${headerInfo.catalogName}</CATALOG_NAME>
      <GENERATION_DATE>${currentDate}</GENERATION_DATE>
    </CATALOG>
    <SUPPLIER>
      <SUPPLIER_NAME>${headerInfo.supplierName}</SUPPLIER_NAME>
    </SUPPLIER>
  </HEADER>
  <T_NEW_CATALOG>
${data.map(row => `    <ARTICLE>
      <SUPPLIER_AID>${row['Artikelnummer'] || 'N/A'}</SUPPLIER_AID>
      <ARTICLE_DETAILS>
        <DESCRIPTION_SHORT>${row['Produktname'] || 'N/A'}</DESCRIPTION_SHORT>
        <DESCRIPTION_LONG>${row['Beschreibung'] || 'N/A'}</DESCRIPTION_LONG>
        <EAN>${row['EAN'] || ''}</EAN>
        <MANUFACTURER_NAME>${row['Hersteller'] || ''}</MANUFACTURER_NAME>
        <MANUFACTURER_AID>${row['Herstellernummer'] || ''}</MANUFACTURER_AID>
      </ARTICLE_DETAILS>
      <ARTICLE_PRICE_DETAILS>
        <ARTICLE_PRICE price_type="net_list">
          <PRICE_AMOUNT>${row['Preis'] || '0.00'}</PRICE_AMOUNT>
          <PRICE_CURRENCY>EUR</PRICE_CURRENCY>
          <TAX>0.19</TAX>
        </ARTICLE_PRICE>
      </ARTICLE_PRICE_DETAILS>
    </ARTICLE>`).join('\n')}
  </T_NEW_CATALOG>
</BMECAT>`;
    } else {
      return `<?xml version="1.0" encoding="UTF-8"?>
<BMECAT version="2005" xmlns="http://www.bmecat.org/bmecat/2005">
  <HEADER>
    <CATALOG>
      <LANGUAGE>${headerInfo.language}</LANGUAGE>
      <CATALOG_ID>${headerInfo.catalogId}</CATALOG_ID>
      <CATALOG_VERSION>${headerInfo.catalogVersion}</CATALOG_VERSION>
      <CATALOG_NAME>${headerInfo.catalogName}</CATALOG_NAME>
      <GENERATION_DATE>${currentDate}</GENERATION_DATE>
      ${headerInfo.edition ? `<EDITION>${headerInfo.edition}</EDITION>` : ''}
    </CATALOG>
    <SUPPLIER>
      <SUPPLIER_NAME>${headerInfo.supplierName}</SUPPLIER_NAME>
      ${headerInfo.contactName ? `<CONTACT_DETAILS>
        <CONTACT_NAME>${headerInfo.contactName}</CONTACT_NAME>
        ${headerInfo.contactEmail ? `<CONTACT_EMAIL>${headerInfo.contactEmail}</CONTACT_EMAIL>` : ''}
        ${headerInfo.contactPhone ? `<CONTACT_PHONE>${headerInfo.contactPhone}</CONTACT_PHONE>` : ''}
      </CONTACT_DETAILS>` : ''}
    </SUPPLIER>
  </HEADER>
  <T_NEW_CATALOG>
${data.map(row => `    <ARTICLE>
      <SUPPLIER_AID>${row['Artikelnummer'] || 'N/A'}</SUPPLIER_AID>
      <ARTICLE_DETAILS>
        <DESCRIPTION_SHORT>${row['Produktname'] || 'N/A'}</DESCRIPTION_SHORT>
        <DESCRIPTION_LONG>${row['Beschreibung'] || 'N/A'}</DESCRIPTION_LONG>
        <EAN>${row['EAN'] || ''}</EAN>
        <MANUFACTURER_NAME>${row['Hersteller'] || ''}</MANUFACTURER_NAME>
        <MANUFACTURER_AID>${row['Herstellernummer'] || ''}</MANUFACTURER_AID>
      </ARTICLE_DETAILS>
      <ARTICLE_PRICE_DETAILS>
        <ARTICLE_PRICE price_type="net_list">
          <PRICE_AMOUNT>${row['Preis'] || '0.00'}</PRICE_AMOUNT>
          <PRICE_CURRENCY>EUR</PRICE_CURRENCY>
          <TAX>0.19</TAX>
        </ARTICLE_PRICE>
      </ARTICLE_PRICE_DETAILS>
    </ARTICLE>`).join('\n')}
  </T_NEW_CATALOG>
</BMECAT>`;
    }
  };

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      setError(null);

      const xml = generateTestXml(csvData, headerInfo);
      setGeneratedXml(xml);
      setCurrentStep(3);
    } catch (e) {
      setError(`Fehler bei der BMEcat-Generierung: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadXml = () => {
    const blob = new Blob([generatedXml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${headerInfo.catalogName || 'bmecat'}_${headerInfo.format}.xml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-12">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/80 p-8">
              <h2 className="text-2xl font-bold text-slate-800 mb-6">Schritt 1: Format & Datei auswählen</h2>
              
              <FormatSelector 
                selectedFormat={headerInfo.format} 
                onFormatChange={handleFormatChange} 
              />
              
              <div className="mt-8">
                <FileUpload 
                  onFileLoaded={handleFileLoaded}
                  csvFileName={csvFileName}
                  onCsvFileRemoved={handleCsvFileRemoved}
                  onStructureLoaded={() => {}}
                  structureFileName={null}
                  onStructureRemoved={() => {}}
                  onTemplateLoaded={() => {}}
                  templateFileName={null}
                  onTemplateRemoved={() => {}}
                  onBsbFileLoaded={() => {}}
                  bsbFileName={null}
                  onBsbFileRemoved={() => {}}
                  uploadError={error}
                />
              </div>

              {csvData.length > 0 && (
                <div className="mt-8 p-6 bg-green-50 rounded-lg">
                  <h3 className="font-bold text-green-800 mb-2">CSV erfolgreich geladen!</h3>
                  <p className="text-green-700">
                    <strong>{csvData.length}</strong> Artikel aus <strong>{csvFileName}</strong> geladen
                  </p>
                  <p className="text-sm text-green-600 mt-2">
                    Spalten: {csvHeaders.join(', ')}
                  </p>
                </div>
              )}
              
              {csvData.length > 0 && (
                <div className="flex justify-end mt-8">
                  <button
                    onClick={handleNextStep}
                    className="flex justify-center items-center px-10 py-3 text-base font-semibold text-white rounded-xl transition-all shadow-lg hover:shadow-2xl transform hover:-translate-y-1 bg-gradient-to-br from-indigo-600 to-sky-500 hover:from-indigo-700 hover:to-sky-600"
                  >
                    Weiter zu Schritt 2
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-10">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/80 p-8">
              <h2 className="text-2xl font-bold text-slate-800 mb-6">Schritt 2: Katalog-Informationen</h2>
              <HeaderForm headerInfo={headerInfo} setHeaderInfo={setHeaderInfo} />
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/80 p-8">
              <h3 className="text-xl font-bold text-slate-800 mb-4">Vorschau der Artikel</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      {csvHeaders.slice(0, 4).map(header => (
                        <th key={header} className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {csvData.slice(0, 3).map((row, index) => (
                      <tr key={index}>
                        {csvHeaders.slice(0, 4).map(header => (
                          <td key={header} className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                            {row[header] || '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {csvData.length > 3 && (
                  <p className="text-sm text-slate-500 mt-2">... und {csvData.length - 3} weitere Artikel</p>
                )}
              </div>
            </div>

            <div className="flex justify-between items-center mt-8">
              <button
                onClick={handlePrevStep}
                className="px-8 py-3 text-base font-semibold text-slate-700 bg-white rounded-xl hover:bg-slate-100 transition-colors shadow-lg border border-slate-200/80 hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Zurück
              </button>
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="flex justify-center items-center px-10 py-3 text-base font-semibold text-white rounded-xl transition-all shadow-lg hover:shadow-2xl transform hover:-translate-y-1 bg-gradient-to-br from-indigo-600 to-sky-500 hover:from-indigo-700 hover:to-sky-600 w-80 disabled:bg-slate-400 disabled:shadow-none disabled:transform-none disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>BMEcat wird generiert...</span>
                  </>
                ) : (
                  <>
                    <SparklesIcon className="w-5 h-5 mr-2" />
                    BMEcat {headerInfo.format} generieren
                  </>
                )}
              </button>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-10">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/80 p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800">BMECat {headerInfo.format} erfolgreich generiert!</h2>
                <button
                  onClick={downloadXml}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
                >
                  XML herunterladen
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-slate-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-slate-800">Format</h4>
                  <p className="text-slate-600">BMECat {headerInfo.format}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-slate-800">Artikel</h4>
                  <p className="text-slate-600">{csvData.length} Artikel</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-slate-800">Größe</h4>
                  <p className="text-slate-600">{(generatedXml.length / 1024).toFixed(2)} KB</p>
                </div>
              </div>
              
              <div className="bg-slate-900 rounded-lg p-4 overflow-auto max-h-96">
                <pre className="text-green-400 text-sm font-mono whitespace-pre-wrap">
                  {generatedXml.substring(0, 2000)}
                  {generatedXml.length > 2000 && '\n... (gekürzt für Anzeige)'}
                </pre>
              </div>
            </div>

            <div className="flex justify-between items-center mt-8">
              <button
                onClick={handlePrevStep}
                className="px-8 py-3 text-base font-semibold text-slate-700 bg-white rounded-xl hover:bg-slate-100 transition-colors shadow-lg border border-slate-200/80 hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Zurück
              </button>
              <button
                onClick={() => {
                  setCurrentStep(1);
                  setCsvData([]);
                  setCsvHeaders([]);
                  setCsvFileName(null);
                  setGeneratedXml('');
                  setError(null);
                }}
                className="flex justify-center items-center px-10 py-3 text-base font-semibold text-white rounded-xl transition-all shadow-lg hover:shadow-2xl transform hover:-translate-y-1 bg-gradient-to-br from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600"
              >
                <ArrowPathIcon className="w-5 h-5 mr-2" />
                Neuen Katalog erstellen
              </button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200/80 sticky top-0 z-50">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <h1 className="text-2xl font-bold text-slate-800 flex items-center">
              <SparklesIcon className="w-8 h-8 mr-3 text-transparent bg-clip-text bg-gradient-to-tr from-indigo-500 to-sky-500" />
              <span>Hollys BMEcat AI Konverter - Vollständiger Workflow</span>
            </h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-5xl w-full px-4 sm:px-6 lg:px-8 py-10 flex-grow">
        <div className="py-12">
          <StepIndicator currentStep={currentStep} />
        </div>
        
        {error && (
          <div className="mb-8 p-6 bg-red-50/80 backdrop-blur-sm border border-red-200/80 rounded-2xl shadow-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Fehler</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8">
          {renderStepContent()}
        </div>
      </main>
      
      <footer className="text-center py-8 text-slate-500 text-sm border-t border-slate-200/80 bg-white/60 backdrop-blur-sm mt-16">
        <p>Vollständiger Workflow Test - Geführte Konvertierung für perfekte BMEcat-Dateien mit KI-Unterstützung.</p>
        <p className="mt-1 text-xs text-slate-400">Powered by Gemini AI</p>
      </footer>
    </div>
  );
}