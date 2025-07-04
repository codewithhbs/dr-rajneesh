"use client";

import { motion } from "framer-motion";
import { Star, Check } from 'lucide-react';
import { Label } from "@/components/ui/label";

interface SessionStepProps {
  selectedSessions: number;
  setSelectedSessions: (sessions: number) => void;
  sessionPrice: number;
  sessionMRP: number;
}

const SessionStep = ({ selectedSessions, setSelectedSessions, sessionPrice, sessionMRP }: SessionStepProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="space-y-6"
    >
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="text-center space-y-3"
      >
        <div className="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full mb-3">
          <Star className="h-5 w-5 text-white" />
        </div>
        <h2 className="text-xl font-semibold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
          Select Sessions
        </h2>
        <p className="text-sm text-slate-600 max-w-xl mx-auto">
          Choose the number of consultation sessions you need
        </p>
      </motion.div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 max-w-5xl mx-auto">
        {[1, 2, 3, 4, 5, 6].map((num, index) => (
          <motion.div
            key={num}
            initial={{ opacity: 0, scale: 0.8, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{
              delay: index * 0.08 + 0.3,
              duration: 0.4,
              ease: "easeOut",
            }}
            className="relative group"
          >
            <input
              type="radio"
              id={`session-${num}`}
              name="sessions"
              value={num}
              checked={selectedSessions === num}
              onChange={() => setSelectedSessions(num)}
              className="peer sr-only"
            />

            <Label
              htmlFor={`session-${num}`}
              className="flex flex-col items-center justify-between h-full p-4 rounded-xl border border-slate-200 bg-white cursor-pointer shadow-sm transition-all duration-200 hover:border-green-300 hover:shadow-md hover:scale-[1.02] peer-checked:border-green-500 peer-checked:bg-gradient-to-br peer-checked:from-green-50 peer-checked:to-emerald-50 peer-checked:shadow-lg peer-checked:scale-[1.02]"
            >
              <div className="text-center space-y-2">
                <div className="text-2xl font-bold text-slate-900">{num}</div>
                <div className="text-xs text-slate-600 font-medium">
                  Session{num > 1 ? "s" : ""}
                </div>
              </div>

              <div className="text-center mt-3 space-y-1">
                <div className="text-lg font-bold text-green-600">
                  ₹{(num * sessionPrice).toLocaleString()}
                </div>
                <div className="text-xs text-slate-400 line-through">
                  ₹{(num * sessionMRP).toLocaleString()}
                </div>
                <div className="text-xs text-green-600 font-medium">
                  Save ₹{(num * (sessionMRP - sessionPrice)).toLocaleString()}
                </div>
              </div>

              {selectedSessions === num && (
                <motion.div
                  initial={{ scale: 0, rotate: -90 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 200,
                    damping: 10,
                  }}
                  className="absolute -top-2 -right-2"
                >
                  <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow-md">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                </motion.div>
              )}
            </Label>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default SessionStep;
