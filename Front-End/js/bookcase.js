/* ========================================
   전역 변수
======================================== */
let booksData = []; // 도서 데이터 저장
let currentBookId = null; // 현재 선택된 도서 ID (DB ID)
let childrenData = []; // 자녀 목록 데이터
let currentUserInfo = null; // 현재 사용자 정보
let manualBookImageId = null; // 직접 입력 도서의 업로드된 이미지 ID
let editBookImageId = null; // 수정 모달의 업로드된 이미지 ID
let editImageRemoved = false; // 수정 모달에서 이미지가 명시적으로 제거되었는지

/* ========================================
   readerId 캐시 (localStorage)
======================================== */
const READER_CACHE_KEY = 'readerIdCache';

function saveReaderIdToCache(readerName, readerId) {
    if (!readerName || !readerId) return;
    try {
        const cache = JSON.parse(localStorage.getItem(READER_CACHE_KEY) || '{}');
        cache[readerName] = readerId;
        localStorage.setItem(READER_CACHE_KEY, JSON.stringify(cache));
    } catch (e) {
        console.log('[Cache] 저장 실패:', e);
    }
}

function getReaderIdFromCache(readerName) {
    if (!readerName) return null;
    try {
        const cache = JSON.parse(localStorage.getItem(READER_CACHE_KEY) || '{}');
        return cache[readerName] || null;
    } catch (e) {
        return null;
    }
}

/* ========================================
   페이지 초기화
======================================== */
document.addEventListener('DOMContentLoaded', function() {
    initSearchFunction();
    initAddBookModal();
    initBookDetailModal();
    initEditBookModal();
    initDeleteBookModal();
    initBookClickEvent();
    initManualBookForm();

    // DB에서 데이터 로드
    loadBooksFromDB();
    loadReadersData();
});

/* ========================================
   DB에서 도서 목록 로드
======================================== */
async function loadBooksFromDB() {
    try {
        const response = await apiClient.getBooks();

        // 응답 구조에 따라 데이터 추출
        let books = [];
        if (response.success && response.data) {
            books = Array.isArray(response.data) ? response.data : [response.data];
        } else if (Array.isArray(response)) {
            books = response;
        }

        booksData = books;

        // 그리드 초기화 및 렌더링
        renderBooksGrid();

    } catch (error) {
        console.error('도서 목록 로드 실패:', error);
        // 로그인이 필요한 경우 처리
        if (error.status === 401) {
            showToast('도서 목록을 보려면 로그인이 필요합니다.', 'warning');
        } else {
            showToast('도서 목록을 불러오는데 실패했습니다.', 'error');
        }
        updateBookCount(0);
    }
}

/* ========================================
   도서 그리드 렌더링
======================================== */
function renderBooksGrid() {
    const booksGrid = document.getElementById('booksGrid');
    const emptyBooks = document.getElementById('emptyBooks');

    // 기존 book-item들 제거 (emptyBooks 제외)
    const existingItems = booksGrid.querySelectorAll('.book-item');
    existingItems.forEach(item => item.remove());

    if (booksData.length === 0) {
        if (emptyBooks) emptyBooks.style.display = 'block';
        updateBookCount(0);
        return;
    }

    if (emptyBooks) emptyBooks.style.display = 'none';

    // 도서 렌더링
    booksData.forEach(book => {
        const bookElement = createBookElement(book);
        booksGrid.appendChild(bookElement);
    });

    updateBookCount(booksData.length);

    // 인증이 필요한 이미지들 로드
    loadAuthenticatedImages();
}

/* ========================================
   인증이 필요한 이미지 로드
======================================== */
async function loadAuthenticatedImages() {
    const authImages = document.querySelectorAll('img.auth-image[data-image-id]');

    for (const img of authImages) {
        const imageId = img.dataset.imageId;
        if (!imageId) continue;

        try {
            const blobUrl = await apiClient.getBoardImage(imageId);
            img.src = blobUrl;
        } catch (error) {
            console.error(`이미지 로드 실패 (ID: ${imageId}):`, error);
            // 실패 시 placeholder 표시
            const parent = img.parentElement;
            if (parent) {
                const title = img.alt || '이미지';
                parent.innerHTML = `<div class="book-cover-placeholder blue"><h3>${title}</h3></div>`;
            }
        }
    }
}

/* ========================================
   도서 요소 생성
======================================== */
function createBookElement(book) {
    const bookItem = document.createElement('div');
    bookItem.className = 'book-item';
    bookItem.setAttribute('data-category', 'literature');
    bookItem.setAttribute('data-book-id', book.bookId || book.id);

    // 이미지 URL 결정: imageId가 있으면 API로 불러오고, 없으면 coverUrl 사용
    let coverHtml;
    if (book.image?.imageId) {
        // imageId가 있으면 인증된 요청으로 이미지 로드 (나중에 비동기로 교체)
        coverHtml = `<img data-image-id="${book.image.imageId}" alt="${book.title}" style="width: 100%; height: 100%; object-fit: cover;" class="auth-image">`;
    } else if (book.coverUrl) {
        coverHtml = `<img src="${book.coverUrl}" alt="${book.title}" style="width: 100%; height: 100%; object-fit: cover;">`;
    } else {
        coverHtml = `<div class="book-cover-placeholder blue"><h3>${book.title}</h3></div>`;
    }

    const meta = [book.author, book.publisher, book.publicationYear]
        .filter(Boolean)
        .join(' | ');

    bookItem.innerHTML = `
        <div class="book-cover">
            ${coverHtml}
        </div>
        <div class="book-info">
            <h4 class="book-title">${book.title}</h4>
            <p class="book-meta">${meta || '정보 없음'}</p>
            <div class="book-rating">
                <span class="star">⭐</span>
                <span class="star">⭐</span>
                <span class="star">⭐</span>
                <span class="star">⭐</span>
                <span class="star">⭐</span>
            </div>
            <p class="book-summary">${book.description || '책에 대한 소개가 없습니다.'}</p>
        </div>
    `;

    return bookItem;
}

/* ========================================
   도서 개수 업데이트
======================================== */
function updateBookCount(count) {
    const countElement = document.getElementById('book-count');
    if (countElement) {
        countElement.textContent = count;
    }

    const emptyBooks = document.getElementById('emptyBooks');
    if (emptyBooks) {
        emptyBooks.style.display = count === 0 ? 'block' : 'none';
    }
}

