# 포털 애니메이션 동영상 마이그레이션 계획서

## 현황 분석

### 현재 구현 방식
- **위치**: `src/pages/greeting/ui/GreetingPage.tsx`
- **방식**: PNG 이미지 10장 (r1.png ~ r10.png)을 JavaScript setTimeout으로 순차 변경
- **총 용량**: 약 10MB
- **애니메이션 시간**: 2.5초

### 이미지별 용량
| 파일 | 용량 |
|------|------|
| r1.png | 627KB |
| r2.png | 637KB |
| r3.png | 608KB |
| r4.png | 625KB |
| r5.png | 674KB |
| r6.png | 651KB |
| r7.png | 662KB |
| r8.png | 673KB |
| r9.png | 2.6MB |
| r10.png | 2.2MB |

---

## 마이그레이션 계획

### Step 1: 동영상 생성 (FFmpeg)

```bash
# 프로젝트 portal 폴더로 이동
cd frontend/src/assets/images/portal

# WebM 포맷 (권장 - 용량 최소, 투명도 지원)
ffmpeg -framerate 4 -i r%d.png -c:v libvpx-vp9 -b:v 1M -pix_fmt yuva420p portal.webm

# MP4 포맷 (폴백용 - 더 넓은 호환성)
ffmpeg -framerate 4 -i r%d.png -c:v libx264 -pix_fmt yuv420p portal.mp4
```

> **참고**: `-framerate 4`는 초당 4프레임 = 10프레임 ÷ 2.5초

### Step 2: 코드 수정

#### 2-1. Import 변경

**기존 코드 (삭제)**:
```tsx
import r1 from '../../../assets/images/portal/r1.png';
import r2 from '../../../assets/images/portal/r2.png';
// ... r3 ~ r10 모두 삭제
const portalFrames = [r1, r2, r3, r4, r5, r6, r7, r8, r9, r10];
```

**새 코드**:
```tsx
import portalVideo from '../../../assets/images/portal/portal.webm';
// MP4 폴백이 필요하면 추가:
// import portalVideoMp4 from '../../../assets/images/portal/portal.mp4';
```

#### 2-2. State 변경

**기존 코드 (삭제)**:
```tsx
const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
```

**새 코드**:
```tsx
const videoRef = useRef<HTMLVideoElement>(null);
```

#### 2-3. Preload useEffect 삭제

**삭제할 코드**:
```tsx
useEffect(() => {
    portalFrames.forEach((src) => {
        const img = new Image();
        img.src = src;
    });
}, []);
```

#### 2-4. handleEnterBook 함수 수정

**기존 코드 (삭제)**:
```tsx
const handleEnterBook = () => {
    setIsZooming(true);
    setTimeout(() => setCurrentFrameIndex(1), 250);
    setTimeout(() => setCurrentFrameIndex(2), 500);
    // ... 모든 setTimeout 삭제
};
```

**새 코드**:
```tsx
const handleEnterBook = () => {
    setIsZooming(true);
    if (videoRef.current) {
        videoRef.current.play();
    }
};
```

#### 2-5. JSX 변경

**기존 코드 (삭제)**:
```tsx
<div
    className={`portal-background ${isZooming ? 'portal-zoom-animation' : ''}`}
    style={{
        backgroundImage: `url(${portalFrames[currentFrameIndex]})`,
        // ...
    }}
/>
```

**새 코드**:
```tsx
<video
    ref={videoRef}
    className={`portal-background ${isZooming ? 'portal-zoom-animation' : ''}`}
    muted
    playsInline
    preload="auto"
    onEnded={() => {
        if (sectionRefs.current[1]) {
            sectionRefs.current[1].scrollIntoView({ behavior: 'smooth' });
        }
    }}
    style={{
        position: 'absolute',
        top: 0, left: 0, width: '100%', height: '100%',
        objectFit: 'cover',
        transformOrigin: 'center center',
        zIndex: 0
    }}
>
    <source src={portalVideo} type="video/webm" />
    {/* MP4 폴백이 필요하면 추가: */}
    {/* <source src={portalVideoMp4} type="video/mp4" /> */}
</video>
```

#### 2-6. 첫 프레임 포스터 (선택사항)

동영상 재생 전 첫 프레임을 보여주려면:
```tsx
<video
    poster={r1} // r1.png만 유지하거나 별도 이미지 사용
    // ...
>
```

---

## 예상 효과

| 항목 | Before | After |
|------|--------|-------|
| 총 용량 | ~10MB | ~0.5-1MB |
| HTTP 요청 수 | 10회 | 1회 |
| 코드 라인 | ~30줄 | ~15줄 |
| 유지보수성 | 복잡 | 단순 |

---

## 체크리스트

- [ ] FFmpeg로 portal.webm 생성
- [ ] (선택) portal.mp4도 생성 (iOS Safari 호환성)
- [ ] GreetingPage.tsx 코드 수정
- [ ] 기존 r1~r10.png 파일 삭제 (또는 백업)
- [ ] 로컬에서 동작 테스트
- [ ] 빌드 후 용량 확인

---

## 참고: FFmpeg 설치

**Windows (winget)**:
```bash
winget install FFmpeg
```

**또는 공식 다운로드**: https://ffmpeg.org/download.html
