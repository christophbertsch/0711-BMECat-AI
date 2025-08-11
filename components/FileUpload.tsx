
import React, { useState, useCallback } from 'react';
import { DocumentArrowUpIcon, CodeBracketIcon, XCircleIcon, CheckCircleIcon, QueueListIcon, CpuChipIcon } from './Icons';

interface FileUploadProps {
  onFileLoaded: (content: string, name: string) => void;
  csvFileName: string | null;
  onCsvFileRemoved: () => void;
  
  onStructureLoaded: (content: string, name: string) => void;
  structureFileName: string | null;
  onStructureRemoved: () => void;

  onTemplateLoaded: (content: string, name: string) => void;
  templateFileName: string | null;
  onTemplateRemoved: () => void;

  onBsbFileLoaded: (content: string, name: string) => void;
  bsbFileName: string | null;
  onBsbFileRemoved: () => void;

  uploadError: string | null;
}

type AccentColor = 'blue' | 'green' | 'teal' | 'purple';

const DropZone: React.FC<{
    isDragging: boolean;
    onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
    onDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
    onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    Icon: React.FC<React.SVGProps<SVGSVGElement>>;
    title: string;
    description: string;
    fileType: string;
    inputId: string;
    accentColor: AccentColor;
    errorMessage: string | null;
}> = ({ isDragging, onDragOver, onDragLeave, onDrop, onChange, Icon, title, description, fileType, inputId, accentColor, errorMessage }) => {
    const hasError = !!errorMessage;
    const accentClasses = {
        blue: { border: 'border-blue-400', bg: 'bg-blue-50/50', ring: 'ring-blue-200', text: 'text-blue-600', hover: 'hover:text-blue-500', icon: 'text-blue-500' },
        green: { border: 'border-green-400', bg: 'bg-green-50/50', ring: 'ring-green-200', text: 'text-green-600', hover: 'hover:text-green-500', icon: 'text-green-500' }, 
        teal: { border: 'border-teal-400', bg: 'bg-teal-50/50', ring: 'ring-teal-200', text: 'text-teal-600', hover: 'hover:text-teal-500', icon: 'text-teal-500' },
        purple: { border: 'border-purple-400', bg: 'bg-purple-50/50', ring: 'ring-purple-200', text: 'text-purple-600', hover: 'hover:text-purple-500', icon: 'text-purple-500' }
    }[accentColor];

    const borderClass = hasError ? 'border-red-400' : isDragging ? accentClasses.border : 'border-slate-300';
    const bgClass = hasError ? 'bg-red-50/50' : isDragging ? accentClasses.bg : '';
    const ringClass = hasError ? 'ring-red-200' : isDragging ? accentClasses.ring : 'ring-transparent';
    const iconClass = hasError ? 'text-red-500' : isDragging ? accentClasses.icon : 'text-slate-400';
    const labelColorClass = hasError ? 'text-red-600 hover:text-red-500' : `${accentClasses.text} ${accentClasses.hover}`;


    return (
        <div
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            className={`relative mt-2 flex justify-center p-6 border-2 ${borderClass} ${bgClass} border-dashed rounded-2xl transition-all duration-200 ease-in-out ring-4 ${ringClass}`}
        >
            <div className="space-y-2 text-center">
                <Icon className={`mx-auto h-12 w-12 ${iconClass} transition-colors`}/>
                <div className="flex text-sm text-slate-600">
                    <label
                    htmlFor={inputId}
                    className={`relative cursor-pointer bg-white rounded-md font-medium ${labelColorClass}`}
                    >
                    <span>{title}</span>
                    <input id={inputId} name={inputId} type="file" className="sr-only" accept={fileType} onChange={onChange} />
                    </label>
                    <p className="pl-1">{description}</p>
                </div>
                {hasError ? (
                    <p className="text-sm font-semibold text-red-700 pt-1">{errorMessage}</p>
                ) : (
                    <p className="text-xs text-slate-500">{fileType.toUpperCase()} Datei</p>
                )}
            </div>
        </div>
    );
};


