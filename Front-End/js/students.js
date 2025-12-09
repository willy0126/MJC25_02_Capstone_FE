/* ===================================
   초등·청소년 패키지 프로그램 페이지 JavaScript
   =================================== */

// DOM이 완전히 로드된 후 실행
document.addEventListener('DOMContentLoaded', () => {
    // 스크롤 애니메이션 초기화
    initScrollAnimations();

    // 통계 카드 카운팅 애니메이션
    initStatCounters();

    // 구독 버튼 이벤트 초기화
    initSubscribeButton();

    // FAQ 아이템 클릭 효과
    initFAQInteraction();
});

/* ===================================
   스크롤 애니메이션 초기화
   =================================== */
function initScrollAnimations() {
    const animatedElements = document.querySelectorAll(
        '.feature-card, .grade-group, .package-item, .review-card, .faq-item'
    );

    const observerOptions = {
        threshold: 0.2,
        rootMargin: '0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }, index * 100);

                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    animatedElements.forEach(element => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(30px)';
        element.style.transition = 'all 0.6s ease';
        observer.observe(element);
    });
}

/* ===================================
   통계 카드 카운팅 애니메이션
   =================================== */
function initStatCounters() {
    const statCards = document.querySelectorAll('.stat-card');

    const observerOptions = {
        threshold: 0.5,
        rootMargin: '0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const numberElement = entry.target.querySelector('.stat-number');
                const text = numberElement.textContent;

                // 숫자 포함 여부 확인
                if (/\d/.test(text)) {
                    animateNumber(numberElement, text);
                }

                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    statCards.forEach(card => {
        observer.observe(card);
    });
}

/**
 * 숫자 카운팅 애니메이션
 */
function animateNumber(element, targetText) {
    // 숫자 추출
    const match = targetText.match(/(\d+\.?\d*)/);
    if (!match) return;

    const targetNumber = parseFloat(match[0]);
    const suffix = targetText.replace(match[0], '');
    const duration = 2000; // 2초
    const frameRate = 60;
    const totalFrames = (duration / 1000) * frameRate;
    const increment = targetNumber / totalFrames;

    let currentNumber = 0;
    let frame = 0;

    const counter = setInterval(() => {
        frame++;
        currentNumber += increment;

        if (frame >= totalFrames) {
            currentNumber = targetNumber;
            clearInterval(counter);
        }

        // 소수점 처리
        const displayNumber = targetNumber % 1 === 0
            ? Math.floor(currentNumber)
            : currentNumber.toFixed(1);

        element.textContent = displayNumber + suffix;
    }, 1000 / frameRate);
}

/* ===================================
   구독 버튼 이벤트
   =================================== */
function initSubscribeButton() {
    const subscribeBtn = document.querySelector('.subscribe-btn');

    if (subscribeBtn) {
        subscribeBtn.addEventListener('click', () => {
            if (isLoggedIn()) {
                showToast('구독 기능은 준비 중입니다.', 'info');
            } else {
                showToast('로그인이 필요한 서비스입니다.', 'warning');
                setTimeout(() => {
                    window.location.href = '/login.html';
                }, 1500);
            }
        });
    }
}

/* ===================================
   FAQ 아이템 인터랙션
   =================================== */
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
   카테고리 호버 효과 (선택적)
   =================================== */
function initCategoryHighlight() {
    const categories = document.querySelectorAll('.category');

    categories.forEach(category => {
        category.addEventListener('mouseenter', function() {
            this.style.transform = 'translateX(5px)';
            this.style.borderLeftWidth = '6px';
        });

        category.addEventListener('mouseleave', function() {
            this.style.transform = 'translateX(0)';
            this.style.borderLeftWidth = '4px';
        });
    });
}

// 카테고리 호버 효과를 원하면 주석 해제
// initCategoryHighlight();
