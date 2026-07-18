import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { useEhrAccounts, type EhrServer } from "@/hooks/useEhrAccounts";
import { useToast } from "@/components/ui/Toast";

const PIN = "1214";
const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"];

interface EhrPageProps {
  isDark: boolean;
  onToggleDark: () => void;
}

/**
 * EHR 아이디: 전화 키패드(123456789*0#)에 1214를 입력하면
 * 서울/구리 서버별 공용계정 목록이 열림. 목록은 누구나 수정 가능(공유 DB).
 */
export const EhrPage: React.FC<EhrPageProps> = ({ isDark, onToggleDark }) => {
  const navigate = useNavigate();
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem("ehr_unlocked") === "1");

  return (
    <>
      <Header
        title="🖥️ EHR 아이디"
        isDark={isDark}
        onToggleDark={onToggleDark}
        onBack={() => navigate("/")}
      />

      <div className="space-y-6 animate-in fade-in slide-in-from-right duration-500 pb-16">
        {unlocked ? (
          <AccountBoxes />
        ) : (
          <Keypad
            onUnlock={() => {
              sessionStorage.setItem("ehr_unlocked", "1");
              setUnlocked(true);
            }}
          />
        )}
      </div>
    </>
  );
};

/** 전화 키패드. 4자리 입력 시 자동 확인 — 맞으면 onUnlock, 틀리면 초기화. */
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
        비밀번호를 입력하세요
      </p>

      {/* 입력 표시 (● 4칸) */}
      <div className="flex justify-center gap-3 my-6">
        {Array.from({ length: PIN.length }).map((_, i) => (
          <span
            key={i}
            className={`w-3.5 h-3.5 rounded-full border transition-colors ${
              i < input.length
                ? "bg-blue-600 border-blue-600"
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

/** 서울/구리 공용계정 박스 두 개. 누구나 ✏️로 수정 가능. */
const AccountBoxes: React.FC = () => {
  const { accounts, loading, error, saving, save, refetch } = useEhrAccounts();
  const toast = useToast();

  const handleSave = async (server: EhrServer, content: string): Promise<boolean> => {
    const err = await save(server, content);
    if (err) {
      toast.error(err);
      return false;
    }
    toast.success("저장했어요.");
    return true;
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[0, 1].map(i => (
          <div
            key={i}
            className="h-40 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/30 rounded-3xl p-8 text-center shadow-sm">
        <div className="text-4xl mb-4">😵</div>
        <p className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-1">
          계정 목록을 불러오지 못했어요
        </p>
        <p className="text-[11px] text-slate-400 mb-4">{error}</p>
        <button
          onClick={refetch}
          className="px-5 py-2 rounded-xl bg-blue-600 text-white text-sm font-bold shadow-md active:scale-95 transition-all"
        >
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <AccountBox
        server="seoul"
        title="서울"
        emoji="🏙️"
        value={accounts.seoul}
        saving={saving}
        onSave={handleSave}
      />
      <AccountBox
        server="guri"
        title="구리"
        emoji="🏥"
        value={accounts.guri}
        saving={saving}
        onSave={handleSave}
      />
      <p className="text-center text-[10px] text-slate-400 dark:text-slate-600">
        누구나 수정할 수 있어요. 사용 중인 계정은 표시해 두고, 다 쓴 계정은 돌려놔 주세요 🙏
      </p>
    </div>
  );
};

const AccountBox: React.FC<{
  server: EhrServer;
  title: string;
  emoji: string;
  value: string;
  saving: boolean;
  onSave: (server: EhrServer, content: string) => Promise<boolean>;
}> = ({ server, title, emoji, value, saving, onSave }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xl shadow-slate-900/10">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
        <span className="text-sm font-black text-slate-700 dark:text-slate-200">
          {emoji} {title}
        </span>
        {!editing && (
          <button
            onClick={() => {
              setDraft(value);
              setEditing(true);
            }}
            className="text-xs font-bold px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 active:scale-95 transition-all"
          >
            ✏️ 수정
          </button>
        )}
      </div>

      <div className="p-5">
        {editing ? (
          <div className="space-y-3">
            <textarea
              value={draft}
              onChange={e => setDraft(e.target.value)}
              rows={6}
              placeholder={"사용 가능한 공용계정을 적어주세요\n예) hy1234 / pw1234! — 사용중(홍길동)"}
              className="w-full px-3.5 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/30 transition-all resize-y"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setEditing(false)}
                disabled={saving}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 active:scale-95 transition-all"
              >
                취소
              </button>
              <button
                onClick={async () => {
                  const ok = await onSave(server, draft);
                  if (ok) setEditing(false);
                }}
                disabled={saving}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-md active:scale-95 transition-all disabled:opacity-50"
              >
                {saving ? "저장 중…" : "저장"}
              </button>
            </div>
          </div>
        ) : value.trim() ? (
          <pre className="whitespace-pre-wrap break-words font-sans text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
            {value}
          </pre>
        ) : (
          <p className="text-xs text-slate-400 text-center py-4">
            아직 등록된 계정이 없어요. ✏️ 수정을 눌러 추가해 주세요.
          </p>
        )}
      </div>
    </div>
  );
};
