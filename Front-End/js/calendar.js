// ==================== Calendar Page JavaScript (FullCalendar + Drag & Drop) ====================

// 전역 변수
let calendar = null;
let selectedDate = null;
let monthlyRecords = {}; // { 'YYYY-MM-DD': [records] }
let allEvents = []; // FullCalendar 이벤트 배열
let wishlistBooks = []; // 내 책장의 책 목록
let draggableInstance = null; // Draggable 인스턴스
let pendingSchedule = null; // 등록 대기 중인 스케줄 정보
let currentViewingRecord = null; // 현재 보고 있는 기록 (수정/삭제용)

// 독자 데이터 (본인 + 자녀)
let currentUserInfo = null;
let childrenData = [];
let selectedReaderColor = '#20B2AA'; // 선택된 독자의 색상

// Flatpickr 인스턴스
let scheduleStartPicker = null;
let scheduleEndPicker = null;

// ==================== 초기화 ====================

document.addEventListener('DOMContentLoaded', () => {
    initializeFullCalendar();
    initializeDraggable();
    loadWishlistBooks();
    loadReadersData(); // 독자 데이터 로드
    setupEventListeners();
});

// FullCalendar 초기화
function initializeFullCalendar() {
    const calendarEl = document.getElementById('fullCalendar');

    calendar = new FullCalendar.Calendar(calendarEl, {
        // 기본 설정
        initialView: 'dayGridMonth',
        locale: 'ko',
        height: 'auto',

        // 헤더 툴바
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: ''
        },

        // 버튼 텍스트
        buttonText: {
            today: '오늘'
        },

        // 날짜 형식
        titleFormat: { year: 'numeric', month: 'long' },
        dayHeaderFormat: { weekday: 'short' },

        // 이벤트 설정
        events: fetchEvents,
        eventDisplay: 'block',
        eventTimeFormat: {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        },

        // 외부 이벤트 드롭 허용
        droppable: true,

        // 외부 이벤트가 드롭되었을 때
        eventReceive: function(info) {
            // 드롭된 이벤트 정보로 모달 열기
            const bookData = info.event.extendedProps;
            // 날짜 형식 정규화 (YYYY-MM-DDTHH:mm:ss -> YYYY-MM-DD)
            const dropDate = info.event.startStr.split('T')[0];

            console.log('[Debug] 드롭 날짜:', dropDate, '원본:', info.event.startStr);

            // 임시로 이벤트 제거 (모달에서 확인 후 다시 추가)
            info.event.remove();

            // 스케줄 등록 모달 열기
            openScheduleModal(bookData, dropDate);
        },

        // 날짜 클릭
        dateClick: function(info) {
            selectDate(info.dateStr);
            highlightSelectedDate(info.dateStr);
        },

        // 이벤트 클릭
        eventClick: function(info) {
            const bookId = info.event.extendedProps.bookId;
            const dateStr = info.event.startStr.split('T')[0];
            selectDate(dateStr);
            highlightSelectedDate(dateStr);

            // 약간의 딜레이 후 상세 모달 열기
            setTimeout(() => {
                openRecordDetail(bookId);
            }, 100);
        },

        // 이벤트 렌더링 커스터마이징
        eventDidMount: function(info) {
            // 툴팁 추가
            info.el.title = `${info.event.title} - ${getStatusText(info.event.extendedProps.status)}`;
        },

        // 월 변경 시
        datesSet: function(info) {
            const start = info.start;
            updateMonthlySummaryFromEvents(start.getFullYear(), start.getMonth() + 1);
        },

        // 첫 주 기준
        firstDay: 0, // 일요일 시작

        // 주말 표시
        weekends: true,

        // 선택 가능
        selectable: true,
        selectMirror: true,

        // 기존 이벤트 드래그 비활성화 (읽기 전용)
        editable: false,

        // 최대 이벤트 표시 (더보기)
        dayMaxEvents: 3,
        moreLinkText: '더보기',
        moreLinkClick: function(info) {
            selectDate(info.date.toISOString().split('T')[0]);
            return 'popover'; // 팝오버로 표시
        }
    });

    calendar.render();
}

