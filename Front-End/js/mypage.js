// ==================== 전역 변수 ====================
let isPasswordVerified = false;
let userInfo = null;

// ==================== 페이지 로드 시 초기화 ====================
document.addEventListener('DOMContentLoaded', async function() {
    // 로그인 확인
    if (!isLoggedIn()) {
        showToast('로그인이 필요합니다.', 'warning');
        window.location.href = '/login.html';
        return;
    }

    // 비밀번호 재확인 모달 표시 (백엔드 API 구현 전까지 주석 처리)
    // showPasswordVerifyModal();
    // document.getElementById('passwordVerifyForm').addEventListener('submit', handlePasswordVerify);

    // 비밀번호 확인 없이 바로 마이페이지 표시
    const modal = document.getElementById('passwordVerifyModal');
    const mypageContent = document.getElementById('mypageContent');
    modal.style.display = 'none';
    mypageContent.style.display = 'block';

    // 사용자 정보 로드
    await loadUserInfo();
});

// ==================== 비밀번호 재확인 (백엔드 API 구현 전까지 주석 처리) ====================
/*
function showPasswordVerifyModal() {
    const modal = document.getElementById('passwordVerifyModal');
    const mypageContent = document.getElementById('mypageContent');

    modal.style.display = 'flex';
    mypageContent.style.display = 'none';

    // ESC 키로 모달 닫기 방지
    document.addEventListener('keydown', preventEscape);
}

function preventEscape(e) {
    if (e.key === 'Escape') {
        e.preventDefault();
    }
}

async function handlePasswordVerify(e) {
    e.preventDefault();

    const password = document.getElementById('verifyPassword').value;
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;

    try {
        submitBtn.disabled = true;
        submitBtn.textContent = '확인 중...';

        // 사용자 이메일 가져오기
        const email = getCurrentUserEmail();
        if (!email) {
            throw new Error('사용자 정보를 찾을 수 없습니다.');
        }

        // 백엔드에 비밀번호 확인 요청
        const response = await apiClient.verifyPassword({ email, password });

        if (response.success) {
            isPasswordVerified = true;
            hidePasswordVerifyModal();
            await loadUserInfo();
            showToast('비밀번호가 확인되었습니다.', 'success');
        } else {
            throw new Error(response.message || '비밀번호가 일치하지 않습니다.');
        }

    } catch (error) {
        console.error('비밀번호 확인 실패:', error);

        let errorMessage = '비밀번호 확인에 실패했습니다.';
        if (error.message) {
            errorMessage = error.message;
        } else if (error.data && error.data.message) {
            errorMessage = error.data.message;
        }

        showToast(errorMessage, 'error');
        document.getElementById('verifyPassword').value = '';
        document.getElementById('verifyPassword').focus();

    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

function hidePasswordVerifyModal() {
    const modal = document.getElementById('passwordVerifyModal');
    const mypageContent = document.getElementById('mypageContent');

    modal.style.display = 'none';
    mypageContent.style.display = 'block';

    // ESC 키 이벤트 제거
    document.removeEventListener('keydown', preventEscape);
}
*/

// ==================== 사용자 정보 로드 ====================
async function loadUserInfo() {
    try {
        const response = await apiClient.getUserInfo();

        if (response.success && response.data) {
            userInfo = response.data;
            displayUserInfo(userInfo);
        } else {
            throw new Error(response.message || '사용자 정보를 불러올 수 없습니다.');
        }

    } catch (error) {
        console.error('사용자 정보 로드 실패:', error);
        showToast('사용자 정보를 불러오는데 실패했습니다.', 'error');
    }
}

