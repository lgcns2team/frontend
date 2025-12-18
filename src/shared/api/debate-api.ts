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
 * Discussion room interface
 */
export interface DiscussionRoom {
    id?: string;
    roomId?: string;
    topicTitle?: string;
    title?: string;
    topicDescription?: string;
    description?: string;
    content?: string;
    viewMode?: string;
}

/**
 * Request debate topic recommendations based on keyword
 * @param keyword - User's keyword for topic recommendation
 * @returns Array of recommended debate topics
 */
export const recommendDebateTopics = async (keyword: string): Promise<DebateTopic[]> => {
    console.log('🚀 [recommendDebateTopics] Starting request with keyword:', keyword);

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
 * Fetch all discussion rooms from the backend
 * @returns Array of discussion rooms
 */
export const getDiscussionRooms = async (): Promise<DiscussionRoom[]> => {
    console.log('🚀 [getDiscussionRooms] Fetching discussion rooms');

    const response = await fetch('/api/debate/rooms', {
        method: 'GET',
        headers: getAuthHeaders(),
    });

    console.log('📥 [getDiscussionRooms] Response received:', {
        status: response.status,
        ok: response.ok
    });

    if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unable to read error');
        console.error('❌ [getDiscussionRooms] Request failed:', {
            status: response.status,
            errorText
        });
        throw new Error(`Failed to fetch discussion rooms: ${response.status}`);
    }

    const data: DiscussionRoom[] = await response.json();
    console.log('✅ [getDiscussionRooms] Received rooms:', data.length);

    return data;
};
