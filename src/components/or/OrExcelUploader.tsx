import React, { useRef, useState } from "react";
import type { OrCase } from "@/utils/orSchedule";

interface OrExcelUploaderProps {
  onParsed: (cases: OrCase[], fileName: string) => void;
  /** 이미 올린 파일 이름 (버튼 라벨용) */
  currentFileName?: string;
  /** 버튼 라벨 (기본: 배정 엑셀 파일 올리기) */
  label?: string;
}

/**
 * 배정 엑셀 업로드 공용 컴포넌트.
 * 일반/비밀번호 걸린 xlsx를 구분해서 처리하고, 파싱 결과만 onParsed로 넘긴다.
 */
export const OrExcelUploader: React.FC<OrExcelUploaderProps> = ({
  onParsed,
  currentFileName,
  label = "배정 엑셀 파일 올리기 (.xlsx)",
}) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  // 비밀번호 걸린 파일이면 원본 버퍼를 들고 있다가 비밀번호 입력 후 해독
  const [pendingBuf, setPendingBuf] = useState<ArrayBuffer | null>(null);
  const [pendingName, setPendingName] = useState("");
  const [pw, setPw] = useState("");
  const [pwBusy, setPwBusy] = useState(false);

  const parseBuffer = async (buf: ArrayBuffer, name: string) => {
    const { parseOrExcel } = await import("@/utils/orExcel");
    const parsed = await parseOrExcel(buf);
    if (parsed.length === 0) {
      setErr("수술 스케줄을 찾지 못했어요. '수술일자'·'집도의' 열이 있는 엑셀(.xlsx)인지 확인해주세요.");
      return;
    }
    setPendingBuf(null);
    setPw("");
    setErr("");
    onParsed(parsed, name);
  };

  const handleFile = async (f: File | null | undefined) => {
    if (!f) return;
    setBusy(true);
    setErr("");
    try {
      const buf = await f.arrayBuffer();
      const head = new Uint8Array(buf.slice(0, 4));
      const isZip = head[0] === 0x50 && head[1] === 0x4b; // 일반 xlsx = zip
      const isCfb = head[0] === 0xd0 && head[1] === 0xcf && head[2] === 0x11 && head[3] === 0xe0; // 암호화 xlsx / 구형 xls
      if (isCfb) {
        setPendingBuf(buf);
        setPendingName(f.name);
        setPw("");
        return;
      }
      if (!isZip) {
        setErr("엑셀(.xlsx) 형식이 아니에요. 병원 시스템에서 받은 파일이라면 엑셀에서 연 뒤 '다른 이름으로 저장 → .xlsx'로 저장해서 올려주세요.");
        return;
      }
      await parseBuffer(buf, f.name);
    } catch (e) {
      const detail = e instanceof Error && e.message ? ` (${e.message})` : "";
      setErr(`파일을 읽지 못했어요. .xlsx 파일이 맞는지 확인해주세요.${detail}`);
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const submitPassword = async () => {
    if (!pendingBuf || !pw || pwBusy) return;
    setPwBusy(true);
    setErr("");
    try {
      const { decryptXlsx } = await import("@/utils/orExcel");
      const decrypted = await decryptXlsx(pendingBuf, pw);
      await parseBuffer(decrypted, pendingName);
    } catch (e) {
      console.error("[or-schedule] 해독 실패:", e);
      const msg = e instanceof Error ? e.message : "";
      // 비밀번호가 틀리면 해독 결과가 깨진 zip이 돼서 "central directory" 에러로도 나타난다
      setErr(
        /password|central directory|zip file/i.test(msg)
          ? "비밀번호가 맞지 않아요. 다시 입력해주세요."
          : "이 파일은 열 수 없어요. 엑셀에서 비밀번호를 해제한 뒤 .xlsx로 다시 저장해서 올려주세요.",
      );
    } finally {
      setPwBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <input
        ref={fileRef}
        type="file"
        accept=".xlsx"
        className="hidden"
        onChange={e => handleFile(e.target.files?.[0])}
      />
      <button
        onClick={() => fileRef.current?.click()}
        disabled={busy}
        className="w-full py-4 rounded-2xl border-2 border-dashed border-blue-300 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20 text-sm font-bold text-blue-600 dark:text-blue-400 active:scale-[0.98] transition-all disabled:opacity-60"
      >
        {busy ? "읽는 중..." : currentFileName ? `📄 ${currentFileName} · 다른 파일 올리기` : `📄 ${label}`}
      </button>

      {err && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs p-3 rounded-xl">{err}</div>
      )}

      {pendingBuf && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-3">
          <div className="text-center">
            <div className="text-3xl mb-2">🔒</div>
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">비밀번호가 걸린 파일이에요</p>
            <p className="text-[11px] text-slate-400 mt-1">
              {pendingName}의 열기 비밀번호를 입력해주세요. 비밀번호는 이 기기에서만 사용되고 어디에도 전송되지 않아요.
            </p>
          </div>
          <div className="flex gap-2">
            <input
              type="password"
              value={pw}
              onChange={e => setPw(e.target.value)}
              onKeyDown={e => e.key === "Enter" && submitPassword()}
              placeholder="엑셀 비밀번호"
              className="flex-1 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/30 transition-all shadow-sm text-sm"
            />
            <button
              onClick={submitPassword}
              disabled={pwBusy || !pw}
              className="px-5 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white text-sm font-bold shadow-md active:scale-95 transition-all disabled:opacity-50"
            >
              {pwBusy ? "여는 중..." : "열기"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
