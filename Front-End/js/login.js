/* ========================================
   페이지 초기화
======================================== */
document.addEventListener('DOMContentLoaded', function() {
    // OAuth 콜백 처리 먼저 확인
    if (handleOAuthCallback()) {
        return; // OAuth 콜백 처리 중이면 다른 초기화 건너뜀
    }

    checkAlreadyLoggedIn();
    initLoginForm();
    initSocialLogin();
    checkAutoLogoutMessage();
});

/* ========================================
   자동 로그아웃 메시지 확인
======================================== */
function checkAutoLogoutMessage() {
    const message = sessionStorage.getItem('autoLogoutMessage');
    if (message) {
        sessionStorage.removeItem('autoLogoutMessage');
        // 토스트가 로드된 후 표시
        setTimeout(() => {
            if (typeof showToast === 'function') {
                showToast(message, 'warning', 4000);
            }
        }, 300);
    }
}

/* ========================================
   로그인 상태 확인 및 리다이렉트
======================================== */
function checkAlreadyLoggedIn() {
    if (isLoggedIn()) {
        const returnUrl = getReturnUrl() || 'bookcase.html';
        window.location.href = returnUrl;
    }
}

/* ========================================
   로그인 폼 초기화
======================================== */
function initLoginForm() {
    const loginForm = document.getElementById('loginForm');

    if (!loginForm) {
        console.error('Login form not found');
        return;
    }

    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');

        if (!emailInput || !passwordInput) {
            console.error('Email or password input not found');
            return;
        }

        const email = emailInput.value.trim();
        const password = passwordInput.value;

        // 클라이언트 측 유효성 검사
        if (!email) {
            showToast('이메일을 입력해주세요.', 'warning');
            emailInput.focus();
            return;
        }

        if (!validateEmail(email)) {
            showToast('올바른 이메일 형식을 입력해주세요.', 'warning');
            emailInput.focus();
            return;
        }

        if (!password) {
            showToast('비밀번호를 입력해주세요.', 'warning');
            passwordInput.focus();
            return;
        }

        performLogin(email, password);
    });
}

/* ========================================
   이메일 유효성 검사
======================================== */
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/* ========================================
   로그인 처리
======================================== */
async function performLogin(email, password) {
    const loginButton = document.querySelector('.login-button');
    const originalText = loginButton.textContent;

    try {
        // 로딩 표시
        loginButton.textContent = '로그인 중...';
        loginButton.disabled = true;

        // 백엔드 로그인 API 호출 (백엔드 응답 형식: {success, code, message, data: accessToken})
        // refreshToken은 Set-Cookie 헤더로 전송됨 (HttpOnly)
        const loginResponse = await apiClient.login(email, password);

        // 로그인 성공 확인
        if (!loginResponse.success || !loginResponse.data) {
            throw new Error(loginResponse.message || '로그인에 실패했습니다.');
        }

        // accessToken은 apiClient.login()에서 localStorage에 저장됨
        // refreshToken은 브라우저가 쿠키로 자동 관리

        // 사용자 정보 가져오기
        const userInfoResponse = await apiClient.getUserInfo();

        if (!userInfoResponse.success || !userInfoResponse.data) {
            throw new Error('사용자 정보를 가져올 수 없습니다.');
        }

        const userInfo = userInfoResponse.data;

        // 로그인 상태 저장 (auth.js의 setLoginState 사용)
        const user = {
            userId: userInfo.userId,
            email: userInfo.email,
            username: userInfo.username,
            nickname: userInfo.nickname,
            profileImg: userInfo.profileImg,
            color: userInfo.color,
            phone: userInfo.phone,
            address: userInfo.address,
            birth: userInfo.birth,
            role: userInfo.role,
            loginTime: new Date().toISOString()
        };

        setLoginState(user);

        // 환영 메시지
        const displayName = user.nickname || user.username || '사용자';
        showToast(`${displayName}님, 환영합니다!`, 'success');

        // 토스트가 보이도록 약간의 지연 후 페이지 이동
        setTimeout(() => {
            const returnUrl = getReturnUrl() || 'bookcase.html';
            window.location.href = returnUrl;
        }, 1000);

    } catch (error) {
        console.error('로그인 실패:', error);

        let errorMessage = '로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.';

        // HTTP 상태 코드별 처리
        if (error.status === 500) {
            // 500 에러는 대부분 로그인 실패 (backend의 LoginException)
            errorMessage = '아이디 또는 비밀번호가 일치하지 않습니다.';
        } else if (error.status === 401) {
            errorMessage = '인증에 실패했습니다. 이메일과 비밀번호를 확인해주세요.';
        } else if (error.data) {
            // 백엔드 에러 응답 처리
            if (error.data.message) {
                errorMessage = error.data.message;
            }

            // 특정 에러 코드별 처리
            switch (error.data.code) {
                case 'AUTH004':
                    errorMessage = '아이디 또는 비밀번호가 일치하지 않습니다.';
                    break;
                case 'USER001':
                    errorMessage = '존재하지 않는 사용자입니다.';
                    break;
                default:
                    break;
            }
        } else if (error.message) {
            errorMessage = error.message;
        }

        showToast(errorMessage, 'error');

        // 버튼 복원
        loginButton.textContent = originalText;
        loginButton.disabled = false;
    }
}

