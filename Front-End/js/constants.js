/**
 * 애플리케이션 전역 상수 정의
 * Magic numbers, 설정값, 메시지 등을 중앙에서 관리
 */

/* ========================================
   애니메이션 설정
======================================== */
const ANIMATION_CONFIG = {
    // 캐러셀 설정
    CAROUSEL: {
        AUTO_ROTATE_INTERVAL: 4000, // 자동 회전 간격 (ms)
        TRANSITION_DURATION: 600    // 전환 애니메이션 시간 (ms)
    },

    // 카운터 애니메이션
    COUNTER: {
        DURATION: 2000,              // 카운팅 애니메이션 시간 (ms)
        EASING: 'cubic'              // 이징 함수 타입
    },

    // IntersectionObserver 임계값
    THRESHOLD: {
        SMALL_ELEMENTS: [0, 0.25, 0.5, 0.75, 0.99, 1.0],
        LARGE_SECTIONS: [0, 0.25, 0.5, 0.75, 0.8, 1.0],
        STANDARD: 0.25
    },

    // 패럴랙스 효과
    PARALLAX: {
        FACTOR: 0.7,                 // 패럴랙스 이동 배율
        BLUR_MULTIPLIER: 2           // 블러 효과 배율
    }
};

/* ========================================
   UI 상호작용 설정
======================================== */
const UI_CONFIG = {
    // 스크롤
    NAVBAR_SCROLL_THRESHOLD: 50,    // 네비바 스타일 변경 스크롤 위치 (px)

    // 커서
    CURSOR: {
        FOLLOW_SPEED: 0.25,          // 커서 따라오기 속도 (0-1, 낮을수록 빠름)
        HOVER_SELECTORS: [           // 호버 효과 적용 대상
            'a',
            'button',
            '.feature-card',
            '.nav-item',
            '.login-btn'
        ]
    },

    // 디바운스/쓰로틀
    DEBOUNCE_DELAY: 300,             // 디바운스 기본 지연 (ms)
    THROTTLE_LIMIT: 100              // 쓰로틀 기본 제한 (ms)
};

/* ========================================
   API 설정
======================================== */
const API_CONFIG = {
    // 타임아웃
    REQUEST_TIMEOUT: 10000,          // API 요청 타임아웃 (ms)

    // 재시도
    MAX_RETRIES: 3,                  // 최대 재시도 횟수
    RETRY_DELAY: 1000                // 재시도 간격 (ms)
};

/* ========================================
   페이지네이션 설정
======================================== */
const PAGINATION_CONFIG = {
    ITEMS_PER_PAGE: 10,              // 페이지당 항목 수
    MAX_PAGE_BUTTONS: 5              // 최대 페이지 버튼 수
};

/* ========================================
   폼 검증 규칙
======================================== */
const VALIDATION_RULES = {
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    PASSWORD: /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/,
    PHONE: /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/
};

/* ========================================
   메시지 상수
======================================== */
const MESSAGES = {
    // 인증 관련
    AUTH: {
        EMAIL_REQUIRED: '이메일을 입력해주세요.',
        EMAIL_INVALID: '올바른 이메일 형식을 입력해주세요.',
        PASSWORD_REQUIRED: '비밀번호를 입력해주세요.',
        PASSWORD_INVALID: '비밀번호는 영어, 숫자, 특수문자(@$!%*#?&)를 포함한 8자리 이상이어야 합니다.',
        PASSWORD_MISMATCH: '비밀번호가 일치하지 않습니다.',
        LOGIN_SUCCESS: '님, 환영합니다!',
        LOGIN_FAILED: '로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.',
        LOGOUT_SUCCESS: '로그아웃되었습니다.',
        ADMIN_ONLY: '관리자만 접근할 수 있습니다.'
    },

    // 회원가입 관련
    SIGNUP: {
        REQUIRED_FIELDS: '필수 입력 항목을 모두 입력해주세요.',
        SUCCESS: '회원가입이 완료되었습니다. 로그인 페이지로 이동합니다.',
        FAILED: '회원가입에 실패했습니다. 다시 시도해주세요.',
        EMAIL_VERIFICATION_SENT: '인증번호가 발송되었습니다.',
        EMAIL_VERIFICATION_SUCCESS: '인증이 완료되었습니다.',
        EMAIL_VERIFICATION_REQUIRED: '이메일 인증이 필요합니다.',
        VERIFICATION_CODE_REQUIRED: '인증번호를 입력해주세요.',
        NICKNAME_REQUIRED: '닉네임을 입력해주세요.',
        NICKNAME_AVAILABLE: '사용 가능한 닉네임입니다.'
    },

    // 공지사항 관련
    NOTICE: {
        WRITE_PERMISSION: '관리자만 글을 작성할 수 있습니다.',
        EDIT_PERMISSION: '관리자만 글을 작성/수정할 수 있습니다.',
        REQUIRED_FIELDS: '모든 항목을 입력해주세요.',
        CREATED: '공지사항이 등록되었습니다.',
        UPDATED: '공지사항이 수정되었습니다.',
        DELETED: '공지사항이 삭제되었습니다.',
        DELETE_CONFIRM: '정말 삭제하시겠습니까?'
    },

    // 기능 구현 예정
    COMING_SOON: {
        SOCIAL_LOGIN: '{provider} 소셜 로그인 기능은 추후 구현될 예정입니다.',
        ADD_BOOK: '도서 등록 기능은 추후 구현될 예정입니다.',
        BOOK_DETAIL: '"{title}" 상세 정보는 추후 구현될 예정입니다.',
        ADDRESS_SEARCH: '주소 찾기 기능은 추후 구현 예정입니다.',
        FEATURE: '{feature} 기능은 추후 구현될 예정입니다.'
    },

    // 에러 메시지
    ERROR: {
        NETWORK: '네트워크 연결을 확인해주세요.',
        SERVER: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
        UNKNOWN: '알 수 없는 오류가 발생했습니다.',
        LOAD_FAILED: '{resource} 로드에 실패했습니다.'
    }
};

