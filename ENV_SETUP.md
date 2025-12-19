# 환경 설정 가이드

## 📁 환경 파일 구조

```
frontend/
├── .env.development    # 개발 환경 (Git 커밋 ✅)
├── .env.production     # 프로덕션 환경 (Git 커밋 ✅)
└── .env.local          # 개인 설정 (Git 무시 ❌)
```

## 🚀 사용 방법

### 1️⃣ **개발 환경 (로컬)**
```bash
npm run dev
```
→ `.env.development` 파일 자동 사용
→ `localhost:8080`, `localhost:8081`로 연결

### 2️⃣ **프로덕션 빌드**
```bash
npm run build
```
→ `.env.production` 파일 자동 사용
→ 설정된 서버 주소로 빌드

## ⚙️ 배포 시 설정 방법

### **외부 PC에 프론트엔드 배포하는 경우**

1. **`.env.production` 파일 수정**
```bash
# 백엔드 서버의 실제 IP 또는 도메인으로 변경
VITE_API_URL=http://192.168.1.100:8080
VITE_AI_API_URL=http://192.168.1.100:8081
```

2. **빌드**
```bash
npm install
npm run build
```

3. **배포**
```bash
# dist 폴더를 웹 서버에 배포
# 예: Nginx, Apache, http-server 등
```

## 🔐 환경별 파일 설명

| 파일 | Git 커밋 | 용도 | 우선순위 |
|------|---------|------|----------|
| `.env.development` | ✅ | 개발 환경 기본값 | 낮음 |
| `.env.production` | ✅ | 프로덕션 환경 기본값 | 낮음 |
| `.env.local` | ❌ | 개인별 설정 (덮어쓰기) | **높음** |

## 💡 개인 설정이 필요한 경우

다른 포트를 사용하거나 개인 설정이 필요하면:

```bash
# .env.local 파일 생성 (Git에 커밋되지 않음)
VITE_API_URL=http://localhost:3000
VITE_AI_API_URL=http://localhost:3001
```

## ⚠️ 주의사항

1. **환경 변수는 빌드 시점에 결정됩니다**
   - 변경 후 개발 서버 재시작 필요
   - 프로덕션은 다시 빌드 필요

2. **Git 커밋 전 확인**
   - `.env.local`: 커밋하지 않음 (개인 설정)
   - `.env.development`, `.env.production`: 커밋함 (팀 공유)

3. **보안**
   - API 키나 비밀번호는 환경 변수에 넣지 마세요
   - 백엔드에서 관리하세요

## 📊 동작 원리

### 개발 환경
```
브라우저 → Vite Dev Server (5173) → 프록시 → 백엔드 (8080, 8081)
```

### 프로덕션 환경
```
브라우저 → 정적 파일 → 직접 HTTP 요청 → 백엔드 (8080, 8081)
```

## 🎯 빠른 시작

```bash
# 1. 클론
git clone <repository>
cd frontend

# 2. 설치
npm install

# 3. 개발 서버 실행
npm run dev

# 4. 프로덕션 빌드 (배포 시)
npm run build
```

환경 파일이 Git에 포함되어 있으므로 별도 설정 없이 바로 시작할 수 있습니다!
