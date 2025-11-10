// Notice Board with CRUD functionality
let notices = [];
let currentPage = 1;
const itemsPerPage = 10;
let isAdmin = false;
let currentUser = null;
let editingNoticeId = null;

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    // 로그인 사용자 정보 확인
    checkUserAuth();

    // 로컬 스토리지에서 공지사항 불러오기
    loadNotices();

    // 이벤트 리스너 등록
    initEventListeners();

    // 초기 화면 렌더링
    renderNotices();
});

// 사용자 권한 확인
function checkUserAuth() {
    // localStorage에서 로그인 정보 확인
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const userId = localStorage.getItem('userId');

    if (isLoggedIn && userId) {
        currentUser = userId;
        // admin이 포함된 ID인지 확인
        isAdmin = userId.toLowerCase().includes('admin');

        // 관리자면 글쓰기 버튼 표시
        if (isAdmin) {
            document.getElementById('writeBtn').style.display = 'block';
        }
    }
}

// 로컬 스토리지에서 공지사항 불러오기
function loadNotices() {
    const savedNotices = localStorage.getItem('notices');
    if (savedNotices) {
        notices = JSON.parse(savedNotices);
    } else {
        // 초기 샘플 데이터
        notices = [
            {
                id: 1,
                badge: 'important',
                title: '책·이음 서비스 정기 점검 안내',
                content: '안녕하세요, 책·이음입니다.\n\n보다 나은 서비스 제공을 위해 정기 점검을 실시합니다.\n\n점검 시간: 2025년 1월 20일 (월) 02:00 ~ 06:00\n점검 내용: 서버 및 데이터베이스 최적화\n\n점검 시간 동안 서비스 이용이 일시 중단됩니다.\n이용에 불편을 드려 죄송합니다.\n\n감사합니다.',
                author: 'admin',
                date: '2025.01.15',
                views: 1234
            },
            {
                id: 2,
                badge: 'new',
                title: '2025년 신규 독서 프로그램 안내',
                content: '새해를 맞아 가족과 함께하는 새로운 독서 프로그램을 출시합니다.\n\n주요 내용:\n- 연령별 맞춤 독서 가이드\n- 다양한 독후 활동\n- 가족 독서 챌린지\n\n많은 참여 부탁드립니다.',
                author: 'admin',
                date: '2025.01.10',
                views: 856
            },
            {
                id: 3,
                badge: 'event',
                title: '겨울방학 특별 창작 대회 개최',
                content: '겨울방학을 맞아 특별 창작 대회를 개최합니다.\n\n참가 대상: 초등학생부터 청소년까지\n접수 기간: 2025.01.05 ~ 2025.01.31\n발표일: 2025.02.15\n\n우수 작품에는 푸짐한 상품이 준비되어 있습니다.',
                author: 'admin',
                date: '2025.01.05',
                views: 2103
            }
        ];
        saveNotices();
    }
}

// 로컬 스토리지에 저장
function saveNotices() {
    localStorage.setItem('notices', JSON.stringify(notices));
}

// 이벤트 리스너 초기화
function initEventListeners() {
    // 글쓰기 버튼
    document.getElementById('writeBtn').addEventListener('click', openWriteModal);

    // 검색 버튼
    document.getElementById('searchBtn').addEventListener('click', searchNotices);

    // 검색 입력 엔터키
    document.getElementById('searchInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchNotices();
        }
    });

    // 모달 닫기 버튼들
    document.getElementById('modalClose').addEventListener('click', closeWriteModal);
    document.getElementById('cancelBtn').addEventListener('click', closeWriteModal);
    document.getElementById('viewModalClose').addEventListener('click', closeViewModal);
    document.getElementById('closeViewBtn').addEventListener('click', closeViewModal);

    // 폼 제출
    document.getElementById('noticeForm').addEventListener('submit', handleSubmit);

    // 수정/삭제 버튼
    document.getElementById('editBtn').addEventListener('click', handleEdit);
    document.getElementById('deleteBtn').addEventListener('click', handleDelete);

    // 모달 외부 클릭 시 닫기
    window.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            closeWriteModal();
            closeViewModal();
        }
    });
}

// 공지사항 렌더링
function renderNotices(filteredNotices = null) {
    const noticesToRender = filteredNotices || notices;
    const tbody = document.getElementById('noticeTableBody');
    const pagination = document.getElementById('pagination');

    // 페이지네이션 계산
    const totalPages = Math.ceil(noticesToRender.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentNotices = noticesToRender.slice(startIndex, endIndex);

    // 테이블 렌더링
    if (currentNotices.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-state"><p>등록된 공지사항이 없습니다.</p></td></tr>';
    } else {
        tbody.innerHTML = currentNotices.map(notice => `
            <tr onclick="viewNotice(${notice.id})">
                <td>${noticesToRender.length - (startIndex + currentNotices.indexOf(notice))}</td>
                <td><span class="badge badge-${notice.badge}">${getBadgeText(notice.badge)}</span></td>
                <td style="text-align: left;">${notice.title}</td>
                <td>${notice.author}</td>
                <td>${notice.date}</td>
                <td>${notice.views.toLocaleString()}</td>
            </tr>
        `).join('');
    }

    // 페이지네이션 렌더링
    renderPagination(totalPages);
}

// 배지 텍스트 변환
function getBadgeText(badge) {
    const badgeMap = {
        'important': '중요',
        'new': '신규',
        'event': '이벤트',
        'normal': '일반'
    };
    return badgeMap[badge] || '일반';
}

// 페이지네이션 렌더링
function renderPagination(totalPages) {
    const pagination = document.getElementById('pagination');

    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }

    let html = `<button class="page-btn" onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>◀ 이전</button>`;

    // 페이지 번호 표시 (최대 5개)
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, startPage + 4);

    for (let i = startPage; i <= endPage; i++) {
        html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="changePage(${i})">${i}</button>`;
    }

    html += `<button class="page-btn" onclick="changePage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>다음 ▶</button>`;

    pagination.innerHTML = html;
}

