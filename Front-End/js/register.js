// ==================== 전역 변수 ====================
let currentStep = 0;
let isNicknameChecked = false; // 닉네임 중복 확인 여부
let checkedNickname = ''; // 중복 확인된 닉네임

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
    const requiredTerms = document.querySelectorAll('.required-term');
    const allRequiredChecked = Array.from(requiredTerms).every(term => term.checked);

    if (!allRequiredChecked) {
        showToast('필수 약관에 모두 동의해주세요.', 'warning');
        return false;
    }
    return true;
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
/* function sendVerificationCode() {
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
} */

// 닉네임 중복 확인 (API 미구현으로 비활성화)
async function checkNickname() {
    showToast('닉네임 중복 확인 기능은 현재 준비 중입니다.', 'info');
    return;

    /* // API 구현 후 활성화
    const nickname = document.getElementById('nickname').value.trim();
    const checkBtn = document.getElementById('checkNickname');

    if (!nickname) {
        showToast('닉네임을 입력해주세요.', 'warning');
        return;
    }

    // 닉네임 길이 검증 (2-20자)
    if (nickname.length < 2 || nickname.length > 20) {
        showToast('닉네임은 2-20자 사이여야 합니다.', 'warning');
        return;
    }

    try {
        // 버튼 비활성화
        checkBtn.disabled = true;
        checkBtn.textContent = '확인 중...';

        // API 호출
        const response = await apiClient.checkNickname(nickname);

        // 백엔드 응답 형식: {success, code, message, data: {available: true/false}}
        if (response.success && response.data) {
            if (response.data.available) {
                showToast('사용 가능한 닉네임입니다.', 'success');
                // 닉네임 입력란 테두리 초록색으로 표시
                document.getElementById('nickname').style.borderColor = '#27ae60';
                // 중복 확인 완료 표시
                isNicknameChecked = true;
                checkedNickname = nickname;
            } else {
                showToast('이미 사용 중인 닉네임입니다.', 'error');
                // 닉네임 입력란 테두리 빨간색으로 표시
                document.getElementById('nickname').style.borderColor = '#e74c3c';
                // 중복 확인 실패
                isNicknameChecked = false;
                checkedNickname = '';
            }
        } else {
            throw new Error(response.message || '닉네임 확인에 실패했습니다.');
        }

    } catch (error) {
        console.error('닉네임 중복 확인 실패:', error);

        let errorMessage = '닉네임 확인에 실패했습니다. 다시 시도해주세요.';

        if (error.data && error.data.message) {
            errorMessage = error.data.message;
        } else if (error.message) {
            errorMessage = error.message;
        }

        showToast(errorMessage, 'error');
        // 닉네임 입력란 테두리 초기화
        document.getElementById('nickname').style.borderColor = '#ddd';
        // 중복 확인 실패
        isNicknameChecked = false;
        checkedNickname = '';

    } finally {
        // 버튼 복원
        checkBtn.disabled = false;
        checkBtn.textContent = '중복확인';
    }
    */
}

// 닉네임 입력 시 중복 확인 상태 초기화
function handleNicknameInput() {
    const nickname = document.getElementById('nickname').value.trim();

    // 닉네임이 변경되면 중복 확인 상태 초기화
    if (nickname !== checkedNickname) {
        isNicknameChecked = false;
        document.getElementById('nickname').style.borderColor = '#ddd';
    }
}