// Draggable 초기화 (외부 이벤트)
function initializeDraggable() {
    const containerEl = document.getElementById('wishlistContent');

    if (!containerEl) return;

    // FullCalendar의 Draggable 클래스 사용
    draggableInstance = new FullCalendar.Draggable(containerEl, {
        itemSelector: '.draggable-book',
        eventData: function(eventEl) {
            // 드래그된 요소의 데이터 추출
            const bookId = eventEl.dataset.bookId;
            const book = wishlistBooks.find(b => b.bookId == bookId);

            if (!book) return null;

            return {
                title: book.title,
                backgroundColor: '#20B2AA',
                borderColor: '#20B2AA',
                extendedProps: {
                    bookId: book.bookId,
                    title: book.title,
                    author: book.author,
                    coverUrl: book.coverUrl
                }
            };
        }
    });
}

// 이벤트 리스너 설정
function setupEventListeners() {
    // 모달 닫기 - 기록 상세
    document.getElementById('recordDetailModalClose')?.addEventListener('click', closeRecordDetailModal);
    document.getElementById('recordDetailModal')?.addEventListener('click', (e) => {
        if (e.target.id === 'recordDetailModal') {
            closeRecordDetailModal();
        }
    });

    // 모달 닫기 - 일정 등록
    document.getElementById('scheduleModalClose')?.addEventListener('click', closeScheduleModal);
    document.getElementById('scheduleCancel')?.addEventListener('click', closeScheduleModal);
    document.getElementById('scheduleModal')?.addEventListener('click', (e) => {
        if (e.target.id === 'scheduleModal') {
            closeScheduleModal();
        }
    });

    // 일정 등록 확인
    document.getElementById('scheduleConfirm')?.addEventListener('click', confirmSchedule);

    // 새로고침 버튼
    document.getElementById('refreshBooks')?.addEventListener('click', loadWishlistBooks);

    // 기록 상세 모달 - 수정/삭제 버튼
    const editBtn = document.getElementById('recordEditBtn');
    const deleteBtn = document.getElementById('recordDeleteBtn');
    const cancelBtn = document.getElementById('editCancelBtn');
    const saveBtn = document.getElementById('editSaveBtn');

    console.log('[DEBUG] recordEditBtn:', editBtn);
    console.log('[DEBUG] recordDeleteBtn:', deleteBtn);
    console.log('[DEBUG] editCancelBtn:', cancelBtn);
    console.log('[DEBUG] editSaveBtn:', saveBtn);

    if (editBtn) {
        editBtn.addEventListener('click', () => {
            console.log('[DEBUG] 수정 버튼 클릭됨');
            switchToEditMode();
        });
    }
    if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
            console.log('[DEBUG] 삭제 버튼 클릭됨');
            deleteSchedule();
        });
    }
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            console.log('[DEBUG] 취소 버튼 클릭됨');
            switchToViewMode();
        });
    }
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            console.log('[DEBUG] 저장 버튼 클릭됨');
            saveScheduleEdit();
        });
    }

    // 시작일 변경 시 완료일 min 속성 업데이트
    document.getElementById('editRecordStartDate')?.addEventListener('change', updateEndDateMin);
}

// ==================== 책장 데이터 로드 ====================

// 내 책장의 책 목록 로드 (항상 실제 API 사용)
async function loadWishlistBooks() {
    const contentEl = document.getElementById('wishlistContent');
    if (!contentEl) return;

    // 로딩 표시
    contentEl.innerHTML = `
        <div class="wishlist-loading">
            <div class="loading-spinner"></div>
        </div>
    `;

    try {
        // 실제 API에서 책장 데이터 로드
        const response = await apiClient.getBooks();
        console.log('[API] 책장 데이터 응답:', response);

        // 응답 형식에 따라 처리
        if (Array.isArray(response)) {
            // 배열로 직접 반환되는 경우
            wishlistBooks = response;
        } else if (response.success && response.data) {
            // { success: true, data: [...] } 형식
            wishlistBooks = response.data;
        } else if (response.data) {
            // { data: [...] } 형식
            wishlistBooks = response.data;
        } else {
            throw new Error('책 목록 응답 형식 오류');
        }

        console.log('[API] 책장 데이터 로드됨:', wishlistBooks.length, '권');
        renderWishlistBooks();

    } catch (error) {
        console.error('책장 데이터 로드 실패:', error);

        // API 실패 시 빈 목록 또는 에러 메시지 표시
        contentEl.innerHTML = `
            <div class="wishlist-empty">
                <p>책장 데이터를 불러올 수 없습니다.</p>
                <p style="font-size: 12px; color: #888;">책장 페이지에서 책을 추가해주세요.</p>
                <button class="btn-retry" onclick="loadWishlistBooks()">다시 시도</button>
            </div>
        `;
    }
}

