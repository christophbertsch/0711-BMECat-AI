import React, { useState } from 'react';
import { FormatSelector } from './components/FormatSelector';
import { UserGuide } from './components/UserGuide';
import { SpecificationManager } from './components/SpecificationManager';
import { BmecatFormat, BmecatHeaderInfo, StoredSpecification } from './types';
import { SparklesIcon } from './components/Icons';
import { generateBmecat } from './services/bmecatGenerator';

export default function TestWorkflow() {
  const [selectedSpecification, setSelectedSpecification] = useState<StoredSpecification | null>(null);
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

  const [generatedXml, setGeneratedXml] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleFormatChange = (format: BmecatFormat) => {
    setHeaderInfo(prev => ({ ...prev, format }));
  };

  const handleSpecChange = (spec: StoredSpecification | null) => {
    setSelectedSpecification(spec);
  };

  const handleTestGeneration = async () => {
    try {
      setIsGenerating(true);
      
      // Create test data
      const testData = [
        {
          SUPPLIER_AID: 'TEST-001',
          ARTICLE_DETAILS: {
            DESCRIPTION_SHORT: 'Test Artikel 1',
            DESCRIPTION_LONG: 'Dies ist ein Test Artikel für BMECat Export',
            EAN: '1234567890123',
            SUPPLIER_ALT_AID: 'ALT-001',
            BUYER_AID: 'BUYER-001',
            MANUFACTURER_AID: 'MFG-001',
            MANUFACTURER_NAME: 'Test Hersteller',
            DELIVERY_TIME: '5',
            SPECIAL_TREATMENT_CLASS: {
              TYPE: 'GGVS',
              VALUE: 'Nein'
            },
            KEYWORD: ['Test', 'Artikel', 'BMECat'],
            REMARKS: 'Test Bemerkung',
            SEGMENT: 'Test Segment',
            ARTICLE_ORDER: '1',
            ARTICLE_STATUS: {
              TYPE: 'core',
              VALUE: 'new'
            }
          },
          ARTICLE_FEATURES: [
            {
              FNAME: 'Farbe',
              FVALUE: 'Blau',
              FUNIT: '',
              FORDER: '1'
            },
            {
              FNAME: 'Material',
              FVALUE: 'Kunststoff',
              FUNIT: '',
              FORDER: '2'
            }
          ],
          ARTICLE_PRICE_DETAILS: [
            {
              DATETIME: {
                TYPE: 'valid_start_date',
                VALUE: new Date().toISOString().split('T')[0]
              },
              DAILY_PRICE: true,
              ARTICLE_PRICE: [
                {
                  PRICE_AMOUNT: '19.99',
                  PRICE_CURRENCY: 'EUR',
                  TAX: '0.19',
                  PRICE_FACTOR: '1',
                  LOWER_BOUND: '1'
                }
              ]
            }
          ],
          MIME_INFO: [
            {
              MIME_TYPE: 'image/jpeg',
              MIME_SOURCE: 'https://example.com/image1.jpg',
              MIME_DESCR: 'Produktbild',
              MIME_ALT: 'Test Artikel Bild',
              MIME_PURPOSE: 'normal'
            }
          ]
        }
      ];

      const xml = await generateBmecat(testData, headerInfo, selectedSpecification, null);
      setGeneratedXml(xml);
    } catch (e) {
      console.error('Generation error:', e);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200/80 sticky top-0 z-50">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <h1 className="text-2xl font-bold text-slate-800 flex items-center">
              <SparklesIcon className="w-8 h-8 mr-3 text-transparent bg-clip-text bg-gradient-to-tr from-indigo-500 to-sky-500" />
              <span>Hollys BMEcat AI Konverter - Test Workflow</span>
            </h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-5xl w-full px-4 sm:px-6 lg:px-8 py-10 flex-grow">
        <div className="mt-8">
          <div className="space-y-12">
            <UserGuide />
            
            <FormatSelector 
              selectedFormat={headerInfo.format} 
              onFormatChange={handleFormatChange} 
            />
            
            <SpecificationManager onSpecChange={handleSpecChange} initialSpec={selectedSpecification} />
            
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/80 p-8">
              <h3 className="text-xl font-bold text-slate-800 mb-4">Test BMECat Generation</h3>
              <p className="text-slate-600 mb-6">
                Testen Sie die BMECat-Generierung mit Beispieldaten für das gewählte Format: <strong>{headerInfo.format}</strong>
              </p>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Katalog ID</label>
                    <input
                      type="text"
                      value={headerInfo.catalogId}
                      onChange={(e) => setHeaderInfo(prev => ({ ...prev, catalogId: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Katalog Name</label>
                    <input
                      type="text"
                      value={headerInfo.catalogName}
                      onChange={(e) => setHeaderInfo(prev => ({ ...prev, catalogName: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Version</label>
                    <input
                      type="text"
                      value={headerInfo.catalogVersion}
                      onChange={(e) => setHeaderInfo(prev => ({ ...prev, catalogVersion: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Lieferant</label>
                    <input
                      type="text"
                      value={headerInfo.supplierName}
                      onChange={(e) => setHeaderInfo(prev => ({ ...prev, supplierName: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>

                {headerInfo.format === '2005' && (
                  <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Sprache</label>
                      <select
                        value={headerInfo.language}
                        onChange={(e) => setHeaderInfo(prev => ({ ...prev, language: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="de">Deutsch</option>
                        <option value="en">English</option>
                        <option value="fr">Français</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Edition</label>
                      <input
                        type="text"
                        value={headerInfo.edition}
                        onChange={(e) => setHeaderInfo(prev => ({ ...prev, edition: e.target.value }))}
                        placeholder="z.B. 2005.1"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  </div>
                )}
                
                <div className="flex justify-center mt-8">
                  <button
                    onClick={handleTestGeneration}
                    disabled={isGenerating}
                    className="flex justify-center items-center px-10 py-3 text-base font-semibold text-white rounded-xl transition-all shadow-lg hover:shadow-2xl transform hover:-translate-y-1 bg-gradient-to-br from-indigo-600 to-sky-500 hover:from-indigo-700 hover:to-sky-600 disabled:bg-slate-400 disabled:shadow-none disabled:transform-none disabled:cursor-not-allowed"
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
                        Test BMEcat {headerInfo.format} generieren
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {generatedXml && (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/80 p-8">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-slate-800">Generierte BMECat {headerInfo.format} XML</h3>
                  <button
                    onClick={downloadXml}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    XML herunterladen
                  </button>
                </div>
                <div className="bg-slate-900 rounded-lg p-4 overflow-auto max-h-96">
                  <pre className="text-green-400 text-sm font-mono whitespace-pre-wrap">
                    {generatedXml.substring(0, 2000)}
                    {generatedXml.length > 2000 && '\n... (gekürzt)'}
                  </pre>
                </div>
                <div className="mt-4 text-sm text-slate-600">
                  <p>XML-Größe: {(generatedXml.length / 1024).toFixed(2)} KB</p>
                  <p>Format: BMECat {headerInfo.format}</p>
                  <p>Artikel: 1 Testartikel</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      
      <footer className="text-center py-8 text-slate-500 text-sm border-t border-slate-200/80 bg-white/60 backdrop-blur-sm mt-16">
        <p>Test Workflow - Geführte Konvertierung für perfekte BMEcat-Dateien mit KI-Unterstützung.</p>
        <p className="mt-1 text-xs text-slate-400">Powered by Gemini AI</p>
      </footer>
    </div>
  );
}