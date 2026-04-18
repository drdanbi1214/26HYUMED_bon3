import { useState } from "react";

/**
 * 익명 채팅용 랜덤 유저 ID. localStorage에 1회 생성 후 재사용.
 */
export function useAnonId() {
  const [id] = useState(() => {
    let v = localStorage.getItem("anon_user_id");
    if (!v) {
      v = Math.random().toString(36).substring(2, 11);
      localStorage.setItem("anon_user_id", v);
    }
    return v;
  });
  return id;
}