function displayUserInfo(user) {
    // 프로필 정보 표시
    document.getElementById('userEmail').textContent = user.email || '-';
    document.getElementById('userName').textContent = user.username || '-';
    document.getElementById('userNickname').textContent = user.nickname || '-';
    document.getElementById('userPhone').textContent = user.phone || '-';
    document.getElementById('userBirth').textContent = user.birth || '-';
    document.getElementById('userAddress').textContent = user.address || '-';

    // 아바타 초기 설정
    const initial = (user.username || user.email || 'U').charAt(0).toUpperCase();
    document.getElementById('userInitial').textContent = initial;

    // 사용자 색상 표시
    if (user.color) {
        const colorIndicator = document.getElementById('userColor');
        colorIndicator.style.backgroundColor = user.color;

        // 아바타 배경도 사용자 색상으로 변경
        const avatarCircle = document.getElementById('userAvatar');
        avatarCircle.style.background = user.color;
    }

    // 활동 내역 표시 (백엔드에서 제공하는 경우)
    if (user.stats) {
        document.getElementById('booksRead').textContent = user.stats.booksRead || 0;
        document.getElementById('reviewsWritten').textContent = user.stats.reviewsWritten || 0;
        document.getElementById('avgRating').textContent = (user.stats.avgRating || 0).toFixed(1);
        document.getElementById('programsJoined').textContent = user.stats.programsJoined || 0;
    }

    // 구독 정보 표시 (백엔드에서 제공하는 경우)
    if (user.subscription) {
        displaySubscriptionInfo(user.subscription);
    }
}

function displaySubscriptionInfo(subscription) {
    const statusBadge = document.getElementById('subscriptionStatus');
    const details = document.getElementById('subscriptionDetails');

    if (subscription.isActive) {
        statusBadge.textContent = '구독 중';
        statusBadge.classList.add('active');

        details.innerHTML = `
            <p><strong>플랜:</strong> ${subscription.planName}</p>
            <p><strong>시작일:</strong> ${subscription.startDate}</p>
            <p><strong>종료일:</strong> ${subscription.endDate}</p>
        `;
    } else {
        statusBadge.textContent = '미구독';
        statusBadge.classList.remove('active');
        details.innerHTML = '<p>현재 구독 중인 플랜이 없습니다.</p>';
    }
}

// ==================== 현재 사용자 이메일 가져오기 ====================
function getCurrentUserEmail() {
    // localStorage에서 사용자 정보 가져오기
    // 또는 JWT 토큰 디코딩하여 이메일 추출
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
        return null;
    }

    try {
        // JWT 토큰 디코딩 (간단한 방법 - 실제로는 라이브러리 사용 권장)
        const payload = JSON.parse(atob(accessToken.split('.')[1]));
        return payload.sub || payload.email || null;
    } catch (error) {
        console.error('토큰 디코딩 실패:', error);
        return null;
    }
}

// ==================== 프로필 수정 ====================
let selectedColor = '#20B2AA'; // 기본 색상

function editProfile() {
    // 프로필 수정 모달 표시
    const modal = document.getElementById('editProfileModal');
    modal.style.display = 'flex';

    // 현재 사용자 정보 저장
    if (userInfo) {
        selectedColor = userInfo.color || '#20B2AA';
    }

    // 폼 제출 이벤트 등록 (기존 이벤트 리스너 제거 후 재등록)
    const form = document.getElementById('editProfileForm');
    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);

    newForm.addEventListener('submit', handleProfileUpdate);

    // 색상 팔레트 생성 (폼 교체 후에 호출해야 이벤트 리스너가 제대로 등록됨)
    generateColorPalette();

    // 현재 사용자 정보로 폼 채우기 (색상 팔레트 생성 후에 채워야 함)
    if (userInfo) {
        document.getElementById('editNickname').value = userInfo.nickname || '';
        document.getElementById('editPhone').value = userInfo.phone || '';
        document.getElementById('editAddress').value = userInfo.address || '';
    }

    // 모달 외부 클릭 시 닫기
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeEditModal();
        }
    });
}

