/* ========================================
   페이지 초기화
======================================== */
document.addEventListener('DOMContentLoaded', function() {
    initCTAButton();
    initScrollAnimations();
    initStatsCounter();
    initHeroParallax();
    initBookstartCarousel();
});

/* ========================================
   CTA 버튼 초기화 및 로그인 상태 처리
======================================== */
function initCTAButton() {
    const ctaButton = document.getElementById('cta-start-btn');
    if (!ctaButton) return;

    updateCTAButton(ctaButton);

    ctaButton.addEventListener('click', function(e) {
        e.preventDefault();

        if (isLoggedIn()) {
            window.location.href = 'bookcase.html';
        } else {
            localStorage.setItem('returnUrl', 'bookcase.html');
            window.location.href = 'login.html';
        }
    });

    window.addEventListener('loginStateChanged', function() {
        updateCTAButton(ctaButton);
    });
}

function updateCTAButton(button) {
    if (isLoggedIn()) {
        button.setAttribute('href', 'bookcase.html');
        button.textContent = '나의 책장으로';
    } else {
        button.setAttribute('href', 'login.html');
        button.textContent = '시작하기';
    }
}

/* ========================================
   스크롤 애니메이션 초기화
======================================== */
function initScrollAnimations() {
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.25
    };

    const observerCallback = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    const revealElements = document.querySelectorAll(
        '.reveal, .reveal-left, .reveal-right, .reveal-stagger, .reveal-scale, .content-section.reveal-left, .content-section.reveal-right, .content-section.centered'
    );

    revealElements.forEach(element => {
        observer.observe(element);
    });

    setTimeout(() => {
        revealElements.forEach(element => {
            const rect = element.getBoundingClientRect();
            const isInViewport = rect.top < window.innerHeight && rect.bottom > 0;

            if (isInViewport) {
                element.classList.add('active');
            }
        });
    }, 100);

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

/* ========================================
   통계 카운터 애니메이션
======================================== */
function initStatsCounter() {
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.25
    };

    const statsObserverCallback = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const statItems = entry.target.querySelectorAll('.stat-item h3');
                statItems.forEach((item, index) => {
                    const text = item.textContent;
                    const number = parseInt(text.replace(/\D/g, ''));

                    setTimeout(() => {
                        animateCounter(item, number, 2000);
                    }, index * 100);
                });

                observer.unobserve(entry.target);
            }
        });
    };

    const statsObserver = new IntersectionObserver(statsObserverCallback, observerOptions);
    const statsSection = document.querySelector('.stats-section');

    if (statsSection) {
        statsObserver.observe(statsSection);
    }
}

function animateCounter(element, target, duration = 2000) {
    const startTime = performance.now();

    const updateCounter = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        const easedProgress = progress * progress * progress;
        const currentValue = Math.floor(easedProgress * target);

        if (progress < 1) {
            element.textContent = currentValue.toLocaleString() + '+';
            requestAnimationFrame(updateCounter);
        } else {
            element.textContent = target.toLocaleString() + '+';
        }
    };

    requestAnimationFrame(updateCounter);
}

/* ========================================
   히어로 섹션 패럴랙스 효과
======================================== */
function initHeroParallax() {
    const heroSection = document.querySelector('.hero-section');
    const heroContent = heroSection ? heroSection.querySelector('div') : null;

    if (heroSection && heroContent) {
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            const heroHeight = heroSection.offsetHeight;

            const parallax = scrolled * 0.7;
            heroSection.style.transform = `translateY(${parallax}px)`;

            const fadeProgress = Math.min(scrolled / heroHeight, 1);
            const opacity = 1 - fadeProgress;
            const blurAmount = fadeProgress * 2;

            heroContent.style.opacity = opacity;
            heroContent.style.filter = `blur(${blurAmount}px)`;
            heroContent.style.transform = `translateY(${scrolled * 0.3}px)`;
        });
    }
}

/* ========================================
   북스타트 캐러셀 초기화
======================================== */
function initBookstartCarousel() {
    const carouselTrack = document.getElementById('carousel-track');
    if (!carouselTrack) return;

    const slides = carouselTrack.querySelectorAll('.carousel-slide');

    slides.forEach(slide => {
        slide.addEventListener('click', function() {
            const img = this.querySelector('img');
            if (img) {
                console.log('Image clicked:', img.alt);
            }
        });
    });

    document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
            carouselTrack.style.animationPlayState = 'paused';
        } else {
            carouselTrack.style.animationPlayState = 'running';
        }
    });
}
