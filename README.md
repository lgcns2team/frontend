Markdown

# 📜 H.AI (History AI)

> **역사의 흐름을 몰입감 있게 탐험하는 인터랙티브 역사 지도 서비스** > 사용자는 시간 여행자가 되어 고대부터 현대까지의 역사를 지도 위에서 생생하게 경험할 수 있습니다.

![H.AI Preview](https://github.com/lgcns2team/frontend/raw/main/public/assets/images/taegeuk_contemporary.png)

<br>

## 🛠 Tech Stack

### Frontend
<img src="https://img.shields.io/badge/React_18-61DAFB?style=for-the-badge&logo=react&logoColor=black"> <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white"> <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white"> <img src="https://img.shields.io/badge/Leaflet-199900?style=for-the-badge&logo=leaflet&logoColor=white">

### Style & Architecture
<img src="https://img.shields.io/badge/FSD_Architecture-000000?style=for-the-badge&logo=files&logoColor=white"> <img src="https://img.shields.io/badge/CSS_Modules-000000?style=for-the-badge&logo=css3&logoColor=white">

### DevOps
<img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white"> <img src="https://img.shields.io/badge/Nginx-009639?style=for-the-badge&logo=nginx&logoColor=white"> <img src="https://img.shields.io/badge/Jenkins-D24939?style=for-the-badge&logo=jenkins&logoColor=white">

<br>

## ✨ Key Features

### 1. Anthropic-style Landing Page
프리미엄 에디토리얼 스타일의 랜딩 페이지는 부드러운 스크롤 애니메이션과 미니멀한 디자인으로 사용자에게 몰입감을 선사합니다.
- **Hero Section:** 부드러운 페이드 효과가 적용된 타이틀
- **Storytelling:** 스크롤에 따라 자연스럽게 이어지는 기능 소개
- **Seamless UX:** 랜딩 페이지에서 지도 탐험으로 이어지는 자연스러운 경험

### 2. Dynamic Theming (Time Travel)
선택한 역사적 시대에 맞춰 애플리케이션의 전체 테마가 실시간으로 변화합니다.
- **고대 (Ancient):** 돌 질감, 명조 계열 폰트, 묵직한 앰비언트 톤
- **중세 (Medieval):** 양피지 질감, 캘리그라피 폰트, 따뜻한 흙빛 톤
- **근대 (Modern):** 신문지 질감, 흑백 대비와 붉은색 강조
- **현대 (Contemporary):** 글래스모피즘, 산세리프 폰트, 선명한 블루 & 레드

### 3. Interactive History Map
- **Timeline Control:** 슬라이더를 드래그하여 과거와 현재를 자유롭게 오갈 수 있습니다.
- **Live Updates:** 연도 변경 시 국경, 마커, UI 스타일이 즉각적으로 반응하여 업데이트됩니다.

<br>

## 📂 Project Structure (FSD)

이 프로젝트는 유지보수성과 확장성을 위해 **Feature-Sliced Design (FSD)** 아키텍처를  따릅니다.

```bash
src/
├── 📱 app/          # 전역 설정, Provider, 스타일 (App-wide settings)
├── 📄 pages/        # 라우트 페이지 구성 (Landing, Map 등)
├── 🧩 widgets/      # 독립적인 기능을 가진 큰 컴포넌트 (HistoryMap 등)
├── 🎮 features/     # 사용자 상호작용 기능 (TimeControls, Timeline 등)
├── 📦 entities/     # 비즈니스 엔티티 (Map markers 등)
└── 🔧 shared/       # 재사용 가능한 유틸리티, 설정, UI Kit (Eras, Config)
🚀 Getting Started
Prerequisites
Node.js: v18 or higher

npm or yarn

Installation
리포지토리를 클론합니다.

Bash

git clone [https://github.com/lgcns2team/frontend.git](https://github.com/lgcns2team/frontend.git)
cd frontend
의존성 패키지를 설치합니다.

Bash

npm install
환경 변수를 설정합니다.

루트 디렉토리에 .env 파일을 생성하거나 .env.development를 참고하세요.

자세한 내용은 ENV_SETUP.md 파일을 확인해주세요.

개발 서버를 실행합니다.

Bash

npm run dev
브라우저에서 http://localhost:5173으로 접속하여 확인합니다.

🐳 Deployment
이 프로젝트는 Docker와 Nginx를 사용하여 배포할 수 있도록 구성되어 있습니다.

Build & Run with Docker
Bash

# 도커 이미지 빌드
docker build -t hai-frontend .

# 도커 컨테이너 실행
docker run -d -p 80:80 hai-frontend
© 2026 LGCNS 2Team. All Rights Reserved.