// 책장 목록 렌더링
function renderWishlistBooks() {
    const contentEl = document.getElementById('wishlistContent');
    if (!contentEl) return;

    if (!wishlistBooks || wishlistBooks.length === 0) {
        contentEl.innerHTML = `
            <div class="wishlist-empty">
                <p>책장에 책이 없습니다.</p>
                <p>책을 추가하여 독서 일정을 등록해보세요!</p>
            </div>
        `;
        return;
    }

    // 드래그 힌트 + 책 목록 렌더링
    contentEl.innerHTML = `
        <div class="drag-hint">
            <span>📌 책을 드래그하여 캘린더에 놓으세요</span>
        </div>
        ${wishlistBooks.map(book => `
            <div class="draggable-book"
                 data-book-id="${book.bookId}"
                 data-title="${escapeHtml(book.title)}"
                 data-author="${escapeHtml(book.author || '')}"
                 data-cover-url="${book.coverUrl || ''}">
                <div class="draggable-book-cover">
                    ${book.coverUrl
                        ? `<img src="${book.coverUrl}" alt="${escapeHtml(book.title)}">`
                        : `<div class="cover-placeholder">${book.title.substring(0, 2)}</div>`
                    }
                </div>
                <div class="draggable-book-info">
                    <div class="draggable-book-title">${escapeHtml(book.title)}</div>
                    <div class="draggable-book-author">${escapeHtml(book.author || '작자 미상')}</div>
                </div>
            </div>
        `).join('')}
    `;

    // Draggable 다시 초기화 (새로운 요소들에 적용)
    if (draggableInstance) {
        draggableInstance.destroy();
    }
    initializeDraggable();
}

// HTML 이스케이프 함수
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ==================== 데이터 로드 ====================

// FullCalendar 이벤트 소스 함수
async function fetchEvents(info, successCallback, failureCallback) {
    // 현재 보이는 달의 중간 날짜로 정확한 월 계산
    const viewStart = info.start;
    const viewEnd = info.end;
    const midDate = new Date((viewStart.getTime() + viewEnd.getTime()) / 2);
    const year = midDate.getFullYear();
    const month = midDate.getMonth() + 1;

    try {
        const response = await apiClient.getMonthlyCalendar(year, month);
        console.log('[API] 월간 캘린더 데이터 응답:', response);

        // 응답 형식에 따라 처리
        let calendarData = [];
        if (Array.isArray(response)) {
            calendarData = response;
        } else if (response.success && response.data) {
            calendarData = response.data;
        } else if (response.data) {
            calendarData = response.data;
        }

        processCalendarData(calendarData);
        successCallback(allEvents);
        updateMonthlySummary(calendarData);
        console.log('[API] 월간 캘린더 데이터 로드됨:', calendarData.length, '개');
    } catch (error) {
        console.error('월간 캘린더 데이터 로드 실패:', error);
        // 실패 시 빈 데이터로 처리
        processCalendarData([]);
        successCallback([]);
        updateMonthlySummary([]);
    }
}

// 캘린더 데이터 처리 (공통)
function processCalendarData(records) {
    monthlyRecords = {};
    const events = [];

    records.forEach(record => {
        const date = record.date;
        if (!monthlyRecords[date]) {
            monthlyRecords[date] = [];
        }
        monthlyRecords[date].push(record);
        events.push(convertToEvent(record));
    });

    allEvents = events;
}

