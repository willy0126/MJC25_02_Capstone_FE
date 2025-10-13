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
    fetch('layouts/navbar.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById("navbar-placeholder").innerHTML = data;

            window.addEventListener('scroll', function() {
                const navbar = document.querySelector('.navbar');
                if (window.scrollY > 50) {
                    navbar.classList.add('scrolled');
                } else {
                    navbar.classList.remove('scrolled');
                }
            });

            loadScript('js/navbar.js', function() {
                if (typeof initNavbar === 'function') {
                    initNavbar();
                }
            });
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
