// Notice Board with API integration
let notices = [];
let hardcodedNotices = []; // 하드코딩된 샘플 데이터
let apiNotices = []; // API에서 가져온 데이터
let currentPage = 1;
const itemsPerPage = 10;
let isAdmin = false;
let currentUser = null;
let editingNoticeId = null;
let totalPages = 0;
let selectedImageFile = null; // 선택된 이미지 파일
let currentImageId = null; // 현재 업로드된 이미지 ID

// Initialize
document.addEventListener('DOMContentLoaded', async function() {
    // 로그인 사용자 정보 확인
    checkUserAuth();

    // 하드코딩된 샘플 데이터 로드
    loadHardcodedNotices();

    // API에서 공지사항 불러오기
    await loadNoticesFromAPI();

    // 이벤트 리스너 등록
    initEventListeners();

    // URL 파라미터 확인 후 해당 공지사항 모달 자동 열기
    checkAndOpenNoticeFromURL();
});

// 사용자 권한 확인
function checkUserAuth() {
    // auth.js의 getCurrentUser() 함수 사용
    const user = getCurrentUser();

    if (user && user.email) {
        currentUser = user.email;
        // 이메일에 admin이 포함되어 있는지 확인
        isAdmin = user.email.toLowerCase().includes('admin');

        // 관리자면 글쓰기 버튼 표시
        if (isAdmin) {
            document.getElementById('writeBtn').style.display = 'block';
        }
    }
}

// 하드코딩된 샘플 데이터 로드 (사이트 완성도를 위해 유지)
function loadHardcodedNotices() {
    hardcodedNotices = [
        {
            id: 'hard_1',
            noticeId: null,
            badge: 'important',
            title: '책·이음 서비스 정기 점검 안내',
            content: '안녕하세요, 책·이음입니다.\n\n보다 나은 서비스 제공을 위해 정기 점검을 실시합니다.\n\n점검 시간: 2025년 1월 20일 (월) 02:00 ~ 06:00\n점검 내용: 서버 및 데이터베이스 최적화\n\n점검 시간 동안 서비스 이용이 일시 중단됩니다.\n이용에 불편을 드려 죄송합니다.\n\n감사합니다.',
            author: '관리자',
            username: '관리자',
            date: '2025.01.15',
            createAt: '2025-01-15T09:00:00',
            views: 1234,
            isHardcoded: true
        },
        {
            id: 'hard_2',
            noticeId: null,
            badge: 'new',
            title: '2025년 신규 독서 프로그램 안내',
            content: '새해를 맞아 가족과 함께하는 새로운 독서 프로그램을 출시합니다.\n\n주요 내용:\n- 연령별 맞춤 독서 가이드\n- 다양한 독후 활동\n- 가족 독서 챌린지\n\n많은 참여 부탁드립니다.',
            author: '관리자',
            username: '관리자',
            date: '2025.01.10',
            createAt: '2025-01-10T14:30:00',
            views: 856,
            isHardcoded: true
        },
        {
            id: 'hard_3',
            noticeId: null,
            badge: 'event',
            title: '겨울방학 특별 창작 대회 개최',
            content: '겨울방학을 맞아 특별 창작 대회를 개최합니다.\n\n참가 대상: 초등학생부터 청소년까지\n접수 기간: 2025.01.05 ~ 2025.01.31\n발표일: 2025.02.15\n\n우수 작품에는 푸짐한 상품이 준비되어 있습니다.',
            author: '관리자',
            username: '관리자',
            date: '2025.01.05',
            createAt: '2025-01-05T10:00:00',
            views: 2103,
            isHardcoded: true
        }
    ];
}

