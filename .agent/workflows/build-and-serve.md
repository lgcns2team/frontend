---
description: 프론트엔드 빌드 후 간단한 서버로 실행하기
---

# 프론트엔드 빌드 및 태블릿 배포 가이드

이 워크플로우는 프론트엔드를 빌드하고 태블릿에서 실행할 수 있도록 간단한 HTTP 서버로 서빙하는 방법을 안내합니다.

## 1단계: 백엔드 서버 주소 설정

`.env.production` 파일을 열어 백엔드 서버 주소를 설정합니다:

```bash
# 예시: 같은 네트워크의 PC에서 백엔드가 실행 중인 경우
VITE_API_URL=http://192.168.1.100:8080

# 또는 외부 서버 사용 시
# VITE_API_URL=https://api.yourdomain.com
```

> **참고**: PC의 로컬 IP 주소는 `ipconfig` (Windows) 또는 `ifconfig` (Mac/Linux) 명령으로 확인할 수 있습니다.

## 2단계: 프로덕션 빌드 생성

// turbo
```bash
npm run build
```

이 명령은 `dist` 폴더에 최적화된 정적 파일들을 생성합니다.

## 3단계: 빌드 결과 미리보기 (선택사항)

Vite의 내장 프리뷰 서버로 빌드 결과를 테스트할 수 있습니다:

// turbo
```bash
npm run preview
```

기본적으로 `http://localhost:4173`에서 실행됩니다.

## 4단계: 간단한 HTTP 서버로 실행

### 방법 A: `serve` 패키지 사용 (권장)

1. `serve` 패키지를 전역 설치:
```bash
npm install -g serve
```

2. `dist` 폴더를 서빙:
```bash
serve -s dist -l 3000
```

- `-s`: SPA(Single Page Application) 모드 (모든 경로를 index.html로 리다이렉트)
- `-l 3000`: 포트 3000에서 실행 (원하는 포트로 변경 가능)

3. 네트워크의 다른 기기에서 접속:
```
http://[PC의_IP_주소]:3000
```

### 방법 B: Python HTTP 서버 사용

Python이 설치되어 있다면:

```bash
cd dist
python -m http.server 3000
```

> **주의**: Python 서버는 SPA 라우팅을 지원하지 않으므로 새로고침 시 404 에러가 발생할 수 있습니다.

### 방법 C: Node.js `http-server` 사용

```bash
npm install -g http-server
http-server dist -p 3000 -c-1
```

- `-p 3000`: 포트 3000 사용
- `-c-1`: 캐싱 비활성화 (개발/테스트용)

## 5단계: 태블릿에서 접속

1. **PC와 태블릿이 같은 Wi-Fi 네트워크에 연결되어 있는지 확인**

2. **PC의 IP 주소 확인**:
   - Windows: `ipconfig` 실행 후 "IPv4 주소" 확인
   - 예: `192.168.1.100`

3. **태블릿의 웹 브라우저에서 접속**:
   ```
   http://192.168.1.100:3000
   ```

4. **방화벽 설정 확인**:
   - Windows 방화벽이 해당 포트를 차단하지 않는지 확인
   - 필요시 인바운드 규칙에서 포트 허용

## 문제 해결

### 태블릿에서 접속이 안 되는 경우

1. **방화벽 확인**:
   ```bash
   # Windows 방화벽에서 포트 3000 허용
   netsh advfirewall firewall add rule name="HTTP Server 3000" dir=in action=allow protocol=TCP localport=3000
   ```

2. **PC와 태블릿이 같은 네트워크에 있는지 확인**

3. **서버가 0.0.0.0에서 리스닝하는지 확인**:
   ```bash
   serve -s dist -l 0.0.0.0:3000
   ```

### API 호출이 실패하는 경우

1. `.env.production`의 `VITE_API_URL`이 올바른지 확인
2. 백엔드 서버가 실행 중인지 확인
3. 백엔드 서버의 CORS 설정 확인

## 추가 팁

- **영구 실행**: 서버를 백그라운드에서 계속 실행하려면 `pm2` 같은 프로세스 매니저 사용
- **HTTPS 필요 시**: `serve`의 `--ssl-cert`, `--ssl-key` 옵션 사용
- **포트 변경**: 다른 포트를 사용하려면 `-l` 또는 `-p` 옵션의 숫자 변경
