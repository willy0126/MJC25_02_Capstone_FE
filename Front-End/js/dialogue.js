/**
 * 독후 활동 페이지 JavaScript
 * dialogue.js
 */

// 이전에 표시된 질문을 저장 (중복 방지용)
let previousQuestion = null;

document.addEventListener('DOMContentLoaded', function() {
    initDialogue();
    initModal();
});

/**
 * 독후 활동 페이지 초기화
 */
function initDialogue() {
    initEmotionButtons();
    initSearchFunction();
    initConversationCards();
    initRefreshSuggestion();
    initRegisterButton();

    // 페이지 로드 시 초기 질문 랜덤 설정
    requestNewQuestion();
}

/**
 * 감정 버튼 초기화
 */
function initEmotionButtons() {
    const emotionButtons = document.querySelectorAll('.emotion-btn');
    
    emotionButtons.forEach(button => {
        button.addEventListener('click', function() {
            // 토글 방식으로 활성화/비활성화
            this.classList.toggle('active');
            
            // 선택된 감정들 수집
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
 * 부모 요소에 한 번만 이벤트 리스너를 등록하여 중복 방지
 */
function initConversationCards() {
    const conversationList = document.getElementById('conversationList');

    if (!conversationList) {
        return;
    }

    // 이미 이벤트 리스너가 등록되어 있으면 중복 등록 방지
    if (conversationList.dataset.initialized === 'true') {
        return;
    }

    // 이벤트 위임: 부모 요소에 한 번만 등록
    conversationList.addEventListener('click', function(e) {
        const card = e.target.closest('.conversation-card');

        if (!card) {
            return;
        }

        // 수정 버튼 클릭
        if (e.target.closest('.btn-edit-conversation')) {
            e.stopPropagation();
            const title = card.querySelector('.conversation-title')?.textContent;
            editConversation(card, title);
            return;
        }

        // 삭제 버튼 클릭
        if (e.target.closest('.btn-delete-conversation')) {
            e.stopPropagation();
            const title = card.querySelector('.conversation-title')?.textContent;
            deleteConversation(card, title);
            return;
        }

        // 카드 자체 클릭 (선택)
        // 모든 카드에서 active 클래스 제거
        const allCards = conversationList.querySelectorAll('.conversation-card');
        allCards.forEach(c => c.classList.remove('active'));

        // 클릭한 카드에 active 클래스 추가
        card.classList.add('active');

        // 선택한 대화 불러오기
        loadConversation(card);
    });

    // 초기화 완료 표시
    conversationList.dataset.initialized = 'true';
}

/**
 * 대화 불러오기
 */
function loadConversation(card) {
    const title = card.querySelector('.conversation-title')?.textContent || '';
    const date = card.querySelector('.conversation-date')?.textContent || '';
    const emotions = card.querySelectorAll('.emotion-tag');
    
    console.log('대화 불러오기:', { title, date });
    
    // 감정 버튼 초기화 및 선택
    const emotionButtons = document.querySelectorAll('.emotion-btn');
    emotionButtons.forEach(btn => btn.classList.remove('active'));
    
    // 카드의 감정 태그와 매칭되는 버튼 활성화
    emotions.forEach(tag => {
        const emotionText = tag.textContent;
        emotionButtons.forEach(btn => {
            if (btn.textContent.includes(emotionText.substring(2))) {
                btn.classList.add('active');
            }
        });
    });
    
    // TODO: API 호출하여 실제 대화 내용 불러오기
}

/**
 * 대화 수정
 */
function editConversation(card, title) {
    console.log('대화 수정:', title);
    // TODO: 수정 모달 열기 또는 수정 모드 활성화
    if (typeof showToast === 'function') {
        showToast('수정 기능은 준비 중입니다.', 'info');
    }
}

/**
 * 대화 삭제
 */
async function deleteConversation(card, title) {
    console.log('대화 삭제:', title);

    const confirmDelete = await showConfirmModal(
        `"${title}" 대화 기록을 삭제하시겠습니까?`,
        '대화 기록 삭제'
    );

    if (confirmDelete) {
        // 카드 삭제 애니메이션
        card.style.animation = 'fadeOutDown 0.3s ease forwards';

        setTimeout(() => {
            card.remove();

            if (typeof showToast === 'function') {
                showToast('대화 기록이 삭제되었습니다.', 'success');
            }

            // TODO: API 호출하여 실제 삭제 처리
        }, 300);
    }
}

/**
 * AI 질문 제안 업데이트
 */
function updateAISuggestion(suggestion) {
    const suggestionText = document.querySelector('.suggestion-text');

    if (suggestionText) {
        // 스켈레톤 로딩 표시
        suggestionText.classList.add('skeleton');
        suggestionText.textContent = '질문을 불러오는 중입니다...';

        // 800ms 후 실제 질문으로 교체 (shimmer 애니메이션을 충분히 볼 수 있도록)
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
            // 버튼 회전 애니메이션
            this.style.transform = 'rotate(360deg)';
            
            setTimeout(() => {
                this.style.transform = 'rotate(0deg)';
            }, 300);
            
            // 새 질문 요청
            requestNewQuestion();
        });
    }
}

/**
 * 새 질문 요청
 * constants.js의 ALL_AI_QUESTIONS 배열에서 랜덤하게 선택
 * 이전 질문과 중복되지 않도록 처리
 */
function requestNewQuestion() {
    // ALL_AI_QUESTIONS는 constants.js에서 정의된 30개의 질문 배열
    // 6가지 카테고리(EMOTION, STORY, CHARACTER, IMAGINATION, VALUE, CREATIVE)의 질문 포함

    // 질문이 1개만 있는 경우 무한 루프 방지
    if (ALL_AI_QUESTIONS.length <= 1) {
        const randomSuggestion = ALL_AI_QUESTIONS[0];
        updateAISuggestion(randomSuggestion);
        previousQuestion = randomSuggestion;
        return;
    }

    let randomSuggestion;
    let attempts = 0;
    const maxAttempts = 10; // 무한 루프 방지

    // 이전 질문과 다른 질문이 나올 때까지 반복
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
                if (typeof showToast === 'function') {
                    showToast('대화 내용을 입력해주세요.', 'warning');
                }
                conversationInput.focus();
                return;
            }
            
            const selectedEmotions = getSelectedEmotions();
            
            if (selectedEmotions.length === 0) {
                if (typeof showToast === 'function') {
                    showToast('오늘의 감정을 선택해주세요.', 'warning');
                }
                return;
            }
            
            // 대화 기록 저장
            saveConversation(content, selectedEmotions);
        });
    }
}