/* ========================================
   검색 기능 초기화
======================================== */
function initSearchFunction() {
    const searchInput = document.querySelector('.search-input');
    const searchBtn = document.querySelector('.search-btn');

    if (searchBtn && searchInput) {
        searchBtn.addEventListener('click', function() {
            performSearch(searchInput.value);
        });

        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performSearch(this.value);
            }
        });
    }
}

/* ========================================
   검색 실행
======================================== */
function performSearch(query) {
    const bookItems = document.querySelectorAll('.book-item');
    const searchQuery = query.toLowerCase().trim();
    let visibleCount = 0;

    if (!searchQuery) {
        // 검색어가 없으면 모든 도서 표시
        bookItems.forEach(book => book.classList.remove('hidden'));
        updateBookCount(bookItems.length);
        return;
    }

    bookItems.forEach(book => {
        const titleEl = book.querySelector('.book-title');
        const metaEl = book.querySelector('.book-meta');
        const summaryEl = book.querySelector('.book-summary');

        if (!titleEl || !metaEl || !summaryEl) {
            return;
        }

        const title = titleEl.textContent.toLowerCase();
        const meta = metaEl.textContent.toLowerCase();
        const summary = summaryEl.textContent.toLowerCase();

        if (title.includes(searchQuery) || meta.includes(searchQuery) || summary.includes(searchQuery)) {
            book.classList.remove('hidden');
            visibleCount++;
        } else {
            book.classList.add('hidden');
        }
    });

    updateBookCount(visibleCount);
}

/* ========================================
   도서 등록 모달 초기화
======================================== */
function initAddBookModal() {
    const addBookBtn = document.querySelector('.add-book-btn');
    const modal = document.getElementById('addBookModal');
    const closeBtn = document.getElementById('addBookModalClose');
    const tabBtns = document.querySelectorAll('.add-book-tabs .tab-btn');
    const bookSearchBtn = document.getElementById('bookSearchBtn');
    const bookSearchInput = document.getElementById('bookSearchInput');
    const manualBookForm = document.getElementById('manualBookForm');

    if (addBookBtn) {
        addBookBtn.addEventListener('click', openAddBookModal);
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', closeAddBookModal);
    }

    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeAddBookModal();
            }
        });
    }

    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const tab = this.getAttribute('data-tab');
            switchTab(tab);
        });
    });

    if (bookSearchBtn) {
        bookSearchBtn.addEventListener('click', function() {
            const query = bookSearchInput.value.trim();
            if (query) {
                searchBooksFromLibrary(query);
            } else {
                showToast('검색어를 입력해주세요.', 'warning');
            }
        });
    }

    if (bookSearchInput) {
        bookSearchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                const query = this.value.trim();
                if (query) {
                    searchBooksFromLibrary(query);
                }
            }
        });
    }

    if (manualBookForm) {
        manualBookForm.addEventListener('submit', function(e) {
            e.preventDefault();
            submitManualBook();
        });
    }

    // 표지 업로드 초기화
    initCoverUpload();
}

/* ========================================
   도서 상세보기 모달 초기화
======================================== */
function initBookDetailModal() {
    const modal = document.getElementById('bookDetailModal');
    const closeBtn = document.getElementById('bookDetailModalClose');
    const editBtn = document.getElementById('btnEditBook');
    const deleteBtn = document.getElementById('btnDeleteBook');

    console.log('[DEBUG] initBookDetailModal - editBtn:', editBtn);
    console.log('[DEBUG] initBookDetailModal - deleteBtn:', deleteBtn);

    if (closeBtn) {
        closeBtn.addEventListener('click', closeBookDetailModal);
    }

    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeBookDetailModal();
            }
        });
    }

    if (editBtn) {
        editBtn.addEventListener('click', function() {
            const bookId = currentBookId; // 먼저 저장
            console.log('[DEBUG] 수정 버튼 클릭됨, bookId:', bookId);
            closeBookDetailModal();
            openEditBookModal(bookId);
        });
    }

    if (deleteBtn) {
        deleteBtn.addEventListener('click', function() {
            const bookId = currentBookId; // 먼저 저장
            console.log('[DEBUG] 삭제 버튼 클릭됨, bookId:', bookId);
            closeBookDetailModal();
            openDeleteBookModal(bookId);
        });
    }
}

/* ========================================
   도서 수정 모달 초기화
======================================== */
function initEditBookModal() {
    const modal = document.getElementById('editBookModal');
    const closeBtn = document.getElementById('editBookModalClose');
    const form = document.getElementById('editBookForm');

    if (closeBtn) {
        closeBtn.addEventListener('click', closeEditBookModal);
    }

    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeEditBookModal();
            }
        });
    }

    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            submitEditBook();
        });
    }

    // 수정 모달 표지 업로드 초기화
    initEditCoverUpload();
}

/* ========================================
   도서 삭제 모달 초기화
======================================== */
function initDeleteBookModal() {
    const modal = document.getElementById('deleteBookModal');
    const confirmBtn = document.getElementById('btnConfirmDelete');

    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeDeleteBookModal();
            }
        });
    }

    if (confirmBtn) {
        confirmBtn.addEventListener('click', confirmDeleteBook);
    }
}

/* ========================================
   모달 열기/닫기 - 도서 등록
======================================== */
async function openAddBookModal() {
    const modal = document.getElementById('addBookModal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        switchTab('search');
        resetSearchResults();

        // 자녀 데이터가 없으면 다시 로드
        if (!childrenData || childrenData.length === 0 || !currentUserInfo) {
            await loadReadersData();
        }
    }
}

function closeAddBookModal() {
    const modal = document.getElementById('addBookModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';

        const manualForm = document.getElementById('manualBookForm');
        if (manualForm) {
            manualForm.reset();
        }

        // 커버 프리뷰 제목 초기화
        const coverTitle = document.getElementById('manualCoverTitle');
        if (coverTitle) {
            coverTitle.textContent = '책 제목';
        }

        // 업로드된 표지 이미지 초기화
        removeCoverImage();

        // 모든 flatpickr 인스턴스 정리
        clearAllDatePickers();

        // 도서 상세 행 초기화
        const detailsList = document.getElementById('bookDetailsList');
        if (detailsList) {
            detailsList.innerHTML = '';
        }

        const searchInput = document.getElementById('bookSearchInput');
        if (searchInput) {
            searchInput.value = '';
        }

        resetSearchResults();
    }
}

/* ========================================
   모든 날짜 선택기 인스턴스 정리
======================================== */
function clearAllDatePickers() {
    for (const key in datePickerInstances) {
        if (datePickerInstances[key]) {
            datePickerInstances[key].destroy();
            delete datePickerInstances[key];
        }
    }
}

