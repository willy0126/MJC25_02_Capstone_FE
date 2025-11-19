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

    // 자녀 관리 초기화
    initChildrenManagement();
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

    // 아바타 설정
    const avatarCircle = document.getElementById('userAvatar');
    const userInitial = document.getElementById('userInitial');

    if (user.profileImg && user.profileImg.trim()) {
        // SVG 아바타가 있는 경우 - SVG 문자열을 직접 삽입
        avatarCircle.innerHTML = user.profileImg;

        // SVG 스타일 조정 (아바타 영역에 맞게)
        const svgElement = avatarCircle.querySelector('svg');
        if (svgElement) {
            svgElement.style.width = '100%';
            svgElement.style.height = '100%';
            svgElement.style.borderRadius = '50%';
        }
    } else {
        // SVG가 없는 경우 - 초기 문자 표시
        const initial = (user.username || user.email || 'U').charAt(0).toUpperCase();
        userInitial.textContent = initial;

        // 사용자 색상을 배경으로 적용
        if (user.color) {
            avatarCircle.style.background = user.color;
        }
    }

    // 사용자 색상 표시 (색상 인디케이터)
    if (user.color) {
        const colorIndicator = document.getElementById('userColor');
        colorIndicator.style.backgroundColor = user.color;
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
let selectedUserAvatar = ''; // 사용자 아바타

function editProfile() {
    // 프로필 수정 모달 표시
    const modal = document.getElementById('editProfileModal');
    modal.style.display = 'flex';

    // 현재 사용자 정보 저장
    if (userInfo) {
        selectedColor = userInfo.color || '#20B2AA';
        selectedUserAvatar = userInfo.profileImg || '';
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

        // 주소 분리 (백엔드가 주소+상세주소를 하나로 저장한 경우)
        const fullAddress = userInfo.address || '';

        // 주소를 기본주소와 상세주소로 분리
        let baseAddress = fullAddress;
        let detailAddress = '';

        // 패턴: "로", "길", "대로" + 번지수 + (괄호) 까지를 기본주소로 간주
        // 예: "서울 강동구 동남로 562 (둔촌동)" + " 테스트주소 22"
        const addressPattern = /(.*?(?:로|길|대로)\s+\d+[-\d]*\s*(?:\([^)]*\))?)\s*(.*)/;
        const match = fullAddress.match(addressPattern);

        if (match) {
            baseAddress = match[1].trim();
            detailAddress = match[2].trim();
        }

        document.getElementById('editAddress').value = baseAddress;
        document.getElementById('editDetailAddress').value = detailAddress;

        // 아바타 미리보기 설정
        const userAvatarImg = document.getElementById('userAvatarImg');

        if (selectedUserAvatar && selectedUserAvatar.trim()) {
            // SVG 문자열을 Blob으로 변환하여 이미지로 표시
            const blob = new Blob([selectedUserAvatar], { type: 'image/svg+xml' });
            const url = URL.createObjectURL(blob);
            userAvatarImg.src = url;
        } else {
            // 기본 아바타 생성
            const defaultAvatar = generateDefaultAvatar(userInfo.username || userInfo.email || 'User');
            userAvatarImg.src = defaultAvatar;
            selectedUserAvatar = ''; // SVG 문자열이 아닌 URL이므로 비워둠
        }
    }

    // 아바타 그리드와 새로고침 버튼은 숨김
    document.getElementById('userAvatarGrid').style.display = 'none';
    document.getElementById('userAvatarRefreshContainer').style.display = 'none';

    // 프로필 수정 모달 이벤트 리스너 등록
    initEditProfileModal();

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
    const avatarGrid = document.getElementById('userAvatarGrid');
    const refreshContainer = document.getElementById('userAvatarRefreshContainer');

    modal.style.display = 'none';
    avatarGrid.style.display = 'none';
    refreshContainer.style.display = 'none';

    // 폼 초기화
    document.getElementById('editProfileForm').reset();
}

// 사용자 아바타 선택 UI 표시/숨김
function showUserAvatarSelection() {
    const avatarGrid = document.getElementById('userAvatarGrid');
    const refreshContainer = document.getElementById('userAvatarRefreshContainer');

    if (avatarGrid.style.display === 'none' || !avatarGrid.style.display) {
        // 아바타 그리드 생성
        generateUserAvatarGrid();
        avatarGrid.style.display = 'grid';
        refreshContainer.style.display = 'block';
    } else {
        avatarGrid.style.display = 'none';
        refreshContainer.style.display = 'none';
    }
}

