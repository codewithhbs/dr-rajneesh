'use client';

import { Check } from 'lucide-react';

interface ProgressBarProps {
  currentStep: number;
  validatedSteps?: Record<string, boolean>; // Optional: to track completed steps
}

export default function ProgressBar({ currentStep, validatedSteps = {} }: ProgressBarProps) {
  const steps = [
    { id: 'patient', order: 1, label: 'Patient Details' },
    { id: 'symptoms', order: 2, label: 'Symptoms' },
    { id: 'clinic', order: 3, label: 'Clinic' },
    { id: 'schedule', order: 4, label: 'Schedule' },
    { id: 'payment', order: 5, label: 'Payment' },
  ];

  const currentIndex = steps.findIndex((step) => step.order === currentStep);

  return (
    <div className="bg-white border-b sticky top-0 z-40 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const isCompleted = validatedSteps[step.id] || false;
            const isCurrent = step.order === currentStep;
            const isUpcoming = index > currentIndex;

            return (
              <div key={step.id} className="flex items-center flex-1">
                {/* Step Circle */}
                <div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm
                    transition-all duration-300 flex-shrink-0 border-2
                    ${
                      isCompleted
                        ? 'bg-green-500 border-green-500 text-white'
                        : isCurrent
                        ? 'bg-blue-600 border-blue-600 text-white ring-4 ring-blue-100'
                        : 'bg-white border-gray-300 text-gray-400'
                    }
                  `}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    step.order
                  )}
                </div>

                {/* Step Label */}
                <span
                  className={`
                    ml-3 text-sm font-medium whitespace-nowrap transition-colors
                    ${
                      isCompleted
                        ? 'text-green-600'
                        : isCurrent
                        ? 'text-blue-600 font-semibold'
                        : 'text-gray-500'
                    }
                  `}
                >
                  {step.label}
                </span>

                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div
                    className={`
                      h-[3px] flex-1 mx-4 rounded-full transition-all duration-300
                      ${
                        isCompleted
                          ? 'bg-green-500'
                          : isCurrent
                          ? 'bg-blue-200'
                          : 'bg-gray-200'
                      }
                    `}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}