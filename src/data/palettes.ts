// 기본 모드(야구/벚꽃 사진 테마 없음) 전용 색 팔레트. 설정 → 테마에서 선택.
// 다크모드/사진 테마에서는 적용되지 않는다.
export type PaletteId = "gray" | "pink";

export interface Palette {
  label: string;
  /** 설정 화면 미리보기 점 5개 */
  swatches: string[];
  /** 홈 그리드 버튼에 순환 적용되는 5색 (배경+글자색) */
  btns: string[];
  /** 돋보기 버튼 배경 */
  searchBtn: string;
  /** MY 버튼 배경 */
  myBtn: string;
  /** D-day 카드 그라데이션+테두리 */
  dday: string;
  /** D-day 숫자 색 */
  ddayNum: string;
  /** 페이지 배경 틴트 (라이트 모드) */
  page: string;
  /** 버튼 그림자 */
  shadow: string;
}

export const PALETTES: Record<PaletteId, Palette> = {
  gray: {
    label: "블루그레이",
    swatches: ["#75909C", "#9FB5C4", "#C9D5DB", "#DEE6E9", "#E6E6E6"],
    btns: [
      "bg-[#75909C] text-white",
      "bg-[#9FB5C4] text-white",
      "bg-[#C9D5DB] text-slate-700",
      "bg-[#DEE6E9] text-slate-700",
      "bg-[#E6E6E6] text-slate-700",
    ],
    searchBtn: "bg-[#75909C]",
    myBtn: "bg-[#9FB5C4]",
    dday: "from-[#DEE6E9] to-[#C9D5DB] border-[#C9D5DB]",
    ddayNum: "text-[#5f7987]",
    page: "bg-[#E8EDF0]",
    shadow: "shadow-[#75909C]/25",
  },
  pink: {
    label: "핑크",
    swatches: ["#D9A0AC", "#DBAEB6", "#F0C3CD", "#F3D8DC", "#F8EDEE"],
    btns: [
      "bg-[#D9A0AC] text-white",
      "bg-[#DBAEB6] text-white",
      "bg-[#F0C3CD] text-[#7d4b56]",
      "bg-[#F3D8DC] text-[#7d4b56]",
      "bg-[#F8EDEE] text-[#7d4b56]",
    ],
    searchBtn: "bg-[#D9A0AC]",
    myBtn: "bg-[#DBAEB6]",
    dday: "from-[#F3D8DC] to-[#F0C3CD] border-[#F0C3CD]",
    ddayNum: "text-[#b76e7d]",
    page: "bg-[#F7EDEF]",
    shadow: "shadow-[#D9A0AC]/30",
  },
};
