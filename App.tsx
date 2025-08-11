
import React, { useState, useCallback } from 'react';
import { FileUpload } from './components/FileUpload';
import { HeaderForm } from './components/HeaderForm';
import { MappingTable } from './components/MappingTable';
import { OutputDisplay } from './components/OutputDisplay';
import { StepIndicator } from './components/StepIndicator';
import { UserGuide } from './components/UserGuide';
import { SpecificationManager } from './components/SpecificationManager';
import { parseCsv, parseStructureCsv } from './services/csvParser';
import { generateBmecat } from './services/bmecatGenerator';
import { transformCsvData } from './services/dataTransformer';
import { BmecatHeaderInfo, Mapping, ParsedCsvRow, BMECAT_FIELDS, BmecatFieldKey, ParsedStructureRow, StoredSpecification, FeatureMapping } from './types';
import { ArrowPathIcon, SparklesIcon } from './components/Icons';
import { MappingSummary } from './components/MappingSummary';

/**
 * Checks for characters that are invalid in XML, as BMEcat is an XML format.
 * This prevents parser errors during the final generation stage.
 * @param data The parsed CSV data rows.
 * @param headers The headers of the CSV file.
 * @returns An error message string if invalid characters are found, otherwise null.
 */
const findInvalidXmlCharacters = (data: (ParsedCsvRow | ParsedStructureRow)[], headers: string[]): string | null => {
    // XML 1.0 spec allows: #x9 | #xA | #xD | [#x20-#xD7FF] | [#xE000-#xFFFD] | [#x10000-#x10FFFF]
    // This regex matches characters *not* in the allowed range (i.e., invalid control characters).
    const invalidXmlCharsRegex = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g;

    for (let i = 0; i < data.length; i++) {
        const row = data[i];
        for (const header of headers) {
            const value = row[header as keyof typeof row];
            if (typeof value === 'string' && invalidXmlCharsRegex.test(value)) {
                // Return a user-friendly error message with the exact location of the issue.
                return `Ungültige Zeichen gefunden. BMEcat verbietet bestimmte unsichtbare Steuerzeichen. Fehler in Zeile ${i + 2} in der Spalte "${header}". Bitte bereinigen Sie die Quelldatei.`;
            }
        }
    }
    return null; // No invalid characters found
};

