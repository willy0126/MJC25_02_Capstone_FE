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
    // feature-card 등 작은 요소들을 위한 observer (완전히 보일 때)
    const fullVisibilityCallback = (entries) => {
        entries.forEach(entry => {
            // 완전히 보일 때만 (intersectionRatio가 1.0일 때)
            if (entry.isIntersecting && entry.intersectionRatio >= 0.99) {
                entry.target.classList.add('active');
            }
        });
    };

    // 큰 섹션을 위한 observer (80% 정도 보일 때)
    const partialVisibilityCallback = (entries) => {
        entries.forEach(entry => {
            // 80% 이상 보일 때
            if (entry.isIntersecting && entry.intersectionRatio >= 0.8) {
                entry.target.classList.add('active');
            }
        });
    };

    const fullVisibilityOptions = {
        root: null,
        rootMargin: '0px',
        threshold: [0, 0.25, 0.5, 0.75, 0.99, 1.0]
    };

    const partialVisibilityOptions = {
        root: null,
        rootMargin: '0px',
        threshold: [0, 0.25, 0.5, 0.75, 0.8, 1.0]
    };

    const fullObserver = new IntersectionObserver(fullVisibilityCallback, fullVisibilityOptions);
    const partialObserver = new IntersectionObserver(partialVisibilityCallback, partialVisibilityOptions);

    // feature-card와 작은 요소들은 완전히 보일 때 애니메이션
    const smallElements = document.querySelectorAll('.reveal-stagger');
    smallElements.forEach(element => {
        fullObserver.observe(element);
    });

    // 큰 섹션들은 80% 정도 보일 때 애니메이션
    const largeElements = document.querySelectorAll(
        '.reveal, .reveal-left, .reveal-right, .reveal-scale, .content-section.reveal-left, .content-section.reveal-right, .content-section.centered'
    );
    largeElements.forEach(element => {
        partialObserver.observe(element);
    });

    // mission-section과 values-section을 위한 별도 observer
    const missionSection = document.querySelector('.mission-section');
    const valuesSection = document.querySelector('.values-section');

    const sectionObserverOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.3
    };

    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, sectionObserverOptions);

    if (missionSection) {
        sectionObserver.observe(missionSection);
    }
    if (valuesSection) {
        sectionObserver.observe(valuesSection);
    }

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
