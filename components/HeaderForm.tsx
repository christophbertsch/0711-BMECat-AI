import React from 'react';
import { BmecatHeaderInfo } from '../types';
import { InformationCircleIcon } from './Icons';

interface HeaderFormProps {
  headerInfo: BmecatHeaderInfo;
  setHeaderInfo: React.Dispatch<React.SetStateAction<BmecatHeaderInfo>>;
}

const InputField: React.FC<{
  id: keyof BmecatHeaderInfo;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  containerClassName?: string;
  optional?: boolean;
}> = ({ id, label, value, onChange, placeholder, containerClassName = '', optional = false }) => (
  <div className={containerClassName}>
    <label htmlFor={id} className="block text-sm font-semibold text-slate-700">
      {label} {optional && <span className="text-slate-400 font-normal">(optional)</span>}
    </label>
    <input
      type="text"
      name={id}
      id={id}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="mt-2 block w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-shadow"
    />
  </div>
);

const SelectField: React.FC<{
  id: keyof BmecatHeaderInfo;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: { value: string; label: string }[];
  containerClassName?: string;
  optional?: boolean;
}> = ({ id, label, value, onChange, options, containerClassName = '', optional = false }) => (
  <div className={containerClassName}>
    <label htmlFor={id} className="block text-sm font-semibold text-slate-700">
      {label} {optional && <span className="text-slate-400 font-normal">(optional)</span>}
    </label>
    <select
      name={id}
      id={id}
      value={value}
      onChange={onChange}
      className="mt-2 block w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-shadow"
    >
      <option value="">Bitte wählen...</option>
      {options.map(option => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </div>
);

export const HeaderForm: React.FC<HeaderFormProps> = ({ headerInfo, setHeaderInfo }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setHeaderInfo(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setHeaderInfo(prev => ({ ...prev, [name]: value }));
  };

  const languageOptions = [
    { value: 'deu', label: 'Deutsch (deu)' },
    { value: 'eng', label: 'English (eng)' },
    { value: 'FR', label: 'Français (FR)' },
    { value: 'ita', label: 'Italiano (ita)' },
    { value: 'spa', label: 'Español (spa)' },
  ];

  const editionOptions = [
    { value: 'FULL', label: 'FULL - Vollständiger Katalog' },
    { value: 'UPDATE', label: 'UPDATE - Aktualisierung' },
    { value: 'DELTA', label: 'DELTA - Änderungen' },
  ];

  const decSepOptions = [
    { value: 'Comma', label: 'Komma (,)' },
    { value: 'Point', label: 'Punkt (.)' },
  ];

  return (
    <div className="bg-white p-8 sm:p-10 rounded-2xl shadow-xl border border-slate-200/80">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-slate-800">Katalog-Details konfigurieren</h3>
          <p className="text-sm text-slate-500 mt-1">Diese Informationen werden im Kopfbereich (`&lt;HEADER&gt;`) Ihrer BMEcat-Datei verwendet.</p>
        </div>
        <div className="flex items-center space-x-2 bg-slate-100 px-3 py-1 rounded-full">
          <span className="text-xs font-medium text-slate-600">Format:</span>
          <span className="text-xs font-bold text-indigo-600">BMECat {headerInfo.format}</span>
        </div>
      </div>
      
      <div className="bg-sky-50 border-l-4 border-sky-300 p-4 mb-8 rounded-r-lg">
         <div className="flex">
          <div className="flex-shrink-0 pt-0.5">
            <InformationCircleIcon className="h-5 w-5 text-sky-500" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-sky-800">
              Der <strong className="font-semibold text-sky-900">Katalog Name</strong> wird auch für den Namen der heruntergeladenen Datei verwendet.
            </p>
          </div>
        </div>
      </div>
      
      <div className="space-y-10">
        <div>
            <h4 className="text-lg font-semibold text-slate-800 border-b border-slate-200 pb-2 mb-6">Allgemeine Katalog-Informationen</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                <InputField id="catalogName" label="Katalog Name" value={headerInfo.catalogName} onChange={handleChange} containerClassName="md:col-span-2" />
                <InputField id="catalogId" label="Katalog ID" value={headerInfo.catalogId} onChange={handleChange} />
                <InputField id="catalogVersion" label="Katalog Version" value={headerInfo.catalogVersion} onChange={handleChange} />
                <InputField id="territory" label="Gebiet (z.B. DE)" value={headerInfo.territory} onChange={handleChange} placeholder="DE"/>
                <InputField id="currency" label="Währung (z.B. EUR)" value={headerInfo.currency} onChange={handleChange} placeholder="EUR" />
            </div>
        </div>

        {/* BMECat 2005 specific fields */}
        {headerInfo.format === '2005' && (
          <div>
            <h4 className="text-lg font-semibold text-slate-800 border-b border-slate-200 pb-2 mb-6">
              BMECat 2005 Erweiterte Einstellungen
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
              <SelectField 
                id="language" 
                label="Sprache" 
                value={headerInfo.language || ''} 
                onChange={handleSelectChange} 
                options={languageOptions}
                optional
              />
              <InputField 
                id="fabDis" 
                label="FAB-DIS Version" 
                value={headerInfo.fabDis || ''} 
                onChange={handleChange} 
                placeholder="2.3"
                optional
              />
              <SelectField 
                id="edition" 
                label="Edition" 
                value={headerInfo.edition || ''} 
                onChange={handleSelectChange} 
                options={editionOptions}
                optional
              />
              <SelectField 
                id="decSep" 
                label="Dezimaltrennzeichen" 
                value={headerInfo.decSep || ''} 
                onChange={handleSelectChange} 
                options={decSepOptions}
                optional
              />
              <InputField 
                id="countryOfOrigin" 
                label="Herkunftsland" 
                value={headerInfo.countryOfOrigin || ''} 
                onChange={handleChange} 
                placeholder="DE"
                optional
              />
              <InputField 
                id="mimeRoot" 
                label="MIME Root Pfad" 
                value={headerInfo.mimeRoot || ''} 
                onChange={handleChange} 
                placeholder="/bilder/"
                optional
              />
            </div>
          </div>
        )}
        
        <div>
            <h4 className="text-lg font-semibold text-slate-800 border-b border-slate-200 pb-2 mb-6">Lieferanten-Informationen</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                <InputField id="supplierName" label="Lieferantenname" value={headerInfo.supplierName} onChange={handleChange} containerClassName="md:col-span-2" />
                <InputField id="supplierStreet" label="Straße & Hausnummer" value={headerInfo.supplierStreet} onChange={handleChange} />
                <InputField id="supplierZip" label="Postleitzahl" value={headerInfo.supplierZip} onChange={handleChange} />
                <InputField id="supplierCity" label="Stadt" value={headerInfo.supplierCity} onChange={handleChange} />
                <InputField id="supplierCountry" label="Land (z.B. DE)" value={headerInfo.supplierCountry} onChange={handleChange} placeholder="DE"/>
                <InputField id="supplierEmail" label="E-Mail" value={headerInfo.supplierEmail} onChange={handleChange} placeholder="info@firma.de" containerClassName="md:col-span-2" />
                <InputField id="supplierUrl" label="Webseite" value={headerInfo.supplierUrl} onChange={handleChange} placeholder="https://www.firma.de" containerClassName="md:col-span-2" />
                
                {/* BMECat 2005 contact fields */}
                {headerInfo.format === '2005' && (
                  <>
                    <InputField 
                      id="contactFirstName" 
                      label="Kontakt Vorname" 
                      value={headerInfo.contactFirstName || ''} 
                      onChange={handleChange} 
                      optional
                    />
                    <InputField 
                      id="contactLastName" 
                      label="Kontakt Nachname" 
                      value={headerInfo.contactLastName || ''} 
                      onChange={handleChange} 
                      optional
                    />
                  </>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};