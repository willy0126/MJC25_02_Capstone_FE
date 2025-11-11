/* ========================================
   Navbar 초기화
======================================== */
function initNavbar() {
    if (typeof isLoggedIn !== 'function') {
        setTimeout(initNavbar, 100);
        return;
    }

    updateNavbarLoginState();
    updateNavbarLogoLink();
    initUserMenu();
    initLogoutButton();

    window.addEventListener('loginStateChanged', function() {
        updateNavbarLoginState();
        updateNavbarLogoLink();
    });
}

/* ========================================
   로그인 상태에 따른 Navbar 로고 링크 업데이트
======================================== */
function updateNavbarLogoLink() {
    const logoLink = document.getElementById('nav-logo-link');

    if (!logoLink) return;

    if (typeof isLoggedIn === 'function' && isLoggedIn()) {
        // 로그인 상태: index.html로 이동
        logoLink.href = 'index.html';
    } else {
        // 비로그인 상태: landing.html로 이동
        logoLink.href = 'landing.html';
    }
}

/* ========================================
   로그인 상태에 따른 Navbar 업데이트
======================================== */
function updateNavbarLoginState() {
    const loginBtn = document.getElementById('login-btn');
    const userMenu = document.getElementById('user-menu');
    const userName = document.getElementById('user-name');

    if (!loginBtn || !userMenu) return;

    if (typeof isLoggedIn === 'function' && isLoggedIn()) {
        loginBtn.style.display = 'none';
        userMenu.style.display = 'flex';

        if (typeof getCurrentUser === 'function') {
            const user = getCurrentUser();
            if (user && user.name && userName) {
                userName.textContent = user.name;
            }
        }
    } else {
        loginBtn.style.display = 'block';
        userMenu.style.display = 'none';
    }
}

/* ========================================
   사용자 메뉴 드롭다운 초기화
======================================== */
function initUserMenu() {
    const userButton = document.getElementById('user-button');
    const userDropdown = document.getElementById('user-dropdown');

    if (!userButton || !userDropdown) return;

    userButton.addEventListener('click', function(e) {
        e.stopPropagation();
        userDropdown.classList.toggle('show');
    });

    document.addEventListener('click', function(e) {
        if (!userButton.contains(e.target) && !userDropdown.contains(e.target)) {
            userDropdown.classList.remove('show');
        }
    });

    const dropdownLinks = userDropdown.querySelectorAll('a:not(#logout-btn)');
    dropdownLinks.forEach(link => {
        link.addEventListener('click', function() {
            userDropdown.classList.remove('show');
        });
    });
}

/* ========================================
   로그아웃 버튼 초기화
======================================== */
function initLogoutButton() {
    const logoutBtn = document.getElementById('logout-btn');

    if (!logoutBtn) return;

    logoutBtn.addEventListener('click', function(e) {
        e.preventDefault();

        if (confirm('로그아웃 하시겠습니까?')) {
            if (typeof clearLoginState === 'function') {
                clearLoginState();
            }

            const userDropdown = document.getElementById('user-dropdown');
            if (userDropdown) {
                userDropdown.classList.remove('show');
            }

            // 현재 페이지 확인
            const currentPage = window.location.pathname.split('/').pop();

            // index.html에서 로그아웃하면 landing.html로 리다이렉트
            if (currentPage === 'index.html' || currentPage === '') {
                window.location.href = 'landing.html';
            } else {
                // 다른 페이지에서는 기존처럼 index.html로 이동
                window.location.href = 'index.html';
            }
        }
    });
}
