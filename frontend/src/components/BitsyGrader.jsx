import React, { useState, useEffect } from "react";
import bitsy_default from "../assets/Bitsy_default.png";
import bitsy_1 from "../assets/Bitsy_1.png";
import bitsy_2 from "../assets/Bitsy_2.png";

export default function BitsyGrader({ feedback, isChecking }) {
  const [bitsyState, setBitsyState] = useState("idle");
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (isChecking) {
      setBitsyState("checking");
      setScale(1);

      // Animate bouncing while checking
      const interval = setInterval(() => {
        setScale((s) => (s === 1 ? 1.15 : 1));
      }, 300);

      return () => clearInterval(interval);
    }
  }, [isChecking]);

  useEffect(() => {
    if (feedback) {
      if (feedback.valid) {
        setBitsyState("happy");
        // Happy animation - pulse
        let count = 0;
        const interval = setInterval(() => {
          count++;
          setScale(1 + Math.sin(count * 0.5) * 0.15);
          if (count > 20) clearInterval(interval);
        }, 50);
        return () => clearInterval(interval);
      } else {
        setBitsyState("thinking");
        // Thinking animation - slow bounce
        let count = 0;
        const interval = setInterval(() => {
          count++;
          setScale(1 + Math.sin(count * 0.3) * 0.1);
        }, 80);
        return () => clearInterval(interval);
      }
    }
  }, [feedback]);

  const getBitsyImage = () => {
    if (isChecking || bitsyState === "checking") return bitsy_1;
    if (feedback?.valid) return bitsy_2;
    if (bitsyState === "thinking") return bitsy_1;
    return bitsy_default;
  };

  const getLabel = () => {
    if (isChecking) return "Checking...";
    if (feedback?.valid) return "Perfect! 🎉";
    if (feedback && !feedback.valid) return "Almost there!";
    return "";
  };

  return (
    <div className="flex flex-col items-center gap-2 py-4 px-3 bg-gradient-to-b from-purple-50 to-blue-50 rounded-xl border border-purple-200">
      <div
        className="transition-transform duration-100"
        style={{ transform: `scale(${scale})` }}
      >
        <img
          src={getBitsyImage()}
          alt="Bitsy"
          className="w-24 h-24 object-contain drop-shadow-lg"
        />
      </div>

      <p className="text-sm font-bold text-purple-700">{getLabel()}</p>

      {feedback && !feedback.valid && feedback.fix && (
        <p className="text-xs text-center text-purple-600 leading-snug max-w-xs">
          💭 {feedback.fix}
        </p>
      )}

      {feedback?.valid && (
        <p className="text-xs text-center text-green-600 font-semibold">
          Ready for the next challenge?
        </p>
      )}
    </div>
  );
}
