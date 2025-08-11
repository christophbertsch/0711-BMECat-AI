
import React, { useState, useEffect, useCallback } from 'react';
import { StoredSpecification } from '../types';
import { getStoredSpecifications, saveSpecification, deleteSpecification } from '../services/specStore';
import { ClipboardDocumentListIcon, PlusIcon, TrashIcon } from './Icons';

interface SpecificationManagerProps {
    onSpecChange: (spec: StoredSpecification | null) => void;
    initialSpec: StoredSpecification | null;
}

const DropZone: React.FC<{
    isDragging: boolean;
    onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
    onDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
    onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    inputId: string;
}> = ({ isDragging, onDragOver, onDragLeave, onDrop, onChange, inputId }) => {
    const borderClass = isDragging ? 'border-purple-400' : 'border-slate-300';
    const bgClass = isDragging ? 'bg-purple-50/50' : '';
    const ringClass = isDragging ? 'ring-purple-200' : 'ring-transparent';

    return (
        <div
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            className={`relative mt-4 flex justify-center p-6 border-2 ${borderClass} ${bgClass} border-dashed rounded-2xl transition-all duration-200 ease-in-out ring-4 ${ringClass}`}
        >
            <div className="space-y-2 text-center">
                <ClipboardDocumentListIcon className={`mx-auto h-10 w-10 ${isDragging ? 'text-purple-500' : 'text-slate-400'} transition-colors`}/>
                <div className="flex text-sm text-slate-600">
                    <label htmlFor={inputId} className="relative cursor-pointer bg-white rounded-md font-medium text-purple-600 hover:text-purple-500">
                        <span>PDF-Spezifikation auswählen</span>
                        <input id={inputId} name={inputId} type="file" className="sr-only" accept=".pdf" onChange={onChange} />
                    </label>
                    <p className="pl-1">oder per Drag & Drop hierher ziehen</p>
                </div>
                 <p className="text-xs text-slate-500">.PDF Datei</p>
            </div>
        </div>
    );
};


