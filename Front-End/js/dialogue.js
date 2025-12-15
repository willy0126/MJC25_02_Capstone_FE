/**
 * 독후 활동 페이지 JavaScript
 * dialogue.js
 */

// ==================== 상태 관리 ====================
let previousQuestion = null;
let conversationsList = [];        // 전체 대화 기록 목록
let currentConversation = null;    // 현재 선택된 대화
let isEditMode = false;            // 수정 모드 여부
let editingConversationId = null;  // 수정 중인 대화 ID

// 감정 매핑
const EMOTION_MAP = {
    'happy': { label: '즐거움', emoji: '🙂' },
    'normal': { label: '보통', emoji: '😐' },
    'touched': { label: '감동', emoji: '🥹' },
    'difficult': { label: '어려움', emoji: '😵' },
    'curious': { label: '궁금함', emoji: '🤔' },
    'growth': { label: '성장', emoji: '🌱' }
};

// ==================== 초기화 ====================
document.addEventListener('DOMContentLoaded', function() {
    initDialogue();
    initModal();
});

/**
 * 독후 활동 페이지 초기화
 */
async function initDialogue() {
    // 로그인 체크
    if (!isLoggedIn()) {
        showToast('로그인이 필요합니다.', 'warning');
        setTimeout(() => {
            window.location.href = '/login.html?redirect=' + encodeURIComponent(window.location.pathname);
        }, 1500);
        return;
    }

    initEmotionButtons();
    initSearchFunction();
    initConversationCards();
    initRefreshSuggestion();
    initRegisterButton();

    // 서버에서 대화 기록 목록 불러오기
    await loadConversations();

    // 페이지 로드 시 초기 질문 랜덤 설정
    requestNewQuestion();
}

/**
 * 대화 기록 목록 불러오기
 */
async function loadConversations() {
    try {
        const response = await apiClient.getDialogueConversations({ page: 1, size: 50 });

        if (response.success && response.data) {
            conversationsList = response.data.conversations || response.data.content || [];
            renderConversationList(conversationsList);
        }
    } catch (error) {
        console.error('대화 기록 로드 실패:', error);
        // 에러 시 빈 목록 표시
        renderConversationList([]);
    }
}

/**
 * 대화 기록 목록 렌더링
 */
function renderConversationList(conversations) {
    const conversationList = document.getElementById('conversationList');
    if (!conversationList) return;

    // 기존 내용 초기화
    conversationList.innerHTML = '';

    if (conversations.length === 0) {
        conversationList.innerHTML = `
            <div class="empty-state">
                <p>아직 기록된 대화가 없습니다.</p>
                <p>아이와 나눈 독서 대화를 기록해보세요!</p>
            </div>
        `;
        return;
    }

    conversations.forEach((conv, index) => {
        const card = createConversationCard(conv, index === 0);
        conversationList.appendChild(card);
    });

    // 첫 번째 대화 자동 선택
    if (conversations.length > 0) {
        const firstCard = conversationList.querySelector('.conversation-card');
        if (firstCard) {
            firstCard.classList.add('active');
            loadConversationDetail(conversations[0].conversationId);
        }
    }
}

/**
 * 대화 카드 HTML 생성
 */
function createConversationCard(conversation, isActive = false) {
    const card = document.createElement('div');
    card.className = `conversation-card${isActive ? ' active' : ''}`;
    card.dataset.conversationId = conversation.conversationId;

    // 날짜 포맷팅
    const dateStr = formatDateString(conversation.createdAt);

    // 제목 (없으면 내용 앞부분 사용)
    const title = conversation.title ||
                  (conversation.content ? conversation.content.substring(0, 20) + '...' : '제목 없음');

    // 감정 태그 HTML (API는 type 필드 사용)
    const emotionTagsHTML = (conversation.emotions || []).map(e => {
        const emotionKey = typeof e === 'string' ? e : (e.type || e.emotionType);
        const emotion = EMOTION_MAP[emotionKey];
        if (emotion) {
            return `<span class="emotion-tag">${emotion.emoji}${emotion.label}</span>`;
        }
        return '';
    }).join('');

    card.innerHTML = `
        <div class="conversation-info">
            <span class="conversation-date">${dateStr}</span>
            <h3 class="conversation-title">${escapeHtml(title)}</h3>
            <div class="emotion-tags">
                ${emotionTagsHTML}
            </div>
        </div>
        <button class="btn-edit-conversation" title="수정">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="#4a3f3a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="#4a3f3a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        </button>
        <button class="btn-delete-conversation" title="삭제">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6L6 18M6 6l12 12" stroke="#4a3f3a" stroke-width="2" stroke-linecap="round"/>
            </svg>
        </button>
    `;

    return card;
}