/* ========================================
   소셜 로그인 초기화
======================================== */
// 소셜 로그인 팝업 창 참조
let socialLoginPopup = null;
let socialLoginCheckInterval = null;

function initSocialLogin() {
    const kakaoButton = document.querySelector('.social-button.kakao');
    const naverButton = document.querySelector('.social-button.naver');

    if (kakaoButton) {
        kakaoButton.addEventListener('click', function() {
            performSocialLogin('kakao');
        });
    }

    if (naverButton) {
        naverButton.addEventListener('click', function() {
            performSocialLogin('naver');
        });
    }

    // 팝업 창에서 전송하는 OAuth 결과 메시지 수신
    window.addEventListener('message', handleOAuthMessage);
}

/* ========================================
   OAuth 메시지 수신 처리 (팝업 -> 부모)
======================================== */
function handleOAuthMessage(event) {
    // 동일 출처 확인 (보안)
    if (event.origin !== window.location.origin) {
        return;
    }

    const data = event.data;
    if (!data || data.type !== 'OAUTH_CALLBACK') {
        return;
    }

    // 팝업 창 닫기
    if (socialLoginPopup && !socialLoginPopup.closed) {
        socialLoginPopup.close();
    }
    socialLoginPopup = null;

    // 팝업 체크 인터벌 정리
    if (socialLoginCheckInterval) {
        clearInterval(socialLoginCheckInterval);
        socialLoginCheckInterval = null;
    }

    if (data.error) {
        console.error('[OAuth] 로그인 실패:', data.error, data.errorMessage);
        showToast(data.errorMessage || '소셜 로그인에 실패했습니다.', 'error');
        return;
    }

    if (data.accessToken) {
        handleOAuthSuccess(data.accessToken);
    }
}

/* ========================================
   소셜 로그인 처리 (팝업 방식)
======================================== */
async function performSocialLogin(provider) {
    const providerName = provider === 'kakao' ? '카카오' : '네이버';

    // 이미 팝업이 열려있으면 포커스
    if (socialLoginPopup && !socialLoginPopup.closed) {
        socialLoginPopup.focus();
        return;
    }

    try {
        showToast(`${providerName} 로그인 창을 여는 중...`, 'info');

        // 리턴 URL 저장 (소셜 로그인 완료 후 돌아올 페이지)
        const currentReturnUrl = getReturnUrl() || 'bookcase.html';
        localStorage.setItem('returnUrl', currentReturnUrl);

        // 백엔드에서 OAuth2 로그인 URL 가져오기
        let loginUrl;
        if (provider === 'kakao') {
            const response = await apiClient.getKakaoLoginUrl();
            loginUrl = response.loginUrl;
        } else if (provider === 'naver') {
            const response = await apiClient.getNaverLoginUrl();
            loginUrl = response.loginUrl;
        }

        if (!loginUrl) {
            throw new Error('로그인 URL을 가져올 수 없습니다.');
        }

        // 백엔드가 내부 포트(8082)를 반환하는 경우, 외부 포트(18888)로 변환
        // TODO: 백엔드에서 올바른 외부 URL을 반환하도록 수정 후 이 코드 제거
        if (loginUrl.includes('localhost:8082')) {
            loginUrl = loginUrl.replace('localhost:8082', 'localhost:18888');
        }

        // 팝업 창 크기 및 위치 계산 (화면 중앙)
        const popupWidth = 500;
        const popupHeight = 700;
        const left = window.screenX + (window.outerWidth - popupWidth) / 2;
        const top = window.screenY + (window.outerHeight - popupHeight) / 2;

        // 팝업 창 열기
        socialLoginPopup = window.open(
            loginUrl,
            `${provider}Login`,
            `width=${popupWidth},height=${popupHeight},left=${left},top=${top},scrollbars=yes,resizable=yes`
        );

        if (!socialLoginPopup) {
            throw new Error('팝업 창이 차단되었습니다. 팝업 차단을 해제해주세요.');
        }

        // 팝업 창 닫힘 감지 (사용자가 수동으로 닫은 경우)
        socialLoginCheckInterval = setInterval(() => {
            if (socialLoginPopup && socialLoginPopup.closed) {
                clearInterval(socialLoginCheckInterval);
                socialLoginCheckInterval = null;
                socialLoginPopup = null;
            }
        }, 500);

    } catch (error) {
        console.error(`${provider} 소셜 로그인 실패:`, error);
        showToast(error.message || `${providerName} 로그인에 실패했습니다. 잠시 후 다시 시도해주세요.`, 'error');
    }
}