// 주소 찾기 - 카카오 주소 검색 API
function findAddress() {
    new daum.Postcode({
        oncomplete: function(data) {
            // 팝업에서 검색결과 항목을 클릭했을때 실행할 코드

            // 각 주소의 노출 규칙에 따라 주소를 조합
            // 내려오는 변수가 값이 없는 경우엔 공백('')값을 가지므로, 이를 참고하여 분기
            let addr = ''; // 주소 변수
            let extraAddr = ''; // 참고항목 변수

            // 사용자가 선택한 주소 타입에 따라 해당 주소 값을 가져옴
            if (data.userSelectedType === 'R') { // 도로명 주소 선택
                addr = data.roadAddress;
            } else { // 지번 주소 선택
                addr = data.jibunAddress;
            }

            // 도로명 주소인 경우 참고항목 조합
            if(data.userSelectedType === 'R'){
                // 법정동명이 있을 경우 추가 (법정리는 제외)
                // 법정동의 경우 마지막 문자가 "동/로/가"로 끝남
                if(data.bname !== '' && /[동|로|가]$/g.test(data.bname)){
                    extraAddr += data.bname;
                }
                // 건물명이 있고, 공동주택일 경우 추가
                if(data.buildingName !== '' && data.apartment === 'Y'){
                    extraAddr += (extraAddr !== '' ? ', ' + data.buildingName : data.buildingName);
                }
                // 표시할 참고항목이 있을 경우, 괄호까지 추가한 최종 문자열을 만듦
                if(extraAddr !== ''){
                    extraAddr = ' (' + extraAddr + ')';
                }
            }

            // 우편번호와 주소 정보를 해당 필드에 넣음
            document.getElementById('address').value = addr + extraAddr;

            // 커서를 상세주소 필드로 이동
            document.getElementById('detailAddress').focus();

            showToast('주소가 입력되었습니다.', 'success');
        },
        theme: {
            // 테마 커스터마이징
            bgColor: "#FFFFFF", // 바탕 배경색
            searchBgColor: "#20B2AA", // 검색창 배경색
            contentBgColor: "#FFFFFF", // 본문 배경색
            pageBgColor: "#FFFFFF", // 페이지 배경색
            textColor: "#333333", // 기본 글자색
            queryTextColor: "#FFFFFF", // 검색창 글자색
            postcodeTextColor: "#20B2AA", // 우편번호 글자색
            emphTextColor: "#20B2AA", // 강조 글자색
            outlineColor: "#20B2AA" // 테두리색
        },
        width: '100%',
        height: '100%'
    }).open();
}

// 전화번호 자동 포맷팅
function formatPhoneNumber(event) {
    const input = event.target;
    let value = input.value.replace(/\D/g, ''); // 숫자만 추출

    let formatted = '';
    if (value.length <= 3) {
        formatted = value;
    } else if (value.length <= 7) {
        if (value.startsWith('02')) {
            // 서울 지역번호: 02-123-4567
            formatted = `${value.substr(0, 2)}-${value.substr(2)}`;
        } else {
            // 휴대폰/지역번호: 010-1234, 031-123
            formatted = `${value.substr(0, 3)}-${value.substr(3)}`;
        }
    } else if (value.length <= 10) {
        if (value.startsWith('02')) {
            // 서울: 02-123-4567
            formatted = `${value.substr(0, 2)}-${value.substr(2, 3)}-${value.substr(5)}`;
        } else {
            // 지역번호: 031-123-4567
            formatted = `${value.substr(0, 3)}-${value.substr(3, 3)}-${value.substr(6)}`;
        }
    } else {
        if (value.startsWith('02')) {
            // 서울: 02-1234-5678
            formatted = `${value.substr(0, 2)}-${value.substr(2, 4)}-${value.substr(6, 4)}`;
        } else {
            // 휴대폰: 010-1234-5678
            formatted = `${value.substr(0, 3)}-${value.substr(3, 4)}-${value.substr(7, 4)}`;
        }
    }

    input.value = formatted;
}

