// ==================== 구독 플랜 데이터 ====================
// API에서 동적으로 로드됨
let SUBSCRIPTION_PLANS = {};

// planId → 프론트엔드 키 매핑 (HTML data-plan 속성과 연결)
const PLAN_ID_TO_KEY = {
    1: 'preschool',
    2: 'students',
    3: 'parents'
};

// 프론트엔드 키 → planId 매핑
const PLAN_KEY_TO_ID = {
    'preschool': 1,
    'students': 2,
    'parents': 3
};

// ==================== 구독 플랜 API 로드 ====================
async function loadSubscriptionPlans() {
    try {
        const response = await apiClient.getSubscriptionPlans();

        if (response.success && response.data) {
            // API 응답을 SUBSCRIPTION_PLANS 형식으로 변환
            response.data.forEach(plan => {
                const planKey = PLAN_ID_TO_KEY[plan.planId];
                if (planKey) {
                    SUBSCRIPTION_PLANS[planKey] = {
                        id: planKey,
                        planId: plan.planId,
                        name: plan.name,
                        price: plan.price,
                        targetAge: plan.targetAge,
                        description: plan.description,
                        durationDays: plan.durationDays,
                        isActive: plan.isActive
                    };
                }
            });

            // UI 업데이트 (가격, 이름 등이 변경되었을 수 있음)
            updatePlanCardsFromAPI();

            console.log('구독 플랜 로드 완료:', SUBSCRIPTION_PLANS);
        }
    } catch (error) {
        console.error('구독 플랜 로드 실패:', error);
        // API 실패 시 폴백 데이터 사용
        loadFallbackPlans();
    }
}

// API 실패 시 폴백 데이터
function loadFallbackPlans() {
    SUBSCRIPTION_PLANS = {
        preschool: {
            id: 'preschool',
            planId: 1,
            name: '영·유아 패키지',
            price: 19900,
            targetAge: '0-7세',
            description: '우리 아이의 첫 독서 여정'
        },
        students: {
            id: 'students',
            planId: 2,
            name: '초등·청소년 패키지',
            price: 24900,
            targetAge: '8-13세',
            description: '생각의 깊이를 키우는 독서'
        },
        parents: {
            id: 'parents',
            planId: 3,
            name: '부모 패키지',
            price: 22900,
            targetAge: '부모',
            description: '부모의 성장이 자녀의 성장으로'
        }
    };
    console.log('폴백 플랜 데이터 사용');
}

// API 데이터로 플랜 카드 UI 업데이트
function updatePlanCardsFromAPI() {
    Object.keys(SUBSCRIPTION_PLANS).forEach(planKey => {
        const plan = SUBSCRIPTION_PLANS[planKey];
        const planCard = document.querySelector(`.plan-card[data-plan="${planKey}"]`);

        if (planCard) {
            // 가격 업데이트
            const priceElement = planCard.querySelector('.price-amount');
            if (priceElement) {
                priceElement.textContent = Number(plan.price).toLocaleString();
            }

            // 플랜명 업데이트
            const nameElement = planCard.querySelector('.plan-header h2');
            if (nameElement) {
                nameElement.textContent = plan.name;
            }

            // 설명 업데이트
            const taglineElement = planCard.querySelector('.plan-tagline');
            if (taglineElement) {
                taglineElement.textContent = plan.description;
            }

            // 대상 연령 업데이트
            const badgeElement = planCard.querySelector('.plan-badge');
            if (badgeElement) {
                badgeElement.textContent = plan.targetAge;
            }

            // 비활성 플랜 처리
            if (plan.isActive === false) {
                planCard.classList.add('disabled');
                const button = planCard.querySelector('.btn-select-plan');
                if (button) {
                    button.textContent = '현재 이용 불가';
                    button.disabled = true;
                }
            }
        }
    });
}

// ==================== 페이지 초기화 ====================
document.addEventListener('DOMContentLoaded', async function() {
    // 구독 플랜 API에서 로드
    await loadSubscriptionPlans();

    // 로그인 상태 확인 및 현재 구독 정보 로드
    if (isLoggedIn()) {
        await loadCurrentSubscription();
    }

    // URL 파라미터로 플랜 선택 상태 확인
    const urlParams = new URLSearchParams(window.location.search);
    const selectedPlan = urlParams.get('plan');
    if (selectedPlan && SUBSCRIPTION_PLANS[selectedPlan]) {
        highlightPlan(selectedPlan);
    }
});

