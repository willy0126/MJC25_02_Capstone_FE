/* ========================================
   독서 일정 관리 기능 (bookcase 수정 모달용) - 다중 독자 지원
======================================== */

let scheduleEntryIndex = 0;
let flatpickrInstances = []; // Flatpickr 인스턴스 관리

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

        // 일정 초기화
        initScheduleEntries();

    } catch (error) {
        console.error('독자 데이터 로드 실패:', error);
    }
}

/* ========================================
   한글 서수 변환
======================================== */
function getKoreanOrdinal(num) {
    const ordinals = ['', '첫째', '둘째', '셋째', '넷째', '다섯째', '여섯째', '일곱째', '여덟째', '아홉째', '열째'];
    if (num >= 1 && num <= 10) {
        return ordinals[num];
    }
    return `${num}째`;
}

/* ========================================
   일정 항목 초기화
======================================== */
function initScheduleEntries() {
    const container = document.getElementById('scheduleEntriesContainer');
    if (!container) return;

    // 기존 Flatpickr 인스턴스 정리
    flatpickrInstances.forEach(fp => {
        if (fp && fp.destroy) fp.destroy();
    });
    flatpickrInstances = [];

    // 컨테이너 초기화
    container.innerHTML = '';
    scheduleEntryIndex = 0;

    // 첫 번째 일정 항목 추가
    addScheduleEntry();

    // + 버튼 이벤트 설정
    const addBtn = document.getElementById('btnAddSchedule');
    if (addBtn) {
        // 기존 이벤트 제거 후 새로 추가
        const newAddBtn = addBtn.cloneNode(true);
        addBtn.parentNode.replaceChild(newAddBtn, addBtn);
        newAddBtn.addEventListener('click', addScheduleEntry);
    }
}

/* ========================================
   새 일정 항목 추가
======================================== */
function addScheduleEntry() {
    const container = document.getElementById('scheduleEntriesContainer');
    if (!container) return;

    scheduleEntryIndex++;
    const entryDiv = document.createElement('div');
    entryDiv.className = 'schedule-entry';
    entryDiv.dataset.index = scheduleEntryIndex;

    const showRemoveBtn = container.children.length > 0;

    entryDiv.innerHTML = `
        <div class="schedule-entry-header">
            <span class="schedule-entry-label">독자 ${container.children.length + 1}</span>
            <button type="button" class="btn-remove-schedule" title="삭제" style="display: ${showRemoveBtn ? 'flex' : 'none'};">×</button>
        </div>
        <div class="form-group">
            <label>독자 선택</label>
            <div class="reader-select-wrapper">
                <select name="reader" class="form-select schedule-reader-select">
                    <option value="">선택 안 함</option>
                </select>
                <div class="reader-color-indicator schedule-color-indicator"></div>
            </div>
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>시작일</label>
                <input type="text" name="startDate" class="form-input flatpickr-input schedule-start-date" placeholder="시작일 선택" readonly>
            </div>
            <div class="form-group">
                <label>완료일</label>
                <input type="text" name="endDate" class="form-input flatpickr-input schedule-end-date" placeholder="완료일 선택" readonly>
            </div>
        </div>
    `;

    container.appendChild(entryDiv);

    // 독자 선택 드롭다운 채우기
    const readerSelect = entryDiv.querySelector('.schedule-reader-select');
    populateReaderSelect(readerSelect);

    // 독자 선택 변경 이벤트
    readerSelect.addEventListener('change', function() {
        updateColorIndicator(this);
    });

    // 삭제 버튼 이벤트
    const removeBtn = entryDiv.querySelector('.btn-remove-schedule');
    if (removeBtn) {
        removeBtn.addEventListener('click', function() {
            removeScheduleEntry(entryDiv);
        });
    }

    // Flatpickr 초기화
    initEntryDatePickers(entryDiv);

    // 첫 번째 항목의 삭제 버튼 표시 업데이트
    updateRemoveButtonVisibility();
}

/* ========================================
   일정 항목 삭제
======================================== */
function removeScheduleEntry(entryDiv) {
    const container = document.getElementById('scheduleEntriesContainer');
    if (!container || container.children.length <= 1) return;

    // Flatpickr 인스턴스 제거
    const startInput = entryDiv.querySelector('.schedule-start-date');
    const endInput = entryDiv.querySelector('.schedule-end-date');

    if (startInput && startInput._flatpickr) {
        startInput._flatpickr.destroy();
    }
    if (endInput && endInput._flatpickr) {
        endInput._flatpickr.destroy();
    }

    entryDiv.remove();

    // 라벨 번호 업데이트
    updateEntryLabels();

    // 삭제 버튼 표시 업데이트
    updateRemoveButtonVisibility();
}

/* ========================================
   라벨 번호 업데이트
======================================== */
function updateEntryLabels() {
    const container = document.getElementById('scheduleEntriesContainer');
    if (!container) return;

    const entries = container.querySelectorAll('.schedule-entry');
    entries.forEach((entry, index) => {
        const label = entry.querySelector('.schedule-entry-label');
        if (label) {
            label.textContent = `독자 ${index + 1}`;
        }
    });
}