// 사용자 아바타 그리드 생성
function generateUserAvatarGrid() {
    const avatarGrid = document.getElementById('userAvatarGrid');
    avatarGrid.innerHTML = '';

    // DiceBear 스타일들 (안정적인 무료 API)
    const styles = ['avataaars', 'bottts', 'fun-emoji', 'lorelei', 'micah', 'pixel-art'];

    // 랜덤 시드 생성 (고유한 아바타를 위해)
    const randomSeeds = [];
    for (let i = 0; i < 6; i++) {
        randomSeeds.push(Math.random().toString(36).substring(2, 15));
    }

    // 6개의 아바타 생성
    randomSeeds.forEach((seed, index) => {
        const style = styles[index % styles.length];
        const avatarUrl = `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}`;

        const label = document.createElement('label');
        label.className = 'avatar-option';

        const input = document.createElement('input');
        input.type = 'radio';
        input.name = 'userAvatar';
        input.value = avatarUrl;

        input.addEventListener('change', async function() {
            try {
                // SVG 문자열 가져오기
                const response = await fetch(this.value);
                if (response.ok) {
                    const svgText = await response.text();
                    selectedUserAvatar = svgText;

                    // 미리보기 업데이트
                    const blob = new Blob([svgText], { type: 'image/svg+xml' });
                    const url = URL.createObjectURL(blob);
                    document.getElementById('userAvatarImg').src = url;
                } else {
                    throw new Error('아바타 로드 실패');
                }
            } catch (error) {
                console.error('아바타 가져오기 실패:', error);
                showToast('아바타를 불러오는데 실패했습니다.', 'error');
            }
        });

        const avatarBox = document.createElement('div');
        avatarBox.className = 'avatar-box';

        const img = document.createElement('img');
        img.src = avatarUrl;
        img.alt = `아바타 ${index + 1}`;

        // 이미지 로드 에러 처리
        img.onerror = function() {
            console.error('아바타 로드 실패:', avatarUrl);
            // 폴백 이미지
            this.src = generateDefaultAvatar('user-' + index);
        };

        const span = document.createElement('span');
        span.className = 'avatar-label';
        span.textContent = `스타일 ${index + 1}`;

        avatarBox.appendChild(img);
        avatarBox.appendChild(span);
        label.appendChild(input);
        label.appendChild(avatarBox);
        avatarGrid.appendChild(label);
    });
}

// 사용자 아바타 새로고침
function refreshUserAvatars() {
    generateUserAvatarGrid();
    showToast('새로운 아바타를 불러왔습니다!', 'success');
}

