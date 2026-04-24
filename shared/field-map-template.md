# field-map-template.md (필드매핑 템플릿)

> 실제 시트 헤더가 변경되어도 프론트는 수정하지 않기 위해 사용합니다.

## 1) 원칙
- 프론트는 논리 필드만 사용
- GAS는 FieldMap을 통해 실제 헤더를 해석

## 2) 매핑 표(예시)

| 논리필드명 | 실제시트헤더명 | 사용여부 | 비고 |
|---|---|---:|---|
| date | 일자 | TRUE | YYYY-MM-DD |
| siteId | 사업장ID | TRUE |  |
| siteName | 사업장명 | TRUE |  |
| meal | 끼니 | TRUE | 조/중/석/야 |
| diCount | DI식수 | TRUE |  |
| toCount | TO식수 | TRUE |  |
| seatCount | 좌석수 | TRUE |  |
| toCornerCount | TO코너수 | TRUE | 없으면 1 |
| staffCount | 투입인원 | TRUE | 없으면 0 |
| note | 비고 | FALSE | optional |

## 3) 변경 체크리스트
- [ ] 시트 헤더 변경 발생
- [ ] FieldMap 업데이트
- [ ] Schema 인덱스 재생성
- [ ] getDashboardSummary 샘플 대조(1개 사업장)
- [ ] 프론트는 수정 없이 정상 동작 확인
