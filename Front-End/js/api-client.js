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

    // Make HTTP request with optional authentication and retry logic
    async request(endpoint, options = {}, retryCount = 0) {
        // 오프라인 상태 체크
        if (!navigator.onLine) {
            const offlineError = new Error('인터넷 연결이 없습니다. 네트워크 상태를 확인해주세요.');
            offlineError.isOffline = true;
            throw offlineError;
        }

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

            // 5xx 서버 에러 시 재시도
            if (response.status >= 500 && retryCount < API_CONFIG.MAX_RETRIES) {
                console.warn(`서버 에러 (${response.status}), 재시도 ${retryCount + 1}/${API_CONFIG.MAX_RETRIES}...`);
                await this.delay(API_CONFIG.RETRY_DELAY);
                return this.request(endpoint, options, retryCount + 1);
            }

            return await this.handleResponse(response);
        } catch (error) {
            // 네트워크 에러 (fetch 실패) 시 재시도
            if (this.isRetryableError(error) && retryCount < API_CONFIG.MAX_RETRIES) {
                console.warn(`네트워크 에러, 재시도 ${retryCount + 1}/${API_CONFIG.MAX_RETRIES}...`, error.message);
                await this.delay(API_CONFIG.RETRY_DELAY);
                return this.request(endpoint, options, retryCount + 1);
            }

            console.error('API Request Error:', error);
            throw error;
        }
    }

    // 재시도 가능한 에러인지 확인
    isRetryableError(error) {
        // 오프라인 에러는 재시도하지 않음
        if (error.isOffline) return false;

        // TypeError는 보통 네트워크 연결 실패
        if (error instanceof TypeError) return true;

        // fetch 관련 네트워크 에러
        if (error.message && (
            error.message.includes('Failed to fetch') ||
            error.message.includes('Network request failed') ||
            error.message.includes('net::ERR_') ||
            error.message.includes('NetworkError')
        )) {
            return true;
        }

        return false;
    }

    // 지연 함수 (재시도 간격)
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
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
     * OAuth2 일회용 코드를 AccessToken으로 교환
     * @param {string} code - 일회용 인증 코드
     * @returns {Promise<Object>} { accessToken: string }
     */
    async exchangeOAuthCode(code) {
        return await this.request('/auth/oauth2/token', {
            method: 'POST',
            body: JSON.stringify({ code }),
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

    /**
     * 비밀번호 변경 (로그인된 사용자용)
     * @param {string} newPassword - 새 비밀번호
     * @param {string} confirmPassword - 비밀번호 확인
     * @returns {Promise<Object>} 변경 결과
     */
    async changePassword(newPassword, confirmPassword) {
        return await this.request('/users/change-password', {
            method: 'PUT',
            body: JSON.stringify({ newPassword, confirmPassword })
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
     * 일간 독서 기록 조회 (기존 book_details 기반)
     * @param {string} date - 날짜 (YYYY-MM-DD 형식)
     * @returns {Promise<Object>} 일간 독서 기록
     */
    async getDailyRecords(date) {
        // Swagger: GET /api/calendar/date?date={date}
        return await this.request(`/calendar/date?date=${date}`, {
            method: 'GET'
        });
    }

    // ==================== Calendar Schedule APIs (NEW - calendar_schedule 테이블 기반) ====================

    /**
     * 일정 등록 (새 Calendar API)
     * @param {number} bookId - 도서 ID
     * @param {Array} schedules - 일정 목록 [{ childId, startDate, endDate }]
     * @returns {Promise<Object>} 등록된 일정 정보
     */
    async createCalendarSchedule(bookId, schedules) {
        return await this.request('/calendar/schedule', {
            method: 'POST',
            body: JSON.stringify({ bookId, schedules })
        });
    }

    /**
     * 월별 스케줄 조회 (새 Calendar API)
     * @param {number} year - 연도
     * @param {number} month - 월 (1-12)
     * @returns {Promise<Array>} 월별 스케줄 목록
     */
    async getMonthlySchedules(year, month) {
        return await this.request(`/calendar/schedule/${year}/${month}`, {
            method: 'GET'
        });
    }

    /**
     * 일별 스케줄 조회 (새 Calendar API)
     * @param {string} date - 날짜 (YYYY-MM-DD 형식)
     * @returns {Promise<Object>} 일별 스케줄 목록
     */
    async getDailySchedules(date) {
        return await this.request(`/calendar/schedule/date?date=${date}`, {
            method: 'GET'
        });
    }

    /**
     * 개별 일정 수정 (새 Calendar API) - scheduleId 기반
     * @param {number} scheduleId - 스케줄 ID
     * @param {Object} data - 수정할 정보 { childId, startDate, endDate }
     * @returns {Promise<Object>} 수정된 일정 정보
     */
    async updateCalendarSchedule(scheduleId, data) {
        return await this.request(`/calendar/schedule/${scheduleId}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    /**
     * 개별 일정 삭제 (새 Calendar API) - scheduleId 기반
     * @param {number} scheduleId - 스케줄 ID
     * @returns {Promise<Object>} 삭제 결과
     */
    async deleteCalendarSchedule(scheduleId) {
        return await this.request(`/calendar/schedule/${scheduleId}`, {
            method: 'DELETE'
        });
    }

    /**
     * 도서별 일정 조회 (새 Calendar API)
     * @param {number} bookId - 도서 ID
     * @returns {Promise<Object>} 도서의 모든 일정
     */
    async getBookSchedules(bookId) {
        return await this.request(`/calendar/book/${bookId}`, {
            method: 'GET'
        });
    }

    /**
     * 도서별 일정 전체 삭제 (새 Calendar API)
     * @param {number} bookId - 도서 ID
     * @returns {Promise<Object>} 삭제 결과
     */
    async deleteBookSchedules(bookId) {
        return await this.request(`/calendar/book/${bookId}`, {
            method: 'DELETE'
        });
    }

    // ==================== Reading Schedule APIs (기존 book_details 기반) ====================

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

    // ==================== Subscription Plan APIs (인증 불필요) ====================

    /**
     * 활성 구독 플랜 목록 조회
     * @returns {Promise<Object>} 구독 플랜 목록
     */
    async getSubscriptionPlans() {
        return await this.request('/subscription-plans', {
            method: 'GET',
            skipAuth: true
        });
    }

    /**
     * 구독 플랜 상세 조회
     * @param {number} planId - 플랜 ID
     * @returns {Promise<Object>} 구독 플랜 상세 정보
     */
    async getSubscriptionPlan(planId) {
        return await this.request(`/subscription-plans/${planId}`, {
            method: 'GET',
            skipAuth: true
        });
    }

    // ==================== Subscription APIs ====================

    /**
     * 내 구독 목록 조회
     * @returns {Promise<Object>} 구독 목록
     */
    async getSubscriptions() {
        return await this.request('/subscriptions', {
            method: 'GET'
        });
    }

    /**
     * 구독 생성
     * @param {Object} subscriptionData - 구독 정보
     * @param {number} subscriptionData.planId - 구독 플랜 ID (1: 영·유아, 2: 초등·청소년, 3: 부모)
     * @param {string} subscriptionData.paymentMethod - 결제 수단 ('CARD' | 'BANK_TRANSFER')
     * @param {boolean} subscriptionData.autoRenew - 자동 갱신 여부
     * @returns {Promise<Object>} 생성된 구독 정보
     */
    async createSubscription(subscriptionData) {
        return await this.request('/subscriptions', {
            method: 'POST',
            body: JSON.stringify(subscriptionData)
        });
    }

    /**
     * 구독 상세 조회
     * @param {number} subscriptionId - 구독 ID
     * @returns {Promise<Object>} 구독 상세 정보
     */
    async getSubscription(subscriptionId) {
        return await this.request(`/subscriptions/${subscriptionId}`, {
            method: 'GET'
        });
    }

    /**
     * 구독 취소
     * @param {number} subscriptionId - 구독 ID
     * @returns {Promise<Object>} 취소 결과
     */
    async cancelSubscription(subscriptionId) {
        return await this.request(`/subscriptions/${subscriptionId}`, {
            method: 'DELETE'
        });
    }

    /**
     * 자동 갱신 설정 변경
     * @param {number} subscriptionId - 구독 ID
     * @param {boolean} autoRenew - 자동 갱신 여부
     * @returns {Promise<Object>} 변경 결과
     */
    async updateAutoRenew(subscriptionId, autoRenew) {
        // 백엔드가 Query Parameter로 기대함 (@RequestParam)
        return await this.request(`/subscriptions/${subscriptionId}/auto-renew?autoRenew=${autoRenew}`, {
            method: 'PATCH'
        });
    }

    /**
     * 활성 구독 존재 여부 확인
     * @returns {Promise<Object>} { hasActiveSubscription: boolean }
     */
    async checkSubscription() {
        return await this.request('/subscriptions/check', {
            method: 'GET'
        });
    }

    /**
     * 활성 구독 조회
     * @returns {Promise<Object>} 활성 구독 정보
     */
    async getActiveSubscription() {
        return await this.request('/subscriptions/active', {
            method: 'GET'
        });
    }

    // ==================== Dialogue (독후 활동) APIs ====================

    /**
     * 대화 기록 목록 조회 (페이징, 필터링)
     * @param {Object} options - 조회 옵션
     * @param {number} options.page - 페이지 번호 (1부터 시작, 기본값 1)
     * @param {number} options.size - 페이지 크기 (기본값 20)
     * @param {number} options.bookId - 특정 도서의 대화만 조회 (선택)
     * @param {Array<string>} options.emotions - 감정 필터 (선택)
     * @returns {Promise<Object>} 페이징된 대화 기록 목록
     */
    async getDialogueConversations(options = {}) {
        const params = new URLSearchParams();

        if (options.page) params.append('page', options.page);
        if (options.size) params.append('size', options.size);
        if (options.bookId) params.append('bookId', options.bookId);
        if (options.emotions && options.emotions.length > 0) {
            options.emotions.forEach(e => params.append('emotions', e));
        }

        const queryString = params.toString();
        const endpoint = `/dialogue/conversations${queryString ? '?' + queryString : ''}`;

        return await this.request(endpoint, {
            method: 'GET'
        });
    }

    /**
     * 대화 기록 상세 조회
     * @param {number} conversationId - 대화 기록 ID
     * @returns {Promise<Object>} 대화 기록 상세 정보
     */
    async getDialogueConversation(conversationId) {
        return await this.request(`/dialogue/conversations/${conversationId}`, {
            method: 'GET'
        });
    }

    /**
     * 대화 기록 등록
     * @param {Object} conversationData - 대화 기록 정보
     * @param {number} conversationData.bookId - 도서 ID (선택)
     * @param {string} conversationData.title - 제목 (필수)
     * @param {string} conversationData.content - 대화 내용 (필수)
     * @param {Array<string>} conversationData.emotions - 감정 태그 목록 (필수)
     * @param {string} conversationData.aiQuestion - AI 질문 (선택)
     * @returns {Promise<Object>} 등록된 대화 기록 정보
     */
    async createDialogueConversation(conversationData) {
        return await this.request('/dialogue/conversations', {
            method: 'POST',
            body: JSON.stringify(conversationData)
        });
    }

    /**
     * 대화 기록 수정
     * @param {number} conversationId - 대화 기록 ID
     * @param {Object} conversationData - 수정할 대화 기록 정보
     * @param {string} conversationData.title - 제목 (선택)
     * @param {string} conversationData.content - 대화 내용 (선택)
     * @param {Array<string>} conversationData.emotions - 감정 태그 목록 (선택)
     * @param {string} conversationData.aiQuestion - AI 질문 (선택)
     * @returns {Promise<Object>} 수정된 대화 기록 정보
     */
    async updateDialogueConversation(conversationId, conversationData) {
        return await this.request(`/dialogue/conversations/${conversationId}`, {
            method: 'PUT',
            body: JSON.stringify(conversationData)
        });
    }

    /**
     * 대화 기록 삭제 (Soft Delete)
     * @param {number} conversationId - 대화 기록 ID
     * @returns {Promise<Object>} 삭제 결과
     */
    async deleteDialogueConversation(conversationId) {
        return await this.request(`/dialogue/conversations/${conversationId}`, {
            method: 'DELETE',
        });
    }
    
    /**
     * 대회 AI 이미지 생성 (비동기)
     * @param {number} contestId - 대회 ID
     * @returns {Promise<Object>} jobId 반환 (진행 상황은 GET /status/{jobId}로 확인)
     */
    async generateContestImages(contestId) {
        return await this.request(`/admin/contest/${contestId}/generate-images`, {
            method: 'POST',
        });
    }

    /**
     * 이미지 생성 작업 상태 확인
     * @param {string} jobId - 작업 ID
     * @returns {Promise<Object>} 작업 상태 및 결과
     */
    async getImageGenerationStatus(jobId) {
        return await this.request(`/status/${jobId}`, {
            method: 'GET',
        });
    }
}

// Export singleton instance
const apiClient = new ApiClient();