// ==================== 현재 구독 정보 로드 ====================
async function loadCurrentSubscription() {
    try {
        // 모든 구독 정보 로드 (여러 플랜 구독 지원)
        const response = await apiClient.getSubscriptions();
        console.log('전체 구독 API 응답:', response);

        if (response.success && response.data && response.data.length > 0) {
            // ACTIVE 상태인 구독만 필터링
            const activeSubscriptions = response.data.filter(sub => sub.status === 'ACTIVE');
            console.log('활성 구독 목록:', activeSubscriptions);

            if (activeSubscriptions.length > 0) {
                displayCurrentSubscriptions(activeSubscriptions);
            }
        }
    } catch (error) {
        console.log('현재 구독 정보 없음 또는 로드 실패:', error);
        // 구독 정보가 없으면 섹션 숨김 유지
    }
}

// ==================== 현재 구독 상태 표시 (여러 구독 지원) ====================
function displayCurrentSubscriptions(subscriptions) {
    console.log('구독 정보 표시:', subscriptions);

    const section = document.getElementById('currentSubscription');
    const subscriptionCard = section.querySelector('.current-subscription-card');

    if (!subscriptions || subscriptions.length === 0) {
        return;
    }

    // 기존 내용 초기화 및 새로운 구조로 변경
    subscriptionCard.innerHTML = '';

    subscriptions.forEach((subscription, index) => {
        const planKey = PLAN_ID_TO_KEY[subscription.planId] || subscription.planType;
        const plan = SUBSCRIPTION_PLANS[planKey];

        console.log(`구독 ${index + 1} - 플랜 키:`, planKey, '플랜 정보:', plan);

        // 로컬 플랜 정보 우선 사용 (서버 인코딩 문제 방지)
        const displayName = (plan ? plan.name : null) || subscription.planName || '-';

        // 구독 기간 텍스트
        let periodText = '-';
        if (subscription.startDate && subscription.endDate) {
            periodText = `${formatDate(subscription.startDate)} ~ ${formatDate(subscription.endDate)}`;
        } else if (subscription.nextBillingDate) {
            periodText = `다음 결제일: ${formatDate(subscription.nextBillingDate)}`;
        }

        // 구독 아이템 HTML 생성
        const subscriptionItem = document.createElement('div');
        subscriptionItem.className = 'current-subscription-item';
        subscriptionItem.innerHTML = `
            <div class="current-info">
                <span class="current-label">구독 중</span>
                <h3 class="current-plan-name">${displayName}</h3>
                <p class="current-plan-period">${periodText}</p>
            </div>
            <div class="current-actions">
                <button class="btn-manage" onclick="goToMypage()">구독 관리</button>
            </div>
        `;

        subscriptionCard.appendChild(subscriptionItem);

        // 현재 구독 중인 플랜 카드 표시
        markCurrentPlan(planKey);
    });

    section.style.display = 'block';
}

// ==================== 현재 구독 플랜 표시 ====================
function markCurrentPlan(planType) {
    const planCard = document.querySelector(`.plan-card[data-plan="${planType}"]`);
    if (planCard) {
        planCard.classList.add('current');

        const button = planCard.querySelector('.btn-select-plan');
        if (button) {
            button.textContent = '현재 구독 중';
            button.disabled = true;
            button.style.background = '#ccc';
            button.style.cursor = 'default';
        }
    }
}

// ==================== 플랜 선택 ====================
function selectPlan(planType) {
    const plan = SUBSCRIPTION_PLANS[planType];

    if (!plan) {
        showToast('유효하지 않은 플랜입니다.', 'error');
        return;
    }

    // 로그인 확인
    if (!isLoggedIn()) {
        showToast('로그인이 필요한 서비스입니다.', 'warning');

        // 로그인 후 돌아올 URL 저장
        sessionStorage.setItem('redirectAfterLogin', `/subscription.html?plan=${planType}`);

        setTimeout(() => {
            window.location.href = '/login.html';
        }, 1500);
        return;
    }

    // 구독 신청 처리
    confirmSubscription(plan);
}

// ==================== 구독 확인 모달 ====================
let selectedPlanForSubscription = null;

function confirmSubscription(plan) {
    selectedPlanForSubscription = plan;

    // 모달 내용 업데이트
    document.getElementById('modalPlanName').textContent = `${plan.name} 구독`;
    document.getElementById('modalPlanDesc').textContent = `${plan.name}을(를) 구독하시겠습니까?`;
    document.getElementById('modalTargetAge').textContent = plan.targetAge;
    document.getElementById('modalPrice').textContent = `${plan.price.toLocaleString()}원`;

    // 확인 버튼 이벤트 설정
    const confirmBtn = document.getElementById('btnModalConfirm');
    confirmBtn.onclick = () => {
        closeSubscribeModal();
        processSubscription(plan);
    };

    // 모달 표시
    openSubscribeModal();
}

