/* ========================================
   페이지 초기화
======================================== */
document.addEventListener('DOMContentLoaded', function() {
    checkAlreadyLoggedIn();
    initLoginForm();
    initSocialLogin();
});

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

        // 백엔드 로그인 API 호출 (백엔드 응답 형식: {success, code, message, data: {accessToken, refreshToken, tokenType}})
        const loginResponse = await apiClient.login(email, password);

        // 로그인 성공 확인
        if (!loginResponse.success || !loginResponse.data) {
            throw new Error(loginResponse.message || '로그인에 실패했습니다.');
        }

        // 토큰은 이미 apiClient.login()에서 localStorage에 저장됨
        console.log('로그인 성공:', {
            tokenType: loginResponse.data.tokenType,
            hasAccessToken: !!loginResponse.data.accessToken,
            hasRefreshToken: !!loginResponse.data.refreshToken
        });

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
}

/* ========================================
   소셜 로그인 처리
======================================== */
function performSocialLogin(provider) {
    showToast(`${provider} 소셜 로그인 기능은 추후 구현될 예정입니다.`, 'info');

    const user = {
        email: `user@${provider}.com`,
        name: `${provider} 사용자`,
        provider: provider,
        loginTime: new Date().toISOString()
    };

    setLoginState(user);

    const returnUrl = getReturnUrl() || 'bookcase.html';
    window.location.href = returnUrl;
}
