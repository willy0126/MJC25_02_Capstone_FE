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
    const loginForm = document.querySelector('.login-form');
    const loginButton = document.querySelector('.login-button');

    if (!loginForm || !loginButton) return;

    loginButton.addEventListener('click', function(e) {
        e.preventDefault();

        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        const rememberCheckbox = document.getElementById('remember');

        if (!emailInput || !passwordInput) return;

        const email = emailInput.value.trim();
        const password = passwordInput.value;
        const remember = rememberCheckbox ? rememberCheckbox.checked : false;

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

        performLogin(email, password, remember);
    });

    if (loginForm) {
        loginForm.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                loginButton.click();
            }
        });
    }
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
async function performLogin(email, password, remember) {
    const loginButton = document.querySelector('.login-button');
    const originalText = loginButton.textContent;
    loginButton.textContent = '로그인 중...';
    loginButton.disabled = true;

    try {
        // 백엔드 로그인 API 호출
        const response = await apiClient.login(email, password);

        // 사용자 정보 가져오기
        const userInfo = await apiClient.getUserInfo();

        // 로그인 상태 저장
        const user = {
            email: userInfo.email,
            name: userInfo.username,
            nickname: userInfo.nickname,
            profileImageUrl: userInfo.profileImageUrl,
            themeColor: userInfo.themeColor,
            loginTime: new Date().toISOString(),
            remember: remember
        };

        setLoginState(user);

        showToast(`${user.nickname || user.name}님, 환영합니다!`, 'success');

        // 토스트가 보이도록 약간의 지연 후 페이지 이동
        setTimeout(() => {
            const returnUrl = getReturnUrl() || 'bookcase.html';
            window.location.href = returnUrl;
        }, 800);

    } catch (error) {
        console.error('로그인 실패:', error);

        let errorMessage = '로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.';

        if (error.data && error.data.message) {
            errorMessage = error.data.message;
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