async function handleProfileUpdate(e) {
    e.preventDefault();

    const nickname = document.getElementById('editNickname').value.trim();
    const phone = document.getElementById('editPhone').value.trim();
    const address = document.getElementById('editAddress').value.trim();
    const detailAddress = document.getElementById('editDetailAddress').value.trim();

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;

    try {
        submitBtn.disabled = true;
        submitBtn.textContent = '저장 중...';

        // 주소 + 상세주소 합치기
        let fullAddress = address;
        if (detailAddress) {
            fullAddress = address ? `${address} ${detailAddress}` : detailAddress;
        }

        const updateData = {
            nickname: nickname || null,
            phone: phone || null,
            address: fullAddress || null,
            color: selectedColor,
            profileImg: selectedUserAvatar || null
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

// ==================== 프로필 수정 입력 유효성 검사 ====================

// 전화번호 자동 포맷팅
function formatPhoneEdit() {
    const phoneInput = document.getElementById('editPhone');
    let phone = phoneInput.value.replace(/[^0-9]/g, ''); // 숫자만 추출

    // 최대 11자리까지만 허용
    if (phone.length > 11) {
        phone = phone.slice(0, 11);
    }

    // 010-1234-5678 형식으로 포맷팅
    if (phone.length >= 7) {
        phone = phone.replace(/(\d{3})(\d{4})(\d{0,4})/, '$1-$2-$3');
    } else if (phone.length >= 3) {
        phone = phone.replace(/(\d{3})(\d{0,4})/, '$1-$2');
    }

    phoneInput.value = phone;
}

// 카카오 주소 검색
function findAddressEdit() {
    new daum.Postcode({
        oncomplete: function(data) {
            let addr = '';
            let extraAddr = '';

            if (data.userSelectedType === 'R') {
                addr = data.roadAddress;
            } else {
                addr = data.jibunAddress;
            }

            if(data.userSelectedType === 'R'){
                if(data.bname !== '' && /[동|로|가]$/g.test(data.bname)){
                    extraAddr += data.bname;
                }
                if(data.buildingName !== '' && data.apartment === 'Y'){
                    extraAddr += (extraAddr !== '' ? ', ' + data.buildingName : data.buildingName);
                }
                if(extraAddr !== ''){
                    extraAddr = ' (' + extraAddr + ')';
                }
            }

            document.getElementById('editAddress').value = addr + extraAddr;
            document.getElementById('editDetailAddress').focus();
            showToast('주소가 입력되었습니다.', 'success');
        },
        theme: {
            bgColor: "#FFFFFF",
            searchBgColor: "#20B2AA",
            contentBgColor: "#FFFFFF",
            pageBgColor: "#FFFFFF",
            textColor: "#333333",
            queryTextColor: "#FFFFFF",
            postcodeTextColor: "#20B2AA",
            emphTextColor: "#20B2AA",
            outlineColor: "#20B2AA"
        },
        width: '100%',
        height: '100%'
    }).open();
}

// 프로필 수정 모달 초기화 (이벤트 리스너 등록)
function initEditProfileModal() {
    const findAddressBtn = document.getElementById('findAddress');
    const editPhoneInput = document.getElementById('editPhone');

    // 주소 찾기 버튼 이벤트
    if (findAddressBtn) {
        findAddressBtn.addEventListener('click', findAddressEdit);
    }

    // 전화번호 자동 포맷팅 이벤트
    if (editPhoneInput) {
        editPhoneInput.addEventListener('input', formatPhoneEdit);
    }
}

// ==================== 자녀 관리 ====================

// 전역 변수
let childrenData = [];
let selectedChildColor = '#FFB6C1'; // 기본 색상 (핑크)
let selectedChildAvatar = '';
let currentEditingChildId = null;
let deleteTargetChildId = null;

// 색상 팔레트 (register.js와 동일)
const childColorPalette = [
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

// 아바타 스타일 옵션 (register.js와 동일)
const avatarStyles = [
    { style: 'adventurer', name: '모험가' },
    { style: 'avataaars', name: '아바타' },
    { style: 'big-smile', name: '큰 미소' },
    { style: 'bottts', name: '로봇' },
    { style: 'fun-emoji', name: '이모지' },
    { style: 'lorelei', name: '로렐라이' },
    { style: 'micah', name: '미카' },
    { style: 'notionists', name: '노션' }
];

// 자녀 목록 로드
async function loadChildren() {
    try {
        const response = await apiClient.getChildren();

        if (response.success && response.data) {
            childrenData = response.data;
            renderChildrenList();
        } else {
            console.error('자녀 목록 로드 실패:', response.error);
            showToast('자녀 목록을 불러오는데 실패했습니다.', 'error');
        }
    } catch (error) {
        console.error('자녀 목록 로드 에러:', error);
        showToast('자녀 목록을 불러오는데 실패했습니다.', 'error');
    }
}

// 자녀 목록 렌더링
function renderChildrenList() {
    const childrenList = document.getElementById('childrenList');

    if (!childrenData || childrenData.length === 0) {
        childrenList.innerHTML = `
            <div class="empty-children">
                <p>등록된 자녀가 없습니다.</p>
                <p class="empty-hint">자녀를 추가하여 맞춤형 도서를 추천받으세요!</p>
            </div>
        `;
        return;
    }

    // 출생 순서에 따라 정렬 (1, 2, 3... 순서, birthOrder가 없는 경우는 뒤로)
    const sortedChildren = [...childrenData].sort((a, b) => {
        const orderA = a.birthOrder || 999; // birthOrder가 없으면 큰 값으로 취급
        const orderB = b.birthOrder || 999;
        return orderA - orderB; // 오름차순 정렬
    });

    childrenList.innerHTML = sortedChildren.map(child => {
        const genderText = child.gender === 'M' ? '남자' : '여자';
        const birthText = child.childBirth ? formatDate(child.childBirth) : '미입력';
        const orderText = child.birthOrder ? `${child.birthOrder}번째` : '미입력';
        const avatarUrl = child.profileImg || generateDefaultAvatar(child.childName);
        const cardColor = child.color || '#20B2AA';

        return `
            <div class="child-card" style="--child-color: ${cardColor};">
                <div class="child-card-header">
                    <div class="child-avatar">
                        <img src="${avatarUrl}" alt="${child.childName}">
                    </div>
                    <div class="child-info-header">
                        <h3 class="child-name">${child.childName}</h3>
                        <span class="child-gender">${genderText}</span>
                    </div>
                </div>
                <div class="child-details">
                    <div class="child-detail-item">
                        <span class="child-detail-label">생년월일</span>
                        <span class="child-detail-value">${birthText}</span>
                    </div>
                    <div class="child-detail-item">
                        <span class="child-detail-label">출생 순서</span>
                        <span class="child-detail-value">${orderText}</span>
                    </div>
                </div>
                <div class="child-card-actions">
                    <button class="btn-edit-child" onclick="openEditChildModal(${child.childId})">수정</button>
                    <button class="btn-delete-child" onclick="openDeleteChildModal(${child.childId}, '${child.childName}')">삭제</button>
                </div>
            </div>
        `;
    }).join('');
}

// 날짜 포맷팅 (YYYY-MM-DD -> YYYY년 MM월 DD일)
function formatDate(dateString) {
    if (!dateString) return '미입력';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}년 ${month}월 ${day}일`;
}

// 기본 아바타 생성 (이름 기반)
function generateDefaultAvatar(name) {
    return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`;
}

// 자녀 생년월일 Flatpickr 초기화
let childBirthPickerInstance = null;
function initChildBirthPicker() {
    const childBirthInput = document.getElementById('childBirth');

    if (childBirthInput) {
        // 이미 초기화된 인스턴스가 있으면 제거
        if (childBirthPickerInstance) {
            childBirthPickerInstance.destroy();
        }

        // 새로운 인스턴스 생성
        childBirthPickerInstance = flatpickr(childBirthInput, {
            locale: 'ko',
            dateFormat: 'Y-m-d',
            maxDate: 'today',
            minDate: '1950-01-01',
            defaultDate: null,
            allowInput: false,
            disableMobile: true,
            yearSelectorType: 'dropdown',
            theme: 'light'
        });
    }
}

// 자녀 추가 모달 열기
function openAddChildModal() {
    currentEditingChildId = null;
    const modal = document.getElementById('childModal');
    const modalTitle = document.getElementById('childModalTitle');
    const form = document.getElementById('childForm');

    modalTitle.textContent = '자녀 추가';
    form.reset();
    document.getElementById('childId').value = '';

    // 기본 색상 설정
    selectedChildColor = '#FFB6C1';
    updateChildColorDisplay();

    // 기본 아바타 생성
    selectedChildAvatar = generateDefaultAvatar('default');
    document.getElementById('childAvatarImg').src = selectedChildAvatar;

    // 색상 팔레트 초기화
    initChildColorPalette();

    // 아바타 그리드와 새로고침 버튼은 숨김
    document.getElementById('childAvatarGrid').style.display = 'none';
    document.getElementById('childAvatarRefreshContainer').style.display = 'none';

    modal.style.display = 'flex';

    // Flatpickr 초기화 (모달이 표시된 후)
    setTimeout(() => {
        initChildBirthPicker();
    }, 100);

    // 모달 외부 클릭 시 닫기
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeChildModal();
        }
    });
}

