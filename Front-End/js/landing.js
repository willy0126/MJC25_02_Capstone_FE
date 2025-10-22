/* ========================================
   Landing Page 초기화
======================================== */
document.addEventListener("DOMContentLoaded", function() {
    loadLandingNavbar();
    loadFooter();
    initPromoAnimations();
    initStatsCountUp();
    initTestimonialAnimations();
    initFloatingButton();
    initFAQAccordion();
});

/* ========================================
   Landing Navbar 로드 및 초기화
======================================== */
function loadLandingNavbar() {
    fetch('layouts/navbar-landing.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById("navbar-placeholder").innerHTML = data;

            // 스크롤 이벤트로 navbar 스타일 변경
            window.addEventListener('scroll', function() {
                const navbar = document.querySelector('.navbar');
                if (window.scrollY > 50) {
                    navbar.classList.add('scrolled');
                } else {
                    navbar.classList.remove('scrolled');
                }
            });
        })
        .catch(error => {
            console.error('Navbar 로드 실패:', error);
        });
}

/* ========================================
   Footer 로드
======================================== */
function loadFooter() {
    fetch('layouts/footer.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById("footer-placeholder").innerHTML = data;
        })
        .catch(error => {
            console.error('Footer 로드 실패:', error);
        });
}

/* ========================================
   프로모션 아이템 스크롤 애니메이션
======================================== */
function initPromoAnimations() {
    const promoItems = document.querySelectorAll('.promo-item');

    // Intersection Observer 설정 (70% 뷰포트에 들어왔을 때 트리거)
    const observerOptions = {
        threshold: 0.70,
        rootMargin: '0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const promoItem = entry.target;
                const promoText = promoItem.querySelector('.promo-text');
                const promoImage = promoItem.querySelector('.promo-image');

                // 텍스트 먼저 애니메이션 시작
                if (promoText) {
                    promoText.classList.add('fade-in-up');
                }

                // 0.7초 후에 이미지 애니메이션 시작
                if (promoImage) {
                    setTimeout(() => {
                        promoImage.classList.add('fade-in-up');
                    }, 700);
                }

                // 한 번 애니메이션이 실행되면 observer 해제
                observer.unobserve(promoItem);
            }
        });
    }, observerOptions);

    // 모든 프로모션 아이템 관찰 시작
    promoItems.forEach(item => {
        observer.observe(item);
    });
}

/* ========================================
   통계 섹션 카운트업 애니메이션
======================================== */
function initStatsCountUp() {
    const statCards = document.querySelectorAll('.stat-card');
    let hasAnimated = false;

    const observerOptions = {
        threshold: 0.7,
        rootMargin: '0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting && !hasAnimated) {
                hasAnimated = true;

                // 모든 stat-number 요소에 카운트업 애니메이션 적용
                const statNumbers = document.querySelectorAll('.stat-number');
                statNumbers.forEach(stat => {
                    animateNumber(stat);
                });
            }
        });
    }, observerOptions);

    // 첫 번째 stat-card만 관찰 (한 번만 실행되도록)
    if (statCards.length > 0) {
        observer.observe(statCards[0]);
    }
}

function animateNumber(element) {
    const target = parseFloat(element.getAttribute('data-target'));
    const duration = 2000; // 2초 동안 애니메이션
    const startTime = performance.now();

    // 소수점 여부 확인
    const hasDecimal = target % 1 !== 0;

    // Ease-out-quad 함수 (빠르게 시작해서 점점 느려지는 효과)
    function easeOutQuad(t) {
        return t * (2 - t); // 빠르게 시작 → 천천히 끝
    }

    function updateNumber(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1); // 0 ~ 1 사이 값

        // easing 함수 적용
        const easedProgress = easeOutQuad(progress);
        const current = target * easedProgress;

        // 소수점이 있으면 소수점 1자리까지, 없으면 정수로 표시
        if (hasDecimal) {
            element.textContent = current.toFixed(1);
        } else {
            element.textContent = Math.floor(current).toLocaleString();
        }

        // 애니메이션이 끝나지 않았으면 계속 실행
        if (progress < 1) {
            requestAnimationFrame(updateNumber);
        } else {
            // 최종값으로 정확히 설정
            if (hasDecimal) {
                element.textContent = target.toFixed(1);
            } else {
                element.textContent = Math.floor(target).toLocaleString();
            }
        }
    }

    requestAnimationFrame(updateNumber);
}

/* ========================================
   후기 섹션 스크롤 애니메이션 및 Tilt 효과
======================================== */
function initTestimonialAnimations() {
    // 스크롤 애니메이션 설정
    const revealElements = document.querySelectorAll('.reveal-on-scroll');

    const scrollObserver = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('reveal-active');
                scrollObserver.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.7,
        rootMargin: '0px'
    });

    revealElements.forEach(el => {
        scrollObserver.observe(el);
    });

    // 3D Tilt 효과 (데스크톱에만 적용)
    if (window.innerWidth > 768) {
        const tiltCards = document.querySelectorAll('.tilt-card');

        tiltCards.forEach(card => {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                const centerX = rect.width / 2;
                const centerY = rect.height / 2;

                const rotateX = ((y - centerY) / centerY) * -5;
                const rotateY = ((x - centerX) / centerX) * 5;

                card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
            });

            card.addEventListener('mouseleave', () => {
                card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
            });
        });
    }
}

/* ========================================
   플로팅 버튼 스크롤 트리거
======================================== */
function initFloatingButton() {
    const floatBtn = document.getElementById('floatBtn');
    const heroSection = document.querySelector('.hero-section');

    if (!floatBtn || !heroSection) {
        console.warn('플로팅 버튼 또는 히어로 섹션을 찾을 수 없습니다.');
        return;
    }

    window.addEventListener('scroll', function() {
        const heroSectionBottom = heroSection.offsetTop + heroSection.offsetHeight;
        const scrollPosition = window.scrollY;

        if (scrollPosition > heroSectionBottom) {
            floatBtn.classList.add('show');
        } else {
            floatBtn.classList.remove('show');
        }
    });
}

/* ========================================
   FAQ 아코디언 토글
======================================== */
function initFAQAccordion() {
    const faqQuestions = document.querySelectorAll('.faq-question');

    faqQuestions.forEach(question => {
        question.addEventListener('click', function() {
            const faqItem = this.parentElement;
            const isActive = faqItem.classList.contains('active');

            // 모든 FAQ 아이템 닫기
            document.querySelectorAll('.faq-item').forEach(item => {
                item.classList.remove('active');
            });

            // 클릭한 아이템이 닫혀있었다면 열기
            if (!isActive) {
                faqItem.classList.add('active');
            }
        });
    });
}