export default function App() {
  const [currentStep, setCurrentStep] = useState(1);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvData, setCsvData] = useState<ParsedCsvRow[]>([]);
  const [csvFileName, setCsvFileName] = useState<string | null>(null);
  const [structureData, setStructureData] = useState<ParsedStructureRow[]>([]);
  const [structureFileName, setStructureFileName] = useState<string | null>(null);
  const [selectedSpecification, setSelectedSpecification] = useState<StoredSpecification | null>(null);
  const [mapping, setMapping] = useState<Mapping>({});
  const [featureMappings, setFeatureMappings] = useState<FeatureMapping[]>([]);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [bmecatTemplate, setBmecatTemplate] = useState<string | null>(null);
  const [templateFileName, setTemplateFileName] = useState<string | null>(null);
  const [bsbFileContent, setBsbFileContent] = useState<string | null>(null);
  const [bsbFileName, setBsbFileName] = useState<string | null>(null);
  const [headerInfo, setHeaderInfo] = useState<BmecatHeaderInfo>({
    catalogId: 'KATALOG_01',
    catalogVersion: '1.0',
    catalogName: 'Mein Produktkatalog',
    supplierName: 'Meine Firma GmbH',
    territory: 'DE',
    currency: 'EUR',
    supplierStreet: 'Musterstraße 1',
    supplierZip: '12345',
    supplierCity: 'Musterstadt',
    supplierCountry: 'DE',
    supplierEmail: 'info@meinefirma.de',
    supplierUrl: 'https://www.meinefirma.de',
  });
  const [generatedXml, setGeneratedXml] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const resetState = (keepTemplate = false, keepStructure = false) => {
    setCsvHeaders([]);
    setCsvData([]);
    setCsvFileName(null);
    setMapping({});
    setFeatureMappings([]);
    setGeneratedXml('');
    setError(null);
    setIsGenerating(false);
    if (!keepTemplate) {
      setBmecatTemplate(null);
      setTemplateFileName(null);
    }
    if (!keepStructure) {
      setStructureData([]);
      setStructureFileName(null);
    }
    setBsbFileContent(null);
    setBsbFileName(null);
    // The selected specification is intentionally NOT reset here, to allow reuse.
  };

  const handleStartOver = () => {
    resetState(false, false);
    setSelectedSpecification(null); // Explicitly reset selected spec for a full restart
    setCurrentStep(1);
  };
  
  const handleNextStep = () => setCurrentStep(prev => prev + 1);
  const handlePrevStep = () => setCurrentStep(prev => prev - 1);


  const handleFileLoaded = useCallback(async (content: string, fileName: string) => {
    setError(null);
    // UTF-8 encoding check
    if (content.includes('\uFFFD')) {
        setError(`Die Datei '${fileName}' scheint nicht UTF-8-kodiert zu sein. Dies kann zu Anzeigefehlern bei Sonderzeichen (z.B. Umlaute) führen. Bitte speichern Sie die Datei in Ihrem Programm (z.B. Excel) explizit mit der Kodierung "UTF-8" und versuchen Sie es erneut.`);
        setCsvHeaders([]);
        setCsvData([]);
        setCsvFileName(null);
        return;
    }

    try {
      const { headers, data } = parseCsv(content);
      if (headers.length === 0 || data.length === 0) {
        throw new Error('Die Datei ist leer oder hat keine Kopfzeile.');
      }

      // BMEcat/XML character validation
      const validationError = findInvalidXmlCharacters(data, headers);
      if (validationError) {
          setError(`In der Artikel-CSV '${fileName}': ${validationError}`);
          setCsvHeaders([]);
          setCsvData([]);
          setCsvFileName(null);
          return;
      }

      setCsvHeaders(headers);
      setCsvData(data);
      setCsvFileName(fileName);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      setError(`Fehler beim Verarbeiten der Artikel-CSV: ${errorMessage}`);
      setCsvHeaders([]);
      setCsvData([]);
      setCsvFileName(null);
    }
  }, []);
  
  const handleStructureLoaded = useCallback(async (content: string, fileName: string) => {
    setError(null);
    // UTF-8 encoding check
    if (content.includes('\uFFFD')) {
        setError(`Die Datei '${fileName}' scheint nicht UTF-8-kodiert zu sein. Dies kann zu Anzeigefehlern bei Sonderzeichen (z.B. Umlaute) führen. Bitte speichern Sie die Datei in Ihrem Programm (z.B. Excel) explizit mit der Kodierung "UTF-8" und versuchen Sie es erneut.`);
        setStructureData([]);
        setStructureFileName(null);
        return;
    }

    try {
      const { data } = parseStructureCsv(content);
      if (data.length === 0) {
        throw new Error('Die Datei ist leer.');
      }
      
      // BMEcat/XML character validation
      const validationError = findInvalidXmlCharacters(data, ['GROUP_ID', 'GROUP_NAME', 'PARENT_ID']);
      if (validationError) {
          setError(`In der Struktur-CSV '${fileName}': ${validationError}`);
          setStructureData([]);
          setStructureFileName(null);
          return;
      }

      setStructureData(data);
      setStructureFileName(fileName);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      setError(`Fehler beim Verarbeiten der Struktur-CSV: ${errorMessage}`);
      setStructureData([]);
      setStructureFileName(null);
    }
  }, []);

  const handleSpecChange = useCallback((spec: StoredSpecification | null) => {
    setSelectedSpecification(spec);
    setError(null);
  }, []);

  const handleCsvFileRemoved = useCallback(() => {
    setCsvHeaders([]);
    setCsvData([]);
    setCsvFileName(null);
    setMapping({});
    setFeatureMappings([]);
    setError(null);
  }, []);

  const handleStructureRemoved = useCallback(() => {
    setStructureData([]);
    setStructureFileName(null);
    const newMapping = { ...mapping };
    delete newMapping.CATALOG_GROUP_ID;
    setMapping(newMapping);
    setError(null);
  }, [mapping]);
  
  const handleTemplateLoaded = useCallback((content: string, fileName: string) => {
    setError(null);
    setBmecatTemplate(content);
    setTemplateFileName(fileName);
  }, []);
  
  const handleTemplateRemoved = useCallback(() => {
    setBmecatTemplate(null);
    setTemplateFileName(null);
  }, []);

  const handleBsbFileLoaded = useCallback((content: string, fileName: string) => {
    setError(null);
    setBsbFileContent(content);
    setBsbFileName(fileName);
  }, []);

  const handleBsbFileRemoved = useCallback(() => {
    setBsbFileContent(null);
    setBsbFileName(null);
  }, []);

  const handleGenerate = async () => {
    setError(null);
    const requiredFields: BmecatFieldKey[] = BMECAT_FIELDS.filter(f => f.required).map(f => f.key);
    const missingMappings = requiredFields.filter(f => !mapping[f] || mapping[f] === '');

    if (missingMappings.length > 0) {
      const missingLabels = missingMappings.map(f => BMECAT_FIELDS.find(bf => bf.key === f)?.label || f);
      setError(`Bitte ordnen Sie alle erforderlichen Felder (*) zu. Es fehlen: ${missingLabels.join(', ')}.`);
      return;
    }
      
    try {
      setIsGenerating(true);
      const transformedData = transformCsvData(csvData, mapping, featureMappings);
      const pdfSpecForGeneration = selectedSpecification ? selectedSpecification.base64Content : null;
      const xml = await generateBmecat(headerInfo, transformedData, bmecatTemplate, structureData, pdfSpecForGeneration, bsbFileContent);
      setGeneratedXml(xml);
      handleNextStep();
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
                <div className="flex justify-center mt-12">
                    <button
                      onClick={handleStartOver}
                      className="flex items-center px-8 py-3 bg-white text-slate-800 rounded-xl hover:bg-slate-100 transition-colors text-base font-semibold shadow-lg hover:shadow-xl border border-slate-200/80 transform hover:-translate-y-0.5"
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
    <div className="flex flex-col flex-grow">
      <header className="bg-white/90 backdrop-blur-lg sticky top-0 z-20 border-b border-slate-200/80">
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
        {error && !isUploadError && (
          <div className="bg-red-50 border-l-4 border-red-400 text-red-800 p-4 mb-8 rounded-r-lg shadow-md" role="alert"
            onClick={() => setError(null)}
          >
            <p className="font-bold text-red-900">Ein Fehler ist aufgetreten</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        <div className="py-12">
            <StepIndicator currentStep={currentStep} />
        </div>
        
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