/* ========================================
   모달 열기/닫기 - 도서 상세보기
======================================== */
async function openBookDetailModal(bookId) {
    const modal = document.getElementById('bookDetailModal');
    const book = booksData.find(b => (b.bookId || b.id) == bookId);

    if (!modal || !book) return;

    currentBookId = bookId;

    // 커버 이미지
    const coverContainer = document.getElementById('detailCover');
    if (book.image?.imageId) {
        // 인증된 요청으로 이미지 로드
        coverContainer.innerHTML = `<div class="book-cover-placeholder blue"><h3>로딩중...</h3></div>`;
        try {
            const blobUrl = await apiClient.getBoardImage(book.image.imageId);
            coverContainer.innerHTML = `<img src="${blobUrl}" alt="${book.title}">`;
        } catch (error) {
            console.error('상세보기 이미지 로드 실패:', error);
            coverContainer.innerHTML = `<div class="book-cover-placeholder blue"><h3>${book.title}</h3></div>`;
        }
    } else if (book.coverUrl) {
        coverContainer.innerHTML = `<img src="${book.coverUrl}" alt="${book.title}">`;
    } else {
        coverContainer.innerHTML = `
            <div class="book-cover-placeholder blue">
                <h3>${book.title}</h3>
            </div>
        `;
    }

    // 정보 채우기
    document.getElementById('detailTitle').textContent = book.title || '-';
    document.getElementById('detailAuthor').textContent = book.author || '-';
    document.getElementById('detailPublisher').textContent = book.publisher || '-';
    document.getElementById('detailYear').textContent = book.publicationYear || '-';
    document.getElementById('detailIsbn').textContent = book.isbn || '-';
    document.getElementById('detailDescription').textContent = book.description || '책에 대한 소개가 없습니다.';

    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeBookDetailModal() {
    const modal = document.getElementById('bookDetailModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
        currentBookId = null;
    }
}

/* ========================================
   모달 열기/닫기 - 도서 수정
======================================== */
async function openEditBookModal(bookId) {
    const modal = document.getElementById('editBookModal');
    const book = booksData.find(b => (b.bookId || b.id) == bookId);

    if (!modal || !book) return;

    currentBookId = bookId;

    // 폼에 기존 데이터 채우기
    document.getElementById('editTitle').value = book.title || '';
    document.getElementById('editAuthor').value = book.author || '';
    document.getElementById('editPublisher').value = book.publisher || '';
    document.getElementById('editYear').value = book.publicationYear || '';
    document.getElementById('editIsbn').value = book.isbn || '';
    document.getElementById('editDescription').value = book.description || '';

    // 책 표지 이미지 설정
    const coverPreview = document.getElementById('editCoverPreview');
    const coverUrlInput = document.getElementById('editCoverUrl');
    const fileInput = document.getElementById('editCoverInput');

    // 기존 업로드 이미지 ID 설정 (있는 경우)
    editBookImageId = book.image?.imageId || null;
    editImageRemoved = false; // 이미지 제거 플래그 초기화

    if (coverUrlInput) coverUrlInput.value = book.coverUrl || '';
    if (fileInput) fileInput.value = '';

    if (coverPreview) {
        if (book.image?.imageId) {
            // 인증된 요청으로 이미지 로드
            coverPreview.innerHTML = '<span class="cover-placeholder-text">로딩중...</span>';
            try {
                const blobUrl = await apiClient.getBoardImage(book.image.imageId);
                coverPreview.innerHTML = `<img src="${blobUrl}" alt="${book.title}" style="width: 100%; height: 100%; object-fit: cover;">`;
            } catch (error) {
                console.error('수정모달 이미지 로드 실패:', error);
                coverPreview.innerHTML = '<span class="cover-placeholder-text">이미지 로드 실패</span>';
            }
        } else if (book.coverUrl) {
            coverPreview.innerHTML = `<img src="${book.coverUrl}" alt="${book.title}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.parentElement.innerHTML='<span class=\\'cover-placeholder-text\\'>이미지 로드 실패</span>'">`;
        } else {
            coverPreview.innerHTML = '<span class="cover-placeholder-text">이미지 없음</span>';
        }
    }

    // 독자 목록 로드 및 설정
    await loadReadersForEdit();

    // 날짜 선택기 초기화
    initEditDatePickers();

    // 기존 독서 일정이 있으면 불러오기
    await loadExistingSchedule(bookId);

    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeEditBookModal() {
    const modal = document.getElementById('editBookModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';

        const form = document.getElementById('editBookForm');
        if (form) {
            form.reset();
        }

        // 이미지 프리뷰 초기화
        const coverPreview = document.getElementById('editCoverPreview');
        if (coverPreview) {
            coverPreview.innerHTML = '<span class="cover-placeholder-text">이미지 없음</span>';
        }

        // 파일 입력 및 이미지 ID 초기화
        const fileInput = document.getElementById('editCoverInput');
        if (fileInput) fileInput.value = '';
        editBookImageId = null;
        editImageRemoved = false;
    }
}

/* ========================================
   도서 표지 이미지 제거
======================================== */
function removeEditCover() {
    const coverPreview = document.getElementById('editCoverPreview');
    const coverUrlInput = document.getElementById('editCoverUrl');

    if (coverPreview) {
        coverPreview.innerHTML = '<span class="cover-placeholder-text">이미지 없음</span>';
    }
    if (coverUrlInput) {
        coverUrlInput.value = '';
    }
}

/* ========================================
   도서 표지 이미지 URL 프리뷰
======================================== */
function previewEditCoverFromUrl(url) {
    const coverPreview = document.getElementById('editCoverPreview');

    if (!url || !url.trim()) {
        return;
    }

    url = url.trim();

    // URL 형식 간단히 검증
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return;
    }

    if (coverPreview) {
        coverPreview.innerHTML = `<img src="${url}" alt="책 표지 미리보기" onerror="this.parentElement.innerHTML='<span class=\\'cover-placeholder-text\\'>이미지 로드 실패</span>'">`;
    }
}

/* ========================================
   모달 열기/닫기 - 도서 삭제
======================================== */
function openDeleteBookModal(bookId) {
    const modal = document.getElementById('deleteBookModal');
    const book = booksData.find(b => (b.bookId || b.id) == bookId);

    if (!modal || !book) return;

    currentBookId = bookId;

    document.getElementById('deleteBookName').textContent = `"${book.title}"`;

    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeDeleteBookModal() {
    const modal = document.getElementById('deleteBookModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
}

/* ========================================
   도서 수정 제출 (API 연동)
======================================== */
async function submitEditBook() {
    const book = booksData.find(b => (b.bookId || b.id) == currentBookId);
    if (!book) return;

    const title = document.getElementById('editTitle').value.trim();
    const author = document.getElementById('editAuthor').value.trim();

    if (!title || !author) {
        showToast('제목과 저자는 필수 입력 항목입니다.', 'warning');
        return;
    }

    const publicationYear = document.getElementById('editYear').value.trim();
    const isbn = document.getElementById('editIsbn').value.trim();

    // 출판년도 유효성 검사 (숫자만, 4자리)
    if (publicationYear && !/^\d{4}$/.test(publicationYear)) {
        showToast('출판년도는 4자리 숫자로 입력해주세요. (예: 2024)', 'warning');
        return;
    }

    // ISBN 유효성 검사 (숫자만, 10자리 또는 13자리)
    if (isbn && !/^\d{10}$|^\d{13}$/.test(isbn)) {
        showToast('ISBN은 10자리 또는 13자리 숫자로 입력해주세요.', 'warning');
        return;
    }

    // 책 표지 이미지 URL 가져오기
    let coverUrl = document.getElementById('editCoverUrl').value.trim();

    // URL이 입력되지 않은 경우 기존 이미지 URL 유지 (이미지가 제거되지 않았고 업로드 이미지도 없을 때만)
    if (!coverUrl && !editBookImageId && !editImageRemoved) {
        coverUrl = book.coverUrl || '';
    }

    const updateData = {
        title: title,
        author: author,
        publisher: document.getElementById('editPublisher').value.trim(),
        publicationYear: publicationYear,
        isbn: isbn,
        description: document.getElementById('editDescription').value.trim(),
        coverUrl: coverUrl
    };

    // 이미지 처리 로직
    if (editImageRemoved) {
        // 사용자가 명시적으로 이미지 제거 → imageId를 0으로 전송 (백엔드에서 0이면 이미지 제거 처리 필요)
        updateData.imageId = 0;
        updateData.coverUrl = '';
        console.log('[Edit] 이미지 제거 요청 (imageId: 0)');
    } else if (editBookImageId) {
        // 새 이미지 업로드됨
        updateData.imageId = editBookImageId;
        updateData.coverUrl = '';
    } else if (book.image?.imageId && !coverUrl) {
        // 기존 업로드 이미지 유지 (새 URL이 없을 때)
        updateData.imageId = book.image.imageId;
    }

    // 독서 일정 데이터 추가 (bookcase-schedule.js) - 다중 독자 지원
    const bookDetailsUpdate = getBookDetailsUpdate();

    console.log('[Debug] bookDetailsUpdate:', bookDetailsUpdate);

    // 각 일정 항목에 대해 readerId 검색
    if (bookDetailsUpdate.length > 0) {
        // 먼저 모든 도서의 bookDetails를 한 번에 수집
        let allBookDetails = [];

        // 현재 도서 정보 조회
        try {
            const currentBookRes = await apiClient.getBook(currentBookId);
            const currentBookData = currentBookRes.data || currentBookRes;
            const currentDetails = currentBookData.bookDetails || [];
            allBookDetails.push(...currentDetails);

            // 캐시에 저장
            currentDetails.forEach(d => {
                if (d.readerResponse?.readerName && d.readerResponse?.readerId) {
                    saveReaderIdToCache(d.readerResponse.readerName, d.readerResponse.readerId);
                }
            });
        } catch (e) {
            console.log('[Debug] 현재 도서 조회 실패:', e);
        }

        // 각 일정 항목 처리
        for (let i = 0; i < bookDetailsUpdate.length; i++) {
            const schedule = bookDetailsUpdate[i];

            // 자녀 일정인 경우에만 readerId 검색
            if (schedule.childId) {
                const childInfo = childrenData.find(c => (c.childId || c.id) === schedule.childId);
                const readerName = childInfo?.childName || childInfo?.name;

                if (readerName) {
                    let existingReaderId = null;

                    // 1. 이미 수집한 bookDetails에서 찾기
                    const matchingDetail = allBookDetails.find(d =>
                        d.readerResponse?.readerName === readerName
                    );
                    if (matchingDetail?.readerResponse?.readerId) {
                        existingReaderId = matchingDetail.readerResponse.readerId;
                    }

                    // 2. 다른 도서에서 찾기 (못 찾은 경우)
                    if (!existingReaderId) {
                        for (const otherBook of booksData) {
                            const otherBookId = otherBook.bookId || otherBook.id;
                            if (otherBookId === currentBookId) continue;

                            try {
                                const otherBookRes = await apiClient.getBook(otherBookId);
                                const otherBookData = otherBookRes.data || otherBookRes;
                                const otherDetails = otherBookData.bookDetails || [];

                                const matching = otherDetails.find(d =>
                                    d.readerResponse?.readerName === readerName
                                );
                                if (matching?.readerResponse?.readerId) {
                                    existingReaderId = matching.readerResponse.readerId;
                                    saveReaderIdToCache(readerName, existingReaderId);
                                    break;
                                }
                            } catch (e) {
                                // 무시
                            }
                        }
                    }

                    // 3. localStorage 캐시에서 찾기
                    if (!existingReaderId) {
                        existingReaderId = getReaderIdFromCache(readerName);
                    }

                    // readerId 추가
                    if (existingReaderId) {
                        schedule.readerId = existingReaderId;
                        console.log(`[Debug] 독자 ${i + 1} (${readerName}): readerId = ${existingReaderId}`);
                    } else {
                        console.log(`[Debug] 독자 ${i + 1} (${readerName}): readerId를 찾지 못함`);
                    }
                }
            }
        }

        updateData.bookDetailsUpdate = bookDetailsUpdate;
    }

    console.log('📚 도서 수정 요청 데이터:', updateData);
    console.log('📅 독서 일정 데이터:', bookDetailsUpdate);

    try {
        const response = await apiClient.updateBook(currentBookId, updateData);
        console.log('✅ Book API 응답:', response);

        // 캘린더 연동: 새 Calendar Schedule API로도 일정 등록
        // (calendar_schedule 테이블에 저장하여 캘린더에서 조회 가능하게 함)
        if (bookDetailsUpdate.length > 0) {
            try {
                // 새 Calendar Schedule API 형식으로 변환
                const calendarSchedules = bookDetailsUpdate.map(schedule => ({
                    childId: schedule.childId || null,  // null이면 본인
                    startDate: schedule.startDate,
                    endDate: schedule.endDate
                }));

                console.log('📅 Calendar Schedule API 호출:', {
                    bookId: currentBookId,
                    schedules: calendarSchedules
                });

                await apiClient.createCalendarSchedule(currentBookId, calendarSchedules);
                console.log('✅ Calendar Schedule 등록 성공');
            } catch (calendarError) {
                // Calendar API 실패해도 도서 수정은 성공으로 처리
                console.warn('⚠️ Calendar Schedule 등록 실패 (무시):', calendarError.message);
            }
        }

        // 로컬 데이터 업데이트 (서버 응답 데이터 사용)
        const bookIndex = booksData.findIndex(b => (b.bookId || b.id) == currentBookId);
        if (bookIndex !== -1) {
            // 서버 응답에서 업데이트된 도서 데이터 사용
            const updatedBook = response.data || response;
            booksData[bookIndex] = { ...booksData[bookIndex], ...updatedBook };
        }

        // 이미지 관련 플래그 초기화
        editBookImageId = null;
        editImageRemoved = false;

        // 그리드 다시 렌더링
        renderBooksGrid();

        closeEditBookModal();
        showToast('도서 정보가 수정되었습니다.', 'success');
    } catch (error) {
        console.error('도서 수정 실패:', error);
        showToast('도서 수정에 실패했습니다.', 'error');
    }
}

/* ========================================
   도서 삭제 확인 (API 연동)
======================================== */
async function confirmDeleteBook() {
    console.log('[DEBUG] confirmDeleteBook 호출됨, currentBookId:', currentBookId);
    const book = booksData.find(b => (b.bookId || b.id) == currentBookId);
    console.log('[DEBUG] 찾은 book:', book);
    if (!book) {
        console.log('[DEBUG] book이 없어서 return');
        return;
    }

    try {
        console.log('[DEBUG] API 호출 시작: deleteBook(' + currentBookId + ')');
        await apiClient.deleteBook(currentBookId);
        console.log('[DEBUG] API 호출 성공');

        // 로컬 데이터에서 제거
        booksData = booksData.filter(b => (b.bookId || b.id) != currentBookId);

        // 그리드 다시 렌더링
        renderBooksGrid();

        closeDeleteBookModal();
        showToast('도서가 삭제되었습니다.', 'success');
    } catch (error) {
        console.error('[DEBUG] 도서 삭제 실패:', error);
        console.error('[DEBUG] error.message:', error.message);
        console.error('[DEBUG] error.status:', error.status);
        showToast('도서 삭제에 실패했습니다.', 'error');
    }
}

/* ========================================
   탭 전환
======================================== */
function switchTab(tab) {
    const tabBtns = document.querySelectorAll('.add-book-tabs .tab-btn');
    const searchTab = document.getElementById('searchTab');
    const manualTab = document.getElementById('manualTab');

    tabBtns.forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-tab') === tab) {
            btn.classList.add('active');
        }
    });

    if (tab === 'search') {
        searchTab.style.display = 'block';
        searchTab.classList.add('active');
        manualTab.style.display = 'none';
        manualTab.classList.remove('active');
    } else {
        searchTab.style.display = 'none';
        searchTab.classList.remove('active');
        manualTab.style.display = 'block';
        manualTab.classList.add('active');
    }
}