// 레코드를 FullCalendar 이벤트로 변환
function convertToEvent(record) {
    const statusColors = {
        'completed': '#27ae60',  // 초록색 - 완료
        'reading': '#f39c12',    // 주황색 - 읽는 중
        'to_read': '#95a5a6'     // 회색 - 읽을 예정
    };

    return {
        id: `${record.bookId}-${record.date}`,
        title: record.title,
        start: record.date,
        end: record.endDate || record.date,
        backgroundColor: statusColors[record.status] || '#20B2AA',
        borderColor: statusColors[record.status] || '#20B2AA',
        textColor: '#ffffff',
        extendedProps: {
            bookId: record.bookId,
            author: record.author,
            status: record.status,
            coverUrl: record.coverUrl,
            startDate: record.startDate,
            endDate: record.endDate
        }
    };
}

// ==================== 날짜 선택 ====================

// 날짜 선택
function selectDate(dateStr) {
    selectedDate = dateStr;
    loadDailyRecords(dateStr);
}

// 선택된 날짜 하이라이트
function highlightSelectedDate(dateStr) {
    // 이전 선택 제거
    document.querySelectorAll('.fc-day.selected-date').forEach(el => {
        el.classList.remove('selected-date');
    });

    // 새로운 선택 추가
    const dayCell = document.querySelector(`.fc-day[data-date="${dateStr}"]`);
    if (dayCell) {
        dayCell.classList.add('selected-date');
    }
}

// 일간 독서 기록 로드
async function loadDailyRecords(dateStr) {
    const selectedDateEl = document.getElementById('selectedDate');
    const recordsContent = document.getElementById('recordsContent');

    // 헤더 업데이트
    const date = new Date(dateStr);
    const formattedDate = `${date.getMonth() + 1}월 ${date.getDate()}일 (${getDayName(date.getDay())})`;
    selectedDateEl.textContent = formattedDate;

    // 로딩 표시
    recordsContent.innerHTML = '<div class="loading-spinner"></div>';

    try {
        const response = await apiClient.getDailyRecords(dateStr);
        console.log('[API] 일간 기록 응답:', response);

        // 응답 형식에 따라 처리
        let records = [];
        if (Array.isArray(response)) {
            records = response;
        } else if (response.success && response.data) {
            records = response.data.records || response.data || [];
        } else if (response.data) {
            records = response.data.records || response.data || [];
        }

        renderDailyRecords(records);
    } catch (error) {
        console.error('일간 기록 로드 실패:', error);
        // 로컬 데이터 사용 (폴백)
        const localRecords = monthlyRecords[dateStr] || [];
        renderDailyRecords(localRecords);
    }
}

// 일간 기록 렌더링
function renderDailyRecords(records) {
    const recordsContent = document.getElementById('recordsContent');

    if (!records || records.length === 0) {
        recordsContent.innerHTML = `
            <div class="empty-records">
                <p>이 날의 독서 기록이 없습니다.</p>
            </div>
        `;
        return;
    }

    recordsContent.innerHTML = records.map(record => `
        <div class="record-item" data-book-id="${record.bookId}" onclick="openRecordDetail(${record.bookId})">
            <div class="record-item-cover">
                ${record.coverUrl
                    ? `<img src="${record.coverUrl}" alt="${record.title}">`
                    : `<div class="cover-placeholder">${record.title.substring(0, 4)}</div>`
                }
            </div>
            <div class="record-item-info">
                <div class="record-item-title">${record.title}</div>
                <div class="record-item-author">${record.author || '작자 미상'}</div>
                <span class="record-item-status ${record.status}">${getStatusText(record.status)}</span>
            </div>
        </div>
    `).join('');
}

// ==================== 통계 ====================

// 월간 요약 업데이트
function updateMonthlySummary(records) {
    if (!records || records.length === 0) {
        document.getElementById('totalBooks').textContent = '0';
        document.getElementById('readingBooks').textContent = '0';
        document.getElementById('readingDays').textContent = '0';
        return;
    }

    // 고유한 책 ID로 중복 제거
    const uniqueBooks = new Map();
    records.forEach(record => {
        if (!uniqueBooks.has(record.bookId)) {
            uniqueBooks.set(record.bookId, record);
        }
    });

    const completedBooks = [...uniqueBooks.values()].filter(r => r.status === 'completed').length;
    const readingBooks = [...uniqueBooks.values()].filter(r => r.status === 'reading').length;
    const readingDays = Object.keys(monthlyRecords).length;

    document.getElementById('totalBooks').textContent = completedBooks;
    document.getElementById('readingBooks').textContent = readingBooks;
    document.getElementById('readingDays').textContent = readingDays;
}

