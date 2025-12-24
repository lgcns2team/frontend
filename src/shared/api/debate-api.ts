import { getAuthHeaders } from './api-utils';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

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

    const response = await fetch(`${API_BASE_URL}/ai/debate/topics/recommend`, {
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