/* ========================================
   검색 결과 초기화
======================================== */
function resetSearchResults() {
    const searchResults = document.getElementById('searchResults');
    if (searchResults) {
        searchResults.innerHTML = `
            <div class="search-placeholder">
                <p>도서관 정보나루에서 책을 검색해보세요.</p>
            </div>
        `;
    }
}

/* ========================================
   도서관 정보나루 API 검색
======================================== */
async function searchBooksFromLibrary(query) {
    const searchResults = document.getElementById('searchResults');
    const apiKey = window.ENV?.OPENLIBRARY_KEY;

    if (!apiKey) {
        showToast('API 키가 설정되지 않았습니다.', 'error');
        return;
    }

    searchResults.innerHTML = `
        <div class="search-loading">
            <p>검색 중...</p>
        </div>
    `;

    try {
        const apiUrl = `https://data4library.kr/api/srchBooks?authKey=${apiKey}&title=${encodeURIComponent(query)}&pageNo=1&pageSize=10&format=json`;

        const response = await fetch(apiUrl);

        if (!response.ok) {
            throw new Error('API 요청 실패');
        }

        const data = await response.json();
        displaySearchResults(data);

    } catch (error) {
        console.error('도서 검색 오류:', error);

        // 에러 종류에 따른 메시지 분기
        let errorMessage = '검색 중 오류가 발생했습니다.';
        let errorDetail = '직접 입력 기능을 이용해주세요.';

        if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
            errorMessage = '도서 검색 서버에 연결할 수 없습니다.';
            errorDetail = '도서관 정보나루 API 서버가 응답하지 않습니다.<br>잠시 후 다시 시도하거나 직접 입력 기능을 이용해주세요.';
        }

        searchResults.innerHTML = `
            <div class="no-results">
                <p>${errorMessage}</p>
                <p style="font-size: 12px; margin-top: 10px;">${errorDetail}</p>
                <button class="btn-manual" onclick="switchTab('manual')">직접 입력하기</button>
            </div>
        `;
    }
}