/* ========================================
   페이지 경로
======================================== */
const ROUTES = {
    LOGIN: 'login.html',
    REGISTER: 'register.html',
    INDEX: 'index.html',
    LANDING: 'landing.html',
    BOOKCASE: 'bookcase.html',
    NOTICE: 'notice.html',
    GLOBALS: 'globals.html',
    ABOUTUS: 'aboutus.html',
    SERVICE: 'service.html',
    PROGRAM: 'program.html'
};

/* ========================================
   localStorage 키
======================================== */
const STORAGE_KEYS = {
    ACCESS_TOKEN: 'accessToken',
    REFRESH_TOKEN: 'refreshToken',
    USER_INFO: 'userInfo',
    RETURN_URL: 'returnUrl',
    NOTICES: 'notices',
    THEME: 'theme',
    LANGUAGE: 'language'
};

/* ========================================
   CSS 클래스명
======================================== */
const CSS_CLASSES = {
    ACTIVE: 'active',
    HIDDEN: 'hidden',
    SCROLLED: 'scrolled',
    LOADING: 'loading',
    ERROR: 'error',
    SUCCESS: 'success',
    DISABLED: 'disabled'
};

/* ========================================
   기본 설정값
======================================== */
const DEFAULTS = {
    THEME_COLOR: '#20B2AA',
    LANGUAGE: 'ko',
    DATE_FORMAT: 'YYYY.MM.DD',
    AVATAR_STYLES: ['avataaars', 'bottts', 'fun-emoji', 'lorelei', 'micah', 'pixel-art']
};

/* ========================================
   독후 활동 - AI 질문 제안 데이터
======================================== */
const AI_QUESTIONS = {
    // 감정 이해 관련 질문
    EMOTION: [
        '주인공이 가장 행복했던 순간은 언제였나요?',
        '책을 읽으면서 어떤 감정이 들었나요?',
        '주인공과 같은 상황이라면 어떤 기분이 들었을까요?',
        '이 이야기에서 가장 슬펐던 부분은 무엇인가요?',
        '주인공이 화가 났던 이유는 무엇이었나요?'
    ],

    // 이야기 이해 관련 질문
    STORY: [
        '이야기의 가장 중요한 사건은 무엇이었나요?',
        '주인공은 왜 그런 선택을 했을까요?',
        '이야기의 결말이 어떻게 달라질 수 있었을까요?',
        '가장 기억에 남는 장면은 무엇인가요?',
        '주인공의 목표는 무엇이었나요?'
    ],

    // 등장인물 관련 질문
    CHARACTER: [
        '가장 좋아하는 등장인물은 누구인가요? 그 이유는?',
        '주인공의 성격을 세 가지로 표현한다면?',
        '친구가 되고 싶은 인물은 누구인가요?',
        '주인공이 배운 교훈은 무엇일까요?',
        '등장인물 중 누구와 가장 비슷한가요?'
    ],

    // 상상력 확장 질문
    IMAGINATION: [
        '이야기가 계속된다면 어떻게 될까요?',
        '내가 주인공이라면 어떻게 했을까요?',
        '이 책의 제목을 다시 짓는다면?',
        '주인공에게 해주고 싶은 말이 있나요?',
        '책 속 세계에 갈 수 있다면 어디에 가고 싶나요?'
    ],

    // 가치관/교훈 관련 질문
    VALUE: [
        '이 책에서 배운 가장 중요한 것은 무엇인가요?',
        '친구들에게 이 책을 추천하고 싶나요? 왜 그런가요?',
        '실생활에서 적용할 수 있는 부분이 있나요?',
        '주인공의 어떤 점을 본받고 싶나요?',
        '이 책을 읽고 생각이 바뀐 것이 있나요?'
    ],

    // 창의적 사고 질문
    CREATIVE: [
        '이야기의 배경을 우리 동네로 바꾼다면?',
        '새로운 등장인물을 추가한다면 누구를 넣고 싶나요?',
        '책 표지를 직접 그린다면 어떻게 그리고 싶나요?',
        '주인공에게 마법 능력을 준다면 무엇을 주고 싶나요?',
        '이 이야기를 영화로 만든다면 어떤 장면이 재미있을까요?'
    ]
};

// 모든 질문을 하나의 배열로 통합
const ALL_AI_QUESTIONS = [
    ...AI_QUESTIONS.EMOTION,
    ...AI_QUESTIONS.STORY,
    ...AI_QUESTIONS.CHARACTER,
    ...AI_QUESTIONS.IMAGINATION,
    ...AI_QUESTIONS.VALUE,
    ...AI_QUESTIONS.CREATIVE
];

/* ========================================
   내보내기
======================================== */
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        ANIMATION_CONFIG,
        UI_CONFIG,
        API_CONFIG,
        PAGINATION_CONFIG,
        VALIDATION_RULES,
        MESSAGES,
        ROUTES,
        STORAGE_KEYS,
        CSS_CLASSES,
        DEFAULTS
    };
}
