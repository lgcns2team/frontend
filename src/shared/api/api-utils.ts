/**
 * Shared API utility functions
 */

/**
 * Get headers with JWT authentication
 * @returns Headers object with Authorization header if token exists
 */
export const getAuthHeaders = (): HeadersInit => {
    const token = localStorage.getItem('accessToken');
    const headers: HeadersInit = {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    };

    if (token) {
        // Remove Bearer prefix if it exists in the stored token to prevent duplication
        const cleanToken = token.startsWith('Bearer ') ? token.slice(7) : token;
        headers['Authorization'] = `Bearer ${cleanToken}`;
    }

    return headers;
};

/**
 * Get headers for streaming APIs (Server-Sent Events)
 * @returns Headers object with Authorization header and streaming-compatible Accept header
 */
export const getStreamingHeaders = (): HeadersInit => {
    const token = localStorage.getItem('accessToken');
    const headers: HeadersInit = {
        'Accept': '*/*',  // Accept any content type (for SSE/streaming)
        'Content-Type': 'application/json'
    };

    if (token) {
        // Remove Bearer prefix if it exists in the stored token to prevent duplication
        const cleanToken = token.startsWith('Bearer ') ? token.slice(7) : token;
        headers['Authorization'] = `Bearer ${cleanToken}`;
    }

    return headers;
};

/**
 * Get user ID from localStorage
 * @returns User ID or default value '1' if not found
 */
export const getUserId = (): string => {
    return localStorage.getItem('userId') || '1';
};
