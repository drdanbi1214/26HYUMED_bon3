import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { ChatMessage } from "@/types";

/**
 * messages 테이블을 구독. enabled=false면 아무것도 안 함 (다른 페이지에서 채널 안 열도록).
 */
export function useChat(enabled: boolean, senderId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let active = true;
    setLoading(true);
    setError(null);

    (async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .order("created_at", { ascending: true })
        .limit(100);
      if (!active) return;
      if (error) setError(error.message);
      else if (data) setMessages(data as ChatMessage[]);
      setLoading(false);
    })();

    const channel = supabase
      .channel("messages_realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        payload => {
          setMessages(prev => [...prev, payload.new as ChatMessage]);
        }
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [enabled]);

  const send = useCallback(
    async (text: string) => {
      const t = text.trim();
      if (!t) return;
      const { error } = await supabase.from("messages").insert([{ text: t, sender_id: senderId }]);
      if (error) setError(error.message);
    },
    [senderId]
  );

  return { messages, send, loading, error };
}