/**
 * 날짜 문자열 포맷팅
 */
function formatDateString(dateString) {
    if (!dateString) return '-';

    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}.${month}.${day}`;
}

/**
 * HTML 이스케이프
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * 감정 버튼 초기화
 */
function initEmotionButtons() {
    const emotionButtons = document.querySelectorAll('.emotion-btn');

    emotionButtons.forEach(button => {
        button.addEventListener('click', function() {
            this.classList.toggle('active');

            const selectedEmotions = getSelectedEmotions();
            console.log('선택된 감정:', selectedEmotions);
        });
    });
}

/**
 * 선택된 감정 목록 가져오기
 */
function getSelectedEmotions() {
    const activeButtons = document.querySelectorAll('.emotion-btn.active');
    return Array.from(activeButtons).map(btn => btn.dataset.emotion);
}

/**
 * 감정 버튼 상태 설정
 */
function setEmotionButtons(emotions) {
    const emotionButtons = document.querySelectorAll('.emotion-btn');
    emotionButtons.forEach(btn => btn.classList.remove('active'));

    emotions.forEach(emotion => {
        const emotionKey = typeof emotion === 'string' ? emotion : emotion.emotionType;
        const btn = document.querySelector(`.emotion-btn[data-emotion="${emotionKey}"]`);
        if (btn) {
            btn.classList.add('active');
        }
    });
}

/**
 * 검색 기능 초기화
 */
function initSearchFunction() {
    const searchInput = document.getElementById('searchInput');

    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase().trim();
            filterConversations(searchTerm);
        });
    }
}

/**
 * 대화 기록 필터링
 */
function filterConversations(searchTerm) {
    const conversationCards = document.querySelectorAll('.conversation-card');

    conversationCards.forEach(card => {
        const title = card.querySelector('.conversation-title')?.textContent.toLowerCase() || '';
        const date = card.querySelector('.conversation-date')?.textContent.toLowerCase() || '';
        const emotions = card.querySelector('.emotion-tags')?.textContent.toLowerCase() || '';

        const matchesSearch = title.includes(searchTerm) ||
                             date.includes(searchTerm) ||
                             emotions.includes(searchTerm);

        if (searchTerm === '' || matchesSearch) {
            card.style.display = 'flex';
            card.style.animation = 'fadeInUp 0.4s ease forwards';
        } else {
            card.style.display = 'none';
        }
    });
}

/**
 * 대화 카드 초기화 (이벤트 위임 패턴)
 */
function initConversationCards() {
    const conversationList = document.getElementById('conversationList');

    if (!conversationList) return;

    if (conversationList.dataset.initialized === 'true') return;

    conversationList.addEventListener('click', function(e) {
        const card = e.target.closest('.conversation-card');

        if (!card) return;

        const conversationId = parseInt(card.dataset.conversationId);

        // 수정 버튼 클릭
        if (e.target.closest('.btn-edit-conversation')) {
            e.stopPropagation();
            startEditMode(conversationId);
            return;
        }

        // 삭제 버튼 클릭
        if (e.target.closest('.btn-delete-conversation')) {
            e.stopPropagation();
            deleteConversation(conversationId);
            return;
        }

        // 카드 자체 클릭 (선택)
        const allCards = conversationList.querySelectorAll('.conversation-card');
        allCards.forEach(c => c.classList.remove('active'));
        card.classList.add('active');

        // 선택한 대화 상세 불러오기
        loadConversationDetail(conversationId);
    });

    conversationList.dataset.initialized = 'true';
}

/**
 * 대화 상세 불러오기
 */
async function loadConversationDetail(conversationId) {
    try {
        const response = await apiClient.getDialogueConversation(conversationId);

        if (response.success && response.data) {
            currentConversation = response.data;
            displayConversationDetail(response.data);
        }
    } catch (error) {
        console.error('대화 상세 조회 실패:', error);
        showToast('대화 기록을 불러오는데 실패했습니다.', 'error');
    }
}

/**
 * 대화 상세 표시
 */
function displayConversationDetail(conversation) {
    // 감정 버튼 설정
    setEmotionButtons(conversation.emotions || []);

    // 내용 표시
    const conversationInput = document.getElementById('conversationInput');
    if (conversationInput) {
        conversationInput.value = conversation.content || '';
    }

    // AI 질문 표시
    if (conversation.aiQuestion) {
        const suggestionText = document.querySelector('.suggestion-text');
        if (suggestionText) {
            suggestionText.textContent = `"${conversation.aiQuestion}"`;
        }
    }

    // 수정 모드 해제
    exitEditMode();
}

/**
 * 수정 모드 시작
 */
function startEditMode(conversationId) {
    isEditMode = true;
    editingConversationId = conversationId;

    // 해당 대화 상세 불러오기
    loadConversationDetail(conversationId);

    // UI 변경
    const registerBtn = document.querySelector('.btn-register');
    if (registerBtn) {
        registerBtn.textContent = '수정';
        registerBtn.classList.add('edit-mode');
    }

    // 타이틀 변경
    const activityTitle = document.querySelector('.activity-title');
    if (activityTitle) {
        activityTitle.textContent = '대화 기록 수정';
    }

    showToast('수정 모드입니다. 내용을 변경 후 수정 버튼을 클릭하세요.', 'info');
}

/**
 * 수정 모드 해제
 */
function exitEditMode() {
    isEditMode = false;
    editingConversationId = null;

    const registerBtn = document.querySelector('.btn-register');
    if (registerBtn) {
        registerBtn.textContent = '등록';
        registerBtn.classList.remove('edit-mode');
    }

    const activityTitle = document.querySelector('.activity-title');
    if (activityTitle) {
        activityTitle.textContent = '오늘의 독서 대화';
    }
}

/**
 * 대화 삭제
 */
async function deleteConversation(conversationId) {
    // 대화 정보 찾기
    const conversation = conversationsList.find(c => c.conversationId === conversationId);
    const title = conversation?.title || '이 대화 기록';

    const confirmDelete = await showConfirmModal(
        `"${title}"을(를) 삭제하시겠습니까?`,
        '대화 기록 삭제'
    );

    if (!confirmDelete) return;

    try {
        const response = await apiClient.deleteDialogueConversation(conversationId);

        if (response.success) {
            showToast('대화 기록이 삭제되었습니다.', 'success');

            // 카드 삭제 애니메이션
            const card = document.querySelector(`.conversation-card[data-conversation-id="${conversationId}"]`);
            if (card) {
                card.style.animation = 'fadeOutDown 0.3s ease forwards';
                setTimeout(() => {
                    card.remove();

                    // 목록에서도 제거
                    conversationsList = conversationsList.filter(c => c.conversationId !== conversationId);

                    // 현재 선택된 대화였다면 초기화
                    if (currentConversation?.conversationId === conversationId) {
                        currentConversation = null;
                        clearInputForm();
                    }

                    // 첫 번째 카드 자동 선택
                    const firstCard = document.querySelector('.conversation-card');
                    if (firstCard) {
                        firstCard.click();
                    }
                }, 300);
            }
        } else {
            throw new Error(response.message || '삭제에 실패했습니다.');
        }
    } catch (error) {
        console.error('대화 삭제 실패:', error);
        showToast(error.message || '삭제 중 오류가 발생했습니다.', 'error');
    }
}

/**
 * 입력 폼 초기화
 */
function clearInputForm() {
    const conversationInput = document.getElementById('conversationInput');
    if (conversationInput) {
        conversationInput.value = '';
    }

    const emotionButtons = document.querySelectorAll('.emotion-btn');
    emotionButtons.forEach(btn => btn.classList.remove('active'));

    exitEditMode();
}

/**
 * AI 질문 제안 업데이트
 */
function updateAISuggestion(suggestion) {
    const suggestionText = document.querySelector('.suggestion-text');

    if (suggestionText) {
        suggestionText.classList.add('skeleton');
        suggestionText.textContent = '질문을 불러오는 중입니다...';

        setTimeout(() => {
            suggestionText.classList.remove('skeleton');
            suggestionText.textContent = `"${suggestion}"`;
        }, 800);
    }
}

/**
 * 질문 새로고침 버튼 초기화
 */
function initRefreshSuggestion() {
    const refreshBtn = document.querySelector('.btn-refresh-suggestion');

    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            this.style.transform = 'rotate(360deg)';

            setTimeout(() => {
                this.style.transform = 'rotate(0deg)';
            }, 300);

            requestNewQuestion();
        });
    }
}

/**
 * 새 질문 요청
 */
function requestNewQuestion() {
    if (typeof ALL_AI_QUESTIONS === 'undefined' || ALL_AI_QUESTIONS.length === 0) {
        updateAISuggestion('아이에게 책에서 가장 기억에 남는 장면이 무엇인지 물어보세요.');
        return;
    }

    if (ALL_AI_QUESTIONS.length <= 1) {
        const randomSuggestion = ALL_AI_QUESTIONS[0];
        updateAISuggestion(randomSuggestion);
        previousQuestion = randomSuggestion;
        return;
    }

    let randomSuggestion;
    let attempts = 0;
    const maxAttempts = 10;

    do {
        randomSuggestion = ALL_AI_QUESTIONS[Math.floor(Math.random() * ALL_AI_QUESTIONS.length)];
        attempts++;
    } while (randomSuggestion === previousQuestion && attempts < maxAttempts);

    updateAISuggestion(randomSuggestion);
    previousQuestion = randomSuggestion;
}

/**
 * 등록 버튼 초기화
 */
function initRegisterButton() {
    const registerBtn = document.querySelector('.btn-register');
    const conversationInput = document.getElementById('conversationInput');

    if (registerBtn && conversationInput) {
        registerBtn.addEventListener('click', function() {
            const content = conversationInput.value.trim();

            if (!content) {
                showToast('대화 내용을 입력해주세요.', 'warning');
                conversationInput.focus();
                return;
            }

            const selectedEmotions = getSelectedEmotions();

            if (selectedEmotions.length === 0) {
                showToast('오늘의 감정을 선택해주세요.', 'warning');
                return;
            }

            if (isEditMode && editingConversationId) {
                // 수정 모드
                updateConversation(editingConversationId, content, selectedEmotions);
            } else {
                // 등록 모드
                saveConversation(content, selectedEmotions);
            }
        });
    }
}

/**
 * 대화 기록 저장
 */
async function saveConversation(content, emotions) {
    // 제목 자동 생성 (내용의 첫 20자)
    const title = content.length > 20 ? content.substring(0, 20) + '...' : content;

    // AI 질문 가져오기
    const suggestionText = document.querySelector('.suggestion-text');
    const aiQuestion = suggestionText?.textContent?.replace(/^"|"$/g, '') || '';

    const conversationData = {
        title: title,
        content: content,
        emotions: emotions,
        aiQuestion: aiQuestion
    };

    try {
        showToast('저장 중...', 'info');

        const response = await apiClient.createDialogueConversation(conversationData);

        if (response.success && response.data) {
            showToast('대화 기록이 저장되었습니다.', 'success');

            // API 응답에 emotions가 없거나 빈 배열일 경우 로컬 데이터 사용
            const responseEmotions = response.data.emotions;
            const hasEmotions = responseEmotions && Array.isArray(responseEmotions) && responseEmotions.length > 0;

            const newConversation = {
                ...response.data,
                emotions: hasEmotions ? responseEmotions : emotions,
                title: response.data.title || title,
                createdAt: response.data.createdAt || new Date().toISOString()
            };

            console.log('저장된 대화:', newConversation);

            // 목록에 추가
            conversationsList.unshift(newConversation);

            // 새 카드 추가
            const conversationList = document.getElementById('conversationList');
            const newCard = createConversationCard(newConversation, true);
            newCard.style.animation = 'fadeInUp 0.4s ease forwards';

            // 기존 active 제거
            const allCards = conversationList.querySelectorAll('.conversation-card');
            allCards.forEach(c => c.classList.remove('active'));

            // 맨 앞에 추가
            if (conversationList.firstChild) {
                conversationList.insertBefore(newCard, conversationList.firstChild);
            } else {
                conversationList.appendChild(newCard);
            }

            // 빈 상태 메시지 제거
            const emptyState = conversationList.querySelector('.empty-state');
            if (emptyState) {
                emptyState.remove();
            }

            // 입력 폼 초기화
            clearInputForm();

            // 새 질문 요청
            requestNewQuestion();

        } else {
            throw new Error(response.message || '저장에 실패했습니다.');
        }
    } catch (error) {
        console.error('대화 저장 실패:', error);
        showToast(error.message || '저장 중 오류가 발생했습니다.', 'error');
    }
}

/**
 * 대화 기록 수정
 */
async function updateConversation(conversationId, content, emotions) {
    const title = content.length > 20 ? content.substring(0, 20) + '...' : content;

    const conversationData = {
        title: title,
        content: content,
        emotions: emotions
    };

    try {
        showToast('수정 중...', 'info');

        const response = await apiClient.updateDialogueConversation(conversationId, conversationData);

        if (response.success && response.data) {
            showToast('대화 기록이 수정되었습니다.', 'success');

            // API 응답에 emotions가 없거나 빈 배열일 경우 로컬 데이터 사용
            const responseEmotions = response.data.emotions;
            const hasEmotions = responseEmotions && Array.isArray(responseEmotions) && responseEmotions.length > 0;

            const updatedConversation = {
                ...response.data,
                emotions: hasEmotions ? responseEmotions : emotions,
                title: response.data.title || title
            };

            console.log('수정된 대화:', updatedConversation);

            // 목록에서 업데이트
            const index = conversationsList.findIndex(c => c.conversationId === conversationId);
            if (index !== -1) {
                conversationsList[index] = updatedConversation;
            }

            // 카드 업데이트
            const card = document.querySelector(`.conversation-card[data-conversation-id="${conversationId}"]`);
            if (card) {
                const newCard = createConversationCard(updatedConversation, true);
                card.replaceWith(newCard);
            }

            // 수정 모드 해제
            exitEditMode();

        } else {
            throw new Error(response.message || '수정에 실패했습니다.');
        }
    } catch (error) {
        console.error('대화 수정 실패:', error);
        showToast(error.message || '수정 중 오류가 발생했습니다.', 'error');
    }
}

/**
 * 페이드 아웃 애니메이션 정의
 */
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeOutDown {
        from {
            opacity: 1;
            transform: translateY(0);
        }
        to {
            opacity: 0;
            transform: translateY(20px);
        }
    }

    .btn-register.edit-mode {
        background: #ff9800 !important;
    }

    .btn-register.edit-mode:hover {
        background: #f57c00 !important;
    }

    .empty-state,
    .loading-state {
        text-align: center;
        padding: 40px 20px;
        color: #999;
    }

    .empty-state p,
    .loading-state p {
        margin: 5px 0;
        font-size: 0.9rem;
    }

    .loading-state {
        animation: pulse 1.5s infinite;
    }

    @keyframes pulse {
        0%, 100% { opacity: 0.6; }
        50% { opacity: 1; }
    }
`;
document.head.appendChild(style);

