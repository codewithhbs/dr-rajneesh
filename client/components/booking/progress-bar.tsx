"use client";
import { motion } from "framer-motion";

interface ProgressBarProps {
  progress: number;
  currentStep: number;
}

const ProgressBar = ({ progress, currentStep }: ProgressBarProps) => {
  const stepLabels = ["Location", "Sessions", "Schedule", "Payment"];
  
  // Calculate progress based on current step to prevent overflow
  const getStepProgress = (step: number) => {
    switch(step) {
      case 1: return 5;  // End at Location
      case 2: return 35;  // End at Sessions  
      case 3: return 68;  // End at Schedule
      case 4: return 100; // End at Payment
      default: return 0;
    }
  };
  
  const actualProgress = getStepProgress(currentStep);

  return (
    <motion.div
      initial={{ scaleX: 0 }}
      animate={{ scaleX: 1 }}
      transition={{ delay: 0.4, duration: 0.6, ease: "easeOut" }}
      className="mt-4 w-full"
    >
      {/* Progress bar container with strict overflow control */}
      <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden relative">
        <motion.div
          initial={{ width: "0%" }}
          animate={{ width: `${actualProgress}%` }}
          transition={{ delay: 0.6, duration: 0.8, ease: "easeOut" }}
          className="h-full bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full shadow-sm"
          style={{ 
            maxWidth: "100%", // Strict max width to prevent overflow
            width: `${actualProgress}%`
          }}
        />
      </div>
      
      {/* Step labels with proper spacing */}
      <div className="flex justify-between items-center mt-2 text-xs overflow-hidden">
        {stepLabels.map((label, index) => {
          const stepNumber = index + 1;
          const isActive = currentStep === stepNumber;
          const isCompleted = currentStep > stepNumber;
          
          return (
            <span
              key={label}
              className={`
                transition-all duration-300 truncate
                ${isActive 
                  ? "font-semibold text-white scale-105" 
                  : isCompleted 
                    ? "font-medium text-blue-100" 
                    : "text-blue-200/70"
                }
              `}
            >
              {label}
            </span>
          );
        })}
      </div>
    </motion.div>
  );
};

export default ProgressBar;