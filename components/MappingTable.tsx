
import React, { useState } from 'react';
import { BMECAT_FIELDS, BmecatField, BmecatFieldKey, DynamicBmecatField, FeatureMapping, Mapping, StoredSpecification } from '../types';
import { SparklesIcon, PlusIcon, TrashIcon } from './Icons';
import { getSmartMapping } from '../services/mappingService';

interface MappingTableProps {
  csvHeaders: string[];
  mapping: Mapping;
  setMapping: React.Dispatch<React.SetStateAction<Mapping>>;
  setError: (error: string | null) => void;
  featureMappings: FeatureMapping[];
  setFeatureMappings: React.Dispatch<React.SetStateAction<FeatureMapping[]>>;
  selectedSpecification: StoredSpecification | null;
  bsbFileContent: string | null;
  bmecatTemplate: string | null;
}

const FeatureMappingRow: React.FC<{
  mapping: FeatureMapping;
  csvHeaders: string[];
  onUpdate: (id: number, field: keyof Omit<FeatureMapping, 'id'>, value: string) => void;
  onRemove: (id: number) => void;
}> = ({ mapping, csvHeaders, onUpdate, onRemove }) => {
  return (
    <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-x-4 items-end p-4 rounded-lg bg-slate-50 border border-slate-200">
      <div>
        <label htmlFor={`fname-${mapping.id}`} className="block text-xs font-medium text-slate-600">Merkmal-Name (FNAME)</label>
        <select
          id={`fname-${mapping.id}`}
          value={mapping.fname}
          onChange={(e) => onUpdate(mapping.id, 'fname', e.target.value)}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md shadow-sm"
        >
          <option value="">Spalte wählen...</option>
          {csvHeaders.map(header => <option key={header} value={header}>{header}</option>)}
        </select>
      </div>
       <div>
        <label htmlFor={`fvalue-${mapping.id}`} className="block text-xs font-medium text-slate-600">Merkmal-Wert (FVALUE)</label>
        <select
          id={`fvalue-${mapping.id}`}
          value={mapping.fvalue}
          onChange={(e) => onUpdate(mapping.id, 'fvalue', e.target.value)}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md shadow-sm"
        >
          <option value="">Spalte wählen...</option>
          {csvHeaders.map(header => <option key={header} value={header}>{header}</option>)}
        </select>
      </div>
       <div>
        <label htmlFor={`funit-${mapping.id}`} className="block text-xs font-medium text-slate-600">Einheit (FUNIT) <span className="text-slate-400">(Optional)</span></label>
        <select
          id={`funit-${mapping.id}`}
          value={mapping.funit}
          onChange={(e) => onUpdate(mapping.id, 'funit', e.target.value)}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md shadow-sm"
        >
          <option value="">Spalte wählen...</option>
          {csvHeaders.map(header => <option key={header} value={header}>{header}</option>)}
        </select>
      </div>
      <button 
        onClick={() => onRemove(mapping.id)}
        className="flex items-center justify-center h-10 w-10 bg-slate-200 text-slate-600 hover:bg-red-100 hover:text-red-600 rounded-md transition-colors"
        aria-label="Merkmal-Zuordnung entfernen"
      >
        <TrashIcon className="h-5 w-5" />
      </button>
    </div>
  );
};

