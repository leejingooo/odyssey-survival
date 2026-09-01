# 오디세이 서바이벌 (Odyssey Survival)

뱀파이어 서바이벌의 게임플레이에 하데스의 내러티브를 얹은 모바일 로그라이크입니다.
TypeScript + Canvas 2D로 만들어졌고, Capacitor로 iOS / Android에 패키징합니다.

> A mobile roguelite survivors game: Vampire Survivors gameplay, Hades-style
> Greek-myth narrative. TypeScript + Canvas 2D, packaged for iOS/Android with
> Capacitor. Korean / English / Japanese / Chinese.

---

## 빠르게 실행하기

```bash
npm install
npm run dev        # http://localhost:5173
```

프로덕션 빌드와 미리보기:

```bash
npm run build      # 타입 검사 + dist/ 생성
npm run preview    # http://localhost:4173 에서 dist/ 서빙
```

데스크톱 브라우저에서는 WASD / 방향키로도 움직일 수 있습니다.

---

## 게임 디자인

### 조작

화면 **아무 곳이나 드래그**하면 그 방향으로 이동하고, 영웅은 **나아가는 방향으로 자동
공격**합니다. 손가락이 닿은 지점이 스틱의 원점이 되고, 멀리 끌면 원점이 따라옵니다.
휴대폰에서 정확히 조준하기는 어렵기 때문에 전방 약 16° 안에 적이 있으면 공격이 그쪽으로
살짝 붙습니다(에임 어시스트). 조준은 여전히 "이동 방향"으로 하는 것입니다.

### 영웅

| 영웅 | 무기 | 성격 | 해금 |
| --- | --- | --- | --- |
| 오디세우스 | 이타케의 활 | 긴 사거리, 관통, 표준형 | 처음부터 |
| 아킬레우스 | 펠리온의 창검 | 전방 광역 참격, 강한 넉백, 근접 | 350 골드 |
| 시지프스 | 영원의 바위 | 느린 관통 투사체 + 착탄 광역 | 900 골드 |
| 타나토스 | 죽음의 장막 | 조준 불필요한 지속 장판, 빈사 즉사 | 1600 골드 |

다중 사격(`atk_count`)은 영웅마다 다르게 해석됩니다. 활/바위는 투사체가 늘고, 아킬레우스는
참격이 좌우로 늘어나며, 타나토스는 **회전하는 낫**을 얻습니다.

### 보물상자와 카드

맵을 돌아다니면 **체력을 가진 보물상자**가 나타납니다. 공격으로 부수면 3장 중 1장을 고릅니다.

* **신의 축복** — 8주신(제우스, 포세이돈, 아레스, 아테나, 아프로디테, 헤르메스, 하데스,
  가이아) × 각 3종, 각 3단계.
* **기본 공격 업그레이드** — 피해, 공격 속도, 사거리, 크기, 투사체 개수, 관통, 유도,
  치명타, 그리고 보유한 신의 힘을 기본 공격에 입히는 **신의 각인**.

**레벨업**은 별도로, 하데스의 "힘의 석류"에 해당하는 영웅 스탯 카드를 3장 중 1장 고릅니다.

### 밤의 거울 (메타 진행)

항해가 끝나면 획득한 골드가 남습니다. 골드로 **밤의 거울**을 강화하세요.

핵심은 **신탁의 그릇**입니다. 처음에는 한 판에서 신의 축복을 **1종류**만 받을 수 있고,
골드를 모아 단계적으로 **2종 → 3종**까지 해금합니다. 그 외에 시작 체력, 피해, 이동 속도,
골드/경험치 획득, 부활 횟수, 상자 출현률, 시작 레벨을 올릴 수 있습니다.

### 난이도

적 체력은 `1 + 분^1.25 × 0.11`, 스폰 속도는 분당 구간별로 오릅니다. 5분마다 보스
(미노타우로스 / 케르베로스)가 등장하고, 25분까지 내러티브 이정표가 흘러갑니다.

---

## 프로젝트 구조

```
src/
  core/         엔진: 고정 timestep 루프, 드래그 입력, 카메라/렌더러,
                시드 RNG, 절차적 WebAudio 효과음, localStorage 세이브
  data/         콘텐츠 테이블: 영웅, 신, 축복 24종, 무기 강화 9종,
                레벨업 특성 11종, 밤의 거울, 적/웨이브/보스 스케줄
  game/         시뮬레이션: 런 상태, 엔티티, 공간 해시, 전투/효과,
                로드아웃 계산과 카드 추첨, 캔버스 드로잉, 수익화 계층
  ui/           DOM 오버레이: 화면들, HUD, 런타임 생성 아이콘
  i18n/         ko / en / ja / zh 사전과 t() 런타임
tests/          Playwright 기반 스모크 · 소크 테스트
```

이미지 에셋이 하나도 없습니다. 영웅 초상화, 신의 문양, 카드 아이콘, 적, 이펙트까지 모두
런타임에 캔버스로 그립니다. 효과음도 WebAudio로 합성합니다. 덕분에 전체 번들이 gzip 45KB
수준이고, 모바일 웹에서 즉시 뜹니다.

### 콘텐츠 추가하기