// 이벤트 기반 월간 요약 업데이트
function updateMonthlySummaryFromEvents(year, month) {
    const monthStr = `${year}-${String(month).padStart(2, '0')}`;
    const monthEvents = allEvents.filter(e => e.start && e.start.startsWith(monthStr));

    const uniqueBooks = new Map();
    monthEvents.forEach(event => {
        const bookId = event.extendedProps?.bookId;
        if (bookId && !uniqueBooks.has(bookId)) {
            uniqueBooks.set(bookId, event.extendedProps);
        }
    });

    const completedBooks = [...uniqueBooks.values()].filter(r => r.status === 'completed').length;
    const readingBooks = [...uniqueBooks.values()].filter(r => r.status === 'reading').length;

    // 독서일 계산
    const datesWithEvents = new Set(monthEvents.map(e => e.start));

    document.getElementById('totalBooks').textContent = completedBooks;
    document.getElementById('readingBooks').textContent = readingBooks;
    document.getElementById('readingDays').textContent = datesWithEvents.size;
}

// ==================== 일정 등록 모달 ====================

// 일정 등록 모달 열기
function openScheduleModal(bookData, dropDate) {
    pendingSchedule = {
        bookId: bookData.bookId,
        title: bookData.title,
        author: bookData.author,
        coverUrl: bookData.coverUrl,
        date: dropDate
    };

    // 모달 내용 업데이트
    const coverEl = document.getElementById('scheduleBookCover');
    if (bookData.coverUrl) {
        coverEl.innerHTML = `<img src="${bookData.coverUrl}" alt="${bookData.title}">`;
    } else {
        coverEl.innerHTML = `<div class="cover-placeholder">${bookData.title.substring(0, 2)}</div>`;
    }

    document.getElementById('scheduleBookTitle').textContent = bookData.title;
    document.getElementById('scheduleBookAuthor').textContent = bookData.author || '작자 미상';

    // 독자 선택 드롭다운 초기화
    initReaderDropdown();

    // 독자 선택 초기화 (본인 선택)
    const hiddenInput = document.getElementById('scheduleReader');
    const valueDisplay = document.querySelector('#scheduleReaderSelect .custom-select-value');
    if (hiddenInput) hiddenInput.value = '';
    if (valueDisplay) valueDisplay.innerHTML = '독자 선택';
    selectedReaderColor = '#20B2AA';

    // Flatpickr 초기화
    initScheduleDatePickers(dropDate);

    // 모달 표시
    document.getElementById('scheduleModal').style.display = 'flex';
}

// 일정 등록 모달 닫기
function closeScheduleModal() {
    document.getElementById('scheduleModal').style.display = 'none';
    pendingSchedule = null;
}

// 일정 등록 확인
async function confirmSchedule() {
    if (!pendingSchedule) return;

    const startDate = document.getElementById('scheduleStartDate').value;
    const endDate = document.getElementById('scheduleEndDate').value;
    const readerValue = document.getElementById('scheduleReader').value;

    // 유효성 검사
    if (!startDate) {
        showToast('시작일을 선택해주세요.', 'error');
        return;
    }

    if (!endDate) {
        showToast('종료일을 선택해주세요.', 'error');
        return;
    }

    if (!readerValue) {
        showToast('독자를 선택해주세요.', 'error');
        return;
    }

    // childId 설정 (본인이면 null, 자녀면 childId)
    const childId = readerValue === 'user' ? null : parseInt(readerValue);

    const confirmBtn = document.getElementById('scheduleConfirm');
    confirmBtn.disabled = true;
    confirmBtn.textContent = '등록 중...';

    try {
        // 백엔드 API 요청 데이터 (status는 백엔드에서 자동 계산)
        const scheduleData = {
            bookId: pendingSchedule.bookId,
            childId: childId,
            startDate: startDate,
            endDate: endDate
        };

        console.log('[API] 일정 등록 요청 데이터:', scheduleData);

        const response = await apiClient.createReadingSchedule(scheduleData);
        console.log('[API] 일정 등록 응답:', response);

        if (response.success || response.scheduleId || response.data) {
            showToast('독서 일정이 등록되었습니다!', 'success');
            closeScheduleModal();

            // 캘린더 새로고침
            calendar.refetchEvents();

            // 해당 날짜 선택
            selectDate(startDate);
            highlightSelectedDate(startDate);
        } else {
            throw new Error(response.message || '일정 등록에 실패했습니다.');
        }
    } catch (error) {
        console.error('일정 등록 실패:', error);
        showToast(error.message || '일정 등록에 실패했습니다.', 'error');
    } finally {
        confirmBtn.disabled = false;
        confirmBtn.textContent = '등록';
    }
}

