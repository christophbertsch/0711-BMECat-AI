import React from 'react';
import { DocumentArrowUpIcon, WrenchScrewdriverIcon, ArrowDownTrayIcon, CheckCircleIcon } from './Icons';

interface StepIndicatorProps {
  currentStep: number;
}

const steps = [
  { number: 1, title: 'Dateien hochladen', Icon: DocumentArrowUpIcon },
  { number: 2, title: 'Konfigurieren & Prüfen', Icon: WrenchScrewdriverIcon },
  { number: 3, title: 'Herunterladen', Icon: ArrowDownTrayIcon },
];

export const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep }) => {
  return (
    <nav aria-label="Progress">
      <ol role="list" className="flex items-center justify-center">
        {steps.map((step, stepIdx) => (
          <li key={step.title} className={`relative ${stepIdx !== steps.length - 1 ? 'pr-28 sm:pr-32' : ''}`}>
            {currentStep > step.number ? (
              <>
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="h-1 w-full bg-gradient-to-r from-indigo-500 to-sky-500 rounded-full" />
                </div>
                <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-sky-500 shadow-lg">
                   <CheckCircleIcon className="h-7 w-7 text-white" />
                </div>
                 <span className="absolute mt-3 w-36 text-center text-sm font-semibold text-indigo-600 -translate-x-1/2 left-1/2">{step.title}</span>
              </>
            ) : currentStep === step.number ? (
              <>
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="h-1 w-full bg-gray-200 rounded-full" />
                </div>
                <div className="relative flex h-10 w-10 items-center justify-center rounded-full border-2 border-indigo-500 bg-white shadow-lg" aria-current="step">
                   <step.Icon className="h-6 w-6 text-indigo-600" aria-hidden="true" />
                </div>
                <span className="absolute mt-3 w-36 text-center text-sm font-semibold text-indigo-600 -translate-x-1/2 left-1/2">{step.title}</span>
              </>
            ) : (
              <>
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="h-1 w-full bg-gray-200 rounded-full" />
                </div>
                <div className="group relative flex h-10 w-10 items-center justify-center rounded-full border-2 border-gray-300 bg-white shadow-sm">
                  <step.Icon className="h-6 w-6 text-gray-400" aria-hidden="true" />
                </div>
                <span className="absolute mt-3 w-36 text-center text-sm font-medium text-gray-500 -translate-x-1/2 left-1/2">{step.title}</span>
              </>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};