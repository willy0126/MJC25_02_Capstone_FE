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
   IntersectionObserver 유틸리티
======================================== */
/**
 * 스크롤 애니메이션을 위한 IntersectionObserver 생성
 * @param {string} selector - 관찰할 요소의 CSS 선택자
 * @param {Object} options - 옵저버 옵션
 * @param {number|number[]} options.threshold - 가시성 임계값 (기본값: 0.25)
 * @param {Function} options.callback - 커스텀 콜백 함수 (없으면 'active' 클래스 추가)
 * @param {boolean} options.once - 한 번만 실행할지 여부 (기본값: true)
 * @returns {IntersectionObserver} 생성된 옵저버 인스턴스
 */
function createScrollObserver(selector, options = {}) {
    const {
        threshold = 0.25,
        callback = null,
        once = true
    } = options;

    const observerOptions = {
        threshold: threshold,
        rootMargin: '0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                if (callback) {
                    callback(entry);
                } else {
                    entry.target.classList.add('active');
                }

                if (once) {
                    observer.unobserve(entry.target);
                }
            }
        });
    }, observerOptions);

    // 선택자에 해당하는 모든 요소 관찰
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => observer.observe(el));

    return observer;
}

/**
 * 여러 선택자에 대해 스크롤 옵저버 일괄 적용
 * @param {Array} configs - [{selector, threshold, callback}] 형태의 설정 배열
 * @returns {IntersectionObserver[]} 생성된 옵저버 배열
 */
function createMultipleScrollObservers(configs) {
    return configs.map(config =>
        createScrollObserver(config.selector, {
            threshold: config.threshold,
            callback: config.callback,
            once: config.once !== undefined ? config.once : true
        })
    );
}

/* ========================================
   DOM 유틸리티
======================================== */
/**
 * 안전한 querySelector - 요소가 없을 경우 경고 로그
 * @param {string} selector - CSS 선택자
 * @param {Element} parent - 부모 요소 (기본값: document)
 * @returns {Element|null} 찾은 요소 또는 null
 */
function safeQuerySelector(selector, parent = document) {
    const element = parent.querySelector(selector);
    if (!element && window.__DEBUG__) {
        console.warn(`Element not found: ${selector}`);
    }
    return element;
}

/**
 * 안전한 querySelectorAll - 빈 배열 반환 보장
 * @param {string} selector - CSS 선택자
 * @param {Element} parent - 부모 요소 (기본값: document)
 * @returns {Element[]} 찾은 요소들의 배열
 */
function safeQuerySelectorAll(selector, parent = document) {
    return Array.from(parent.querySelectorAll(selector));
}

/**
 * 요소에서 텍스트 안전하게 가져오기
 * @param {Element} element - 대상 요소
 * @param {string} defaultValue - 요소가 없을 경우 기본값
 * @returns {string} 텍스트 내용
 */
function safeGetTextContent(element, defaultValue = '') {
    return element ? element.textContent.trim() : defaultValue;
}

/* ========================================
   이벤트 유틸리티
======================================== */
/**
 * 디바운스 함수 - 연속된 이벤트를 지연 실행
 * @param {Function} func - 실행할 함수
 * @param {number} delay - 지연 시간 (ms)
 * @returns {Function} 디바운스된 함수
 */
function debounce(func, delay = 300) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

/**
 * 쓰로틀 함수 - 일정 시간마다 한 번만 실행
 * @param {Function} func - 실행할 함수
 * @param {number} limit - 최소 실행 간격 (ms)
 * @returns {Function} 쓰로틀된 함수
 */
function throttle(func, limit = 100) {
    let inThrottle;
    return function (...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/* ========================================
   애니메이션 유틸리티
======================================== */
/**
 * Promise 기반 delay 함수
 * @param {number} ms - 지연 시간 (밀리초)
 * @returns {Promise} 지연 후 resolve되는 Promise
 */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 요소의 가시성 상태 확인
 * @param {Element} element - 확인할 요소
 * @returns {boolean} 화면에 보이는지 여부
 */
function isElementVisible(element) {
    const rect = element.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
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
        createScrollObserver,
        createMultipleScrollObservers,
        safeQuerySelector,
        safeQuerySelectorAll,
        safeGetTextContent,
        debounce,
        throttle,
        delay,
        isElementVisible
    };
}
