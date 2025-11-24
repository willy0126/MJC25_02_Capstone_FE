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

// ==================== Mock 모드 설정 ====================
// 백엔드 API가 구현될 때까지 Mock 데이터로 테스트
let USE_MOCK_DATA = true; // false로 변경하면 실제 API 사용
let mockScheduleIdCounter = 100;

// Mock 독서 일정 데이터
let mockCalendarData = [
    {
        scheduleId: 1,
        bookId: 1,
        title: '클린 코드',
        author: '로버트 C. 마틴',
        coverUrl: 'https://image.aladin.co.kr/product/56/9/cover500/8966260950_1.jpg',
        status: 'completed',
        date: getTodayOffset(-5),
        startDate: getTodayOffset(-10),
        endDate: getTodayOffset(-5)
    },
    {
        scheduleId: 2,
        bookId: 2,
        title: '모던 자바스크립트',
        author: '니콜라스 자카스',
        coverUrl: 'https://image.aladin.co.kr/product/30574/6/cover500/k582835618_1.jpg',
        status: 'reading',
        date: getTodayOffset(0),
        startDate: getTodayOffset(-3),
        endDate: null
    },
    {
        scheduleId: 3,
        bookId: 3,
        title: '리팩터링',
        author: '마틴 파울러',
        coverUrl: 'https://image.aladin.co.kr/product/21169/6/cover500/k342630735_1.jpg',
        status: 'to_read',
        date: getTodayOffset(3),
        startDate: getTodayOffset(3),
        endDate: null
    },
    {
        scheduleId: 4,
        bookId: 4,
        title: '이펙티브 자바',
        author: '조슈아 블로크',
        coverUrl: 'https://image.aladin.co.kr/product/26962/2/cover500/k412637564_1.jpg',
        status: 'reading',
        date: getTodayOffset(-2),
        startDate: getTodayOffset(-7),
        endDate: null
    }
];

// Mock 책장 데이터 (드래그용)
const mockWishlistBooks = [
    {
        bookId: 101,
        title: '객체지향의 사실과 오해',
        author: '조영호',
        coverUrl: 'https://image.aladin.co.kr/product/5765/53/cover500/8998139766_1.jpg'
    },
    {
        bookId: 102,
        title: '자바의 정석',
        author: '남궁성',
        coverUrl: 'https://image.aladin.co.kr/product/29904/57/cover500/8994492046_2.jpg'
    },
    {
        bookId: 103,
        title: '스프링 부트와 AWS',
        author: '이동욱',
        coverUrl: 'https://image.aladin.co.kr/product/22109/98/cover500/k892532741_1.jpg'
    },
    {
        bookId: 104,
        title: 'HTTP 완벽 가이드',
        author: '데이빗 고울리',
        coverUrl: 'https://image.aladin.co.kr/product/5460/61/cover500/8966261264_1.jpg'
    }
];

// 오늘 날짜 기준 오프셋 계산
function getTodayOffset(days) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
}

// ==================== 초기화 ====================