/* ========================================
   검색 결과 표시
======================================== */
function displaySearchResults(data) {
    const searchResults = document.getElementById('searchResults');
    const books = data?.response?.docs || [];

    if (books.length === 0) {
        searchResults.innerHTML = `
            <div class="no-results">
                <p>검색 결과가 없습니다.</p>
                <p style="font-size: 12px;">찾으시는 책이 없다면 직접 입력해주세요.</p>
                <button class="btn-manual" onclick="switchTab('manual')">직접 입력하기</button>
            </div>
        `;
        return;
    }

    let html = '';
    books.forEach((item, index) => {
        const book = item.doc || item;
        const title = book.bookname || book.title || '제목 없음';
        const author = book.authors || book.author || '저자 미상';
        const publisher = book.publisher || '출판사 미상';
        const year = book.publication_year || book.year || '';
        const isbn = book.isbn13 || book.isbn || '';
        const coverUrl = book.bookImageURL || book.cover || '';
        const description = book.description || '';

        html += `
            <div class="search-result-item" data-index="${index}">
                ${coverUrl
                    ? `<img src="${coverUrl}" alt="${title}" class="search-result-cover" onerror="this.classList.add('no-image'); this.src=''; this.innerHTML='No Image';">`
                    : `<div class="search-result-cover no-image">No Image</div>`
                }
                <div class="search-result-info">
                    <div class="search-result-title" title="${title}">${title}</div>
                    <div class="search-result-meta">${author}</div>
                    <div class="search-result-meta">${publisher}${year ? ' | ' + year : ''}</div>
                </div>
                <button class="search-result-add" onclick="addBookFromSearch('${escapeHtmlForAttr(title)}', '${escapeHtmlForAttr(author)}', '${escapeHtmlForAttr(publisher)}', '${year}', '${isbn}', '${escapeHtmlForAttr(coverUrl)}', '${escapeHtmlForAttr(description)}')" title="도서 추가">
                    +
                </button>
            </div>
        `;
    });

    searchResults.innerHTML = html;
}

