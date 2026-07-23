# Qrive — Google Drive QR 링크

## 요약

Google Drive에서 이미 공유된 파일과 폴더의 QR 코드를 기기 안에서 만듭니다.

## 자세한 설명

Qrive는 Google Drive가 이미 공유 항목으로 표시한 파일과 폴더 옆에 작은 QR
버튼을 추가합니다. 버튼을 누르면 기존 공유 링크의 QR 코드를 확인하고,
링크를 복사하거나 QR 이미지를 PNG로 저장할 수 있습니다.

Qrive는 하나의 분명한 기능과 개인정보 보호를 중심으로 설계했습니다.

- QR 코드는 사용자의 브라우저 안에서만 생성됩니다.
- 기존 Google Drive 공유 권한이 그대로 적용됩니다.
- OAuth, 계정 연결, 백엔드, 분석, 광고, 외부 QR 서비스를 사용하지
  않습니다.
- 신뢰할 수 있는 Google Drive 링크를 찾지 못하면 잘못된 QR을 만들지 않고
  오류를 표시합니다.
- 한국어·영어 레이블, 키보드 이동, Escape 및 바깥 클릭 닫기, 포커스
  처리를 지원합니다.

QR 코드가 파일을 공개 상태로 바꾸지는 않습니다. QR을 스캔한 사람도 해당
항목의 기존 Google Drive 접근 정책을 충족해야 합니다.

Qrive는 `drive.google.com`에서만 실행되며 별도의 Chrome API 권한을
요청하지 않습니다. MIT 라이선스로 공개된 오픈소스 프로젝트입니다.

Qrive는 Google과 독립적으로 개발된 프로젝트이며 Google의 보증이나 후원을
받지 않습니다. Google Drive는 Google LLC의 상표입니다.

## 등록 필드

- 카테고리: 생산성
- 언어: 한국어
- 홈페이지: https://github.com/GGULBAE/Qrive
- 지원: https://github.com/GGULBAE/Qrive/issues
- 개인정보처리방침:
  https://github.com/GGULBAE/Qrive/blob/master/PRIVACY.md
