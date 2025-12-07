/* ===================================
   영·유아 패키지 프로그램 페이지 JavaScript
   =================================== */

// DOM이 완전히 로드된 후 실행
document.addEventListener('DOMContentLoaded', () => {
    // 스크롤 애니메이션 초기화
    initScrollAnimations();

    // 구독 버튼 이벤트 초기화
    initSubscribeButton();

    // FAQ 아이템 클릭 효과
    initFAQInteraction();
});

/* ===================================
   스크롤 애니메이션 초기화
   =================================== */
/**
 * 각 섹션 요소가 뷰포트에 진입했을 때
 * 페이드인 애니메이션 실행
 */
function initScrollAnimations() {
    const animatedElements = document.querySelectorAll(
        '.feature-card, .age-group, .package-item, .review-card, .faq-item'
    );

    // Intersection Observer 옵션 설정
    const observerOptions = {
        threshold: 0.2,        // 요소가 20% 보일 때 콜백 실행
        rootMargin: '0px'      // 뷰포트 마진 없음
    };

    // Intersection Observer 생성
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            // 요소가 뷰포트에 진입했을 때
            if (entry.isIntersecting) {
                // 순차적 애니메이션을 위한 딜레이 추가
                setTimeout(() => {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }, index * 100);

                // 한 번 애니메이션이 실행되면 더 이상 관찰하지 않음 (성능 최적화)
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // 모든 애니메이션 요소 초기 상태 설정 및 관찰 시작
    animatedElements.forEach(element => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(30px)';
        element.style.transition = 'all 0.6s ease';
        observer.observe(element);
    });
}

/* ===================================
   구독 버튼 이벤트
   =================================== */
/**
 * 구독 시작하기 버튼 클릭 시
 * 회원가입/로그인 페이지로 이동
 */
function initSubscribeButton() {
    const subscribeBtn = document.querySelector('.subscribe-btn');

    if (subscribeBtn) {
        subscribeBtn.addEventListener('click', () => {
            // 구독 페이지로 이동 (preschool 플랜 선택 상태)
            window.location.href = '/subscription.html?plan=preschool';
        });
    }
}

/* ===================================
   FAQ 아이템 인터랙션
   =================================== */
/**
 * FAQ 아이템 클릭 시 하이라이트 효과
 */
function initFAQInteraction() {
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(item => {
        item.addEventListener('click', function() {
            // 기존 하이라이트 제거
            faqItems.forEach(el => el.classList.remove('highlighted'));

            // 클릭한 아이템 하이라이트
            this.classList.add('highlighted');

            // 3초 후 하이라이트 제거
            setTimeout(() => {
                this.classList.remove('highlighted');
            }, 3000);
        });
    });
}

/* ===================================
   히어로 이미지 패럴랙스 효과 (선택적)
   =================================== */
/**
 * 스크롤 시 히어로 이미지에 미묘한 패럴랙스 효과 적용
 */
function initHeroParallax() {
    const heroImage = document.querySelector('.hero-image img');

    if (heroImage) {
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            const rate = scrolled * 0.3;

            if (scrolled < 600) { // 히어로 섹션 범위 내에서만 적용
                heroImage.style.transform = `translateY(${rate}px)`;
            }
        });
    }
}

// 패럴랙스 효과를 원하면 주석 해제
// initHeroParallax();
