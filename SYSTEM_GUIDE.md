# Pulse Command Center: System Documentation & Manual

## 1. 개요 (Overview)
**Pulse Command Center**는 사업장 운영 효율화를 위해 설계된 **자율형 AI 에이전트 오피스**입니다. 구글 캘린더, 스프레드시트와 유기적으로 연동되어 업무 기록, 데이터 분석, 보고서 생성을 통합 관리하며, 미래 지향적인 프리미엄 UI(Command Center Theme)를 통해 직관적인 운영 통제 환경을 제공합니다.

---

## 2. 시스템 아키텍처 (Architecture)

### 2.1 Frontend (Presentation Layer)
- **Technology:** HTML5, CSS3 (Glassmorphism), Vanilla JavaScript (ES6+)
- **Hosting:** GitHub Pages
- **Style:** `base.css` (Pulse Command Center Premium Theme)
- **State Management:** `store.js` (Centralized Subscription-based state)

### 2.2 Backend (Service Layer)
- **Platform:** Google Apps Script (GAS) V8
- **Database:** Google Sheets (Relational-like structure)
- **Integration:** Google Calendar API, Spreadsheet API
- **Deployment:** `clasp` (Chrome Apps Script CLI)

---

## 3. 핵심 모듈 가이드 (Core Modules)

### 3.1 Worklog (업무 일지)
- **기능:** 일일 업무 기록 및 구글 캘린더 양방향 동기화.
- **특징:** 저장 시 캘린더에 일정으로 자동 생성되며, `logId`를 태깅하여 중복 생성을 방지합니다.
- **사용법:** 카테고리(조리/위생 등) 선택 후 내용 입력 -> [저장] 클릭.

### 3.2 Reports (보고서)
- **기능:** 일일/주간 운영 리포트 자동 생성 및 아카이빙.
- **특징:** 표준화된 템플릿 기반으로 작성되며, 출력(Print) 모드 시 가독성 높은 리포지토리 형식을 제공합니다.

### 3.3 Analytics (인당량 및 수율 분석)
- **기능:** 발주량 대비 실반입 중량 및 제공 가능 식수 정밀 산출.
- **특징:** 로스율을 반영한 실제 식수량을 계산하며, 계산 이력을 DB에 영구 저장하여 품목별 수율 데이터를 축적합니다.

### 3.4 Insights (AI 모니터링)
- **기능:** 운영 지표(회전율, 인시당 식수 등) 실시간 분석 결과 표시.
- **특징:** 임계치 초과 시 경고(Warning) 알림을 통해 즉각적인 조치를 유도합니다.

---

## 4. 보안 프로토콜 (Security & IP Protection)

본 시스템은 **지적 재산(IP) 보호와 데이터 익명화**를 최우선으로 합니다.

- **Data Masking:** 모든 레시피, 단가, 지원금 정보는 샘플링된 일반 수치로 관리됩니다.
- **Identity Protection:** 특정 기업명이나 내부 이메일 도메인을 코드 및 문서에서 배제합니다.
- **Session Security:** 인가된 단일 ID(`P1`) 기반으로 작동하며, 모든 접근 이력은 보안 로그에 기록됩니다.
- **Git Safety:** `.gitignore`를 통해 운영 데이터 파일(`.xlsx`, `.csv` 등)의 외부 유출을 원천 차단합니다.

---

## 5. 배포 및 유지보수 (Deployment)

### 5.1 코드 동기화 (GitHub)
```bash
git add .
git commit -m "update message"
git push
```

### 5.2 서버 반영 (GAS)
```bash
clasp push
clasp deploy -i <DEPLOYMENT_ID> -d "version description"
```
*권한 오류 발생 시 GAS 에디터에서 최초 1회 수동 승인이 필요합니다.*

---

## 6. 시스템 상태 확인 (System Status)
- **Backend URL:** [Google Apps Script Exec URL]
- **Storage:** [운영현황 Spreadsheet]
- **Calendar:** [Primary Google Calendar]

---
**© 2026 Pulse AI Agent Office. 본 문서는 시스템의 지적 자산이며 무단 배포를 금합니다.**
