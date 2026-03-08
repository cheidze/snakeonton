import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { audioService } from "../services/audioService";

interface TutorialOverlayProps {
  onComplete: () => void;
  themeColor: string;
}

const TUTORIAL_STEPS = [
  {
    title: "Welcome to SnakeOn!",
    content: "Let's quickly go over how to play and dominate the arena.",
    icon: "🐍",
  },
  {
    title: "Movement",
    content: "Use your mouse, touch, or joystick to steer your snake. It will automatically move forward.",
    icon: "🕹️",
  },
  {
    title: "Grow & Collect",
    content: "Eat glowing orbs to grow longer. Collect coins to buy new skins and collectibles in the shop!",
    icon: "✨",
  },
  {
    title: "Boost",
    content: "Click, tap, or press Spacebar to boost your speed. Warning: Boosting consumes your length!",
    icon: "⚡",
  },
  {
    title: "Combat",
    content: "Don't hit other snakes! If your head touches another snake's body, you die. Make them hit your body to defeat them and eat their remains.",
    icon: "⚔️",
  },
  {
    title: "Ready?",
    content: "Survive, grow, and become the longest snake in the arena!",
    icon: "🏆",
  },
];

export default function TutorialOverlay({ onComplete, themeColor }: TutorialOverlayProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    audioService.playClick();
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      onComplete();
    }
  };

  const step = TUTORIAL_STEPS[currentStep];

  return (
    <div className="absolute inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -20 }}
          transition={{ duration: 0.3 }}
          className="glass-panel p-8 rounded-3xl text-center max-w-md w-full mx-4 border-2 flex flex-col items-center"
          style={{
            borderColor: `${themeColor}60`,
            boxShadow: `0 0 30px ${themeColor}30`,
          }}
        >
          <div className="text-6xl mb-6">{step.icon}</div>
          <h2 className="text-3xl font-black text-white mb-4">{step.title}</h2>
          <p className="text-gray-300 mb-8 text-lg leading-relaxed">
            {step.content}
          </p>

          <div className="flex gap-2 mb-8">
            {TUTORIAL_STEPS.map((_, idx) => (
              <div
                key={idx}
                className={`h-2 rounded-full transition-all duration-300 ${
                  idx === currentStep ? "w-8" : "w-2 opacity-30"
                }`}
                style={{ backgroundColor: idx === currentStep ? themeColor : "#ffffff" }}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            className="w-full py-4 rounded-full font-bold text-xl text-black shadow-lg hover:scale-105 transition-transform"
            style={{ backgroundColor: themeColor }}
          >
            {currentStep === TUTORIAL_STEPS.length - 1 ? "PLAY NOW" : "NEXT"}
          </button>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
