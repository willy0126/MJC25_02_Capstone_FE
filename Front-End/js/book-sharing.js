/**
 * 도서 나눔 게시판 (Book Sharing)
 * API 연동 버전
 */
document.addEventListener("DOMContentLoaded", () => {
    // DOM 요소
    const writeBtn = document.getElementById("writeBtn");
    const writeModal = document.getElementById("writeModal");
    const writeModalClose = document.getElementById("writeModalClose");
    const saveBookBtn = document.getElementById("saveBookBtn");
    const tableBody = document.getElementById("book-sharingTableBody");
    const modalTitle = document.getElementById("modalTitle");

    const bookImageInput = document.getElementById("bookImageInput");
    const bookImagePreview = document.getElementById("bookImagePreview");
    const bookTitleInput = document.getElementById("bookTitleInput");
    const bookContentInput = document.getElementById("bookContentInput");
    const bookStatusInput = document.getElementById("bookStatusInput");

    const searchInput = document.getElementById("searchInput");
    const searchBtn = document.getElementById("searchBtn");

    const viewModal = document.getElementById("viewModal");
    const viewModalClose = document.getElementById("viewModalClose");
    const closeViewBtn = document.getElementById("closeViewBtn");

    const prevPageBtn = document.getElementById("prevPageBtn");
    const nextPageBtn = document.getElementById("nextPageBtn");
    const pageInfo = document.getElementById("pageInfo");

    // 상태 관리
    let currentEditId = null;  // 수정 중인 게시글 ID
    let currentPage = 0;       // 현재 페이지 (0-indexed)
    let totalPages = 1;
    let currentKeyword = '';
    const pageSize = 10;

    // 현재 로그인 사용자 정보
    let currentUserId = null;

    // 상태 매핑
    const STATUS_MAP = {
        'SHARING': '나눔중',
        'RESERVED': '예약중',
        'COMPLETED': '완료'
    };

    const STATUS_MAP_REVERSE = {
        '나눔중': 'SHARING',
        '예약중': 'RESERVED',
        '완료': 'COMPLETED'
    };

    // ========================================
    // 알림 모달
    // ========================================
    const alertModal = document.getElementById('alertModal');
    const alertMessage = document.getElementById('alertMessage');
    const alertConfirmBtn = document.getElementById('alertConfirmBtn');
    let alertCallback = null;

    /**
     * 알림 모달 표시
     * @param {string} message - 표시할 메시지
     * @param {string} type - 'success' | 'error' | 'warning' | 'info'
     * @param {function} callback - 확인 버튼 클릭 후 콜백
     */
    function showAlert(message, type = 'info', callback = null) {
        alertMessage.textContent = message;
        alertModal.className = `alert-modal show alert-${type}`;
        alertCallback = callback;
    }

    function closeAlert() {
        alertModal.classList.remove('show');
        if (alertCallback) {
            alertCallback();
            alertCallback = null;
        }
    }

    // 알림 모달 이벤트
    if (alertConfirmBtn) {
        alertConfirmBtn.addEventListener('click', closeAlert);
    }
    if (alertModal) {
        alertModal.addEventListener('click', (e) => {
            if (e.target === alertModal) closeAlert();
        });
    }

    // ========================================
    // 확인 모달 (confirm 대체)
    // ========================================
    const confirmModal = document.getElementById('confirmModal');
    const confirmMessage = document.getElementById('confirmMessage');
    const confirmOkBtn = document.getElementById('confirmOkBtn');
    const confirmCancelBtn = document.getElementById('confirmCancelBtn');
    let confirmCallback = null;

    /**
     * 확인 모달 표시
     * @param {string} message - 표시할 메시지
     * @param {function} onConfirm - 확인 버튼 클릭 시 콜백
     */
    function showConfirm(message, onConfirm) {
        confirmMessage.textContent = message;
        confirmModal.classList.add('show');
        confirmCallback = onConfirm;
    }

    function closeConfirm(confirmed) {
        confirmModal.classList.remove('show');
        if (confirmed && confirmCallback) {
            confirmCallback();
        }
        confirmCallback = null;
    }

    // 확인 모달 이벤트
    if (confirmOkBtn) {
        confirmOkBtn.addEventListener('click', () => closeConfirm(true));
    }
    if (confirmCancelBtn) {
        confirmCancelBtn.addEventListener('click', () => closeConfirm(false));
    }
    if (confirmModal) {
        confirmModal.addEventListener('click', (e) => {
            if (e.target === confirmModal) closeConfirm(false);
        });
    }

    // ========================================
    // 초기화
    // ========================================
    async function init() {
        // 현재 사용자 정보 가져오기
        try {
            const userInfo = await apiClient.getUserInfo();
            if (userInfo.success && userInfo.data) {
                currentUserId = userInfo.data.userId;
            }
        } catch (e) {
            console.log('로그인되지 않은 사용자');
        }

        // 글쓰기 버튼 표시 (로그인한 경우만)
        if (writeBtn) {
            writeBtn.style.display = currentUserId ? 'block' : 'none';
        }

        // 게시글 목록 로드
        await loadShareList();
    }

    // ========================================
    // 목록 조회 (GET /api/share)
    // ========================================
    async function loadShareList(page = 0, keyword = '') {
        try {
            tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center;">로딩중...</td></tr>';

            let endpoint = `/share?page=${page}&size=${pageSize}`;
            if (keyword) {
                endpoint += `&keyword=${encodeURIComponent(keyword)}`;
            }

            const response = await apiClient.request(endpoint);

            if (response.success && response.data) {
                const { content, totalPages: tp, number } = response.data;
                totalPages = tp || 1;
                currentPage = number || 0;

                renderTable(content || []);
                updatePagination();
            } else {
                tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center;">데이터를 불러올 수 없습니다.</td></tr>';
            }
        } catch (error) {
            console.error('목록 조회 오류:', error);
            tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center;">오류가 발생했습니다.</td></tr>';
        }
    }

    // ========================================
    // 이미지 URL 생성 헬퍼
    // ========================================
    function getImageUrl(item) {
        // imageId가 있으면 API 경로로 구성
        if (item.imageId) {
            return `/api/images/${item.imageId}`;
        }
        // imageUrl이 전체 경로면 그대로 사용
        if (item.imageUrl && item.imageUrl.startsWith('/')) {
            return item.imageUrl;
        }
        // imageUrl이 파일명만 있으면 null 반환 (표시 불가)
        return null;
    }

    // ========================================
    // 테이블 렌더링
    // ========================================
    function renderTable(items) {
        tableBody.innerHTML = '';

        if (!items || items.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center;">등록된 나눔글이 없습니다.</td></tr>';
            return;
        }

        items.forEach(item => {
            const row = tableBody.insertRow();
            row.style.cursor = 'pointer';

            // 이미지
            const imgCell = row.insertCell(0);
            const imgUrl = getImageUrl(item);
            if (imgUrl) {
                imgCell.innerHTML = `<img src="${escapeHtml(imgUrl)}" alt="책 이미지" style="max-width:60px; max-height:80px; object-fit:cover;">`;
            } else {
                imgCell.innerHTML = '<span style="color:#999;">이미지 없음</span>';
            }

            // 제목
            row.insertCell(1).textContent = item.title || '';

            // 상태
            const statusText = STATUS_MAP[item.meetStatus] || item.meetStatus || '';
            const statusCell = row.insertCell(2);
            statusCell.innerHTML = `<span class="status-badge status-${(item.meetStatus || '').toLowerCase()}">${statusText}</span>`;

            // 관리 버튼
            const actionCell = row.insertCell(3);

            // 본인 글인 경우만 수정/삭제 버튼 표시
            const isOwner = currentUserId && item.author && item.author.userId === currentUserId;

            if (isOwner) {
                const editBtn = document.createElement("button");
                editBtn.textContent = "수정";
                editBtn.className = "edit-btn";
                editBtn.addEventListener("click", (e) => {
                    e.stopPropagation();
                    openEditModal(item);
                });

                const delBtn = document.createElement("button");
                delBtn.textContent = "삭제";
                delBtn.className = "delete-btn";
                delBtn.addEventListener("click", (e) => {
                    e.stopPropagation();
                    deleteShare(item.shareId);
                });

                actionCell.appendChild(editBtn);
                actionCell.appendChild(delBtn);
            }

            // 행 클릭 시 상세 보기
            row.addEventListener("click", () => viewShareDetail(item.shareId));
        });
    }

    // ========================================
    // 페이지네이션 업데이트
    // ========================================
    function updatePagination() {
        pageInfo.textContent = `${currentPage + 1} / ${totalPages || 1}`;
        prevPageBtn.disabled = currentPage <= 0;
        nextPageBtn.disabled = currentPage >= totalPages - 1;
    }

    // ========================================
    // 상세 조회 (GET /api/share/{shareId})
    // ========================================
    async function viewShareDetail(shareId) {
        try {
            const response = await apiClient.request(`/share/${shareId}`);

            if (response.success && response.data) {
                const item = response.data;

                // 상세 모달에 데이터 표시
                document.getElementById('detailImage').src = getImageUrl(item) || '';
                document.getElementById('detailTitle').textContent = item.title || '';
                document.getElementById('detailAuthor').textContent = `작성자: ${item.author?.nickname || '알 수 없음'}`;
                document.getElementById('detailDate').textContent = `작성일: ${formatDate(item.createdAt)}`;
                document.getElementById('detailViews').textContent = `조회수: ${item.views || 0}`;
                document.getElementById('detailContent').textContent = item.content || '';

                // 상태 표시
                const detailBadge = document.getElementById('detailBadge');
                const statusText = STATUS_MAP[item.meetStatus] || item.meetStatus || '';
                detailBadge.textContent = statusText;
                detailBadge.className = `detail-badge status-badge status-${(item.meetStatus || '').toLowerCase()}`;
                detailBadge.style.display = 'inline-block';

                // 본인 글인 경우 상태 변경 버튼 표시
                const detailActions = document.getElementById('detailActions');
                detailActions.innerHTML = '';

                const isOwner = currentUserId && item.author && item.author.userId === currentUserId;
                if (isOwner && item.meetStatus !== 'COMPLETED') {
                    detailActions.style.display = 'flex';

                    if (item.meetStatus === 'SHARING') {
                        const reserveBtn = document.createElement('button');
                        reserveBtn.textContent = '예약중으로 변경';
                        reserveBtn.className = 'btn-status';
                        reserveBtn.addEventListener('click', () => changeStatus(shareId, 'RESERVED'));
                        detailActions.appendChild(reserveBtn);
                    }

                    const completeBtn = document.createElement('button');
                    completeBtn.textContent = '나눔완료';
                    completeBtn.className = 'btn-status btn-complete';
                    completeBtn.addEventListener('click', () => changeStatus(shareId, 'COMPLETED'));
                    detailActions.appendChild(completeBtn);
                } else {
                    detailActions.style.display = 'none';
                }

                viewModal.classList.add('show');
            }
        } catch (error) {
            console.error('상세 조회 오류:', error);
            showAlert('게시글을 불러올 수 없습니다.', 'error');
        }
    }

    // ========================================
    // 글 작성 (POST /api/share)
    // ========================================
    async function createShare() {
        const title = bookTitleInput.value.trim();
        const content = bookContentInput.value.trim();
        const meetStatus = STATUS_MAP_REVERSE[bookStatusInput.value] || 'SHARING';
        const imageFile = bookImageInput.files[0];

        if (!title || !content) {
            showAlert('제목과 내용을 입력해주세요.', 'warning');
            return;
        }

        try {
            const formData = new FormData();
            formData.append('title', title);
            formData.append('content', content);
            formData.append('meetStatus', meetStatus);
            if (imageFile) {
                formData.append('image', imageFile);
            }

            const response = await apiClient.request('/share', {
                method: 'POST',
                headers: {}, // Content-Type은 자동 설정
                body: formData
            });

            if (response.success) {
                showAlert('게시글이 등록되었습니다.', 'success', () => {
                    closeWriteModal();
                    loadShareList(currentPage, currentKeyword);
                });
            } else {
                showAlert(response.message || '등록에 실패했습니다.', 'error');
            }
        } catch (error) {
            console.error('글 작성 오류:', error);
            showAlert('게시글 등록 중 오류가 발생했습니다.', 'error');
        }
    }

    // ========================================
    // 글 수정 (PUT /api/share/{shareId})
    // ========================================
    async function updateShare() {
        if (!currentEditId) return;

        const title = bookTitleInput.value.trim();
        const content = bookContentInput.value.trim();
        const meetStatus = STATUS_MAP_REVERSE[bookStatusInput.value] || 'SHARING';
        const imageFile = bookImageInput.files[0];

        if (!title || !content) {
            showAlert('제목과 내용을 입력해주세요.', 'warning');
            return;
        }

        try {
            const formData = new FormData();
            formData.append('title', title);
            formData.append('content', content);
            formData.append('meetStatus', meetStatus);
            if (imageFile) {
                formData.append('image', imageFile);
            }

            const response = await apiClient.request(`/share/${currentEditId}`, {
                method: 'PUT',
                headers: {},
                body: formData
            });

            if (response.success) {
                showAlert('게시글이 수정되었습니다.', 'success', () => {
                    closeWriteModal();
                    loadShareList(currentPage, currentKeyword);
                });
            } else {
                showAlert(response.message || '수정에 실패했습니다.', 'error');
            }
        } catch (error) {
            console.error('글 수정 오류:', error);
            showAlert('게시글 수정 중 오류가 발생했습니다.', 'error');
        }
    }

    // ========================================
    // 글 삭제 (DELETE /api/share/{shareId})
    // ========================================
    function deleteShare(shareId) {
        showConfirm('정말 삭제하시겠습니까?', async () => {
            try {
                const response = await apiClient.request(`/share/${shareId}`, {
                    method: 'DELETE'
                });

                if (response.success) {
                    showAlert('게시글이 삭제되었습니다.', 'success', () => {
                        loadShareList(currentPage, currentKeyword);
                    });
                } else {
                    showAlert(response.message || '삭제에 실패했습니다.', 'error');
                }
            } catch (error) {
                console.error('글 삭제 오류:', error);
                showAlert('게시글 삭제 중 오류가 발생했습니다.', 'error');
            }
        });
    }

    // ========================================
    // 상태 변경 (PATCH /api/share/{shareId}/status)
    // ========================================
    async function changeStatus(shareId, newStatus) {
        try {
            const response = await apiClient.request(`/share/${shareId}/status`, {
                method: 'PATCH',
                body: JSON.stringify({ meetStatus: newStatus })
            });

            if (response.success) {
                showAlert('상태가 변경되었습니다.', 'success', () => {
                    closeViewModal();
                    loadShareList(currentPage, currentKeyword);
                });
            } else {
                showAlert(response.message || '상태 변경에 실패했습니다.', 'error');
            }
        } catch (error) {
            console.error('상태 변경 오류:', error);
            showAlert('상태 변경 중 오류가 발생했습니다.', 'error');
        }
    }

    // ========================================
    // 모달 관련
    // ========================================
    function openWriteModal() {
        currentEditId = null;
        modalTitle.textContent = '글쓰기';
        bookImageInput.value = '';
        bookImagePreview.src = '';
        bookImagePreview.style.display = 'none';
        bookTitleInput.value = '';
        bookContentInput.value = '';
        bookStatusInput.value = '나눔중';
        writeModal.style.display = 'flex';
    }

    function openEditModal(item) {
        currentEditId = item.shareId;
        modalTitle.textContent = '글 수정';
        const editImgUrl = getImageUrl(item);
        bookImagePreview.src = editImgUrl || '';
        bookImagePreview.style.display = editImgUrl ? 'block' : 'none';
        bookImageInput.value = '';
        bookTitleInput.value = item.title || '';
        bookContentInput.value = item.content || '';
        bookStatusInput.value = STATUS_MAP[item.meetStatus] || '나눔중';
        writeModal.style.display = 'flex';
    }

    function closeWriteModal() {
        writeModal.style.display = 'none';
        currentEditId = null;
    }

    function closeViewModal() {
        viewModal.classList.remove('show');
    }

    // ========================================
    // 유틸리티
    // ========================================
    function formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('ko-KR');
    }

    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // ========================================
    // 이벤트 리스너
    // ========================================

    // 글쓰기 버튼
    if (writeBtn) {
        writeBtn.addEventListener('click', () => {
            if (!currentUserId) {
                showAlert('로그인이 필요합니다.', 'warning', () => {
                    window.location.href = '/login.html';
                });
                return;
            }
            openWriteModal();
        });
    }

    // 저장 버튼
    if (saveBookBtn) {
        saveBookBtn.addEventListener('click', () => {
            if (currentEditId) {
                updateShare();
            } else {
                createShare();
            }
        });
    }

    // 모달 닫기
    if (writeModalClose) {
        writeModalClose.addEventListener('click', closeWriteModal);
    }
    if (viewModalClose) {
        viewModalClose.addEventListener('click', closeViewModal);
    }
    if (closeViewBtn) {
        closeViewBtn.addEventListener('click', closeViewModal);
    }

    // 모달 외부 클릭 시 닫기
    window.addEventListener('click', (e) => {
        if (e.target === writeModal) closeWriteModal();
        if (e.target === viewModal) closeViewModal();
    });

    // 이미지 미리보기 (파일 크기 검증 포함)
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    if (bookImageInput) {
        bookImageInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                // 파일 크기 검증
                if (file.size > MAX_FILE_SIZE) {
                    showAlert(`이미지 파일 크기가 너무 큽니다.\n최대 5MB까지 업로드 가능합니다.\n현재 파일 크기: ${(file.size / 1024 / 1024).toFixed(2)}MB`, 'warning');
                    bookImageInput.value = '';
                    bookImagePreview.src = '';
                    bookImagePreview.style.display = 'none';
                    return;
                }

                const reader = new FileReader();
                reader.onload = (e) => {
                    bookImagePreview.src = e.target.result;
                    bookImagePreview.style.display = 'block';
                };
                reader.readAsDataURL(file);
            } else {
                bookImagePreview.src = '';
                bookImagePreview.style.display = 'none';
            }
        });
    }

    // 검색
    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            currentKeyword = searchInput.value.trim();
            currentPage = 0;
            loadShareList(0, currentKeyword);
        });
    }
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                currentKeyword = searchInput.value.trim();
                currentPage = 0;
                loadShareList(0, currentKeyword);
            }
        });
    }

    // 페이지네이션
    if (prevPageBtn) {
        prevPageBtn.addEventListener('click', () => {
            if (currentPage > 0) {
                loadShareList(currentPage - 1, currentKeyword);
            }
        });
    }
    if (nextPageBtn) {
        nextPageBtn.addEventListener('click', () => {
            if (currentPage < totalPages - 1) {
                loadShareList(currentPage + 1, currentKeyword);
            }
        });
    }

    // 초기화 실행
    init();
});
