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

/**
 * SVG 문자열 Sanitization (XSS 방지)
 * 위험한 요소와 속성을 제거하여 안전한 SVG 반환
 * @param {string} svgString - sanitize할 SVG 문자열
 * @returns {string} 안전하게 처리된 SVG 문자열
 */
function sanitizeSVG(svgString) {
    if (!svgString || typeof svgString !== 'string') return '';

    // DOMParser로 SVG 파싱
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgString, 'image/svg+xml');

    // 파싱 에러 확인
    const parserError = doc.querySelector('parsererror');
    if (parserError) {
        console.warn('SVG 파싱 실패:', parserError.textContent);
        return '';
    }

    const svg = doc.documentElement;
    if (svg.tagName.toLowerCase() !== 'svg') {
        console.warn('유효하지 않은 SVG');
        return '';
    }

    // 위험한 요소 제거
    const dangerousTags = ['script', 'foreignObject', 'iframe', 'object', 'embed'];
    dangerousTags.forEach(tag => {
        const elements = svg.querySelectorAll(tag);
        elements.forEach(el => el.remove());
    });

    // <use> 태그: 외부 URL 참조만 제거 (내부 참조 #id는 허용)
    svg.querySelectorAll('use').forEach(el => {
        const href = el.getAttribute('href') || el.getAttribute('xlink:href') || '';
        // 외부 URL이거나 javascript:/data: 프로토콜이면 제거
        if (href && !href.startsWith('#')) {
            el.remove();
        }
    });

    // 모든 요소에서 위험한 속성 제거
    const allElements = svg.querySelectorAll('*');
    allElements.forEach(el => {
        // on* 이벤트 핸들러 속성 제거
        const attrs = [...el.attributes];
        attrs.forEach(attr => {
            const name = attr.name.toLowerCase();
            const value = attr.value.toLowerCase();

            // 이벤트 핸들러 제거 (onclick, onload, onerror 등)
            if (name.startsWith('on')) {
                el.removeAttribute(attr.name);
            }
            // javascript: URL 제거
            else if (value.includes('javascript:') || value.includes('data:text/html')) {
                el.removeAttribute(attr.name);
            }
            // xlink:href에서 위험한 URL 제거
            else if ((name === 'href' || name === 'xlink:href') &&
                     (value.startsWith('javascript:') || value.startsWith('data:'))) {
                el.removeAttribute(attr.name);
            }
        });
    });

    // SVG 요소 자체의 속성도 검사
    const svgAttrs = [...svg.attributes];
    svgAttrs.forEach(attr => {
        if (attr.name.toLowerCase().startsWith('on')) {
            svg.removeAttribute(attr.name);
        }
    });

    return svg.outerHTML;
}

/* ========================================
   네트워크 상태 감지
======================================== */
/**
 * 현재 네트워크 연결 상태
 */
let isOnline = navigator.onLine;

/**
 * 온라인 상태 확인
 * @returns {boolean} 온라인 여부
 */
function checkOnline() {
    return navigator.onLine;
}

/**
 * 네트워크 상태 변경 이벤트 초기화
 * 오프라인/온라인 전환 시 사용자에게 알림
 */
function initNetworkStatus() {
    // 온라인 전환 시
    window.addEventListener('online', () => {
        isOnline = true;
        if (typeof showToast === 'function') {
            showToast('인터넷 연결이 복구되었습니다.', 'success');
        }
        // 커스텀 이벤트 발생
        window.dispatchEvent(new CustomEvent('networkStatusChanged', {
            detail: { online: true }
        }));
    });

    // 오프라인 전환 시
    window.addEventListener('offline', () => {
        isOnline = false;
        if (typeof showToast === 'function') {
            showToast('인터넷 연결이 끊어졌습니다. 일부 기능이 제한될 수 있습니다.', 'warning');
        }
        // 커스텀 이벤트 발생
        window.dispatchEvent(new CustomEvent('networkStatusChanged', {
            detail: { online: false }
        }));
    });

    // 초기 상태 로깅
    logger.log('네트워크 상태 감지 초기화 완료. 현재 상태:', navigator.onLine ? '온라인' : '오프라인');
}

// 페이지 로드 시 자동 초기화
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', initNetworkStatus);
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
        escapeHtml,
        checkOnline,
        initNetworkStatus
    };
}