// 자녀 수정 모달 열기
async function openEditChildModal(childId) {
    currentEditingChildId = childId;
    const modal = document.getElementById('childModal');
    const modalTitle = document.getElementById('childModalTitle');
    const form = document.getElementById('childForm');

    modalTitle.textContent = '자녀 수정';

    try {
        const response = await apiClient.getChild(childId);

        if (response.success && response.data) {
            const child = response.data;

            document.getElementById('childId').value = child.childId;
            document.getElementById('childName').value = child.childName || '';
            document.getElementById('childBirth').value = child.childBirth || '';
            document.getElementById('birthOrder').value = child.birthOrder || '';

            // 성별 선택
            const genderRadio = form.querySelector(`input[name="gender"][value="${child.gender}"]`);
            if (genderRadio) genderRadio.checked = true;

            // 색상 설정
            selectedChildColor = child.color || '#FFB6C1';
            updateChildColorDisplay();
            initChildColorPalette();

            // 아바타 설정
            selectedChildAvatar = child.profileImg || generateDefaultAvatar(child.childName);
            document.getElementById('childAvatarImg').src = selectedChildAvatar;

            // 아바타 그리드와 새로고침 버튼은 숨김
            document.getElementById('childAvatarGrid').style.display = 'none';
            document.getElementById('childAvatarRefreshContainer').style.display = 'none';

            modal.style.display = 'flex';

            // Flatpickr 초기화 및 날짜 설정 (모달이 표시된 후)
            setTimeout(() => {
                initChildBirthPicker();
                if (child.childBirth && childBirthPickerInstance) {
                    childBirthPickerInstance.setDate(child.childBirth, false);
                }
            }, 100);

            // 모달 외부 클릭 시 닫기
            modal.addEventListener('click', function(e) {
                if (e.target === modal) {
                    closeChildModal();
                }
            });
        } else {
            showToast('자녀 정보를 불러오는데 실패했습니다.', 'error');
        }
    } catch (error) {
        console.error('자녀 정보 로드 에러:', error);
        showToast('자녀 정보를 불러오는데 실패했습니다.', 'error');
    }
}

