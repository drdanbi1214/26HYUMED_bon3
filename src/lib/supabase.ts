import { createClient } from "@supabase/supabase-js";

// env에서 키 로드. .env.local 에 값 있어야 함.
// 값이 없으면 빌드는 되지만 런타임에서 Supabase 호출이 실패함.
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/**
 * Supabase가 정상적으로 설정됐는지 여부.
 * UI에서 이 값을 보고 "설정 필요" 배너를 띄움.
 */
export const isSupabaseConfigured: boolean = Boolean(url && anonKey);

if (!isSupabaseConfigured) {
  // eslint-disable-next-line no-console
  console.warn(
    "[supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY 미설정. .env.local 확인."
  );
}

// 미설정이어도 crash 안 나도록 빈 문자열로 초기화.
// 실제 네트워크 호출을 하면 실패하지만 UI가 로드는 됨.
export const supabase = createClient(url ?? "", anonKey ?? "");
