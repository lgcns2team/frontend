import { getStreamingHeaders, getUserId } from './api-utils';

/**
 * Stream event types from AI chat API
 */
export interface AIChatStreamEvent {
    type: 'content' | 'citations' | 'done' | 'error' | 'tool_call';
    text?: string;
    count?: number;
    total_length?: number;
    message?: string;
    tool_name?: string;
    parameters?: Record<string, any>;
}

/**
 * Tool call event from AI chat
 */
export interface ToolCallEvent {
    tool_name: string;
    parameters: Record<string, any>;
}
/**
 * AI 대화 히스토리 아이템 구조
 */
export interface ChatHistoryItem {
    role: 'user' | 'assistant' | 'ai';
    content: string,
    createdAt?: string;
}

/**
 * AI 인물과의 대화 히스토리 불러오기
 * @param promptId - 인물의 prompt ID
 */
export const getCharacterChatHistory = async (
    promptId: string
): Promise<ChatHistoryItem[]> => {
    const userId = getUserId();
    // 백엔드 엔드포인트에 맞춰 URL 생성
    const url = `/api/ai-person/${promptId}/history?userId=${userId}`;

    console.log('📜 [getCharacterChatHistory] Fetching history:', { url, promptId });

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                // 인증 토큰이 필요하다면 기존 유틸리티 활용
                ...getStreamingHeaders(),
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch history: ${response.status}`);
        }

        const data = await response.json();
        console.log('✅ [getCharacterChatHistory] Success:', data.length, 'messages found');
        return data;
    } catch (error) {
        console.error('❌ [getCharacterChatHistory] Error:', error);
        return [];
    }
}

/**
 * Callback function for handling streaming chunks
 */
export type StreamCallback = (text: string) => void;
export type ToolCallCallback = (toolCall: ToolCallEvent) => void;

/**
 * Send a message to AI character chat and receive streaming response
 * @param promptId - Character's prompt ID
 * @param message - User's message
 * @param onChunk - Callback function called for each text chunk
 */
export const sendCharacterMessage = async (
    promptId: string,
    message: string,
    onChunk: StreamCallback
): Promise<void> => {
    const userId = getUserId();

    // URL을 단순하게 - Query parameter 제거
    const url = `/api/ai/character/${promptId}/chat?userId=${userId}`;

    console.log('🚀 [sendCharacterMessage] Starting request:', { url, promptId, userId });

    const response = await fetch(url, {
        method: 'POST',
        headers: getStreamingHeaders(),
        body: JSON.stringify({
            message,
            userId,      // body에 포함
            promptId     // body에도 포함 (중복이지만 안전)
        }),
    });

    console.log('📥 [sendCharacterMessage] Response received:', {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText
    });

    if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unable to read error');
        console.error('❌ [sendCharacterMessage] Request failed:', {
            status: response.status,
            statusText: response.statusText,
            errorText
        });
        throw new Error(`Request failed: ${response.status} ${response.statusText}`);
    }

    if (!response.body) {
        console.error('❌ [sendCharacterMessage] Response body is null');
        throw new Error('Response body is null');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let fullResponse = ''; // 전체 응답 수집 (비 SSE 응답 처리용)
    let hasReceivedContent = false; // 응답 내용이 있었는지 추적

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;
        fullResponse += chunk;
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
            if (line.startsWith('data:')) {
                const dataStr = line.substring(5).trim();
                if (!dataStr || dataStr === '[DONE]') continue;

                // Try JSON parsing, fallback to plain text
                let parsed = false;
                try {
                    const event: AIChatStreamEvent = JSON.parse(dataStr);
                    parsed = true;
                    console.log('📦 [sendCharacterMessage] Parsed event:', event.type);
                    if (event.type === 'content' && typeof event.text === 'string') {
                        onChunk(event.text);
                        hasReceivedContent = true;
                    } else if (event.type === 'error') {
                        console.error('❌ [sendCharacterMessage] Error from backend:', event.message);
                        throw new Error(event.message || 'Backend error');
                    } else if (typeof event === 'string') {
                        onChunk(event);
                        hasReceivedContent = true;
                    }
                } catch (e) {
                    // JSON 파싱이 성공했는데 에러가 발생했으면 (의도적 throw) 다시 던진다
                    if (parsed) {
                        throw e;
                    }
                    // Not JSON, treat as plain text
                    console.log('📝 [sendCharacterMessage] Plain text chunk:', dataStr.substring(0, 50));
                    if (dataStr) {
                        onChunk(dataStr);
                        hasReceivedContent = true;
                    }
                }
            }
        }
    }

    // 비 SSE JSON 응답 처리 (data: prefix 없이 바로 JSON이 온 경우)
    if (!hasReceivedContent && fullResponse.trim()) {
        console.log('📨 [sendCharacterMessage] Trying to parse as plain JSON:', fullResponse.trim());
        try {
            const jsonResponse = JSON.parse(fullResponse.trim());

            // 에러 응답 처리
            if (jsonResponse.type === 'error') {
                console.error('❌ [sendCharacterMessage] Error from backend (non-SSE):', jsonResponse.message);
                throw new Error(jsonResponse.message || 'Backend error');
            }

            // 일반 텍스트 응답 처리
            if (jsonResponse.text || jsonResponse.content || jsonResponse.message) {
                const text = jsonResponse.text || jsonResponse.content || jsonResponse.message;
                onChunk(text);
                hasReceivedContent = true;
            }
        } catch (e) {
            // JSON 파싱 실패 - 에러로 rethrow (위에서 throw한 Error인 경우)
            if (e instanceof Error && e.message !== 'Unexpected token' && !e.message.includes('JSON')) {
                throw e;
            }
            console.log('📝 [sendCharacterMessage] Not valid JSON, treating as plain text');
            if (fullResponse.trim()) {
                onChunk(fullResponse.trim());
                hasReceivedContent = true;
            }
        }
    }

    // 스트림이 끝났는데 아무 응답도 없으면 에러 throw
    if (!hasReceivedContent) {
        console.error('❌ [sendCharacterMessage] No content received from backend');
        throw new Error('No response from server');
    }
};

/**
 * Send a message to general AI chat and receive streaming response
 * @param message - User's message
 * @param onChunk - Callback function called for each text chunk
 * @param onToolCall - Optional callback function called when a tool call is received
 */
export const sendGeneralMessage = async (
    message: string,
    onChunk: StreamCallback,
    onToolCall?: ToolCallCallback
): Promise<void> => {
    const url = '/api/ai/agent-chat';
    console.log('🚀 [sendGeneralMessage] Starting request:', { url, message: message.substring(0, 50) });

    const response = await fetch(url, {
        method: 'POST',
        headers: getStreamingHeaders(),
        body: JSON.stringify({ message }),
    });

    console.log('📥 [sendGeneralMessage] Response received:', {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText
    });

    if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unable to read error');
        console.error('❌ [sendGeneralMessage] Request failed:', {
            status: response.status,
            statusText: response.statusText,
            errorText
        });
        throw new Error(`Request failed: ${response.status} ${response.statusText}`);
    }

    if (!response.body) {
        console.error('❌ [sendGeneralMessage] Response body is null');
        throw new Error('Response body is null');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let fullResponse = ''; // Collect full response for non-SSE handling

    while (true) {
        const { done, value } = await reader.read();
        if (done) {
            console.log('📨 [sendGeneralMessage] Stream done. Full response length:', fullResponse.length);
            break;
        }

        const chunk = decoder.decode(value, { stream: true });
        console.log('📨 [sendGeneralMessage] Received chunk:', chunk.substring(0, 200));
        buffer += chunk;
        fullResponse += chunk;
        console.log('📨 [sendGeneralMessage] Raw chunk received:', JSON.stringify(chunk));

        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
            console.log('📨 [sendGeneralMessage] Raw line:', line);

            if (line.startsWith('data:')) {
                const dataStr = line.substring(5).trim();
                console.log('📨 [sendGeneralMessage] Parsed dataStr:', dataStr);
                if (!dataStr || dataStr === '[DONE]') continue;

                try {
                    const event: AIChatStreamEvent = JSON.parse(dataStr);

                    if (event.type === 'content' && typeof event.text === 'string') {
                        onChunk(event.text);
                    } else if (event.type === 'tool_call' && event.tool_name && event.parameters) {
                        console.log('🔧 Tool call received:', event.tool_name, event.parameters);
                        if (onToolCall) {
                            onToolCall({
                                tool_name: event.tool_name,
                                parameters: event.parameters
                            });
                        }
                    } else if (event.type === 'citations') {
                        console.log('📚 Received citations:', event.count);
                    } else if (event.type === 'done') {
                        console.log('✅ Stream completed');
                    } else if (event.type === 'error') {
                        console.error('❌ Error from backend:', event.message);
                    }
                } catch (e) {
                    console.error('Error parsing SSE JSON:', e, 'Data:', dataStr);
                }
            }
        }
    }

    // Handle non-SSE response (plain JSON)
    if (fullResponse && !fullResponse.includes('data:')) {
        console.log('📨 [sendGeneralMessage] Trying to parse as plain JSON');
        try {
            const jsonResponse = JSON.parse(fullResponse.trim());
            console.log('📨 [sendGeneralMessage] Parsed JSON response:', jsonResponse);

            // Check if it's a tool_call response
            if (jsonResponse.type === 'tool_call' && jsonResponse.tool_name && jsonResponse.parameters) {
                console.log('🔧 Tool call received (non-SSE):', jsonResponse.tool_name, jsonResponse.parameters);
                if (onToolCall) {
                    onToolCall({
                        tool_name: jsonResponse.tool_name,
                        parameters: jsonResponse.parameters
                    });
                }
            }

            // Check if response contains text content
            if (jsonResponse.text || jsonResponse.content || jsonResponse.message) {
                const text = jsonResponse.text || jsonResponse.content || jsonResponse.message;
                onChunk(text);
            }
        } catch (e) {
            console.log('📨 [sendGeneralMessage] Not valid JSON, treating as plain text');
            if (fullResponse.trim()) {
                onChunk(fullResponse.trim());
            }
        }
    }
};