export const SpecificationManager: React.FC<SpecificationManagerProps> = ({ onSpecChange, initialSpec }) => {
    const [storedSpecs, setStoredSpecs] = useState<StoredSpecification[]>([]);
    const [selectedSpecId, setSelectedSpecId] = useState<string>(initialSpec ? String(initialSpec.id) : '');
    const [showAddNewForm, setShowAddNewForm] = useState(false);
    const [newSpecName, setNewSpecName] = useState('');
    const [newSpecFile, setNewSpecFile] = useState<File | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isManaging, setIsManaging] = useState(false);
    const [dragging, setDragging] = useState(false);
    const [error, setError] = useState<string | null>(null);


    useEffect(() => {
        setStoredSpecs(getStoredSpecifications());
    }, []);

    const handleSelectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { value } = e.target;
        setSelectedSpecId(value);
        if (value === 'add_new') {
            setShowAddNewForm(true);
            onSpecChange(null);
        } else if (value === '') {
            setShowAddNewForm(false);
            onSpecChange(null);
        } else {
            setShowAddNewForm(false);
            const selected = storedSpecs.find(s => s.id === Number(value));
            onSpecChange(selected || null);
        }
    };

    const handleFileChange = (file: File | null) => {
        setError(null);
        if (file && file.type !== 'application/pdf') {
            setError('Bitte laden Sie eine gültige PDF-Datei hoch.');
            return;
        }
        setNewSpecFile(file);
    };

    const handleSaveNewSpec = () => {
        if (!newSpecName.trim()) {
            setError('Bitte geben Sie einen Namen für die Spezifikation ein.');
            return;
        }
        if (!newSpecFile) {
            setError('Bitte wählen Sie eine PDF-Datei aus.');
            return;
        }
        
        setIsSaving(true);
        const reader = new FileReader();
        reader.onload = (e) => {
            const base64Content = (e.target?.result as string).split(',')[1];
            const newSpec = saveSpecification(newSpecName, base64Content);
            const updatedSpecs = getStoredSpecifications();
            setStoredSpecs(updatedSpecs);
            setSelectedSpecId(String(newSpec.id));
            onSpecChange(newSpec);
            
            // Reset form
            setShowAddNewForm(false);
            setNewSpecName('');
            setNewSpecFile(null);
            setError(null);
            setIsSaving(false);
        };
        reader.onerror = () => {
            setError('Fehler beim Lesen der Datei.');
            setIsSaving(false);
        };
        reader.readAsDataURL(newSpecFile);
    };

    const handleDeleteSpec = (id: number) => {
        deleteSpecification(id);
        const updatedSpecs = getStoredSpecifications();
        setStoredSpecs(updatedSpecs);
        if (String(id) === selectedSpecId) {
            setSelectedSpecId('');
            onSpecChange(null);
        }
    };
    
    const dragHandlers = {
      onDragOver: (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setDragging(true); },
      onDragLeave: (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setDragging(false); },
      onDrop: (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault(); e.stopPropagation(); setDragging(false);
        if (e.dataTransfer.files?.[0]) handleFileChange(e.dataTransfer.files[0]);
      },
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files?.[0]) handleFileChange(e.target.files[0]); },
    };

    return (
        <div className="bg-white p-8 sm:p-10 rounded-2xl shadow-xl border border-slate-200/80">
            <h3 className="text-xl font-bold text-slate-800">BMEcat Variante auswählen</h3>
            <p className="text-sm text-slate-500 mt-1">Wählen Sie eine gespeicherte Spezifikation aus oder fügen Sie eine neue hinzu. Dies ist optional.</p>
            
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                 <select
                    id="spec-select"
                    value={selectedSpecId}
                    onChange={handleSelectionChange}
                    className="block w-full px-4 py-3 bg-white border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-shadow"
                 >
                    <option value="">Keine Spezifikation verwenden</option>
                    {storedSpecs.map(spec => (
                        <option key={spec.id} value={spec.id}>{spec.name}</option>
                    ))}
                    <option value="add_new" className="font-bold text-indigo-600">
                        + Neue Variante hinzufügen...
                    </option>
                 </select>

                <button
                    onClick={() => setIsManaging(!isManaging)}
                    className="w-full md:w-auto justify-self-start md:justify-self-end px-4 py-3 text-sm font-semibold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors border border-slate-200/80"
                >
                    Gespeicherte Varianten verwalten
                </button>
            </div>

            {showAddNewForm && (
                <div className="mt-6 p-6 bg-slate-50 rounded-lg border border-slate-200">
                     <h4 className="text-lg font-semibold text-slate-800">Neue Variante hinzufügen</h4>
                     <div>
                        <label htmlFor="new-spec-name" className="block text-sm font-medium text-slate-700 mt-4">Name der Variante</label>
                        <input
                            type="text"
                            id="new-spec-name"
                            value={newSpecName}
                            onChange={e => setNewSpecName(e.target.value)}
                            placeholder="z.B. Kunde A - Standard 2024"
                            className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                     </div>
                     <DropZone isDragging={dragging} {...dragHandlers} inputId="new-spec-pdf-upload" />
                     {newSpecFile && <p className="text-sm text-green-700 mt-2">Ausgewählte Datei: {newSpecFile.name}</p>}
                     {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
                     <div className="mt-6 flex justify-end">
                        <button onClick={() => { setShowAddNewForm(false); setSelectedSpecId(''); }} type="button" className="px-4 py-2 text-sm font-medium text-slate-700 bg-white rounded-md border border-slate-300 hover:bg-slate-50">Abbrechen</button>
                        <button onClick={handleSaveNewSpec} disabled={isSaving} type="button" className="ml-3 inline-flex justify-center items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md border border-transparent shadow-sm hover:bg-indigo-700 disabled:bg-indigo-300">
                           {isSaving ? 'Speichern...' : 'Variante speichern'}
                        </button>
                     </div>
                </div>
            )}
            
            {isManaging && (
                 <div className="mt-6 p-6 bg-slate-50 rounded-lg border border-slate-200">
                     <h4 className="text-lg font-semibold text-slate-800">Gespeicherte Varianten</h4>
                     {storedSpecs.length > 0 ? (
                         <ul className="mt-4 space-y-2">
                             {storedSpecs.map(spec => (
                                 <li key={spec.id} className="flex justify-between items-center p-3 bg-white rounded-md border border-slate-200">
                                     <span className="text-sm font-medium text-slate-800">{spec.name}</span>
                                     <button onClick={() => handleDeleteSpec(spec.id)} className="text-slate-400 hover:text-red-500 p-1 rounded-full">
                                        <TrashIcon className="w-5 h-5" />
                                     </button>
                                 </li>
                             ))}
                         </ul>
                     ) : (
                        <p className="text-sm text-slate-500 mt-2">Sie haben noch keine Varianten gespeichert.</p>
                     )}
                 </div>
            )}
        </div>
    );
};
