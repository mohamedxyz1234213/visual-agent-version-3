"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { submitOnboarding } from "@/features/student/api";
import {
  IconBook,
  IconCode,
  IconZap,
  IconTarget,
  IconSearch,
  IconMessage,
  IconTerminal,
  IconClock,
  IconTrending,
  IconCheck,
  IconStar,
  IconRobot,
  IconCompass,
} from "@/components/shared/FluxIcons";

interface QuestionOption {
  value: string;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const QUESTIONS: {
  id: string;
  title: string;
  subtitle: string;
  options: QuestionOption[];
}[] = [
  {
    id: "learningStyle",
    title: "How do you learn best?",
    subtitle: "Choose the method that helps you understand new concepts the fastest",
    options: [
      { value: "visual", label: "Visual", description: "Diagrams, charts, and visual explanations", icon: <IconCompass size={24} /> },
      { value: "reading", label: "Reading", description: "Written text, documentation, and articles", icon: <IconBook size={24} /> },
      { value: "hands-on", label: "Hands-On", description: "Coding directly and building projects", icon: <IconCode size={24} /> },
      { value: "video", label: "Video", description: "Watching tutorials and narrated lessons", icon: <IconRobot size={24} /> },
    ],
  },
  {
    id: "problemSolvingApproach",
    title: "When you get stuck on a problem, what do you do?",
    subtitle: "Your natural reaction tells us how to structure our help system",
    options: [
      { value: "research", label: "Search & Research", description: "Look up documentation and find the answer yourself", icon: <IconSearch size={24} /> },
      { value: "ask-help", label: "Ask for Help", description: "Ask someone or use AI to explain the solution", icon: <IconMessage size={24} /> },
      { value: "debug", label: "Debug Until It Works", description: "Try different approaches until something clicks", icon: <IconTerminal size={24} /> },
      { value: "break", label: "Take a Break", description: "Step away and come back with fresh eyes", icon: <IconClock size={24} /> },
    ],
  },
  {
    id: "pacing",
    title: "What's your ideal learning pace?",
    subtitle: "How quickly do you want to move through new material?",
    options: [
      { value: "slow", label: "Slow & Thorough", description: "Master each concept completely before moving forward", icon: <IconClock size={24} /> },
      { value: "moderate", label: "Moderate", description: "A balanced pace with steady progress", icon: <IconTrending size={24} /> },
      { value: "fast", label: "Fast & Challenging", description: "Skip the basics and jump into advanced topics quickly", icon: <IconZap size={24} /> },
    ],
  },
  {
    id: "practiceFrequency",
    title: "How much practice do you need to master a concept?",
    subtitle: "This helps us decide how many exercises to include with each lesson",
    options: [
      { value: "low", label: "A Few Examples", description: "I understand quickly with just 1-2 examples", icon: <IconCheck size={24} /> },
      { value: "medium", label: "Several Exercises", description: "I need a handful of varied exercises to feel confident", icon: <IconStar size={24} /> },
      { value: "high", label: "Lots of Practice", description: "I need many exercises and challenges to really master it", icon: <IconTarget size={24} /> },
    ],
  },
  {
    id: "experienceLevel",
    title: "What's your current experience with programming?",
    subtitle: "Be honest — this helps us start at the right level for you",
    options: [
      { value: "absolute-beginner", label: "Absolute Beginner", description: "I've never written a line of code before", icon: <IconStar size={24} /> },
      { value: "some-experience", label: "Some Experience", description: "I've tried coding a few times and know basic concepts", icon: <IconTrending size={24} /> },
      { value: "intermediate", label: "Intermediate", description: "I can build basic projects and understand core concepts", icon: <IconZap size={24} /> },
      { value: "advanced", label: "Advanced", description: "I'm comfortable with complex programming concepts", icon: <IconTarget size={24} /> },
    ],
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const question = QUESTIONS[currentStep];
  const isLastStep = currentStep === QUESTIONS.length - 1;
  const progress = ((currentStep + 1) / QUESTIONS.length) * 100;

  const handleSelect = (value: string) => {
    setSelectedOption(value);
    setAnswers({ ...answers, [question.id]: value });
  };

  const handleNext = async () => {
    if (!selectedOption) return;

    if (isLastStep) {
      setSubmitting(true);
      try {
        setSubmitError(null);
        await submitOnboarding(answers as {
          learningStyle: string;
          pacing: string;
          practiceFrequency: string;
          problemSolvingApproach: string;
          experienceLevel: string;
        });
        setCompleted(true);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Something went wrong saving your profile. Please try again.";
        setSubmitError(msg);
      } finally {
        setSubmitting(false);
      }
    } else {
      setCurrentStep(currentStep + 1);
      setSelectedOption(null);
    }
  };

  const handleSkip = async () => {
    router.push("/student/dashboard");
  };

  // Show completion screen
  if (completed) {
    return (
      <div className="min-h-screen bg-[#EDEDED] flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-sm border border-[#E5E5E5] p-10 max-w-lg w-full text-center">
          <div className="w-20 h-20 rounded-2xl bg-[#D6F63E] flex items-center justify-center mx-auto mb-5">
            <IconCheck size={40} className="text-[#0F0F0F]" />
          </div>
          <h2 className="text-2xl font-bold text-[#0F0F0F] mb-2">You're All Set! 🎉</h2>
          <p className="text-sm text-[#6B6B6B] mb-6">
            Your personalized learning profile has been created. We'll tailor every lesson, exercise, and
            recommendation to match your unique learning style.
          </p>
          <div className="bg-[#F5F5F5] rounded-xl p-4 mb-6 text-left space-y-2">
            {Object.entries(answers).map(([key, value]) => {
              const q = QUESTIONS.find((q) => q.id === key);
              const opt = q?.options.find((o) => o.value === value);
              return (
                <div key={key} className="flex items-center justify-between text-sm">
                  <span className="text-[#6B6B6B]">{q?.title || key}</span>
                  <span className="font-semibold text-[#0F0F0F]">{opt?.label || value}</span>
                </div>
              );
            })}
          </div>
          <button
            onClick={() => router.push("/student/dashboard")}
            className="w-full py-3 bg-[#0F0F0F] text-white rounded-xl font-semibold text-sm hover:bg-[#2A2A2A] transition-colors"
          >
            Go to My Dashboard →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#EDEDED] flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-sm border border-[#E5E5E5] p-8 md:p-10 max-w-xl w-full">
        {/* Progress bar */}
        <div className="flex items-center gap-3 mb-8">
          <div className="flex-1 h-2 bg-[#F5F5F5] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#0F0F0F] rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs font-semibold text-[#A0A0A0] tabular-nums">
            {currentStep + 1} / {QUESTIONS.length}
          </span>
        </div>

        {/* Question */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            {[0, 1, 2, 3, 4].map((step) => (
              <div
                key={step}
                className={`w-2 h-2 rounded-full transition-all ${
                  step === currentStep ? "bg-[#0F0F0F] w-6" :
                  step < currentStep ? "bg-[#D6F63E]" : "bg-[#E5E5E5]"
                }`}
              />
            ))}
          </div>
          <h2 className="text-2xl font-bold text-[#0F0F0F] mt-4">{question.title}</h2>
          <p className="text-sm text-[#6B6B6B] mt-1">{question.subtitle}</p>
        </div>

        {/* Options */}
        <div className="space-y-2.5 mb-8">
          {question.options.map((option) => {
            const isSelected = selectedOption === option.value;
            return (
              <button
                key={option.value}
                onClick={() => handleSelect(option.value)}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                  isSelected
                    ? "border-[#0F0F0F] bg-[#F5F5F5]"
                    : "border-[#E5E5E5] bg-white hover:border-[#A0A0A0] hover:bg-[#FAFAFA]"
                }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                  isSelected ? "bg-[#D6F63E] text-[#0F0F0F]" : "bg-[#F5F5F5] text-[#6B6B6B]"
                }`}>
                  {option.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <span className={`text-sm font-semibold block ${
                    isSelected ? "text-[#0F0F0F]" : "text-[#0F0F0F]"
                  }`}>
                    {option.label}
                  </span>
                  <span className="text-xs text-[#6B6B6B] block mt-0.5">
                    {option.description}
                  </span>
                </div>
                {isSelected && (
                  <div className="w-6 h-6 rounded-full bg-[#0F0F0F] flex items-center justify-center shrink-0">
                    <IconCheck size={14} className="text-white" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Error */}
        {submitError && (
          <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2.5 mb-3">{submitError}</p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3">
          {currentStep > 0 ? (
            <button
              onClick={() => {
                setCurrentStep(currentStep - 1);
                const prevAnswer = answers[QUESTIONS[currentStep - 1].id];
                setSelectedOption(prevAnswer || null);
              }}
              className="px-5 py-2.5 border border-[#E5E5E5] text-[#6B6B6B] rounded-xl font-semibold text-sm hover:bg-[#F5F5F5] transition-colors"
            >
              Back
            </button>
          ) : (
            <button
              onClick={handleSkip}
              className="px-5 py-2.5 text-[#A0A0A0] rounded-xl font-semibold text-sm hover:text-[#6B6B6B] transition-colors"
            >
              Skip for now
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={!selectedOption || submitting}
            className="flex-1 py-2.5 bg-[#0F0F0F] text-white rounded-xl font-semibold text-sm hover:bg-[#2A2A2A] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </>
            ) : isLastStep ? (
              "Complete Setup"
            ) : (
              "Next Question"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