/* ========================================
   HTML 속성용 이스케이프 함수 (따옴표 포함)
======================================== */
function escapeHtmlForAttr(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML.replace(/'/g, "\\'").replace(/"/g, '\\"');
}

/* ========================================
   검색 결과에서 도서 추가 (API 연동)
======================================== */
async function addBookFromSearch(title, author, publisher, year, isbn, coverUrl, description) {
    // 필수 필드만 기본으로 설정
    const bookData = {
        title: title
    };

    // 선택적 필드는 값이 있을 때만 추가 (빈 문자열 제외)
    if (author && author.trim()) {
        bookData.author = author.trim();
    }
    if (publisher && publisher.trim()) {
        bookData.publisher = publisher.trim();
    }
    if (year && year.trim()) {
        bookData.publicationYear = year.trim();
    }
    if (isbn && isbn.trim()) {
        bookData.isbn = isbn.trim();
    }
    if (coverUrl && coverUrl.trim()) {
        bookData.coverUrl = coverUrl.trim();
    }
    if (description && description.trim()) {
        bookData.description = description.trim();
    }

    await saveBookToDB(bookData);
}

/* ========================================
   표지 이미지 업로드 초기화
======================================== */
function initCoverUpload() {
    const uploadBtn = document.getElementById('btnUploadCover');
    const removeBtn = document.getElementById('btnRemoveCover');
    const fileInput = document.getElementById('manualCoverInput');

    if (uploadBtn) {
        uploadBtn.addEventListener('click', function() {
            fileInput?.click();
        });
    }

    if (fileInput) {
        fileInput.addEventListener('change', handleCoverFileSelect);
    }

    if (removeBtn) {
        removeBtn.addEventListener('click', removeCoverImage);
    }
}

/* ========================================
   표지 파일 선택 처리
======================================== */
async function handleCoverFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;

    // 파일 유형 검증
    if (!file.type.startsWith('image/')) {
        showToast('이미지 파일만 업로드할 수 있습니다.', 'warning');
        return;
    }

    // 파일 크기 검증 (5MB 제한)
    if (file.size > 5 * 1024 * 1024) {
        showToast('파일 크기는 5MB 이하여야 합니다.', 'warning');
        return;
    }

    // 미리보기 표시
    showCoverPreview(file);

    // 서버에 업로드
    await uploadCoverImage(file);
}

/* ========================================
   표지 미리보기 표시
======================================== */
function showCoverPreview(file) {
    const placeholder = document.getElementById('manualCoverPlaceholder');
    const previewImg = document.getElementById('manualCoverImage');
    const removeBtn = document.getElementById('btnRemoveCover');

    if (!placeholder || !previewImg) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        previewImg.src = e.target.result;
        previewImg.style.display = 'block';
        placeholder.style.display = 'none';
        if (removeBtn) removeBtn.style.display = 'flex';
    };
    reader.readAsDataURL(file);
}

/* ========================================
   표지 이미지 서버 업로드
======================================== */
async function uploadCoverImage(file) {
    try {
        showToast('이미지 업로드 중...', 'info');

        const response = await apiClient.uploadBoardImage(file);
        console.log('[Cover] 업로드 응답:', response);

        // ApiResponse 형식: { success: true, data: { imageId, fileName, ... } }
        let imageId = null;
        if (response && response.data && response.data.imageId) {
            imageId = response.data.imageId;
        } else if (response && response.imageId) {
            // 직접 응답인 경우
            imageId = response.imageId;
        }

        if (imageId) {
            manualBookImageId = imageId;
            showToast('표지 이미지가 업로드되었습니다.', 'success');
            console.log('[Cover] 업로드 완료, imageId:', manualBookImageId);
        } else {
            throw new Error('이미지 ID를 받지 못했습니다.');
        }
    } catch (error) {
        console.error('표지 이미지 업로드 실패:', error);
        showToast('이미지 업로드에 실패했습니다.', 'error');
        // 실패 시 미리보기 초기화
        removeCoverImage();
    }
}

/* ========================================
   표지 이미지 제거
======================================== */
function removeCoverImage() {
    const placeholder = document.getElementById('manualCoverPlaceholder');
    const previewImg = document.getElementById('manualCoverImage');
    const removeBtn = document.getElementById('btnRemoveCover');
    const fileInput = document.getElementById('manualCoverInput');

    if (previewImg) {
        previewImg.src = '';
        previewImg.style.display = 'none';
    }
    if (placeholder) {
        placeholder.style.display = 'flex';
    }
    if (removeBtn) {
        removeBtn.style.display = 'none';
    }
    if (fileInput) {
        fileInput.value = '';
    }

    manualBookImageId = null;
    console.log('[Cover] 이미지 제거됨');
}

/* ========================================
   수정 모달 표지 이미지 업로드 초기화
======================================== */
function initEditCoverUpload() {
    const uploadBtn = document.getElementById('btnEditUploadCover');
    const removeBtn = document.getElementById('btnEditRemoveCover');
    const fileInput = document.getElementById('editCoverInput');

    if (uploadBtn) {
        uploadBtn.addEventListener('click', function() {
            fileInput?.click();
        });
    }

    if (fileInput) {
        fileInput.addEventListener('change', handleEditCoverFileSelect);
    }

    if (removeBtn) {
        removeBtn.addEventListener('click', removeEditCoverImage);
    }
}

/* ========================================
   수정 모달 표지 파일 선택 처리
======================================== */
async function handleEditCoverFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;

    // 파일 유형 검증
    if (!file.type.startsWith('image/')) {
        showToast('이미지 파일만 업로드할 수 있습니다.', 'warning');
        return;
    }

    // 파일 크기 검증 (5MB 제한)
    if (file.size > 5 * 1024 * 1024) {
        showToast('파일 크기는 5MB 이하여야 합니다.', 'warning');
        return;
    }

    // 미리보기 표시
    showEditCoverPreview(file);

    // 서버에 업로드
    await uploadEditCoverImage(file);
}

