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
let currentCalendarYear = null; // 현재 캘린더 연도
let currentCalendarMonth = null; // 현재 캘린더 월
let dailyRecordsCache = {}; // 일간 기록 캐시 { 'YYYY-MM-DD': [records] }

// 독자 데이터 (본인 + 자녀)
let currentUserInfo = null;
let childrenData = [];
let selectedReaderColor = '#20B2AA'; // 선택된 독자의 색상

// Flatpickr 인스턴스
let scheduleStartPicker = null;
let scheduleEndPicker = null;

// ==================== readerId 캐시 (localStorage) ====================
const READER_CACHE_KEY = 'readerIdCache';

// readerName -> readerId 매핑 저장
function saveReaderIdToCache(readerName, readerId) {
    if (!readerName || !readerId) return;

    try {
        const cache = JSON.parse(localStorage.getItem(READER_CACHE_KEY) || '{}');
        cache[readerName] = readerId;
        localStorage.setItem(READER_CACHE_KEY, JSON.stringify(cache));
        console.log('[Debug] readerId 캐시 저장:', readerName, '->', readerId);
    } catch (e) {
        console.log('[Debug] readerId 캐시 저장 실패:', e);
    }
}

// readerName으로 캐시된 readerId 조회
function getReaderIdFromCache(readerName) {
    if (!readerName) return null;

    try {
        const cache = JSON.parse(localStorage.getItem(READER_CACHE_KEY) || '{}');
        return cache[readerName] || null;
    } catch (e) {
        console.log('[Debug] readerId 캐시 조회 실패:', e);
        return null;
    }
}

// 기록에서 readerId 캐시 업데이트
function updateReaderCacheFromRecords(records) {
    if (!records || !Array.isArray(records)) return;

    records.forEach(record => {
        const reader = record.reader || record.readerResponse;
        if (reader && reader.readerName && reader.readerId) {
            saveReaderIdToCache(reader.readerName, reader.readerId);
        }
    });
}

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

        // 이벤트 클릭 (날짜 선택 및 상세 기록 로드)
        eventClick: function(info) {
            const dateStr = info.event.startStr.split('T')[0];
            selectDate(dateStr);
            highlightSelectedDate(dateStr);
            // 월간 캘린더에서는 독자별 색상만 표시하므로,
            // 클릭 시 해당 날짜의 상세 기록을 사이드바에서 확인하도록 함
        },

        // 이벤트 렌더링 커스터마이징
        eventDidMount: function(info) {
            // 툴팁 추가 (독자 이름)
            const readerName = info.event.extendedProps?.readerName || info.event.title;
            info.el.title = `${readerName} - 독서 중`;
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

    if (editBtn) {
        editBtn.addEventListener('click', () => {
            switchToEditMode();
        });
    }
    if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
            deleteSchedule();
        });
    }
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            switchToViewMode();
        });
    }
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
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

    // 현재 연/월 저장
    currentCalendarYear = year;
    currentCalendarMonth = month;

    try {
        const response = await apiClient.getMonthlyCalendar(year, month);

        // 응답 형식에 따라 처리
        // 백엔드 응답: [{ day: number, readers: [{ readerId, color, readerName }] }]
        let calendarData = [];
        if (Array.isArray(response)) {
            calendarData = response;
        } else if (response.success && response.data) {
            calendarData = response.data;
        } else if (response.data) {
            calendarData = response.data;
        }

        processCalendarData(calendarData, year, month);
        successCallback(allEvents);
        updateMonthlySummary(calendarData);
    } catch (error) {
        console.error('월간 캘린더 데이터 로드 실패:', error);
        // 실패 시 빈 데이터로 처리
        processCalendarData([], year, month);
        successCallback([]);
        updateMonthlySummary([]);
    }
}

