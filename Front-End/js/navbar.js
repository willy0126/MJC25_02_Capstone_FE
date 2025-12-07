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
    const userIcon = document.querySelector('.user-icon');

    if (!loginBtn || !userMenu) return;

    if (typeof isLoggedIn === 'function' && isLoggedIn()) {
        loginBtn.style.display = 'none';
        userMenu.style.display = 'flex';

        if (typeof getCurrentUser === 'function') {
            const user = getCurrentUser();
            if (user) {
                // nickname이 있으면 nickname, 없으면 username 표시
                if (userName) {
                    const displayName = user.nickname || user.username || '사용자';
                    userName.textContent = displayName;
                }

                // 사용자 아바타 표시
                if (userIcon && user.profileImg) {
                    // SVG 코드인 경우
                    if (user.profileImg.includes('<svg')) {
                        // SVG sanitize 후 삽입 (XSS 방지)
                        const safeSVG = sanitizeSVG(user.profileImg);
                        if (safeSVG) {
                            userIcon.innerHTML = safeSVG;
                            // SVG 크기 조정
                            const svgElement = userIcon.querySelector('svg');
                            if (svgElement) {
                                svgElement.style.width = '24px';
                                svgElement.style.height = '24px';
                                svgElement.style.display = 'block';
                            }
                        }
                    } else {
                        // 이모지인 경우
                        userIcon.textContent = user.profileImg;
                    }
                }
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

    logoutBtn.addEventListener('click', async function(e) {
        e.preventDefault();

        // 커스텀 확인 모달 사용
        const confirmed = await showConfirm('로그아웃 하시겠습니까?', '확인', '취소', '책·이음');

        if (confirmed) {
            if (typeof clearLoginState === 'function') {
                await clearLoginState();
            }

            const userDropdown = document.getElementById('user-dropdown');
            if (userDropdown) {
                userDropdown.classList.remove('show');
            }

            // 로그아웃 시 항상 landing.html로 이동
            window.location.href = 'landing.html';
        }
    });
}