/* ========================================
   수정 모달 표지 미리보기 표시
======================================== */
function showEditCoverPreview(file) {
    const previewContainer = document.getElementById('editCoverPreview');
    if (!previewContainer) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        previewContainer.innerHTML = `<img src="${e.target.result}" alt="표지 미리보기" style="width: 100%; height: 100%; object-fit: cover;">`;
    };
    reader.readAsDataURL(file);
}

/* ========================================
   수정 모달 표지 이미지 서버 업로드
======================================== */
async function uploadEditCoverImage(file) {
    try {
        showToast('이미지 업로드 중...', 'info');

        const response = await apiClient.uploadBoardImage(file);
        console.log('[EditCover] 업로드 응답:', response);

        // ApiResponse 형식: { success: true, data: { imageId, fileName, ... } }
        let imageId = null;
        if (response && response.data && response.data.imageId) {
            imageId = response.data.imageId;
        } else if (response && response.imageId) {
            imageId = response.imageId;
        }

        if (imageId) {
            editBookImageId = imageId;
            // URL 입력 필드 비우기 (업로드된 이미지 우선)
            const urlInput = document.getElementById('editCoverUrl');
            if (urlInput) urlInput.value = '';
            showToast('표지 이미지가 업로드되었습니다.', 'success');
            console.log('[EditCover] 업로드 완료, imageId:', editBookImageId);
        } else {
            throw new Error('이미지 ID를 받지 못했습니다.');
        }
    } catch (error) {
        console.error('표지 이미지 업로드 실패:', error);
        showToast('이미지 업로드에 실패했습니다.', 'error');
        removeEditCoverImage();
    }
}

/* ========================================
   수정 모달 표지 이미지 제거
======================================== */
function removeEditCoverImage() {
    const previewContainer = document.getElementById('editCoverPreview');
    const fileInput = document.getElementById('editCoverInput');
    const urlInput = document.getElementById('editCoverUrl');

    if (previewContainer) {
        previewContainer.innerHTML = '<span class="cover-placeholder-text">이미지 없음</span>';
    }
    if (fileInput) {
        fileInput.value = '';
    }
    if (urlInput) {
        urlInput.value = '';
    }

    editBookImageId = null;
    editImageRemoved = true; // 명시적으로 이미지 제거됨
    console.log('[EditCover] 이미지 제거됨, editImageRemoved:', editImageRemoved);
}

/* ========================================
   직접 입력으로 도서 추가 (API 연동)
======================================== */
async function submitManualBook() {
    const form = document.getElementById('manualBookForm');
    const formData = new FormData(form);

    const title = formData.get('title')?.trim();
    const author = formData.get('author')?.trim();
    const publisher = formData.get('publisher')?.trim();

    if (!title || !author) {
        showToast('제목과 저자는 필수 입력 항목입니다.', 'warning');
        return;
    }

    // 도서 상세 정보 수집 (자녀/본인 + 날짜)
    const bookDetails = collectBookDetails();

    // 백엔드 API 스펙에 맞는 데이터 구조
    const bookData = {
        title: title,
        author: author
    };

    // 선택적 필드는 값이 있을 때만 추가
    if (publisher) {
        bookData.publisher = publisher;
    }

    // 업로드된 이미지 ID가 있으면 추가
    if (manualBookImageId) {
        bookData.imageId = manualBookImageId;
    }

    // bookDetails가 있을 때만 추가
    if (bookDetails && bookDetails.length > 0) {
        bookData.bookDetails = bookDetails;
    }

    await saveBookToDB(bookData);

    // 등록 후 이미지 ID 초기화
    manualBookImageId = null;
}

/* ========================================
   DB에 도서 저장
======================================== */
async function saveBookToDB(bookData) {
    try {
        // 디버깅: 전송 데이터 확인
        console.log('도서 등록 요청 데이터:', JSON.stringify(bookData, null, 2));

        const response = await apiClient.createBook(bookData);

        // 응답에서 새로 생성된 도서 데이터 추출
        let newBook;
        if (response.success && response.data) {
            newBook = response.data;
        } else {
            newBook = response;
        }

        // 로컬 데이터에 추가
        booksData.unshift(newBook);

        // 그리드 다시 렌더링
        renderBooksGrid();

        closeAddBookModal();
        showToast(`"${bookData.title}"이(가) 책장에 추가되었습니다.`, 'success');
    } catch (error) {
        console.error('도서 저장 실패:', error);
        if (error.status === 401) {
            showToast('도서를 등록하려면 로그인이 필요합니다.', 'warning');
        } else {
            showToast('도서 저장에 실패했습니다.', 'error');
        }
    }
}

/* ========================================
   도서 클릭 이벤트 초기화
======================================== */
function initBookClickEvent() {
    document.addEventListener('click', function(e) {
        // 모달 내부 클릭은 무시
        if (e.target.closest('.modal-content')) {
            return;
        }

        // 검색 결과 추가 버튼 클릭 무시
        if (e.target.closest('.search-result-add')) {
            return;
        }

        const bookItem = e.target.closest('.book-item');
        if (bookItem && !e.target.closest('.add-book-btn')) {
            const bookId = bookItem.getAttribute('data-book-id');
            if (bookId) {
                openBookDetailModal(bookId);
            }
        }
    });
}

/* ========================================
   자녀 목록 및 사용자 정보 로드
======================================== */
async function loadReadersData() {
    try {
        // 사용자 정보 로드
        const userResponse = await apiClient.getUserInfo();
        if (userResponse.success && userResponse.data) {
            currentUserInfo = userResponse.data;
        } else if (userResponse && !userResponse.success) {
            // 응답이 있지만 success가 false인 경우
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
            childrenData = Array.isArray(childrenResponse.data)
                ? childrenResponse.data
                : [childrenResponse.data];
        } else if (Array.isArray(childrenResponse)) {
            childrenData = childrenResponse;
        } else if (childrenResponse && childrenResponse.data) {
            // success 필드가 없지만 data가 있는 경우
            childrenData = Array.isArray(childrenResponse.data)
                ? childrenResponse.data
                : [childrenResponse.data];
        } else {
            childrenData = [];
        }
    } catch (error) {
        console.error('자녀 목록 로드 실패:', error);
        childrenData = [];
    }
}

/* ========================================
   직접 입력 폼 초기화
======================================== */
function initManualBookForm() {
    const titleInput = document.getElementById('manualTitle');
    const coverTitle = document.getElementById('manualCoverTitle');
    const addDetailBtn = document.getElementById('btnAddBookDetail');

    // 제목 입력 시 커버 프리뷰 업데이트
    if (titleInput && coverTitle) {
        titleInput.addEventListener('input', function() {
            const title = this.value.trim();
            coverTitle.textContent = title || '책 제목';
        });
    }

    // 도서 상세 행 추가 버튼
    if (addDetailBtn) {
        addDetailBtn.addEventListener('click', function() {
            addBookDetailRow();
        });
    }
}