function generateColorPalette() {
    const colorPalette = document.getElementById('colorPalette');
    colorPalette.innerHTML = '';

    // 색상 팔레트 (register.js와 동일한 색상 사용)
    const colors = [
        // 첫 번째 줄 - 빨강 계열
        '#FF6B6B', '#FF8787', '#FFA5A5', '#FFC2C2', '#FFE0E0', '#FF5252', '#FF1744', '#D50000',
        // 두 번째 줄 - 주황/노랑 계열
        '#FFA94D', '#FFB366', '#FFCC80', '#FFE0B2', '#FFF3E0', '#FF9100', '#FF6D00', '#FFD700',
        // 세 번째 줄 - 초록 계열
        '#69DB7C', '#8CE99A', '#A9E34B', '#C0EB75', '#D8F5A2', '#00C853', '#00E676', '#76FF03',
        // 네 번째 줄 - 청록 계열
        '#3BC9DB', '#66D9E8', '#99E9F2', '#C5F6FA', '#E3FAFC', '#00BFA5', '#1DE9B6', '#20B2AA',
        // 다섯 번째 줄 - 파랑 계열
        '#4DABF7', '#74C0FC', '#A5D8FF', '#D0EBFF', '#E7F5FF', '#2979FF', '#2962FF', '#0D47A1',
        // 여섯 번째 줄 - 보라 계열
        '#B197FC', '#C084FC', '#D8B4FE', '#E9D5FF', '#F3E8FF', '#AA00FF', '#D500F9', '#9C27B0',
        // 일곱 번째 줄 - 핑크 계열
        '#F06595', '#F783AC', '#FAA2C1', '#FCC2D7', '#FFDEEB', '#F50057', '#C51162', '#FF4081',
        // 여덟 번째 줄 - 회색 계열
        '#868E96', '#ADB5BD', '#CED4DA', '#DEE2E6', '#F1F3F5', '#495057', '#343A40', '#212529'
    ];

    colors.forEach(color => {
        const colorOption = document.createElement('div');
        colorOption.className = 'color-option';
        colorOption.style.backgroundColor = color;
        colorOption.dataset.color = color;

        // 현재 선택된 색상 표시
        if (color === selectedColor) {
            colorOption.classList.add('selected');
        }

        // 클릭 이벤트
        colorOption.addEventListener('click', function() {
            // 이전 선택 제거
            document.querySelectorAll('.color-option').forEach(opt => {
                opt.classList.remove('selected');
            });

            // 현재 선택 표시
            this.classList.add('selected');

            // 선택된 색상 업데이트
            selectedColor = this.dataset.color;
            updateColorPreview();
        });

        colorPalette.appendChild(colorOption);
    });

    // 초기 색상 미리보기 표시
    updateColorPreview();
}

function updateColorPreview() {
    const colorPreview = document.getElementById('selectedColorPreview');
    const colorHex = document.getElementById('selectedColorHex');

    colorPreview.style.backgroundColor = selectedColor;
    colorHex.textContent = selectedColor;
}

function closeEditModal() {
    const modal = document.getElementById('editProfileModal');
    modal.style.display = 'none';

    // 폼 초기화
    document.getElementById('editProfileForm').reset();
}

