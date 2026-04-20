// ============================================================
// CHERRY BLOSSOM FEATURE — easy to remove later:
// Delete this file + BlossomTree.tsx + BlossomContext.tsx
// + useTheme.ts, revert App.tsx/Header.tsx/HomePage.tsx
// ============================================================
import React, { useState, useEffect, useCallback, useRef } from "react";

// 두 꽃잎 이미지: 투명 배경 PNG, 그냥 img 태그로 표시
const PETAL_SRCS = ["/petal-flower.png", "/petal-leaf.png"];

function PetalImg({ size, src }: { size: number; src: string }) {
  return (
    <img
      src={src}
      alt=""
      draggable={false}
      style={{
        width: size,
        height: size,
        display: "block",
        imageRendering: "pixelated",
        userSelect: "none",
      }}
    />
  );
}

interface SmallPetal {
  id: number;
  x: number;
  size: number;
  delay: number;
  duration: number;
  src: string;
  rotation: number;
}

// 작은 꽃잎: 한 번만 생성 (정적)
const SMALL_PETALS: SmallPetal[] = Array.from({ length: 28 }, (_, i) => ({
  id: i,
  x: Math.random() * 97,
  size: 14 + Math.random() * 12,          // 14–26px (적당히 보이게)
  delay: -(Math.random() * 25),
  duration: 16 + Math.random() * 10,      // 16–26s 느리고 아련하게
  src: PETAL_SRCS[Math.floor(Math.random() * 2)], // 두 이미지 랜덤 혼합
  rotation: Math.random() * 360,
}));

interface LargePetal {
  id: number;
  x: number;
  size: number;
  duration: number;
  src: string;
}

interface Wish { id: string; text: string; }

export const CherryBlossom: React.FC = () => {
  const [largePetals, setLargePetals] = useState<LargePetal[]>([]);
  const [wishModal, setWishModal] = useState(false);
  const [wishInput, setWishInput] = useState("");
  const [wishSaved, setWishSaved] = useState(false);
  const spawnerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const spawnOne = useCallback(() => {
    const id = Date.now() + Math.random();
    setLargePetals(prev => {
      if (prev.length >= 2) return prev;
      return [...prev, {
        id,
        x: 5 + Math.random() * 86,
        size: 48 + Math.random() * 16,    // 48–64px 크고 빛남
        duration: 3.5 + Math.random() * 2,
        src: PETAL_SRCS[Math.floor(Math.random() * 2)],
      }];
    });
  }, []);

  const handleFallEnd = useCallback((id: number) => {
    setLargePetals(prev => prev.filter(p => p.id !== id));
    spawnerRef.current = setTimeout(spawnOne, 8000 + Math.random() * 12000);
  }, [spawnOne]);

  useEffect(() => {
    const t1 = setTimeout(spawnOne, 2000 + Math.random() * 2000);
    const t2 = setTimeout(spawnOne, 11000 + Math.random() * 6000);
    return () => {
      clearTimeout(t1); clearTimeout(t2);
      if (spawnerRef.current) clearTimeout(spawnerRef.current);
    };
  }, [spawnOne]);

  const handleLargePetalClick = useCallback((e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (wishModal) return;
    setLargePetals(prev => prev.filter(p => p.id !== id));
    setWishModal(true);
    setWishSaved(false);
    setWishInput("");
    setTimeout(spawnOne, 10000 + Math.random() * 8000);
  }, [wishModal, spawnOne]);

  const saveWish = useCallback(() => {
    if (!wishInput.trim()) return;
    const stored: Wish[] = JSON.parse(localStorage.getItem("sakura_wishes") || "[]");
    stored.push({ id: Date.now().toString(), text: wishInput.trim() });
    localStorage.setItem("sakura_wishes", JSON.stringify(stored));
    setWishSaved(true);
    setTimeout(() => setWishModal(false), 1800);
  }, [wishInput]);

  return (
    <>
      {/* 꽃잎 레이어 — z-10 */}
      <div
        className="fixed inset-0 overflow-hidden pointer-events-none"
        style={{ zIndex: 10 }}
        aria-hidden="true"
      >
        {/* 작은 꽃잎: 느림, 못 잡음 */}
        {SMALL_PETALS.map(p => (
          <div
            key={p.id}
            style={{
              position: "absolute",
              left: `${p.x}vw`,
              top: "-30px",
              pointerEvents: "none",
              animation: `sakura-fall ${p.duration}s ${p.delay}s linear infinite`,
              transform: `rotate(${p.rotation}deg)`,
            }}
          >
            <PetalImg size={p.size} src={p.src} />
          </div>
        ))}

        {/* 큰 꽃잎: 빠름, 잡기 가능, 빛남 */}
        {largePetals.map(p => (
          <div
            key={p.id}
            onClick={e => handleLargePetalClick(e, p.id)}
            onAnimationEnd={() => handleFallEnd(p.id)}
            style={{
              position: "absolute",
              left: `${p.x}vw`,
              top: "-30px",
              pointerEvents: "auto",
              cursor: "pointer",
              animation: `sakura-fall-large ${p.duration}s linear 1 forwards`,
              filter: "drop-shadow(0 0 8px #ff9ab0bb) drop-shadow(0 0 16px #ffc2d166)",
              zIndex: 12,
            }}
          >
            <PetalImg size={p.size} src={p.src} />
          </div>
        ))}
      </div>

      {/* 소원 모달 */}
      {wishModal && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm"
          style={{ zIndex: 60 }}
          onClick={() => setWishModal(false)}
        >
          <div
            className="bg-white rounded-3xl p-6 mx-5 max-w-xs w-full shadow-2xl border-2 border-pink-200"
            style={{ animation: "petal-bloom 0.4s cubic-bezier(0.34,1.56,0.64,1)" }}
            onClick={e => e.stopPropagation()}
          >
            <div className="text-center mb-4">
              <div className="flex justify-center mb-3">
                <PetalImg size={52} src="/petal-flower.png" />
              </div>
              <p className="font-bold text-pink-600 text-sm leading-relaxed">
                벚꽃을 잡으면 소원이 이루어진대요!<br />
                올해의 소원은 뭔가요?
              </p>
            </div>
            {wishSaved ? (
              <div className="text-center py-3">
                <p className="text-pink-500 font-bold">✨ 소원이 하늘에 닿았어요!</p>
              </div>
            ) : (
              <>
                <input
                  type="text"
                  value={wishInput}
                  onChange={e => setWishInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && saveWish()}
                  placeholder="소원을 적어보세요..."
                  maxLength={50}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-pink-200 focus:border-pink-400 outline-none text-sm text-slate-700 bg-pink-50/60"
                  autoFocus
                />
                <button
                  onClick={saveWish}
                  disabled={!wishInput.trim()}
                  className="mt-3 w-full py-3 rounded-2xl bg-gradient-to-r from-pink-400 to-rose-400 text-white font-bold text-sm disabled:opacity-40 active:scale-95 transition-all shadow-md"
                >
                  소원 빌기 🌸
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};