// flatpickr 인스턴스 저장용 객체
const datePickerInstances = {};

/* ========================================
   도서 상세 행 추가
======================================== */
async function addBookDetailRow() {
    const detailsList = document.getElementById('bookDetailsList');
    if (!detailsList) return;

    // 데이터가 없으면 다시 로드 시도
    if (!currentUserInfo && (!childrenData || childrenData.length === 0)) {
        await loadReadersData();
    }

    // 그래도 데이터가 없으면 안내 메시지
    if (!currentUserInfo && (!childrenData || childrenData.length === 0)) {
        showToast('독자 정보를 불러올 수 없습니다. 로그인 상태를 확인해주세요.', 'warning');
        return;
    }

    const rowId = 'detail-row-' + Date.now();
    const row = document.createElement('div');
    row.className = 'book-detail-row';
    row.id = rowId;

    // 커스텀 드롭다운 옵션 생성
    let dropdownOptions = '';

    // 본인 옵션
    if (currentUserInfo) {
        const userName = currentUserInfo.nickname || currentUserInfo.username || currentUserInfo.name || '본인';
        const userColor = currentUserInfo.color || '#20B2AA';
        dropdownOptions += `
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
            dropdownOptions += `
                <div class="custom-select-option" data-value="${childId}" data-color="${childColor}">
                    <span class="option-icon" style="background: ${childColor};"></span>
                    <span class="option-text">${childName}</span>
                </div>
            `;
        });
    }

    // 오늘 날짜
    const today = new Date().toISOString().split('T')[0];

    row.innerHTML = `
        <div class="custom-select" data-name="reader">
            <input type="hidden" name="reader" value="">
            <div class="custom-select-trigger">
                <span class="custom-select-value">독자 선택</span>
                <span class="custom-select-arrow">▼</span>
            </div>
            <div class="custom-select-options">
                ${dropdownOptions}
            </div>
        </div>
        <input type="text" class="date-input flatpickr-input" name="startDate" placeholder="시작일" readonly>
        <span class="date-separator">~</span>
        <input type="text" class="date-input flatpickr-input" name="endDate" placeholder="종료일" readonly>
        <button type="button" class="btn-remove-detail" onclick="removeBookDetailRow('${rowId}')">
            <span>−</span>
        </button>
    `;

    detailsList.appendChild(row);

    // 커스텀 드롭다운 이벤트 초기화
    initCustomDropdown(row.querySelector('.custom-select'));

    // flatpickr 초기화
    initRowDatePickers(rowId, today);
}

/* ========================================
   커스텀 드롭다운 초기화
======================================== */
function initCustomDropdown(selectEl) {
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

            // 표시 텍스트 업데이트 (개인 색상 아이콘 포함)
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

/* ========================================
   문서 클릭 시 드롭다운 닫기 (전역)
======================================== */
document.addEventListener('click', function(e) {
    // 커스텀 드롭다운 외부 클릭 시 닫기
    if (!e.target.closest('.custom-select')) {
        document.querySelectorAll('.custom-select.open').forEach(el => {
            el.classList.remove('open');
        });
    }
});

/* ========================================
   날짜 선택기 초기화 (flatpickr)
======================================== */
function initRowDatePickers(rowId, defaultDate) {
    const row = document.getElementById(rowId);
    if (!row) return;

    const startInput = row.querySelector('input[name="startDate"]');
    const endInput = row.querySelector('input[name="endDate"]');

    const flatpickrConfig = {
        locale: 'ko',
        dateFormat: 'Y-m-d',
        defaultDate: defaultDate,
        allowInput: false,
        disableMobile: true
    };

    // 시작일 picker
    if (startInput) {
        datePickerInstances[rowId + '-start'] = flatpickr(startInput, {
            ...flatpickrConfig,
            onChange: function(selectedDates, dateStr) {
                // 시작일이 종료일보다 늦으면 종료일도 같이 변경
                if (endInput && endInput._flatpickr) {
                    const endDate = endInput._flatpickr.selectedDates[0];
                    if (endDate && selectedDates[0] > endDate) {
                        endInput._flatpickr.setDate(dateStr);
                    }
                    endInput._flatpickr.set('minDate', dateStr);
                }
            }
        });
    }

    // 종료일 picker
    if (endInput) {
        datePickerInstances[rowId + '-end'] = flatpickr(endInput, {
            ...flatpickrConfig,
            minDate: defaultDate
        });
    }
}

/* ========================================
   도서 상세 행 삭제
======================================== */
function removeBookDetailRow(rowId) {
    // flatpickr 인스턴스 정리
    if (datePickerInstances[rowId + '-start']) {
        datePickerInstances[rowId + '-start'].destroy();
        delete datePickerInstances[rowId + '-start'];
    }
    if (datePickerInstances[rowId + '-end']) {
        datePickerInstances[rowId + '-end'].destroy();
        delete datePickerInstances[rowId + '-end'];
    }

    const row = document.getElementById(rowId);
    if (row) {
        row.remove();
    }
}

/* ========================================
   도서 상세 데이터 수집
======================================== */
function collectBookDetails() {
    const detailsList = document.getElementById('bookDetailsList');
    if (!detailsList) return [];

    const rows = detailsList.querySelectorAll('.book-detail-row');
    const bookDetails = [];

    rows.forEach(row => {
        // 커스텀 드롭다운의 hidden input에서 값 읽기
        const readerInput = row.querySelector('.custom-select input[name="reader"]');
        const startDateInput = row.querySelector('input[name="startDate"]');
        const endDateInput = row.querySelector('input[name="endDate"]');

        if (readerInput && readerInput.value) {
            const readerValue = readerInput.value;

            // 본인 선택 시에는 bookDetails에 포함하지 않음 (백엔드가 childId 필수)
            // 자녀만 선택된 경우에만 bookDetails에 추가
            if (readerValue !== 'user') {
                const detail = {
                    childId: parseInt(readerValue)
                };

                // 날짜가 있을 때만 추가
                if (startDateInput && startDateInput.value) {
                    detail.startDate = startDateInput.value;
                }
                if (endDateInput && endDateInput.value) {
                    detail.endDate = endDateInput.value;
                }

                bookDetails.push(detail);
            }
        }
    });

    return bookDetails;
}
