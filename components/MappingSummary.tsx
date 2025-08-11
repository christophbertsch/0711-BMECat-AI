
import React from 'react';
import { Mapping, BMECAT_FIELDS, FeatureMapping } from '../types';
import { CheckCircleIcon, XCircleIcon } from './Icons';

interface MappingSummaryProps {
  mapping: Mapping;
  featureMappings: FeatureMapping[];
}

export const MappingSummary: React.FC<MappingSummaryProps> = ({ mapping, featureMappings }) => {
  const mappedFieldsCount = Object.values(mapping).filter(v => v && v !== '').length;
  const totalFields = BMECAT_FIELDS.length;
  const requiredFields = BMECAT_FIELDS.filter(f => f.required);
  const unmappedRequiredFields = requiredFields.filter(f => !mapping[f.key] || mapping[f.key] === '');

  return (
    <div className="bg-white p-8 sm:p-10 rounded-2xl shadow-xl border border-slate-200/80">
      <h3 className="text-2xl font-bold text-slate-800">Zuordnungs-Übersicht</h3>
      <p className="text-sm text-slate-500 mt-1 mb-6">
        Überprüfen Sie hier Ihre Konfiguration, bevor Sie den BMEcat generieren.
        Es sind {mappedFieldsCount} von {totalFields} möglichen Feldern zugeordnet.
      </p>

      {unmappedRequiredFields.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-400 text-red-800 p-4 mb-6 rounded-r-lg">
          <div className="flex">
            <div className="flex-shrink-0 pt-0.5">
              <XCircleIcon className="h-5 w-5 text-red-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-900 font-semibold">
                Es fehlen Zuordnungen für {unmappedRequiredFields.length} erforderliche(s) Feld(er):
                <span className="font-normal"> {unmappedRequiredFields.map(f => f.label.split(' (')[0]).join(', ')}</span>
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flow-root">
        <dl className="-my-4 divide-y divide-slate-200 text-sm">
          {BMECAT_FIELDS.map(field => {
            const mappedValue = mapping[field.key];
            const isRequired = field.required;
            const isMapped = mappedValue && mappedValue !== '';
            
            return (
              <div key={field.key} className="flex items-center justify-between gap-4 py-4">
                <dt className="text-slate-600">
                  {field.label.split(' (')[0]}
                  {isRequired && <span className="text-red-500 text-base ml-1 leading-none">*</span>}
                </dt>
                <dd className="flex items-center font-medium text-right">
                  {isMapped ? (
                    <>
                      <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2" />
                      <span className="text-slate-800 truncate" title={mappedValue}>{mappedValue}</span>
                    </>
                  ) : (
                    <>
                      {isRequired && <XCircleIcon className="w-4 h-4 text-red-400 mr-2" />}
                      <span className="text-slate-400">Nicht zugeordnet</span>
                    </>
                  )}
                </dd>
              </div>
            );
          })}
        </dl>
      </div>

      <div className="mt-8 pt-6 border-t border-slate-200">
        <h4 className="text-lg font-semibold text-slate-800">Zugeordnete Produktmerkmale</h4>
        {featureMappings && featureMappings.length > 0 ? (
          <div className="mt-3 space-y-3">
            {featureMappings.map((fm, index) => (
              <div key={fm.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
                 <p className="text-sm font-semibold text-slate-700 mb-2">Merkmal #{index + 1}</p>
                 <dl className="grid grid-cols-3 gap-x-4 text-xs">
                    <div className="flex flex-col">
                        <dt className="text-slate-500">FNAME</dt>
                        <dd className="font-semibold text-slate-800 truncate" title={fm.fname || 'Nicht gesetzt'}>{fm.fname || '–'}</dd>
                    </div>
                    <div className="flex flex-col">
                        <dt className="text-slate-500">FVALUE</dt>
                        <dd className="font-semibold text-slate-800 truncate" title={fm.fvalue || 'Nicht gesetzt'}>{fm.fvalue || '–'}</dd>
                    </div>
                     <div className="flex flex-col">
                        <dt className="text-slate-500">FUNIT</dt>
                        <dd className="font-semibold text-slate-800 truncate" title={fm.funit || 'Nicht gesetzt'}>{fm.funit || '–'}</dd>
                    </div>
                 </dl>
              </div>
            ))}
          </div>
        ) : (
            <p className="text-sm text-slate-500 mt-2">Keine zusätzlichen Produktmerkmale zugeordnet.</p>
        )}
      </div>

    </div>
  );
};