/* ========================================
   삭제 버튼 표시 업데이트
======================================== */
function updateRemoveButtonVisibility() {
    const container = document.getElementById('scheduleEntriesContainer');
    if (!container) return;

    const entries = container.querySelectorAll('.schedule-entry');
    entries.forEach((entry, index) => {
        const removeBtn = entry.querySelector('.btn-remove-schedule');
        if (removeBtn) {
            removeBtn.style.display = entries.length > 1 ? 'flex' : 'none';
        }
    });
}

/* ========================================
   독자 선택 드롭다운 채우기
======================================== */
function populateReaderSelect(selectElement) {
    if (!selectElement) return;

    // 기존 옵션 초기화 (첫 번째 "선택 안 함" 제외)
    while (selectElement.options.length > 1) {
        selectElement.remove(1);
    }

    // 본인 추가
    if (currentUserInfo) {
        const option = document.createElement('option');
        option.value = `user_${currentUserInfo.userId}`;
        option.textContent = `${currentUserInfo.username || currentUserInfo.nickname} (본인)`;
        option.dataset.type = 'user';
        option.dataset.userId = currentUserInfo.userId;
        option.dataset.color = currentUserInfo.color || '#20B2AA';
        selectElement.appendChild(option);
    }

    // 자녀 추가
    if (childrenData && childrenData.length > 0) {
        childrenData.forEach(child => {
            const childId = child.childId || child.id;
            const childName = child.childName || child.name || '자녀';
            const birthOrder = child.birthOrder;

            // 표시 텍스트 생성
            let displayText = childName;
            if (birthOrder) {
                const orderText = getKoreanOrdinal(birthOrder);
                displayText = `${childName} (자녀, ${orderText})`;
            } else {
                displayText = `${childName} (자녀)`;
            }

            const option = document.createElement('option');
            option.value = `child_${childId}`;
            option.textContent = displayText;
            option.dataset.type = 'child';
            option.dataset.userId = childId;
            option.dataset.color = child.color || '#FF6B6B';
            selectElement.appendChild(option);
        });
    }
}

/* ========================================
   독자 색상 아이콘 업데이트
======================================== */
function updateColorIndicator(selectElement) {
    const wrapper = selectElement.closest('.reader-select-wrapper');
    const colorIndicator = wrapper?.querySelector('.schedule-color-indicator');

    if (!colorIndicator) return;

    const selectedOption = selectElement.options[selectElement.selectedIndex];

    if (selectedOption && selectedOption.dataset.color && selectedOption.value) {
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
function initEntryDatePickers(entryDiv) {
    const startDateInput = entryDiv.querySelector('.schedule-start-date');
    const endDateInput = entryDiv.querySelector('.schedule-end-date');

    if (startDateInput) {
        const startPicker = flatpickr(startDateInput, {
            locale: 'ko',
            dateFormat: 'Y-m-d',
            allowInput: false,
            onChange: function(selectedDates, dateStr) {
                if (endDateInput && endDateInput._flatpickr && dateStr) {
                    endDateInput._flatpickr.set('minDate', dateStr);
                }
            }
        });
        flatpickrInstances.push(startPicker);
    }

    if (endDateInput) {
        const endPicker = flatpickr(endDateInput, {
            locale: 'ko',
            dateFormat: 'Y-m-d',
            allowInput: false
        });
        flatpickrInstances.push(endPicker);
    }
}

/* ========================================
   기존 독서 일정 불러오기
======================================== */
async function loadExistingSchedule(bookId) {
    // 일정 초기화는 initScheduleEntries에서 처리됨
}

/* ========================================
   모든 일정 데이터 수집 (Book API 형식)
======================================== */
function collectAllScheduleData() {
    const container = document.getElementById('scheduleEntriesContainer');
    if (!container) return [];

    const schedules = [];
    const entries = container.querySelectorAll('.schedule-entry');

    entries.forEach(entry => {
        const readerSelect = entry.querySelector('.schedule-reader-select');
        const startDateInput = entry.querySelector('.schedule-start-date');
        const endDateInput = entry.querySelector('.schedule-end-date');

        // 독자와 시작일이 모두 선택되어야 유효
        if (!readerSelect?.value || !startDateInput?.value) {
            return;
        }

        const selectedOption = readerSelect.options[readerSelect.selectedIndex];
        const readerType = selectedOption.dataset.type;

        let childId = null;
        if (readerType === 'child') {
            childId = parseInt(selectedOption.dataset.userId);
        }

        const scheduleData = {
            childId: childId,
            startDate: startDateInput.value
        };

        if (endDateInput?.value) {
            scheduleData.endDate = endDateInput.value;
        }

        schedules.push(scheduleData);
    });

    return schedules;
}

/* ========================================
   독서 일정을 Book API의 bookDetailsUpdate 배열로 반환
======================================== */
function getBookDetailsUpdate() {
    return collectAllScheduleData();
}

/* ========================================
   하위 호환성을 위한 기존 함수들
======================================== */
function collectScheduleData() {
    const schedules = collectAllScheduleData();
    return schedules.length > 0 ? schedules[0] : null;
}

function populateEditReaderSelect() {
    initScheduleEntries();
}

function initEditDatePickers() {
    // 새 구조에서는 각 entry별로 initEntryDatePickers에서 처리
}

function updateReaderColorIndicator() {
    // 새 구조에서는 updateColorIndicator에서 처리
}
