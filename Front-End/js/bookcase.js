/* ========================================
   페이지 초기화
======================================== */
document.addEventListener('DOMContentLoaded', function() {
    initFilterButtons();
    initSearchFunction();
    initAddBookButton();
    initBookClickEvent();
});

/* ========================================
   필터 버튼 초기화
======================================== */
function initFilterButtons() {
    const filterButtons = document.querySelectorAll('.filter-btn');

    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            const category = this.getAttribute('data-category');
            const subcategory = this.getAttribute('data-subcategory');

            if (category) {
                document.querySelectorAll('[data-category]').forEach(btn => {
                    btn.classList.remove('active');
                });
                this.classList.add('active');
                filterBooks(category);
            }

            if (subcategory) {
                document.querySelectorAll('[data-subcategory]').forEach(btn => {
                    btn.classList.remove('active');
                });
                this.classList.add('active');
                console.log('Subcategory filter:', subcategory);
            }
        });
    });
}

/* ========================================
   카테고리별 도서 필터링
======================================== */
function filterBooks(category) {
    const bookItems = document.querySelectorAll('.book-item');
    let visibleCount = 0;

    bookItems.forEach(book => {
        const bookCategory = book.getAttribute('data-category');

        if (category === 'all' || bookCategory === category) {
            book.classList.remove('hidden');
            visibleCount++;
        } else {
            book.classList.add('hidden');
        }
    });

    updateBookCount(visibleCount);
}

/* ========================================
   도서 개수 업데이트
======================================== */
function updateBookCount(count) {
    const countElement = document.getElementById('book-count');
    if (countElement) {
        countElement.textContent = count;
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
        const activeCategory = document.querySelector('[data-category].active');
        const category = activeCategory ? activeCategory.getAttribute('data-category') : 'all';
        filterBooks(category);
        return;
    }

    bookItems.forEach(book => {
        // null 안전성 체크 추가
        const titleEl = book.querySelector('.book-title');
        const metaEl = book.querySelector('.book-meta');
        const summaryEl = book.querySelector('.book-summary');

        // 필수 요소가 없으면 건너뛰기
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
   도서 등록 버튼 초기화
======================================== */
function initAddBookButton() {
    const addBookBtn = document.querySelector('.add-book-btn');

    if (addBookBtn) {
        addBookBtn.addEventListener('click', function() {
            showToast('도서 등록 기능은 추후 구현될 예정입니다.', 'info');
            console.log('Add book button clicked');
        });
    }
}

/* ========================================
   도서 클릭 이벤트 초기화
======================================== */
function initBookClickEvent() {
    document.addEventListener('click', function(e) {
        const bookItem = e.target.closest('.book-item');
        if (bookItem && !e.target.closest('.add-book-btn')) {
            const bookTitle = bookItem.querySelector('.book-title').textContent;
            console.log('Book clicked:', bookTitle);
            showToast(`"${bookTitle}" 상세 정보는 추후 구현될 예정입니다.`, 'info');
        }
    });
}