const FileDisplay: React.FC<{
    fileName: string;
    onRemove: () => void;
    accentColor: AccentColor;
}> = ({ fileName, onRemove, accentColor }) => {
    const colorClasses = {
        blue: { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'text-blue-600', text: 'text-blue-900' },
        green: { bg: 'bg-green-50', border: 'border-green-200', icon: 'text-green-600', text: 'text-green-900' },
        teal: { bg: 'bg-teal-50', border: 'border-teal-200', icon: 'text-teal-600', text: 'text-teal-900' },
        purple: { bg: 'bg-purple-50', border: 'border-purple-200', icon: 'text-purple-600', text: 'text-purple-900' }
    }[accentColor];

    return (
       <div className={`mt-2 flex items-center justify-between p-4 ${colorClasses.bg} border ${colorClasses.border} rounded-lg shadow-sm`}>
         <div className="flex items-center min-w-0">
          <CheckCircleIcon className={`w-6 h-6 mr-3 ${colorClasses.icon} flex-shrink-0`} />
          <span className={`font-medium ${colorClasses.text} truncate`} title={fileName}>{fileName}</span>
         </div>
         <button onClick={onRemove} className="text-slate-500 hover:text-red-600 transition-colors rounded-full p-1 -mr-1" aria-label="Datei entfernen">
            <XCircleIcon className="w-7 h-7" />
         </button>
       </div>
    );
};

type FileType = 'csv' | 'structure' | 'template' | 'bsb';

