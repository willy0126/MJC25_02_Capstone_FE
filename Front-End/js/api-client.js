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

    // Set access token in localStorage (refreshToken은 HttpOnly 쿠키로 관리)
    setAccessToken(accessToken) {
        localStorage.setItem('accessToken', accessToken);
    }

    // Clear access token from localStorage
    clearTokens() {
        localStorage.removeItem('accessToken');
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
            headers,
            credentials: 'include'  // 쿠키 자동 전송 (refreshToken)
        };

        try {
            const response = await fetch(url, config);

            // Handle 401 Unauthorized - try to refresh token
            if (response.status === 401 && !options.skipAuth) {
                const refreshed = await this.refreshAccessToken();
                if (refreshed) {
                    // Retry the original request with new token
                    headers['Authorization'] = `Bearer ${this.getAccessToken()}`;
                    const retryResponse = await fetch(url, { ...config, headers, credentials: 'include' });
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
        try {
            // refreshToken은 HttpOnly 쿠키로 자동 전송됨
            const response = await fetch(`${this.baseURL}/auth/refresh`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include'  // 쿠키 자동 전송
            });

            if (response.ok) {
                const data = await response.json();
                // accessToken만 localStorage에 저장 (refreshToken은 쿠키로 관리)
                if (data.success && data.data) {
                    this.setAccessToken(data.data);
                }
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

        // 백엔드 응답 형식: {success, code, message, data: accessToken}
        // refreshToken은 Set-Cookie 헤더로 전송됨 (HttpOnly)
        if (response.success && response.data) {
            // accessToken만 localStorage에 저장
            this.setAccessToken(response.data);
        }

        return response;
    }

    async logout() {
        try {
            // refreshToken은 쿠키로 자동 전송됨
            await this.request('/auth/logout', {
                method: 'POST'
            });
        } catch (error) {
            console.error('Logout API error:', error);
        } finally {
            this.clearTokens();
        }
    }

    // ==================== OAuth2 Social Login APIs ====================

    /**
     * 카카오 OAuth2 로그인 URL 가져오기
     * @returns {Promise<Object>} { loginUrl: string }
     */
    async getKakaoLoginUrl() {
        return await this.request('/auth/oauth2/kakao', {
            method: 'GET',
            skipAuth: true
        });
    }

    /**
     * 네이버 OAuth2 로그인 URL 가져오기
     * @returns {Promise<Object>} { loginUrl: string }
     */
    async getNaverLoginUrl() {
        return await this.request('/auth/oauth2/naver', {
            method: 'GET',
            skipAuth: true
        });
    }

    /**
     * 모든 소셜 로그인 URL 가져오기
     * @returns {Promise<Object>} { kakao: string, naver: string }
     */
    async getSocialLoginUrls() {
        return await this.request('/auth/oauth2/login-urls', {
            method: 'GET',
            skipAuth: true
        });
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

    // 회원가입 이메일 인증 - 2단계 프로세스
    // 1단계: 이메일로 인증 코드 발송
    async sendSignupVerificationCode(email) {
        return await this.request('/auth/singup/send-code', {
            method: 'POST',
            body: JSON.stringify({ email }),
            skipAuth: true
        });
    }

    // 2단계: 인증 코드 검증
    async verifySignupCode(email, code) {
        return await this.request('/auth/singup/verify-code', {
            method: 'POST',
            body: JSON.stringify({ email, code }),
            skipAuth: true
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
        formData.append('usageType', 'BOOK');

        // FormData 전송 시에는 Content-Type 헤더를 자동으로 설정하도록 함
        const accessToken = localStorage.getItem('accessToken');

        const response = await fetch(`${this.baseURL}/images/upload`, {
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

        const response = await fetch(`${this.baseURL}/images/${imageId}`, {
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

    // ==================== Book APIs ====================

    /**
     * 도서 등록
     * @param {Object} bookData - 도서 정보
     * @param {string} bookData.title - 제목 (필수)
     * @param {string} bookData.author - 저자 (필수)
     * @param {string} bookData.publisher - 출판사 (선택)
     * @param {string} bookData.publicationYear - 출판년도 (선택)
     * @param {string} bookData.isbn - ISBN (선택)
     * @param {string} bookData.coverUrl - 표지 이미지 URL (선택)
     * @param {string} bookData.description - 책 소개 (선택)
     * @returns {Promise<Object>} 등록된 도서 정보
     */
    async createBook(bookData) {
        return await this.request('/books', {
            method: 'POST',
            body: JSON.stringify(bookData)
        });
    }

    /**
     * 도서 목록 조회
     * @returns {Promise<Array>} 도서 목록
     */
    async getBooks() {
        return await this.request('/books', {
            method: 'GET'
        });
    }

    /**
     * 도서 상세 조회
     * @param {number} bookId - 도서 ID
     * @returns {Promise<Object>} 도서 상세 정보
     */
    async getBook(bookId) {
        return await this.request(`/books/${bookId}`, {
            method: 'GET'
        });
    }

    /**
     * 도서 정보 수정
     * @param {number} bookId - 도서 ID
     * @param {Object} bookData - 수정할 도서 정보
     * @returns {Promise<Object>} 수정된 도서 정보
     */
    async updateBook(bookId, bookData) {
        return await this.request(`/books/${bookId}`, {
            method: 'PUT',
            body: JSON.stringify(bookData)
        });
    }

    /**
     * 도서 삭제
     * @param {number} bookId - 도서 ID
     * @returns {Promise<Object>} 삭제 결과
     */
    async deleteBook(bookId) {
        return await this.request(`/books/${bookId}`, {
            method: 'DELETE'
        });
    }

    // ==================== Calendar APIs ====================

    /**
     * 월간 캘린더 데이터 조회
     * @param {number} year - 연도
     * @param {number} month - 월 (1-12)
     * @returns {Promise<Array>} 월간 독서 기록 목록
     */
    async getMonthlyCalendar(year, month) {
        // Swagger: GET /api/calendar/{year}/{month}
        return await this.request(`/calendar/${year}/${month}`, {
            method: 'GET'
        });
    }

    /**
     * 일간 독서 기록 조회
     * @param {string} date - 날짜 (YYYY-MM-DD 형식)
     * @returns {Promise<Object>} 일간 독서 기록
     */
    async getDailyRecords(date) {
        // Swagger: GET /api/calendar/date?date={date}
        return await this.request(`/calendar/date?date=${date}`, {
            method: 'GET'
        });
    }

    // ==================== Reading Schedule APIs ====================

    /**
     * 독서 일정 등록
     * @param {Object} scheduleData - 독서 일정 정보
     * @param {number} scheduleData.bookId - 도서 ID (필수)
     * @param {number} scheduleData.childId - 자녀 ID (필수)
     * @param {string} scheduleData.startDate - 시작일 (YYYY-MM-DD 형식)
     * @param {string} scheduleData.endDate - 종료일 (YYYY-MM-DD 형식)
     * @returns {Promise<Object>} 등록된 독서 일정 정보
     */
    async createReadingSchedule(scheduleData) {
        return await this.request('/book-details', {
            method: 'POST',
            body: JSON.stringify(scheduleData)
        });
    }

    /**
     * 독서 일정 수정
     * @param {number} detailsId - 독서 상세 ID
     * @param {Object} scheduleData - 수정할 일정 정보
     * @param {string} scheduleData.status - 상태 (선택)
     * @param {string} scheduleData.startDate - 시작일 (선택)
     * @param {string} scheduleData.endDate - 종료일 (선택)
     * @returns {Promise<Object>} 수정된 독서 일정 정보
     */
    async updateReadingSchedule(detailsId, scheduleData) {
        return await this.request(`/book-details/${detailsId}`, {
            method: 'PUT',
            body: JSON.stringify(scheduleData)
        });
    }

    /**
     * 독서 일정 삭제
     * @param {number} detailsId - 독서 상세 ID
     * @returns {Promise<Object>} 삭제 결과
     */
    async deleteReadingSchedule(detailsId) {
        return await this.request(`/book-details/${detailsId}`, {
            method: 'DELETE'
        });
    }

    // ==================== Board (자유게시판) APIs ====================

    /**
     * 게시글 목록 조회
     * @returns {Promise<Object>} 게시글 목록
     */
    async getBoards() {
        return await this.request('/boards', {
            method: 'GET'
        });
    }

    /**
     * 게시글 상세 조회
     * @param {number} boardId - 게시글 ID
     * @returns {Promise<Object>} 게시글 상세 정보
     */
    async getBoard(boardId) {
        return await this.request(`/boards/${boardId}`, {
            method: 'GET'
        });
    }

    /**
     * 게시글 작성
     * @param {Object} boardData - 게시글 정보
     * @param {string} boardData.title - 제목 (필수)
     * @param {string} boardData.content - 내용 (필수)
     * @param {number} boardData.boardImage - 이미지 ID (선택)
     * @returns {Promise<Object>} 작성된 게시글 정보
     */
    async createBoard(boardData) {
        return await this.request('/boards', {
            method: 'POST',
            body: JSON.stringify(boardData)
        });
    }

    /**
     * 게시글 수정
     * @param {number} boardId - 게시글 ID
     * @param {Object} boardData - 수정할 게시글 정보
     * @returns {Promise<Object>} 수정된 게시글 정보
     */
    async updateBoard(boardId, boardData) {
        return await this.request(`/boards/${boardId}`, {
            method: 'PATCH',
            body: JSON.stringify(boardData)
        });
    }

    /**
     * 게시글 삭제
     * @param {number} boardId - 게시글 ID
     * @returns {Promise<Object>} 삭제 결과
     */
    async deleteBoard(boardId) {
        return await this.request(`/boards/${boardId}`, {
            method: 'DELETE'
        });
    }

    // ==================== Reply (댓글) APIs ====================

    /**
     * 댓글 목록 조회
     * @param {number} boardId - 게시글 ID
     * @returns {Promise<Object>} 댓글 목록
     */
    async getReplies(boardId) {
        return await this.request(`/boards/${boardId}/replies`, {
            method: 'GET'
        });
    }

    /**
     * 댓글 작성
     * @param {number} boardId - 게시글 ID
     * @param {Object} replyData - 댓글 정보
     * @param {string} replyData.content - 댓글 내용 (필수)
     * @returns {Promise<Object>} 작성된 댓글 정보
     */
    async createReply(boardId, replyData) {
        return await this.request(`/boards/${boardId}/replies`, {
            method: 'POST',
            body: JSON.stringify(replyData)
        });
    }

    /**
     * 댓글 수정
     * @param {number} boardId - 게시글 ID
     * @param {number} replyId - 댓글 ID
     * @param {Object} replyData - 수정할 댓글 정보
     * @returns {Promise<Object>} 수정된 댓글 정보
     */
    async updateReply(boardId, replyId, replyData) {
        return await this.request(`/boards/${boardId}/replies/${replyId}`, {
            method: 'PATCH',
            body: JSON.stringify(replyData)
        });
    }

    /**
     * 댓글 삭제
     * @param {number} boardId - 게시글 ID
     * @param {number} replyId - 댓글 ID
     * @returns {Promise<Object>} 삭제 결과
     */
    async deleteReply(boardId, replyId) {
        return await this.request(`/boards/${boardId}/replies/${replyId}`, {
            method: 'DELETE'
        });
    }
}

// Export singleton instance
const apiClient = new ApiClient();
