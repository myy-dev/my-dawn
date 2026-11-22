# 100편 장면 다시 그리기 실행 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 99편(10번 제외)의 사물과 구도를 장면마다 새로 설계해, 어느 두 장면에도 같은 모양의 사물이 없고 "찍어낸 느낌"이 사라지게 한다.

**Architecture:** 형태는 장면 파일 안에서 장면별로 직접 짠다. `lib/paint.cjs`에는 형태가 아닌 그리기 도구(흔들리는 윤곽, 붓질 채우기, 재질 칠하기)만 더한다. 검증은 저장소에 넣는 브라우저 점검 도구(`tools/`)로 한다: 오류, 반복 이음매, 프레임 시간, 생성 시간, 결정성, 정지 화면, 비교 시트.

**Tech Stack:** Canvas 2D (브라우저), CommonJS 장면 모듈, Python 빌드(`build_preview.py`), Node 내장 테스트(`node --test`) — 순수 함수용.

**Spec:** `docs/superpowers/specs/2026-11-22-scene-redraw-design.md`

## Global Constraints

- 1920×1080, `createScene(makeCanvas)` → `painter(ctx, phase)`, phase ∈ [0,1), 24초 반복.
- 결정적: 장면 시드 난수만, `Math.random` 금지. 같은 phase는 같은 그림.
- 프레임당 33 ms 이하(브라우저 미리보기, 12프레임 평균), 장면 생성 1초 이내.
- 무거운 그리기는 생성 때 판(plate)에 한 번, 프레임마다는 움직이는 것만.
- 형태를 찍는 공용 함수 금지(`tree()`, `house()` 같은 것). 공용은 도구만.
- 같은 종류 사물이 여럿이면 개체마다 크기·기울기·구조가 다르고, 배치는 등간격·격자·좌우대칭을 피한다.
- 가까운 층은 재질과 입체감(시안 A), 먼 층은 안개와 실루엣(시안 C). 기준: `review/style-house-A.jpg`, `review/style-house-C.jpg`.
- 광원 방향에 맞춰 밝은 면과 그림자 면을 정한다. 장면별 조명 표(`paint.litScenes` 표, 실내·물가의 `LIGHTS`)는 새 형태에 맞게 다시 맞춘다.
- 제목·환경음과 어긋나는 구도 금지. 마감 처리(`paint.finished`)는 그대로 둔다.
- 커밋은 사용자가 요청할 때만, 메시지는 `type: 한국어 내용`(필요할 때만 본문), 끝에 `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

- **장면 전환이 느려짐:** 디테일 판을 그리느라 생성이 1초를 넘는다 → Task 1의 생성 시간 점검이 모든 계열 작업에서 실패로 잡는다.
- **반복 이음매:** 새로 넣은 움직이는 요소(연기, 물결)가 phase에 대해 주기적이지 않다 → Task 1 이음매 점검.
- **결정성 깨짐:** 판 그리기에 `Math.random`이나 시간 값이 섞여 정지 화면과 재생이 다르다 → Task 1 결정성 점검(같은 phase 두 번 그려 차이 0에 가깝게), 그리고 Task 2의 `Math.random` 금지 검사.
- **계열 간 같은 모양:** 두 장면의 나무나 집이 사실상 같다 → 각 계열 Task의 "사물 대조 시트" 단계(같은 종류 사물을 계열 전체에서 한 장에 모아 눈으로 대조).
- **조명 과노출:** 새 흰 벽·눈·창이 조명 표의 dodge로 하얗게 날아간다 → 각 계열 Task의 조명 재조정 단계와 비교 시트.

---

### Task 1: 저장소 점검 도구

지금까지 스크래치에서 쓰던 점검 코드를 저장소로 옮겨, 이후 모든 작업이 같은 기준으로 검증되게 한다.

**Files:**
- Create: `tools/labserver.py` — 저장소를 `/`로, `/lab/out/<name>.jpg` PUT을 `review/lab/`에 저장. 인자: `<repo> <port>`.
- Create: `tools/lab.js` — 미리보기 페이지에 주입하는 점검 함수들.
- Modify: `.gitignore` — `review/` 는 이미 제외됨(확인만).
- Modify: `.claude/launch.json` — `lab` 구성을 `tools/labserver.py`로 바꿈(로컬 파일, 커밋 안 함).

**Interfaces:**
- Produces (브라우저 전역):
  - `lab.audit(ids?: string[]) => Promise<{errors: string[], seams: string[], slowFrames: string[], slowCreate: string[], nondeterministic: string[], times: Record<id, {frameMs, createMs}>}>`
  - `lab.stills(ids?: string[]) => Promise<void>` — 각 장면 posterPhase(없으면 .28)를 960×540 JPEG(.9)로 `/lab/out/still-<id>.jpg`.
  - `lab.grid(ids, name, cols=3, cw=640)`, `lab.ab(ids, name, titles)` — 기존 스크래치 `tools.js`와 같은 동작(이전 = `assets/stills/<id>.jpg`, 이후 = `still-<id>.jpg`).
  - `lab.crops(entries: {id, x, y, w, h, label}[], name)` — 여러 장면의 부분을 한 시트로(사물 대조용).
- 기준값: 이음매 = `seam > base*1.6 + .5`(base = 0.2/0.5/0.8 지점의 한 프레임 차이 최대), 느린 프레임 > 33 ms, 느린 생성 > 1000 ms, 비결정 = 같은 phase 두 번의 평균 채널 차이 > 0.5.

- [ ] **Step 1: `tools/lab.js`에 `lab.audit` 작성** — 위 기준값으로. 생성 시간은 `createScene(mk)` 호출 시간.
- [ ] **Step 2: 점검 대상이 실패를 잡는지 확인** — 브라우저에서 임시로 한 장면의 painter를 `Math.random()`을 섞은 것으로 바꿔 `lab.audit(['96'])` 실행. Expected: `nondeterministic`에 `96`.
- [ ] **Step 3: 나머지 함수(`stills`, `grid`, `ab`, `crops`)와 `labserver.py` 작성.**
- [ ] **Step 4: 현재 상태 기준선 기록** — `python3 build_preview.py` 후 `lab.audit()` 전체 실행. Expected: errors·seams·slowFrames·nondeterministic 모두 빈 배열. `times`를 `review/lab/baseline.json`으로 저장.
- [ ] **Step 5: 커밋(사용자 요청 시)** — `chore: 장면 점검 도구 추가`

### Task 2: 공용 그리기 도구

**Files:**
- Modify: `lib/paint.cjs` — 도구 추가, `module.exports`에 등록.
- Create: `tests/paint.test.cjs` — 순수 함수 테스트(`node --test tests/`).

**Interfaces:**
- Consumes: 기존 `noise`, `edge`, `hash`, `lerp`.
- Produces:
  - `seeded(seed: number) => () => number` — LCG `seed = imul(seed,1664525)+1013904223`, [0,1).
  - `wobble(points: [x,y][], amp: number, seed: number, step = 10) => [x,y][]` — 각 변을 `step` px로 나누고 법선 방향으로 `edge(...)*amp` 만큼 민다. 닫힌 다각형.
  - `pathOf(ctx, points)` — 다각형 경로만 만든다(채우기 없음).
  - `strokesIn(ctx, points, color: [r,g,b], rnd, {angle=0, density=1/70, len=40, width=10, spread=16, alpha=[.28,.58]})` — 다각형 안을 짧은 붓질로 채운다(시안 B 방식, 밀도는 면적당).
  - `planks(ctx, quad: [[x,y]x4], rnd, {along: 'u'|'v', width:[min,max], base:[r,g,b], vary=18, gap=1.4, streaks=3})` — 사각형(원근 가능) 면을 판자로 채운다(시안 A의 측벽·전면 방식). quad 순서 = 좌상, 우상, 우하, 좌하.
  - `stones(ctx, from:[x,y], to:[x,y], rnd, {size=26, base=[82,82,86], vary=36})` — 선을 따라 불규칙한 돌 줄.
  - `shingles(ctx, quad, rnd, {rows=16, cols=15, base=[52,48,54], moss=[58,66,50], mossAt=.66, seed})` — 엇갈린 너와 줄.
  - `bark(ctx, points, rnd, {base:[r,g,b], dir='v', marks=…})` — 줄기 다각형 안의 껍질 무늬(가로 띠/세로 골은 `dir`로).

- [ ] **Step 1: 실패하는 테스트 작성** (`tests/paint.test.cjs`)
  - `seeded(7)`를 두 번 만들어 앞 5개 값이 같다.
  - `wobble(square, 0, 1)`의 모든 점이 원래 변 위에 있다(오차 < 1e-9).
  - `wobble(square, 4, 1, 10)`의 점 수 = 각 변 길이/10 반올림의 합, 모든 점이 원래 변에서 4·0.8 px 이내.
  - `lib/paint.cjs` 소스에 `Math.random` 문자열이 없다.
- [ ] **Step 2: 실행해 실패 확인** — `node --test tests/` → `seeded is not a function` 등으로 FAIL.
- [ ] **Step 3: 도구 구현** — 동작은 스크래치 시안 `houses.js`의 `wobble`, `brush`, 측벽 판자·전면 판자·기초 돌·너와 코드를 함수로 옮긴 것. `planks`는 판마다 색 편차 + 노이즈로 따뜻함 변화 + 위→아래 어두워짐 + 세로 빗물 자국 `streaks`개.
- [ ] **Step 4: 테스트 통과 확인** — `node --test tests/` → PASS.
- [ ] **Step 5: 도구 견본 시트** — `tools/lab.js`에 `lab.swatches()` 임시 호출로 각 도구를 한 장에 그려 `review/lab/tools.jpg` 확인(판자 원근, 돌, 너와, 껍질 두 방향, 붓질).
- [ ] **Step 6: 커밋(사용자 요청 시)** — `feat: 공용 그리기 도구 추가`

### Task 3: 시범 96 — 눈 덮인 마구간 앞 물통

**Files:**
- Modify: `families/weather.cjs` — 96번 전용 그리기 함수 `drawStableYard96(ctx, rnd)`를 새로 만들고, 96번이 `barn()` 대신 이것을 쓰게. 조명 표의 96 항목 재조정.

**Interfaces:**
- Consumes: Task 2 도구 전부, `paint.LIGHT`.
- Produces: 없음(장면 전용).

- [ ] **Step 1: 구도 정하기** — 제목 "눈 내리는 마구간 앞 물통", 소리 그대로. 마구간·물통·울타리·눈·내리는 눈. 구도는 새로 잡되(시점, 지평선) 마구간과 물통이 주인공. 시안 A 수준의 재질(판자, 처마 그림자, 기초, 눈 쌓인 지붕 두께, 고드름 같은 장면 고유 디테일)과 먼 배경은 시안 C(눈안개 속 실루엣).
- [ ] **Step 2: 그리기 구현.**
- [ ] **Step 3: 빌드·점검** — `python3 build_preview.py`, `lab.audit(['96'])` → 오류·이음매·느린 프레임/생성·비결정 없음.
- [ ] **Step 4: 정지 화면과 전후 시트** — `lab.stills(['96'])`, `lab.ab(['96'], 'pilot-96')`.

### Task 4: 시범 43 — 자작나무 사이로 내리는 눈

**Files:**
- Modify: `families/woodlands.cjs` — 43번 전용 `drawBirchSnow43(ctx, rnd)`; 기존 `trailFactory`의 43 경로를 대체. 조명 표 43 재조정.

- [ ] **Step 1: 구도 정하기** — 자작나무 숲길, 눈. 나무마다 줄기 굵기·기울기·갈래·껍질 띠 위치가 다르고(`bark` dir 'h'), 뭉친 무리와 빈 곳이 있다. 먼 줄은 안개 실루엣, 가까운 줄은 껍질 재질.
- [ ] **Step 2: 그리기 구현.**
- [ ] **Step 3: 빌드·점검** — `lab.audit(['43'])` 통과.
- [ ] **Step 4: 정지 화면과 전후 시트** — `lab.ab(['43'], 'pilot-43')`.

### Task 5: 시범 33 — 잔물결 위에 불 켠 보트 창고

**Files:**
- Modify: `families/waters.cjs` — 33번 전용 `drawBoathouse33(ctx, rnd)`; `buildChannel`의 boathouse 분기를 대체. 물가 `LIGHTS[33]` 재조정.

- [ ] **Step 1: 구도 정하기** — 물 위 기둥 위의 창고, 켜진 창, 잔물결에 비친 빛. 기둥·판자·지붕·선착장 재질, 물에 비친 창 빛의 흔들림(phase 주기).
- [ ] **Step 2: 그리기 구현.**
- [ ] **Step 3: 빌드·점검** — `lab.audit(['33'])` 통과.
- [ ] **Step 4: 정지 화면과 전후 시트** — `lab.ab(['33'], 'pilot-33')`.
- [ ] **Step 5: 시범 확인 — 여기서 멈춤.** `pilot-96`, `pilot-43`, `pilot-33`을 사용자에게 보내고 확인을 기다린다. 수정 요청이 오면 Task 3–5를 고쳐 다시 보여준다. 승인 전에는 Task 6 이후로 넘어가지 않는다. 승인되면 정지 화면 3장을 `assets/stills/`에 설치하고 커밋(사용자 요청 시) `feat: 시범 3편 다시 그리기`.

### Task 6–12: 계열별 다시 그리기

계열 하나가 Task 하나다. 모든 계열 Task는 같은 단계를 따른다.

| Task | 계열 | 장면 | 파일 |
|---|---|---|---|
| 6 | 날씨 | 86–95, 97–100 | `families/weather.cjs` |
| 7 | 숲 | 41–42, 44–55 | `families/woodlands.cjs` |
| 8 | 물가 | 26–32, 34–40 | `families/waters.cjs` |
| 9 | 실내 | 11–25 | `families/interiors.cjs` |
| 10 | 거리 | 71–85 | `families/street.cjs` |
| 11 | 하늘 | 56–70 | `families/skies.cjs` |
| 12 | 원본 | 01–09 | `sources/01.cjs`–`sources/09.cjs` |

**Interfaces:**
- Consumes: Task 2 도구, Task 1 점검 함수, 시범 3편에서 승인된 수준.
- Produces: 없음(장면 전용). 공용 형태 함수는 만들지 않는다. 계열 안에서 쓰지 않게 된 옛 형태 함수(`barn`, `millHouse`, `pavilion`, `parkingBooth` 등)는 계열 Task 끝에서 지운다.

- [ ] **Step 1: 장면별 구상 메모** — 계열 파일 상단 주석이 아니라 작업 중 메모로, 장면마다 한 줄: 구도, 주인공 사물, 그 장면에만 있는 디테일 하나 이상.
- [ ] **Step 2: 장면마다 전용 그리기 함수 구현** — `draw<Subject><id>(ctx, rnd)` 이름 규칙. 장면 3–5편마다 빌드하고 `lab.audit(<그 장면들>)`.
- [ ] **Step 3: 조명 표 재조정** — 새 광원 위치에 맞춰 계열 조명 표 갱신, 과노출 없는지 `lab.grid` 로 확인.
- [ ] **Step 4: 사물 대조 시트** — 계열 안(그리고 이미 끝난 계열과) 같은 종류 사물을 `lab.crops`로 모아 비교. 같아 보이는 쌍이 있으면 한쪽을 다시 그린다.
- [ ] **Step 5: 계열 전체 점검** — `lab.audit(<계열 전체>)` 모두 빈 배열, `lab.stills`, `lab.ab`(대표 6–8편)로 `review/redraw-<계열>.jpg`.
- [ ] **Step 6: 사용자에게 비교 시트 보고** — 계열마다 한 번. 다음 계열로는 그대로 진행한다(시범 이후 게이트 없음).
- [ ] **Step 7: 설치와 커밋(사용자 요청 시)** — 정지 화면을 `assets/stills/`로, `python3 build_preview.py`, `feat: <계열> 장면 다시 그리기`.

### Task 12b: 화면 질감 다듬기

형태를 모두 바꾼 뒤 공용 마감(`paint.finisher`)과 장면 공통 표면 질감을 한 번에 다시 잡는다(사용자 합의, 2026-11-22).

- [ ] **Step 1:** 100편 격자를 보고 질감 시안 2–3가지를 `review/texture-*.jpg`로 만든다.
- [ ] **Step 2:** 사용자가 고른 시안을 `paint.finisher` 기본값과 `applyTexture` 강도로 반영, `lab.audit()` 전체 통과.
- [ ] **Step 3:** 정지 화면 100장 갱신, 커밋(사용자 요청 시) `feat: 화면 질감 통일`.

### Task 13: 마무리 전체 점검

- [ ] **Step 1:** `lab.audit()` 100편 전체 → 모든 배열 비어 있음, 최장 프레임·생성 시간 보고.
- [ ] **Step 2:** 계열을 넘나드는 사물 대조 시트(나무 전부, 건물 전부) `review/redraw-cross.jpg`.
- [ ] **Step 3:** `review/redraw-all.jpg` — 100편 정지 화면 격자.
- [ ] **Step 4:** 사용자 보고, 커밋·푸시는 요청 시.
