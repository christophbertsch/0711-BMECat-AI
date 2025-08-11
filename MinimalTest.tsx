import React, { useState } from 'react';
import { FormatSelector } from './components/FormatSelector';
import { BmecatFormat } from './types';
import { SparklesIcon } from './components/Icons';

export default function MinimalTest() {
  const [selectedFormat, setSelectedFormat] = useState<BmecatFormat>('1.2');

  const handleTestGeneration = () => {
    // Simple test generation without complex services
    const testXml = selectedFormat === '1.2' 
      ? `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE BMECAT SYSTEM "bmecat_new_catalog.dtd">
<BMECAT version="1.2" xmlns="http://www.bmecat.org/bmecat/1.2/bmecat_new_catalog">
  <HEADER>
    <CATALOG>
      <LANGUAGE>de</LANGUAGE>
      <CATALOG_ID>TEST-001</CATALOG_ID>
      <CATALOG_VERSION>1.0</CATALOG_VERSION>
      <CATALOG_NAME>Test Katalog BMECat 1.2</CATALOG_NAME>
      <GENERATION_DATE>2025-01-11T10:55:00</GENERATION_DATE>
    </CATALOG>
    <SUPPLIER>
      <SUPPLIER_NAME>Test Supplier</SUPPLIER_NAME>
    </SUPPLIER>
  </HEADER>
  <T_NEW_CATALOG>
    <ARTICLE>
      <SUPPLIER_AID>TEST-001</SUPPLIER_AID>
      <ARTICLE_DETAILS>
        <DESCRIPTION_SHORT>Test Artikel</DESCRIPTION_SHORT>
        <DESCRIPTION_LONG>Dies ist ein Test Artikel für BMECat 1.2</DESCRIPTION_LONG>
      </ARTICLE_DETAILS>
      <ARTICLE_PRICE_DETAILS>
        <ARTICLE_PRICE price_type="net_list">
          <PRICE_AMOUNT>19.99</PRICE_AMOUNT>
          <PRICE_CURRENCY>EUR</PRICE_CURRENCY>
          <TAX>0.19</TAX>
        </ARTICLE_PRICE>
      </ARTICLE_PRICE_DETAILS>
    </ARTICLE>
  </T_NEW_CATALOG>
</BMECAT>`
      : `<?xml version="1.0" encoding="UTF-8"?>
<BMECAT version="2005" xmlns="http://www.bmecat.org/bmecat/2005">
  <HEADER>
    <CATALOG>
      <LANGUAGE>de</LANGUAGE>
      <CATALOG_ID>TEST-001</CATALOG_ID>
      <CATALOG_VERSION>1.0</CATALOG_VERSION>
      <CATALOG_NAME>Test Katalog BMECat 2005</CATALOG_NAME>
      <GENERATION_DATE>2025-01-11T10:55:00</GENERATION_DATE>
    </CATALOG>
    <SUPPLIER>
      <SUPPLIER_NAME>Test Supplier</SUPPLIER_NAME>
    </SUPPLIER>
  </HEADER>
  <T_NEW_CATALOG>
    <ARTICLE>
      <SUPPLIER_AID>TEST-001</SUPPLIER_AID>
      <ARTICLE_DETAILS>
        <DESCRIPTION_SHORT>Test Artikel</DESCRIPTION_SHORT>
        <DESCRIPTION_LONG>Dies ist ein Test Artikel für BMECat 2005</DESCRIPTION_LONG>
      </ARTICLE_DETAILS>
      <ARTICLE_PRICE_DETAILS>
        <ARTICLE_PRICE price_type="net_list">
          <PRICE_AMOUNT>19.99</PRICE_AMOUNT>
          <PRICE_CURRENCY>EUR</PRICE_CURRENCY>
          <TAX>0.19</TAX>
        </ARTICLE_PRICE>
      </ARTICLE_PRICE_DETAILS>
    </ARTICLE>
  </T_NEW_CATALOG>
</BMECAT>`;

    // Download the XML
    const blob = new Blob([testXml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `test_bmecat_${selectedFormat}.xml`;
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
              <span>Hollys BMEcat AI Konverter - Format Test</span>
            </h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-5xl w-full px-4 sm:px-6 lg:px-8 py-10 flex-grow">
        <div className="mt-8">
          <div className="space-y-12">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/80 p-8">
              <h2 className="text-2xl font-bold text-slate-800 mb-6">Format Selection Test</h2>
              <p className="text-slate-600 mb-8">
                Wählen Sie ein BMECat-Format und testen Sie die Generierung:
              </p>
              
              <FormatSelector 
                selectedFormat={selectedFormat} 
                onFormatChange={setSelectedFormat} 
              />
              
              <div className="mt-8 p-6 bg-slate-50 rounded-lg">
                <h3 className="font-bold text-slate-800 mb-4">Aktuell gewähltes Format:</h3>
                <div className="text-lg font-semibold text-indigo-600">
                  BMECat {selectedFormat}
                </div>
                <div className="mt-4 text-sm text-slate-600">
                  {selectedFormat === '1.2' 
                    ? 'BMECat 1.2 ist der bewährte Standard für elektronische Kataloge.'
                    : 'BMECat 2005 bietet erweiterte Funktionen und verbesserte Strukturierung.'
                  }
                </div>
              </div>
              
              <div className="flex justify-center mt-8">
                <button
                  onClick={handleTestGeneration}
                  className="flex justify-center items-center px-10 py-3 text-base font-semibold text-white rounded-xl transition-all shadow-lg hover:shadow-2xl transform hover:-translate-y-1 bg-gradient-to-br from-indigo-600 to-sky-500 hover:from-indigo-700 hover:to-sky-600"
                >
                  <SparklesIcon className="w-5 h-5 mr-2" />
                  Test BMECat {selectedFormat} herunterladen
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <footer className="text-center py-8 text-slate-500 text-sm border-t border-slate-200/80 bg-white/60 backdrop-blur-sm mt-16">
        <p>Format Test - Geführte Konvertierung für perfekte BMEcat-Dateien mit KI-Unterstützung.</p>
        <p className="mt-1 text-xs text-slate-400">Powered by Gemini AI</p>
      </footer>
    </div>
  );
}