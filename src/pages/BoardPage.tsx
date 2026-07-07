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
    // 메신저 레이아웃: 전체 높이를 화면에 고정해서 헤더/입력창은 그대로 두고
    // 가운데 메시지 목록만 스크롤되게 한다. (4rem = Shell의 상하 패딩)
    <div className="flex flex-col h-[calc(100dvh-4rem)]">
      <Header
        title="💬 익명 게시판"
        isDark={isDark}
        onToggleDark={onToggleDark}
        onBack={() => navigate("/")}
      />
      <ChatRoom />
    </div>
  );
};