// 자녀 모달 닫기
function closeChildModal() {
    const modal = document.getElementById('childModal');
    const avatarGrid = document.getElementById('childAvatarGrid');
    const refreshContainer = document.getElementById('childAvatarRefreshContainer');

    modal.style.display = 'none';
    avatarGrid.style.display = 'none';
    refreshContainer.style.display = 'none';
    currentEditingChildId = null;
}

// 색상 팔레트 초기화
function initChildColorPalette() {
    const colorPalette = document.getElementById('childColorPalette');
    colorPalette.innerHTML = '';

    childColorPalette.forEach((color) => {
        const colorOption = document.createElement('div');
        colorOption.className = 'color-option';
        colorOption.style.backgroundColor = color;
        colorOption.dataset.color = color;

        if (color === selectedChildColor) {
            colorOption.classList.add('selected');
        }

        colorOption.addEventListener('click', function() {
            document.querySelectorAll('#childColorPalette .color-option').forEach(opt => {
                opt.classList.remove('selected');
            });
            this.classList.add('selected');
            selectedChildColor = color;
            updateChildColorDisplay();
        });

        colorPalette.appendChild(colorOption);
    });
}

// 색상 디스플레이 업데이트
function updateChildColorDisplay() {
    const preview = document.getElementById('childSelectedColorPreview');
    const hex = document.getElementById('childSelectedColorHex');

    if (preview) preview.style.backgroundColor = selectedChildColor;
    if (hex) hex.textContent = selectedChildColor;
}

// 아바타 선택 UI 표시/숨김
function showAvatarSelection() {
    const avatarGrid = document.getElementById('childAvatarGrid');
    const refreshContainer = document.getElementById('childAvatarRefreshContainer');

    if (avatarGrid.style.display === 'none' || !avatarGrid.style.display) {
        // 아바타 그리드 생성
        generateChildAvatarGrid();
        avatarGrid.style.display = 'grid';
        refreshContainer.style.display = 'block';
    } else {
        avatarGrid.style.display = 'none';
        refreshContainer.style.display = 'none';
    }
}

// 아바타 그리드 생성
function generateChildAvatarGrid() {
    const avatarGrid = document.getElementById('childAvatarGrid');
    avatarGrid.innerHTML = '';

    // DiceBear 스타일들 (안정적인 무료 API)
    const styles = ['avataaars', 'bottts', 'fun-emoji', 'lorelei', 'micah', 'pixel-art'];

    // 랜덤 시드 생성 (고유한 아바타를 위해)
    const randomSeeds = [];
    for (let i = 0; i < 6; i++) {
        randomSeeds.push(Math.random().toString(36).substring(2, 15));
    }

    // 6개의 아바타 생성
    randomSeeds.forEach((seed, index) => {
        const style = styles[index % styles.length];
        const avatarUrl = `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}`;

        const label = document.createElement('label');
        label.className = 'avatar-option';

        const input = document.createElement('input');
        input.type = 'radio';
        input.name = 'childAvatar';
        input.value = avatarUrl;

        if (avatarUrl === selectedChildAvatar) {
            input.checked = true;
        }

        input.addEventListener('change', function() {
            selectedChildAvatar = this.value;
            document.getElementById('childAvatarImg').src = this.value;
        });

        const avatarBox = document.createElement('div');
        avatarBox.className = 'avatar-box';

        const img = document.createElement('img');
        img.src = avatarUrl;
        img.alt = `아바타 ${index + 1}`;

        // 이미지 로드 에러 처리
        img.onerror = function() {
            console.error('아바타 로드 실패:', avatarUrl);
            // 폴백 이미지
            this.src = generateDefaultAvatar('child-' + index);
        };

        const span = document.createElement('span');
        span.className = 'avatar-label';
        span.textContent = `스타일 ${index + 1}`;

        avatarBox.appendChild(img);
        avatarBox.appendChild(span);
        label.appendChild(input);
        label.appendChild(avatarBox);
        avatarGrid.appendChild(label);
    });
}

