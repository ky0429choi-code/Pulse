# schema-template.md (공통 데이터 모델 템플릿)

> 이 문서는 “논리 모델”을 정의합니다.  
> 실제 시트 헤더/열은 FieldMap으로 해석합니다.

## 1) Headcount Model (예시)

```json
{
  "version": "v1",
  "headcount": {
    "siteId": "H2",
    "siteName": "화성 H2",
    "date": "2026-04-23",
    "meals": {
      "breakfast": { "di": 0, "to": 0 },
      "lunch": { "di": 0, "to": 0 },
      "dinner": { "di": 0, "to": 0 },
      "late": { "di": 0, "to": 0 }
    },
    "ops": {
      "seatCount": 0,
      "toCornerCount": 1,
      "staffCountLunch": 0
    }
  }
}
```

## 2) Insight Item Model (표준)

```json
{
  "level": "warn",
  "code": "HEADCOUNT_VOLATILITY",
  "title": "최근 14일 식수 변동폭이 큼",
  "message": "중식 식수가 최근 14일 평균 대비 ±12% 이상 4회 발생",
  "actionGuide": "행사일/저조기/특식 편성 여부 점검 필요"
}
```

## 3) Memo Model (표준)

```json
{
  "memoId": "MEMO_20260423_001",
  "siteId": "H2",
  "date": "2026-04-23",
  "category": "ops",
  "tags": ["혼잡", "좌석"],
  "content": "중식 피크 시간 좌석 혼잡 심함."
}
```
