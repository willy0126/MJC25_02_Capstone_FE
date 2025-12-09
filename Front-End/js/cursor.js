/* ===================================
   커스텀 마우스 커서 (전역)
   리팩토링: 메모리 누수 수정, 성능 최적화
   =================================== */

// 커서 관리 객체 (전역 스코프 오염 방지)
const CursorManager = {
    state: {
        mouseX: 0,
        mouseY: 0,
        outlineX: 0,
        outlineY: 0,
        cursorDot: null,
        cursorOutline: null,
        isInitialized: false,
        firstMove: false,
        animationId: null,
        observer: null,
        mouseMoveHandler: null
    },

    // 설정값 (constants.js에서 가져오기, 없으면 기본값)
    get config() {
        return typeof UI_CONFIG !== 'undefined' && UI_CONFIG.CURSOR
            ? UI_CONFIG.CURSOR
            : {
                FOLLOW_SPEED: 0.25,
                HOVER_SELECTORS: ['a', 'button', '.feature-card', '.nav-item', '.login-btn']
            };
    },

    /**
     * 커서 초기화
     */
    init() {
        // 이미 초기화되었으면 cleanup 후 재시작
        if (this.state.isInitialized) {
            this.cleanup();
        }

        // 커서 요소 가져오기
        this.state.cursorDot = document.querySelector('.cursor-dot');
        this.state.cursorOutline = document.querySelector('.cursor-outline');

        // 커서 요소가 없으면 대기 후 재시도
        if (!this.state.cursorDot || !this.state.cursorOutline) {
            setTimeout(() => this.init(), 50);
            return;
        }

        this.state.isInitialized = true;
        this.state.firstMove = false;

        // 초기 위치를 화면 밖으로 설정 (첫 마우스 이동 전까지 숨김)
        this.state.mouseX = -100;
        this.state.mouseY = -100;
        this.state.outlineX = -100;
        this.state.outlineY = -100;

        // 초기에는 커서를 숨김
        this.state.cursorDot.style.opacity = '0';
        this.state.cursorOutline.style.opacity = '0';

        // 이벤트 리스너 등록
        this.attachEventListeners();

        // 애니메이션 시작
        this.startAnimation();

        // MutationObserver 시작
        this.startObserver();

        // 페이지 로드 후 즉시 마우스 위치 감지
        this.detectInitialMousePosition();

        // 페이지 언로드 시 정리
        window.addEventListener('beforeunload', () => this.cleanup(), { once: true });
    },

    /**
     * 페이지 로드 후 마우스 위치 즉시 감지
     */
    detectInitialMousePosition() {
        const detectMouse = (e) => {
            this.state.mouseX = e.clientX;
            this.state.mouseY = e.clientY;
            this.state.outlineX = e.clientX;
            this.state.outlineY = e.clientY;

            // 첫 마우스 감지 후 리스너 제거
            document.removeEventListener('mousemove', detectMouse);
        };

        // 일회성 마우스 감지
        document.addEventListener('mousemove', detectMouse, { once: true });
    },

    /**
     * 이벤트 리스너 등록
     */
    attachEventListeners() {
        // 기존 이벤트 리스너 제거 (중복 방지)
        if (this.state.mouseMoveHandler) {
            window.removeEventListener('mousemove', this.state.mouseMoveHandler);
        }

        // 마우스 위치 추적
        this.state.mouseMoveHandler = (e) => {
            // 첫 마우스 이동 시 커서를 표시
            if (!this.state.firstMove) {
                this.state.firstMove = true;
            }
            if (this.state.cursorDot) this.state.cursorDot.style.opacity = '1';
            if (this.state.cursorOutline) this.state.cursorOutline.style.opacity = '1';

            this.state.mouseX = e.clientX;
            this.state.mouseY = e.clientY;

            // 점은 즉시 따라감 (transform 사용, -50% 오프셋 적용)
            if (this.state.cursorDot) {
                this.state.cursorDot.style.transform = `translate(calc(${this.state.mouseX}px - 50%), calc(${this.state.mouseY}px - 50%))`;
            }
        };

        window.addEventListener('mousemove', this.state.mouseMoveHandler);

        // 호버 효과 (이벤트 위임 사용)
        this.attachHoverEffects();
    },

    /**
     * 호버 효과 등록 (이벤트 위임으로 성능 개선)
     */
    attachHoverEffects() {
        const selectorString = this.config.HOVER_SELECTORS.join(', ');

        document.addEventListener('mouseenter', (e) => {
            // Element 타입인지 확인 후 closest 호출
            if (e.target instanceof Element) {
                const target = e.target.closest(selectorString);
                if (target && this.state.cursorOutline) {
                    this.state.cursorOutline.classList.add('cursor-hover');
                }
            }
        }, true); // 캡처 단계에서 실행

        document.addEventListener('mouseleave', (e) => {
            // Element 타입인지 확인 후 closest 호출
            if (e.target instanceof Element) {
                const target = e.target.closest(selectorString);
                if (target && this.state.cursorOutline) {
                    this.state.cursorOutline.classList.remove('cursor-hover');
                }
            }
        }, true);
    },

    /**
     * 커서 외곽선 애니메이션
     */
    animateCursorOutline() {
        // 애니메이션이 중지되었으면 리턴
        if (!this.state.isInitialized || !this.state.cursorOutline) {
            return;
        }

        // 지연 효과
        const speed = this.config.FOLLOW_SPEED;
        this.state.outlineX += (this.state.mouseX - this.state.outlineX) * speed;
        this.state.outlineY += (this.state.mouseY - this.state.outlineY) * speed;

        // transform 사용 (성능 최적화, -50% 오프셋 적용)
        // 호버 효과가 있으면 scale 추가
        const scale = this.state.cursorOutline.classList.contains('cursor-hover') ? 'scale(1.125)' : '';
        this.state.cursorOutline.style.transform = `translate(calc(${this.state.outlineX}px - 50%), calc(${this.state.outlineY}px - 50%)) ${scale}`;

        // 다음 프레임 요청
        this.state.animationId = requestAnimationFrame(() => this.animateCursorOutline());
    },

    /**
     * 애니메이션 시작
     */
    startAnimation() {
        // 이미 실행 중이면 중지
        this.stopAnimation();

        // 새로운 애니메이션 시작
        this.state.animationId = requestAnimationFrame(() => this.animateCursorOutline());
    },

    /**
     * 애니메이션 중지
     */
    stopAnimation() {
        if (this.state.animationId) {
            cancelAnimationFrame(this.state.animationId);
            this.state.animationId = null;
        }
    },

    /**
     * MutationObserver 시작 (동적으로 추가되는 요소 감지)
     */
    startObserver() {
        // 기존 observer가 있으면 연결 해제
        if (this.state.observer) {
            this.state.observer.disconnect();
        }

        // 새 observer 생성
        this.state.observer = new MutationObserver(() => {
            // 호버 효과는 이벤트 위임으로 처리하므로
            // 여기서는 특별히 할 일이 없음
            // 필요시 추가 로직 구현
        });

        // body의 자식 요소 변화 감지
        this.state.observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    },

    /**
     * 리소스 정리 (메모리 누수 방지)
     */
    cleanup() {
        // 애니메이션 중지
        this.stopAnimation();

        // 이벤트 리스너 제거
        if (this.state.mouseMoveHandler) {
            window.removeEventListener('mousemove', this.state.mouseMoveHandler);
            this.state.mouseMoveHandler = null;
        }

        // MutationObserver 연결 해제
        if (this.state.observer) {
            this.state.observer.disconnect();
            this.state.observer = null;
        }

        // 커서 숨기기
        if (this.state.cursorDot) {
            this.state.cursorDot.style.opacity = '0';
        }
        if (this.state.cursorOutline) {
            this.state.cursorOutline.style.opacity = '0';
        }

        // 상태 완전 초기화
        this.state.isInitialized = false;
        this.state.firstMove = false;
        this.state.mouseX = -100;
        this.state.mouseY = -100;
        this.state.outlineX = -100;
        this.state.outlineY = -100;
    }
};

// DOM 로드 후 초기화
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => CursorManager.init());
} else {
    CursorManager.init();
}

// 뒤로가기/앞으로가기 시 재초기화 (bfcache 대응)
window.addEventListener('pageshow', (event) => {
    // bfcache에서 복원된 경우
    if (event.persisted) {
        console.log('페이지가 bfcache에서 복원됨 - 커서 재초기화');
        // 강제로 cleanup 후 재초기화
        CursorManager.state.isInitialized = false;
        CursorManager.init();
    }
});
