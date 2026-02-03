'use client'
export default function ProgressBar({ currentStep }: { currentStep: number }) {
  const steps = ['Patient', 'Symptoms', 'Clinic', 'Schedule', 'Payment']
  
  return (
    <div className="flex justify-between mb-6">
      {steps.map((s, i) => (
        <div
          key={s}
          className={`text-sm ${currentStep === i + 1 ? 'font-bold text-blue-600' : 'text-gray-400'}`}
        >
          {i + 1}. {s}
        </div>
      ))}
    </div>
  )
}
