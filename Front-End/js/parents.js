/* ===================================
   부모 패키지 프로그램 페이지 JavaScript
   =================================== */

// DOM이 완전히 로드된 후 실행
document.addEventListener('DOMContentLoaded', () => {
    // 스크롤 애니메이션 초기화
    initScrollAnimations();

    // CTA 버튼 이벤트 초기화
    initCTAButtons();

    // 구독 버튼 이벤트 초기화
    initSubscribeButton();

    // FAQ 아이템 클릭 효과
    initFAQInteraction();

    // 테마 카드 인터랙션
    initThemeCards();
});

/* ===================================
   스크롤 애니메이션 초기화
   =================================== */
function initScrollAnimations() {
    const animatedElements = document.querySelectorAll(
        '.importance-card, .feature-item, .theme-card, .package-item, .review-card, .faq-item'
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
   CTA 버튼 이벤트
   =================================== */
function initCTAButtons() {
    const primaryBtn = document.querySelector('.cta-btn.primary');
    const secondaryBtn = document.querySelector('.cta-btn.secondary');

    if (primaryBtn) {
        primaryBtn.addEventListener('click', () => {
            // 구독 섹션으로 스크롤
            const pricingSection = document.querySelector('.pricing');
            if (pricingSection) {
                pricingSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }

    if (secondaryBtn) {
        secondaryBtn.addEventListener('click', () => {
            // 프로그램 특징 섹션으로 스크롤
            const featuresSection = document.querySelector('.program-features');
            if (featuresSection) {
                featuresSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }
}

/* ===================================
   구독 버튼 이벤트
   =================================== */
function initSubscribeButton() {
    const subscribeBtn = document.querySelector('.subscribe-btn');

    if (subscribeBtn) {
        subscribeBtn.addEventListener('click', () => {
            // 구독 페이지로 이동 (parents 플랜 선택 상태)
            window.location.href = '/subscription.html?plan=parents';
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
   테마 카드 인터랙션
   =================================== */
function initThemeCards() {
    const themeCards = document.querySelectorAll('.theme-card');

    themeCards.forEach(card => {
        // 카드 클릭 시 부드러운 하이라이트 효과
        card.addEventListener('click', function() {
            // 모든 카드의 하이라이트 제거
            themeCards.forEach(c => {
                c.style.borderTopColor = '#fa709a';
                c.style.borderTopWidth = '5px';
            });

            // 클릭한 카드 하이라이트
            this.style.borderTopColor = '#fee140';
            this.style.borderTopWidth = '8px';

            // 3초 후 원래대로
            setTimeout(() => {
                this.style.borderTopColor = '#fa709a';
                this.style.borderTopWidth = '5px';
            }, 3000);
        });

        // 호버 시 리스트 아이템 강조
        const listItems = card.querySelectorAll('li');
        listItems.forEach((item, index) => {
            item.style.opacity = '0.7';
            item.style.transition = 'all 0.3s ease';

            card.addEventListener('mouseenter', () => {
                setTimeout(() => {
                    item.style.opacity = '1';
                    item.style.transform = 'translateX(5px)';
                }, index * 50);
            });

            card.addEventListener('mouseleave', () => {
                item.style.opacity = '0.7';
                item.style.transform = 'translateX(0)';
            });
        });
    });
}

/* ===================================
   히어로 패럴랙스 효과 (선택적)
   =================================== */
function initHeroParallax() {
    const heroOverlay = document.querySelector('.hero-overlay');

    if (heroOverlay) {
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            const rate = scrolled * 0.5;

            if (scrolled < 600) {
                heroOverlay.style.transform = `translateY(${rate}px)`;
            }
        });
    }
}

// 패럴랙스 효과를 원하면 주석 해제
// initHeroParallax();

/* ===================================
   중요성 카드 순차 애니메이션
   =================================== */
function initImportanceAnimation() {
    const importanceCards = document.querySelectorAll('.importance-card');

    const observerOptions = {
        threshold: 0.3,
        rootMargin: '0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                const cards = entry.target.parentElement.querySelectorAll('.importance-card');
                cards.forEach((card, index) => {
                    setTimeout(() => {
                        card.style.opacity = '1';
                        card.style.transform = 'scale(1) translateY(0)';
                    }, index * 150);
                });

                observer.unobserve(entry.target.parentElement);
            }
        });
    }, observerOptions);

    if (importanceCards.length > 0) {
        importanceCards.forEach(card => {
            card.style.opacity = '0';
            card.style.transform = 'scale(0.9) translateY(20px)';
            card.style.transition = 'all 0.5s ease';
        });

        observer.observe(importanceCards[0].parentElement);
    }
}

// 중요성 카드 애니메이션을 원하면 주석 해제
// initImportanceAnimation();