/**
 * 대화 기록 저장
 */
function saveConversation(content, emotions) {
    console.log('대화 저장:', { content, emotions });
    
    // TODO: API 호출하여 실제 저장 처리
    
    // 성공 시뮬레이션
    if (typeof showToast === 'function') {
        showToast('대화 기록이 저장되었습니다.', 'success');
    }
    
    // 입력 필드 초기화
    document.getElementById('conversationInput').value = '';
    
    // 새 대화 카드 추가 (시뮬레이션)
    addNewConversationCard(content, emotions);
}

/**
 * 새 대화 카드 추가
 */
function addNewConversationCard(content, emotions) {
    const conversationList = document.getElementById('conversationList');
    
    if (!conversationList) return;
    
    const emotionMap = {
        'happy': '🙂즐거움',
        'normal': '😐보통',
        'touched': '🥹감동',
        'difficult': '😵어려움',
        'curious': '🤔궁금함',
        'growth': '🌱성장'
    };
    
    const today = new Date();
    const dateStr = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, '0')}.${String(today.getDate()).padStart(2, '0')}`;
    
    const emotionTagsHTML = emotions.map(e => 
        `<span class="emotion-tag">${emotionMap[e] || e}</span>`
    ).join('');
    
    const summaryContent = content.length > 20 ? content.substring(0, 20) + '...' : content;
    
    const newCard = document.createElement('div');
    newCard.className = 'conversation-card';
    newCard.style.animation = 'fadeInUp 0.4s ease forwards';
    newCard.innerHTML = `
        <div class="conversation-info">
            <span class="conversation-date">${dateStr}</span>
            <h3 class="conversation-title">${summaryContent}</h3>
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

    // 맨 앞에 추가
    conversationList.insertBefore(newCard, conversationList.firstChild);

    // 이벤트 위임 패턴을 사용하므로 별도의 이벤트 바인딩 불필요
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

    if (!modal || !cancelBtn || !confirmBtn) {
        return;
    }

    // 취소 버튼 클릭
    cancelBtn.addEventListener('click', function() {
        closeModal(false);
    });

    // 확인 버튼 클릭
    confirmBtn.addEventListener('click', function() {
        closeModal(true);
    });

    // 오버레이 클릭 시 닫기
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal(false);
        }
    });

    // ESC 키로 닫기
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeModal(false);
        }
    });
}

/**
 * 확인 모달 표시 (Promise 기반)
 * @param {string} message - 모달에 표시할 메시지
 * @param {string} title - 모달 제목 (선택사항, 기본값: "확인")
 * @returns {Promise<boolean>} - 확인: true, 취소: false
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

        // 모달 내용 설정
        modalTitle.textContent = title;
        modalMessage.textContent = message;

        // 모달 표시
        modal.classList.add('active');

        // resolve 콜백 저장
        modalResolveCallback = resolve;
    });
}

/**
 * 모달 닫기
 * @param {boolean} result - 확인: true, 취소: false
 */
function closeModal(result) {
    const modal = document.getElementById('confirmModal');

    if (!modal) {
        return;
    }

    modal.classList.remove('active');

    // Promise resolve 호출
    if (modalResolveCallback) {
        modalResolveCallback(result);
        modalResolveCallback = null;
    }
}
