// ============================================================
// CHERRY BLOSSOM FEATURE — remove this file when done
// ============================================================
import React, { useState } from "react";

interface Wish { id: string; text: string; }

export const BlossomTree: React.FC = () => {
  const [showWishes, setShowWishes] = useState(false);
  const [wishes, setWishes] = useState<Wish[]>([]);

  const handleTreeClick = () => {
    const stored: Wish[] = JSON.parse(localStorage.getItem("sakura_wishes") || "[]");
    setWishes([...stored].reverse());
    setShowWishes(true);
  };

  return (
    <div className="w-full mt-2 mb-0">
      {/* 나무 — 콘텐츠 너비 안에서 중앙 정렬, z-index 1 */}
      <div className="flex justify-center" style={{ position: "relative", zIndex: 1 }}>
        <img
          src="/sakura-tree2.png"
          alt="벚꽃나무"
          draggable={false}
          onClick={handleTreeClick}
          style={{
            width: "min(85%, 300px)",
            display: "block",
            imageRendering: "pixelated",
            cursor: "pointer",
            maskImage: "linear-gradient(to bottom, transparent 0%, black 14%, black 100%)",
            WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 14%, black 100%)",
          }}
        />
      </div>

      {/*
        잔디 — background-image + background-size: min(85vw,300px) auto
        → 나무 이미지와 완전히 동일한 스케일로 렌더링되어 높이가 완벽히 일치.
        grass source: tree image y=700-1024 (1024×324), flat below the mound.
        displayed height = min(85vw,300px) × 324/1024 ≈ min(85vw,300px) × 0.3164
        margin-top = negative of that height → grass top aligns with tree's flat grass start.
      */}
      <div
        style={{
          width: "100vw",
          marginLeft: "calc(50% - 50vw)",
          height: "calc(min(85vw, 300px) * 0.3164)",
          marginTop: "calc(min(85vw, 300px) * -0.3164)",
          backgroundImage: "url('/sakura-grass-wide.png')",
          backgroundRepeat: "repeat-x",
          backgroundSize: "min(85vw, 300px) auto",
          backgroundPosition: "center top",
          imageRendering: "pixelated",
          position: "relative",
        }}
      >
        <p
          className="text-xs font-medium"
          style={{
            position: "absolute",
            top: "6px",
            left: "50%",
            transform: "translateX(-50%)",
            whiteSpace: "nowrap",
            color: "#fff",
            textShadow: "0 1px 4px rgba(0,0,0,0.7)",
            zIndex: 2,
          }}
        >
          🌸 나무를 눌러서 소원을 봐요
        </p>
      </div>

      {/* 소원 목록 바텀시트 */}
      {showWishes && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 backdrop-blur-sm"
          onClick={() => setShowWishes(false)}
        >
          <div
            className="bg-white rounded-t-3xl w-full max-w-2xl max-h-[65vh] flex flex-col shadow-2xl border-t-2 border-pink-200"
            style={{ animation: "slide-up 0.35s cubic-bezier(0.34,1.56,0.64,1)" }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-pink-100 shrink-0">
              <h2 className="font-bold text-pink-600 text-base">🌸 우리의 소원들</h2>
              <button onClick={() => setShowWishes(false)} className="text-slate-400 text-xl font-light">✕</button>
            </div>
            <div className="overflow-y-auto px-6 py-4 space-y-2 flex-1">
              {wishes.length === 0 ? (
                <p className="text-center text-slate-400 text-sm py-8">
                  아직 소원이 없어요.<br />벚꽃을 잡아서 소원을 빌어봐요! 🌸
                </p>
              ) : (
                wishes.map(w => (
                  <div key={w.id} className="bg-pink-50 rounded-2xl px-4 py-3 text-sm text-slate-700 border border-pink-100">
                    🌸 {w.text}
                  </div>
                ))
              )}
            </div>
            <div className="px-6 pb-6 pt-2 shrink-0">
              <button
                onClick={() => setShowWishes(false)}
                className="w-full py-3 rounded-2xl bg-pink-100 text-pink-600 font-bold text-sm active:scale-95 transition-all"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
