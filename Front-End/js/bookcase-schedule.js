/* ========================================
   독서 일정 관리 기능 (bookcase 수정 모달용)
======================================== */

let editStartPicker = null;
let editEndPicker = null;

/* ========================================
   독자 목록 로드 (수정 모달용)
======================================== */
async function loadReadersForEdit() {
    try {
        // 사용자 정보와 자녀 목록이 없으면 로드
        if (!currentUserInfo) {
            const userResponse = await apiClient.getUserInfo();
            if (userResponse.success && userResponse.data) {
                currentUserInfo = userResponse.data;
            }
        }

        if (!childrenData || childrenData.length === 0) {
            const childrenResponse = await apiClient.getChildren();
            if (childrenResponse.success && childrenResponse.data) {
                childrenData = Array.isArray(childrenResponse.data)
                    ? childrenResponse.data
                    : [childrenResponse.data];
            }
        }

        // 독자 선택 드롭다운 채우기
        populateEditReaderSelect();

    } catch (error) {
        console.error('독자 데이터 로드 실패:', error);
    }
}

/* ========================================
   독자 선택 드롭다운 채우기
======================================== */
function populateEditReaderSelect() {
    const readerSelect = document.getElementById('editReader');
    if (!readerSelect) return;

    // 기존 옵션 초기화 (첫 번째 "선택 안 함" 제외)
    while (readerSelect.options.length > 1) {
        readerSelect.remove(1);
    }

    // 본인 추가
    if (currentUserInfo) {
        const option = document.createElement('option');
        option.value = `user_${currentUserInfo.userId}`;
        option.textContent = `${currentUserInfo.username || currentUserInfo.nickname} (본인)`;
        option.dataset.type = 'user';
        option.dataset.userId = currentUserInfo.userId;
        option.dataset.color = currentUserInfo.color || '#20B2AA';
        readerSelect.appendChild(option);
    }

    // 자녀 추가
    if (childrenData && childrenData.length > 0) {
        childrenData.forEach(child => {
            const option = document.createElement('option');
            option.value = `child_${child.childId}`;
            option.textContent = `${child.name} (자녀, ${child.age}세)`;
            option.dataset.type = 'child';
            option.dataset.userId = child.childId;
            option.dataset.color = child.color || '#FF6B6B';
            readerSelect.appendChild(option);
        });
    }

    // 독자 선택 변경 이벤트
    readerSelect.addEventListener('change', updateReaderColorIndicator);
}

/* ========================================
   독자 색상 아이콘 업데이트
======================================== */
function updateReaderColorIndicator() {
    const readerSelect = document.getElementById('editReader');
    const colorIndicator = document.getElementById('editReaderColorIndicator');

    if (!readerSelect || !colorIndicator) return;

    const selectedOption = readerSelect.options[readerSelect.selectedIndex];

    if (selectedOption && selectedOption.dataset.color) {
        const color = selectedOption.dataset.color;
        const readerName = selectedOption.textContent.split('(')[0].trim();

        colorIndicator.innerHTML = `
            <div class="color-badge" style="background-color: ${color};">
                <span class="color-badge-text">${readerName.charAt(0)}</span>
            </div>
            <span class="color-label">${readerName}</span>
        `;
        colorIndicator.style.display = 'flex';
    } else {
        colorIndicator.innerHTML = '';
        colorIndicator.style.display = 'none';
    }
}

/* ========================================
   날짜 선택기 초기화 (Flatpickr)
======================================== */
function initEditDatePickers() {
    // 기존 인스턴스 제거
    if (editStartPicker) {
        editStartPicker.destroy();
        editStartPicker = null;
    }
    if (editEndPicker) {
        editEndPicker.destroy();
        editEndPicker = null;
    }

    // 시작일 선택기
    const startDateInput = document.getElementById('editStartDate');
    if (startDateInput) {
        editStartPicker = flatpickr(startDateInput, {
            locale: 'ko',
            dateFormat: 'Y-m-d',
            allowInput: false,
            onChange: function(selectedDates, dateStr, instance) {
                // 시작일이 선택되면 종료일의 minDate 설정
                if (editEndPicker && dateStr) {
                    editEndPicker.set('minDate', dateStr);
                }
            }
        });
    }

    // 종료일 선택기
    const endDateInput = document.getElementById('editEndDate');
    if (endDateInput) {
        editEndPicker = flatpickr(endDateInput, {
            locale: 'ko',
            dateFormat: 'Y-m-d',
            allowInput: false
        });
    }
}

