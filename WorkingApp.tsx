import React, { useState, useCallback } from 'react';
import { FileUpload } from './components/FileUpload';
import { HeaderForm } from './components/HeaderForm';
import { MappingTable } from './components/MappingTable';
import { OutputDisplay } from './components/OutputDisplay';
import { StepIndicator } from './components/StepIndicator';
import { UserGuide } from './components/UserGuide';
import { SpecificationManager } from './components/SpecificationManager';
import { FormatSelector } from './components/FormatSelector';
import { MappingSummary } from './components/MappingSummary';
import { parseCsv, parseStructureCsv } from './services/csvParser';
import { generateBmecat } from './services/bmecatGenerator';
import { transformCsvData } from './services/dataTransformer';
import { BmecatHeaderInfo, Mapping, ParsedCsvRow, BMECAT_FIELDS, BmecatFieldKey, ParsedStructureRow, StoredSpecification, FeatureMapping, BmecatFormat } from './types';
import { ArrowPathIcon, SparklesIcon } from './components/Icons';

/**
 * Checks for characters that are invalid in XML, as BMEcat is an XML format.
 */
const findInvalidXmlCharacters = (data: (ParsedCsvRow | ParsedStructureRow)[], headers: string[]): string | null => {
  const invalidXmlCharsRegex = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g;

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    for (const header of headers) {
      const value = row[header];
      if (typeof value === 'string' && invalidXmlCharsRegex.test(value)) {
        const invalidChar = value.match(invalidXmlCharsRegex)?.[0];
        const charCode = invalidChar?.charCodeAt(0);
        return `Ungültiges Zeichen in Zeile ${i + 2}, Spalte "${header}": Zeichen mit Code ${charCode} (${invalidChar ? `"${invalidChar}"` : 'unbekannt'}) ist in XML nicht erlaubt.`;
      }
    }
  }
  return null;
};

