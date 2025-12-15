document.addEventListener('DOMContentLoaded', async function() {
    const storyContent = document.getElementById('storyContent');
    const charCount = document.getElementById('charCount');
    const cancelBtn = document.getElementById('cancelBtn');
    const submitBtn = document.getElementById('submitBtn');
    const backBtn = document.getElementById('backBtn');
    const storyItems = document.getElementById('storyItems');
    const storyCountEl = document.getElementById('storyCount');
    const emptyStory = document.getElementById('emptyStory');

    const urlParams = new URLSearchParams(window.location.search);
    const contestId = urlParams.get('id');
    const detailsId = urlParams.get('detailsId');

    if (!contestId || !detailsId) {
        showToast('대회 정보를 찾을 수 없습니다.', 'error');
        setTimeout(() => {
            window.location.href = 'play.html';
        }, 1500);
        return;
    }

    let stories = [];
    let editingId = null;
    let pendingVoteId = null;
    let isRoundEnded = false; // 현재 차수 종료 여부

    if (contestId) {
        backBtn.href = `play-detail.html?id=${contestId}`;
    }

    // 대회 정보 및 첫 문장 로드
    await loadContestInfo();

    // 투표 모달 생성
    createVoteModal();

    // 대회 정보 조회
    async function loadContestInfo() {
        try {
            // 대회 정보 조회
            const contestResponse = await apiClient.request(`/contest/${contestId}`, {
                method: 'GET'
            });

            if (contestResponse.success && contestResponse.data) {
                const contestName = document.getElementById('contestName');
                if (contestName) {
                    contestName.textContent = contestResponse.data.title;
                }
            }

            // 차수 상세 정보 조회 (첫 문장 포함)
            const detailResponse = await apiClient.request(`/contest/detail/${contestId}`, {
                method: 'GET'
            });

            console.log('차수 상세 응답:', detailResponse);

            if (detailResponse.success && detailResponse.data) {
                const details = Array.isArray(detailResponse.data) ? detailResponse.data : [detailResponse.data];
                // 현재 detailsId에 해당하는 차수 찾기
                const currentDetail = details.find(d =>
                    (d.detailsId || d.contestDetailsId || d.details_id) == detailsId
                );

                console.log('현재 차수:', currentDetail);

                if (currentDetail) {
                    const firstSentence = document.getElementById('firstSentence');
                    if (firstSentence && (currentDetail.startPrompt || currentDetail.start_prompt)) {
                        firstSentence.textContent = currentDetail.startPrompt || currentDetail.start_prompt;
                    }

                    // 차수 종료 여부 확인 (날짜만 비교, 시간 무시)
                    const now = new Date();
                    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

                    const startDateRaw = currentDetail.startDate || currentDetail.start_date;
                    const endDateRaw = currentDetail.endDate || currentDetail.end_date;

                    // 날짜 문자열을 로컬 날짜로 파싱 (YYYY-MM-DD 형식)
                    const parseLocalDate = (dateStr) => {
                        if (!dateStr) return new Date();
                        const parts = dateStr.split('T')[0].split('-');
                        return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
                    };

                    const startDate = parseLocalDate(startDateRaw);
                    const endDate = parseLocalDate(endDateRaw);

                    console.log('차수 날짜 비교:', {
                        raw: { startDate: startDateRaw, endDate: endDateRaw },
                        parsed: { startDate: startDate.toDateString(), endDate: endDate.toDateString() },
                        today: today.toDateString(),
                        inRange: today >= startDate && today <= endDate,
                        ended: today > endDate
                    });

                    // 종료일이 지난 경우에만 종료 처리
                    if (today > endDate) {
                        isRoundEnded = true;
                        disableWriteForm();
                    }
                }
            }
        } catch (error) {
            console.error('대회 정보 조회 실패:', error);
        }
    }

    // 종료된 차수 - 작성 폼 비활성화
    function disableWriteForm() {
        const writeForm = document.querySelector('.write-form');
        if (writeForm) {
            writeForm.classList.add('disabled');
            storyContent.disabled = true;
            storyContent.placeholder = '이 차수는 종료되어 더 이상 작성할 수 없습니다.';
            submitBtn.disabled = true;
            cancelBtn.style.display = 'none';

            // 안내 메시지 추가
            const notice = document.createElement('div');
            notice.className = 'round-ended-notice';
            notice.innerHTML = `
                <p>⏰ 이 차수는 종료되었습니다.</p>
                <p>이야기는 열람만 가능합니다.</p>
            `;
            writeForm.insertBefore(notice, writeForm.firstChild);
        }
    }

    function createVoteModal() {
        const modalHTML = `
            <div id="voteModal" class="vote-modal-overlay">
                <div class="vote-modal">
                    <div class="vote-modal-content">
                        <p id="voteModalMessage">이 이야기에 투표하시겠습니까?</p>
                    </div>
                    <div class="vote-modal-buttons">
                        <button id="voteYesBtn" class="vote-modal-btn yes">네</button>
                        <button id="voteNoBtn" class="vote-modal-btn no">아니오</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // 모달 스타일 추가
        const styleEl = document.createElement('style');
        styleEl.textContent = `
            .vote-modal-overlay {
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                justify-content: center;
                align-items: center;
                z-index: 1000;
            }
            .vote-modal-overlay.show {
                display: flex;
            }
            .vote-modal {
                background: white;
                border-radius: 12px;
                padding: 24px;
                min-width: 300px;
                text-align: center;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
                animation: modalFadeIn 0.2s ease;
            }
            @keyframes modalFadeIn {
                from { opacity: 0; transform: scale(0.9); }
                to { opacity: 1; transform: scale(1); }
            }
            .vote-modal-content {
                margin-bottom: 20px;
            }
            .vote-modal-content p {
                font-size: 16px;
                color: #333;
                margin: 0;
            }
            .vote-modal-buttons {
                display: flex;
                gap: 12px;
                justify-content: center;
            }
            .vote-modal-btn {
                padding: 10px 32px;
                border: none;
                border-radius: 8px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s;
            }
            .vote-modal-btn.yes {
                background: #4CAF50;
                color: white;
            }
            .vote-modal-btn.yes:hover {
                background: #43A047;
            }
            .vote-modal-btn.no {
                background: #e0e0e0;
                color: #333;
            }
            .vote-modal-btn.no:hover {
                background: #d0d0d0;
            }
        `;
        document.head.appendChild(styleEl);

        // 모달 이벤트 바인딩
        document.getElementById('voteYesBtn').addEventListener('click', confirmVote);
        document.getElementById('voteNoBtn').addEventListener('click', closeVoteModal);
        document.getElementById('voteModal').addEventListener('click', function(e) {
            if (e.target === this) closeVoteModal();
        });
    }

    function showVoteModal(storyId) {
        const story = stories.find(s => s.storyId === storyId);
        if (!story) return;

        // 이미 투표한 경우 알림만 표시
        if (story.voted) {
            showToast('이미 투표하셨습니다.', 'warning');
            return;
        }

        pendingVoteId = storyId;
        document.getElementById('voteModalMessage').textContent = '이 이야기에 투표하시겠습니까?';
        document.getElementById('voteModal').classList.add('show');
    }

    function closeVoteModal() {
        document.getElementById('voteModal').classList.remove('show');
        pendingVoteId = null;
    }

    async function confirmVote() {
        if (pendingVoteId === null) return;

        try {
            // POST /api/story/{contestDetailsId}/{storyId}/vote
            const response = await apiClient.request(`/story/${detailsId}/${pendingVoteId}/vote`, {
                method: 'POST'
            });

            if (response.success) {
                showToast('투표가 완료되었습니다!', 'success');
                await loadStories(); // 목록 새로고침
            }
        } catch (error) {
            console.error('투표 실패:', error);
            showToast(error.message || '투표에 실패했습니다.', 'error');
        }
        closeVoteModal();
    }

    // 이어쓰기 목록 조회
    async function loadStories() {
        try {
            // GET /api/story/{contestDetailsId}
            const response = await apiClient.request(`/story/${detailsId}`, {
                method: 'GET'
            });

            console.log('이야기 목록 응답:', response);

            if (response.success && response.data) {
                stories = response.data;

                // 투표 결과 조회해서 투표 수 업데이트
                try {
                    const voteResponse = await apiClient.request(`/story/${detailsId}/vote`, {
                        method: 'GET'
                    });
                    console.log('투표 결과 응답:', voteResponse);

                    if (voteResponse.success && voteResponse.data) {
                        // 투표 결과를 stories에 매핑
                        const voteData = Array.isArray(voteResponse.data) ? voteResponse.data : [voteResponse.data];
                        stories = stories.map(story => {
                            const voteInfo = voteData.find(v =>
                                v.storyId === story.storyId ||
                                v.story_id === story.storyId
                            );
                            if (voteInfo) {
                                story.voteCount = voteInfo.voteCount ?? voteInfo.vote_count ?? voteInfo.count ?? 0;
                            }
                            return story;
                        });
                    }
                } catch (voteError) {
                    console.log('투표 결과 조회 실패 (무시):', voteError);
                }

                // 투표수 높은 순으로 정렬
                stories.sort((a, b) => {
                    const voteA = a.voteCount ?? a.vote_count ?? 0;
                    const voteB = b.voteCount ?? b.vote_count ?? 0;
                    return voteB - voteA;
                });

                console.log('stories 데이터 (투표순 정렬):', stories);
                renderStories();
            }
        } catch (error) {
            console.error('이어쓰기 목록 조회 실패:', error);
            // API 실패 시 빈 배열로 시작 (localStorage 대신)
            console.log('API 실패. 빈 목록으로 시작');
            stories = [];
            renderStories();
        }
    }

    // 글자수 카운트
    storyContent.addEventListener('input', function() {
        const length = this.value.length;
        charCount.textContent = length;
        submitBtn.disabled = length < 50;
    });

    // 취소 버튼
    cancelBtn.addEventListener('click', function() {
        if (storyContent.value.trim().length > 0 || editingId) {
            if (window.confirm('작성 중인 내용이 사라집니다. 취소하시겠습니까?')) {
                resetForm();
            }
        }
    });

    // 등록/수정 버튼
    submitBtn.addEventListener('click', async function() {
        const content = storyContent.value.trim();

        if (content.length < 50) {
            showToast('최소 50자 이상 작성해주세요.', 'warning');
            return;
        }

        try {
            if (editingId) {
                // PUT /api/story/{contestDetailsId}/{storyId}
                const response = await apiClient.request(`/story/${detailsId}/${editingId}`, {
                    method: 'PUT',
                    body: JSON.stringify({ content: content })
                });

                if (response.success) {
                    showToast('이야기가 수정되었습니다!', 'success');
                    await loadStories();
                    resetForm();
                }
            } else {
                // POST /api/story/{contestDetailsId}
                const response = await apiClient.request(`/story/${detailsId}`, {
                    method: 'POST',
                    body: JSON.stringify({ content: content })
                });

                if (response.success) {
                    showToast('이야기가 등록되었습니다!', 'success');
                    await loadStories();
                    resetForm();
                }
            }
        } catch (error) {
            console.error('이야기 저장 실패:', error);
            showToast(error.message || '저장에 실패했습니다.', 'error');
        }
    });

    function resetForm() {
        storyContent.value = '';
        charCount.textContent = '0';
        submitBtn.disabled = true;
        submitBtn.textContent = '등록하기';
        editingId = null;
    }

    function renderStories() {
        storyCountEl.textContent = stories.length;

        if (stories.length === 0) {
            emptyStory.style.display = 'block';
            storyItems.innerHTML = '';
            return;
        }

        emptyStory.style.display = 'none';

        const existingItems = storyItems.querySelectorAll('.story-item');
        existingItems.forEach(item => item.remove());

        stories.forEach((story, index) => {
            const storyEl = document.createElement('div');
            storyEl.className = 'story-item';

            // 날짜 포맷팅
            const date = story.createdAt ? new Date(story.createdAt).toLocaleString('ko-KR') : '';
            const modifiedTag = story.updatedAt && story.updatedAt !== story.createdAt ? ' (수정됨)' : '';

            // 종료된 차수면 수정/삭제 버튼 숨김
            const actionsHtml = isRoundEnded ? '' : `
                <div class="story-actions">
                    <button class="edit-btn" data-id="${story.storyId}">✏️ 수정</button>
                    <button class="delete-btn" data-id="${story.storyId}">🗑️ 삭제</button>
                </div>
            `;

            // 1위 표시 (종료된 차수에서)
            const rankBadge = isRoundEnded && index === 0 ? '<span class="rank-badge">🏆 1위</span>' : '';

            storyEl.innerHTML = `
                <div class="story-header">
                    <div class="author-info">
                        ${rankBadge}
                        <span class="author-name">${story.authorName || '익명'}</span>
                        <span class="write-date">${date}${modifiedTag}</span>
                    </div>
                    ${actionsHtml}
                </div>
                <div class="story-content">
                    <p>${escapeHtml(story.content)}</p>
                </div>
                <div class="story-footer">
                    <button class="like-btn ${story.voted ? 'liked' : ''} ${isRoundEnded ? 'disabled' : ''}" data-id="${story.storyId}" ${isRoundEnded ? 'disabled' : ''}>
                        <span class="like-icon">투표 수:</span>
                        <span class="like-count">${story.voteCount ?? story.vote_count ?? 0}</span>
                    </button>
                </div>
            `;
            storyItems.appendChild(storyEl);
        });

        attachEvents();
    }

    function attachEvents() {
        // 투표
        document.querySelectorAll('.like-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const storyId = parseInt(this.dataset.id);
                showVoteModal(storyId);
            });
        });

        // 수정
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const storyId = parseInt(this.dataset.id);
                const story = stories.find(s => s.storyId === storyId);
                if (story) {
                    editingId = story.storyId;
                    storyContent.value = story.content;
                    charCount.textContent = story.content.length;
                    submitBtn.disabled = false;
                    submitBtn.textContent = '수정하기';
                    storyContent.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    storyContent.focus();
                }
            });
        });

        // 삭제
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', async function() {
                if (window.confirm('정말 삭제하시겠습니까?')) {
                    const storyId = parseInt(this.dataset.id);

                    try {
                        // DELETE /api/story/{contestDetailsId}/{storyId}
                        const response = await apiClient.request(`/story/${detailsId}/${storyId}`, {
                            method: 'DELETE'
                        });

                        if (response.success) {
                            showToast('삭제되었습니다.', 'success');
                            if (editingId === storyId) resetForm();
                            await loadStories();
                        }
                    } catch (error) {
                        console.error('삭제 실패:', error);
                        showToast(error.message || '삭제에 실패했습니다.', 'error');
                    }
                }
            });
        });
    }

    // HTML 이스케이프 함수
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // 초기 로드
    submitBtn.disabled = true;
    await loadStories();

    console.log('대회 ID:', contestId);
});
