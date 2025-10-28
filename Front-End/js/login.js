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
            alert('이메일을 입력해주세요.');
            emailInput.focus();
            return;
        }

        if (!validateEmail(email)) {
            alert('올바른 이메일 형식을 입력해주세요.');
            emailInput.focus();
            return;
        }

        if (!password) {
            alert('비밀번호를 입력해주세요.');
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
function performLogin(email, password, remember) {
    const loginButton = document.querySelector('.login-button');
    const originalText = loginButton.textContent;
    loginButton.textContent = '로그인 중...';
    loginButton.disabled = true;

    setTimeout(() => {
        const user = {
            email: email,
            name: email.split('@')[0],
            loginTime: new Date().toISOString(),
            remember: remember
        };

        setLoginState(user);

        alert(`${user.name}님, 환영합니다!`);

        const returnUrl = getReturnUrl() || 'bookcase.html';
        window.location.href = returnUrl;
    }, 800);
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
    alert(`${provider} 소셜 로그인 기능은 추후 구현될 예정입니다.`);

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