export const FileUpload: React.FC<FileUploadProps> = ({ 
    onFileLoaded, csvFileName, onCsvFileRemoved,
    onStructureLoaded, structureFileName, onStructureRemoved,
    onTemplateLoaded, templateFileName, onTemplateRemoved,
    onBsbFileLoaded, bsbFileName, onBsbFileRemoved,
    uploadError,
}) => {
  const [draggingType, setDraggingType] = useState<FileType | null>(null);

  const handleFile = useCallback((file: File | null, type: FileType) => {
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        switch (type) {
          case 'csv': onFileLoaded(result, file.name); break;
          case 'structure': onStructureLoaded(result, file.name); break;
          case 'template': onTemplateLoaded(result, file.name); break;
          case 'bsb': onBsbFileLoaded(result, file.name); break;
        }
      };
      reader.readAsText(file, 'UTF-8');
    }
  }, [onFileLoaded, onStructureLoaded, onTemplateLoaded, onBsbFileLoaded]);

  const createDragHandlers = (type: FileType) => ({
      onDragOver: (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setDraggingType(type); },
      onDragLeave: (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setDraggingType(null); },
      onDrop: (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault(); e.stopPropagation(); setDraggingType(null);
        if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0], type);
      },
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files?.[0]) handleFile(e.target.files[0], type); },
  });

  const getErrorMessageForType = (type: FileType): string | null => {
    if (!uploadError) return null;
    if (type === 'csv' && (uploadError.includes('Artikel-CSV') || uploadError.includes(csvFileName || ''))) {
        return uploadError.replace(/Fehler beim Verarbeiten der Artikel-CSV: |Die Datei '.*' scheint nicht UTF-8-kodiert zu sein\. /i, '');
    }
    if (type === 'structure' && (uploadError.includes('Struktur-CSV') || uploadError.includes(structureFileName || ''))) {
        return uploadError.replace(/Fehler beim Verarbeiten der Struktur-CSV: |Die Datei '.*' scheint nicht UTF-8-kodiert zu sein\. /i, '');
    }
    if (uploadError.includes('UTF-8')) {
        return uploadError;
    }
    return null;
  };

  const csvError = getErrorMessageForType('csv');
  const structureError = getErrorMessageForType('structure');

  return (
    <div className="bg-white p-8 sm:p-10 rounded-2xl shadow-xl border border-slate-200/80 space-y-10">
        <h3 className="text-xl font-bold text-slate-800 -mb-4">Dateien hochladen</h3>
      
      {/* --- 1. Product Data (Required) --- */}
      <div>
        <div className="flex items-center">
             <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-600 font-bold text-sm mr-3 flex-shrink-0">1</div>
            <div>
                <h4 className="text-lg font-bold text-slate-800">Produktdaten <span className="text-red-500 font-bold">*</span></h4>
                <p className="text-sm text-slate-500 mt-1">Die CSV-Datei mit den zu konvertierenden Produktdaten.</p>
            </div>
        </div>
        {csvFileName ? (
            <FileDisplay fileName={csvFileName} onRemove={onCsvFileRemoved} accentColor="green" />
        ) : (
            <DropZone 
                isDragging={draggingType === 'csv'}
                {...createDragHandlers('csv')}
                Icon={DocumentArrowUpIcon}
                title="Produkt-CSV auswählen"
                description="oder hierher ziehen"
                fileType=".csv"
                inputId="file-upload"
                accentColor="green"
                errorMessage={csvError}
            />
        )}
      </div>

      {/* --- 2. Catalog Structure (Optional) --- */}
      <div>
        <div className="flex items-center">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold text-sm mr-3 flex-shrink-0">2</div>
            <div>
                <h4 className="text-lg font-bold text-slate-800">Katalogstruktur <span className="text-slate-500 font-medium">(Optional)</span></h4>
                <p className="text-sm text-slate-500 mt-1">Spalten: <code className="text-xs font-semibold bg-slate-100 text-slate-700 px-1 py-0.5 rounded">GROUP_ID</code>, <code className="text-xs font-semibold bg-slate-100 text-slate-700 px-1 py-0.5 rounded">GROUP_NAME</code>, <code className="text-xs font-semibold bg-slate-100 text-slate-700 px-1 py-0.5 rounded">PARENT_ID</code>.</p>
            </div>
        </div>
        {structureFileName ? (
            <FileDisplay fileName={structureFileName} onRemove={onStructureRemoved} accentColor="blue" />
        ) : (
            <DropZone 
                isDragging={draggingType === 'structure'}
                {...createDragHandlers('structure')}
                Icon={QueueListIcon}
                title="Struktur-CSV auswählen"
                description="oder hierher ziehen"
                fileType=".csv"
                inputId="structure-upload"
                accentColor="blue"
                errorMessage={structureError}
            />
        )}
      </div>
      
      {/* --- 3. BMEcat Template (Optional) --- */}
      <div>
         <div className="flex items-center">
             <div className="flex items-center justify-center w-8 h-8 rounded-full bg-teal-100 text-teal-600 font-bold text-sm mr-3 flex-shrink-0">3</div>
            <div>
                <h4 className="text-lg font-bold text-slate-800">BMEcat-Vorlage <span className="text-slate-500 font-medium">(Optional)</span></h4>
                <p className="text-sm text-slate-500 mt-1">Eine vorhandene BMEcat-XML-Datei als Strukturvorlage für die KI.</p>
            </div>
        </div>
        {templateFileName ? (
           <FileDisplay fileName={templateFileName} onRemove={onTemplateRemoved} accentColor="teal" />
        ) : (
          <DropZone 
            isDragging={draggingType === 'template'}
            {...createDragHandlers('template')}
            Icon={CodeBracketIcon}
            title="Vorlage auswählen"
            description="oder hierher ziehen"
            fileType=".xml,text/xml"
            inputId="template-upload"
            accentColor="teal"
            errorMessage={null}
        />
        )}
      </div>

      {/* --- 4. BSB Specification (Optional) --- */}
      <div>
         <div className="flex items-center">
             <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-600 font-bold text-sm mr-3 flex-shrink-0">4</div>
            <div>
                <h4 className="text-lg font-bold text-slate-800">BSB-Spezifikation <span className="text-slate-500 font-medium">(Optional)</span></h4>
                <p className="text-sm text-slate-500 mt-1">Eine *.bsb Datei, um die BMEcat-Logik und -Variante per KI zu erkennen.</p>
            </div>
        </div>
        {bsbFileName ? (
           <FileDisplay fileName={bsbFileName} onRemove={onBsbFileRemoved} accentColor="purple" />
        ) : (
          <DropZone 
            isDragging={draggingType === 'bsb'}
            {...createDragHandlers('bsb')}
            Icon={CpuChipIcon}
            title="BSB-Datei auswählen"
            description="oder hierher ziehen"
            fileType=".bsb"
            inputId="bsb-upload"
            accentColor="purple"
            errorMessage={null}
        />
        )}
      </div>
    </div>
  );
};