async function handleProfileUpdate(e) {
    e.preventDefault();

    const nickname = document.getElementById('editNickname').value.trim();
    const phone = document.getElementById('editPhone').value.trim();
    const address = document.getElementById('editAddress').value.trim();

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;

    try {
        submitBtn.disabled = true;
        submitBtn.textContent = '확인 중...';

        // 닉네임이 변경되었고 현재 값과 다른 경우 중복 체크
        if (nickname && nickname !== userInfo.nickname) {
            try {
                const nicknameCheck = await apiClient.checkNickname(nickname, true);
                if (!nicknameCheck.success || !nicknameCheck.data.available) {
                    showToast('이미 사용 중인 닉네임입니다.', 'error');
                    return;
                }
            } catch (error) {
                console.error('닉네임 중복 체크 실패:', error);
                // 중복 체크 실패 시 경고만 하고 계속 진행
                showToast('닉네임 중복 체크를 할 수 없습니다. 계속 진행합니다.', 'warning');
            }
        }

        // 전화번호가 변경되었고 현재 값과 다른 경우 중복 체크
        if (phone && phone !== userInfo.phone) {
            try {
                const phoneCheck = await apiClient.checkPhone(phone);
                if (!phoneCheck.success || !phoneCheck.data.available) {
                    showToast('이미 사용 중인 전화번호입니다.', 'error');
                    return;
                }
            } catch (error) {
                console.error('전화번호 중복 체크 실패:', error);
                // 중복 체크 API가 없는 경우 스킵
                console.log('전화번호 중복 체크 API가 구현되지 않았습니다. 스킵합니다.');
            }
        }

        submitBtn.textContent = '저장 중...';

        // 업데이트할 데이터 구성 (백엔드 API 스펙에 맞춤)
        const updateData = {
            nickname: nickname || null,
            phone: phone || null,
            address: address || null,
            color: selectedColor
        };

        const response = await apiClient.updateUserInfo(updateData);

        if (response.success) {
            showToast('프로필이 성공적으로 수정되었습니다.', 'success');
            closeEditModal();

            // 사용자 정보 다시 로드
            await loadUserInfo();
        } else {
            throw new Error(response.message || '프로필 수정에 실패했습니다.');
        }

    } catch (error) {
        console.error('프로필 수정 실패:', error);

        let errorMessage = '프로필 수정에 실패했습니다.';
        if (error.data && error.data.message) {
            errorMessage = error.data.message;
        } else if (error.message) {
            errorMessage = error.message;
        }

        showToast(errorMessage, 'error');

    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

// ==================== 비밀번호 재설정 ====================

// 비밀번호 유효성 검사
function validateNewPassword() {
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
    checkNewPasswordMatch();
}

// 비밀번호 일치 확인
function checkNewPasswordMatch() {
    const newPassword = document.getElementById('newPassword');
    const confirmNewPassword = document.getElementById('confirmNewPassword');
    const passwordError = document.getElementById('newPasswordError');

    if (confirmNewPassword.value) {
        if (newPassword.value !== confirmNewPassword.value) {
            passwordError.style.display = 'block';
            confirmNewPassword.classList.remove('valid');
            confirmNewPassword.classList.add('invalid');
        } else {
            passwordError.style.display = 'none';
            confirmNewPassword.classList.remove('invalid');
            confirmNewPassword.classList.add('valid');
        }
    } else {
        passwordError.style.display = 'none';
        confirmNewPassword.classList.remove('valid', 'invalid');
    }
}

// 비밀번호 재설정 모달 열기
function resetPassword() {
    const modal = document.getElementById('resetPasswordModal');
    modal.style.display = 'flex';

    // 모달 외부 클릭 시 닫기
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeResetPasswordModal();
        }
    });

    // 이벤트 리스너 등록
    const newPassword = document.getElementById('newPassword');
    const confirmNewPassword = document.getElementById('confirmNewPassword');

    newPassword.removeEventListener('input', validateNewPassword);
    confirmNewPassword.removeEventListener('input', checkNewPasswordMatch);

    newPassword.addEventListener('input', validateNewPassword);
    confirmNewPassword.addEventListener('input', checkNewPasswordMatch);

    // 폼 제출 이벤트
    const form = document.getElementById('resetPasswordForm');
    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);

    newForm.addEventListener('submit', handlePasswordReset);
}

// 비밀번호 재설정 모달 닫기
function closeResetPasswordModal() {
    const modal = document.getElementById('resetPasswordModal');
    modal.style.display = 'none';

    // 폼 초기화
    document.getElementById('resetPasswordForm').reset();
    document.getElementById('newPassword').classList.remove('valid', 'invalid');
    document.getElementById('confirmNewPassword').classList.remove('valid', 'invalid');
    document.getElementById('newPasswordError').style.display = 'none';
}

