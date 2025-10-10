/* ===================================
   커스텀 마우스 커서 (전역)
   =================================== */

let mouseX = 0;
let mouseY = 0;
let outlineX = 0;
let outlineY = 0;
let cursorDot = null;
let cursorOutline = null;
let isInitialized = false;

// 커스텀 마우스 커서 초기화
function initCursor() {
  // 이미 초기화되었으면 리턴
  if (isInitialized) return;

  cursorDot = document.querySelector('.cursor-dot');
  cursorOutline = document.querySelector('.cursor-outline');

  // 커서 요소가 없으면 대기 후 재시도
  if (!cursorDot || !cursorOutline) {
    setTimeout(initCursor, 50);
    return;
  }

  isInitialized = true;

  // 마우스 위치 추적
  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    // 점은 즉시 따라감
    if (cursorDot) {
      cursorDot.style.left = `${mouseX}px`;
      cursorDot.style.top = `${mouseY}px`;
    }
  });

  // requestAnimationFrame을 사용한 부드러운 외곽선 애니메이션
  function animateCursorOutline() {
    // 지연 효과 (0.15의 속도로 따라감)
    const speed = 0.15;
    outlineX += (mouseX - outlineX) * speed;
    outlineY += (mouseY - outlineY) * speed;

    if (cursorOutline) {
      cursorOutline.style.left = `${outlineX}px`;
      cursorOutline.style.top = `${outlineY}px`;
    }

    requestAnimationFrame(animateCursorOutline);
  }

  // 애니메이션 시작
  animateCursorOutline();

  // 호버 효과 초기화
  initCursorHoverEffects();
}

// 호버 가능한 요소들에 hover 클래스 추가
function initCursorHoverEffects() {
  const hoverTargets = document.querySelectorAll('a, button, .feature-card, .testimonial-card, .nav-item, .login-btn');

  hoverTargets.forEach(target => {
    target.addEventListener('mouseenter', () => {
      if (cursorOutline) {
        cursorOutline.classList.add('cursor-hover');
      }
    });

    target.addEventListener('mouseleave', () => {
      if (cursorOutline) {
        cursorOutline.classList.remove('cursor-hover');
      }
    });
  });
}

// navbar와 footer가 동적으로 로드되는 경우를 위한 MutationObserver
const observer = new MutationObserver(() => {
  initCursorHoverEffects();
});

// DOM 로드 후 초기화
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initCursor();
    // body의 자식 요소 변화 감지
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  });
} else {
  initCursor();
  // body의 자식 요소 변화 감지
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}