function openSubscribeModal() {
    const modal = document.getElementById('subscribeModal');
    modal.classList.add('show');

    // 모달 외부 클릭 시 닫기
    modal.onclick = (e) => {
        if (e.target === modal) {
            closeSubscribeModal();
        }
    };

    // ESC 키로 닫기
    document.addEventListener('keydown', handleEscKey);
}

function closeSubscribeModal() {
    const modal = document.getElementById('subscribeModal');
    modal.classList.remove('show');
    selectedPlanForSubscription = null;

    document.removeEventListener('keydown', handleEscKey);
}

function handleEscKey(e) {
    if (e.key === 'Escape') {
        closeSubscribeModal();
    }
}

// ==================== 구독 처리 ====================
async function processSubscription(plan) {
    try {
        showToast('구독 신청 중...', 'info');

        // 선택된 결제 수단 가져오기
        const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value || 'CARD';

        // 명세서 기준: planId로 전송
        const response = await apiClient.createSubscription({
            planId: plan.planId,
            paymentMethod: paymentMethod,
            autoRenew: true
        });

        if (response.success) {
            showToast(`${plan.name} 구독이 완료되었습니다!`, 'success');

            // 잠시 후 마이페이지로 이동
            setTimeout(() => {
                window.location.href = '/mypage.html';
            }, 2000);
        } else {
            throw new Error(response.message || '구독 신청에 실패했습니다.');
        }

    } catch (error) {
        console.error('구독 처리 실패:', error);
        showToast(error.message || '구독 신청 중 오류가 발생했습니다.', 'error');
    }
}

// ==================== 플랜 하이라이트 ====================
function highlightPlan(planType) {
    const planCard = document.querySelector(`.plan-card[data-plan="${planType}"]`);
    if (planCard) {
        planCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        planCard.style.animation = 'pulse 0.5s ease 2';
    }
}

// ==================== 마이페이지로 이동 ====================
function goToMypage() {
    window.location.href = '/mypage.html';
}

// ==================== FAQ 토글 ====================
function toggleFaq(element) {
    const faqItem = element.parentElement;
    const isActive = faqItem.classList.contains('active');

    // 다른 모든 FAQ 닫기
    document.querySelectorAll('.faq-item').forEach(item => {
        item.classList.remove('active');
    });

    // 클릭한 FAQ 토글
    if (!isActive) {
        faqItem.classList.add('active');
    }
}

// ==================== 날짜 포맷 ====================
function formatDate(dateString) {
    if (!dateString) return '-';

    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}.${month}.${day}`;
}

// ==================== CSS 애니메이션 추가 ====================
const style = document.createElement('style');
style.textContent = `
    @keyframes pulse {
        0%, 100% { box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08); }
        50% { box-shadow: 0 4px 30px rgba(32, 178, 170, 0.4); }
    }

    .plan-card.current {
        border-color: #20B2AA;
        background: linear-gradient(135deg, #f0ffff 0%, #f5fffa 100%);
    }

    .plan-card.current::after {
        content: '구독 중';
        position: absolute;
        top: 15px;
        right: 15px;
        background: #20B2AA;
        color: white;
        padding: 4px 12px;
        border-radius: 12px;
        font-size: 0.8rem;
        font-weight: 600;
    }

    /* 여러 구독 표시 스타일 */
    .current-subscription-card {
        display: flex;
        flex-direction: column;
        gap: 15px;
    }

    .current-subscription-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 15px 20px;
        background: #f8f9fa;
        border-radius: 10px;
        border-left: 4px solid #20B2AA;
    }

    .current-subscription-item .current-info {
        flex: 1;
    }

    .current-subscription-item .current-label {
        font-size: 0.75rem;
        color: #20B2AA;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .current-subscription-item .current-plan-name {
        font-size: 1.1rem;
        font-weight: 600;
        color: #333;
        margin: 5px 0;
    }

    .current-subscription-item .current-plan-period {
        font-size: 0.85rem;
        color: #666;
        margin: 0;
    }

    .current-subscription-item .current-actions {
        flex-shrink: 0;
    }

    .current-subscription-item .btn-manage {
        padding: 8px 16px;
        font-size: 0.85rem;
    }
`;
document.head.appendChild(style);
