/* ========================================
   페이지 초기화
======================================== */
document.addEventListener("DOMContentLoaded", function() {
    initCustomCursor();
    loadNavbar();
    loadFooter();
});

/* ========================================
   커스텀 마우스 커서 초기화
======================================== */
function initCustomCursor() {
    if (!document.querySelector('.cursor-dot')) {
        const cursorDot = document.createElement('div');
        cursorDot.className = 'cursor-dot';
        document.body.insertBefore(cursorDot, document.body.firstChild);
    }

    if (!document.querySelector('.cursor-outline')) {
        const cursorOutline = document.createElement('div');
        cursorOutline.className = 'cursor-outline';
        document.body.insertBefore(cursorOutline, document.body.firstChild);
    }
}

/* ========================================
   Navbar 로드 및 초기화
======================================== */
function loadNavbar() {
    // 현재 페이지 확인
    const currentPage = window.location.pathname.split('/').pop();

    // 비로그인용 navbar를 사용할 페이지 목록
    const landingPages = ['login.html', 'aboutus.html', 'globals.html', 'program.html'];
    const useLandingNavbar = landingPages.includes(currentPage);

    const navbarFile = useLandingNavbar ? 'layouts/navbar-landing.html' : 'layouts/navbar.html';

    fetch(navbarFile)
        .then(response => response.text())
        .then(data => {
            document.getElementById("navbar-placeholder").innerHTML = data;

            // utils.js의 공통 함수 사용
            if (typeof initNavbarScrollEffect === 'function') {
                initNavbarScrollEffect();
            }

            // landing navbar가 아닐 때만 navbar.js 로드
            if (!useLandingNavbar) {
                loadScript('js/navbar.js', function() {
                    if (typeof initNavbar === 'function') {
                        initNavbar();
                    }
                });
            }
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
        });
}

/* ========================================
   외부 스크립트 로드 헬퍼 함수
======================================== */
function loadScript(url, callback) {
    const script = document.createElement('script');
    script.src = url;
    script.onload = callback;
    document.head.appendChild(script);
}
