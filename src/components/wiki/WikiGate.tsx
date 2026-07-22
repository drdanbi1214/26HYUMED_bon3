import React, { useState } from "react";

const PIN = "121400";
const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"];
const UNLOCK_KEY = "wiki_unlocked";

/**
 * 실습나무위키 입구: 전화 키패드에 121400을 입력해야 열림.
 * 앱을 새로 켤 때마다 다시 입력해야 하지만(sessionStorage), 들어온 뒤에는
 * 새로고침하거나 과 문서를 오가도 다시 묻지 않음.
 */
export const WikiGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem(UNLOCK_KEY) === "1");

  if (unlocked) return <>{children}</>;

  return (
    <Keypad
      onUnlock={() => {
        sessionStorage.setItem(UNLOCK_KEY, "1");
        setUnlocked(true);
      }}
    />
  );
};

const Keypad: React.FC<{ onUnlock: () => void }> = ({ onUnlock }) => {
  const [input, setInput] = useState("");
  const [wrong, setWrong] = useState(false);

  const press = (k: string) => {
    setWrong(false);
    const next = input + k;
    if (next.length < PIN.length) {
      setInput(next);
      return;
    }
    if (next === PIN) {
      onUnlock();
    } else {
      setInput("");
      setWrong(true);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl shadow-slate-900/10">
      <p className="text-center text-sm font-bold text-slate-700 dark:text-slate-200">
        🌳 비밀번호를 입력하세요
      </p>

      <div className="flex justify-center gap-2.5 my-6">
        {Array.from({ length: PIN.length }).map((_, i) => (
          <span
            key={i}
            className={`w-3.5 h-3.5 rounded-full border transition-colors ${
              i < input.length
                ? "bg-[#00a495] border-[#00a495]"
                : "bg-transparent border-slate-300 dark:border-slate-600"
            }`}
          />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3 max-w-[240px] mx-auto">
        {KEYS.map(k => (
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