export default function WorkingApp() {
  // Basic state
  const [currentStep, setCurrentStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Format and specification state
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

  // File and data state
  const [csvData, setCsvData] = useState<ParsedCsvRow[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvFileName, setCsvFileName] = useState<string | null>(null);
  const [structureData, setStructureData] = useState<ParsedStructureRow[]>([]);
  const [structureFileName, setStructureFileName] = useState<string | null>(null);
  const [templateFileName, setTemplateFileName] = useState<string | null>(null);
  const [bmecatTemplate, setBmecatTemplate] = useState<string | null>(null);
  const [bsbFileName, setBsbFileName] = useState<string | null>(null);
  const [bsbFileContent, setBsbFileContent] = useState<string | null>(null);

  // Mapping state
  const [mapping, setMapping] = useState<Mapping>({});
  const [featureMappings, setFeatureMappings] = useState<FeatureMapping[]>([]);
  const [generatedXml, setGeneratedXml] = useState<string>('');

  // Event handlers
  const handleFormatChange = (format: BmecatFormat) => {
    setHeaderInfo(prev => ({ ...prev, format }));
  };

  const handleSpecChange = (spec: StoredSpecification | null) => {
    setSelectedSpecification(spec);
  };

  const handleFileLoaded = useCallback((content: string, name: string) => {
    try {
      setError(null);
      const { data, headers } = parseCsv(content);
      
      const invalidCharError = findInvalidXmlCharacters(data, headers);
      if (invalidCharError) {
        setError(invalidCharError);
        return;
      }

      setCsvData(data);
      setCsvHeaders(headers);
      setCsvFileName(name);
      
      // Reset mapping when new file is loaded
      setMapping({});
      setFeatureMappings([]);
    } catch (err) {
      setError(`Fehler beim Laden der Artikel-CSV: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, []);

  const handleCsvFileRemoved = useCallback(() => {
    setCsvData([]);
    setCsvHeaders([]);
    setCsvFileName(null);
    setMapping({});
    setFeatureMappings([]);
    setError(null);
  }, []);

  const handleStructureLoaded = useCallback((content: string, name: string) => {
    try {
      setError(null);
      const { data } = parseStructureCsv(content);
      setStructureData(data);
      setStructureFileName(name);
    } catch (err) {
      setError(`Fehler beim Laden der Struktur-CSV: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, []);

  const handleStructureRemoved = useCallback(() => {
    setStructureData([]);
    setStructureFileName(null);
  }, []);

  const handleTemplateLoaded = useCallback((content: string, name: string) => {
    setBmecatTemplate(content);
    setTemplateFileName(name);
  }, []);

  const handleTemplateRemoved = useCallback(() => {
    setBmecatTemplate(null);
    setTemplateFileName(null);
  }, []);

  const handleBsbFileLoaded = useCallback((content: string, name: string) => {
    setBsbFileContent(content);
    setBsbFileName(name);
  }, []);

  const handleBsbFileRemoved = useCallback(() => {
    setBsbFileContent(null);
    setBsbFileName(null);
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

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      setError(null);

      const transformedData = transformCsvData(csvData, mapping, featureMappings, structureData);
      const xml = await generateBmecat(transformedData, headerInfo, selectedSpecification, bmecatTemplate);
      
      setGeneratedXml(xml);
      setCurrentStep(3);
    } catch (e) {
      setError(`Fehler bei der BMEcat-Generierung: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setIsGenerating(false);
    }
  };
  
  const isUploadError = error && (error.includes('Artikel-CSV') || error.includes('Struktur-CSV') || error.includes('UTF-8'));

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-12">
            <UserGuide />
            <FormatSelector 
              selectedFormat={headerInfo.format} 
              onFormatChange={handleFormatChange} 
            />
            <SpecificationManager onSpecChange={handleSpecChange} initialSpec={selectedSpecification} />
            <FileUpload 
              onFileLoaded={handleFileLoaded}
              csvFileName={csvFileName}
              onCsvFileRemoved={handleCsvFileRemoved}
              
              onStructureLoaded={handleStructureLoaded}
              structureFileName={structureFileName}
              onStructureRemoved={handleStructureRemoved}
              
              onTemplateLoaded={handleTemplateLoaded}
              templateFileName={templateFileName}
              onTemplateRemoved={handleTemplateRemoved}

              onBsbFileLoaded={handleBsbFileLoaded}
              bsbFileName={bsbFileName}
              onBsbFileRemoved={handleBsbFileRemoved}

              uploadError={isUploadError ? error : null}
            />
             {csvData.length > 0 && (
                <div className="flex justify-end mt-8">
                  <button
                    onClick={handleNextStep}
                    disabled={csvData.length === 0}
                    className="flex justify-center items-center px-10 py-3 text-base font-semibold text-white rounded-xl transition-all shadow-lg hover:shadow-2xl transform hover:-translate-y-1 bg-gradient-to-br from-indigo-600 to-sky-500 hover:from-indigo-700 hover:to-sky-600 disabled:bg-slate-400 disabled:shadow-none disabled:transform-none disabled:cursor-not-allowed"
                  >
                    Weiter
                  </button>
                </div>
              )}
          </div>
        );
      case 2:
        return (
          <div className="space-y-10">
            <HeaderForm headerInfo={headerInfo} setHeaderInfo={setHeaderInfo} />
            <MappingTable 
              csvHeaders={csvHeaders} 
              mapping={mapping} 
              setMapping={setMapping} 
              setError={setError}
              featureMappings={featureMappings}
              setFeatureMappings={setFeatureMappings}
              selectedSpecification={selectedSpecification}
              bsbFileContent={bsbFileContent}
              bmecatTemplate={bmecatTemplate}
            />
            <MappingSummary mapping={mapping} featureMappings={featureMappings} />
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
                    BMEcat generieren
                    </>
                  )}
              </button>
            </div>
          </div>
        );
      case 3:
        return (
            <>
                <OutputDisplay xml={generatedXml} catalogName={headerInfo.catalogName} />
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
                            setStructureData([]);
                            setStructureFileName(null);
                            setTemplateFileName(null);
                            setBmecatTemplate(null);
                            setBsbFileName(null);
                            setBsbFileContent(null);
                            setMapping({});
                            setFeatureMappings([]);
                            setGeneratedXml('');
                            setError(null);
                        }}
                        className="flex justify-center items-center px-10 py-3 text-base font-semibold text-white rounded-xl transition-all shadow-lg hover:shadow-2xl transform hover:-translate-y-1 bg-gradient-to-br from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600"
                    >
                        <ArrowPathIcon className="w-5 h-5 mr-2" />
                        Neuen Katalog erstellen
                    </button>
                </div>
            </>
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
              <span>Hollys BMEcat AI Konverter</span>
            </h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-5xl w-full px-4 sm:px-6 lg:px-8 py-10 flex-grow">
        <div className="py-12">
          <StepIndicator currentStep={currentStep} />
        </div>
        
        {error && !isUploadError && (
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
        <p>Geführte Konvertierung für perfekte BMEcat-Dateien mit KI-Unterstützung.</p>
        <p className="mt-1 text-xs text-slate-400">Powered by Gemini AI</p>
      </footer>
    </div>
  );
}