// 2단계 이벤트 리스너 등록
function initializeStep2EventListeners() {
    const password = document.getElementById('password');
    const passwordConfirm = document.getElementById('passwordConfirm');
    const phone = document.getElementById('phone');
    const nickname = document.getElementById('nickname');

    // 비밀번호 실시간 검증
    password.addEventListener('input', validatePassword);
    password.addEventListener('input', checkPasswordMatch);
    passwordConfirm.addEventListener('input', checkPasswordMatch);

    // 전화번호 자동 포맷팅
    phone.addEventListener('input', formatPhoneNumber);

    // 닉네임 입력 시 중복 확인 상태 초기화
    nickname.addEventListener('input', handleNicknameInput);

    // 버튼 이벤트
    // document.getElementById('sendVerification').addEventListener('click', sendVerificationCode);
    // document.getElementById('verifyCode').addEventListener('click', verifyCode);
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

    // 닉네임 중복 확인 검증 (API 미구현으로 비활성화)
    /* if (!isNicknameChecked || nickname.value.trim() !== checkedNickname) {
        showToast('닉네임 중복 확인을 먼저 진행해주세요.', 'warning');
        nickname.focus();
        return;
    } */

    // 생년월일 조합 (백엔드 형식: YYYY-MM-DD)
    const birth = birthYear.value && birthMonth.value && birthDay.value
        ? `${birthYear.value}-${String(birthMonth.value).padStart(2, '0')}-${String(birthDay.value).padStart(2, '0')}`
        : null;

    // 주소 조합 (기본 주소 + 상세 주소)
    let fullAddress = null;
    if (address.value) {
        fullAddress = address.value;
        if (detailAddress.value) {
            fullAddress += ' ' + detailAddress.value;
        }
    }

    // 선택된 색상 가져오기
    const selectedColor = document.getElementById('colorPicker').value || '#20B2AA';

    // 전화번호 형식 검증 및 변환 (백엔드 요구 형식: XXX-XXXX-XXXX 또는 XXX-XXX-XXXX)
    let formattedPhone = phone.value ? phone.value.trim() : null;
    if (formattedPhone) {
        // 하이픈 제거 후 숫자만 추출
        const phoneDigits = formattedPhone.replace(/\D/g, '');

        // 전화번호 형식 변환
        if (phoneDigits.length === 11) {
            // 휴대폰: 010-1234-5678
            formattedPhone = `${phoneDigits.substr(0, 3)}-${phoneDigits.substr(3, 4)}-${phoneDigits.substr(7, 4)}`;
        } else if (phoneDigits.length === 10) {
            // 일반전화: 02-123-4567 또는 031-123-4567
            if (phoneDigits.startsWith('02')) {
                formattedPhone = `${phoneDigits.substr(0, 2)}-${phoneDigits.substr(2, 4)}-${phoneDigits.substr(6, 4)}`;
            } else {
                formattedPhone = `${phoneDigits.substr(0, 3)}-${phoneDigits.substr(3, 3)}-${phoneDigits.substr(6, 4)}`;
            }
        } else if (phoneDigits.length === 9 && phoneDigits.startsWith('02')) {
            // 서울 지역번호: 02-123-4567
            formattedPhone = `${phoneDigits.substr(0, 2)}-${phoneDigits.substr(2, 3)}-${phoneDigits.substr(5, 4)}`;
        }
    }

    // 회원가입 데이터 생성 (백엔드 API 스펙에 맞춤)
    const signupData = {
        email: email.value,
        password: password.value,
        username: username.value,
        nickname: nickname.value || null,
        phone: formattedPhone,
        birth: birth,
        address: fullAddress,
        color: selectedColor
    };

    // 로딩 표시용 변수 선언 (스코프 이슈 해결)
    const submitBtn = document.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;

    try {
        // 로딩 표시
        submitBtn.disabled = true;
        submitBtn.textContent = '가입 중...';

        // API 호출 (백엔드 응답 형식: {success, code, message, data})
        const response = await apiClient.signup(signupData);

        // 성공 처리
        if (response.success && response.data) {
            showToast('회원가입이 완료되었습니다. 로그인 페이지로 이동합니다.', 'success');

            // 사용자 정보 로그 (디버깅용)
            console.log('회원가입 성공:', response.data);

            // 토스트가 보이도록 약간의 지연 후 페이지 이동
            setTimeout(() => {
                window.location.href = '/login.html';
            }, 1500);
        } else {
            // 성공 플래그가 false인 경우
            throw new Error(response.message || '회원가입에 실패했습니다.');
        }

    } catch (error) {
        // 에러 처리
        console.error('회원가입 실패:', error);

        let errorMessage = '회원가입에 실패했습니다. 다시 시도해주세요.';

        // 백엔드 에러 응답 처리
        if (error.data) {
            // 백엔드 표준 응답 형식: {success, code, message}
            if (error.data.message) {
                errorMessage = error.data.message;
            }

            // 특정 에러 코드별 처리
            switch (error.data.code) {
                case 'USER002':
                    errorMessage = '이미 사용 중인 이메일입니다.';
                    email.focus();
                    break;
                case 'USER003':
                    errorMessage = '이미 사용 중인 사용자 이름입니다.';
                    username.focus();
                    break;
                case 'C001':
                    errorMessage = '입력 형식이 올바르지 않습니다. 다시 확인해주세요.';
                    break;
                default:
                    // 기본 메시지 사용
                    break;
            }
        } else if (error.message) {
            errorMessage = error.message;
        }

        showToast(errorMessage, 'error');

        // 버튼 복원 (originalText는 이미 상위 스코프에서 선언됨)
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
