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
function editProfile() {
    // TODO: 프로필 수정 페이지로 이동 또는 모달 표시
    showToast('프로필 수정 기능은 추후 구현 예정입니다.', 'info');
}

// ==================== 비밀번호 변경 ====================
function changePassword() {
    // TODO: 비밀번호 변경 페이지로 이동 또는 모달 표시
    showToast('비밀번호 변경 기능은 추후 구현 예정입니다.', 'info');
}

// ==================== 구독 플랜 보기 ====================
function goToSubscription() {
    // TODO: 구독 페이지로 이동
    showToast('구독 플랜 페이지는 추후 구현 예정입니다.', 'info');
}

// ==================== 로그아웃 ====================
async function logout() {
    const confirmed = confirm('로그아웃 하시겠습니까?');
    if (!confirmed) return;

    try {
        await apiClient.logout();
        showToast('로그아웃되었습니다.', 'success');

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
async function deleteAccount() {
    const confirmed = confirm('정말로 회원 탈퇴하시겠습니까?\n이 작업은 취소할 수 없습니다.');
    if (!confirmed) return;

    const password = prompt('회원 탈퇴를 위해 비밀번호를 입력해주세요.');
    if (!password) return;

    try {
        const response = await apiClient.deleteUser({ password });

        if (response.success) {
            showToast('회원 탈퇴가 완료되었습니다.', 'success');

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
    }
}