// ==================== 기록 상세 모달 ====================

// 기록 상세 모달 열기
function openRecordDetail(bookId) {
    // 현재 선택된 날짜의 기록에서 해당 책 찾기
    const records = monthlyRecords[selectedDate] || [];
    const record = records.find(r => r.bookId === bookId);

    if (!record) {
        showToast('기록을 찾을 수 없습니다.', 'error');
        return;
    }

    // 현재 보고 있는 기록 저장 (수정/삭제용)
    currentViewingRecord = { ...record, viewDate: selectedDate };

    // 모달 내용 업데이트
    const coverEl = document.getElementById('recordCover');
    if (record.coverUrl) {
        coverEl.innerHTML = `<img src="${record.coverUrl}" alt="${record.title}">`;
    } else {
        coverEl.innerHTML = `
            <div class="book-cover-placeholder">
                <h3>${record.title}</h3>
            </div>
        `;
    }

    document.getElementById('recordTitle').textContent = record.title;
    document.getElementById('recordAuthor').textContent = record.author || '작자 미상';

    const statusBadge = document.getElementById('recordStatus');
    statusBadge.textContent = getStatusText(record.status);
    statusBadge.className = `status-badge ${record.status}`;

    document.getElementById('recordStartDate').textContent = record.startDate || '-';
    document.getElementById('recordEndDate').textContent = record.endDate || '-';

    // 항상 보기 모드로 시작
    switchToViewMode();

    // 모달 표시
    document.getElementById('recordDetailModal').style.display = 'flex';
}

// 기록 상세 모달 닫기
function closeRecordDetailModal() {
    document.getElementById('recordDetailModal').style.display = 'none';
    currentViewingRecord = null;
}

// 보기 모드로 전환
function switchToViewMode() {
    document.getElementById('recordViewMode').style.display = 'block';
    document.getElementById('recordEditMode').style.display = 'none';
}

// 수정 모드로 전환
function switchToEditMode() {
    if (!currentViewingRecord) return;

    // 수정 폼에 현재 값 설정
    document.getElementById('editRecordStatus').value = currentViewingRecord.status || 'reading';
    document.getElementById('editRecordStartDate').value = currentViewingRecord.startDate || '';
    document.getElementById('editRecordEndDate').value = currentViewingRecord.endDate || '';

    // 완료일의 min 속성 설정 (시작일 이후만 선택 가능)
    updateEndDateMin();

    // 모드 전환
    document.getElementById('recordViewMode').style.display = 'none';
    document.getElementById('recordEditMode').style.display = 'block';
}

// 완료일 최소값 업데이트
function updateEndDateMin() {
    const startDateInput = document.getElementById('editRecordStartDate');
    const endDateInput = document.getElementById('editRecordEndDate');

    if (startDateInput && endDateInput) {
        endDateInput.min = startDateInput.value || '';

        // 완료일이 시작일보다 이전이면 초기화
        if (endDateInput.value && startDateInput.value > endDateInput.value) {
            endDateInput.value = '';
        }
    }
}

