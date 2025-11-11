// ==================== 전역 변수 ====================
let currentStep = 0;

// ==================== 1단계: 약관 동의 ====================

// 약관 동의 로직 초기화
function initializeTermsAgreement() {
    const agreeAll = document.getElementById('agreeAll');
    const requiredTerms = document.querySelectorAll('.required-term');
    const optionalTerms = document.querySelectorAll('.optional-term');

    // 모두 동의 체크박스 클릭 시
    agreeAll.addEventListener('change', function() {
        const isChecked = this.checked;
        requiredTerms.forEach(term => term.checked = isChecked);
        optionalTerms.forEach(term => term.checked = isChecked);
    });

    // 개별 체크박스 변경 시 모두 동의 체크박스 상태 업데이트
    function updateAgreeAll() {
        const allTerms = [...requiredTerms, ...optionalTerms];
        const allChecked = allTerms.every(term => term.checked);
        agreeAll.checked = allChecked;
    }

    requiredTerms.forEach(term => term.addEventListener('change', updateAgreeAll));
    optionalTerms.forEach(term => term.addEventListener('change', updateAgreeAll));
}

// 필수 약관 동의 확인
function validateTermsAgreement() {
    // 개발 중 - 유효성 검사 임시 비활성화
    return true;

    /*
    const requiredTerms = document.querySelectorAll('.required-term');
    const allRequiredChecked = Array.from(requiredTerms).every(term => term.checked);

    if (!allRequiredChecked) {
        alert('필수 약관에 모두 동의해주세요.');
        return false;
    }
    return true;
    */
}

// ==================== 2단계: 회원가입 정보 입력 ====================

// 생년월일 옵션 생성
function initializeBirthDateOptions() {
    const birthYear = document.getElementById('birthYear');
    const birthMonth = document.getElementById('birthMonth');
    const birthDay = document.getElementById('birthDay');

    // 년도 옵션 (1950 ~ 현재)
    const currentYear = new Date().getFullYear();
    for (let year = currentYear; year >= 1950; year--) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        birthYear.appendChild(option);
    }

    // 월 옵션
    for (let month = 1; month <= 12; month++) {
        const option = document.createElement('option');
        option.value = month;
        option.textContent = month;
        birthMonth.appendChild(option);
    }

    // 일 옵션
    for (let day = 1; day <= 31; day++) {
        const option = document.createElement('option');
        option.value = day;
        option.textContent = day;
        birthDay.appendChild(option);
    }
}

// 비밀번호 유효성 검사
function validatePassword() {
    const password = document.getElementById('password');
    const passwordValue = password.value;
    const regex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;

    // 입력값이 있을 때만 검증
    if (passwordValue && passwordValue.length > 0) {
        if (!regex.test(passwordValue)) {
            password.style.borderColor = '#e74c3c';
        } else {
            password.style.borderColor = '#27ae60';
        }
    } else {
        password.style.borderColor = '#ddd';
    }
}

// 비밀번호 일치 확인
function checkPasswordMatch() {
    const password = document.getElementById('password');
    const passwordConfirm = document.getElementById('passwordConfirm');
    const passwordError = document.getElementById('passwordError');

    if (passwordConfirm.value) {
        if (password.value !== passwordConfirm.value) {
            passwordError.style.display = 'block';
            passwordConfirm.style.borderColor = '#e74c3c';
        } else {
            passwordError.style.display = 'none';
            passwordConfirm.style.borderColor = '#27ae60';
        }
    } else {
        passwordError.style.display = 'none';
        passwordConfirm.style.borderColor = '#ddd';
    }
}

// 이메일 인증번호 발송
function sendVerificationCode() {
    const email = document.getElementById('email').value;
    if (!email) {
        showToast('이메일을 입력해주세요.', 'warning');
        return;
    }
    // TODO: 실제 인증번호 발송 로직
    showToast('인증번호가 발송되었습니다.', 'success');
}

// 인증번호 확인
function verifyCode() {
    const code = document.getElementById('verificationCode').value;
    if (!code) {
        showToast('인증번호를 입력해주세요.', 'warning');
        return;
    }
    // TODO: 실제 인증번호 확인 로직
    showToast('인증이 완료되었습니다.', 'success');
}

// 닉네임 중복 확인
function checkNickname() {
    const nickname = document.getElementById('nickname').value;
    if (!nickname) {
        showToast('닉네임을 입력해주세요.', 'warning');
        return;
    }
    // TODO: 실제 닉네임 중복 확인 로직
    showToast('사용 가능한 닉네임입니다.', 'success');
}

// 주소 찾기
function findAddress() {
    // TODO: 주소 API 연동
    showToast('주소 찾기 기능은 추후 구현 예정입니다.', 'info');
}

