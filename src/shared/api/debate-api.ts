import { getAuthHeaders } from './api-utils';


/**
 * Debate topic interface
 */
export interface DebateTopic {
    topic: string;
    description: string;
}

/**
 * Response from debate topics recommendation API
 */
export interface DebateTopicsResponse {
    debate_topics: DebateTopic[];
}

/**
 * Request debate topic recommendations based on keyword
 * @param keyword - User's keyword for topic recommendation
 * @returns Array of recommended debate topics
 */
export const recommendDebateTopics = async (keyword: string): Promise<DebateTopic[]> => {
    console.log('🚀 [recommendDebateTopics] Starting request with keyword:', keyword);

    // AI API는 /api/ai 경로를 사용해야 Vite 프록시가 8000번 포트로 라우팅함
    const response = await fetch('/api/ai/debate/topics/recommend', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ user_query: keyword }),
    });

    console.log('📥 [recommendDebateTopics] Response received:', {
        status: response.status,
        ok: response.ok
    });

    if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unable to read error');
        console.error('❌ [recommendDebateTopics] Request failed:', {
            status: response.status,
            errorText
        });
        throw new Error(`Failed to get recommendations: ${response.status}`);
    }

    const data: DebateTopicsResponse = await response.json();
    console.log('✅ [recommendDebateTopics] Received topics:', data.debate_topics.length);

    return data.debate_topics;
};

/**
 * Discussion summary option interface
 */
export interface SummaryOption {
    id: string;
    argument: string;
    historical_outcome: string[];
}

/**
 * Discussion summary response interface
 */
export interface DiscussionSummaryResponse {
    room_id: string;
    topic: string;
    used_message_count: number;
    result: {
        topic: string;
        summary: string[];
        options: SummaryOption[];
    };
    meta: {
        extracted_pro_points: string[];
        extracted_con_points: string[];
        key_clashes: string[];
        used_message_count: number;
    };
}

/**
 * Get discussion summary from AI
 * @param roomId - Discussion room ID
 * @param topic - Discussion topic
 * @returns Discussion summary with options
 */
export const getDiscussionSummary = async (roomId: string, topic: string): Promise<DiscussionSummaryResponse> => {
    console.log('🚀 [getDiscussionSummary] Starting request:', { roomId, topic });

    const response = await fetch(`/api/ai/debate/${roomId}/summary`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ topic }),
    });

    console.log('📥 [getDiscussionSummary] Response received:', {
        status: response.status,
        ok: response.ok
    });

    if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unable to read error');
        console.error('❌ [getDiscussionSummary] Request failed:', {
            status: response.status,
            errorText
        });
        throw new Error(`Failed to get summary: ${response.status}`);
    }

    const data: DiscussionSummaryResponse = await response.json();
    console.log('✅ [getDiscussionSummary] Received summary with', data.result.options.length, 'options');

    return data;
};
