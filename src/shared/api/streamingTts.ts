/**
 * 문장 단위 스트리밍 TTS 시스템
 * AI 응답을 문장 단위로 분리하여 빠르게 첫 음성을 재생합니다.
 */

import { getStreamingHeaders } from './api-utils';

/**
 * iOS Safari 오디오 잠금 해제를 위한 무음 오디오 재생
 * 사용자 터치 이벤트 핸들러 내에서 호출해야 합니다.
 * 이 함수를 호출하면 이후 비동기 컨텍스트에서도 audio.play()가 동작합니다.
 */
export function prewarmAudio(): void {
    // 매우 짧은 무음 WAV 파일 (Base64 인코딩)
    const silentWav = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
    const audio = new Audio(silentWav);
    audio.volume = 0.01; // 거의 무음
    audio.play().then(() => {
        console.log('🔓 [TTS] iOS Audio context unlocked');
    }).catch((e) => {
        console.warn('⚠️ [TTS] Audio prewarm failed (expected on non-iOS):', e.message);
    });
}

export interface TtsQueueItem {
    text: string;
    audioUrl?: string;
    audio?: HTMLAudioElement;
    status: 'pending' | 'loading' | 'ready' | 'playing' | 'done' | 'error';
}

export interface StreamingTtsController {
    /** 문장을 큐에 추가 (AI 응답 스트리밍 중 호출) */
    addSentence: (sentence: string) => void;
    /** 스트리밍 완료 시 남은 버퍼 처리 */
    flush: () => void;
    /** 모든 재생 중지 및 큐 초기화 */
    stop: () => void;
    /** 현재 재생 중인지 확인 */
    isPlaying: () => boolean;
    /** 파괴 (cleanup) */
    destroy: () => void;
}

export interface StreamingTtsOptions {
    promptId: string;
    ttsApiUrl: string;
    /** 첫 문장 재생 시작 시 콜백 */
    onFirstPlay?: () => void;
    /** 모든 문장 재생 완료 시 콜백 */
    onAllDone?: () => void;
    /** 에러 발생 시 콜백 */
    onError?: (error: Error) => void;
}

// 문장 분리 정규식 (한국어/영어 문장 부호 기준)
const SENTENCE_DELIMITERS = /(?<=[.!?。！？])\s*/;

// 최소 문장 길이 (너무 짧은 문장은 합침)
const MIN_SENTENCE_LENGTH = 5;

/**
 * 문장 단위 스트리밍 TTS 컨트롤러 생성
 */