// 자녀 아바타 새로고침 (랜덤 생성)
function refreshChildAvatars() {
    generateChildAvatarGrid();
    showToast('새로운 아바타를 불러왔습니다!', 'success');
}

// 자녀 폼 제출 처리
async function handleChildFormSubmit(e) {
    e.preventDefault();

    const childName = document.getElementById('childName').value.trim();
    const childBirth = document.getElementById('childBirth').value || null;
    const gender = document.querySelector('input[name="gender"]:checked')?.value;
    const birthOrder = document.getElementById('birthOrder').value ? parseInt(document.getElementById('birthOrder').value) : null;

    if (!childName) {
        showToast('자녀 이름을 입력해주세요.', 'error');
        return;
    }

    if (!gender) {
        showToast('성별을 선택해주세요.', 'error');
        return;
    }

    // 출생 순서 중복 검사
    if (birthOrder !== null) {
        // 다른 자녀들의 출생 순서 확인 (수정 중인 자녀 제외)
        const isDuplicate = childrenData.some(child => {
            // 수정 중인 자녀는 제외
            if (currentEditingChildId && child.childId === currentEditingChildId) {
                return false;
            }
            // 같은 출생 순서가 있는지 확인
            return child.birthOrder === birthOrder;
        });

        if (isDuplicate) {
            showToast('이미 등록되어 있는 순서입니다.', 'warning');
            return;
        }
    }

    const childData = {
        childName,
        childBirth,
        gender,
        birthOrder,
        color: selectedChildColor,
        profileImg: selectedChildAvatar
    };

    // 디버깅: 전송할 데이터 확인
    console.log('전송할 자녀 데이터:', childData);

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;

    try {
        submitBtn.disabled = true;
        submitBtn.textContent = '저장 중...';

        let response;
        if (currentEditingChildId) {
            // 수정
            response = await apiClient.updateChild(currentEditingChildId, childData);
        } else {
            // 등록
            response = await apiClient.createChild(childData);
        }

        if (response.success) {
            showToast(currentEditingChildId ? '자녀 정보가 수정되었습니다.' : '자녀가 추가되었습니다.', 'success');
            closeChildModal();
            await loadChildren(); // 목록 새로고침
        } else {
            showToast(response.error?.message || '작업에 실패했습니다.', 'error');
        }
    } catch (error) {
        console.error('자녀 저장 에러:', error);
        showToast('작업에 실패했습니다.', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

// 자녀 삭제 모달 열기
function openDeleteChildModal(childId, childName) {
    deleteTargetChildId = childId;
    const modal = document.getElementById('deleteChildModal');
    const nameDisplay = document.getElementById('deleteChildName');

    nameDisplay.textContent = `"${childName}"`;
    modal.style.display = 'flex';
}

// 자녀 삭제 모달 닫기
function closeDeleteChildModal() {
    const modal = document.getElementById('deleteChildModal');
    modal.style.display = 'none';
    deleteTargetChildId = null;
}

// 자녀 삭제 확인
async function confirmDeleteChild() {
    if (!deleteTargetChildId) return;

    try {
        const response = await apiClient.deleteChild(deleteTargetChildId);

        if (response.success) {
            showToast('자녀 정보가 삭제되었습니다.', 'success');
            closeDeleteChildModal();
            await loadChildren(); // 목록 새로고침
        } else {
            showToast(response.error?.message || '삭제에 실패했습니다.', 'error');
        }
    } catch (error) {
        console.error('자녀 삭제 에러:', error);
        showToast('삭제에 실패했습니다.', 'error');
    }
}

// 자녀 폼 초기화 함수
function initChildrenManagement() {
    const childForm = document.getElementById('childForm');
    if (childForm) {
        childForm.addEventListener('submit', handleChildFormSubmit);
    }

    // 자녀 목록 로드
    loadChildren();
}