// 비밀번호 재설정 처리
async function handlePasswordReset(e) {
    e.preventDefault();

    const newPassword = document.getElementById('newPassword').value;
    const confirmNewPassword = document.getElementById('confirmNewPassword').value;

    // 비밀번호 유효성 검사
    const regex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;

    if (!regex.test(newPassword)) {
        showToast('비밀번호는 영어, 숫자, 특수문자(@$!%*#?&)를 포함한 8자리 이상이어야 합니다.', 'warning');
        return;
    }

    if (newPassword !== confirmNewPassword) {
        showToast('비밀번호가 일치하지 않습니다.', 'warning');
        return;
    }

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;

    try {
        submitBtn.disabled = true;
        submitBtn.textContent = '재설정 중...';

        // 비밀번호 재설정 API 호출
        const response = await apiClient.resetPassword({
            email: userInfo.email,
            username: userInfo.username,
            newPassword: newPassword
        });

        if (response.success) {
            showToast('비밀번호가 성공적으로 재설정되었습니다.', 'success');
            closeResetPasswordModal();
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

        showToast(errorMessage, 'error');

    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

// ==================== 구독 플랜 보기 ====================
function goToSubscription() {
    // TODO: 구독 페이지로 이동
    showToast('구독 플랜 페이지는 추후 구현 예정입니다.', 'info');
}

// ==================== 로그아웃 ====================
function logout() {
    // 로그아웃 확인 모달 표시
    const modal = document.getElementById('logoutModal');
    modal.style.display = 'flex';

    // 모달 외부 클릭 시 닫기
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeLogoutModal();
        }
    });
}

function closeLogoutModal() {
    const modal = document.getElementById('logoutModal');
    modal.style.display = 'none';
}

async function confirmLogout() {
    try {
        await apiClient.logout();
        showToast('로그아웃되었습니다.', 'success');
        closeLogoutModal();

        setTimeout(() => {
            window.location.href = '/index.html';
        }, 1000);

    } catch (error) {
        console.error('로그아웃 실패:', error);
        // 에러가 발생해도 로그아웃 처리
        apiClient.clearTokens();
        window.location.href = '/index.html';
    }
}

// ==================== 회원 탈퇴 ====================
function deleteAccount() {
    // 회원 탈퇴 모달 표시
    const modal = document.getElementById('deleteAccountModal');
    modal.style.display = 'flex';

    // 폼 제출 이벤트 등록 (기존 이벤트 리스너 제거 후 재등록)
    const form = document.getElementById('deleteAccountForm');
    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);

    newForm.addEventListener('submit', handleDeleteAccount);

    // 모달 외부 클릭 시 닫기
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeDeleteModal();
        }
    });
}

function closeDeleteModal() {
    const modal = document.getElementById('deleteAccountModal');
    modal.style.display = 'none';

    // 비밀번호 입력란 초기화
    document.getElementById('deletePassword').value = '';
}

async function handleDeleteAccount(e) {
    e.preventDefault();

    const password = document.getElementById('deletePassword').value;
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;

    try {
        submitBtn.disabled = true;
        submitBtn.textContent = '처리 중...';

        const response = await apiClient.deleteUser({ password });

        if (response.success) {
            showToast('회원 탈퇴가 완료되었습니다.', 'success');
            closeDeleteModal();

            setTimeout(() => {
                apiClient.clearTokens();
                window.location.href = '/index.html';
            }, 1500);
        } else {
            throw new Error(response.message || '회원 탈퇴에 실패했습니다.');
        }

    } catch (error) {
        console.error('회원 탈퇴 실패:', error);

        let errorMessage = '회원 탈퇴에 실패했습니다.';
        if (error.data && error.data.message) {
            errorMessage = error.data.message;
        } else if (error.message) {
            errorMessage = error.message;
        }

        showToast(errorMessage, 'error');
        document.getElementById('deletePassword').value = '';
        document.getElementById('deletePassword').focus();

    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}
