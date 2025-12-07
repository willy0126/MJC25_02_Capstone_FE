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
let bookImageCache = {}; // 책 이미지 캐시 { bookId: { imageId, coverUrl } }

// 독자 데이터 (본인 + 자녀)
let currentUserInfo = null;
let childrenData = [];

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

// 새 스케줄 데이터에서 readerId 캐시 업데이트
function updateReaderCacheFromSchedules(schedules) {
    if (!schedules || !Array.isArray(schedules)) return;

    schedules.forEach(schedule => {
        const reader = schedule.reader || {};
        if (reader.readerName && reader.readerId) {
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
    draggableInstance =new FullCalendar.Draggable(containerEl, {
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

    // 독자 추가 버튼
    document.getElementById('addReaderBtn')?.addEventListener('click', addReaderRow);

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
            wishlistBooks =response;
        } else if (response.success && response.data) {
            // { success: true, data: [...] } 형식
            wishlistBooks =response.data;
        } else if (response.data) {
            // { data: [...] } 형식
            wishlistBooks =response.data;
        } else {
            throw new Error('책 목록 응답 형식 오류');
        }

        // 책 이미지 정보를 캐시에 저장
        updateBookImageCache(wishlistBooks);

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

    // 디버깅: 첫 번째 책의 구조 확인
    if (wishlistBooks.length > 0) {
        console.log('[Calendar Debug] 첫 번째 책장 책 구조:', JSON.stringify(wishlistBooks[0], null, 2));
    }

    // 드래그 힌트 + 책 목록 렌더링
    contentEl.innerHTML = `
        <div class="drag-hint">
            <span>📌 책을 드래그하여 캘린더에 놓으세요</span>
        </div>
        ${wishlistBooks.map(book => {
            // 이미지 정보 추출 (다양한 경로 지원)
            const imageId = book.image?.imageId || book.imageId || null;
            const coverUrl = book.image?.imageUrl || book.coverUrl || book.cover || '';

            // 이미지 HTML 생성
            let coverHtml;
            if (imageId) {
                coverHtml = `<img data-image-id="${imageId}" alt="${escapeHtml(book.title)}" class="auth-image" style="width: 100%; height: 100%; object-fit: cover;">`;
            } else if (coverUrl) {
                coverHtml = `<img src="${coverUrl}" alt="${escapeHtml(book.title)}" style="width: 100%; height: 100%; object-fit: cover;">`;
            } else {
                coverHtml = `<div class="cover-placeholder">${book.title.substring(0, 2)}</div>`;
            }

            return `
            <div class="draggable-book"
                 data-book-id="${book.bookId}"
                 data-title="${escapeHtml(book.title)}"
                 data-author="${escapeHtml(book.author || '')}"
                 data-cover-url="${coverUrl}"
                 data-image-id="${imageId || ''}">
                <div class="draggable-book-cover">
                    ${coverHtml}
                </div>
                <div class="draggable-book-info">
                    <div class="draggable-book-title">${escapeHtml(book.title)}</div>
                    <div class="draggable-book-author">${escapeHtml(book.author || '작자 미상')}</div>
                </div>
            </div>
        `}).join('')}
    `;

    // 인증된 이미지 비동기 로드
    loadAuthImages(contentEl);

    // Draggable 다시 초기화 (새로운 요소들에 적용)
    if (draggableInstance) {
        draggableInstance.destroy();
    }
    initializeDraggable();
}

// ==================== 데이터 로드 ====================

// FullCalendar 이벤트 소스 함수 (새 Calendar Schedule API 사용)
async function fetchEvents(info, successCallback, failureCallback) {
    // 현재 보이는 달의 중간 날짜로 정확한 월 계산
    const viewStart = info.start;
    const viewEnd = info.end;
    const midDate = new Date((viewStart.getTime() + viewEnd.getTime()) / 2);
    const year = midDate.getFullYear();
    const month = midDate.getMonth() + 1;

    // 현재 연/월 저장
    currentCalendarYear =year;
    currentCalendarMonth =month;

    try {
        // 새 Calendar Schedule API 사용
        const response = await apiClient.getMonthlySchedules(year, month);

        // 응답 형식에 따라 처리
        // 새 API 응답: { success: true, data: [{ scheduleId, book, reader, startDate, endDate, status }] }
        let schedules = [];
        if (Array.isArray(response)) {
            schedules = response;
        } else if (response.success && response.data) {
            schedules = response.data;
        } else if (response.data) {
            schedules = response.data;
        }

        processScheduleData(schedules, year, month);
        successCallback(allEvents);
        updateMonthlySummaryFromSchedules(schedules);
    } catch (error) {
        console.error('월간 캘린더 데이터 로드 실패:', error);
        // 실패 시 빈 데이터로 처리
        processScheduleData([], year, month);
        successCallback([]);
        updateMonthlySummaryFromSchedules([]);
    }
}

// 새 Calendar Schedule API 데이터 처리
// 응답 형식: [{ scheduleId, book, reader, startDate, endDate, status }]
function processScheduleData(schedules, year, month) {
    monthlyRecords ={};
    const events = [];

    // 날짜 범위 내의 일정만 필터링 및 각 날짜별로 이벤트 생성
    schedules.forEach((schedule, index) => {
        const reader = schedule.reader || {};
        const book = schedule.book || {};
        const startDate = schedule.startDate;
        const endDate = schedule.endDate || startDate;

        // 해당 월의 각 날짜에 대해 이벤트 생성 (일정 기간 내)
        const start = new Date(startDate);
        const end = new Date(endDate);
        const monthStart = new Date(year, month - 1, 1);
        const monthEnd = new Date(year, month, 0);

        // 일정 기간 내의 각 날짜에 이벤트 추가
        for (let d = new Date(Math.max(start, monthStart)); d <= Math.min(end, monthEnd); d.setDate(d.getDate() + 1)) {
            const dateStr = formatDateToString(d);

            if (!monthlyRecords[dateStr]) {
                monthlyRecords[dateStr] = [];
            }

            const eventData = {
                date: dateStr,
                scheduleId: schedule.scheduleId,
                readerId: reader.readerId || reader.childId,
                readerName: reader.readerName || '본인',
                color: reader.color || '#20B2AA',
                book: book,
                startDate: startDate,
                endDate: endDate,
                status: schedule.status
            };

            monthlyRecords[dateStr].push(eventData);
            events.push(convertScheduleToEvent(eventData, index));

            // readerId 캐시 업데이트
            if (reader.readerName && reader.readerId) {
                saveReaderIdToCache(reader.readerName, reader.readerId);
            }
        }
    });

    allEvents =events;
}

// 스케줄을 FullCalendar 이벤트로 변환
function convertScheduleToEvent(record, index = 0) {
    return {
        id: `schedule-${record.scheduleId}-${record.date}`,
        title: record.readerName || '독서 중',
        start: record.date,
        backgroundColor: record.color || '#20B2AA',
        borderColor: record.color || '#20B2AA',
        textColor: '#ffffff',
        display: 'block',
        extendedProps: {
            scheduleId: record.scheduleId,
            readerId: record.readerId,
            readerName: record.readerName,
            color: record.color,
            book: record.book,
            startDate: record.startDate,
            endDate: record.endDate,
            status: record.status
        }
    };
}

// 새 스케줄 데이터 기반 월간 요약 업데이트
function updateMonthlySummaryFromSchedules(schedules) {
    const totalBooksEl = document.getElementById('totalBooks');
    const readingBooksEl = document.getElementById('readingBooks');
    const readingDaysEl = document.getElementById('readingDays');

    if (!schedules || schedules.length === 0) {
        if (totalBooksEl) totalBooksEl.textContent = '0';
        if (readingBooksEl) readingBooksEl.textContent = '0';
        if (readingDaysEl) readingDaysEl.textContent = '0';
        updateTextSummary([], 0, 0);
        return;
    }

    // 고유한 독자 ID와 책 ID 수집
    const uniqueReaders = new Set();
    const uniqueBooks = new Set();
    const datesWithSchedules = new Set();

    schedules.forEach(schedule => {
        const reader = schedule.reader || {};
        const book = schedule.book || {};

        if (reader.readerId || reader.childId) {
            uniqueReaders.add(reader.readerId || reader.childId);
        }
        if (book.bookId) {
            uniqueBooks.add(book.bookId);
        }

        // 일정 기간 내의 날짜들 수집
        const start = new Date(schedule.startDate);
        const end = new Date(schedule.endDate || schedule.startDate);
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            datesWithSchedules.add(formatDateToString(d));
        }
    });

    if (totalBooksEl) totalBooksEl.textContent = uniqueBooks.size;
    if (readingBooksEl) readingBooksEl.textContent = schedules.length;
    if (readingDaysEl) readingDaysEl.textContent = datesWithSchedules.size;

    // 텍스트 기반 요약 업데이트
    updateTextSummary(schedules, uniqueBooks.size, datesWithSchedules.size);
}

// ApexCharts 인스턴스 저장
let monthProgressChartInstance = null;
let weekBarChartInstance = null;

// ApexCharts 기반 요약 업데이트
function updateTextSummary(schedules, bookCount, dayCount) {
    const today = formatDateToString(new Date());
    const todayDate = new Date();

    // 오늘 날짜 라벨 업데이트
    const todayDateLabel = document.getElementById('todayDateLabel');
    if (todayDateLabel) {
        const monthDay = `${todayDate.getMonth() + 1}월 ${todayDate.getDate()}일`;
        const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
        todayDateLabel.textContent = `${monthDay} (${dayNames[todayDate.getDay()]})`;
    }

    // 1. 이번 달 진행률 (Radial Bar)
    updateMonthProgressChart(schedules, bookCount, dayCount);

    // 2. 오늘의 독서 리스트
    updateTodayReadingList(schedules, today);

    // 3. 이번 주 일정 (Bar Chart)
    updateWeekBarChart(schedules, todayDate, today);
}

// 이번 달 진행률 차트 (Radial Bar)
function updateMonthProgressChart(schedules, bookCount, dayCount) {
    const chartEl = document.getElementById('monthProgressChart');
    const legendEl = document.getElementById('monthProgressLegend');
    if (!chartEl) return;

    // 이번 달 총 일수
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const progressPercent = daysInMonth > 0 ? Math.round((dayCount / daysInMonth) * 100) : 0;

    // 기존 차트 제거
    if (monthProgressChartInstance) {
        monthProgressChartInstance.destroy();
    }

    const options = {
        series: [progressPercent],
        chart: {
            height: 200,
            type: 'radialBar',
            sparkline: { enabled: true }
        },
        plotOptions: {
            radialBar: {
                startAngle: -135,
                endAngle: 135,
                hollow: {
                    margin: 0,
                    size: '70%',
                    background: 'transparent'
                },
                track: {
                    background: '#e7e7e7',
                    strokeWidth: '100%',
                    margin: 5,
                    dropShadow: {
                        enabled: true,
                        top: 2,
                        left: 0,
                        blur: 4,
                        opacity: 0.1
                    }
                },
                dataLabels: {
                    name: {
                        show: true,
                        fontSize: '14px',
                        fontFamily: 'Paperlogy, sans-serif',
                        color: '#888',
                        offsetY: -10
                    },
                    value: {
                        show: true,
                        fontSize: '32px',
                        fontFamily: 'Paperlogy, sans-serif',
                        fontWeight: 700,
                        color: '#20B2AA',
                        offsetY: 5,
                        formatter: function(val) {
                            return val + '%';
                        }
                    }
                }
            }
        },
        fill: {
            type: 'gradient',
            gradient: {
                shade: 'dark',
                type: 'horizontal',
                shadeIntensity: 0.5,
                gradientToColors: ['#87CEEB'],
                inverseColors: true,
                opacityFrom: 1,
                opacityTo: 1,
                stops: [0, 100]
            }
        },
        stroke: {
            lineCap: 'round'
        },
        labels: ['독서일']
    };

    monthProgressChartInstance = new ApexCharts(chartEl, options);
    monthProgressChartInstance.render();

    // 범례 업데이트
    if (legendEl) {
        legendEl.innerHTML = `
            <div class="legend-items">
                <div class="legend-item">
                    <span class="legend-dot" style="background: #20B2AA;"></span>
                    <span class="legend-label">총 ${bookCount}권</span>
                </div>
                <div class="legend-item">
                    <span class="legend-dot" style="background: #87CEEB;"></span>
                    <span class="legend-label">${dayCount}일 / ${daysInMonth}일</span>
                </div>
                <div class="legend-item">
                    <span class="legend-dot" style="background: #FFB6C1;"></span>
                    <span class="legend-label">${schedules.length}건 일정</span>
                </div>
            </div>
        `;
    }
}

// 오늘의 독서 리스트
function updateTodayReadingList(schedules, today) {
    const listEl = document.getElementById('todayReadingList');
    if (!listEl) return;

    const todaySchedules = schedules.filter(s => {
        const start = s.startDate;
        const end = s.endDate || s.startDate;
        return start <= today && today <= end;
    });

    if (todaySchedules.length === 0) {
        listEl.innerHTML = '<p class="summary-empty">오늘 읽을 책이 없습니다.</p>';
        return;
    }

    const items = todaySchedules.slice(0, 4).map(s => {
        const book = s.book || {};
        const reader = s.reader || {};
        const coverUrl = book.coverUrl || book.imageUrl || '';
        const coverStyle = coverUrl ? `background-image: url('${coverUrl}');` : '';

        return `
            <div class="today-book-item">
                <div class="today-book-cover" style="${coverStyle}">
                    ${!coverUrl ? `<span class="cover-placeholder">${escapeHtml((book.title || '책')[0])}</span>` : ''}
                </div>
                <div class="today-book-info">
                    <span class="today-book-title">${escapeHtml(book.title || '제목 없음')}</span>
                    <span class="today-book-reader">
                        <span class="reader-dot" style="background: ${reader.color || '#20B2AA'};"></span>
                        ${escapeHtml(reader.readerName || '본인')}
                    </span>
                </div>
            </div>
        `;
    }).join('');

    const moreText = todaySchedules.length > 4
        ? `<p class="today-more">외 ${todaySchedules.length - 4}건</p>`
        : '';
    listEl.innerHTML = items + moreText;
}

// 이번 주 일정 (Bar Chart)
function updateWeekBarChart(schedules, todayDate, today) {
    const chartEl = document.getElementById('weekBarChart');
    if (!chartEl) return;

    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    const weekStart = new Date(todayDate);
    weekStart.setDate(todayDate.getDate() - todayDate.getDay()); // 이번 주 일요일

    const categories = [];
    const data = [];
    const colors = [];

    for (let i = 0; i < 7; i++) {
        const checkDate = new Date(weekStart);
        checkDate.setDate(weekStart.getDate() + i);
        const checkDateStr = formatDateToString(checkDate);
        const isToday = checkDateStr === today;

        const daySchedules = schedules.filter(s => {
            const start = s.startDate;
            const end = s.endDate || s.startDate;
            return start <= checkDateStr && checkDateStr <= end;
        });

        categories.push(isToday ? `${dayNames[i]}*` : dayNames[i]);
        data.push(daySchedules.length);
        colors.push(isToday ? '#20B2AA' : '#87CEEB');
    }

    // 기존 차트 제거
    if (weekBarChartInstance) {
        weekBarChartInstance.destroy();
    }

    const options = {
        series: [{
            name: '독서 일정',
            data: data
        }],
        chart: {
            type: 'bar',
            height: 180,
            toolbar: { show: false },
            sparkline: { enabled: false }
        },
        plotOptions: {
            bar: {
                borderRadius: 6,
                columnWidth: '50%',
                distributed: true,
                dataLabels: {
                    position: 'top'
                }
            }
        },
        colors: colors,
        dataLabels: {
            enabled: true,
            formatter: function(val) {
                return val > 0 ? val : '';
            },
            offsetY: -20,
            style: {
                fontSize: '12px',
                fontFamily: 'Paperlogy, sans-serif',
                colors: ['#304758']
            }
        },
        legend: { show: false },
        xaxis: {
            categories: categories,
            labels: {
                style: {
                    fontSize: '12px',
                    fontFamily: 'Paperlogy, sans-serif',
                    colors: categories.map((_, i) => {
                        const checkDate = new Date(weekStart);
                        checkDate.setDate(weekStart.getDate() + i);
                        return formatDateToString(checkDate) === today ? '#20B2AA' : '#666';
                    }),
                    fontWeight: categories.map((_, i) => {
                        const checkDate = new Date(weekStart);
                        checkDate.setDate(weekStart.getDate() + i);
                        return formatDateToString(checkDate) === today ? 700 : 400;
                    })
                }
            },
            axisBorder: { show: false },
            axisTicks: { show: false }
        },
        yaxis: {
            show: false,
            max: Math.max(...data, 3) + 1
        },
        grid: {
            show: false,
            padding: {
                top: 0,
                right: 10,
                bottom: 0,
                left: 10
            }
        },
        tooltip: {
            enabled: true,
            y: {
                formatter: function(val) {
                    return val + '건';
                }
            }
        }
    };

    weekBarChartInstance = new ApexCharts(chartEl, options);
    weekBarChartInstance.render();
}

// 기존 캘린더 데이터 처리 (레거시 - book_details 기반)
// 백엔드 응답: [{ day: number, readers: [{ readerId, color, readerName }] }]
function processCalendarData(dayDataList, year, month) {
    monthlyRecords ={};
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

    allEvents =events;
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
    selectedDate =dateStr;
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

// 일간 독서 기록 로드 (새 Calendar Schedule API 사용)
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
        // 새 Calendar Schedule API 사용
        const response = await apiClient.getDailySchedules(dateStr);

        // 새 API 응답 형식: { success: true, data: [{ scheduleId, book, reader, startDate, endDate, status }] }
        let schedules = [];
        if (response.records) {
            schedules = response.records;
        } else if (response.success && response.data) {
            schedules = response.data.records || response.data || [];
        } else if (response.data) {
            schedules = response.data.records || response.data || [];
        } else if (Array.isArray(response)) {
            schedules = response;
        }

        // 캐시에 저장 (scheduleId 기반)
        dailyRecordsCache[dateStr] = schedules;

        // readerId 캐시 업데이트
        updateReaderCacheFromSchedules(schedules);

        renderDailySchedules(schedules, dateStr);
    } catch (error) {
        console.error('일간 기록 로드 실패:', error);
        // 캐시된 데이터 사용 (폴백)
        const cachedRecords = dailyRecordsCache[dateStr] || [];
        renderDailySchedules(cachedRecords, dateStr);
    }
}

// 일간 기록 렌더링 (백엔드 응답 형식에 맞춤)
// 백엔드 응답: { detailsId, reader: {...}, book: {...}, startDate, endDate }
// 같은 책(bookId)을 읽는 여러 독자를 하나의 카드로 묶어서 표시
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

    // 디버깅: 첫 번째 레코드의 구조 확인
    if (records.length > 0) {
        console.log('[Calendar Debug] 첫 번째 레코드 구조:', JSON.stringify(records[0], null, 2));
    }

    // 같은 책(bookId)을 기준으로 레코드 그룹화
    const groupedByBook = {};
    records.forEach(record => {
        const book = record.book || {};
        const bookId = book.bookId || record.bookId;

        if (!groupedByBook[bookId]) {
            groupedByBook[bookId] = {
                book: book,
                bookId: bookId,
                readers: []
            };
        }
        groupedByBook[bookId].readers.push({
            detailsId: record.detailsId,
            reader: record.reader || {},
            startDate: record.startDate,
            endDate: record.endDate
        });
    });

    console.log('[Calendar Debug] 책별 그룹화 결과:', Object.keys(groupedByBook).length, '권의 책');

    recordsContent.innerHTML = Object.values(groupedByBook).map(group => {
        const book = group.book;
        const bookId = group.bookId;
        const readers = group.readers;
        const title = book.title || '제목 없음';
        const author = book.author || '작자 미상';

        // 이미지 정보 추출 (다양한 경로 지원 + 캐시 확인)
        let imageId = book.image?.imageId || book.imageId || null;
        let coverUrl = book.image?.imageUrl || book.coverUrl || book.cover || '';

        // 캐시에서 이미지 정보 가져오기 (API 응답에 이미지가 없는 경우)
        if (!imageId && !coverUrl && bookId) {
            const cachedImage = getBookImageFromCache(bookId);
            if (cachedImage) {
                imageId = cachedImage.imageId;
                coverUrl = cachedImage.coverUrl;
                console.log('[Calendar Debug] 캐시에서 이미지 정보 사용:', bookId);
            }
        }

        // 이미지 HTML 생성: imageId가 있으면 data-image-id 속성으로 비동기 로드
        let coverHtml;
        if (imageId) {
            coverHtml = `<img data-image-id="${imageId}" alt="${escapeHtml(title)}" class="auth-image" style="width: 100%; height: 100%; object-fit: cover;">`;
        } else if (coverUrl) {
            coverHtml = `<img src="${coverUrl}" alt="${escapeHtml(title)}" style="width: 100%; height: 100%; object-fit: cover;">`;
        } else {
            coverHtml = `<div class="cover-placeholder">${title.substring(0, 4)}</div>`;
        }

        // 독자들 HTML 생성 (각 독자별 일정 포함)
        const readersHtml = readers.map(r => {
            const reader = r.reader;
            const readerColor = reader.color || '#20B2AA';
            const readerBgColor = hexToRgba(readerColor, 0.15);
            const readerBorderColor = hexToRgba(readerColor, 0.3);

            // 일정 텍스트 생성
            const startDate = r.startDate || '-';
            const endDate = r.endDate || '-';
            const scheduleText = `${startDate} ~ ${endDate}`;

            return `
                <div class="reader-schedule-item" style="--reader-bg-color: ${readerBgColor}; --reader-border-color: ${readerBorderColor};"
                     data-details-id="${r.detailsId}" onclick="event.stopPropagation(); openRecordDetail(${r.detailsId}, '${dateStr}')">
                    <div class="reader-info-row">
                        <span class="reader-dot" style="background: ${readerColor};"></span>
                        <span class="reader-name">${escapeHtml(reader.readerName || '본인')}</span>
                    </div>
                    <div class="reader-schedule-date">${scheduleText}</div>
                </div>
            `;
        }).join('');

        // 대표 상태 계산 (첫 번째 독자 기준 또는 가장 최근 상태)
        const today = new Date().toISOString().split('T')[0];
        let status = 'reading';
        // 모든 독자의 상태 확인
        const allCompleted = readers.every(r => r.endDate && r.endDate < today);
        const allToRead = readers.every(r => r.startDate > today);
        if (allCompleted) {
            status = 'completed';
        } else if (allToRead) {
            status = 'to_read';
        }

        // 첫 번째 독자의 detailsId를 대표로 사용 (책 카드 클릭 시)
        const firstDetailsId = readers[0].detailsId;

        return `
        <div class="record-item record-item-grouped" data-book-id="${bookId}" onclick="openRecordDetail(${firstDetailsId}, '${dateStr}')">
            <div class="record-item-cover">
                ${coverHtml}
            </div>
            <div class="record-item-info">
                <div class="record-item-title">${escapeHtml(title)}</div>
                <div class="record-item-author">${escapeHtml(author)}</div>
                <div class="record-item-readers">
                    ${readersHtml}
                </div>
                <span class="record-item-status ${status}">${getStatusText(status)}</span>
            </div>
        </div>
    `;
    }).join('');

    // 인증된 이미지 비동기 로드
    loadAuthImages(recordsContent);
}

// 일간 스케줄 렌더링 (새 Calendar Schedule API 응답 형식)
// 응답: [{ scheduleId, book, reader, startDate, endDate, status }]
// 같은 책(bookId)을 읽는 여러 독자를 하나의 카드로 묶어서 표시
function renderDailySchedules(schedules, dateStr) {
    const recordsContent = document.getElementById('recordsContent');

    if (!schedules || schedules.length === 0) {
        recordsContent.innerHTML = `
            <div class="empty-records">
                <p>이 날의 독서 기록이 없습니다.</p>
            </div>
        `;
        return;
    }

    // 디버깅: 첫 번째 스케줄의 구조 확인
    if (schedules.length > 0) {
        console.log('[Calendar Debug] 첫 번째 스케줄 구조:', JSON.stringify(schedules[0], null, 2));
    }

    // 같은 책(bookId)을 기준으로 스케줄 그룹화
    const groupedByBook = {};
    schedules.forEach(schedule => {
        const book = schedule.book || {};
        const bookId = book.bookId || schedule.bookId;

        if (!groupedByBook[bookId]) {
            groupedByBook[bookId] = {
                book: book,
                bookId: bookId,
                readers: []
            };
        }
        groupedByBook[bookId].readers.push({
            scheduleId: schedule.scheduleId,  // detailsId 대신 scheduleId 사용
            reader: schedule.reader || {},
            startDate: schedule.startDate,
            endDate: schedule.endDate,
            status: schedule.status
        });
    });

    console.log('[Calendar Debug] 책별 그룹화 결과:', Object.keys(groupedByBook).length, '권의 책');

    recordsContent.innerHTML = Object.values(groupedByBook).map(group => {
        const book = group.book;
        const bookId = group.bookId;
        const readers = group.readers;
        const title = book.title || '제목 없음';
        const author = book.author || '작자 미상';

        // 이미지 정보 추출 (다양한 경로 지원 + 캐시 확인)
        let imageId = book.image?.imageId || book.imageId || null;
        let coverUrl = book.image?.imageUrl || book.coverUrl || book.cover || '';

        // 캐시에서 이미지 정보 가져오기 (API 응답에 이미지가 없는 경우)
        if (!imageId && !coverUrl && bookId) {
            const cachedImage = getBookImageFromCache(bookId);
            if (cachedImage) {
                imageId = cachedImage.imageId;
                coverUrl = cachedImage.coverUrl;
                console.log('[Calendar Debug] 캐시에서 이미지 정보 사용:', bookId);
            }
        }

        // 이미지 HTML 생성: imageId가 있으면 data-image-id 속성으로 비동기 로드
        let coverHtml;
        if (imageId) {
            coverHtml = `<img data-image-id="${imageId}" alt="${escapeHtml(title)}" class="auth-image" style="width: 100%; height: 100%; object-fit: cover;">`;
        } else if (coverUrl) {
            coverHtml = `<img src="${coverUrl}" alt="${escapeHtml(title)}" style="width: 100%; height: 100%; object-fit: cover;">`;
        } else {
            coverHtml = `<div class="cover-placeholder">${title.substring(0, 4)}</div>`;
        }

        // 독자들 HTML 생성 (각 독자별 일정 포함) - scheduleId 기반
        const readersHtml = readers.map(r => {
            const reader = r.reader;
            const readerColor = reader.color || '#20B2AA';
            const readerBgColor = hexToRgba(readerColor, 0.15);
            const readerBorderColor = hexToRgba(readerColor, 0.3);

            // 일정 텍스트 생성
            const startDate = r.startDate || '-';
            const endDate = r.endDate || '-';
            const scheduleText = `${startDate} ~ ${endDate}`;

            return `
                <div class="reader-schedule-item" style="--reader-bg-color: ${readerBgColor}; --reader-border-color: ${readerBorderColor};"
                     data-schedule-id="${r.scheduleId}" onclick="event.stopPropagation(); openScheduleDetail(${r.scheduleId}, '${dateStr}')">
                    <div class="reader-info-row">
                        <span class="reader-dot" style="background: ${readerColor};"></span>
                        <span class="reader-name">${escapeHtml(reader.readerName || '본인')}</span>
                    </div>
                    <div class="reader-schedule-date">${scheduleText}</div>
                </div>
            `;
        }).join('');

        // 대표 상태 계산 (status 필드 활용)
        const today = new Date().toISOString().split('T')[0];
        let status = 'reading';
        // 모든 독자의 상태 확인
        const allCompleted = readers.every(r => r.status === 'COMPLETED' || (r.endDate && r.endDate < today));
        const allToRead = readers.every(r => r.status === 'TO_READ' || r.startDate > today);
        if (allCompleted) {
            status = 'completed';
        } else if (allToRead) {
            status = 'to_read';
        }

        // 첫 번째 독자의 scheduleId를 대표로 사용 (책 카드 클릭 시)
        const firstScheduleId = readers[0].scheduleId;

        return `
        <div class="record-item record-item-grouped" data-book-id="${bookId}" onclick="openScheduleDetail(${firstScheduleId}, '${dateStr}')">
            <div class="record-item-cover">
                ${coverHtml}
            </div>
            <div class="record-item-info">
                <div class="record-item-title">${escapeHtml(title)}</div>
                <div class="record-item-author">${escapeHtml(author)}</div>
                <div class="record-item-readers">
                    ${readersHtml}
                </div>
                <span class="record-item-status ${status}">${getStatusText(status)}</span>
            </div>
        </div>
    `;
    }).join('');

    // 인증된 이미지 비동기 로드
    loadAuthImages(recordsContent);
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
    pendingSchedule ={
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

    // 다중 독자 선택 드롭다운 초기화 (첫 번째 행 자동 추가)
    initReaderDropdown();

    // 모달 표시
    document.getElementById('scheduleModal').style.display = 'flex';
}

// 일정 등록 모달 닫기
function closeScheduleModal() {
    document.getElementById('scheduleModal').style.display = 'none';
    pendingSchedule =null;
}

// 일정 등록 확인 (새 Calendar Schedule API 사용 - 다중 독자 지원)
async function confirmSchedule() {
    if (!pendingSchedule) return;

    // 모든 독자 일정 수집
    const schedules = collectReaderSchedules();

    // 유효성 검사
    if (schedules.length === 0) {
        showToast('최소 한 명의 독자를 선택해주세요.', 'error');
        return;
    }

    // 각 일정의 날짜 검사
    for (const schedule of schedules) {
        if (!schedule.startDate) {
            showToast('시작일을 선택해주세요.', 'error');
            return;
        }
        if (!schedule.endDate) {
            showToast('완료일을 선택해주세요.', 'error');
            return;
        }
    }

    const confirmBtn = document.getElementById('scheduleConfirm');
    confirmBtn.disabled = true;
    confirmBtn.textContent = '등록 중...';

    try {
        // 새 Calendar Schedule API 형식에 맞게 데이터 변환
        // API 요청 형식: { bookId, schedules: [{ childId, startDate, endDate }] }
        const calendarSchedules = schedules.map(schedule => ({
            childId: schedule.childId,  // null이면 본인
            startDate: schedule.startDate,
            endDate: schedule.endDate
        }));

        console.log('[Debug] 일정 등록 요청 데이터 (새 API):', {
            bookId: pendingSchedule.bookId,
            schedules: calendarSchedules
        });

        // 새 Calendar Schedule API 사용 - 개별 일정 등록, 다른 독자에게 영향 없음
        const response = await apiClient.createCalendarSchedule(pendingSchedule.bookId, calendarSchedules);

        if (response.success || response.data) {
            const count = schedules.length;
            showToast(`${count}명의 독서 일정이 등록되었습니다!`, 'success');
            closeScheduleModal();

            // 캘린더 새로고침
            calendar.refetchEvents();

            // 첫 번째 일정의 날짜 선택
            if (schedules.length > 0) {
                selectDate(schedules[0].startDate);
                highlightSelectedDate(schedules[0].startDate);
            }
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
    const bookId = book.bookId;

    // readerId 캐시 업데이트
    if (reader.readerName && reader.readerId) {
        saveReaderIdToCache(reader.readerName, reader.readerId);
    }

    // 같은 책의 모든 독자 일정 찾기
    const allReadersForBook = records.filter(r => {
        const rBook = r.book || {};
        return rBook.bookId === bookId;
    });

    // 이미지 정보 추출 (다양한 경로 지원 + 캐시 확인)
    let imageId = book.image?.imageId || book.imageId || record.image?.imageId || null;
    let coverUrl = book.image?.imageUrl || book.coverUrl || record.coverUrl || book.cover || '';

    // 캐시에서 이미지 정보 가져오기 (API 응답에 이미지가 없는 경우)
    if (!imageId && !coverUrl && bookId) {
        const cachedImage = getBookImageFromCache(bookId);
        if (cachedImage) {
            imageId = cachedImage.imageId;
            coverUrl = cachedImage.coverUrl;
            console.log('[Calendar Debug] openRecordDetail - 캐시에서 이미지 정보 사용:', bookId);
        }
    }

    console.log('[Calendar Debug] openRecordDetail 이미지 정보:', { imageId, coverUrl, bookImage: book.image });

    // 현재 보고 있는 책 정보 저장 (수정/삭제용)
    currentViewingRecord ={
        bookId: bookId,
        title: book.title || '제목 없음',
        author: book.author || '작자 미상',
        coverUrl: coverUrl,
        imageId: imageId,
        viewDate: targetDate,
        allReaders: allReadersForBook // 모든 독자 일정 저장
    };

    // 모달 내용 업데이트
    const coverEl = document.getElementById('recordCover');

    // 이미지 로드: imageId가 있으면 인증된 요청으로, 없으면 coverUrl 사용
    if (imageId) {
        // 로딩 상태 표시
        coverEl.innerHTML = `<div class="book-cover-placeholder"><h3>로딩중...</h3></div>`;
        // 인증된 요청으로 이미지 로드
        loadRecordCoverImage(coverEl, imageId, currentViewingRecord.title);
    } else if (coverUrl) {
        coverEl.innerHTML = `<img src="${coverUrl}" alt="${escapeHtml(currentViewingRecord.title)}" style="width: 100%; height: 100%; object-fit: cover;">`;
    } else {
        coverEl.innerHTML = `
            <div class="book-cover-placeholder">
                <h3>${escapeHtml(currentViewingRecord.title)}</h3>
            </div>
        `;
    }

    document.getElementById('recordTitle').textContent = currentViewingRecord.title;
    document.getElementById('recordAuthor').textContent = currentViewingRecord.author;

    // 모든 독자 일정 렌더링
    renderModalReadersList(allReadersForBook);

    // 항상 보기 모드로 시작
    switchToViewMode();

    // 모달 표시
    document.getElementById('recordDetailModal').style.display = 'flex';
}

// 스케줄 상세 모달 열기 (scheduleId 기반 - 새 Calendar API용)
function openScheduleDetail(scheduleId, dateStr) {
    // 캐시된 일간 스케줄에서 해당 scheduleId 찾기
    const targetDate = dateStr || selectedDate;
    const schedules = dailyRecordsCache[targetDate] || [];
    const schedule = schedules.find(s => s.scheduleId === scheduleId);

    if (!schedule) {
        showToast('일정을 찾을 수 없습니다.', 'error');
        return;
    }

    // 백엔드 응답 구조에서 데이터 추출
    const book = schedule.book || {};
    const reader = schedule.reader || {};
    const bookId = book.bookId;

    // readerId 캐시 업데이트
    if (reader.readerName && reader.readerId) {
        saveReaderIdToCache(reader.readerName, reader.readerId);
    }

    // 같은 책의 모든 스케줄 찾기
    const allSchedulesForBook = schedules.filter(s => {
        const sBook = s.book || {};
        return sBook.bookId === bookId;
    });

    // 이미지 정보 추출 (다양한 경로 지원 + 캐시 확인)
    let imageId = book.image?.imageId || book.imageId || null;
    let coverUrl = book.image?.imageUrl || book.coverUrl || book.cover || '';

    // 캐시에서 이미지 정보 가져오기 (API 응답에 이미지가 없는 경우)
    if (!imageId && !coverUrl && bookId) {
        const cachedImage = getBookImageFromCache(bookId);
        if (cachedImage) {
            imageId = cachedImage.imageId;
            coverUrl = cachedImage.coverUrl;
            console.log('[Calendar Debug] openScheduleDetail - 캐시에서 이미지 정보 사용:', bookId);
        }
    }

    console.log('[Calendar Debug] openScheduleDetail 이미지 정보:', { imageId, coverUrl, bookImage: book.image });

    // 현재 보고 있는 책 정보 저장 (수정/삭제용) - scheduleId 기반
    currentViewingRecord ={
        bookId: bookId,
        title: book.title || '제목 없음',
        author: book.author || '작자 미상',
        coverUrl: coverUrl,
        imageId: imageId,
        viewDate: targetDate,
        allSchedules: allSchedulesForBook, // scheduleId 기반 일정 목록
        useNewApi: true // 새 API 사용 플래그
    };

    // 모달 내용 업데이트
    const coverEl = document.getElementById('recordCover');

    // 이미지 로드: imageId가 있으면 인증된 요청으로, 없으면 coverUrl 사용
    if (imageId) {
        // 로딩 상태 표시
        coverEl.innerHTML = `<div class="book-cover-placeholder"><h3>로딩중...</h3></div>`;
        // 인증된 요청으로 이미지 로드
        loadRecordCoverImage(coverEl, imageId, currentViewingRecord.title);
    } else if (coverUrl) {
        coverEl.innerHTML = `<img src="${coverUrl}" alt="${escapeHtml(currentViewingRecord.title)}" style="width: 100%; height: 100%; object-fit: cover;">`;
    } else {
        coverEl.innerHTML = `
            <div class="book-cover-placeholder">
                <h3>${escapeHtml(currentViewingRecord.title)}</h3>
            </div>
        `;
    }

    document.getElementById('recordTitle').textContent = currentViewingRecord.title;
    document.getElementById('recordAuthor').textContent = currentViewingRecord.author;

    // 모든 스케줄 렌더링 (scheduleId 기반)
    renderModalScheduleList(allSchedulesForBook);

    // 항상 보기 모드로 시작
    switchToViewMode();

    // 모달 표시
    document.getElementById('recordDetailModal').style.display = 'flex';
}

// 모달 내 스케줄 목록 렌더링 (scheduleId 기반 - 새 Calendar API용)
function renderModalScheduleList(schedules) {
    const container = document.getElementById('modalReadersList');
    if (!container) return;

    const today = new Date().toISOString().split('T')[0];

    const html = schedules.map(s => {
        const reader = s.reader || {};
        const readerColor = reader.color || '#20B2AA';
        const readerName = reader.readerName || '본인';
        const startDate = s.startDate || '';
        const endDate = s.endDate || '';

        // 상태 계산 (API status 값 우선 사용)
        let status = 'reading';
        if (s.status === 'COMPLETED' || (endDate && endDate < today)) {
            status = 'completed';
        } else if (s.status === 'TO_READ' || startDate > today) {
            status = 'to_read';
        }

        // 배경색 계산
        const bgColor = hexToRgba(readerColor, 0.08);
        const borderColor = hexToRgba(readerColor, 0.3);

        return `
            <div class="modal-reader-item"
                 style="--reader-bg-color: ${bgColor}; --reader-border-color: ${borderColor};"
                 data-schedule-id="${s.scheduleId}">
                <div class="modal-reader-header">
                    <div class="modal-reader-dot" style="background: ${readerColor};"></div>
                    <span class="modal-reader-name">${escapeHtml(readerName)}</span>
                    <span class="modal-reader-status ${status}">${getStatusText(status)}</span>
                </div>
                <div class="modal-reader-dates">
                    <span><span class="date-label">시작:</span> ${startDate || '-'}</span>
                    <span><span class="date-label">완료:</span> ${endDate || '-'}</span>
                </div>
                <div class="modal-reader-actions">
                    <button type="button" class="btn-sm btn-edit-sm" onclick="startEditScheduleById(${s.scheduleId})">수정</button>
                    <button type="button" class="btn-sm btn-delete-sm" onclick="deleteScheduleById(${s.scheduleId})">삭제</button>
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = html;
}

// 모달 내 독자 목록 렌더링
function renderModalReadersList(readers) {
    const container = document.getElementById('modalReadersList');
    if (!container) return;

    const today = new Date().toISOString().split('T')[0];

    const html = readers.map(r => {
        const reader = r.reader || {};
        const readerColor = reader.color || '#20B2AA';
        const readerName = reader.readerName || '본인';
        const startDate = r.startDate || '';
        const endDate = r.endDate || '';

        // 상태 계산
        let status = 'reading';
        if (endDate && endDate < today) {
            status = 'completed';
        } else if (startDate > today) {
            status = 'to_read';
        }

        // 배경색 계산
        const bgColor = hexToRgba(readerColor, 0.08);
        const borderColor = hexToRgba(readerColor, 0.3);

        return `
            <div class="modal-reader-item"
                 style="--reader-bg-color: ${bgColor}; --reader-border-color: ${borderColor};"
                 data-details-id="${r.detailsId}">
                <div class="modal-reader-header">
                    <div class="modal-reader-dot" style="background: ${readerColor};"></div>
                    <span class="modal-reader-name">${escapeHtml(readerName)}</span>
                    <span class="modal-reader-status ${status}">${getStatusText(status)}</span>
                </div>
                <div class="modal-reader-dates">
                    <span><span class="date-label">시작:</span> ${startDate || '-'}</span>
                    <span><span class="date-label">완료:</span> ${endDate || '-'}</span>
                </div>
                <div class="modal-reader-actions">
                    <button type="button" class="btn-sm btn-edit-sm" onclick="startEditReader(${r.detailsId})">수정</button>
                    <button type="button" class="btn-sm btn-delete-sm" onclick="deleteReaderSchedule(${r.detailsId})">삭제</button>
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = html;
}

// HEX to RGBA 변환 헬퍼 함수
function hexToRgba(hex, alpha) {
    if (!hex) return `rgba(32, 178, 170, ${alpha})`;

    // # 제거
    hex = hex.replace('#', '');

    // 3자리 HEX 처리
    if (hex.length === 3) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }

    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// 기록 상세 모달 닫기
function closeRecordDetailModal() {
    document.getElementById('recordDetailModal').style.display = 'none';
    currentViewingRecord =null;
    currentEditingReader = null;
}

// 현재 수정 중인 독자 정보 (개별 독자 수정용)
let currentEditingReader = null;

// 특정 독자의 일정 수정 시작
function startEditReader(detailsId) {
    if (!currentViewingRecord || !currentViewingRecord.allReaders) return;

    // 해당 독자 찾기
    const readerRecord = currentViewingRecord.allReaders.find(r => r.detailsId === detailsId);
    if (!readerRecord) {
        showToast('독자 정보를 찾을 수 없습니다.', 'error');
        return;
    }

    // 현재 수정 중인 독자 저장
    currentEditingReader = {
        detailsId: readerRecord.detailsId,
        reader: readerRecord.reader,
        startDate: readerRecord.startDate,
        endDate: readerRecord.endDate
    };

    // 수정 모드로 전환
    switchToEditMode();
}

// 특정 스케줄의 수정 시작 (scheduleId 기반 - 새 Calendar API용)
function startEditScheduleById(scheduleId) {
    if (!currentViewingRecord || !currentViewingRecord.allSchedules) return;

    // 해당 스케줄 찾기
    const schedule = currentViewingRecord.allSchedules.find(s => s.scheduleId === scheduleId);
    if (!schedule) {
        showToast('일정 정보를 찾을 수 없습니다.', 'error');
        return;
    }

    // 현재 수정 중인 스케줄 저장 (scheduleId 기반)
    currentEditingReader = {
        scheduleId: schedule.scheduleId,  // scheduleId 사용
        reader: schedule.reader,
        startDate: schedule.startDate,
        endDate: schedule.endDate,
        useNewApi: true // 새 API 사용 플래그
    };

    // 수정 모드로 전환
    switchToEditMode();
}

// 특정 스케줄 삭제 (scheduleId 기반 - 새 Calendar API용)
// 다른 독자의 일정에 영향 없이 해당 일정만 삭제
async function deleteScheduleById(scheduleId) {
    if (!currentViewingRecord) return;

    // 해당 스케줄 찾기
    const schedule = currentViewingRecord.allSchedules?.find(s => s.scheduleId === scheduleId);
    const readerName = schedule?.reader?.readerName || '본인';

    const confirmed = await showConfirm(
        `"${currentViewingRecord.title}"에서 ${readerName}의 일정을 삭제하시겠습니까?`,
        '삭제',
        '취소',
        '일정 삭제'
    );

    if (!confirmed) return;

    try {
        console.log('[Debug] 스케줄 삭제 시도 (새 API) - scheduleId:', scheduleId);

        // 새 Calendar Schedule API 사용 - 해당 일정만 삭제, 다른 독자에게 영향 없음
        const response = await apiClient.deleteCalendarSchedule(scheduleId);

        if (response.success || response.data || !response.error) {
            showToast(`${readerName}의 일정이 삭제되었습니다.`, 'success');

            // 남은 스케줄이 없으면 모달 닫기
            const remainingSchedules = currentViewingRecord.allSchedules.filter(s => s.scheduleId !== scheduleId);
            if (remainingSchedules.length === 0) {
                closeRecordDetailModal();
            } else {
                // 남은 스케줄 목록 업데이트
                currentViewingRecord.allSchedules = remainingSchedules;
                renderModalScheduleList(remainingSchedules);
            }

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
        console.error('스케줄 삭제 실패:', error);
        showToast(error.message || '일정 삭제에 실패했습니다.', 'error');
    }
}

// 특정 독자의 일정 삭제
async function deleteReaderSchedule(detailsId) {
    if (!currentViewingRecord) return;

    // 해당 독자 찾기
    const readerRecord = currentViewingRecord.allReaders?.find(r => r.detailsId === detailsId);
    const readerName = readerRecord?.reader?.readerName || '본인';

    const confirmed = await showConfirm(
        `"${currentViewingRecord.title}"에서 ${readerName}의 일정을 삭제하시겠습니까?`,
        '삭제',
        '취소',
        '일정 삭제'
    );

    if (!confirmed) return;

    try {
        const bookId = currentViewingRecord.bookId;

        console.log('[Debug] 일정 삭제 시도 - detailsId:', detailsId, 'bookId:', bookId);

        // 도서 정보 조회
        const bookInfo = await apiClient.getBook(bookId);
        const existingDetails = bookInfo.data?.bookDetails || [];

        // 삭제할 일정을 제외한 나머지만 유지
        const remainingDetails = existingDetails
            .filter(detail => detail.bookDetailsId !== detailsId)
            .map(detail => {
                const readerResponse = detail.readerResponse || {};
                const keepItem = {
                    startDate: detail.startDate,
                    endDate: detail.endDate
                };

                if (readerResponse.childId) {
                    keepItem.childId = readerResponse.childId;
                }
                if (readerResponse.readerId) {
                    keepItem.readerId = readerResponse.readerId;
                }

                return keepItem;
            });

        console.log('[Debug] 남은 일정:', JSON.stringify(remainingDetails, null, 2));

        // updateBook API로 남은 일정만 다시 등록
        const bookUpdateData = {
            title: currentViewingRecord.title,
            author: currentViewingRecord.author,
            coverUrl: currentViewingRecord.coverUrl || null,
            bookDetailsUpdate: remainingDetails
        };

        const response = await apiClient.updateBook(bookId, bookUpdateData);

        if (response.success || response.data || !response.error) {
            showToast(`${readerName}의 일정이 삭제되었습니다.`, 'success');

            // 남은 독자가 없으면 모달 닫기
            if (remainingDetails.length === 0) {
                closeRecordDetailModal();
            } else {
                // 남은 독자 목록 업데이트
                const updatedReaders = currentViewingRecord.allReaders.filter(r => r.detailsId !== detailsId);
                currentViewingRecord.allReaders = updatedReaders;
                renderModalReadersList(updatedReaders);
            }

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
    }
}

// 보기 모드로 전환
function switchToViewMode() {
    document.getElementById('recordViewMode').style.display = 'block';
    document.getElementById('recordEditMode').style.display = 'none';
    // 수정 중인 독자 정보 초기화
    currentEditingReader = null;
}

// 수정 모드로 전환
function switchToEditMode() {
    if (!currentViewingRecord || !currentEditingReader) return;

    // 독자 드롭다운 초기화 및 현재 독자 기본값 설정
    initEditReaderDropdown();

    // Flatpickr 날짜 선택기 초기화
    initEditDatePickers();

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

// 수정 저장 (새 API와 기존 API 모두 지원)
async function saveScheduleEdit() {
    if (!currentViewingRecord || !currentEditingReader) return;

    // 상태는 날짜 기반으로 백엔드에서 자동 계산됨
    // Flatpickr에서 날짜 가져오기
    const newStartDate = editStartPicker ? editStartPicker.selectedDates[0] : null;
    const newEndDate = editEndPicker ? editEndPicker.selectedDates[0] : null;
    const startDateStr = newStartDate ? formatDateToString(newStartDate) : '';
    const endDateStr = newEndDate ? formatDateToString(newEndDate) : '';
    const selectedReaderValue = document.getElementById('editReader').value;

    if (!startDateStr) {
        showToast('시작일을 입력해주세요.', 'error');
        return;
    }

    // 완료일이 시작일보다 이전인지 검사 (Flatpickr가 이미 처리하지만 이중 확인)
    if (newEndDate && newStartDate && newEndDate < newStartDate) {
        showToast('완료일은 시작일보다 이전일 수 없습니다.', 'error');
        return;
    }

    if (!selectedReaderValue) {
        showToast('독자를 선택해주세요.', 'error');
        return;
    }

    const saveBtn = document.getElementById('editSaveBtn');
    saveBtn.disabled = true;
    saveBtn.textContent = '저장 중...';

    try {
        // 선택된 독자의 childId 결정 (본인이면 null, 자녀면 childId)
        const newChildId = selectedReaderValue === 'user' ? null : parseInt(selectedReaderValue);

        // 새 Calendar Schedule API 사용 여부 확인
        if (currentEditingReader.useNewApi && currentEditingReader.scheduleId) {
            // ============ 새 Calendar Schedule API 사용 ============
            const scheduleId = currentEditingReader.scheduleId;

            console.log('[Debug] 일정 수정 요청 (새 API) - scheduleId:', scheduleId);

            // 새 API 형식에 맞게 데이터 구성
            const updateData = {
                childId: newChildId,
                startDate: startDateStr,
                endDate: endDateStr || null
            };

            console.log('[Debug] 수정 요청 데이터 (새 API):', updateData);

            // 새 Calendar Schedule API 사용 - 해당 일정만 수정, 다른 독자에게 영향 없음
            const response = await apiClient.updateCalendarSchedule(scheduleId, updateData);

            if (response.success || response.data || !response.error) {
                showToast('독서 일정이 수정되었습니다!', 'success');
                closeRecordDetailModal();

                // 캘린더 새로고침
                calendar.refetchEvents();

                // 해당 날짜 선택
                selectDate(startDateStr);
                highlightSelectedDate(startDateStr);
            } else {
                throw new Error(response.message || '일정 수정에 실패했습니다.');
            }
        } else {
            // ============ 기존 updateBook API 사용 (레거시) ============
            // 독자가 변경되었는지 확인 (currentEditingReader 사용)
            const originalReaderName = currentEditingReader.reader?.readerName || '';
            let newReaderName = '';
            if (newChildId === null) {
                newReaderName = currentUserInfo?.nickname || currentUserInfo?.username || currentUserInfo?.name || '';
            } else {
                const child = childrenData.find(c => (c.childId || c.id) === newChildId);
                newReaderName = child?.childName || child?.name || '';
            }
            const isReaderChanged = newReaderName !== originalReaderName;

            // currentEditingReader에서 detailsId 가져오기
            const detailsId = currentEditingReader.detailsId;
            const bookId = currentViewingRecord.bookId;

            console.log('[Debug] 일정 수정 요청 (레거시) - detailsId:', detailsId, 'bookId:', bookId);
            console.log('[Debug] 독자 변경:', isReaderChanged, '(', originalReaderName, '->', newReaderName, ')');

            // updateBook API 사용 (book-details API가 지원되지 않음)
            // 기존 도서 정보 조회
            const bookInfo = await apiClient.getBook(bookId);
            const existingDetails = bookInfo.data?.bookDetails || [];

            console.log('[Debug] 기존 일정:', existingDetails.map(d => ({
                id: d.bookDetailsId,
                reader: d.readerResponse?.readerName,
                readerId: d.readerResponse?.readerId,
                childId: d.readerResponse?.childId
            })));

            // 수정할 일정만 새 값으로, 나머지는 기존 정보 유지 (readerId 포함)
            const bookDetailsUpdate = existingDetails.map(detail => {
                const readerResponse = detail.readerResponse || {};

                if (detail.bookDetailsId === detailsId) {
                    // 수정할 일정
                    const updateItem = {
                        startDate: startDateStr,
                        endDate: endDateStr || null
                    };

                    if (isReaderChanged) {
                        // 독자가 변경된 경우: 새 독자의 childId 사용
                        updateItem.childId = newChildId;
                        // 새 독자의 기존 readerId 찾기 (있으면)
                        const existingNewReader = existingDetails.find(d => {
                            if (newChildId === null) {
                                return !d.readerResponse?.childId;
                            } else {
                                return d.readerResponse?.childId === newChildId;
                            }
                        });
                        if (existingNewReader?.readerResponse?.readerId) {
                            updateItem.readerId = existingNewReader.readerResponse.readerId;
                        }
                    } else {
                        // 독자가 변경되지 않은 경우: 기존 정보 유지
                        if (readerResponse.childId) {
                            updateItem.childId = readerResponse.childId;
                        }
                        if (readerResponse.readerId) {
                            updateItem.readerId = readerResponse.readerId;
                        }
                    }

                    return updateItem;
                } else {
                    // 다른 일정은 기존 정보 그대로 유지 (readerId 포함!)
                    const keepItem = {
                        startDate: detail.startDate,
                        endDate: detail.endDate
                    };

                    // 기존 독자 정보 유지
                    if (readerResponse.childId) {
                        keepItem.childId = readerResponse.childId;
                    }
                    if (readerResponse.readerId) {
                        keepItem.readerId = readerResponse.readerId;
                    }

                    return keepItem;
                }
            });

            const bookUpdateData = {
                title: currentViewingRecord.title,
                author: currentViewingRecord.author,
                coverUrl: currentViewingRecord.coverUrl || null,
                bookDetailsUpdate: bookDetailsUpdate
            };

            console.log('[Debug] 수정 요청 데이터 (레거시):', JSON.stringify(bookUpdateData, null, 2));

            const response = await apiClient.updateBook(bookId, bookUpdateData);

            if (response.success || response.data || !response.error) {
                showToast('독서 일정이 수정되었습니다!', 'success');
                closeRecordDetailModal();

                // 캘린더 새로고침
                calendar.refetchEvents();

                // 해당 날짜 선택
                selectDate(startDateStr);
                highlightSelectedDate(startDateStr);
            } else {
                throw new Error(response.message || '일정 수정에 실패했습니다.');
            }
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
        const detailsId = currentViewingRecord.detailsId;
        const bookId = currentViewingRecord.bookId;

        console.log('[Debug] 일정 삭제 시도 - detailsId:', detailsId, 'bookId:', bookId);

        // 도서 정보 조회
        const bookInfo = await apiClient.getBook(bookId);
        const existingDetails = bookInfo.data?.bookDetails || [];

        console.log('[Debug] 기존 일정:', existingDetails.map(d => ({
            id: d.bookDetailsId,
            reader: d.readerResponse?.readerName,
            readerId: d.readerResponse?.readerId,
            childId: d.readerResponse?.childId
        })));

        // 삭제할 일정을 제외한 나머지만 유지 (readerId 포함!)
        const remainingDetails = existingDetails
            .filter(detail => detail.bookDetailsId !== detailsId)
            .map(detail => {
                const readerResponse = detail.readerResponse || {};
                const keepItem = {
                    startDate: detail.startDate,
                    endDate: detail.endDate
                };

                // 기존 독자 정보 유지 (readerId 포함)
                if (readerResponse.childId) {
                    keepItem.childId = readerResponse.childId;
                }
                if (readerResponse.readerId) {
                    keepItem.readerId = readerResponse.readerId;
                }

                return keepItem;
            });

        console.log('[Debug] 남은 일정 (readerId 포함):', JSON.stringify(remainingDetails, null, 2));

        // updateBook API로 남은 일정만 다시 등록
        const bookUpdateData = {
            title: currentViewingRecord.title,
            author: currentViewingRecord.author,
            coverUrl: currentViewingRecord.coverUrl || null,
            bookDetailsUpdate: remainingDetails
        };

        const response = await apiClient.updateBook(bookId, bookUpdateData);
        console.log('[Debug] updateBook 응답:', response);

        if (response.success || response.data || !response.error) {
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

// 날짜를 YYYY-MM-DD 문자열로 변환
function formatDateToString(date) {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

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
            currentUserInfo =userResponse.data;
        } else if (userResponse && !userResponse.success) {
            currentUserInfo =null;
        } else {
            currentUserInfo =userResponse;
        }
    } catch (error) {
        console.error('사용자 정보 로드 실패:', error);
        currentUserInfo =null;
    }

    try {
        // 자녀 목록 로드
        const childrenResponse = await apiClient.getChildren();

        if (childrenResponse.success && childrenResponse.data) {
            childrenData =childrenResponse.data;
        } else if (childrenResponse.data && Array.isArray(childrenResponse.data)) {
            childrenData =childrenResponse.data;
        } else if (Array.isArray(childrenResponse)) {
            childrenData =childrenResponse;
        } else {
            childrenData =[];
        }
    } catch (error) {
        console.error('자녀 목록 로드 실패:', error);
        childrenData =[];
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

// ==================== 독자 선택 드롭다운 (다중 독자 지원) ====================

// 현재 등록된 독자 행 인덱스
let readerRowIndex = 0;
// 독자별 Flatpickr 인스턴스 저장
let readerDatePickers = {};

// 다중 독자 선택 드롭다운 초기화
function initReaderDropdown() {
    const container = document.getElementById('readerDetailsContainer');
    if (!container) return;

    // 컨테이너 초기화
    container.innerHTML = '';
    readerRowIndex =0;
    readerDatePickers ={};

    // 첫 번째 독자 행 추가
    addReaderRow();
}

// 독자 행 추가
function addReaderRow() {
    const container = document.getElementById('readerDetailsContainer');
    if (!container) return;

    const rowIndex = readerRowIndex++;
    const dropDate = pendingSchedule?.date || new Date().toISOString().split('T')[0];

    // 독자 옵션 HTML 생성
    let optionsHtml = '<option value="">독자 선택</option>';

    // 본인 옵션
    if (currentUserInfo) {
        const userName = currentUserInfo.nickname || currentUserInfo.username || currentUserInfo.name || '본인';
        const userColor = currentUserInfo.color || '#20B2AA';
        optionsHtml += `<option value="user" data-color="${userColor}">${userName} (본인)</option>`;
    }

    // 자녀 옵션
    if (childrenData && childrenData.length > 0) {
        childrenData.forEach(child => {
            const childId = child.childId || child.id;
            const childName = child.childName || child.name || '자녀';
            const childColor = child.color || '#FFB6C1';
            const birthOrder = child.birthOrder;

            let displayText = childName;
            if (birthOrder) {
                const orderText = getKoreanOrdinal(birthOrder);
                displayText = `${childName} (자녀, ${orderText})`;
            } else {
                displayText = `${childName} (자녀)`;
            }
            optionsHtml += `<option value="${childId}" data-color="${childColor}">${displayText}</option>`;
        });
    }

    // 행 HTML
    const rowHtml = `
        <div class="reader-detail-row" data-row-index="${rowIndex}">
            <select class="form-select reader-select" data-row="${rowIndex}">
                ${optionsHtml}
            </select>
            <input type="text" class="date-input start-date" data-row="${rowIndex}" placeholder="시작일" readonly>
            <span class="date-separator">~</span>
            <input type="text" class="date-input end-date" data-row="${rowIndex}" placeholder="완료일" readonly>
            <button type="button" class="btn-remove-reader" data-row="${rowIndex}" title="삭제"${rowIndex === 0 ? ' style="visibility: hidden;"' : ''}>×</button>
        </div>
    `;

    container.insertAdjacentHTML('beforeend', rowHtml);

    // Flatpickr 초기화
    const row = container.querySelector(`[data-row-index="${rowIndex}"]`);
    const startInput = row.querySelector('.start-date');
    const endInput = row.querySelector('.end-date');

    const startPicker = flatpickr(startInput, {
        locale: 'ko',
        dateFormat: 'Y-m-d',
        defaultDate: dropDate,
        allowInput: false,
        disableMobile: true,
        onChange: function(selectedDates, dateStr) {
            if (readerDatePickers[rowIndex]?.end) {
                readerDatePickers[rowIndex].end.set('minDate', dateStr);
                const endDate = readerDatePickers[rowIndex].end.selectedDates[0];
                if (endDate && endDate < selectedDates[0]) {
                    readerDatePickers[rowIndex].end.clear();
                }
            }
        }
    });

    const endPicker = flatpickr(endInput, {
        locale: 'ko',
        dateFormat: 'Y-m-d',
        defaultDate: dropDate,
        minDate: dropDate,
        allowInput: false,
        disableMobile: true
    });

    readerDatePickers[rowIndex] = { start: startPicker, end: endPicker };

    // 삭제 버튼 이벤트
    const removeBtn = row.querySelector('.btn-remove-reader');
    removeBtn.addEventListener('click', function() {
        removeReaderRow(rowIndex);
    });

    // 첫 번째 행의 삭제 버튼 표시 상태 업데이트
    updateRemoveButtonVisibility();
}

// 독자 행 삭제
function removeReaderRow(rowIndex) {
    const container = document.getElementById('readerDetailsContainer');
    const row = container.querySelector(`[data-row-index="${rowIndex}"]`);

    if (row) {
        // Flatpickr 인스턴스 정리
        if (readerDatePickers[rowIndex]) {
            readerDatePickers[rowIndex].start?.destroy();
            readerDatePickers[rowIndex].end?.destroy();
            delete readerDatePickers[rowIndex];
        }
        row.remove();
    }

    // 삭제 버튼 표시 상태 업데이트
    updateRemoveButtonVisibility();
}

// 삭제 버튼 표시 상태 업데이트 (행이 1개면 숨김)
function updateRemoveButtonVisibility() {
    const container = document.getElementById('readerDetailsContainer');
    const rows = container.querySelectorAll('.reader-detail-row');

    rows.forEach((row, index) => {
        const removeBtn = row.querySelector('.btn-remove-reader');
        if (removeBtn) {
            removeBtn.style.visibility = rows.length > 1 ? 'visible' : 'hidden';
        }
    });
}

// 모든 독자 일정 데이터 수집
function collectReaderSchedules() {
    const container = document.getElementById('readerDetailsContainer');
    const rows = container.querySelectorAll('.reader-detail-row');
    const schedules = [];

    rows.forEach(row => {
        const rowIndex = row.dataset.rowIndex;
        const select = row.querySelector('.reader-select');
        const readerValue = select.value;

        if (!readerValue) return; // 선택 안된 행은 스킵

        const startDate = readerDatePickers[rowIndex]?.start?.selectedDates[0];
        const endDate = readerDatePickers[rowIndex]?.end?.selectedDates[0];

        schedules.push({
            readerValue: readerValue,
            childId: readerValue === 'user' ? null : parseInt(readerValue),
            startDate: startDate ? formatDateToString(startDate) : '',
            endDate: endDate ? formatDateToString(endDate) : ''
        });
    });

    return schedules;
}

// ==================== 수정 모달 독자 드롭다운 ====================

// Flatpickr 인스턴스 (수정 모달용)
let editStartPicker = null;
let editEndPicker = null;

// 수정 모달용 독자 선택 드롭다운 초기화 (select 방식)
function initEditReaderDropdown() {
    const selectEl = document.getElementById('editReader');
    const colorIndicator = document.getElementById('editReaderColorIndicator');

    if (!selectEl) return;

    // 옵션 초기화
    selectEl.innerHTML = '<option value="">선택 안 함</option>';

    // 현재 수정 중인 독자 정보 (currentEditingReader 우선, 없으면 레거시 지원)
    const currentReader = currentEditingReader?.reader || currentViewingRecord?.reader || {};
    const currentReaderName = currentReader.readerName || '';

    // 본인 옵션
    if (currentUserInfo) {
        const userName = currentUserInfo.nickname || currentUserInfo.username || currentUserInfo.name || '본인';
        const userColor = currentUserInfo.color || '#20B2AA';
        const isSelected = currentReaderName === userName;

        const option = document.createElement('option');
        option.value = 'user';
        option.textContent = `${userName} (본인)`;
        option.dataset.color = userColor;
        option.dataset.readerName = userName;
        if (isSelected) option.selected = true;
        selectEl.appendChild(option);
    }

    // 자녀 옵션
    if (childrenData && childrenData.length > 0) {
        childrenData.forEach(child => {
            const childId = child.childId || child.id;
            const childName = child.childName || child.name || '자녀';
            const childColor = child.color || '#FFB6C1';
            const birthOrder = child.birthOrder;
            const isSelected = currentReaderName === childName;

            // 표시 형식
            let displayText = childName;
            if (birthOrder) {
                const orderText = getKoreanOrdinal(birthOrder);
                displayText = `${childName} (자녀, ${orderText})`;
            } else {
                displayText = `${childName} (자녀)`;
            }

            const option = document.createElement('option');
            option.value = childId;
            option.textContent = displayText;
            option.dataset.color = childColor;
            option.dataset.readerName = childName;
            if (isSelected) option.selected = true;
            selectEl.appendChild(option);
        });
    }

    // 색상 인디케이터 업데이트
    updateEditReaderColorIndicator();

    // 선택 변경 이벤트
    selectEl.addEventListener('change', updateEditReaderColorIndicator);
}

// 독자 색상 인디케이터 업데이트
function updateEditReaderColorIndicator() {
    const selectEl = document.getElementById('editReader');
    const colorIndicator = document.getElementById('editReaderColorIndicator');

    if (!selectEl || !colorIndicator) return;

    const selectedOption = selectEl.options[selectEl.selectedIndex];

    if (selectedOption && selectedOption.value) {
        const color = selectedOption.dataset.color || '#20B2AA';
        const name = selectedOption.dataset.readerName || selectedOption.textContent;
        const initial = name.charAt(0);

        colorIndicator.innerHTML = `
            <div class="color-badge" style="background: ${color};">
                <span class="color-badge-text">${initial}</span>
            </div>
            <span class="color-label">${name}</span>
        `;
        colorIndicator.classList.add('show');
    } else {
        colorIndicator.innerHTML = '';
        colorIndicator.classList.remove('show');
    }
}

// 수정 모달용 Flatpickr 초기화
function initEditDatePickers() {
    const startInput = document.getElementById('editRecordStartDate');
    const endInput = document.getElementById('editRecordEndDate');

    // 기존 인스턴스 제거
    if (editStartPicker) {
        editStartPicker.destroy();
        editStartPicker =null;
    }
    if (editEndPicker) {
        editEndPicker.destroy();
        editEndPicker =null;
    }

    const flatpickrConfig = {
        locale: 'ko',
        dateFormat: 'Y-m-d',
        allowInput: false,
        disableMobile: true
    };

    // 현재 수정 중인 독자의 날짜 정보 (currentEditingReader 우선)
    const startDate = currentEditingReader?.startDate || currentViewingRecord?.startDate || null;
    const endDate = currentEditingReader?.endDate || currentViewingRecord?.endDate || null;

    // 시작일 picker
    if (startInput) {
        editStartPicker =flatpickr(startInput, {
            ...flatpickrConfig,
            defaultDate: startDate,
            onChange: function(selectedDates, dateStr) {
                // 종료일의 최소값을 시작일로 설정
                if (editEndPicker) {
                    editEndPicker.set('minDate', dateStr);
                    // 종료일이 시작일보다 이전이면 초기화
                    const endDateVal = editEndPicker.selectedDates[0];
                    if (endDateVal && endDateVal < selectedDates[0]) {
                        editEndPicker.clear();
                    }
                }
            }
        });
    }

    // 종료일 picker
    if (endInput) {
        editEndPicker =flatpickr(endInput, {
            ...flatpickrConfig,
            defaultDate: endDate,
            minDate: startDate
        });
    }
}

// ==================== 인증된 이미지 로드 ====================

/**
 * data-image-id 속성을 가진 이미지들을 인증된 요청으로 로드
 * @param {HTMLElement} container - 이미지를 찾을 컨테이너
 */
async function loadAuthImages(container) {
    if (!container) return;

    const authImages = container.querySelectorAll('img.auth-image[data-image-id]');
    console.log('[Calendar Debug] loadAuthImages - 찾은 auth-image 개수:', authImages.length);

    for (const img of authImages) {
        const imageId = img.dataset.imageId;
        if (!imageId) {
            console.log('[Calendar Debug] loadAuthImages - imageId 없음, 스킵');
            continue;
        }

        console.log('[Calendar Debug] loadAuthImages - 이미지 로드 시도:', imageId);

        try {
            const blobUrl = await apiClient.getBoardImage(imageId);
            console.log('[Calendar Debug] loadAuthImages - 이미지 로드 성공:', imageId);
            img.src = blobUrl;
            img.classList.remove('auth-image');
        } catch (error) {
            console.error('[Calendar Debug] 이미지 로드 실패:', imageId, error);
            // 실패 시 플레이스홀더로 대체
            const placeholder = document.createElement('div');
            placeholder.className = 'cover-placeholder';
            placeholder.textContent = img.alt?.substring(0, 4) || '책';
            if (img.parentNode) {
                img.parentNode.replaceChild(placeholder, img);
            }
        }
    }
}

/**
 * 상세보기 모달 커버 이미지 로드 (인증된 요청)
 * @param {HTMLElement} coverEl - 커버 이미지 컨테이너
 * @param {number} imageId - 이미지 ID
 * @param {string} title - 책 제목 (fallback용)
 */
async function loadRecordCoverImage(coverEl, imageId, title) {
    console.log('[Calendar Debug] loadRecordCoverImage - 이미지 로드 시도:', imageId);
    try {
        const blobUrl = await apiClient.getBoardImage(imageId);
        console.log('[Calendar Debug] loadRecordCoverImage - 이미지 로드 성공:', imageId);
        coverEl.innerHTML = `<img src="${blobUrl}" alt="${escapeHtml(title)}" style="width: 100%; height: 100%; object-fit: cover;">`;
    } catch (error) {
        console.error('[Calendar Debug] 상세보기 이미지 로드 실패:', imageId, error);
        coverEl.innerHTML = `
            <div class="book-cover-placeholder">
                <h3>${escapeHtml(title)}</h3>
            </div>
        `;
    }
}

// ==================== 책 이미지 캐시 ====================

/**
 * 책 목록에서 이미지 정보를 캐시에 저장
 * @param {Array} books - 책 목록
 */
function updateBookImageCache(books) {
    if (!books || !Array.isArray(books)) return;

    books.forEach(book => {
        const bookId = book.bookId || book.id;
        if (!bookId) return;

        const imageId = book.image?.imageId || book.imageId || null;
        const coverUrl = book.image?.imageUrl || book.coverUrl || book.cover || '';

        if (imageId || coverUrl) {
            bookImageCache[bookId] = { imageId, coverUrl };
            console.log('[Calendar Debug] 이미지 캐시 저장:', bookId, { imageId, coverUrl: coverUrl ? '있음' : '없음' });
        }
    });
}

/**
 * 캐시에서 책 이미지 정보 조회
 * @param {number} bookId - 책 ID
 * @returns {Object|null} { imageId, coverUrl } 또는 null
 */
function getBookImageFromCache(bookId) {
    return bookImageCache[bookId] || null;
}

// ==================== 색상 유틸리티 ====================

/**
 * HEX 색상을 RGBA로 변환
 * @param {string} hex - HEX 색상 코드 (예: #FF5733 또는 #F53)
 * @param {number} alpha - 투명도 (0-1)
 * @returns {string} RGBA 색상 문자열
 */
function hexToRgba(hex, alpha = 1) {
    if (!hex) return `rgba(32, 178, 170, ${alpha})`; // 기본 색상

    // # 제거
    hex = hex.replace('#', '');

    // 3자리 HEX를 6자리로 변환
    if (hex.length === 3) {
        hex = hex.split('').map(c => c + c).join('');
    }

    // RGB 값 추출
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