export function createStreamingTts(options: StreamingTtsOptions): StreamingTtsController {
    const { promptId, ttsApiUrl, onFirstPlay, onAllDone, onError } = options;

    let queue: TtsQueueItem[] = [];
    let textBuffer = '';
    let isDestroyed = false;
    let currentAudio: HTMLAudioElement | null = null;
    let isCurrentlyPlaying = false;
    let firstPlayTriggered = false;
    let abortControllers: AbortController[] = [];
    let isFetching = false; // 🔧 순차 요청을 위한 상태 플래그

    /**
     * 텍스트를 문장 단위로 분리
     */
    const splitIntoSentences = (text: string): string[] => {
        const sentences = text.split(SENTENCE_DELIMITERS).filter(s => s.trim().length > 0);

        // 너무 짧은 문장은 다음 문장과 합침
        const result: string[] = [];
        let accumulated = '';

        for (const sentence of sentences) {
            accumulated += (accumulated ? ' ' : '') + sentence;
            if (accumulated.length >= MIN_SENTENCE_LENGTH) {
                result.push(accumulated.trim());
                accumulated = '';
            }
        }

        // 남은 텍스트가 있으면 마지막 문장에 붙이거나 새로 추가
        if (accumulated.trim()) {
            if (result.length > 0) {
                result[result.length - 1] += ' ' + accumulated.trim();
            } else {
                result.push(accumulated.trim());
            }
        }

        return result;
    };

    /**
     * TTS API 호출하여 오디오 가져오기
     */
    const fetchTtsAudio = async (item: TtsQueueItem): Promise<void> => {
        if (isDestroyed) return;

        const controller = new AbortController();
        abortControllers.push(controller);

        try {
            item.status = 'loading';

            console.log(`🔊 TTS 요청 시작: "${item.text.substring(0, 30)}..."`);

            const response = await fetch(ttsApiUrl, {
                method: 'POST',
                headers: getStreamingHeaders(),
                body: JSON.stringify({
                    text: item.text.replace(/\([^)]*\)/g, ''),
                    promptId: promptId
                }),
                signal: controller.signal
            });

            if (!response.ok) {
                throw new Error(`TTS API error: ${response.status}`);
            }

            const blob = await response.blob();
            console.log(`✅ TTS 응답 완료: ${blob.size} bytes`);

            const url = URL.createObjectURL(blob);

            item.audioUrl = url;
            item.audio = new Audio(url);
            item.status = 'ready';

            // 오디오 준비되면 재생 시도
            tryPlayNext();

        } catch (error) {
            if ((error as Error).name === 'AbortError') {
                console.log('⏹️ TTS 요청 취소됨');
                item.status = 'error';
                return;
            }
            console.error('❌ TTS fetch error:', error);
            item.status = 'error';
            onError?.(error as Error);
            tryPlayNext();
        } finally {
            abortControllers = abortControllers.filter(c => c !== controller);

            // 🔧 중요: 현재 요청 완료 후에만 다음 요청 처리
            isFetching = false;

            // 응답 받은 후 다음 문장 요청 시작
            console.log(`📤 다음 문장 요청 준비 중... (대기 중인 항목: ${queue.filter(q => q.status === 'pending').length}개)`);
            processQueue();
        }
    };

    /**
     * 큐에서 대기 중인 다음 요청 처리 (순차적)
     */
    const processQueue = (): void => {
        if (isDestroyed || isFetching) return;

        const nextItem = queue.find(item => item.status === 'pending');
        if (nextItem) {
            isFetching = true;
            fetchTtsAudio(nextItem);
        }
    };

    /**
     * 큐에서 다음 문장 재생 시도 (순서 보장)
     */
    const tryPlayNext = (): void => {
        if (isDestroyed || isCurrentlyPlaying) return;

        // 🔧 순서대로 재생: 아직 재생되지 않은 첫 번째 아이템 찾기
        const nextIndex = queue.findIndex(item =>
            item.status !== 'done' && item.status !== 'playing'
        );

        if (nextIndex === -1) {
            // 모든 아이템 처리 완료
            if (queue.length > 0 && queue.every(item => item.status === 'done' || item.status === 'error')) {
                onAllDone?.();
            }
            return;
        }

        const nextItem = queue[nextIndex];

        // 에러 상태면 건너뛰기
        if (nextItem.status === 'error') {
            nextItem.status = 'done'; // 처리 완료로 표시
            tryPlayNext(); // 다음 아이템 시도
            return;
        }

        // 아직 준비 안 됐으면 대기 (순서 보장을 위해 기다림)
        if (nextItem.status !== 'ready' || !nextItem.audio) {
            // 로딩 중이면 기다림 - fetchTtsAudio 완료 시 다시 tryPlayNext 호출됨
            return;
        }

        isCurrentlyPlaying = true;
        nextItem.status = 'playing';
        currentAudio = nextItem.audio;

        // 첫 재생 콜백
        if (!firstPlayTriggered) {
            firstPlayTriggered = true;
            onFirstPlay?.();
        }

        nextItem.audio.onended = () => {
            if (nextItem.audioUrl) {
                URL.revokeObjectURL(nextItem.audioUrl);
            }
            nextItem.status = 'done';
            isCurrentlyPlaying = false;
            currentAudio = null;
            tryPlayNext();
        };

        nextItem.audio.onerror = () => {
            console.error('Audio playback error');
            nextItem.status = 'error';
            isCurrentlyPlaying = false;
            currentAudio = null;
            tryPlayNext();
        };

        nextItem.audio.play().catch(err => {
            console.error('Audio play failed:', err);
            nextItem.status = 'error';
            isCurrentlyPlaying = false;
            currentAudio = null;
            tryPlayNext();
        });
    };

    /**
     * 문장을 큐에 추가
     */
    const addSentence = (sentence: string): void => {
        if (isDestroyed) return;

        textBuffer += sentence;

        // 문장 구분자가 있으면 분리하여 큐에 추가
        const sentences = splitIntoSentences(textBuffer);

        if (sentences.length > 1) {
            // 마지막 문장은 아직 완성되지 않았을 수 있으므로 버퍼에 유지
            const completeSentences = sentences.slice(0, -1);
            textBuffer = sentences[sentences.length - 1];

            for (const s of completeSentences) {
                const item: TtsQueueItem = { text: s, status: 'pending' };
                queue.push(item);
            }
            // 🔧 큐에 추가 후 순차 처리 시작
            processQueue();
        }
    };

    /**
     * 스트리밍 완료 시 남은 버퍼 처리
     */
    const flush = (): void => {
        if (isDestroyed) return;

        if (textBuffer.trim()) {
            const item: TtsQueueItem = { text: textBuffer.trim(), status: 'pending' };
            queue.push(item);
            textBuffer = '';
            // 마지막 아이템 처리 시도
            processQueue();
        }

        // 혹시 처리되지 않은 pending 아이템이 있다면 처리
        processQueue();
    };

    /**
     * 모든 재생 중지 및 큐 초기화
     */
    const stop = (): void => {
        // 진행 중인 요청 취소
        abortControllers.forEach(c => c.abort());
        abortControllers = [];

        // 현재 재생 중지
        if (currentAudio) {
            currentAudio.pause();
            currentAudio = null;
        }

        // URL 해제
        for (const item of queue) {
            if (item.audioUrl) {
                URL.revokeObjectURL(item.audioUrl);
            }
        }

        queue = [];
        textBuffer = '';
        isCurrentlyPlaying = false;
        isFetching = false;
        firstPlayTriggered = false;
    };

    /**
     * 현재 재생 중인지 확인
     */
    const isPlaying = (): boolean => isCurrentlyPlaying;

    /**
     * 파괴 (cleanup)
     */
    const destroy = (): void => {
        isDestroyed = true;
        stop();
    };

    return {
        addSentence,
        flush,
        stop,
        isPlaying,
        destroy
    };
}