// API에서 공지사항 로드
async function loadNoticesFromAPI(page = 0) {
    try {
        const response = await apiClient.getNotices(page, itemsPerPage);

        if (response.success && response.data) {
            // 백엔드가 List<NoticeResponse>를 직접 반환하므로 배열로 처리
            const noticeList = Array.isArray(response.data) ? response.data : [];

            // API 데이터 변환 (백엔드 형식 -> 프론트 형식)
            apiNotices = noticeList.map(notice => ({
                id: notice.noticeId,
                noticeId: notice.noticeId,
                badge: 'normal', // API에는 badge가 없으므로 기본값
                title: notice.title,
                content: notice.content,
                author: notice.username || '관리자',
                username: notice.username,
                date: formatDate(notice.createAt),
                createAt: notice.createAt,
                updateAt: notice.updateAt,
                views: 0, // API에 조회수가 없으므로 기본값
                boardImage: notice.boardImage,
                isHardcoded: false
            }));

            // 클라이언트 측 페이지네이션 (백엔드가 전체 목록 반환)
            totalPages = Math.ceil(apiNotices.length / itemsPerPage);
            currentPage = page + 1;

            // 하드코딩 데이터 + API 데이터 합치기
            notices = [...hardcodedNotices, ...apiNotices];

            // 화면 렌더링
            renderNotices();
        } else {
            // API 실패 시 하드코딩 데이터만 표시
            notices = hardcodedNotices;
            renderNotices();
        }
    } catch (error) {
        console.error('공지사항 로드 실패:', error);
        // 에러 시 하드코딩 데이터만 표시
        notices = hardcodedNotices;
        renderNotices();
    }
}