// 페이지 변경
function changePage(page) {
    if (page < 1 || page > Math.ceil(notices.length / itemsPerPage)) return;
    currentPage = page;
    renderNotices();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 검색
function searchNotices() {
    const keyword = document.getElementById('searchInput').value.trim().toLowerCase();

    if (!keyword) {
        renderNotices();
        return;
    }

    const filtered = notices.filter(notice =>
        notice.title.toLowerCase().includes(keyword) ||
        notice.content.toLowerCase().includes(keyword)
    );

    currentPage = 1;
    renderNotices(filtered);
}

// 글쓰기 모달 열기
function openWriteModal() {
    if (!isAdmin) {
        alert('관리자만 글을 작성할 수 있습니다.');
        return;
    }

    editingNoticeId = null;
    document.getElementById('modalTitle').textContent = '공지사항 작성';
    document.getElementById('noticeForm').reset();
    document.getElementById('noticeId').value = '';
    document.getElementById('writeModal').classList.add('show');
}

// 글쓰기 모달 닫기
function closeWriteModal() {
    document.getElementById('writeModal').classList.remove('show');
    editingNoticeId = null;
}

// 상세보기 모달 열기
function viewNotice(id) {
    const notice = notices.find(n => n.id === id);
    if (!notice) return;

    // 조회수 증가
    notice.views++;
    saveNotices();

    // 모달에 내용 표시
    const badgeEl = document.getElementById('detailBadge');
    badgeEl.className = `detail-badge badge badge-${notice.badge}`;
    badgeEl.textContent = getBadgeText(notice.badge);

    document.getElementById('detailTitle').textContent = notice.title;
    document.getElementById('detailAuthor').textContent = `작성자: ${notice.author}`;
    document.getElementById('detailDate').textContent = `작성일: ${notice.date}`;
    document.getElementById('detailViews').textContent = `조회수: ${notice.views.toLocaleString()}`;
    document.getElementById('detailContent').textContent = notice.content;

    // 관리자면 수정/삭제 버튼 표시
    const detailActions = document.getElementById('detailActions');
    if (isAdmin) {
        detailActions.style.display = 'flex';
        detailActions.dataset.noticeId = id;
    } else {
        detailActions.style.display = 'none';
    }

    document.getElementById('viewModal').classList.add('show');
}

// 상세보기 모달 닫기
function closeViewModal() {
    document.getElementById('viewModal').classList.remove('show');
    renderNotices(); // 조회수 업데이트 반영
}

// 폼 제출 처리
function handleSubmit(e) {
    e.preventDefault();

    if (!isAdmin) {
        alert('관리자만 글을 작성/수정할 수 있습니다.');
        return;
    }

    const badge = document.getElementById('noticeBadge').value;
    const title = document.getElementById('noticeTitle').value.trim();
    const content = document.getElementById('noticeContent').value.trim();

    if (!badge || !title || !content) {
        alert('모든 항목을 입력해주세요.');
        return;
    }

    const today = new Date();
    const dateString = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, '0')}.${String(today.getDate()).padStart(2, '0')}`;

    if (editingNoticeId) {
        // 수정
        const notice = notices.find(n => n.id === editingNoticeId);
        if (notice) {
            notice.badge = badge;
            notice.title = title;
            notice.content = content;
        }
    } else {
        // 새 글 작성
        const newNotice = {
            id: Date.now(),
            badge: badge,
            title: title,
            content: content,
            author: currentUser,
            date: dateString,
            views: 0
        };
        notices.unshift(newNotice);
    }

    saveNotices();
    closeWriteModal();
    currentPage = 1;
    renderNotices();

    alert(editingNoticeId ? '공지사항이 수정되었습니다.' : '공지사항이 등록되었습니다.');
}

// 수정 처리
function handleEdit() {
    const noticeId = parseInt(document.getElementById('detailActions').dataset.noticeId);
    const notice = notices.find(n => n.id === noticeId);

    if (!notice) return;

    editingNoticeId = noticeId;

    document.getElementById('modalTitle').textContent = '공지사항 수정';
    document.getElementById('noticeId').value = noticeId;
    document.getElementById('noticeBadge').value = notice.badge;
    document.getElementById('noticeTitle').value = notice.title;
    document.getElementById('noticeContent').value = notice.content;

    closeViewModal();
    document.getElementById('writeModal').classList.add('show');
}

// 삭제 처리
function handleDelete() {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    const noticeId = parseInt(document.getElementById('detailActions').dataset.noticeId);
    notices = notices.filter(n => n.id !== noticeId);

    saveNotices();
    closeViewModal();
    currentPage = 1;
    renderNotices();

    alert('공지사항이 삭제되었습니다.');
}