export const MappingTable: React.FC<MappingTableProps> = ({ 
  csvHeaders, 
  mapping, 
  setMapping, 
  setError,
  featureMappings,
  setFeatureMappings,
  selectedSpecification,
  bsbFileContent,
  bmecatTemplate,
}) => {
  const [isAutoMapping, setIsAutoMapping] = useState(false);
  const [uiFields, setUiFields] = useState<BmecatField[] | DynamicBmecatField[]>(BMECAT_FIELDS);


  const handleMappingChange = (bmecatKey: BmecatFieldKey | string, csvHeader: string) => {
    setMapping(prev => ({ ...prev, [bmecatKey]: csvHeader }));
  };

  const handleAutoMapClick = async () => {
    setIsAutoMapping(true);
    setError(null);
    try {
      const specPdfBase64 = selectedSpecification ? selectedSpecification.base64Content : null;
      
      const result = await getSmartMapping(
        csvHeaders,
        specPdfBase64,
        bsbFileContent,
        bmecatTemplate
      );
      
      if (result.identifiedFields && result.identifiedFields.length > 0) {
        setUiFields(result.identifiedFields);
      } else {
        // Fallback to default if AI returns nothing, to ensure the UI isn't empty.
        setUiFields(BMECAT_FIELDS);
      }

      const newMapping: Mapping = {};
      result.identifiedFields.forEach(field => {
        if (field.mappedCsvHeader && field.key) {
          newMapping[field.key] = field.mappedCsvHeader;
        }
      });
      setMapping(newMapping);
      
      const newFeatureMappings = result.featureMappings.map((fm, index) => ({
        ...fm,
        id: Date.now() + index // Simple unique ID for React keys
      }));
      setFeatureMappings(newFeatureMappings);

    } catch (e) {
      console.error("Smart mapping failed:", e);
      const errorMessage = e instanceof Error ? e.message : String(e);
      setError(errorMessage);
    } finally {
      setIsAutoMapping(false);
    }
  };
  
  const handleAddFeatureMapping = () => {
    const newMapping: FeatureMapping = {
      id: Date.now(),
      fname: '',
      fvalue: '',
      funit: ''
    };
    setFeatureMappings(prev => [...prev, newMapping]);
  };

  const handleRemoveFeatureMapping = (id: number) => {
    setFeatureMappings(prev => prev.filter(m => m.id !== id));
  };
  
  const handleUpdateFeatureMapping = (id: number, field: keyof Omit<FeatureMapping, 'id'>, value: string) => {
    setFeatureMappings(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  return (
    <div className="bg-white p-8 sm:p-10 rounded-2xl shadow-xl border border-slate-200/80">
      <div className="sm:flex sm:justify-between sm:items-start mb-8">
        <div className="flex items-center">
            <SparklesIcon className="w-8 h-8 mr-3 text-transparent bg-clip-text bg-gradient-to-tr from-indigo-500 to-sky-500 flex-shrink-0" />
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Spaltenzuordnung</h2>
              <p className="text-sm text-slate-500 mt-1">Weisen Sie Ihre CSV-Spalten den BMEcat-Feldern zu. Felder mit * sind erforderlich.</p>
            </div>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-4 flex-shrink-0">
           <button
             onClick={handleAutoMapClick}
             disabled={isAutoMapping || csvHeaders.length === 0}
             className="flex justify-center items-center w-full sm:w-auto px-6 py-2.5 text-sm font-semibold text-white rounded-lg transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 bg-gradient-to-br from-indigo-500 to-sky-500 hover:from-indigo-600 hover:to-sky-600 disabled:bg-slate-400 disabled:shadow-none disabled:transform-none disabled:cursor-not-allowed"
           >
             {isAutoMapping ? (
               <>
                 <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                 </svg>
                 <span>Analysiere...</span>
               </>
             ) : (
               <>
                 <SparklesIcon className="w-5 h-5 mr-2" />
                 Automatisch zuordnen (KI)
               </>
             )}
           </button>
        </div>
      </div>
      <div className="overflow-x-auto -mx-8 sm:-mx-10 px-8 sm:px-10">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                BMEcat Feld
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Ihre CSV-Spalte
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {uiFields.map(field => (
              <tr key={field.key} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="text-sm font-semibold text-slate-900">
                    {field.label} {field.required && <span className="text-red-500 text-base ml-1 leading-none">*</span>}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">{field.description}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <select
                    value={mapping[field.key] || ''}
                    onChange={(e) => handleMappingChange(field.key, e.target.value)}
                    className="mt-1 block w-full max-w-xs pl-3 pr-10 py-2.5 text-base border-slate-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-lg shadow-sm"
                    aria-label={`Zuordnung für ${field.label}`}
                  >
                    <option value="">Nicht zuordnen</option>
                    {csvHeaders.map(header => (
                      <option key={header} value={header}>{header}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-10 pt-8 border-t border-slate-200">
        <div className="flex justify-between items-start">
            <div>
                <h3 className="text-xl font-bold text-slate-800">Produktmerkmale (Features)</h3>
                <p className="text-sm text-slate-500 mt-1">Fügen Sie Zuordnungen für zusätzliche Produktmerkmale hinzu, z.B. für Farbe, Größe oder Material.</p>
            </div>
            <button
                onClick={handleAddFeatureMapping}
                className="flex items-center px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors text-sm font-semibold"
            >
                <PlusIcon className="w-5 h-5 mr-2" />
                Merkmal hinzufügen
            </button>
        </div>
        <div className="mt-4 space-y-4">
          {featureMappings.length > 0 ? (
            featureMappings.map(fm => (
              <FeatureMappingRow
                key={fm.id}
                mapping={fm}
                csvHeaders={csvHeaders}
                onUpdate={handleUpdateFeatureMapping}
                onRemove={handleRemoveFeatureMapping}
              />
            ))
          ) : (
             <div className="text-center py-8 px-4 border-2 border-dashed border-slate-200 rounded-lg">
                <p className="text-sm text-slate-500">Es sind noch keine Produktmerkmale zugeordnet.</p>
                <p className="text-xs text-slate-400 mt-1">Klicken Sie auf "+ Merkmal hinzufügen" oder "Automatisch zuordnen (KI)", um zu beginnen.</p>
             </div>
          )}
        </div>
      </div>

    </div>
  );
};
