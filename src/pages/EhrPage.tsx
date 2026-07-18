import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import {
  useEhrAccounts,
  type EhrServer,
  type EhrAccount,
  type EhrAccountFields,
} from "@/hooks/useEhrAccounts";
import { useToast } from "@/components/ui/Toast";

const PIN = "1214";
const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"];

interface EhrPageProps {
  isDark: boolean;
  onToggleDark: () => void;
}

/**
 * EHR 아이디: 전화 키패드(123456789*0#)에 1214를 입력하면
 * 서울/구리 서버별 공용계정 목록이 열림. 보안상 들어올 때마다 매번 입력해야 함.
 */
export const EhrPage: React.FC<EhrPageProps> = ({ isDark, onToggleDark }) => {
  const navigate = useNavigate();
  const [unlocked, setUnlocked] = useState(false);

  return (
    <>
      <Header
        title="🖥️ EHR 아이디"
        isDark={isDark}
        onToggleDark={onToggleDark}
        onBack={() => navigate("/")}
      />

      <div className="space-y-6 animate-in fade-in slide-in-from-right duration-500 pb-16">
        {unlocked ? <AccountBoxes /> : <Keypad onUnlock={() => setUnlocked(true)} />}
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

/** "7/18 14:30" 형식으로 수정 시각 표시 */
const fmtTime = (iso: string) => {
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${d.getMonth() + 1}/${d.getDate()} ${hh}:${mm}`;
};

/** 서울/구리 공용계정 박스 두 개. ➕ 추가 / 계정별 ✏️ 수정. */
const AccountBoxes: React.FC = () => {
  const { accounts, loading, error, saving, addAccount, updateAccount, deleteAccount, refetch } =
    useEhrAccounts();
  const toast = useToast();

  const run = async (p: Promise<string | null>, okMsg: string): Promise<boolean> => {
    const err = await p;
    if (err) {
      toast.error(err);
      return false;
    }
    toast.success(okMsg);
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

  const common = {
    saving,
    onAdd: (server: EhrServer, f: EhrAccountFields) => run(addAccount(server, f), "추가했어요."),
    onUpdate: (id: string, f: EhrAccountFields) => run(updateAccount(id, f), "수정했어요."),
    onDelete: (id: string) => run(deleteAccount(id), "삭제했어요."),
  };

  return (
    <div className="space-y-4">
      <AccountBox server="seoul" title="서울" emoji="🏙️" list={accounts.seoul} {...common} />
      <AccountBox server="guri" title="구리" emoji="🏥" list={accounts.guri} {...common} />
      <p className="text-center text-[10px] text-slate-400 dark:text-slate-600">
        누구나 추가·수정할 수 있어요. 수정 시각을 보고 최신 계정인지 확인해 주세요 🙏
      </p>
    </div>
  );
};

const AccountBox: React.FC<{
  server: EhrServer;
  title: string;
  emoji: string;
  list: EhrAccount[];
  saving: boolean;
  onAdd: (server: EhrServer, fields: EhrAccountFields) => Promise<boolean>;
  onUpdate: (id: string, fields: EhrAccountFields) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
}> = ({ server, title, emoji, list, saving, onAdd, onUpdate, onDelete }) => {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xl shadow-slate-900/10">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
        <span className="text-sm font-black text-slate-700 dark:text-slate-200">
          {emoji} {title}
        </span>
        {!adding && (
          <button
            onClick={() => {
              setAdding(true);
              setEditingId(null);
            }}
            className="text-xs font-bold px-3 py-1.5 rounded-lg bg-blue-600 text-white shadow-sm active:scale-95 transition-all"
          >
            ➕ 추가
          </button>
        )}
      </div>

      <div className="p-4 space-y-3">
        {adding && (
          <AccountForm
            saving={saving}
            submitLabel="추가"
            onSubmit={async f => {
              const ok = await onAdd(server, f);
              if (ok) setAdding(false);
              return ok;
            }}
            onCancel={() => setAdding(false)}
          />
        )}

        {list.length === 0 && !adding && (
          <p className="text-xs text-slate-400 text-center py-4">
            아직 등록된 계정이 없어요. ➕ 추가를 눌러 등록해 주세요.
          </p>
        )}

        {list.map(acc =>
          editingId === acc.id ? (
            <AccountForm
              key={acc.id}
              initial={acc}
              saving={saving}
              submitLabel="저장"
              onSubmit={async f => {
                const ok = await onUpdate(acc.id, f);
                if (ok) setEditingId(null);
                return ok;
              }}
              onCancel={() => setEditingId(null)}
              onDelete={async () => {
                if (!window.confirm("이 계정을 삭제할까요?")) return;
                const ok = await onDelete(acc.id);
                if (ok) setEditingId(null);
              }}
            />
          ) : (
            <div
              key={acc.id}
              className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 px-4 py-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1 text-sm text-slate-700 dark:text-slate-200">
                  <p className="break-all">
                    <span className="text-[11px] font-bold text-slate-400 mr-1.5">이름</span>
                    <span className="font-bold">{acc.name || "—"}</span>
                  </p>
                  <p className="break-all">
                    <span className="text-[11px] font-bold text-slate-400 mr-1.5">ID</span>
                    <span className="font-bold">{acc.loginId || "—"}</span>
                  </p>
                  <p className="break-all">
                    <span className="text-[11px] font-bold text-slate-400 mr-1.5">비밀번호</span>
                    {acc.password || "—"}
                  </p>
                  <p className="break-all">
                    <span className="text-[11px] font-bold text-slate-400 mr-1.5">인증서</span>
                    {acc.cert || "—"}
                  </p>
                  <p className="break-all">
                    <span className="text-[11px] font-bold text-slate-400 mr-1.5">생년월일</span>
                    {acc.birth || "—"}
                  </p>
                  {acc.note.trim() && (
                    <p className="whitespace-pre-wrap break-words text-amber-700 dark:text-amber-400">
                      <span className="text-[11px] font-bold text-amber-600 dark:text-amber-500 mr-1.5">
                        ⚠️ 주의사항
                      </span>
                      {acc.note}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => {
                    setEditingId(acc.id);
                    setAdding(false);
                  }}
                  className="shrink-0 text-xs font-bold px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 active:scale-95 transition-all"
                >
                  ✏️ 수정
                </button>
              </div>
              <p className="mt-2 text-[10px] text-slate-400 dark:text-slate-500 text-right">
                🕐 {fmtTime(acc.updatedAt)} 기준
              </p>
            </div>
          )
        )}
      </div>
    </div>
  );
};

/** 이름/ID/비밀번호/인증서/생년월일/주의사항 입력 폼. 추가·수정 겸용(수정 시 onDelete로 삭제 버튼 표시). */
const AccountForm: React.FC<{
  initial?: EhrAccountFields;
  saving: boolean;
  submitLabel: string;
  onSubmit: (fields: EhrAccountFields) => Promise<boolean>;
  onCancel: () => void;
  onDelete?: () => void;
}> = ({ initial, saving, submitLabel, onSubmit, onCancel, onDelete }) => {
  const [name, setName] = useState(initial?.name ?? "");
  const [loginId, setLoginId] = useState(initial?.loginId ?? "");
  const [password, setPassword] = useState(initial?.password ?? "");
  const [cert, setCert] = useState(initial?.cert ?? "");
  const [birth, setBirth] = useState(initial?.birth ?? "");
  const [note, setNote] = useState(initial?.note ?? "");

  const inputCls =
    "w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/30 transition-all";

  return (
    <div className="rounded-2xl border border-blue-200 dark:border-blue-900/40 bg-blue-50/40 dark:bg-blue-900/10 p-4 space-y-2.5">
      {(
        [
          ["이름", name, setName, "예) 홍길동"],
          ["ID", loginId, setLoginId, "예) hyumc1234"],
          ["비밀번호", password, setPassword, "예) pw1234!"],
          ["인증서", cert, setCert, "예) 인증서 비밀번호"],
          ["생년월일", birth, setBirth, "예) 991214"],
        ] as const
      ).map(([label, value, set, placeholder]) => (
        <label key={label} className="block">
          <span className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
            {label}
          </span>
          <input
            type="text"
            value={value}
            onChange={e => set(e.target.value)}
            placeholder={placeholder}
            className={inputCls}
          />
        </label>
      ))}

      <label className="block">
        <span className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
          ⚠️ 주의사항
        </span>
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          rows={3}
          placeholder={"예) 3/20까지만 사용 가능\n예) 인증서 로그인만 됨"}
          className={`${inputCls} resize-y`}
        />
      </label>

      <div className="flex items-center pt-1">
        {onDelete && (
          <button
            onClick={onDelete}
            disabled={saving}
            className="text-xs font-bold px-3 py-2 rounded-xl text-red-500 border border-red-200 dark:border-red-900/40 active:scale-95 transition-all disabled:opacity-50"
          >
            🗑️ 삭제
          </button>
        )}
        <div className="flex gap-2 ml-auto">
          <button
            onClick={onCancel}
            disabled={saving}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 active:scale-95 transition-all"
          >
            취소
          </button>
          <button
            onClick={() => onSubmit({ name, loginId, password, cert, birth, note })}
            disabled={saving || !loginId.trim()}
            className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-md active:scale-95 transition-all disabled:opacity-50"
          >
            {saving ? "저장 중…" : submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
