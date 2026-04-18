import React, { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { useToast } from "@/components/ui/Toast";
import { useChat } from "@/hooks/useChat";
import { useAnonId } from "@/hooks/useAnonId";
import { isSupabaseConfigured } from "@/lib/supabase";

/** 한 메시지 최대 길이 (DB text 컬럼 보호 + UX) */
const MAX_LENGTH = 500;

/**
 * 익명 채팅방. 페이지가 마운트된 동안만 realtime 구독.
 */
export const ChatRoom: React.FC = () => {
  const myId = useAnonId();
  const { messages, send, loading, error } = useChat(isSupabaseConfigured, myId);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const toast = useToast();

  // 새 메시지 올 때마다 스크롤 맨 아래로
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 훅에서 올라온 에러는 한 번씩 토스트로 표시
  useEffect(() => {
    if (error) toast.error(`채팅 오류: ${error}`);
    // toast는 레퍼런스가 안정적이지만 린트가 요구하니 포함
  }, [error, toast]);

  const handleSend = async () => {
    const t = input.trim();
    if (!t || sending) return;
    if (t.length > MAX_LENGTH) {
      toast.error(`메시지가 너무 깁니다 (최대 ${MAX_LENGTH}자)`);
      return;
    }
    if (!isSupabaseConfigured) {
      toast.error("Supabase가 설정되지 않아 전송할 수 없어요.");
      return;
    }
    setSending(true);
    setInput("");
    try {
      await send(t);
    } finally {
      setSending(false);
    }
  };

  const over = input.length > MAX_LENGTH;
  const countColor = over
    ? "text-red-500"
    : input.length > MAX_LENGTH * 0.8
    ? "text-amber-500"
    : "text-slate-400";

  return (
    <div className="flex flex-col h-full animate-in slide-in-from-right duration-300">
      <div className="flex-1 overflow-y-auto px-1 py-4 space-y-4 no-scrollbar pb-4 min-h-[200px]">
        {loading && messages.length === 0 ? (
          <ChatSkeleton />
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-4xl mb-3">💬</div>
            <p className="text-sm font-medium text-slate-400">
              아직 메시지가 없어요.
              <br />
              첫 메시지를 남겨보세요!
            </p>
          </div>
        ) : (
          messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.sender_id === myId ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] px-4 py-2.5 rounded-2xl shadow-sm text-sm whitespace-pre-wrap break-words ${
                  msg.sender_id === myId
                    ? "bg-blue-600 text-white rounded-br-none"
                    : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-100 dark:border-slate-700 rounded-bl-none"
                }`}
              >
                {msg.text}
                <div className="text-[9px] mt-1 opacity-60 text-right">
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="p-4 bg-slate-50 dark:bg-[#0c1220]">
        <div
          className={`flex gap-2 p-2 bg-white dark:bg-slate-900 rounded-2xl border shadow-xl transition-colors ${
            over ? "border-red-400 dark:border-red-500/60" : "border-slate-200 dark:border-slate-800"
          }`}
        >
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={isSupabaseConfigured ? "메시지 입력..." : "Supabase 미설정"}
            disabled={sending || !isSupabaseConfigured}
            maxLength={MAX_LENGTH + 100 /* 약간 여유 두되 전송 시점에 검증 */}
            className="flex-1 px-4 py-3 bg-transparent outline-none text-sm disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={sending || !input.trim() || over || !isSupabaseConfigured}
            className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="보내기"
          >
            {sending ? (
              <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <Icon size={18}>
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </Icon>
            )}
          </button>
        </div>
        <div className="flex justify-end mt-1 pr-1">
          <span className={`text-[10px] font-medium ${countColor}`}>
            {input.length} / {MAX_LENGTH}
          </span>
        </div>
      </div>
    </div>
  );
};

/** 로딩 중 대신 보여주는 채팅 버블 모양의 스켈레톤 */
const ChatSkeleton: React.FC = () => (
  <div className="space-y-4 px-2 animate-pulse">
    {[0, 1, 2].map(i => (
      <div key={i} className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}>
        <div
          className={`h-10 w-40 rounded-2xl ${
            i % 2 === 0 ? "bg-slate-200 dark:bg-slate-800" : "bg-blue-200 dark:bg-blue-900/40"
          }`}
        />
      </div>
    ))}
  </div>
);
