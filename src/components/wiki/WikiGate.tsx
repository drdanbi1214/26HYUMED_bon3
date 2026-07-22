import React, { useState } from "react";
import { PinKeypad } from "@/components/ui/PinKeypad";

const PIN = "121400";
const UNLOCK_KEY = "wiki_unlocked";

/**
 * 실습나무위키 입구: 전화 키패드에 121400을 입력해야 열림.
 * 앱을 새로 켤 때마다 다시 입력해야 하지만(sessionStorage), 들어온 뒤에는
 * 새로고침하거나 문서를 오가도 다시 묻지 않음.
 */
export const WikiGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem(UNLOCK_KEY) === "1");

  if (unlocked) return <>{children}</>;

  return (
    <PinKeypad
      pin={PIN}
      label="🌳 비밀번호를 입력하세요"
      accent="#00a495"
      onUnlock={() => {
        sessionStorage.setItem(UNLOCK_KEY, "1");
        setUnlocked(true);
      }}
    />
  );
};
