"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Lightbulb } from "lucide-react";
import { useState } from "react";

interface ThoughtInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const MIN_CHARS = 10;
const MAX_CHARS = 500;

const EXAMPLE_THOUGHTS = [
  "Today I realized that small moments of connection matter more than grand gestures.",
  "The silence between thoughts is as important as the thoughts themselves.",
  "True growth happens in the space between comfort and challenge.",
];

export function ThoughtInput({
  value,
  onChange,
  disabled = false,
}: ThoughtInputProps) {
  const [showExamples, setShowExamples] = useState(false);
  const charCount = value.length;
  const isValid = charCount >= MIN_CHARS && charCount <= MAX_CHARS;
  const isTooShort = charCount > 0 && charCount < MIN_CHARS;
  const isTooLong = charCount > MAX_CHARS;

  const getCharCountColor = () => {
    if (isTooLong) return "text-red-600";
    if (isTooShort) return "text-yellow-600";
    if (isValid) return "text-green-600";
    return "text-gray-500";
  };

  const getValidationMessage = () => {
    if (isTooShort) {
      return `At least ${MIN_CHARS} characters required (${MIN_CHARS - charCount} more)`;
    }
    if (isTooLong) {
      return `Maximum ${MAX_CHARS} characters (${charCount - MAX_CHARS} over)`;
    }
    return null;
  };

  const handleExampleClick = (example: string) => {
    onChange(example);
    setShowExamples(false);
  };

  return (
    <div className="space-y-3">
      {/* Header with helper text */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <label
            htmlFor="thought-input"
            className="block text-sm font-medium mb-1"
          >
            Your Reflective Thought
          </label>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Share a brief reflection, insight, or moment of wisdom (1-3
            sentences)
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowExamples(!showExamples)}
          className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
          disabled={disabled}
        >
          <Lightbulb className="h-3 w-3" />
          Examples
        </button>
      </div>

      {/* Examples dropdown */}
      {showExamples && (
        <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-md space-y-2">
          <p className="text-xs font-medium text-blue-900 dark:text-blue-100">
            Example thoughts:
          </p>
          {EXAMPLE_THOUGHTS.map((example, index) => (
            <button
              key={index}
              onClick={() => handleExampleClick(example)}
              className="block w-full text-left text-xs p-2 bg-white dark:bg-gray-800 rounded border border-blue-200 dark:border-blue-800 hover:border-blue-400 dark:hover:border-blue-600 transition-colors"
              disabled={disabled}
            >
              "{example}"
            </button>
          ))}
        </div>
      )}

      {/* Textarea */}
      <div className="relative">
        <textarea
          id="thought-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={`w-full min-h-[120px] p-3 text-sm border rounded-md resize-y focus:outline-none focus:ring-2 transition-colors ${
            isTooLong
              ? "border-red-300 focus:ring-red-500"
              : isTooShort && charCount > 0
              ? "border-yellow-300 focus:ring-yellow-500"
              : isValid
              ? "border-green-300 focus:ring-green-500"
              : "border-gray-300 focus:ring-blue-500"
          } disabled:bg-gray-100 disabled:cursor-not-allowed dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100`}
          placeholder="Example: Today I learned that listening is more powerful than speaking. The insights I gained from silence taught me patience."
          maxLength={MAX_CHARS + 50} // Allow some overflow for UX, but we'll validate
        />

        {/* Character counter - positioned in bottom right of textarea */}
        <div
          className={`absolute bottom-2 right-2 text-xs font-mono ${getCharCountColor()}`}
        >
          {charCount} / {MAX_CHARS}
        </div>
      </div>

      {/* Validation message */}
      {getValidationMessage() && (
        <Alert variant={isTooLong ? "destructive" : "default"}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            {getValidationMessage()}
          </AlertDescription>
        </Alert>
      )}

      {/* Tips */}
      <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-md">
        <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
          <strong>Tips:</strong> Your thought will be encrypted and stored
          privately in your Google Drive. Consider sharing insights about
          personal growth, lessons learned, or meaningful observations. Be
          authentic and reflective.
        </p>
      </div>
    </div>
  );
}

export { MIN_CHARS, MAX_CHARS };