/* ========================================
   기존 독서 일정 불러오기
======================================== */
async function loadExistingSchedule(bookId) {
    try {
        // 일정 초기화
        const readerSelect = document.getElementById('editReader');
        const colorIndicator = document.getElementById('editReaderColorIndicator');

        if (readerSelect) readerSelect.value = '';
        if (editStartPicker) editStartPicker.clear();
        if (editEndPicker) editEndPicker.clear();
        if (colorIndicator) {
            colorIndicator.innerHTML = '';
            colorIndicator.style.display = 'none';
        }

        // API 호출하여 해당 책의 독서 일정 조회
        // GET /api/calendar?bookId={bookId} 또는 GET /api/calendar/book/{bookId}
        let response;
        try {
            // 방법 1: Query parameter
            response = await apiClient.request(`/calendar?bookId=${bookId}`, {
                method: 'GET'
            });
        } catch (error1) {
            try {
                // 방법 2: Path parameter
                response = await apiClient.request(`/calendar/book/${bookId}`, {
                    method: 'GET'
                });
            } catch (error2) {
                console.log('기존 독서 일정 없음');
                return;
            }
        }

        // 응답 데이터 추출
        let schedules = [];
        if (response.success && response.data) {
            schedules = Array.isArray(response.data) ? response.data : [response.data];
        } else if (Array.isArray(response)) {
            schedules = response;
        }

        if (schedules.length > 0) {
            // 가장 최근 일정 사용
            const schedule = schedules[0];

            // 독자 선택
            if (schedule.userId || schedule.childId) {
                const userId = schedule.userId || schedule.childId;

                // userId가 본인인지 자녀인지 확인
                if (currentUserInfo && userId === currentUserInfo.userId) {
                    readerSelect.value = `user_${userId}`;
                } else {
                    // 자녀 찾기
                    const child = childrenData.find(c => c.childId === userId);
                    if (child) {
                        readerSelect.value = `child_${userId}`;
                    }
                }
                // 색상 아이콘 업데이트
                updateReaderColorIndicator();
            }

            // 날짜
            if (schedule.startDate && editStartPicker) {
                editStartPicker.setDate(schedule.startDate);
            }
            if (schedule.endDate && editEndPicker) {
                editEndPicker.setDate(schedule.endDate);
            }
        }

    } catch (error) {
        console.error('기존 독서 일정 불러오기 실패:', error);
        // 에러가 발생해도 모달은 정상 표시
    }
}

/* ========================================
   독서 일정 데이터 수집 (Book API 형식)
======================================== */
function collectScheduleData() {
    const readerSelect = document.getElementById('editReader');
    const startDateInput = document.getElementById('editStartDate');
    const endDateInput = document.getElementById('editEndDate');

    // 독자나 시작일이 선택되지 않으면 null 반환
    if (!readerSelect.value || !startDateInput.value) {
        return null;
    }

    // 독자 ID 추출 (childId)
    let childId = null;
    const selectedOption = readerSelect.options[readerSelect.selectedIndex];
    const readerType = selectedOption.dataset.type;

    if (readerType === 'user') {
        // 본인인 경우 userId 사용 (백엔드에서 childId 0 또는 userId로 처리)
        childId = parseInt(selectedOption.dataset.userId);
    } else if (readerType === 'child') {
        // 자녀인 경우 childId 사용
        childId = parseInt(selectedOption.dataset.userId);
    }

    // Book API의 bookDetailsUpdate 형식으로 반환
    const scheduleData = {
        childId: childId,
        startDate: startDateInput.value
    };

    // 종료일 추가 (있을 경우)
    if (endDateInput.value) {
        scheduleData.endDate = endDateInput.value;
    }

    return scheduleData;
}

/* ========================================
   독서 일정을 Book API의 bookDetailsUpdate 배열로 반환
======================================== */
function getBookDetailsUpdate() {
    const scheduleData = collectScheduleData();

    console.log('🔍 collectScheduleData() 결과:', scheduleData);

    if (!scheduleData) {
        // 일정 정보가 없으면 빈 배열 반환
        console.log('⚠️ 독서 일정 데이터 없음');
        return [];
    }

    // bookDetailsUpdate는 배열 형식
    console.log('✅ bookDetailsUpdate 생성:', [scheduleData]);
    return [scheduleData];
}
