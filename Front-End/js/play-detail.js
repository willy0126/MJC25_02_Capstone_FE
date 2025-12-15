document.addEventListener('DOMContentLoaded', async function() {
    const urlParams = new URLSearchParams(window.location.search);
    const contestId = urlParams.get('id');

    if (!contestId) {
        showToast('대회 정보를 찾을 수 없습니다.', 'error');
        setTimeout(() => {
            window.location.href = 'play.html';
        }, 1500);
        return;
    }

    let contestData = null;
    let contestDetails = [];

    // 탭 버튼들과 콘텐츠들
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    // 이어쓰기 버튼
    const writeBtn = document.getElementById('writeBtn');

    // 모달 관련 요소들
    const stageModal = document.getElementById('stageSelectModal');
    const closeModalBtn = document.getElementById('closeStageModal');

    // 대회 정보 조회
    async function loadContestInfo() {
        try {
            // GET /api/contest/{contestId}
            const response = await apiClient.request(`/contest/${contestId}`, {
                method: 'GET'
            });

            console.log('대회 정보 응답:', response);

            if (response.success && response.data) {
                contestData = response.data;
                renderContestInfo();
            }
        } catch (error) {
            console.error('대회 정보 조회 실패:', error);
            // API 실패 시 HTML의 기본값 사용 (이미 HTML에 하드코딩되어 있음)
            console.log('HTML의 기본 대회 정보 사용');
        }
    }

    // 대회 상세 목록 조회
    async function loadContestDetails() {
        try {
            // GET /api/contest/detail/{contestId}
            const response = await apiClient.request(`/contest/detail/${contestId}`, {
                method: 'GET'
            });

            console.log('대회 상세 목록 응답:', response);

            if (response.success && response.data) {
                // 배열인지 확인
                contestDetails = Array.isArray(response.data) ? response.data : [response.data];
                console.log('차수 목록:', contestDetails);
                // 현재 진행 중인 차수 찾기
                const ongoing = contestDetails.find(detail =>
                    detail.progressStatus === 'ONGOING' || detail.status === 'ONGOING'
                );
                if (ongoing) {
                    currentStage = ongoing.round || 1;
                }
            }
        } catch (error) {
            console.error('대회 상세 목록 조회 실패:', error);
            // API 실패 시 HTML의 기본 차수 사용
            console.log('HTML의 기본 차수 정보 사용');
            useHtmlStages();
        }
    }

    // HTML에 하드코딩된 차수 사용
    function useHtmlStages() {
        const existingStageButtons = document.querySelectorAll('.stage-btn');
        if (existingStageButtons.length > 0) {
            existingStageButtons.forEach(btn => {
                btn.addEventListener('click', function() {
                    if (!this.classList.contains('locked')) {
                        const stage = this.dataset.stage;
                        // detailsId 대신 stage 사용 (임시)
                        window.location.href = `play-write.html?id=${contestId}&detailsId=${stage}`;
                    }
                });
            });
        }
    }

    // 대회 정보 렌더링
    function renderContestInfo() {
        if (!contestData) return;

        console.log('렌더링할 대회 데이터:', contestData);

        // 페이지 제목 변경
        document.title = `${contestData.title} - 책·이음`;

        // 포스터 이미지
        const posterImage = document.getElementById('posterImage');
        if (posterImage) {
            let imageUrl = '../assets/pics/창작 그림책 공모전.jpg'; // 기본 이미지

            if (contestData.imageUrl) {
                imageUrl = contestData.imageUrl;
            } else if (contestData.image?.url) {
                imageUrl = contestData.image.url;
            } else if (contestData.image?.filePath) {
                imageUrl = `/api/images/${contestData.image.imageId}`;
            } else if (contestData.image?.file_path) {
                imageUrl = `/api/images/${contestData.image.imageId || contestData.image.image_id}`;
            } else if (contestData.image?.imageId) {
                imageUrl = `/api/images/${contestData.image.imageId}`;
            } else if (contestData.imageId) {
                imageUrl = `/api/images/${contestData.imageId}`;
            }

            console.log('이미지 URL:', imageUrl);
            posterImage.src = imageUrl;
        }

        // 상태 배지
        const contestStatus = document.getElementById('contestStatus');
        if (contestStatus) {
            const status = getContestStatus(contestData);
            const statusInfo = getStatusInfo(status);
            contestStatus.textContent = statusInfo.text;
            contestStatus.className = `contest-status ${statusInfo.class}`;
        }

        // 제목
        const contestTitle = document.getElementById('contestTitle');
        if (contestTitle) contestTitle.textContent = contestData.title;

        // 날짜
        const contestDate = document.getElementById('contestDate');
        if (contestDate) {
            contestDate.textContent = `📅 ${formatDateRange(contestData.startDate, contestData.endDate)}`;
        }

        // 주최
        const contestHost = document.getElementById('contestHost');
        if (contestHost) contestHost.textContent = contestData.host || '책·이음';

        // 참가 대상
        const contestTarget = document.getElementById('contestTarget');
        if (contestTarget) contestTarget.textContent = contestData.target || '누구나 참여 가능';

        // 참가 비용
        const contestFee = document.getElementById('contestFee');
        if (contestFee) contestFee.textContent = contestData.fee || '무료';

        // 대회 소개 (description 또는 content 필드)
        const contestDescription = document.getElementById('contestDescription');
        if (contestDescription && (contestData.description || contestData.content)) {
            contestDescription.innerHTML = contestData.description || contestData.content || '';
        }
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

    // 짧은 날짜 포맷 (MM/DD)
    function formatShortDate(dateStr) {
        const date = new Date(dateStr);
        const month = date.getMonth() + 1;
        const day = date.getDate();
        return `${month}/${day}`;
    }

    // round 라벨 변환
    function getRoundLabel(round) {
        if (!round) return '1차';
        // "1차", "2차" 형식이면 그대로 반환
        if (round.includes('차')) return round;
        // "ROUND_1" 형식이면 변환
        const roundMap = {
            'ROUND_1': '1차',
            'ROUND_2': '2차',
            'ROUND_3': '3차',
            'FINAL': '최종'
        };
        return roundMap[round] || round;
    }

    // 탭 클릭 이벤트
    tabButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const tabName = this.dataset.tab;

            tabButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            tabContents.forEach(content => {
                content.classList.remove('active');
            });
            document.getElementById(`tab-${tabName}`).classList.add('active');
        });
    });

    // 이어쓰기 버튼 클릭 - 모달 표시
    if (writeBtn && stageModal) {
        writeBtn.addEventListener('click', function() {
            updateStageModal();
            stageModal.style.display = 'flex';
        });
    }

    // 모달 닫기
    if (closeModalBtn && stageModal) {
        closeModalBtn.addEventListener('click', function() {
            stageModal.style.display = 'none';
        });
    }

    // 모달 배경 클릭시 닫기
    if (stageModal) {
        stageModal.addEventListener('click', function(e) {
            if (e.target === stageModal) {
                stageModal.style.display = 'none';
            }
        });

        // 차수 버튼 클릭 이벤트 (이벤트 위임 방식)
        stageModal.addEventListener('click', function(e) {
            const stageBtn = e.target.closest('.stage-btn');
            if (stageBtn) {
                // 대기 중(아직 시작 안 됨)인 차수만 클릭 불가
                if (stageBtn.classList.contains('waiting')) {
                    showToast('아직 시작되지 않은 차수입니다.', 'info');
                    return;
                }
                const contestDetailsId = stageBtn.dataset.detailsId;
                if (contestDetailsId) {
                    window.location.href = `play-write.html?id=${contestId}&detailsId=${contestDetailsId}`;
                }
            }
        });
    }

    // 차수별 상태 업데이트 함수
    function updateStageModal() {
        const stageList = document.querySelector('.stage-list');
        if (!stageList) return;

        stageList.innerHTML = '';

        if (contestDetails.length === 0) {
            stageList.innerHTML = '<p style="text-align: center; color: #999;">등록된 차수가 없습니다.</p>';
            return;
        }

        contestDetails.forEach(detail => {
            console.log('차수 detail:', detail);

            const btn = document.createElement('button');
            btn.className = 'stage-btn';
            // detailsId 또는 contestDetailsId 또는 details_id
            btn.dataset.detailsId = detail.detailsId || detail.contestDetailsId || detail.details_id;
            btn.dataset.stage = detail.round;

            let statusText = '';
            let statusClass = '';

            // 날짜 기준으로 상태 판단 (날짜만 비교, 시간 무시)
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

            const startDateRaw = detail.startDate || detail.start_date;
            const endDateRaw = detail.endDate || detail.end_date;

            // 날짜 문자열을 로컬 날짜로 파싱 (YYYY-MM-DD 형식)
            const parseLocalDate = (dateStr) => {
                if (!dateStr) return new Date();
                const parts = dateStr.split('T')[0].split('-');
                return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
            };

            const startDate = parseLocalDate(startDateRaw);
            const endDate = parseLocalDate(endDateRaw);

            console.log(`${detail.round} 날짜 비교:`, {
                raw: { startDate: startDateRaw, endDate: endDateRaw },
                parsed: { startDate: startDate.toDateString(), endDate: endDate.toDateString() },
                today: today.toDateString(),
                inRange: today >= startDate && today <= endDate,
                ended: today > endDate
            });

            if (today >= startDate && today <= endDate) {
                // 현재 날짜가 기간 내 → 참여 가능
                statusText = '참여 가능';
                statusClass = 'status-available';
            } else if (today > endDate) {
                // 종료일 지남 → 종료 (열람만)
                statusText = '종료 (열람 가능)';
                statusClass = 'status-ended';
                btn.classList.add('ended');
            } else {
                // 시작일 전 → 대기 중
                statusText = '대기 중';
                statusClass = 'status-waiting';
                btn.classList.add('waiting');
            }

            // round 형식: "1차", "2차", "ROUND_1" 등 처리
            const roundLabel = getRoundLabel(detail.round);

            // 날짜 표시
            const dateRange = detail.startDate && detail.endDate
                ? ` (${formatShortDate(detail.startDate)} ~ ${formatShortDate(detail.endDate)})`
                : '';

            btn.innerHTML = `
                <div class="stage-number">${roundLabel}${dateRange}</div>
                <div class="stage-status ${statusClass}">${statusText}</div>
            `;

            stageList.appendChild(btn);
        });
    }

    // 초기 로드
    await loadContestInfo();
    await loadContestDetails();

    console.log('대회 ID:', contestId);
});
