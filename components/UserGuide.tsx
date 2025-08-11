
import React from 'react';
import { QueueListIcon, DocumentArrowUpIcon, WrenchScrewdriverIcon, ArrowDownTrayIcon, ClipboardDocumentListIcon } from './Icons';

const GuideStep: React.FC<{ Icon: React.FC<React.SVGProps<SVGSVGElement>>; title: string; description: string; }> = ({ Icon, title, description }) => (
    <div className="flex items-start">
        <div className="flex-shrink-0">
            <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500 to-sky-500 text-white shadow-lg">
                <Icon className="h-6 w-6" aria-hidden="true" />
            </div>
        </div>
        <div className="ml-4">
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
            <p className="mt-1 text-base text-slate-600">{description}</p>
        </div>
    </div>
);

export const UserGuide: React.FC = () => {
    return (
        <div className="bg-white/80 backdrop-blur-sm p-8 sm:p-10 rounded-2xl shadow-xl border border-slate-200/80">
            <h2 className="text-2xl font-bold text-center text-slate-800">In 4 Schritten zum BMEcat-Katalog</h2>
            <p className="mt-2 text-center text-base text-slate-600 max-w-2xl mx-auto">
                Dieser Assistent führt Sie durch den Prozess der Konvertierung Ihrer CSV-Daten in eine BMEcat 1.2 XML-Datei.
            </p>
            <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10">
                <GuideStep 
                    Icon={ClipboardDocumentListIcon}
                    title="1. Variante auswählen"
                    description="Wählen Sie eine Ihnen bekannte BMEcat-Spezifikation aus oder fügen Sie eine neue hinzu, indem Sie eine PDF-Datei hochladen."
                />
                 <GuideStep 
                    Icon={DocumentArrowUpIcon}
                    title="2. Daten hochladen"
                    description="Laden Sie Ihre Produkt-CSV und optional eine Struktur-CSV oder eine XML-Vorlage für die KI hoch."
                />
                 <GuideStep 
                    Icon={WrenchScrewdriverIcon}
                    title="3. Prüfen & Konfigurieren"
                    description="Starten Sie die automatische Zuordnung per KI oder weisen Sie die Felder manuell zu und passen Sie das Ergebnis an."
                />
                 <GuideStep 
                    Icon={ArrowDownTrayIcon}
                    title="4. Katalog erstellen & Herunterladen"
                    description="Generieren Sie die finale BMEcat-Datei und laden Sie sie auf Ihren Computer herunter."
                />
            </div>
        </div>
    );
};