/* ========================================
   모달 관련 함수
======================================== */

let modalResolveCallback = null;

/**
 * 모달 초기화
 */
function initModal() {
    const modal = document.getElementById('confirmModal');
    const cancelBtn = document.getElementById('modalCancelBtn');
    const confirmBtn = document.getElementById('modalConfirmBtn');

    if (!modal || !cancelBtn || !confirmBtn) return;

    cancelBtn.addEventListener('click', function() {
        closeModal(false);
    });

    confirmBtn.addEventListener('click', function() {
        closeModal(true);
    });

    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal(false);
        }
    });

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeModal(false);
        }
    });
}

/**
 * 확인 모달 표시 (Promise 기반)
 */
function showConfirmModal(message, title = '확인') {
    return new Promise((resolve) => {
        const modal = document.getElementById('confirmModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalMessage = document.getElementById('modalMessage');

        if (!modal || !modalTitle || !modalMessage) {
            console.error('모달 요소를 찾을 수 없습니다.');
            resolve(false);
            return;
        }

        modalTitle.textContent = title;
        modalMessage.textContent = message;
        modal.classList.add('active');
        modalResolveCallback = resolve;
    });
}

/**
 * 모달 닫기
 */
function closeModal(result) {
    const modal = document.getElementById('confirmModal');

    if (!modal) return;

    modal.classList.remove('active');

    if (modalResolveCallback) {
        modalResolveCallback(result);
        modalResolveCallback = null;
    }
}