// 날짜 형식 변환 (ISO 8601 -> YYYY.MM.DD)
function formatDate(isoDate) {
    if (!isoDate) return '-';
    const date = new Date(isoDate);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}.${month}.${day}`;
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

    // 이미지 관련 이벤트
    document.getElementById('noticeImage').addEventListener('change', handleImageSelect);
    document.getElementById('removeImageBtn').addEventListener('click', removeImage);

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

    // 클라이언트 측 페이지네이션 (검색 시에만 사용)
    if (filteredNotices) {
        const totalPages = Math.ceil(noticesToRender.length / itemsPerPage);
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const currentNotices = noticesToRender.slice(startIndex, endIndex);

        // 테이블 렌더링
        if (currentNotices.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="empty-state"><p>검색 결과가 없습니다.</p></td></tr>';
        } else {
            tbody.innerHTML = currentNotices.map((notice, index) => `
                <tr onclick="viewNotice('${notice.id}')">
                    <td>${noticesToRender.length - (startIndex + index)}</td>
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
    } else {
        // 일반 목록 표시
        if (noticesToRender.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="empty-state"><p>등록된 공지사항이 없습니다.</p></td></tr>';
        } else {
            tbody.innerHTML = noticesToRender.map((notice, index) => `
                <tr onclick="viewNotice('${notice.id}')">
                    <td>${noticesToRender.length - index}</td>
                    <td><span class="badge badge-${notice.badge}">${getBadgeText(notice.badge)}</span></td>
                    <td style="text-align: left;">${notice.title}</td>
                    <td>${notice.author}</td>
                    <td>${notice.date}</td>
                    <td>${notice.views.toLocaleString()}</td>
                </tr>
            `).join('');
        }

        // 페이지네이션 렌더링 (API 페이징)
        if (totalPages > 0) {
            renderPagination(totalPages);
        } else {
            pagination.innerHTML = '';
        }
    }
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
function renderPagination(pages) {
    const pagination = document.getElementById('pagination');

    if (pages <= 1) {
        pagination.innerHTML = '';
        return;
    }

    let html = `<button class="page-btn" onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>◀ 이전</button>`;

    // 페이지 번호 표시 (최대 5개)
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(pages, startPage + 4);

    for (let i = startPage; i <= endPage; i++) {
        html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="changePage(${i})">${i}</button>`;
    }

    html += `<button class="page-btn" onclick="changePage(${currentPage + 1})" ${currentPage === pages ? 'disabled' : ''}>다음 ▶</button>`;

    pagination.innerHTML = html;
}

// 페이지 변경
function changePage(page) {
    const maxPage = totalPages > 0 ? totalPages : Math.ceil(notices.length / itemsPerPage);

    if (page < 1 || page > maxPage) return;

    currentPage = page;

    // API 페이징 (검색 중이 아닐 때)
    const searchInput = document.getElementById('searchInput').value.trim();
    if (!searchInput) {
        loadNoticesFromAPI(page - 1); // API는 0부터 시작
    } else {
        renderNotices(); // 클라이언트 측 페이징
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 검색
function searchNotices() {
    const keyword = document.getElementById('searchInput').value.trim().toLowerCase();

    if (!keyword) {
        currentPage = 1;
        loadNoticesFromAPI(0);
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
        showToast('관리자만 글을 작성할 수 있습니다.', 'warning');
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

    // 이미지 관련 상태 초기화
    selectedImageFile = null;
    currentImageId = null;
    document.getElementById('noticeImage').value = '';
    document.getElementById('imagePreview').style.display = 'none';
    document.getElementById('previewImg').src = '';
}

// 상세보기 모달 열기
async function viewNotice(id) {
    const notice = notices.find(n => n.id == id);
    if (!notice) return;

    // 하드코딩 데이터가 아니고 API 데이터인 경우 상세 정보 재조회
    if (!notice.isHardcoded && notice.noticeId) {
        try {
            const response = await apiClient.getNotice(notice.noticeId);

            if (response.success && response.data) {
                const apiNotice = response.data;

                // 모달에 내용 표시
                displayNoticeDetail({
                    ...notice,
                    title: apiNotice.title,
                    content: apiNotice.content,
                    author: apiNotice.username || '관리자',
                    date: formatDate(apiNotice.createAt),
                    boardImage: apiNotice.boardImage || apiNotice.image || apiNotice.imageFile
                });
            } else {
                displayNoticeDetail(notice);
            }
        } catch (error) {
            console.error('공지사항 상세 조회 실패:', error);
            displayNoticeDetail(notice);
        }
    } else {
        displayNoticeDetail(notice);
    }
}

// 공지사항 상세 정보 표시
function displayNoticeDetail(notice) {
    // 배지
    const badgeEl = document.getElementById('detailBadge');
    badgeEl.className = `detail-badge badge badge-${notice.badge}`;
    badgeEl.textContent = getBadgeText(notice.badge);

    // 제목, 작성자, 날짜, 조회수
    document.getElementById('detailTitle').textContent = notice.title;
    document.getElementById('detailAuthor').textContent = `작성자: ${notice.author}`;
    document.getElementById('detailDate').textContent = `작성일: ${notice.date}`;
    document.getElementById('detailViews').textContent = `조회수: ${notice.views.toLocaleString()}`;

    // 이미지 표시
    const detailImageContainer = document.getElementById('detailImage');
    const detailImageContent = document.getElementById('detailImageContent');

    if (notice.boardImage) {
        // boardImage 객체가 있는 경우 이미지 URL 생성
        // 응답 형식 1: imageUrl 필드가 있는 경우 (직접 URL)
        if (notice.boardImage.imageUrl) {
            detailImageContent.src = notice.boardImage.imageUrl;
            detailImageContainer.style.display = 'block';
        }
        // 응답 형식 2: imageId로 조회 (JWT 인증 필요, Blob 변환)
        else if (notice.boardImage.imageId) {
            // 비동기로 이미지 가져오기
            apiClient.getBoardImage(notice.boardImage.imageId)
                .then(blobUrl => {
                    detailImageContent.src = blobUrl;
                    detailImageContainer.style.display = 'block';
                })
                .catch(error => {
                    console.error('이미지 조회 실패:', error);
                    detailImageContainer.style.display = 'none';
                });
        } else {
            detailImageContainer.style.display = 'none';
        }
    } else {
        detailImageContainer.style.display = 'none';
    }

    document.getElementById('detailContent').textContent = notice.content;

    // 관리자면 수정/삭제 버튼 표시 (하드코딩 데이터는 제외)
    const detailActions = document.getElementById('detailActions');
    if (isAdmin && !notice.isHardcoded) {
        detailActions.style.display = 'flex';
        detailActions.dataset.noticeId = notice.id;
    } else {
        detailActions.style.display = 'none';
    }

    document.getElementById('viewModal').classList.add('show');
}

// 상세보기 모달 닫기
function closeViewModal() {
    document.getElementById('viewModal').classList.remove('show');
}

// 폼 제출 처리
async function handleSubmit(e) {
    e.preventDefault();

    if (!isAdmin) {
        showToast('관리자만 글을 작성/수정할 수 있습니다.', 'warning');
        return;
    }

    const title = document.getElementById('noticeTitle').value.trim();
    const content = document.getElementById('noticeContent').value.trim();

    if (!title || !content) {
        showToast('제목과 내용을 입력해주세요.', 'warning');
        return;
    }

    try {
        let imageId = currentImageId;

        // 새로운 이미지 파일이 선택된 경우 업로드
        if (selectedImageFile) {
            try {
                const uploadResponse = await apiClient.uploadBoardImage(selectedImageFile);

                // 응답 형식 확인 및 imageId 추출
                if (uploadResponse) {
                    // 응답 형식 1: { success: true, data: { imageId: ... } }
                    if (uploadResponse.success && uploadResponse.data && uploadResponse.data.imageId) {
                        imageId = uploadResponse.data.imageId;
                        currentImageId = imageId;
                    }
                    // 응답 형식 2: { data: { imageId: ... } }
                    else if (uploadResponse.data && uploadResponse.data.imageId) {
                        imageId = uploadResponse.data.imageId;
                        currentImageId = imageId;
                    }
                    // 응답 형식 3: { imageId: ... }
                    else if (uploadResponse.imageId) {
                        imageId = uploadResponse.imageId;
                        currentImageId = imageId;
                    }
                    else {
                        console.error('예상치 못한 응답 형식:', uploadResponse);
                        throw new Error('이미지 업로드 응답 형식이 올바르지 않습니다.');
                    }
                } else {
                    throw new Error('이미지 업로드에 실패했습니다.');
                }
            } catch (uploadError) {
                console.error('이미지 업로드 실패:', uploadError);
                showToast('이미지 업로드에 실패했습니다. 이미지 없이 진행하시겠습니까?', 'warning');
                // 이미지 업로드 실패 시 imageId는 null로 유지
                imageId = null;
            }
        }

        const noticeData = {
            title: title,
            content: content,
            imageId: imageId // 이미지 ID 추가
            // badge는 UI용이므로 API에는 전송하지 않음
        };

        if (editingNoticeId) {
            // 수정
            const response = await apiClient.updateNotice(editingNoticeId, noticeData);

            if (response.success) {
                showToast('공지사항이 수정되었습니다.', 'success');
                closeWriteModal();
                currentPage = 1;
                await loadNoticesFromAPI(0);
            } else {
                throw new Error(response.message || '수정에 실패했습니다.');
            }
        } else {
            // 새 글 작성
            const response = await apiClient.createNotice(noticeData);

            if (response.success) {
                showToast('공지사항이 등록되었습니다.', 'success');
                closeWriteModal();
                currentPage = 1;
                await loadNoticesFromAPI(0);
            } else {
                throw new Error(response.message || '등록에 실패했습니다.');
            }
        }
    } catch (error) {
        console.error('공지사항 저장 실패:', error);
        let errorMessage = editingNoticeId ? '공지사항 수정에 실패했습니다.' : '공지사항 등록에 실패했습니다.';

        if (error.data && error.data.message) {
            errorMessage = error.data.message;
        } else if (error.message) {
            errorMessage = error.message;
        }

        showToast(errorMessage, 'error');
    }
}

// 수정 처리
function handleEdit() {
    const noticeId = document.getElementById('detailActions').dataset.noticeId;
    const notice = notices.find(n => n.id == noticeId);

    if (!notice || notice.isHardcoded) {
        showToast('하드코딩된 공지사항은 수정할 수 없습니다.', 'warning');
        return;
    }

    editingNoticeId = notice.noticeId;

    document.getElementById('modalTitle').textContent = '공지사항 수정';
    document.getElementById('noticeId').value = notice.noticeId;
    document.getElementById('noticeBadge').value = notice.badge || 'normal';
    document.getElementById('noticeTitle').value = notice.title;
    document.getElementById('noticeContent').value = notice.content;

    // 기존 이미지가 있는 경우 미리보기 표시
    if (notice.boardImage) {
        currentImageId = notice.boardImage.imageId;

        // 응답 형식 1: imageUrl 필드가 있는 경우 (직접 URL)
        if (notice.boardImage.imageUrl) {
            document.getElementById('previewImg').src = notice.boardImage.imageUrl;
            document.getElementById('imagePreview').style.display = 'block';
        }
        // 응답 형식 2: imageId로 조회 (JWT 인증 필요, Blob 변환)
        else if (notice.boardImage.imageId) {
            // 비동기로 이미지 가져오기
            apiClient.getBoardImage(notice.boardImage.imageId)
                .then(blobUrl => {
                    document.getElementById('previewImg').src = blobUrl;
                    document.getElementById('imagePreview').style.display = 'block';
                })
                .catch(error => {
                    console.error('이미지 조회 실패:', error);
                    document.getElementById('imagePreview').style.display = 'none';
                });
        } else {
            document.getElementById('imagePreview').style.display = 'none';
        }
    } else {
        currentImageId = null;
        document.getElementById('imagePreview').style.display = 'none';
    }

    selectedImageFile = null; // 새 파일 선택 초기화

    closeViewModal();
    document.getElementById('writeModal').classList.add('show');
}

// 삭제 처리
async function handleDelete() {
    const confirmed = await showConfirm('정말 삭제하시겠습니까?', '삭제', '취소', '공지사항 삭제');
    if (!confirmed) return;

    const noticeId = document.getElementById('detailActions').dataset.noticeId;
    const notice = notices.find(n => n.id == noticeId);

    if (!notice || notice.isHardcoded) {
        showToast('하드코딩된 공지사항은 삭제할 수 없습니다.', 'warning');
        return;
    }

    try {
        const response = await apiClient.deleteNotice(notice.noticeId);

        if (response.success) {
            showToast('공지사항이 삭제되었습니다.', 'success');
            closeViewModal();
            currentPage = 1;
            await loadNoticesFromAPI(0);
        } else {
            throw new Error(response.message || '삭제에 실패했습니다.');
        }
    } catch (error) {
        console.error('공지사항 삭제 실패:', error);
        let errorMessage = '공지사항 삭제에 실패했습니다.';

        if (error.data && error.data.message) {
            errorMessage = error.data.message;
        } else if (error.message) {
            errorMessage = error.message;
        }

        showToast(errorMessage, 'error');
    }
}

// 이미지 선택 처리
function handleImageSelect(e) {
    const file = e.target.files[0];
    if (!file) return;

    // 파일 크기 검증 (5MB 제한)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
        showToast('이미지 크기는 5MB 이하로 제한됩니다.', 'warning');
        e.target.value = '';
        return;
    }

    // 이미지 파일 형식 검증
    if (!file.type.startsWith('image/')) {
        showToast('이미지 파일만 업로드 가능합니다.', 'warning');
        e.target.value = '';
        return;
    }

    selectedImageFile = file;

    // 미리보기 표시
    const reader = new FileReader();
    reader.onload = function(event) {
        document.getElementById('previewImg').src = event.target.result;
        document.getElementById('imagePreview').style.display = 'block';
    };
    reader.readAsDataURL(file);
}

// 이미지 제거
function removeImage() {
    selectedImageFile = null;
    currentImageId = null;
    document.getElementById('noticeImage').value = '';
    document.getElementById('imagePreview').style.display = 'none';
    document.getElementById('previewImg').src = '';
}

// URL 파라미터에서 noticeId를 읽어서 해당 공지사항 모달 자동 열기
function checkAndOpenNoticeFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const noticeId = urlParams.get('noticeId');

    if (noticeId) {
        console.log('[URL] noticeId 파라미터 감지:', noticeId);

        // 약간의 딜레이 후 모달 열기 (렌더링 완료 대기)
        setTimeout(() => {
            viewNotice(noticeId);

            // URL에서 파라미터 제거 (히스토리 깔끔하게 유지)
            const url = new URL(window.location);
            url.searchParams.delete('noticeId');
            window.history.replaceState({}, '', url);
        }, 500);
    }
}
