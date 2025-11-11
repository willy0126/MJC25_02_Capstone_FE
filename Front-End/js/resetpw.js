// ==================== 비밀번호 유효성 검사 ====================

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

// ==================== 폼 제출 ====================

async function handleSubmit(e) {
    e.preventDefault();

    const email = document.getElementById('email').value.trim();
    const username = document.getElementById('username').value.trim();
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

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;

    try {
        submitBtn.disabled = true;
        submitBtn.textContent = '확인 중...';

        // 1단계: 사용자 인증 (선택사항 - 백엔드에서 처리)
        // verifyUser API는 이메일과 이름으로 사용자를 찾아서 검증
        const verifyResponse = await apiClient.verifyUser({
            email: email,
            username: username
        });

        // 인증 실패 시
        if (!verifyResponse.success) {
            throw new Error(verifyResponse.message || '사용자 정보를 확인할 수 없습니다.');
        }

        submitBtn.textContent = '비밀번호 재설정 중...';

        // 2단계: 비밀번호 재설정
        const resetResponse = await apiClient.resetPassword({
            email: email,
            username: username,
            newPassword: newPassword
        });

        if (resetResponse.success) {
            showToast('비밀번호가 성공적으로 재설정되었습니다. 로그인 페이지로 이동합니다.', 'success');

            // 1.5초 후 로그인 페이지로 이동
            setTimeout(() => {
                window.location.href = '/login.html';
            }, 1500);
        } else {
            throw new Error(resetResponse.message || '비밀번호 재설정에 실패했습니다.');
        }

    } catch (error) {
        console.error('비밀번호 재설정 실패:', error);

        let errorMessage = '비밀번호 재설정에 실패했습니다. 다시 시도해주세요.';

        if (error.data && error.data.message) {
            errorMessage = error.data.message;
        } else if (error.message) {
            errorMessage = error.message;
        }

        showToast(errorMessage, 'error');

        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

// ==================== 초기화 ====================

document.addEventListener('DOMContentLoaded', function() {
    const newPassword = document.getElementById('newPassword');
    const confirmPassword = document.getElementById('confirmPassword');
    const form = document.getElementById('resetpwForm');

    // 비밀번호 실시간 검증
    newPassword.addEventListener('input', validatePassword);
    confirmPassword.addEventListener('input', checkPasswordMatch);

    // 폼 제출 이벤트
    form.addEventListener('submit', handleSubmit);
});
