import React, { useState } from "react";

/**
 * 전화 키패드 PIN 입력 (EHR/위키/건의사항 공용).
 * pin 길이만큼 ● 표시, 다 입력되면 자동 확인 — 맞으면 onUnlock, 틀리면 초기화.
 */
export const PinKeypad: React.FC<{
  pin: string;
  label?: string;
  accent?: string; // 채워진 ● 색 (기본 파랑)
  onUnlock: () => void;
}> = ({ pin, label = "비밀번호를 입력하세요", accent = "#2563eb", onUnlock }) => {
  const [input, setInput] = useState("");
  const [wrong, setWrong] = useState(false);

  const press = (k: string) => {
    setWrong(false);
    const next = input + k;
    if (next.length < pin.length) {
      setInput(next);
      return;
    }
    if (next === pin) {
      setInput("");
      onUnlock();
    } else {
      setInput("");
      setWrong(true);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl shadow-slate-900/10">
      <p className="text-center text-sm font-bold text-slate-700 dark:text-slate-200">{label}</p>

      <div className="flex justify-center gap-2.5 my-6 flex-wrap">
        {Array.from({ length: pin.length }).map((_, i) => (
          <span
            key={i}
            className="w-3.5 h-3.5 rounded-full border border-slate-300 dark:border-slate-600 transition-colors"
            style={
              i < input.length
                ? { background: accent, borderColor: accent }
                : undefined
            }
          />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3 max-w-[240px] mx-auto">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"].map(k => (
          <button
            key={k}
            onClick={() => press(k)}
            className="aspect-square rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xl font-bold text-slate-700 dark:text-slate-200 active:scale-90 active:bg-slate-200 dark:active:bg-slate-700 transition-all"
          >
            {k}
          </button>
        ))}
      </div>

      {wrong && (
        <p className="mt-5 text-center text-xs font-bold text-red-500">
          비밀번호가 틀렸어요. 다시 입력해 주세요.
        </p>
      )}
    </div>
  );
};
