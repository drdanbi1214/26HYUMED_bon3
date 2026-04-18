import React from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { ChatRoom } from "@/components/chat/ChatRoom";

interface BoardPageProps {
  isDark: boolean;
  onToggleDark: () => void;
}

export const BoardPage: React.FC<BoardPageProps> = ({ isDark, onToggleDark }) => {
  const navigate = useNavigate();
  return (
    <>
      <Header
        title="💬 익명 게시판"
        isDark={isDark}
        onToggleDark={onToggleDark}
        onBack={() => navigate("/")}
      />
      <ChatRoom />
    </>
  );
};
