/* ========================================
   로그인 상태 확인
======================================== */
function isLoggedIn() {
    const loginState = localStorage.getItem('isLoggedIn');
    const userInfo = localStorage.getItem('userInfo');
    return loginState === 'true' && userInfo !== null;
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
   로그인 상태 설정
======================================== */
function setLoginState(userInfo) {
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userInfo', JSON.stringify(userInfo));

    window.dispatchEvent(new CustomEvent('loginStateChanged', {
        detail: { isLoggedIn: true, user: userInfo }
    }));
}

/* ========================================
   로그인 상태 초기화 (로그아웃)
======================================== */
function clearLoginState() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userInfo');

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
