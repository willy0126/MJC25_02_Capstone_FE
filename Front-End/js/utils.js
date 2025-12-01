/**
 * 공통 유틸리티 함수 모음
 * 코드 중복을 제거하고 재사용성을 높이기 위한 유틸리티 함수들
 */

/* ========================================
   디버그 모드 설정
======================================== */
/**
 * 디버그 모드 플래그
 * true: 콘솔 로그 출력 (개발 환경)
 * false: 콘솔 로그 비활성화 (프로덕션 환경)
 */
const DEBUG_MODE = false;

/**
 * 디버그 로깅 유틸리티
 * DEBUG_MODE가 true일 때만 콘솔에 출력
 */
const logger = {
    log: (...args) => DEBUG_MODE && console.log(...args),
    info: (...args) => DEBUG_MODE && console.info(...args),
    warn: (...args) => DEBUG_MODE && console.warn(...args),
    error: (...args) => console.error(...args), // 에러는 항상 출력
    debug: (...args) => DEBUG_MODE && console.debug(...args),
    table: (...args) => DEBUG_MODE && console.table(...args),
    group: (label) => DEBUG_MODE && console.group(label),
    groupEnd: () => DEBUG_MODE && console.groupEnd(),
    time: (label) => DEBUG_MODE && console.time(label),
    timeEnd: (label) => DEBUG_MODE && console.timeEnd(label)
};

// 전역으로 사용할 수 있도록 window 객체에 할당
window.DEBUG_MODE = DEBUG_MODE;
window.logger = logger;

/* ========================================
   네비게이션바 스크롤 효과
======================================== */
/**
 * 스크롤 시 네비게이션바 스타일 변경 초기화
 * 페이지를 50px 이상 스크롤하면 'scrolled' 클래스 추가
 */
function initNavbarScrollEffect() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;

    function updateNavbarStyle() {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    }

    window.addEventListener('scroll', updateNavbarStyle);
    updateNavbarStyle(); // 초기 상태 설정
}

/* ========================================
   부드러운 스크롤 링크
======================================== */
/**
 * 페이지 내 앵커 링크에 부드러운 스크롤 효과 적용
 * href가 #으로 시작하는 모든 링크에 적용
 */
function initSmoothScrollLinks() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();

            const targetId = this.getAttribute('href');
            const target = document.querySelector(targetId);

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
   보안 유틸리티
======================================== */
/**
 * HTML 특수문자 이스케이프 (XSS 방지)
 * @param {string} text - 이스케이프할 텍스트
 * @returns {string} 이스케이프된 텍스트
 */
function escapeHtml(text) {
    if (text == null) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/* ========================================
   내보내기 (모듈이 아닌 경우 전역으로)
======================================== */
// ES6 모듈이 아닌 환경을 위해 전역 객체에 할당
if (typeof module !== 'undefined' && module.exports) {
    // Node.js 환경
    module.exports = {
        initNavbarScrollEffect,
        initSmoothScrollLinks,
        escapeHtml
    };
}
