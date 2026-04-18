# 의대 실습 스케줄러 (Medical Practice Scheduler)

한양대학교 의과대학 본3 실습 일정 조회·관리 웹앱.

## 로컬 실행

```bash
npm install
cp .env.example .env.local   # 값 채워넣기
npm run dev
```

http://localhost:3000

## 주요 명령어

- `npm run dev` — 개발 서버
- `npm run build` — 프로덕션 빌드 (결과물 `dist/`)
- `npm run preview` — 빌드 결과 미리보기
- `npm run lint` — 타입 체크

## 폴더 구조

```
src/
  lib/          Supabase 같은 외부 서비스 연결
  types/        공용 타입 정의
  utils/        날짜·스케줄 파싱 유틸
  data/         정적 데이터 (조원, 스케줄, 교수 링크 등)
  hooks/        재사용 가능한 React 훅
  components/   UI 컴포넌트
    ui/         공통 UI (Icon 등)
    layout/     Header 등
    schedule/   스케줄 카드
    chat/       채팅 UI
    menu/       식단
    mate/       구리 메이트 찾기
  pages/        페이지 단위 컴포넌트
  App.tsx       페이지 스위처 (얇은 컨테이너)
```

## 환경변수

| 키 | 용도 |
|---|---|
| `VITE_SUPABASE_URL` | Supabase 프로젝트 URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/publishable key |

로컬은 `.env.local`, 배포는 Vercel 환경변수로 등록.
