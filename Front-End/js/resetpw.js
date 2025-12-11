// ==================== 전역 변수 ====================
let currentStep = 1;
let userEmail = '';
let temporaryToken = ''; // 인증 코드 검증 후 받은 임시 토큰

// ==================== 단계 전환 ====================

// 특정 단계로 이동
function goToStep(step) {
    // 단계 표시기 업데이트
    const stepIndicators = document.querySelectorAll('.step-indicator .step');
    stepIndicators.forEach((indicator, index) => {
        if (index + 1 <= step) {
            indicator.classList.add('active');
        } else {
            indicator.classList.remove('active');
        }
    });

    // 단계 콘텐츠 전환
    const stepContents = document.querySelectorAll('.step-content');
    stepContents.forEach((content, index) => {
        if (index + 1 === step) {
            content.classList.add('active');
        } else {
            content.classList.remove('active');
        }
    });

    currentStep = step;
}

// ==================== 1단계: 이메일 입력 ====================

async function handleEmailSubmit(e) {
    e.preventDefault();

    const emailInput = document.getElementById('email');
    const email = emailInput.value.trim();

    // 이메일 유효성 검사
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showToast('올바른 이메일 형식을 입력해주세요.', 'warning');
        return;
    }

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;

    try {
        submitBtn.disabled = true;
        submitBtn.textContent = '발송 중...';

        // API 호출: 이메일로 인증 코드 발송
        const response = await apiClient.forgotPassword(email);

        if (response.success) {
            userEmail = email; // 이메일 저장
            showToast('인증 코드가 이메일로 발송되었습니다.', 'success');

            // 2단계로 이동
            setTimeout(() => {
                goToStep(2);
            }, 1000);
        } else {
            throw new Error(response.message || '인증 코드 발송에 실패했습니다.');
        }

    } catch (error) {
        console.error('인증 코드 발송 실패:', error);

        let errorMessage = '인증 코드 발송에 실패했습니다.';

        if (error.data && error.data.message) {
            errorMessage = error.data.message;
        } else if (error.message) {
            errorMessage = error.message;
        }

        // 특정 에러 코드 처리
        if (error.data && error.data.code === 'USER001') {
            errorMessage = '등록되지 않은 이메일입니다.';
        }

        showToast(errorMessage, 'error');

        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

// ==================== 2단계: 인증 코드 확인 ====================

async function handleCodeSubmit(e) {
    e.preventDefault();

    const codeInput = document.getElementById('code');
    const code = codeInput.value.trim();

    if (!code) {
        showToast('인증 코드를 입력해주세요.', 'warning');
        return;
    }

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;

    try {
        submitBtn.disabled = true;
        submitBtn.textContent = '확인 중...';

        // API 호출: 인증 코드 검증
        const response = await apiClient.verifyResetCode(code);

        if (response.success && response.data) {
            // 임시 토큰 저장
            temporaryToken = response.data.temporaryToken;
            console.log('임시 토큰 저장됨');

            showToast('인증 코드가 확인되었습니다.', 'success');

            // 3단계로 이동
            setTimeout(() => {
                goToStep(3);
            }, 1000);
        } else {
            throw new Error(response.message || '인증 코드 확인에 실패했습니다.');
        }

    } catch (error) {
        console.error('인증 코드 확인 실패:', error);

        let errorMessage = '인증 코드가 올바르지 않습니다.';

        if (error.data && error.data.message) {
            errorMessage = error.data.message;
        } else if (error.message) {
            errorMessage = error.message;
        }

        // 특정 에러 코드 처리
        if (error.data) {
            switch(error.data.code) {
                case 'AUTH001':
                    errorMessage = '인증 코드가 만료되었습니다. 다시 시도해주세요.';
                    break;
                case 'AUTH002':
                    errorMessage = '인증 코드가 올바르지 않습니다.';
                    break;
            }
        }

        showToast(errorMessage, 'error');

        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

// ==================== 3단계: 새 비밀번호 설정 ====================

// 비밀번호 유효성 검사
function validatePassword() {
    const newPassword = document.getElementById('newPassword');
    const passwordValue = newPassword.value;
    const regex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;

    // 입력값이 있을 때만 검증
    if (passwordValue && passwordValue.length > 0) {
        if (!regex.test(passwordValue)) {
            newPassword.classList.remove('valid');
            newPassword.classList.add('invalid');
        } else {
            newPassword.classList.remove('invalid');
            newPassword.classList.add('valid');
        }
    } else {
        newPassword.classList.remove('valid', 'invalid');
    }

    // 비밀번호 확인란도 체크
    checkPasswordMatch();
}

// 비밀번호 일치 확인
function checkPasswordMatch() {
    const newPassword = document.getElementById('newPassword');
    const confirmPassword = document.getElementById('confirmPassword');
    const passwordError = document.getElementById('passwordError');

    if (confirmPassword.value) {
        if (newPassword.value !== confirmPassword.value) {
            passwordError.style.display = 'block';
            confirmPassword.classList.remove('valid');
            confirmPassword.classList.add('invalid');
        } else {
            passwordError.style.display = 'none';
            confirmPassword.classList.remove('invalid');
            confirmPassword.classList.add('valid');
        }
    } else {
        passwordError.style.display = 'none';
        confirmPassword.classList.remove('valid', 'invalid');
    }
}

async function handlePasswordSubmit(e) {
    e.preventDefault();

    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // 비밀번호 유효성 검사
    const regex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;

    if (!regex.test(newPassword)) {
        showToast('비밀번호는 영어, 숫자, 특수문자(@$!%*#?&)를 포함한 8자리 이상이어야 합니다.', 'warning');
        return;
    }

    if (newPassword !== confirmPassword) {
        showToast('비밀번호가 일치하지 않습니다.', 'warning');
        return;
    }

    // 임시 토큰 확인
    if (!temporaryToken) {
        showToast('세션이 만료되었습니다. 처음부터 다시 시도해주세요.', 'error');
        setTimeout(() => {
            goToStep(1);
        }, 2000);
        return;
    }

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;

    try {
        submitBtn.disabled = true;
        submitBtn.textContent = '재설정 중...';

        // API 호출: 새 비밀번호 설정 (임시 토큰 포함)
        const response = await apiClient.resetPassword(newPassword, confirmPassword, temporaryToken);

        if (response.success) {
            showToast('비밀번호가 성공적으로 재설정되었습니다. 로그인 페이지로 이동합니다.', 'success');

            // 임시 토큰 초기화
            temporaryToken = '';

            // 1.5초 후 로그인 페이지로 이동
            setTimeout(() => {
                window.location.href = '/login.html';
            }, 1500);
        } else {
            throw new Error(response.message || '비밀번호 재설정에 실패했습니다.');
        }

    } catch (error) {
        console.error('비밀번호 재설정 실패:', error);

        let errorMessage = '비밀번호 재설정에 실패했습니다. 다시 시도해주세요.';

        if (error.data && error.data.message) {
            errorMessage = error.data.message;
        } else if (error.message) {
            errorMessage = error.message;
        }

        // 특정 에러 코드 처리
        if (error.data) {
            switch(error.data.code) {
                case 'C001':
                    errorMessage = '비밀번호 형식이 올바르지 않습니다.';
                    break;
                case 'AUTH003':
                    errorMessage = '세션이 만료되었습니다. 처음부터 다시 시도해주세요.';
                    setTimeout(() => {
                        goToStep(1);
                    }, 2000);
                    break;
            }
        }

        showToast(errorMessage, 'error');

        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

// ==================== 초기화 ====================

document.addEventListener('DOMContentLoaded', function() {
    // 1단계: 이메일 폼
    const emailForm = document.getElementById('emailForm');
    if (emailForm) {
        emailForm.addEventListener('submit', handleEmailSubmit);
    }

    // 2단계: 인증 코드 폼
    const codeForm = document.getElementById('codeForm');
    if (codeForm) {
        codeForm.addEventListener('submit', handleCodeSubmit);
    }

    // 3단계: 비밀번호 폼
    const passwordForm = document.getElementById('passwordForm');
    if (passwordForm) {
        passwordForm.addEventListener('submit', handlePasswordSubmit);

        const newPassword = document.getElementById('newPassword');
        const confirmPassword = document.getElementById('confirmPassword');

        // 비밀번호 실시간 검증
        if (newPassword) {
            newPassword.addEventListener('input', validatePassword);
        }
        if (confirmPassword) {
            confirmPassword.addEventListener('input', checkPasswordMatch);
        }
    }

    // 첫 번째 단계 표시
    goToStep(1);
});
