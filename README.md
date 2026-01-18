# Puppeteer Screenshot API

팝업, 플로팅 배너를 제거하고 깨끗한 스크린샷을 촬영하는 API 서버입니다.

## 🚀 Railway 배포 방법

### 방법 1: GitHub 연동 (권장)

1. **GitHub에 새 저장소 생성**
   - https://github.com/new 에서 새 저장소 생성
   - 저장소 이름: `puppeteer-screenshot-api`

2. **파일 업로드**
   - 이 폴더의 모든 파일을 GitHub 저장소에 업로드
   ```
   puppeteer-screenshot-api/
   ├── Dockerfile
   ├── .dockerignore
   ├── package.json
   ├── server.js
   └── README.md
   ```

3. **Railway에서 배포**
   - https://railway.app 접속 및 로그인
   - `New Project` 클릭
   - `Deploy from GitHub repo` 선택
   - 방금 만든 저장소 선택
   - 자동으로 Dockerfile 감지하여 빌드 시작

4. **도메인 설정**
   - 배포 완료 후 `Settings` → `Networking` → `Generate Domain`
   - 생성된 URL 복사 (예: `https://puppeteer-screenshot-api-production-xxxx.up.railway.app`)

### 방법 2: Railway CLI

```bash
# Railway CLI 설치
npm install -g @railway/cli

# 로그인
railway login

# 프로젝트 초기화
railway init

# 배포
railway up
```

---

## 📡 API 사용법

### 스크린샷 촬영

```
GET /screenshot?url=<URL>&width=1280&height=900&format=base64
```

**파라미터:**
| 파라미터 | 기본값 | 설명 |
|---------|--------|------|
| url | (필수) | 캡처할 웹페이지 URL |
| width | 1280 | 뷰포트 너비 |
| height | 900 | 뷰포트 높이 |
| format | base64 | 응답 형식 (base64 또는 image) |
| fullPage | false | 전체 페이지 캡처 여부 |

**예시:**
```
https://your-api.railway.app/screenshot?url=https://example.com&width=1280&height=900
```

**응답 (format=base64):**
```json
{
  "success": true,
  "screenshot": "base64_encoded_image...",
  "contentType": "image/jpeg"
}
```

**응답 (format=image):**
- JPEG 이미지 바이너리 직접 반환

### 헬스체크

```
GET /health
```

---

## 🎯 제거되는 요소들

- 팝업 / 모달 창
- 쿠키 동의 배너
- 플로팅 버튼 (카카오톡 채팅, 상담 버튼 등)
- 우측/좌측 하단 고정 메뉴
- 오버레이 / 딤 처리
- position: fixed / sticky 요소 (네비게이션 제외)

---

## 🔧 MADMEDCHECK 연동

Railway 배포 후 받은 URL을 MADMEDCHECK의 `analyze.js`에서 사용:

```javascript
// analyze.js에서 스크린샷 URL 변경
const screenshotUrl = `https://your-api.railway.app/screenshot?url=${encodeURIComponent(url)}&format=image`;
```

---

## 💰 Railway 요금

- **무료 티어**: 월 $5 크레딧 제공 (약 500시간 사용 가능)
- **초과 시**: 사용량 기반 과금

---

## 📝 환경 변수 (선택)

Railway Dashboard에서 설정 가능:

| 변수 | 기본값 | 설명 |
|-----|--------|------|
| PORT | 3000 | 서버 포트 (Railway가 자동 설정) |

---

## 🐛 트러블슈팅

### 빌드 실패 시
- Dockerfile이 저장소 루트에 있는지 확인
- Railway Dashboard에서 빌드 로그 확인

### 스크린샷이 빈 화면일 때
- 대상 사이트가 봇을 차단했을 수 있음
- User-Agent 변경 필요할 수 있음

### 메모리 부족 시
- Railway 플랜 업그레이드 고려
- 동시 요청 수 제한 추가
