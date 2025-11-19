// API Client for Backend Communication
// Use relative path to leverage nginx proxy configuration
const API_BASE_URL = '/api';

class ApiClient {
    constructor() {
        this.baseURL = API_BASE_URL;
    }

    // Get access token from localStorage
    getAccessToken() {
        return localStorage.getItem('accessToken');
    }

    // Get refresh token from localStorage
    getRefreshToken() {
        return localStorage.getItem('refreshToken');
    }

    // Set tokens in localStorage
    setTokens(accessToken, refreshToken) {
        localStorage.setItem('accessToken', accessToken);
        if (refreshToken) {
            localStorage.setItem('refreshToken', refreshToken);
        }
    }

    // Clear tokens from localStorage
    clearTokens() {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
    }

    // Make HTTP request with optional authentication
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        // Add Authorization header if access token exists
        const accessToken = this.getAccessToken();
        if (accessToken && !options.skipAuth) {
            headers['Authorization'] = `Bearer ${accessToken}`;
        }

        const config = {
            ...options,
            headers
        };

        try {
            const response = await fetch(url, config);

            // Handle 401 Unauthorized - try to refresh token
            if (response.status === 401 && !options.skipAuth) {
                const refreshed = await this.refreshAccessToken();
                if (refreshed) {
                    // Retry the original request with new token
                    headers['Authorization'] = `Bearer ${this.getAccessToken()}`;
                    const retryResponse = await fetch(url, { ...config, headers });
                    return await this.handleResponse(retryResponse);
                } else {
                    // Refresh failed, logout user
                    this.clearTokens();
                    window.location.href = '/login.html';
                    throw new Error('Session expired. Please login again.');
                }
            }

            return await this.handleResponse(response);
        } catch (error) {
            console.error('API Request Error:', error);
            throw error;
        }
    }

    // Handle API response
    async handleResponse(response) {
        const contentType = response.headers.get('content-type');
        let data;

        try {
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                data = await response.text();
            }
        } catch (parseError) {
            console.error('Response parsing error:', parseError);
            data = { message: '서버 응답을 처리할 수 없습니다.' };
        }

        if (!response.ok) {
            // 서버에서 받은 에러 메시지 구조화
            let errorMessage = 'API request failed';
            let errorCode = null;

            if (typeof data === 'object' && data.message) {
                errorMessage = data.message;
                errorCode = data.code;
            } else if (typeof data === 'string') {
                // HTML 에러 페이지인 경우
                if (data.includes('<html>') || data.includes('<!DOCTYPE')) {
                    errorMessage = `서버 내부 오류가 발생했습니다 (HTTP ${response.status})`;
                } else {
                    errorMessage = data;
                }
            }

            const error = new Error(errorMessage);
            error.status = response.status;
            error.data = typeof data === 'object' ? data : { message: errorMessage, code: errorCode };
            throw error;
        }

        return data;
    }

    // Refresh access token using refresh token
    async refreshAccessToken() {
        const refreshToken = this.getRefreshToken();
        if (!refreshToken) {
            return false;
        }

        try {
            const response = await fetch(`${this.baseURL}/auth/refresh`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ refreshToken })
            });

            if (response.ok) {
                const data = await response.json();
                this.setTokens(data.accessToken, data.refreshToken);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Token refresh failed:', error);
            return false;
        }
    }

    // Authentication APIs
    async login(email, password) {
        const response = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
            skipAuth: true
        });

        // 백엔드 응답 형식: {success, code, message, data: {accessToken, refreshToken, tokenType}}
        if (response.success && response.data) {
            // Save tokens to localStorage
            this.setTokens(response.data.accessToken, response.data.refreshToken);
        }

        return response;
    }

    async logout() {
        const refreshToken = this.getRefreshToken();
        try {
            await this.request('/auth/logout', {
                method: 'POST',
                body: JSON.stringify({ refreshToken })
            });
        } catch (error) {
            console.error('Logout API error:', error);
        } finally {
            this.clearTokens();
        }
    }

    // User APIs
    async signup(userData) {
        return await this.request('/users/signup', {
            method: 'POST',
            body: JSON.stringify(userData),
            skipAuth: true
        });
    }

    async getUserInfo() {
        return await this.request('/users/me', {
            method: 'GET'
        });
    }

    async verifyUser(verificationData) {
        return await this.request('/users/verify', {
            method: 'POST',
            body: JSON.stringify(verificationData)
        });
    }

    // 비밀번호 재설정 - 3단계 프로세스
    // 1단계: 이메일로 인증 코드 발송
    async forgotPassword(email) {
        return await this.request('/auth/forgot-password', {
            method: 'POST',
            body: JSON.stringify({ email }),
            skipAuth: true
        });
    }

    // 2단계: 인증 코드 검증
    async verifyResetCode(code) {
        return await this.request('/auth/verify-code', {
            method: 'POST',
            body: JSON.stringify({ code }),
            skipAuth: true
        });
    }

    // 3단계: 새 비밀번호 설정 (임시 토큰 사용)
    async resetPassword(newPassword, confirmPassword, temporaryToken) {
        return await this.request('/auth/reset-password', {
            method: 'POST',
            body: JSON.stringify({ newPassword, confirmPassword }),
            headers: {
                'Authorization': `Bearer ${temporaryToken}`
            },
            skipAuth: true // getAccessToken() 호출 방지
        });
    }

    async deleteUser(deleteData) {
        return await this.request('/users', {
            method: 'DELETE',
            body: JSON.stringify(deleteData)
        });
    }

    // Check nickname availability
    async checkNickname(nickname, requireAuth = false) {
        return await this.request(`/users/check-nickname?nickname=${encodeURIComponent(nickname)}`, {
            method: 'GET',
            skipAuth: !requireAuth
        });
    }

    // Check phone availability
    async checkPhone(phone) {
        return await this.request(`/users/check-phone?phone=${encodeURIComponent(phone)}`, {
            method: 'GET'
        });
    }

    // Verify password for sensitive operations
    async verifyPassword(passwordData) {
        return await this.request('/users/verify-password', {
            method: 'POST',
            body: JSON.stringify(passwordData)
        });
    }

    // Update user profile information
    async updateUserInfo(userData) {
        return await this.request('/users/me', {
            method: 'PUT',
            body: JSON.stringify(userData)
        });
    }

    // ==================== Children APIs ====================

    /**
     * 자녀 등록
     * @param {Object} childData - 자녀 정보
     * @param {string} childData.childName - 자녀 이름 (필수, 최대 20자)
     * @param {string} childData.childBirth - 생년월일 (선택, YYYY-MM-DD 형식)
     * @param {string} childData.gender - 성별 (필수, "M" 또는 "F")
     * @param {number} childData.birthOrder - 출생 순서 (선택)
     * @param {string} childData.color - 프로필 색상 코드 (선택, 최대 10자, 예: "#FFB6C1")
     * @param {string} childData.profileImg - 프로필 이미지 URL (선택, 최대 255자)
     * @returns {Promise<Object>} 등록된 자녀 정보
     */
    async createChild(childData) {
        return await this.request('/children', {
            method: 'POST',
            body: JSON.stringify(childData)
        });
    }

    /**
     * 자녀 목록 조회
     * @returns {Promise<Array>} 자녀 목록
     */
    async getChildren() {
        return await this.request('/children', {
            method: 'GET'
        });
    }

    /**
     * 자녀 상세 조회
     * @param {number} childId - 자녀 ID
     * @returns {Promise<Object>} 자녀 상세 정보
     */
    async getChild(childId) {
        return await this.request(`/children/${childId}`, {
            method: 'GET'
        });
    }

    /**
     * 자녀 정보 수정 (부분 업데이트)
     * @param {number} childId - 자녀 ID
     * @param {Object} childData - 수정할 자녀 정보 (수정할 필드만 포함)
     * @param {string} childData.childName - 자녀 이름 (선택, 최대 20자)
     * @param {string} childData.childBirth - 생년월일 (선택, YYYY-MM-DD 형식)
     * @param {string} childData.gender - 성별 (선택, "M" 또는 "F")
     * @param {number} childData.birthOrder - 출생 순서 (선택)
     * @param {string} childData.color - 프로필 색상 코드 (선택, 최대 10자)
     * @param {string} childData.profileImg - 프로필 이미지 URL (선택, 최대 255자)
     * @returns {Promise<Object>} 수정된 자녀 정보
     */
    async updateChild(childId, childData) {
        return await this.request(`/children/${childId}`, {
            method: 'PATCH',
            body: JSON.stringify(childData)
        });
    }

    /**
     * 자녀 삭제
     * @param {number} childId - 자녀 ID
     * @returns {Promise<Object>} 삭제 결과
     */
    async deleteChild(childId) {
        return await this.request(`/children/${childId}`, {
            method: 'DELETE'
        });
    }

    // ==================== Notice APIs ====================

    /**
     * 공지사항 목록 조회 (페이징)
     * @param {number} page - 페이지 번호 (0부터 시작)
     * @param {number} size - 페이지 크기
     * @returns {Promise<Object>} 페이징된 공지사항 목록
     */
    async getNotices(page = 0, size = 10) {
        return await this.request(`/notices?page=${page}&size=${size}`, {
            method: 'GET',
            skipAuth: true // 인증 불필요
        });
    }

    /**
     * 공지사항 상세 조회
     * @param {number} noticeId - 공지사항 ID
     * @returns {Promise<Object>} 공지사항 상세 정보
     */
    async getNotice(noticeId) {
        return await this.request(`/notices/${noticeId}`, {
            method: 'GET',
            skipAuth: true // 인증 불필요
        });
    }

    /**
     * 공지사항 작성 (ADMIN 전용)
     * @param {Object} noticeData - 공지사항 정보
     * @param {string} noticeData.title - 제목 (필수, 최대 100자)
     * @param {string} noticeData.content - 내용 (필수, 최대 2000자)
     * @param {number} noticeData.imageId - 이미지 ID (선택)
     * @returns {Promise<Object>} 작성된 공지사항 정보
     */
    async createNotice(noticeData) {
        return await this.request('/notices', {
            method: 'POST',
            body: JSON.stringify(noticeData)
        });
    }

    /**
     * 공지사항 수정 (ADMIN 전용)
     * @param {number} noticeId - 공지사항 ID
     * @param {Object} noticeData - 수정할 공지사항 정보
     * @param {string} noticeData.title - 제목 (선택, 최대 100자)
     * @param {string} noticeData.content - 내용 (선택, 최대 2000자)
     * @param {number} noticeData.imageId - 이미지 ID (선택)
     * @returns {Promise<Object>} 수정된 공지사항 정보
     */
    async updateNotice(noticeId, noticeData) {
        return await this.request(`/notices/${noticeId}`, {
            method: 'PATCH',
            body: JSON.stringify(noticeData)
        });
    }

    /**
     * 공지사항 삭제 (ADMIN 전용)
     * @param {number} noticeId - 공지사항 ID
     * @returns {Promise<Object>} 삭제 결과
     */
    async deleteNotice(noticeId) {
        return await this.request(`/notices/${noticeId}`, {
            method: 'DELETE'
        });
    }

    // ==================== Board Image APIs ====================

    /**
     * 게시판 이미지 업로드
     * @param {File} file - 업로드할 이미지 파일
     * @returns {Promise<Object>} 업로드된 이미지 정보 (imageId 포함)
     */
    async uploadBoardImage(file) {
        const formData = new FormData();
        formData.append('file', file);

        // FormData 전송 시에는 Content-Type 헤더를 자동으로 설정하도록 함
        const accessToken = localStorage.getItem('accessToken');

        const response = await fetch(`${this.baseURL}/board-images/upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`
            },
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw {
                status: response.status,
                data: errorData
            };
        }

        return await response.json();
    }

    /**
     * 게시판 이미지 조회 (Blob)
     * @param {number} imageId - 이미지 ID
     * @returns {Promise<string>} Blob URL
     */
    async getBoardImage(imageId) {
        const accessToken = localStorage.getItem('accessToken');

        const response = await fetch(`${this.baseURL}/board-images/${imageId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (!response.ok) {
            throw new Error(`이미지 조회 실패: ${response.status}`);
        }

        const blob = await response.blob();
        return URL.createObjectURL(blob);
    }

    /**
     * 게시판 이미지 삭제
     * @param {number} imageId - 이미지 ID
     * @returns {Promise<Object>} 삭제 결과
     */
    async deleteBoardImage(imageId) {
        return await this.request(`/board-images/${imageId}`, {
            method: 'DELETE'
        });
    }
}

// Export singleton instance
const apiClient = new ApiClient();
