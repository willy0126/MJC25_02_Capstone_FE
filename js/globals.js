/* ========================================
   페이지 초기화
======================================== */
document.addEventListener('DOMContentLoaded', function() {
    initContinentSelection();
    setupContentArea();
    initSmoothScroll();
});

/* ========================================
   컨텐츠 영역 초기 설정
======================================== */
function setupContentArea() {
    const contentArea = document.getElementById('continent-content');
    contentArea.style.transition = 'all 0.6s ease';
}

/* ========================================
   대륙 선택 카드 초기화
======================================== */
function initContinentSelection() {
    const continentCards = document.querySelectorAll('.continent-card');
    const contentArea = document.getElementById('continent-content');

    continentCards.forEach(card => {
        card.addEventListener('click', function() {
            const continent = this.getAttribute('data-continent');

            continentCards.forEach(c => c.classList.remove('active'));
            this.classList.add('active');

            loadContinentContent(continent, contentArea);
        });
    });
}

/* ========================================
   대륙 컨텐츠 로드 및 애니메이션
======================================== */
function loadContinentContent(continent, contentArea) {
    const contentTemplate = document.querySelector(`#content-templates #${continent}-content`);

    if (!contentTemplate) {
        console.error(`Content not found for continent: ${continent}`);
        return;
    }

    contentArea.style.opacity = '0';
    contentArea.style.transform = 'translateY(20px)';

    setTimeout(() => {
        const newContent = contentTemplate.cloneNode(true);
        newContent.style.display = 'block';
        newContent.removeAttribute('id');

        contentArea.innerHTML = '';
        contentArea.appendChild(newContent);

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                contentArea.style.opacity = '1';
                contentArea.style.transform = 'translateY(0)';
            });
        });

        setTimeout(() => {
            contentArea.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest'
            });
        }, 200);

        setTimeout(() => {
            applyCountryCardAnimations();
        }, 100);
    }, 300);
}

/* ========================================
   국가 카드 애니메이션 적용
======================================== */
function applyCountryCardAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    const countryCards = document.querySelectorAll('.continent-content .country-card');

    countryCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = `all 0.6s ease ${index * 0.1}s`;
        observer.observe(card);
    });
}

/* ========================================
   부드러운 스크롤 초기화
======================================== */
function initSmoothScroll() {
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