// 캘린더 데이터 처리 (백엔드 응답 형식에 맞춤)
// 백엔드 응답: [{ day: number, readers: [{ readerId, color, readerName }] }]
function processCalendarData(dayDataList, year, month) {
    monthlyRecords = {};
    const events = [];

    dayDataList.forEach(dayData => {
        // day 숫자를 YYYY-MM-DD 형식으로 변환
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(dayData.day).padStart(2, '0')}`;

        if (!monthlyRecords[dateStr]) {
            monthlyRecords[dateStr] = [];
        }

        // 각 독자별로 이벤트 생성 (색상 표시용)
        if (dayData.readers && dayData.readers.length > 0) {
            dayData.readers.forEach((reader, index) => {
                const eventData = {
                    date: dateStr,
                    readerId: reader.readerId,
                    readerName: reader.readerName,
                    color: reader.color || '#20B2AA'
                };
                monthlyRecords[dateStr].push(eventData);
                events.push(convertToEvent(eventData, index));

                // readerId 캐시 업데이트
                if (reader.readerName && reader.readerId) {
                    saveReaderIdToCache(reader.readerName, reader.readerId);
                }
            });
        }
    });

    allEvents = events;
}

// 레코드를 FullCalendar 이벤트로 변환 (독자 색상 기반)
function convertToEvent(record, index = 0) {
    return {
        id: `${record.date}-reader-${record.readerId || index}`,
        title: record.readerName || '독서 중',
        start: record.date,
        backgroundColor: record.color || '#20B2AA',
        borderColor: record.color || '#20B2AA',
        textColor: '#ffffff',
        display: 'block',
        extendedProps: {
            readerId: record.readerId,
            readerName: record.readerName,
            color: record.color
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

        // 백엔드 응답 형식: { date: LocalDate, records: [{ detailsId, reader, book, startDate, endDate }] }
        let records = [];
        if (response.records) {
            records = response.records;
        } else if (response.success && response.data) {
            records = response.data.records || response.data || [];
        } else if (response.data) {
            records = response.data.records || response.data || [];
        } else if (Array.isArray(response)) {
            records = response;
        }

        // 캐시에 저장
        dailyRecordsCache[dateStr] = records;

        // readerId 캐시 업데이트
        updateReaderCacheFromRecords(records);

        renderDailyRecords(records, dateStr);
    } catch (error) {
        console.error('일간 기록 로드 실패:', error);
        // 캐시된 데이터 사용 (폴백)
        const cachedRecords = dailyRecordsCache[dateStr] || [];
        renderDailyRecords(cachedRecords, dateStr);
    }
}

// 일간 기록 렌더링 (백엔드 응답 형식에 맞춤)
// 백엔드 응답: { detailsId, reader: {...}, book: {...}, startDate, endDate }
function renderDailyRecords(records, dateStr) {
    const recordsContent = document.getElementById('recordsContent');

    if (!records || records.length === 0) {
        recordsContent.innerHTML = `
            <div class="empty-records">
                <p>이 날의 독서 기록이 없습니다.</p>
            </div>
        `;
        return;
    }

    recordsContent.innerHTML = records.map(record => {
        // 백엔드 응답 구조에서 데이터 추출
        const book = record.book || {};
        const reader = record.reader || {};
        const bookId = book.bookId || record.bookId;
        const title = book.title || record.title || '제목 없음';
        const author = book.author || record.author || '작자 미상';
        const detailsId = record.detailsId;

        // 이미지 URL 추출 (백엔드 image 객체 구조에 맞춤)
        let coverUrl = '';
        if (book.image) {
            coverUrl = book.image.imageUrl || book.image.url || '';
        } else if (record.coverUrl) {
            coverUrl = record.coverUrl;
        }

        // 독서 상태 계산 (시작일/종료일 기반)
        const today = new Date().toISOString().split('T')[0];
        const startDate = record.startDate || '';
        const endDate = record.endDate || '';
        let status = 'reading';
        if (endDate && endDate < today) {
            status = 'completed';
        } else if (startDate > today) {
            status = 'to_read';
        }

        return `
        <div class="record-item" data-details-id="${detailsId}" data-book-id="${bookId}" onclick="openRecordDetail(${detailsId}, '${dateStr}')">
            <div class="record-item-cover">
                ${coverUrl
                    ? `<img src="${coverUrl}" alt="${escapeHtml(title)}">`
                    : `<div class="cover-placeholder">${title.substring(0, 4)}</div>`
                }
            </div>
            <div class="record-item-info">
                <div class="record-item-title">${escapeHtml(title)}</div>
                <div class="record-item-author">${escapeHtml(author)}</div>
                <div class="record-item-reader" style="color: ${reader.color || '#666'};">
                    <span class="reader-dot" style="background: ${reader.color || '#20B2AA'};"></span>
                    ${escapeHtml(reader.readerName || '본인')}
                </div>
                <span class="record-item-status ${status}">${getStatusText(status)}</span>
            </div>
        </div>
    `;
    }).join('');
}

// ==================== 통계 ====================

// 월간 요약 업데이트 (백엔드 응답 형식에 맞춤)
// 백엔드 응답: [{ day: number, readers: [...] }]
function updateMonthlySummary(dayDataList) {
    if (!dayDataList || dayDataList.length === 0) {
        document.getElementById('totalBooks').textContent = '0';
        document.getElementById('readingBooks').textContent = '0';
        document.getElementById('readingDays').textContent = '0';
        return;
    }

    // 고유한 독자 ID 수집
    const uniqueReaders = new Set();
    let totalReadingEntries = 0;

    dayDataList.forEach(dayData => {
        if (dayData.readers && dayData.readers.length > 0) {
            dayData.readers.forEach(reader => {
                uniqueReaders.add(reader.readerId);
                totalReadingEntries++;
            });
        }
    });

    // 독서일 수 = 기록이 있는 날의 수
    const readingDays = dayDataList.length;

    // 월간 캘린더 API는 책 정보가 없으므로, 독자 수와 독서일만 표시
    document.getElementById('totalBooks').textContent = uniqueReaders.size; // 활동한 독자 수
    document.getElementById('readingBooks').textContent = totalReadingEntries; // 총 독서 기록 수
    document.getElementById('readingDays').textContent = readingDays;
}

// 이벤트 기반 월간 요약 업데이트
function updateMonthlySummaryFromEvents(year, month) {
    const monthStr = `${year}-${String(month).padStart(2, '0')}`;
    const monthEvents = allEvents.filter(e => e.start && e.start.startsWith(monthStr));

    // 고유한 독자 ID 수집
    const uniqueReaders = new Set();
    monthEvents.forEach(event => {
        const readerId = event.extendedProps?.readerId;
        if (readerId) {
            uniqueReaders.add(readerId);
        }
    });

    // 독서일 계산
    const datesWithEvents = new Set(monthEvents.map(e => e.start));

    document.getElementById('totalBooks').textContent = uniqueReaders.size;
    document.getElementById('readingBooks').textContent = monthEvents.length;
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
        // 먼저 기존 도서 정보 조회 (기존 일정 유지를 위해)
        const bookInfo = await apiClient.getBook(pendingSchedule.bookId);
        const existingDetails = bookInfo.data?.bookDetails || [];

        // 새로 등록하려는 독자 이름 찾기
        let newReaderName = '';
        if (childId === null) {
            // 본인
            newReaderName = currentUserInfo?.nickname || currentUserInfo?.username || currentUserInfo?.name || '';
        } else {
            // 자녀
            const child = childrenData.find(c => (c.childId || c.id) === childId);
            newReaderName = child?.childName || child?.name || '';
        }

        // 디버그 로그
        console.log('[Debug] 새 독자 이름:', newReaderName);
        console.log('[Debug] currentUserInfo:', currentUserInfo);
        console.log('[Debug] childrenData:', childrenData);
        console.log('[Debug] existingDetails:', existingDetails);
        console.log('[Debug] 새 일정 startDate:', startDate, 'endDate:', endDate);

        // 동일한 독자의 기존 일정이 있는지 확인
        const existingReaderDetail = existingDetails.find(detail => {
            console.log('[Debug] 비교 - 기존 독자:', detail.readerResponse?.readerName, '새 독자:', newReaderName);
            return detail.readerResponse?.readerName === newReaderName;
        });

        console.log('[Debug] existingReaderDetail:', existingReaderDetail);

        if (existingReaderDetail) {
            // 동일한 독자가 이미 일정이 있음
            console.log('[Debug] 기존 일정 startDate:', existingReaderDetail.startDate, 'endDate:', existingReaderDetail.endDate);
            const isSameSchedule = existingReaderDetail.startDate === startDate &&
                                   existingReaderDetail.endDate === endDate;
            console.log('[Debug] isSameSchedule:', isSameSchedule);

            if (isSameSchedule) {
                // 동일한 일정이면 토스트 알림
                showToast('이미 등록된 일정입니다.', 'warning');
                confirmBtn.disabled = false;
                confirmBtn.textContent = '등록';
                return;
            }

            // 다른 일정이면 기존 일정을 수정
            const bookDetailsUpdate = existingDetails
                .filter(detail => detail.bookDetailsId !== existingReaderDetail.bookDetailsId)
                .map(detail => ({
                    detailsId: detail.bookDetailsId,
                    readerId: detail.readerResponse?.readerId,
                    startDate: detail.startDate,
                    endDate: detail.endDate
                }));

            // 수정된 일정 추가 (readerId + childId 둘 다 필요)
            bookDetailsUpdate.push({
                detailsId: existingReaderDetail.bookDetailsId,
                readerId: existingReaderDetail.readerResponse?.readerId,
                childId: childId,
                startDate: startDate,
                endDate: endDate
            });

            const bookUpdateData = {
                title: pendingSchedule.title,
                author: pendingSchedule.author,
                coverUrl: pendingSchedule.coverUrl || null,
                bookDetailsUpdate: bookDetailsUpdate
            };

            const response = await apiClient.updateBook(pendingSchedule.bookId, bookUpdateData);

            if (response.success || response.data) {
                showToast('기존 일정이 수정되었습니다.', 'success');
                closeScheduleModal();
                calendar.refetchEvents();
                selectDate(startDate);
                highlightSelectedDate(startDate);
            } else {
                throw new Error(response.message || '일정 수정에 실패했습니다.');
            }
            return;
        }

        // 새 일정 등록 (동일한 독자의 기존 일정이 없는 경우)
        const bookDetailsUpdate = existingDetails.map(detail => ({
            detailsId: detail.bookDetailsId,
            readerId: detail.readerResponse?.readerId,
            startDate: detail.startDate,
            endDate: detail.endDate
        }));

        // 해당 독자의 기존 readerId 찾기 (캘린더 캐시 데이터에서)
        let existingReaderId = null;

        // 1. dailyRecordsCache에서 찾기
        for (const dateKey in dailyRecordsCache) {
            const records = dailyRecordsCache[dateKey] || [];
            const matchingRecord = records.find(record =>
                record.reader?.readerName === newReaderName
            );
            if (matchingRecord && matchingRecord.reader?.readerId) {
                existingReaderId = matchingRecord.reader.readerId;
                console.log('[Debug] 캐시에서 기존 readerId 찾음:', existingReaderId);
                break;
            }
        }

        // 2. allEvents에서 찾기 (캐시에 없는 경우)
        if (!existingReaderId && allEvents && allEvents.length > 0) {
            for (const event of allEvents) {
                if (event.reader?.readerName === newReaderName && event.reader?.readerId) {
                    existingReaderId = event.reader.readerId;
                    console.log('[Debug] allEvents에서 기존 readerId 찾음:', existingReaderId);
                    break;
                }
            }
        }

        // 3. existingDetails (현재 도서의 기존 bookDetails)에서 찾기
        if (!existingReaderId && existingDetails && existingDetails.length > 0) {
            const matchingExisting = existingDetails.find(detail =>
                detail.readerResponse?.readerName === newReaderName
            );
            if (matchingExisting && matchingExisting.readerResponse?.readerId) {
                existingReaderId = matchingExisting.readerResponse.readerId;
                console.log('[Debug] existingDetails에서 기존 readerId 찾음:', existingReaderId);
            }
        }

        // 4. 도서 상세 API 조회 (아직 못 찾은 경우)
        if (!existingReaderId) {
            try {
                const bookDetailResponse = await apiClient.getBook(pendingSchedule.bookId);
                const bookData = bookDetailResponse.data || bookDetailResponse;
                const bookDetails = bookData.bookDetails || [];

                const matchingBookDetail = bookDetails.find(detail =>
                    detail.readerResponse?.readerName === newReaderName
                );
                if (matchingBookDetail && matchingBookDetail.readerResponse?.readerId) {
                    existingReaderId = matchingBookDetail.readerResponse.readerId;
                    console.log('[Debug] getBook API에서 기존 readerId 찾음:', existingReaderId);
                }
            } catch (e) {
                console.log('[Debug] getBook API 조회 실패:', e);
            }
        }

        // 5. 모든 도서에서 해당 독자의 readerId 검색 (자녀인 경우)
        if (!existingReaderId && childId) {
            try {
                console.log('[Debug] 모든 도서에서 readerId 검색 시작...');
                const allBooksResponse = await apiClient.getBooks();
                const allBooks = allBooksResponse.data || allBooksResponse || [];

                // 각 도서의 상세 정보를 조회하여 해당 자녀의 readerId 찾기
                for (const book of allBooks) {
                    if (book.bookId === pendingSchedule.bookId) continue; // 현재 도서는 이미 확인함

                    try {
                        const bookDetailRes = await apiClient.getBook(book.bookId);
                        const bookData = bookDetailRes.data || bookDetailRes;
                        const details = bookData.bookDetails || [];

                        const matchingDetail = details.find(detail =>
                            detail.readerResponse?.readerName === newReaderName
                        );

                        if (matchingDetail && matchingDetail.readerResponse?.readerId) {
                            existingReaderId = matchingDetail.readerResponse.readerId;
                            console.log('[Debug] 다른 도서에서 기존 readerId 찾음:', existingReaderId, '(bookId:', book.bookId, ')');
                            // 찾은 readerId를 캐시에 저장
                            saveReaderIdToCache(newReaderName, existingReaderId);
                            break;
                        }
                    } catch (e) {
                        // 개별 도서 조회 실패는 무시하고 계속
                    }
                }
            } catch (e) {
                console.log('[Debug] 전체 도서 검색 실패:', e);
            }
        }

        // 6. localStorage 캐시에서 찾기 (최종 폴백)
        if (!existingReaderId) {
            existingReaderId = getReaderIdFromCache(newReaderName);
            if (existingReaderId) {
                console.log('[Debug] localStorage 캐시에서 기존 readerId 찾음:', existingReaderId);
            }
        }

        console.log('[Debug] 최종 existingReaderId:', existingReaderId, '| childId:', childId, '| readerName:', newReaderName);

        // 새 일정 추가 (readerId가 있으면 함께 전송)
        const newDetail = {
            detailsId: null,
            childId: childId,
            startDate: startDate,
            endDate: endDate
        };
        if (existingReaderId) {
            newDetail.readerId = existingReaderId;
        }
        bookDetailsUpdate.push(newDetail);

        const bookUpdateData = {
            title: pendingSchedule.title,
            author: pendingSchedule.author,
            coverUrl: pendingSchedule.coverUrl || null,
            bookDetailsUpdate: bookDetailsUpdate
        };

        const response = await apiClient.updateBook(pendingSchedule.bookId, bookUpdateData);

        if (response.success || response.data) {
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

        // 특정 에러 메시지에 대한 사용자 친화적 메시지
        let errorMessage = error.message || '일정 등록에 실패했습니다.';
        if (errorMessage.includes('독자 정보가 이미 존재')) {
            errorMessage = '해당 독자의 기존 일정 정보가 있습니다. 페이지를 새로고침 후 다시 시도해주세요.';
            // 캘린더 새로고침 시도
            try {
                calendar.refetchEvents();
            } catch (e) {
                console.log('캘린더 새로고침 실패:', e);
            }
        }

        showToast(errorMessage, 'error');
    } finally {
        confirmBtn.disabled = false;
        confirmBtn.textContent = '등록';
    }
}

// ==================== 기록 상세 모달 ====================

// 기록 상세 모달 열기 (detailsId 기반)
function openRecordDetail(detailsId, dateStr) {
    // 캐시된 일간 기록에서 해당 detailsId 찾기
    const targetDate = dateStr || selectedDate;
    const records = dailyRecordsCache[targetDate] || [];
    const record = records.find(r => r.detailsId === detailsId);

    if (!record) {
        showToast('기록을 찾을 수 없습니다.', 'error');
        return;
    }

    // 백엔드 응답 구조에서 데이터 추출
    const book = record.book || {};
    const reader = record.reader || {};

    // readerId 캐시 업데이트
    if (reader.readerName && reader.readerId) {
        saveReaderIdToCache(reader.readerName, reader.readerId);
    }

    // 이미지 URL 추출
    let coverUrl = '';
    if (book.image) {
        coverUrl = book.image.imageUrl || book.image.url || '';
    }

    // 독서 상태 계산
    const today = new Date().toISOString().split('T')[0];
    const startDate = record.startDate || '';
    const endDate = record.endDate || '';
    let status = 'reading';
    if (endDate && endDate < today) {
        status = 'completed';
    } else if (startDate > today) {
        status = 'to_read';
    }

    // 현재 보고 있는 기록 저장 (수정/삭제용)
    currentViewingRecord = {
        detailsId: record.detailsId,
        scheduleId: record.detailsId, // API 호출용
        bookId: book.bookId,
        title: book.title || '제목 없음',
        author: book.author || '작자 미상',
        coverUrl: coverUrl,
        status: status,
        startDate: startDate,
        endDate: endDate,
        reader: reader,
        viewDate: targetDate
    };

    // 모달 내용 업데이트
    const coverEl = document.getElementById('recordCover');
    if (coverUrl) {
        coverEl.innerHTML = `<img src="${coverUrl}" alt="${escapeHtml(currentViewingRecord.title)}">`;
    } else {
        coverEl.innerHTML = `
            <div class="book-cover-placeholder">
                <h3>${escapeHtml(currentViewingRecord.title)}</h3>
            </div>
        `;
    }

    document.getElementById('recordTitle').textContent = currentViewingRecord.title;
    document.getElementById('recordAuthor').textContent = currentViewingRecord.author;

    const statusBadge = document.getElementById('recordStatus');
    statusBadge.textContent = getStatusText(status);
    statusBadge.className = `status-badge ${status}`;

    document.getElementById('recordStartDate').textContent = startDate || '-';
    document.getElementById('recordEndDate').textContent = endDate || '-';

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

    // 수정 폼에 현재 값 설정 (상태는 날짜 기반으로 자동 계산됨)
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

    // 상태는 날짜 기반으로 백엔드에서 자동 계산됨
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
        // 도서 정보 조회 (기존 일정 유지를 위해)
        const bookInfo = await apiClient.getBook(currentViewingRecord.bookId);
        const existingDetails = bookInfo.data?.bookDetails || [];

        // 기존 일정 중 수정할 detailsId를 제외한 나머지 유지
        const bookDetailsUpdate = existingDetails
            .filter(detail => detail.bookDetailsId !== currentViewingRecord.detailsId)
            .map(detail => ({
                detailsId: detail.bookDetailsId,
                readerId: detail.readerResponse?.readerId,
                startDate: detail.startDate,
                endDate: detail.endDate
            }));

        // 수정된 일정 추가
        bookDetailsUpdate.push({
            detailsId: currentViewingRecord.detailsId,
            startDate: newStartDate,
            endDate: newEndDate || null
        });

        const bookUpdateData = {
            title: currentViewingRecord.title,
            author: currentViewingRecord.author,
            coverUrl: currentViewingRecord.coverUrl || null,
            bookDetailsUpdate: bookDetailsUpdate
        };

        const response = await apiClient.updateBook(currentViewingRecord.bookId, bookUpdateData);

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

    const confirmed = await showConfirm(
        `"${currentViewingRecord.title}" 일정을 삭제하시겠습니까?`,
        '삭제',
        '취소',
        '일정 삭제'
    );

    if (!confirmed) {
        return;
    }

    const deleteBtn = document.getElementById('recordDeleteBtn');
    deleteBtn.disabled = true;
    deleteBtn.textContent = '삭제 중...';

    try {
        // 도서 정보 조회 (기존 일정 확인)
        const bookInfo = await apiClient.getBook(currentViewingRecord.bookId);
        const existingDetails = bookInfo.data?.bookDetails || [];

        // 삭제 전에 모든 독자의 readerId를 캐시에 저장 (향후 재등록 시 사용)
        existingDetails.forEach(detail => {
            if (detail.readerResponse?.readerName && detail.readerResponse?.readerId) {
                saveReaderIdToCache(detail.readerResponse.readerName, detail.readerResponse.readerId);
            }
        });

        // 삭제할 detailsId를 제외한 나머지 일정만 유지
        const remainingDetails = existingDetails
            .filter(detail => detail.bookDetailsId !== currentViewingRecord.detailsId)
            .map(detail => ({
                detailsId: detail.bookDetailsId,
                readerId: detail.readerResponse?.readerId,
                startDate: detail.startDate,
                endDate: detail.endDate
            }));

        // updateBook으로 일정만 삭제 (도서는 유지)
        const bookUpdateData = {
            title: currentViewingRecord.title,
            author: currentViewingRecord.author,
            coverUrl: currentViewingRecord.coverUrl || null,
            bookDetailsUpdate: remainingDetails
        };

        const response = await apiClient.updateBook(currentViewingRecord.bookId, bookUpdateData);

        if (response.success || response.data) {
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
        } else if (childrenResponse.data && Array.isArray(childrenResponse.data)) {
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

}

// ==================== 한글 서수 변환 ====================

function getKoreanOrdinal(num) {
    const ordinals = ['', '첫째', '둘째', '셋째', '넷째', '다섯째', '여섯째', '일곱째', '여덟째', '아홉째', '열째'];
    if (num >= 1 && num <= 10) {
        return ordinals[num];
    }
    return `${num}째`;
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
            const birthOrder = child.birthOrder;

            // 나이 계산 (childBirth가 있는 경우)
            let age = '';
            if (child.childBirth) {
                const birthDate = new Date(child.childBirth);
                const today = new Date();
                age = today.getFullYear() - birthDate.getFullYear();
                // 생일이 아직 안 지났으면 1살 빼기
                const monthDiff = today.getMonth() - birthDate.getMonth();
                if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                    age--;
                }
            }

            // 표시 형식: "이름 (자녀, N째)" 또는 "이름 (자녀, N세)"
            let displayText = childName;
            if (birthOrder) {
                const orderText = getKoreanOrdinal(birthOrder);
                displayText = `${childName} (자녀, ${orderText})`;
            } else if (age) {
                displayText = `${childName} (자녀, ${age}세)`;
            } else {
                displayText = `${childName} (자녀)`;
            }
            optionsContainer.innerHTML += `
                <div class="custom-select-option" data-value="${childId}" data-color="${childColor}">
                    <span class="option-icon" style="background: ${childColor};"></span>
                    <span class="option-text">${displayText}</span>
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

    // 기존 이벤트 리스너 제거를 위해 요소 교체
    const newTrigger = trigger.cloneNode(true);
    trigger.parentNode.replaceChild(newTrigger, trigger);

    // valueDisplay는 새 트리거에서 다시 가져옴
    const valueDisplay = newTrigger.querySelector('.custom-select-value');

    // 트리거 클릭 시 드롭다운 열기/닫기
    newTrigger.addEventListener('click', function(e) {
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
