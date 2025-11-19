/* ========================================
   JWT 디코딩 (토큰 만료 시간 확인용)
======================================== */
function decodeJWT(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        return null;
    }
}

/* ========================================
   토큰 만료 여부 확인
======================================== */
function isTokenExpired(token) {
    if (!token) return true;

    const decoded = decodeJWT(token);
    if (!decoded || !decoded.exp) return true;

    // exp는 초 단위, Date.now()는 밀리초 단위
    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp < currentTime;
}

/* ========================================
   로그인 상태 확인 (토큰 만료 체크 포함)
======================================== */
// 원본 함수 (되돌리기용):
// function isLoggedIn() {
//     const accessToken = localStorage.getItem('accessToken');
//     const userInfo = localStorage.getItem('userInfo');
//     return accessToken !== null && userInfo !== null;
// }

function isLoggedIn() {
    const accessToken = localStorage.getItem('accessToken');
    const userInfo = localStorage.getItem('userInfo');

    if (!accessToken || !userInfo) {
        return false;
    }

    // 토큰 만료 체크
    if (isTokenExpired(accessToken)) {
        clearLoginState();
        return false;
    }

    return true;
}

/* ========================================
   현재 사용자 정보 가져오기
======================================== */
function getCurrentUser() {
    if (!isLoggedIn()) {
        return null;
    }

    try {
        const userInfo = localStorage.getItem('userInfo');
        return JSON.parse(userInfo);
    } catch (e) {
        console.error('Error parsing user info:', e);
        return null;
    }
}

/* ========================================
   자동 로그아웃 타이머 설정
======================================== */
let autoLogoutTimer = null;
const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30분 (밀리초)

function updateLastActivity() {
    localStorage.setItem('lastActivity', Date.now().toString());
    resetAutoLogoutTimer();
}

function resetAutoLogoutTimer() {
    if (autoLogoutTimer) {
        clearTimeout(autoLogoutTimer);
    }

    autoLogoutTimer = setTimeout(() => {
        if (isLoggedIn()) {
            alert('장시간 활동이 없어 자동 로그아웃됩니다.');
            clearLoginState();
            window.location.href = 'login.html';
        }
    }, INACTIVITY_TIMEOUT);
}

function initAutoLogout() {
    // 사용자 활동 감지
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => {
        document.addEventListener(event, updateLastActivity, { passive: true });
    });

    // 페이지 로드 시 마지막 활동 시간 체크
    const lastActivity = localStorage.getItem('lastActivity');
    if (lastActivity) {
        const timeSinceLastActivity = Date.now() - parseInt(lastActivity);
        if (timeSinceLastActivity > INACTIVITY_TIMEOUT) {
            clearLoginState();
            window.location.href = 'login.html';
            return;
        }
    }

    updateLastActivity();
}

/* ========================================
   로그인 상태 설정
======================================== */
// 원본 함수 (되돌리기용):
// function setLoginState(userInfo) {
//     localStorage.setItem('userInfo', JSON.stringify(userInfo));
//     window.dispatchEvent(new CustomEvent('loginStateChanged', {
//         detail: { isLoggedIn: true, user: userInfo }
//     }));
// }

function setLoginState(userInfo) {
    // accessToken과 refreshToken은 api-client.js에서 관리
    localStorage.setItem('userInfo', JSON.stringify(userInfo));

    // 자동 로그아웃 초기화
    initAutoLogout();

    window.dispatchEvent(new CustomEvent('loginStateChanged', {
        detail: { isLoggedIn: true, user: userInfo }
    }));
}

/* ========================================
   로그인 상태 초기화 (로그아웃)
======================================== */
// 원본 함수 (되돌리기용):
// async function clearLoginState() {
//     if (typeof apiClient !== 'undefined') {
//         await apiClient.logout();
//     }
//     localStorage.removeItem('userInfo');
//     window.dispatchEvent(new CustomEvent('loginStateChanged', {
//         detail: { isLoggedIn: false, user: null }
//     }));
// }

async function clearLoginState() {
    // 자동 로그아웃 타이머 정리
    if (autoLogoutTimer) {
        clearTimeout(autoLogoutTimer);
        autoLogoutTimer = null;
    }

    // API 로그아웃 호출 (토큰도 함께 삭제됨)
    if (typeof apiClient !== 'undefined') {
        await apiClient.logout();
    }

    localStorage.removeItem('userInfo');
    localStorage.removeItem('lastActivity');

    window.dispatchEvent(new CustomEvent('loginStateChanged', {
        detail: { isLoggedIn: false, user: null }
    }));
}

/* ========================================
   로그인 필수 페이지 처리
======================================== */
function requireLogin(returnUrl) {
    if (!isLoggedIn()) {
        if (returnUrl) {
            localStorage.setItem('returnUrl', returnUrl);
        }
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

function protectPage() {
    if (!isLoggedIn()) {
        localStorage.setItem('returnUrl', window.location.href);
        window.location.href = 'login.html';
    }
}

/* ========================================
   리턴 URL 관리
======================================== */
function getReturnUrl() {
    const returnUrl = localStorage.getItem('returnUrl');
    localStorage.removeItem('returnUrl');
    return returnUrl || 'index.html';
}

/* ========================================
   페이지 로드 시 자동 로그아웃 초기화
======================================== */
// 로그인 상태일 경우에만 자동 로그아웃 타이머 시작
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function() {
        if (isLoggedIn()) {
            initAutoLogout();
        }
    });
}

/* ========================================
   모듈 내보내기
======================================== */
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        isLoggedIn,
        getCurrentUser,
        setLoginState,
        clearLoginState,
        requireLogin,
        protectPage,
        getReturnUrl
    };
}
