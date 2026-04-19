import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { MateFinder } from "@/components/mate/MateFinder";

interface MatePageProps {
  isDark: boolean;
  onToggleDark: () => void;
}

export const MatePage: React.FC<MatePageProps> = ({ isDark, onToggleDark }) => {
  const navigate = useNavigate();
  const [inputs, setInputs] = useState<string[]>(["", "", "", ""]);

  return (
    <>
      <Header
        title="👥 구리 메이트"
        isDark={isDark}
        onToggleDark={onToggleDark}
        onBack={() => navigate("/")}
      />
      <div className="animate-in fade-in slide-in-from-right duration-500 pb-16">
        <MateFinder inputs={inputs} onChange={setInputs} />
      </div>
    </>
  );
};