/* ========================================
   OAuth 콜백 처리
   백엔드에서 OAuth 인증 후 리다이렉트될 때 처리
   - 팝업 창인 경우: 부모 창에 메시지 전송 후 창 닫기
   - 일반 창인 경우: 직접 로그인 처리 (폴백)
======================================== */
function handleOAuthCallback() {
    const urlParams = new URLSearchParams(window.location.search);

    // accessToken이 URL 파라미터에 있는지 확인
    const accessToken = urlParams.get('accessToken') || urlParams.get('token');
    const error = urlParams.get('error');
    const errorMessage = urlParams.get('error_message') || urlParams.get('message');

    // OAuth 콜백이 아닌 경우
    if (!accessToken && !error) {
        return false;
    }

    // 팝업 창인지 확인 (window.opener가 있고, 같은 출처인 경우)
    const isPopup = window.opener && !window.opener.closed;

    if (isPopup) {
        // 팝업 창: 부모 창에 메시지 전송 후 창 닫기
        try {
            const message = {
                type: 'OAUTH_CALLBACK',
                accessToken: accessToken || null,
                error: error || null,
                errorMessage: errorMessage || null
            };

            window.opener.postMessage(message, window.location.origin);

            // 잠시 후 팝업 창 닫기
            setTimeout(() => {
                window.close();
            }, 100);
        } catch (e) {
            console.error('[OAuth] 부모 창 통신 실패:', e);
            // 통신 실패 시 직접 처리 (폴백)
            handleOAuthCallbackDirect(accessToken, error, errorMessage);
        }

        return true;
    }

    // 일반 창: 직접 로그인 처리 (폴백 - 팝업 차단 등의 경우)
    handleOAuthCallbackDirect(accessToken, error, errorMessage);
    return true;
}

/* ========================================
   OAuth 콜백 직접 처리 (폴백)
======================================== */
function handleOAuthCallbackDirect(accessToken, error, errorMessage) {
    // URL에서 파라미터 제거 (깔끔한 URL 유지)
    window.history.replaceState({}, document.title, window.location.pathname);

    if (error) {
        console.error('[OAuth] 로그인 실패:', error, errorMessage);
        showToast(errorMessage || '소셜 로그인에 실패했습니다.', 'error');
        return;
    }

    if (accessToken) {
        handleOAuthSuccess(accessToken);
    }
}

/* ========================================
   OAuth 로그인 성공 처리
======================================== */
async function handleOAuthSuccess(accessToken) {
    try {
        // accessToken 저장
        apiClient.setAccessToken(accessToken);

        // 사용자 정보 가져오기
        const userInfoResponse = await apiClient.getUserInfo();

        if (!userInfoResponse.success || !userInfoResponse.data) {
            throw new Error('사용자 정보를 가져올 수 없습니다.');
        }

        const userInfo = userInfoResponse.data;

        // 로그인 상태 저장
        const user = {
            userId: userInfo.userId,
            email: userInfo.email,
            username: userInfo.username,
            nickname: userInfo.nickname,
            profileImg: userInfo.profileImg,
            color: userInfo.color,
            phone: userInfo.phone,
            address: userInfo.address,
            birth: userInfo.birth,
            role: userInfo.role,
            provider: userInfo.provider || 'SOCIAL',
            loginTime: new Date().toISOString()
        };

        setLoginState(user);

        // 환영 메시지
        const displayName = user.nickname || user.username || '사용자';
        showToast(`${displayName}님, 환영합니다!`, 'success');

        // 페이지 이동
        setTimeout(() => {
            const returnUrl = getReturnUrl() || 'bookcase.html';
            window.location.href = returnUrl;
        }, 1000);

    } catch (error) {
        console.error('[OAuth] 사용자 정보 조회 실패:', error);
        apiClient.clearTokens();
        showToast('로그인 처리 중 오류가 발생했습니다.', 'error');
    }
}