// 2단계 이벤트 리스너 등록
function initializeStep2EventListeners() {
    const password = document.getElementById('password');
    const passwordConfirm = document.getElementById('passwordConfirm');

    // 비밀번호 실시간 검증
    password.addEventListener('input', validatePassword);
    password.addEventListener('input', checkPasswordMatch);
    passwordConfirm.addEventListener('input', checkPasswordMatch);

    // 버튼 이벤트
    document.getElementById('sendVerification').addEventListener('click', sendVerificationCode);
    document.getElementById('verifyCode').addEventListener('click', verifyCode);
    document.getElementById('checkNickname').addEventListener('click', checkNickname);
    document.getElementById('findAddress').addEventListener('click', findAddress);
}

// ==================== 3단계: 프로필 설정 ====================

// DiceBear 아바타 생성
function generateBoringAvatars() {
    const avatarGrid = document.getElementById('avatarGrid');
    avatarGrid.innerHTML = ''; // 기존 아바타 제거

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
        // DiceBear API v7.x
        const avatarUrl = `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}`;

        const label = document.createElement('label');
        label.className = 'avatar-option';

        const input = document.createElement('input');
        input.type = 'radio';
        input.name = 'avatar';
        input.value = avatarUrl;
        if (index === 0) input.required = true;

        const avatarBox = document.createElement('div');
        avatarBox.className = 'avatar-box';

        const img = document.createElement('img');
        img.src = avatarUrl;
        img.alt = `아바타 ${index + 1}`;

        // 이미지 로드 에러 처리
        img.onerror = function() {
            console.error('아바타 로드 실패:', avatarUrl);
            // 폴백 SVG
            this.src = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22120%22 height=%22120%22%3E%3Ccircle cx=%2260%22 cy=%2260%22 r=%2250%22 fill=%22%23' + ['FFB6C1', '87CEEB', '98FB98', 'FFD700', 'DDA0DD', 'FFA07A'][index] + '%22/%3E%3Ccircle cx=%2248%22 cy=%2254%22 r=%226%22 fill=%22%23333%22/%3E%3Ccircle cx=%2272%22 cy=%2254%22 r=%226%22 fill=%22%23333%22/%3E%3Cpath d=%22M 42 75 Q 60 85 78 75%22 stroke=%22%23333%22 stroke-width=%223%22 fill=%22none%22/%3E%3C/svg%3E';
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

// 아바타 새로고침
function setupAvatarRefresh() {
    const refreshBtn = document.getElementById('refreshAvatars');
    refreshBtn.addEventListener('click', generateBoringAvatars);
}

// 색상 팔레트 생성 및 선택
function initializeColorPicker() {
    const colorPaletteGrid = document.getElementById('colorPaletteGrid');
    const colorPreview = document.getElementById('colorPreview');
    const colorHexDisplay = document.getElementById('colorHexDisplay');
    const colorInput = document.getElementById('colorPicker');

    // 미리 정의된 색상 팔레트 (HEX 값)
    const colorPalette = [
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

    // 색상 옵션 생성
    colorPalette.forEach((color) => {
        const colorOption = document.createElement('div');
        colorOption.className = 'color-option';
        colorOption.style.backgroundColor = color;
        colorOption.dataset.color = color;

        // 기본 선택 색상 표시
        if (color === '#20B2AA') {
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

            // 색상 업데이트
            const selectedColor = this.dataset.color;
            colorPreview.style.backgroundColor = selectedColor;
            colorHexDisplay.textContent = selectedColor;
            colorInput.value = selectedColor;
        });

        colorPaletteGrid.appendChild(colorOption);
    });
}

// ==================== 단계 전환 로직 ====================

// 단계 표시 함수
function showStep(stepIndex) {
    const formSteps = document.querySelectorAll('.form-step');
    const stepIndicators = document.querySelectorAll('.step');

    // 모든 단계 숨기기
    formSteps.forEach(step => step.classList.remove('active'));

    // 현재 단계만 보이기
    formSteps[stepIndex].classList.add('active');

    // 단계 표시기 업데이트
    stepIndicators.forEach((indicator, index) => {
        if (index === stepIndex) {
            indicator.classList.add('active');
        } else {
            indicator.classList.remove('active');
        }
    });

    // 이전 버튼 표시/숨기기 (1단계에서는 이전 버튼 숨김)
    const prevBtn = document.getElementById('prevBtn');
    if (prevBtn) {
        if (stepIndex === 0) {
            prevBtn.style.display = 'none';
        } else {
            prevBtn.style.display = 'inline-block';
        }
    }
}

// 단계 네비게이션 설정
function setupStepNavigation() {
    const nextToStep2Btn = document.getElementById('nextToStep2');
    const nextToStep3Btn = document.getElementById('nextToStep3');
    const prevBtn = document.getElementById('prevBtn');
    const prevBtn2 = document.getElementById('prevBtn2');

    // 1단계 -> 2단계 (약관 동의 -> 회원가입 정보)
    nextToStep2Btn.addEventListener('click', function() {
        if (validateTermsAgreement()) {
            currentStep = 1;
            showStep(currentStep);
        }
    });

    // 2단계 -> 3단계 (회원가입 정보 -> 프로필 설정)
    nextToStep3Btn.addEventListener('click', function() {
        currentStep = 2;
        showStep(currentStep);
    });

    // 2단계 이전 버튼 (회원가입 정보 -> 약관 동의)
    prevBtn.addEventListener('click', function() {
        if (currentStep > 0) {
            currentStep = 0;
            showStep(currentStep);
        }
    });

    // 3단계 이전 버튼 (프로필 설정 -> 회원가입 정보)
    prevBtn2.addEventListener('click', function() {
        if (currentStep > 0) {
            currentStep = 1;
            showStep(currentStep);
        }
    });
}

// ==================== 폼 제출 ====================

// 폼 제출 처리
async function handleSubmit(e) {
    e.preventDefault();

    // 유효성 검사
    const password = document.getElementById('password');
    const passwordConfirm = document.getElementById('passwordConfirm');
    const email = document.getElementById('email');
    const username = document.getElementById('name'); // HTML에서는 id="name" 사용
    const nickname = document.getElementById('nickname');
    const phone = document.getElementById('phone');
    const birthYear = document.getElementById('birthYear');
    const birthMonth = document.getElementById('birthMonth');
    const birthDay = document.getElementById('birthDay');
    const address = document.getElementById('address');
    const detailAddress = document.getElementById('detailAddress');

    // 비밀번호 유효성 검사
    const passwordValue = password.value;
    const regex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;

    if (!regex.test(passwordValue)) {
        showToast('비밀번호는 영어, 숫자, 특수문자(@$!%*#?&)를 포함한 8자리 이상이어야 합니다.', 'warning');
        return;
    }

    if (password.value !== passwordConfirm.value) {
        showToast('비밀번호가 일치하지 않습니다.', 'warning');
        return;
    }

    // 필수 입력 항목 확인
    if (!email.value || !username.value || !password.value || !nickname.value || !phone.value) {
        showToast('필수 입력 항목을 모두 입력해주세요.', 'warning');
        return;
    }

    // 생년월일 조합
    const birthDate = birthYear.value && birthMonth.value && birthDay.value
        ? `${birthYear.value}-${String(birthMonth.value).padStart(2, '0')}-${String(birthDay.value).padStart(2, '0')}`
        : null;

    // 주소 조합
    const fullAddress = address.value && detailAddress.value
        ? `${address.value} ${detailAddress.value}`
        : address.value || null;

    // 선택된 아바타 URL 가져오기
    const selectedAvatar = document.querySelector('input[name="avatar"]:checked');
    const avatarUrl = selectedAvatar ? selectedAvatar.value : null;

    // 선택된 색상 가져오기
    const selectedColor = document.getElementById('colorPicker').value || '#20B2AA';

    // 약관 동의 정보 가져오기 (HTML에서는 terms prefix 사용)
    const serviceTermAgreed = document.getElementById('termsService')?.checked || false;
    const privacyTermAgreed = document.getElementById('termsPrivacy')?.checked || false;
    const locationTermAgreed = document.getElementById('termsLocation')?.checked || false;
    const marketingTermAgreed = document.getElementById('termsMarketing')?.checked || false;

    // 회원가입 데이터 생성
    const signupData = {
        email: email.value,
        password: password.value,
        username: username.value,
        nickname: nickname.value,
        phone: phone.value,
        birthDate: birthDate,
        address: fullAddress,
        profileImageUrl: avatarUrl,
        themeColor: selectedColor,
        serviceTermAgreed: serviceTermAgreed,
        privacyTermAgreed: privacyTermAgreed,
        locationTermAgreed: locationTermAgreed,
        marketingTermAgreed: marketingTermAgreed
    };

    try {
        // 로딩 표시
        const submitBtn = document.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = '가입 중...';

        // API 호출
        const response = await apiClient.signup(signupData);

        // 성공 처리
        showToast('회원가입이 완료되었습니다. 로그인 페이지로 이동합니다.', 'success');

        // 토스트가 보이도록 약간의 지연 후 페이지 이동
        setTimeout(() => {
            window.location.href = '/login.html';
        }, 1000);

    } catch (error) {
        // 에러 처리
        console.error('회원가입 실패:', error);

        let errorMessage = '회원가입에 실패했습니다. 다시 시도해주세요.';

        // 백엔드에서 반환된 에러 메시지 표시
        if (error.data && error.data.message) {
            errorMessage = error.data.message;
        } else if (error.message) {
            errorMessage = error.message;
        }

        showToast(errorMessage, 'error');

        // 버튼 복원
        const submitBtn = document.querySelector('button[type="submit"]');
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

// ==================== 초기화 ====================

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    // 1단계 초기화
    initializeTermsAgreement();

    // 2단계 초기화
    initializeBirthDateOptions();
    initializeStep2EventListeners();

    // 3단계 초기화
    generateBoringAvatars();
    setupAvatarRefresh();
    initializeColorPicker();

    // 단계 네비게이션 설정
    setupStepNavigation();

    // 폼 제출 이벤트
    document.getElementById('registerForm').addEventListener('submit', handleSubmit);

    // 첫 번째 단계 표시
    showStep(currentStep);
});
