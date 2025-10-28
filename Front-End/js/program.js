/* ===================================
   프로그램 페이지 JavaScript
   =================================== */

// DOM이 완전히 로드된 후 실행
document.addEventListener('DOMContentLoaded', () => {
    // Step 카드 스크롤 애니메이션 초기화
    initStepCardsAnimation();
});

/* ===================================
   Step 카드 스크롤 애니메이션
   =================================== */
/**
 * 각 step-card가 뷰포트에 100% 진입했을 때
 * active 클래스를 추가하여 페이드인 애니메이션 실행
 */
function initStepCardsAnimation() {
    const stepCards = document.querySelectorAll('.step-card');

    // Intersection Observer 옵션 설정
    const observerOptions = {
        threshold: 1.0,        // 요소가 100% 보일 때 콜백 실행
        rootMargin: '0px'      // 뷰포트 마진 없음
    };

    // Intersection Observer 생성
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            // 카드가 뷰포트에 완전히 진입했을 때
            if (entry.isIntersecting) {
                // active 클래스 추가 (CSS 애니메이션 트리거)
                entry.target.classList.add('active');

                // 한 번 애니메이션이 실행되면 더 이상 관찰하지 않음 (성능 최적화)
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // 모든 step-card 요소 관찰 시작
    stepCards.forEach(card => {
        observer.observe(card);
    });
}