// 수정 저장
async function saveScheduleEdit() {
    if (!currentViewingRecord) return;

    const newStatus = document.getElementById('editRecordStatus').value;
    const newStartDate = document.getElementById('editRecordStartDate').value;
    const newEndDate = document.getElementById('editRecordEndDate').value;

    if (!newStartDate) {
        showToast('시작일을 입력해주세요.', 'error');
        return;
    }

    // 완료일이 시작일보다 이전인지 검사
    if (newEndDate && newStartDate > newEndDate) {
        showToast('완료일은 시작일보다 이전일 수 없습니다.', 'error');
        return;
    }

    const saveBtn = document.getElementById('editSaveBtn');
    saveBtn.disabled = true;
    saveBtn.textContent = '저장 중...';

    try {
        const scheduleData = {
            status: newStatus,
            startDate: newStartDate,
            endDate: newEndDate || null
        };

        const response = await apiClient.updateReadingSchedule(currentViewingRecord.scheduleId, scheduleData);
        console.log('[API] 일정 수정 응답:', response);

        if (response.success || response.data) {
            showToast('독서 일정이 수정되었습니다!', 'success');
            closeRecordDetailModal();

            // 캘린더 새로고침
            calendar.refetchEvents();

            // 해당 날짜 선택
            selectDate(newStartDate);
            highlightSelectedDate(newStartDate);
        } else {
            throw new Error(response.message || '일정 수정에 실패했습니다.');
        }
    } catch (error) {
        console.error('일정 수정 실패:', error);
        showToast(error.message || '일정 수정에 실패했습니다.', 'error');
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = '저장';
    }
}

// 일정 삭제
async function deleteSchedule() {
    if (!currentViewingRecord) return;

    if (!confirm(`"${currentViewingRecord.title}" 일정을 삭제하시겠습니까?`)) {
        return;
    }

    const deleteBtn = document.getElementById('recordDeleteBtn');
    deleteBtn.disabled = true;
    deleteBtn.textContent = '삭제 중...';

    try {
        const response = await apiClient.deleteReadingSchedule(currentViewingRecord.scheduleId);
        console.log('[API] 일정 삭제 응답:', response);

        if (response.success || response.data || response.message === 'success') {
            showToast('독서 일정이 삭제되었습니다.', 'success');
            closeRecordDetailModal();

            // 캘린더 새로고침
            calendar.refetchEvents();

            // 해당 날짜 다시 로드
            if (selectedDate) {
                loadDailyRecords(selectedDate);
            }
        } else {
            throw new Error(response.message || '일정 삭제에 실패했습니다.');
        }
    } catch (error) {
        console.error('일정 삭제 실패:', error);
        showToast(error.message || '일정 삭제에 실패했습니다.', 'error');
    } finally {
        deleteBtn.disabled = false;
        deleteBtn.textContent = '삭제';
    }
}

// ==================== 유틸리티 함수 ====================

// 요일 이름
function getDayName(dayIndex) {
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    return days[dayIndex];
}

// 상태 텍스트
function getStatusText(status) {
    const statusMap = {
        'completed': '완료',
        'reading': '읽는 중',
        'to_read': '읽을 예정'
    };
    return statusMap[status] || status;
}

// ==================== 독자 데이터 로드 ====================

async function loadReadersData() {
    try {
        // 사용자 정보 로드
        const userResponse = await apiClient.getUserInfo();
        if (userResponse.success && userResponse.data) {
            currentUserInfo = userResponse.data;
        } else if (userResponse && !userResponse.success) {
            currentUserInfo = null;
        } else {
            currentUserInfo = userResponse;
        }
    } catch (error) {
        console.error('사용자 정보 로드 실패:', error);
        currentUserInfo = null;
    }

    try {
        // 자녀 목록 로드
        const childrenResponse = await apiClient.getChildren();
        if (childrenResponse.success && childrenResponse.data) {
            childrenData = childrenResponse.data;
        } else if (Array.isArray(childrenResponse)) {
            childrenData = childrenResponse;
        } else {
            childrenData = [];
        }
    } catch (error) {
        console.error('자녀 목록 로드 실패:', error);
        childrenData = [];
    }

    console.log('[독자 데이터] 본인:', currentUserInfo?.nickname || currentUserInfo?.username);
    console.log('[독자 데이터] 자녀:', childrenData.length, '명');
}

// ==================== 독자 선택 드롭다운 ====================