* **새 축복**: `src/data/boons.ts`에 항목 하나를 추가합니다. 이름/설명은 `L(ko, en, ja, zh)`로
  네 언어를 같이 적고, `apply(out, level)`에서 `out.stats` / `out.mech`를 건드립니다.
  `apply`는 "그 레벨을 보유한 상태의 전체 효과"이며, 카드를 얻을 때마다 로드아웃을 처음부터
  다시 계산하므로 값이 어긋날 일이 없습니다.
* **새 메커니즘**: `src/game/stats.ts`의 `Mechanics`에 숫자 필드를 추가하고(0 = 꺼짐)
  `src/game/run.ts`에서 읽습니다.
* **새 영웅**: `src/data/heroes.ts`에 정의를 추가하고, 새 무기 타입이면 `Run.attack()`에
  분기를 하나 추가합니다.
* **새 언어**: `src/i18n/`에 사전을 추가하고 `LOCALES`에 등록합니다. 사전은 한국어를
  기준으로 타입이 잡혀 있어 빠진 키가 있으면 컴파일에 실패합니다.

---

## 다국어

한국어 · English · 日本語 · 中文을 지원합니다. 처음 실행할 때 기기 언어를 감지하고,
설정에서 언제든 바꿀 수 있습니다.

UI 문구는 `src/i18n/*.ts` 사전에, **콘텐츠 문구(축복 이름·설명 등)는 수치 바로 옆**에
`L()`로 적습니다. 밸런스 숫자와 그 설명이 같은 곳에 있어야 어긋나지 않기 때문입니다.

---

## 비즈니스 모델

수익화는 두 개의 인터페이스 뒤에 있습니다 (`src/game/monetization.ts`).

* **보상형 광고** — 상점에서 하루 5회까지 골드 획득, 사망 시 1회 부활, 결과 화면에서 골드 2배.
* **인앱 결제** — 골드 꾸러미, 광고 제거(보상형 광고 보상 2배), 영웅 전원 즉시 해금.

웹 빌드에는 **스텁**이 들어 있습니다. 광고는 3초짜리 오버레이로 실제 보상 흐름을 그대로
태우고, 결제는 항상 "결제 모듈 미연결"을 반환합니다. 실제 SDK를 붙일 때는 게임 코드를
건드리지 않고 두 클래스만 교체하면 됩니다.

```ts
// src/app.ts
this.money = new Monetization(
  new AdMobProvider(),      // AdProvider 구현 (@capacitor-community/admob)
  new RevenueCatBilling(),  // BillingProvider 구현
  () => this.save,
  () => this.commit(),
);
```

`AdProvider`는 `isReady(placement)`와 `showRewarded(placement)`만 만족하면 되고,
`showRewarded`는 **보상을 실제로 받았을 때만** `true`를 돌려줘야 합니다.
`BillingProvider`는 `isAvailable()`, `list()`, `purchase(id)`, `restore()`를 구현합니다.

---

## 모바일 패키징 (Capacitor)

```bash
npm run build
npx cap add android      # 최초 1회
npx cap add ios          # 최초 1회 (macOS + Xcode 필요)
npm run cap:android      # 빌드 + 동기화 + Android Studio 열기
npm run cap:ios          # 빌드 + 동기화 + Xcode 열기
```

`capacitor.config.ts`에 앱 ID(`com.odyssey.survival`), 배경색, `webDir: 'dist'`가 있습니다.
네이티브 프로젝트에서 추가로 손볼 것:

* **세로 고정** — Android는 `android/app/src/main/AndroidManifest.xml`의 액티비티에
  `android:screenOrientation="portrait"`, iOS는 Xcode의 Deployment Info에서 Portrait만 체크.
* **노치 대응** — CSS에 `env(safe-area-inset-*)`가 이미 적용돼 있고, `index.html`에
  `viewport-fit=cover`가 들어 있습니다.
* **진동** — 현재 웹 `navigator.vibrate`를 씁니다. iOS에서는 동작하지 않으므로
  `@capacitor/haptics`로 교체하는 것을 권장합니다.

---

## 테스트

두 개의 Playwright 스크립트가 있습니다. 둘 다 실제 브라우저에서 게임을 **직접 플레이**합니다.

```bash
# 스모크: 빌드된 게임을 폰 크기로 띄워 한 판을 플레이하고,
#         상자를 부수고, 카드를 고르고, 일시정지까지 확인
npm run build && npm run preview     # 다른 터미널에서
npm run test:smoke

# 소크: 네 영웅을 각각 25분(시뮬레이션 시간) 돌려
#       난이도 곡선, 보스 스케줄, 카드 풀, 신 개수 제한을 검증
npm run dev                          # 다른 터미널에서
npm run test:soak
```

소크 테스트는 렌더링 없이 시뮬레이션만 빨리 감는 개발용 훅(`window.odyssey.simulate`)을
쓰기 때문에 **개발 서버에서만** 동작합니다. 프로덕션 번들에는 포함되지 않습니다
(빨리 감기 치트가 되기 때문입니다).

`OUT=./shots npm run test:smoke`처럼 `OUT`을 주면 각 단계의 스크린샷을 남깁니다.

---

## 앞으로 할 일

* 실제 광고 / 결제 SDK 연결과 스토어 등록
* 영웅별 전용 축복(하데스의 "무기 특성")과 보스별 고유 패턴
* 세이브 서버 동기화, 리더보드, 일일 시드 챌린지
* 사운드 디자인 확장 — 지금은 전부 WebAudio 합성음입니다