document.addEventListener('DOMContentLoaded', () => {
    initializeFullCalendar();
    initializeDraggable();
    loadWishlistBooks();
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

// 내 책장의 책 목록 로드
async function loadWishlistBooks() {
    const contentEl = document.getElementById('wishlistContent');
    if (!contentEl) return;

    // 로딩 표시
    contentEl.innerHTML = `
        <div class="wishlist-loading">
            <div class="loading-spinner"></div>
        </div>
    `;

    // Mock 모드인 경우
    if (USE_MOCK_DATA) {
        // 약간의 딜레이로 로딩 효과
        await new Promise(resolve => setTimeout(resolve, 300));
        wishlistBooks = [...mockWishlistBooks];
        renderWishlistBooks();
        console.log('[Mock Mode] 책장 데이터 로드됨:', wishlistBooks.length, '권');
        return;
    }

    try {
        const response = await apiClient.getBooks();

        if (response.success && response.data) {
            wishlistBooks = response.data;
            renderWishlistBooks();
        } else {
            throw new Error('책 목록 로드 실패');
        }
    } catch (error) {
        console.error('책장 데이터 로드 실패:', error);

        // API 실패 시 Mock 데이터로 폴백
        console.log('[Fallback] Mock 책장 데이터 사용');
        wishlistBooks = [...mockWishlistBooks];
        renderWishlistBooks();
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

    // Mock 모드인 경우
    if (USE_MOCK_DATA) {
        const mockData = getMockMonthlyData(year, month);
        processCalendarData(mockData);
        successCallback(allEvents);
        updateMonthlySummary(mockData);
        console.log('[Mock Mode] 캘린더 데이터 로드됨:', mockData.length, '개');
        return;
    }

    try {
        const response = await apiClient.getMonthlyCalendar(year, month);

        if (response.success && response.data) {
            processCalendarData(response.data);
            successCallback(allEvents);
            updateMonthlySummary(response.data);
        } else {
            throw new Error('데이터 로드 실패');
        }
    } catch (error) {
        console.error('월간 캘린더 데이터 로드 실패:', error);

        // API 실패 시 Mock 데이터로 폴백
        console.log('[Fallback] Mock 데이터 사용');
        const mockData = getMockMonthlyData(year, month);
        processCalendarData(mockData);
        successCallback(allEvents);
        updateMonthlySummary(mockData);
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

// Mock 월간 데이터 조회
function getMockMonthlyData(year, month) {
    const monthStr = `${year}-${String(month).padStart(2, '0')}`;

    // 기본 Mock 데이터를 현재 조회 월에 맞게 동적 생성
    const baseMockData = [
        {
            scheduleId: 1,
            bookId: 1,
            title: '클린 코드',
            author: '로버트 C. 마틴',
            coverUrl: 'https://image.aladin.co.kr/product/56/9/cover500/8966260950_1.jpg',
            status: 'completed',
            date: `${monthStr}-05`,
            startDate: `${monthStr}-01`,
            endDate: `${monthStr}-05`
        },
        {
            scheduleId: 2,
            bookId: 2,
            title: '모던 자바스크립트',
            author: '니콜라스 자카스',
            coverUrl: 'https://image.aladin.co.kr/product/30574/6/cover500/k582835618_1.jpg',
            status: 'reading',
            date: `${monthStr}-15`,
            startDate: `${monthStr}-10`,
            endDate: null
        },
        {
            scheduleId: 3,
            bookId: 3,
            title: '리팩터링',
            author: '마틴 파울러',
            coverUrl: 'https://image.aladin.co.kr/product/21169/6/cover500/k342630735_1.jpg',
            status: 'to_read',
            date: `${monthStr}-20`,
            startDate: `${monthStr}-20`,
            endDate: null
        }
    ];

    // 사용자가 추가한 일정 필터링
    const userAdded = mockCalendarData
        .filter(r => r.scheduleId > 100)  // 사용자 추가 일정만
        .filter(r => r.date && r.date.startsWith(monthStr));

    const result = [...baseMockData, ...userAdded];
    console.log('[Mock Debug] 조회:', monthStr, '기본:', baseMockData.length, '추가:', userAdded.length);
    return result;
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

    // Mock 모드 또는 로컬 데이터 사용
    if (USE_MOCK_DATA) {
        await new Promise(resolve => setTimeout(resolve, 200));
        const localRecords = monthlyRecords[dateStr] || [];
        renderDailyRecords(localRecords);
        return;
    }

    try {
        const response = await apiClient.getDailyRecords(dateStr);

        if (response.success && response.data) {
            renderDailyRecords(response.data.records || []);
        }
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
    document.getElementById('scheduleStartDate').value = dropDate;
    document.getElementById('scheduleStatus').value = 'reading'; // 기본값

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
    const status = document.getElementById('scheduleStatus').value;

    if (!startDate) {
        showToast('시작일을 선택해주세요.', 'error');
        return;
    }

    const confirmBtn = document.getElementById('scheduleConfirm');
    confirmBtn.disabled = true;
    confirmBtn.textContent = '등록 중...';

    // Mock 모드인 경우
    if (USE_MOCK_DATA) {
        await new Promise(resolve => setTimeout(resolve, 500)); // 로딩 효과

        // Mock 데이터에 새 일정 추가
        const newSchedule = {
            scheduleId: ++mockScheduleIdCounter,
            bookId: pendingSchedule.bookId,
            title: pendingSchedule.title,
            author: pendingSchedule.author,
            coverUrl: pendingSchedule.coverUrl,
            status: status,
            date: startDate,
            startDate: startDate,
            endDate: status === 'completed' ? startDate : null
        };

        mockCalendarData.push(newSchedule);
        console.log('[Mock Mode] 새 일정 추가됨:', newSchedule);
        console.log('[Mock Mode] 새 일정 date 값:', startDate, '타입:', typeof startDate);
        console.log('[Mock Mode] 현재 mockCalendarData 길이:', mockCalendarData.length);

        showToast('독서 일정이 등록되었습니다!', 'success');
        closeScheduleModal();

        // 캘린더 새로고침
        console.log('[Mock Mode] refetchEvents 호출');
        calendar.refetchEvents();

        // 해당 날짜 선택
        selectDate(startDate);
        highlightSelectedDate(startDate);

        confirmBtn.disabled = false;
        confirmBtn.textContent = '등록';
        return;
    }

    try {
        const scheduleData = {
            bookId: pendingSchedule.bookId,
            startDate: startDate,
            status: status
        };

        const response = await apiClient.createReadingSchedule(scheduleData);

        if (response.success) {
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

    // Mock 모드인 경우
    if (USE_MOCK_DATA) {
        await new Promise(resolve => setTimeout(resolve, 500));

        // Mock 데이터에서 해당 기록 찾아서 수정
        const scheduleIndex = mockCalendarData.findIndex(r => r.scheduleId === currentViewingRecord.scheduleId);
        if (scheduleIndex !== -1) {
            mockCalendarData[scheduleIndex] = {
                ...mockCalendarData[scheduleIndex],
                status: newStatus,
                startDate: newStartDate,
                endDate: newEndDate || null,
                date: newStartDate // 표시 날짜도 시작일로 업데이트
            };
            console.log('[Mock Mode] 일정 수정됨:', mockCalendarData[scheduleIndex]);
        }

        showToast('독서 일정이 수정되었습니다!', 'success');
        closeRecordDetailModal();

        // 캘린더 새로고침
        calendar.refetchEvents();

        // 해당 날짜 선택
        selectDate(newStartDate);
        highlightSelectedDate(newStartDate);

        saveBtn.disabled = false;
        saveBtn.textContent = '저장';
        return;
    }

    try {
        const scheduleData = {
            status: newStatus,
            startDate: newStartDate,
            endDate: newEndDate || null
        };

        const response = await apiClient.updateReadingSchedule(currentViewingRecord.scheduleId, scheduleData);

        if (response.success) {
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

    // Mock 모드인 경우
    if (USE_MOCK_DATA) {
        await new Promise(resolve => setTimeout(resolve, 500));

        // Mock 데이터에서 해당 기록 삭제
        const scheduleIndex = mockCalendarData.findIndex(r => r.scheduleId === currentViewingRecord.scheduleId);
        if (scheduleIndex !== -1) {
            mockCalendarData.splice(scheduleIndex, 1);
            console.log('[Mock Mode] 일정 삭제됨, scheduleId:', currentViewingRecord.scheduleId);
        }

        showToast('독서 일정이 삭제되었습니다.', 'success');
        closeRecordDetailModal();

        // 캘린더 새로고침
        calendar.refetchEvents();

        // 해당 날짜 다시 로드
        if (selectedDate) {
            loadDailyRecords(selectedDate);
        }

        deleteBtn.disabled = false;
        deleteBtn.textContent = '삭제';
        return;
    }

    try {
        const response = await apiClient.deleteReadingSchedule(currentViewingRecord.scheduleId);

        if (response.success) {
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