function initReaderDropdown() {
    const optionsContainer = document.getElementById('scheduleReaderOptions');
    const selectEl = document.getElementById('scheduleReaderSelect');

    if (!optionsContainer) return;

    // 옵션 초기화
    optionsContainer.innerHTML = '';

    // 본인 옵션
    if (currentUserInfo) {
        const userName = currentUserInfo.nickname || currentUserInfo.username || currentUserInfo.name || '본인';
        const userColor = currentUserInfo.color || '#20B2AA';
        optionsContainer.innerHTML += `
            <div class="custom-select-option" data-value="user" data-color="${userColor}">
                <span class="option-icon" style="background: ${userColor};"></span>
                <span class="option-text">${userName}</span>
                <span class="option-badge">본인</span>
            </div>
        `;
    }

    // 자녀 옵션
    if (childrenData && childrenData.length > 0) {
        childrenData.forEach(child => {
            const childId = child.childId || child.id;
            const childName = child.childName || child.name || '자녀';
            const childColor = child.color || '#FFB6C1';
            optionsContainer.innerHTML += `
                <div class="custom-select-option" data-value="${childId}" data-color="${childColor}">
                    <span class="option-icon" style="background: ${childColor};"></span>
                    <span class="option-text">${childName}</span>
                </div>
            `;
        });
    }

    // 커스텀 드롭다운 이벤트 초기화
    initCustomDropdownEvents(selectEl);
}

function initCustomDropdownEvents(selectEl) {
    if (!selectEl) return;

    const trigger = selectEl.querySelector('.custom-select-trigger');
    const optionItems = selectEl.querySelectorAll('.custom-select-option');
    const hiddenInput = selectEl.querySelector('input[type="hidden"]');
    const valueDisplay = selectEl.querySelector('.custom-select-value');

    // 트리거 클릭 시 드롭다운 열기/닫기
    trigger.addEventListener('click', function(e) {
        e.stopPropagation();

        // 다른 열린 드롭다운 닫기
        document.querySelectorAll('.custom-select.open').forEach(el => {
            if (el !== selectEl) {
                el.classList.remove('open');
            }
        });

        selectEl.classList.toggle('open');
    });

    // 옵션 선택
    optionItems.forEach(option => {
        option.addEventListener('click', function(e) {
            e.stopPropagation();

            const value = this.getAttribute('data-value');
            const text = this.querySelector('.option-text').textContent;
            const color = this.getAttribute('data-color') || '#20B2AA';

            // hidden input 값 업데이트
            hiddenInput.value = value;

            // 선택된 독자의 색상 저장
            selectedReaderColor = color;

            // 표시 텍스트 업데이트 (색상 아이콘 포함)
            valueDisplay.innerHTML = `
                <span class="selected-icon" style="background: ${color};"></span>
                ${text}
            `;

            // 선택된 상태 표시
            optionItems.forEach(opt => opt.classList.remove('selected'));
            this.classList.add('selected');

            // 드롭다운 닫기
            selectEl.classList.remove('open');
        });
    });
}

// 문서 클릭 시 드롭다운 닫기 (전역)
document.addEventListener('click', function() {
    document.querySelectorAll('.custom-select.open').forEach(el => {
        el.classList.remove('open');
    });
});

// ==================== Flatpickr 초기화 ====================

function initScheduleDatePickers(dropDate) {
    const startInput = document.getElementById('scheduleStartDate');
    const endInput = document.getElementById('scheduleEndDate');

    // 기존 인스턴스 제거
    if (scheduleStartPicker) {
        scheduleStartPicker.destroy();
    }
    if (scheduleEndPicker) {
        scheduleEndPicker.destroy();
    }

    const flatpickrConfig = {
        locale: 'ko',
        dateFormat: 'Y-m-d',
        allowInput: false,
        disableMobile: true
    };

    // 시작일 picker
    if (startInput) {
        scheduleStartPicker = flatpickr(startInput, {
            ...flatpickrConfig,
            defaultDate: dropDate,
            onChange: function(selectedDates, dateStr) {
                // 종료일의 최소값을 시작일로 설정
                if (scheduleEndPicker) {
                    scheduleEndPicker.set('minDate', dateStr);
                    // 종료일이 시작일보다 이전이면 초기화
                    const endDate = scheduleEndPicker.selectedDates[0];
                    if (endDate && endDate < selectedDates[0]) {
                        scheduleEndPicker.clear();
                    }
                }
            }
        });
    }

    // 종료일 picker
    if (endInput) {
        scheduleEndPicker = flatpickr(endInput, {
            ...flatpickrConfig,
            defaultDate: dropDate,
            minDate: dropDate
        });
    }
}
