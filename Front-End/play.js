document.addEventListener('DOMContentLoaded', async function() {
    const categoryButtons = document.querySelectorAll('.category-btn');
    const contestGrid = document.getElementById('contestGrid');
    const emptyState = document.getElementById('emptyState');
    const createContestBtn = document.getElementById('createContestBtn');
    const createContestModal = document.getElementById('createContestModal');
    const closeCreateModal = document.getElementById('closeCreateModal');
    const cancelCreateBtn = document.getElementById('cancelCreateBtn');
    const createContestForm = document.getElementById('createContestForm');

    let contests = [];
    let currentCategory = 'ongoing';

    // 관리자 권한 확인 (로그인된 사용자의 role 체크)
    checkAdminRole();

    // 대회 목록 조회
    async function loadContests() {
        try {
            // GET /api/contest (인증 토큰 포함)
            const response = await apiClient.request('/contest', {
                method: 'GET'
            });

            console.log('대회 목록 API 응답:', response);

            // 응답 구조에 따라 데이터 추출
            let contestList = [];
            if (response.success && response.data) {
                contestList = Array.isArray(response.data) ? response.data :
                             (response.data.content || response.data.contests || []);
            } else if (Array.isArray(response)) {
                contestList = response;
            }

            console.log('추출된 대회 목록:', contestList);

            if (contestList.length > 0) {
                contests = contestList;
                renderContests();
            } else {
                // API에서 데이터가 없으면 HTML의 기존 카드 사용
                console.log('API 데이터 없음. HTML 카드 사용');
                useHtmlCards();
            }
        } catch (error) {
            console.error('대회 목록 조회 실패:', error);
            // API 실패 시 HTML의 기존 카드 사용
            useHtmlCards();
        }
    }

    // HTML에 하드코딩된 카드 사용
    function useHtmlCards() {
        const existingCards = document.querySelectorAll('.contest-card');
        if (existingCards.length > 0) {
            // 기존 카드에 클릭 이벤트만 추가
            existingCards.forEach(card => {
                card.addEventListener('click', function() {
                    const status = this.dataset.status;
                    const contestId = this.dataset.id;

                    if (status === 'ongoing') {
                        window.location.href = `play-detail.html?id=${contestId}`;
                    } else if (status === 'upcoming') {
                        showToast('아직 시작되지 않은 대회입니다.', 'info');
                    } else {
                        // 종료된 대회도 상세페이지 접근 가능 (결과 확인용)
                        window.location.href = `play-detail.html?id=${contestId}`;
                    }
                });
            });

            // 초기 필터링
            filterHtmlCards('ongoing');
        }
    }

    // HTML 카드 필터링
    function filterHtmlCards(category) {
        const cards = document.querySelectorAll('.contest-card');
        let visibleCount = 0;

        cards.forEach(card => {
            if (card.dataset.status === category) {
                card.style.display = 'block';
                visibleCount++;
            } else {
                card.style.display = 'none';
            }
        });

        if (visibleCount === 0) {
            emptyState.classList.remove('hidden');
        } else {
            emptyState.classList.add('hidden');
        }
    }

    // 대회 목록 렌더링
    function renderContests() {
        contestGrid.innerHTML = '';

        const filteredContests = contests.filter(contest => {
            const status = getContestStatus(contest);
            return status === currentCategory;
        });

        if (filteredContests.length === 0) {
            emptyState.classList.remove('hidden');
            return;
        }

        emptyState.classList.add('hidden');

        // 관리자 여부 확인
        const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
        const isAdmin = userInfo.role === 'ADMIN';

        filteredContests.forEach(contest => {
            const status = getContestStatus(contest);
            const statusInfo = getStatusInfo(status);

            const card = document.createElement('div');
            card.className = 'contest-card';
            card.dataset.status = status;
            card.dataset.id = contest.contestId;

            // 관리자면 수정/삭제 버튼 추가
            const editBtn = isAdmin ? `<button class="contest-edit-btn" data-id="${contest.contestId}" title="수정">✏️</button>` : '';
            const deleteBtn = isAdmin ? `<button class="contest-delete-btn" data-id="${contest.contestId}" title="삭제">×</button>` : '';

            // 이미지 URL 결정
            console.log('대회 이미지 정보:', contest.title, contest.image, contest.imageId);

            let imageUrl = '../assets/pics/창작 그림책 공모전.jpg';
            if (contest.imageUrl) {
                imageUrl = contest.imageUrl;
            } else if (contest.image?.url) {
                imageUrl = contest.image.url;
            } else if (contest.image?.filePath) {
                imageUrl = `/api/images/${contest.image.imageId}`;
            } else if (contest.image?.file_path) {
                imageUrl = `/api/images/${contest.image.imageId || contest.image.image_id}`;
            } else if (contest.image?.imageId) {
                imageUrl = `/api/images/${contest.image.imageId}`;
            } else if (contest.imageId) {
                imageUrl = `/api/images/${contest.imageId}`;
            }

            console.log('최종 이미지 URL:', imageUrl);

            card.innerHTML = `
                ${editBtn}
                ${deleteBtn}
                <div class="contest-image">
                    <img src="${imageUrl}" alt="${contest.title}">
                </div>
                <div class="contest-info">
                    <span class="contest-status ${statusInfo.class}">${statusInfo.text}</span>
                    <h3 class="contest-title">${contest.title}</h3>
                    <p class="contest-date">${formatDateRange(contest.startDate, contest.endDate)}</p>
                </div>
            `;

            // 수정 버튼 클릭 이벤트
            const editBtnEl = card.querySelector('.contest-edit-btn');
            if (editBtnEl) {
                editBtnEl.addEventListener('click', function(e) {
                    e.stopPropagation();
                    openEditModal(contest);
                });
            }

            // 삭제 버튼 클릭 이벤트
            const deleteBtnEl = card.querySelector('.contest-delete-btn');
            if (deleteBtnEl) {
                deleteBtnEl.addEventListener('click', function(e) {
                    e.stopPropagation(); // 카드 클릭 이벤트 막기
                    handleDeleteContest(contest.contestId, contest.title);
                });
            }

            // 클릭 이벤트
            card.addEventListener('click', function() {
                handleContestClick(contest, status);
            });

            contestGrid.appendChild(card);
        });
    }

    // 대회 상태 계산
    function getContestStatus(contest) {
        const now = new Date();
        const startDate = new Date(contest.startDate);
        const endDate = new Date(contest.endDate);

        if (now < startDate) {
            return 'upcoming';
        } else if (now > endDate) {
            return 'completed';
        } else {
            return 'ongoing';
        }
    }

    // 상태별 정보 반환
    function getStatusInfo(status) {
        const statusMap = {
            ongoing: { text: '진행중', class: 'status-ongoing' },
            upcoming: { text: '예정', class: 'status-upcoming' },
            completed: { text: '종료', class: 'status-completed' }
        };
        return statusMap[status] || statusMap.ongoing;
    }

    // 날짜 범위 포맷팅
    function formatDateRange(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);

        const formatDate = (date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}.${month}.${day}`;
        };

        return `${formatDate(start)} ~ ${formatDate(end)}`;
    }

    // 대회 카드 클릭 처리
    function handleContestClick(contest, status) {
        if (status === 'ongoing') {
            window.location.href = `play-detail.html?id=${contest.contestId}`;
        } else if (status === 'upcoming') {
            showToast('아직 시작되지 않은 대회입니다.', 'info');
        } else {
            // 종료된 대회 → 그림책 생성 모달 열기
            openPicturebookModal(contest);
        }
    }

    // 대회 삭제 처리
    async function handleDeleteContest(contestId, title) {
        if (!confirm(`"${title}" 대회를 삭제하시겠습니까?\n삭제된 대회는 복구할 수 없습니다.`)) {
            return;
        }

        try {
            const response = await apiClient.request(`/contest/${contestId}`, {
                method: 'DELETE'
            });

            if (response.success) {
                showToast('대회가 삭제되었습니다.', 'success');
                // 목록에서 제거
                contests = contests.filter(c => c.contestId !== contestId);
                renderContests();
            } else {
                showToast(response.message || '대회 삭제에 실패했습니다.', 'error');
            }
        } catch (error) {
            console.error('대회 삭제 실패:', error);
            showToast('대회 삭제에 실패했습니다.', 'error');
        }
    }

    // 카테고리 버튼 클릭 이벤트
    categoryButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            categoryButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            currentCategory = this.dataset.category;

            // API 데이터가 있으면 렌더링, 없으면 HTML 카드 필터링
            if (contests.length > 0) {
                renderContests();
            } else {
                filterHtmlCards(currentCategory);
            }
        });
    });

    // 관리자 권한 확인
    function checkAdminRole() {
        const userInfo = localStorage.getItem('userInfo');
        if (userInfo) {
            try {
                const user = JSON.parse(userInfo);
                console.log('User info:', user); // 디버깅용
                if (user.role === 'ADMIN') {
                    createContestBtn.style.display = 'block';
                }
            } catch (e) {
                console.error('Error parsing userInfo:', e);
            }
        }
    }

    // 이미지 미리보기
    const contestImageInput = document.getElementById('contestImage');
    const imagePreview = document.getElementById('imagePreview');
    const previewImg = document.getElementById('previewImg');

    if (contestImageInput) {
        contestImageInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    previewImg.src = e.target.result;
                    imagePreview.style.display = 'block';
                };
                reader.readAsDataURL(file);
            } else {
                imagePreview.style.display = 'none';
            }
        });
    }

    // 대회 생성 모달 열기
    if (createContestBtn) {
        createContestBtn.addEventListener('click', function() {
            createContestModal.classList.add('show');
            createContestModal.style.display = 'flex';
        });
    }

    // 대회 생성 모달 닫기
    function closeModal() {
        createContestModal.classList.remove('show');
        createContestModal.style.display = 'none';
        createContestForm.reset();
        // 이미지 미리보기 초기화
        if (imagePreview) {
            imagePreview.style.display = 'none';
        }
    }

    if (closeCreateModal) {
        closeCreateModal.addEventListener('click', closeModal);
    }

    if (cancelCreateBtn) {
        cancelCreateBtn.addEventListener('click', closeModal);
    }

    // 모달 배경 클릭 시 닫기
    if (createContestModal) {
        createContestModal.addEventListener('click', function(e) {
            if (e.target === createContestModal) {
                closeModal();
            }
        });
    }

    // 대회 생성 폼 제출
    if (createContestForm) {
        createContestForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            // 차수별 날짜 가져오기 (백엔드 API: 1차, 2차, 3차, 최종 -> 내부에서 ROUND_1 등으로 변환)
            const rounds = [
                { round: '1차', start: document.getElementById('round1Start').value, end: document.getElementById('round1End').value },
                { round: '2차', start: document.getElementById('round2Start').value, end: document.getElementById('round2End').value },
                { round: '3차', start: document.getElementById('round3Start').value, end: document.getElementById('round3End').value },
                { round: '최종', start: document.getElementById('round4Start').value, end: document.getElementById('round4End').value }
            ];

            // 날짜 유효성 검사
            for (let i = 0; i < rounds.length; i++) {
                const r = rounds[i];
                if (new Date(r.start) >= new Date(r.end)) {
                    showToast(`${r.round} 종료일은 시작일보다 이후여야 합니다.`, 'error');
                    return;
                }
                // 차수 간 날짜 순서 검사
                if (i > 0) {
                    const prev = rounds[i - 1];
                    if (new Date(r.start) < new Date(prev.end)) {
                        showToast(`${r.round} 시작일은 ${prev.round} 종료일 이후여야 합니다.`, 'error');
                        return;
                    }
                }
            }

            // 대회 전체 시작일/종료일 (1차 시작 ~ 최종 종료)
            const contestStartDate = rounds[0].start;
            const contestEndDate = rounds[3].end;

            // 대회 생성 데이터
            const contestData = {
                title: document.getElementById('contestTitle').value.trim(),
                content: document.getElementById('contestDescription').value.trim(),
                startDate: contestStartDate,
                endDate: contestEndDate
            };

            // 이미지 파일 업로드
            const imageFile = document.getElementById('contestImage').files[0];
            if (imageFile) {
                try {
                    showToast('이미지 업로드 중...', 'info');
                    const uploadResponse = await apiClient.uploadBoardImage(imageFile);
                    console.log('이미지 업로드 응답:', uploadResponse);

                    if (uploadResponse.data && uploadResponse.data.imageId) {
                        contestData.imageId = uploadResponse.data.imageId;
                    }
                } catch (error) {
                    console.error('이미지 업로드 실패:', error);
                    showToast('이미지 업로드에 실패했습니다.', 'error');
                    return;
                }
            }

            console.log('대회 생성 데이터:', contestData);

            try {
                // 1. 대회 생성
                showToast('대회 생성 중...', 'info');
                const contestResponse = await apiClient.request('/contest', {
                    method: 'POST',
                    body: JSON.stringify(contestData)
                });

                if (!contestResponse.success || !contestResponse.data) {
                    throw new Error('대회 생성에 실패했습니다.');
                }

                const contestId = contestResponse.data.contestId;
                console.log('생성된 대회 ID:', contestId);

                // 2. 차수별 상세 정보 생성
                showToast('차수 정보 생성 중...', 'info');
                const startPromptText = document.getElementById('startPrompt').value.trim();

                for (const round of rounds) {
                    const detailData = {
                        contentId: contestId,
                        round: round.round,
                        startDate: round.start,
                        endDate: round.end,
                        startPrompt: startPromptText  // 모든 차수에 동일한 첫 문장 적용
                    };

                    console.log('차수 생성 데이터:', detailData);

                    const detailResponse = await apiClient.request('/contest/detail', {
                        method: 'POST',
                        body: JSON.stringify(detailData)
                    });

                    if (!detailResponse.success) {
                        console.error(`${round.round} 생성 실패:`, detailResponse);
                    }
                }

                showToast('대회가 생성되었습니다!', 'success');
                closeModal();
                await loadContests();

            } catch (error) {
                console.error('대회 생성 실패:', error);
                showToast(error.message || '대회 생성에 실패했습니다.', 'error');
            }
        });
    }

    // ========== 대회 수정 기능 ==========
    const editContestModal = document.getElementById('editContestModal');
    const closeEditModal = document.getElementById('closeEditModal');
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    const editContestForm = document.getElementById('editContestForm');
    const editContestImageInput = document.getElementById('editContestImage');
    const editPreviewImg = document.getElementById('editPreviewImg');

    let currentContestDetails = [];

    // 수정 모달 열기
    async function openEditModal(contest) {

        // 기본 정보 채우기
        document.getElementById('editContestId').value = contest.contestId;
        document.getElementById('editContestTitle').value = contest.title;
        document.getElementById('editContestDescription').value = contest.content || contest.description || '';

        // 이미지 미리보기
        let imageUrl = '../assets/pics/창작 그림책 공모전.jpg';
        if (contest.imageUrl) {
            imageUrl = contest.imageUrl;
        } else if (contest.image?.imageId) {
            imageUrl = `/api/images/${contest.image.imageId}`;
        } else if (contest.imageId) {
            imageUrl = `/api/images/${contest.imageId}`;
        }
        editPreviewImg.src = imageUrl;

        // 차수 정보 조회
        try {
            const detailResponse = await apiClient.request(`/contest/detail/${contest.contestId}`, {
                method: 'GET'
            });

            if (detailResponse.success && detailResponse.data) {
                currentContestDetails = Array.isArray(detailResponse.data) ? detailResponse.data : [detailResponse.data];
                renderEditRoundSchedule();

                // 첫 문장 (첫 번째 차수에서 가져옴)
                const firstDetail = currentContestDetails[0];
                if (firstDetail) {
                    document.getElementById('editStartPrompt').value = firstDetail.startPrompt || firstDetail.start_prompt || '';
                }
            }
        } catch (error) {
            console.error('차수 정보 조회 실패:', error);
            showToast('차수 정보를 불러오는데 실패했습니다.', 'error');
        }

        editContestModal.classList.add('show');
        editContestModal.style.display = 'flex';
    }

    // 차수별 날짜 입력 렌더링
    function renderEditRoundSchedule() {
        const container = document.getElementById('editRoundSchedule');
        container.innerHTML = '';

        const roundLabels = { '1차': '1차', '2차': '2차', '3차': '3차', '최종': '최종' };
        const roundOrder = ['1차', '2차', '3차', '최종'];

        // 차수 순서대로 정렬
        currentContestDetails.sort((a, b) => {
            const orderA = roundOrder.indexOf(a.round);
            const orderB = roundOrder.indexOf(b.round);
            return orderA - orderB;
        });

        currentContestDetails.forEach(detail => {
            const detailsId = detail.detailsId || detail.contestDetailsId || detail.details_id;
            const round = detail.round;
            const startDate = (detail.startDate || detail.start_date || '').split('T')[0];
            const endDate = (detail.endDate || detail.end_date || '').split('T')[0];

            const roundItem = document.createElement('div');
            roundItem.className = 'round-item';
            roundItem.innerHTML = `
                <span class="round-label">${roundLabels[round] || round}</span>
                <div class="round-dates">
                    <input type="date" class="edit-round-start" data-details-id="${detailsId}" data-round="${round}" value="${startDate}" required>
                    <span>~</span>
                    <input type="date" class="edit-round-end" data-details-id="${detailsId}" data-round="${round}" value="${endDate}" required>
                </div>
            `;
            container.appendChild(roundItem);
        });
    }

    // 수정 모달 닫기
    function closeEditModalFn() {
        editContestModal.classList.remove('show');
        editContestModal.style.display = 'none';
        editContestForm.reset();
        currentContestDetails = [];
    }

    if (closeEditModal) {
        closeEditModal.addEventListener('click', closeEditModalFn);
    }

    if (cancelEditBtn) {
        cancelEditBtn.addEventListener('click', closeEditModalFn);
    }

    // 모달 배경 클릭 시 닫기
    if (editContestModal) {
        editContestModal.addEventListener('click', function(e) {
            if (e.target === editContestModal) {
                closeEditModalFn();
            }
        });
    }

    // 수정 이미지 미리보기
    if (editContestImageInput) {
        editContestImageInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    editPreviewImg.src = e.target.result;
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // 수정 폼 제출
    if (editContestForm) {
        editContestForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const contestId = document.getElementById('editContestId').value;

            // 차수별 날짜 가져오기 (대회 전체 시작/종료일 계산용)
            const roundStarts = document.querySelectorAll('.edit-round-start');
            const roundEnds = document.querySelectorAll('.edit-round-end');

            // 대회 전체 시작일 = 1차 시작일, 종료일 = 최종 종료일
            const contestStartDate = roundStarts[0]?.value;
            const contestEndDate = roundEnds[roundEnds.length - 1]?.value;

            // 대회 기본 정보 수정
            const contestData = {
                title: document.getElementById('editContestTitle').value.trim(),
                content: document.getElementById('editContestDescription').value.trim(),
                startDate: contestStartDate,
                endDate: contestEndDate
            };

            // 이미지 파일이 선택된 경우 업로드
            const imageFile = document.getElementById('editContestImage').files[0];
            if (imageFile) {
                try {
                    showToast('이미지 업로드 중...', 'info');
                    const uploadResponse = await apiClient.uploadBoardImage(imageFile);
                    if (uploadResponse.data && uploadResponse.data.imageId) {
                        contestData.imageId = uploadResponse.data.imageId;
                    }
                } catch (error) {
                    console.error('이미지 업로드 실패:', error);
                    showToast('이미지 업로드에 실패했습니다.', 'error');
                    return;
                }
            }

            try {
                // 1. 대회 정보 수정 (PUT /api/contest/{contestId})
                showToast('대회 정보 수정 중...', 'info');
                const contestResponse = await apiClient.request(`/contest/${contestId}`, {
                    method: 'PUT',
                    body: JSON.stringify(contestData)
                });

                if (!contestResponse.success) {
                    throw new Error('대회 정보 수정에 실패했습니다.');
                }

                // 2. 차수별 날짜 수정
                showToast('차수 일정 수정 중...', 'info');
                const startPromptText = document.getElementById('editStartPrompt').value.trim();

                for (let i = 0; i < roundStarts.length; i++) {
                    const detailsId = roundStarts[i].dataset.detailsId;
                    const round = roundStarts[i].dataset.round;
                    const startDate = roundStarts[i].value;
                    const endDate = roundEnds[i].value;

                    // 날짜 유효성 검사
                    if (new Date(startDate) >= new Date(endDate)) {
                        showToast(`${round} 종료일은 시작일보다 이후여야 합니다.`, 'error');
                        return;
                    }

                    const detailData = {
                        round: round,
                        startDate: startDate,
                        endDate: endDate,
                        startPrompt: startPromptText
                    };

                    console.log(`차수 ${round} 수정:`, detailsId, detailData);

                    // PUT /api/contest/detail/{contestId}/{contestDetailsId}
                    const detailResponse = await apiClient.request(`/contest/detail/${contestId}/${detailsId}`, {
                        method: 'PUT',
                        body: JSON.stringify(detailData)
                    });

                    if (!detailResponse.success) {
                        console.error(`${round} 수정 실패:`, detailResponse);
                    }
                }

                showToast('대회가 수정되었습니다!', 'success');
                closeEditModalFn();
                await loadContests();

            } catch (error) {
                console.error('대회 수정 실패:', error);
                showToast(error.message || '대회 수정에 실패했습니다.', 'error');
            }
        });
    }

    // ========== 그림책 생성 모달 ==========
    const picturebookModal = document.getElementById('picturebookModal');
    const closePicturebookModal = document.getElementById('closePicturebookModal');
    const generatePicturebookBtn = document.getElementById('generatePicturebookBtn');
    const winnerStoriesList = document.getElementById('winnerStoriesList');
    const generateProgress = document.getElementById('generateProgress');

    let currentPicturebookContest = null;
    let winnerStories = [];

    // 그림책 모달 열기
    async function openPicturebookModal(contest) {
        currentPicturebookContest = contest;

        // 모달 제목 설정
        document.getElementById('picturebookTitle').textContent = `${contest.title} - 그림책 만들기`;

        // 초기화
        winnerStoriesList.innerHTML = '<p style="text-align: center; color: #999;">1위 이야기를 불러오는 중...</p>';
        generateProgress.style.display = 'none';
        generatePicturebookBtn.disabled = false;

        // 모달 표시
        picturebookModal.classList.add('show');
        picturebookModal.style.display = 'flex';

        // 각 차수별 1위 이야기 조회
        await loadWinnerStories(contest.contestId);
    }

    // 그림책 모달 닫기
    function closePicturebookModalFn() {
        picturebookModal.classList.remove('show');
        picturebookModal.style.display = 'none';
        currentPicturebookContest = null;
        winnerStories = [];
    }

    if (closePicturebookModal) {
        closePicturebookModal.addEventListener('click', closePicturebookModalFn);
    }

    if (picturebookModal) {
        picturebookModal.addEventListener('click', function(e) {
            if (e.target === picturebookModal) {
                closePicturebookModalFn();
            }
        });
    }

    // 각 차수별 1위 이야기 조회
    async function loadWinnerStories(contestId) {
        try {
            // 차수 목록 조회
            const detailResponse = await apiClient.request(`/contest/detail/${contestId}`, {
                method: 'GET'
            });

            if (!detailResponse.success || !detailResponse.data) {
                throw new Error('차수 정보를 불러올 수 없습니다.');
            }

            const details = Array.isArray(detailResponse.data) ? detailResponse.data : [detailResponse.data];

            // 차수 순서 정렬
            const roundOrder = ['1차', '2차', '3차', '최종'];
            details.sort((a, b) => {
                const orderA = roundOrder.indexOf(a.round);
                const orderB = roundOrder.indexOf(b.round);
                return orderA - orderB;
            });

            winnerStories = [];

            // 각 차수별 이야기 조회 및 1위 찾기
            for (const detail of details) {
                const detailsId = detail.detailsId || detail.contestDetailsId || detail.details_id;

                try {
                    // 이야기 목록 조회
                    const storyResponse = await apiClient.request(`/story/${detailsId}`, {
                        method: 'GET'
                    });

                    if (storyResponse.success && storyResponse.data && storyResponse.data.length > 0) {
                        let stories = storyResponse.data;

                        // 투표 결과 조회
                        try {
                            const voteResponse = await apiClient.request(`/story/${detailsId}/vote`, {
                                method: 'GET'
                            });

                            if (voteResponse.success && voteResponse.data) {
                                const voteData = Array.isArray(voteResponse.data) ? voteResponse.data : [voteResponse.data];
                                stories = stories.map(story => {
                                    const voteInfo = voteData.find(v =>
                                        v.storyId === story.storyId || v.story_id === story.storyId
                                    );
                                    if (voteInfo) {
                                        story.voteCount = voteInfo.voteCount ?? voteInfo.vote_count ?? voteInfo.count ?? 0;
                                    }
                                    return story;
                                });
                            }
                        } catch (e) {
                            console.log('투표 결과 조회 실패:', e);
                        }

                        // 투표수 순으로 정렬 후 1위 선택
                        stories.sort((a, b) => {
                            const voteA = a.voteCount ?? a.vote_count ?? 0;
                            const voteB = b.voteCount ?? b.vote_count ?? 0;
                            return voteB - voteA;
                        });

                        const winner = stories[0];
                        winnerStories.push({
                            round: detail.round,
                            detailsId: detailsId,
                            story: winner
                        });
                    }
                } catch (e) {
                    console.log(`${detail.round} 이야기 조회 실패:`, e);
                }
            }

            renderWinnerStories();

        } catch (error) {
            console.error('1위 이야기 조회 실패:', error);
            winnerStoriesList.innerHTML = `
                <div class="no-winner">
                    <div class="no-winner-icon">😢</div>
                    <p>1위 이야기를 불러오는데 실패했습니다.</p>
                </div>
            `;
        }
    }

    // 1위 이야기 목록 렌더링
    function renderWinnerStories() {
        if (winnerStories.length === 0) {
            winnerStoriesList.innerHTML = `
                <div class="no-winner">
                    <div class="no-winner-icon">📭</div>
                    <p>등록된 이야기가 없습니다.</p>
                </div>
            `;
            generatePicturebookBtn.disabled = true;
            return;
        }

        winnerStoriesList.innerHTML = winnerStories.map(item => {
            const story = item.story;
            const voteCount = story.voteCount ?? story.vote_count ?? 0;

            return `
                <div class="winner-item">
                    <div class="winner-round">
                        <span class="round-badge">${item.round}</span>
                        <span class="trophy">🏆</span>
                    </div>
                    <div class="winner-content">
                        <div class="winner-author">${story.authorName || '익명'}</div>
                        <div class="winner-text">${escapeHtml(story.content)}</div>
                        <div class="winner-votes">❤️ ${voteCount}표</div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // HTML 이스케이프
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // AI 그림책 생성
    if (generatePicturebookBtn) {
        generatePicturebookBtn.addEventListener('click', async function() {
            if (!currentPicturebookContest || winnerStories.length === 0) {
                showToast('생성할 이야기가 없습니다.', 'error');
                return;
            }

            // 생성 시작
            generatePicturebookBtn.disabled = true;
            generateProgress.style.display = 'block';
            document.getElementById('progressText').textContent = '그림책을 생성하고 있습니다...';
            document.getElementById('progressFill').style.width = '0%';

            try {
                // 진행률 애니메이션
                let progress = 0;
                const progressInterval = setInterval(() => {
                    progress += Math.random() * 10;
                    if (progress > 90) progress = 90;
                    document.getElementById('progressFill').style.width = `${progress}%`;
                }, 1000);

                // 동기 방식 API 호출
                const response = await apiClient.request(`/admin/contest/${currentPicturebookContest.contestId}/generate-images-sync`, {
                    method: 'POST'
                });

                clearInterval(progressInterval);
                document.getElementById('progressFill').style.width = '100%';

                console.log('이미지 생성 응답:', response);

                if (response.success) {
                    document.getElementById('progressText').textContent = '그림책 생성 완료! 결과 페이지로 이동합니다...';

                    // localStorage에 그림책 데이터 저장
                    const picturebookData = {
                        contestId: currentPicturebookContest.contestId,
                        title: currentPicturebookContest.title,
                        createdAt: new Date().toISOString(),
                        winnerStories: winnerStories.map(item => ({
                            round: item.round,
                            authorName: item.story?.authorName || '익명',
                            content: item.story?.content || '',
                            voteCount: item.story?.voteCount ?? item.story?.vote_count ?? 0
                        })),
                        images: response.data // API 응답 이미지 데이터
                    };

                    // 기존 목록 가져오기
                    const picturebooks = JSON.parse(localStorage.getItem('picturebooks') || '[]');
                    // 같은 contestId가 있으면 업데이트, 없으면 추가
                    const existingIndex = picturebooks.findIndex(p => p.contestId === picturebookData.contestId);
                    if (existingIndex >= 0) {
                        picturebooks[existingIndex] = picturebookData;
                    } else {
                        picturebooks.unshift(picturebookData); // 최신순으로 앞에 추가
                    }
                    localStorage.setItem('picturebooks', JSON.stringify(picturebooks));

                    setTimeout(() => {
                        // 생성 완료 후 결과물 목록 페이지로 이동
                        window.location.href = 'play-result.html';
                    }, 1000);
                } else {
                    throw new Error(response.message || '이미지 생성에 실패했습니다.');
                }

            } catch (error) {
                console.error('그림책 생성 실패:', error);
                generateProgress.style.display = 'none';
                generatePicturebookBtn.disabled = false;
                showToast(error.message || '그림책 생성에 실패했습니다.', 'error');
            }
        });
    }

    // 다운로드 버튼
    const downloadPicturebookBtn = document.getElementById('downloadPicturebookBtn');
    if (downloadPicturebookBtn) {
        downloadPicturebookBtn.addEventListener('click', function() {
            // TODO: 그림책 다운로드 기능 구현
            showToast('다운로드 기능은 준비 중입니다.', 'info');
        });
    }

    // 공유 버튼
    const sharePicturebookBtn = document.getElementById('sharePicturebookBtn');
    if (sharePicturebookBtn) {
        sharePicturebookBtn.addEventListener('click', function() {
            // TODO: 공유 기능 구현
            if (navigator.share) {
                navigator.share({
                    title: currentPicturebookContest?.title || '그림책',
                    text: `${currentPicturebookContest?.title} 대회 그림책을 확인해보세요!`,
                    url: window.location.href
                });
            } else {
                // 클립보드에 URL 복사
                navigator.clipboard.writeText(window.location.href);
                showToast('링크가 복사되었습니다.', 'success');
            }
        });
    }

    // 초기 로드
    await loadContests();
});
