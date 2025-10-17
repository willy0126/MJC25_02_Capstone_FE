"use strict";

/* ===================================
   카드 슬라이더 관련 변수
   =================================== */
let next, prev, autoToggle;
let autoRotateInterval;
let isAutoRotating = true;

// 다음 슬라이드로 이동하는 함수
function moveToNext() {
  let items = document.querySelectorAll(".item");
  let slide = document.querySelector(".slide");
  if (slide && items.length > 0) {
    slide.appendChild(items[0]);
  }
}

// 이전 슬라이드로 이동하는 함수
function moveToPrev() {
  let items = document.querySelectorAll(".item");
  let slide = document.querySelector(".slide");
  if (slide && items.length > 0) {
    slide.prepend(items[items.length - 1]);
  }
}

// 자동 로테이션 시작
function startAutoRotate() {
  autoRotateInterval = setInterval(moveToNext, 4000);
}

// 자동 로테이션 중지
function stopAutoRotate() {
  clearInterval(autoRotateInterval);
}

// 자동 로테이션 재시작
function resetAutoRotate() {
  stopAutoRotate();
  startAutoRotate();
}

// 슬라이더 초기화 함수
function initSlider() {
  next = document.querySelector(".next");
  prev = document.querySelector(".prev");
  autoToggle = document.querySelector(".auto-toggle");

  if (!next || !prev || !autoToggle) {
    console.warn('⚠️ 슬라이더 요소를 찾을 수 없습니다.');
    return;
  }

  // Next 버튼 클릭
  next.addEventListener("click", function () {
    moveToNext();
    resetAutoRotate();
  });

  // Prev 버튼 클릭
  prev.addEventListener("click", function () {
    moveToPrev();
    resetAutoRotate();
  });

  // 미리보기 카드 클릭 이벤트
  const slide = document.querySelector(".slide");
  if (slide) {
    slide.addEventListener("click", function (e) {
      let clickedItem = e.target.closest(".item");
      if (!clickedItem) return;

      let items = document.querySelectorAll(".item");
      let clickedIndex = Array.from(items).indexOf(clickedItem);

      // 첫 번째나 두 번째 카드(현재 표시 중인 카드)를 클릭한 경우 무시
      if (clickedIndex === 0 || clickedIndex === 1) return;

      // 클릭한 카드를 두 번째 위치로 이동
      while (clickedIndex > 1) {
        moveToNext();
        items = document.querySelectorAll(".item");
        clickedIndex = Array.from(items).indexOf(clickedItem);
      }

      resetAutoRotate();
    });
  }

  // 자동 전환 토글 버튼 클릭
  autoToggle.addEventListener("click", function () {
    if (isAutoRotating) {
      stopAutoRotate();
      autoToggle.textContent = "▶";
      autoToggle.title = "자동 전환 시작";
      isAutoRotating = false;
    } else {
      startAutoRotate();
      autoToggle.textContent = "⏸";
      autoToggle.title = "자동 전환 중지";
      isAutoRotating = true;
    }
  });

  // 페이지 로드 시 자동 로테이션 시작
  startAutoRotate();
  console.log('✅ 슬라이더 초기화 완료');
}

/* ===================================
   새로운 섹션 인터랙션 로직
   =================================== */

// 1. 인기 도서 데이터 로드 및 렌더링
async function loadTrendingBooks() {
  try {
    // 도서관 정보나루 API를 사용하여 데이터 가져오기
    console.log('도서관 정보나루 API에서 데이터 로딩 중...');

    // Top 5: 인기 대출 도서 (최근 7일)
    const loanBooksResult = await LibraryAPI.getLoanBooks({
      pageSize: 5
    });

    // Community Hot: 급상승 도서 (오늘 날짜)
    const hotTrendResult = await LibraryAPI.getHotTrendBooks();

    if (loanBooksResult.success) {
      console.log('인기 대출 도서:', loanBooksResult.books);
      renderBooks(loanBooksResult.books, 'top5-grid', 'top5');
    } else {
      console.error('인기 대출 도서 로드 실패:', loanBooksResult.error);
      // 폴백: 로컬 데이터 사용
      await loadTrendingBooksFromLocal();
      return;
    }

    if (hotTrendResult.success) {
      console.log('급상승 도서:', hotTrendResult.books);
      renderBooks(hotTrendResult.books.slice(0, 5), 'community-grid', 'community');
    } else {
      console.error('급상승 도서 로드 실패:', hotTrendResult.error);
      // 폴백: 로컬 데이터 사용
      await loadTrendingBooksFromLocal();
      return;
    }

    // 탭 전환 기능
    initTabSwitching();
  } catch (error) {
    console.error('인기 도서 데이터 로드 실패:', error);
    // 에러 발생 시 로컬 데이터 사용
    await loadTrendingBooksFromLocal();
  }
}

// 로컬 JSON 파일에서 데이터 로드 (폴백용)
async function loadTrendingBooksFromLocal() {
  try {
    console.log('로컬 데이터에서 로딩 중...');
    const response = await fetch('data/trending-books.json');
    const data = await response.json();

    // API 응답 구조에 맞게 데이터 추출
    renderBooks(data.weeklyTop5.books, 'top5-grid', 'top5');
    renderBooks(data.communityHot.books, 'community-grid', 'community');

    // 메타 정보 표시 (선택적)
    displayMetaInfo(data.meta);

    // 탭 전환 기능
    initTabSwitching();
  } catch (error) {
    console.error('로컬 데이터 로드 실패:', error);
  }
}

function displayMetaInfo(meta) {
  // 데이터 갱신 정보를 UI에 표시 (선택적)
  const lastUpdated = new Date(meta.lastUpdated);
  const nextUpdate = new Date(meta.nextUpdate);

  console.log(`데이터 업데이트: ${lastUpdated.toLocaleDateString('ko-KR')}`);
  console.log(`다음 업데이트: ${nextUpdate.toLocaleDateString('ko-KR')}`);
  console.log(`데이터 기간: ${meta.dataSourcePeriod.startDate} ~ ${meta.dataSourcePeriod.endDate}`);
}

function renderBooks(books, gridId, type) {
  const grid = document.getElementById(gridId);
  if (!grid) {
    console.error(`❌ 그리드 요소를 찾을 수 없습니다: #${gridId}`);
    console.log('현재 페이지의 모든 ID:', Array.from(document.querySelectorAll('[id]')).map(el => el.id).join(', '));
    return;
  }

  grid.innerHTML = '';

  console.log(`📚 렌더링 시작 - 그리드: ${gridId}, 타입: ${type}, 책 개수: ${books.length}`);

  books.forEach((book, index) => {
    const card = document.createElement('div');
    // 랭킹은 API에서 제공하는 ranking 또는 순서대로 부여
    const rank = book.ranking || book.rank || (index + 1);
    card.className = `book-card reveal-on-scroll reveal-active ${rank <= 3 ? `rank-${rank}` : ''}`;
    card.style.transitionDelay = `${index * 0.1}s`;

    // API 응답 형식에 맞게 조정
    const loanCount = book.loanCount || book.readCount || 0;
    const mentionCount = book.mentionCount || 0;

    const statsText = type === 'top5'
      ? `📖 ${loanCount.toLocaleString()}회 대출`
      : `💬 ${mentionCount > 0 ? mentionCount.toLocaleString() + '회 언급' : loanCount.toLocaleString() + '회 대출'}`;

    // 카테고리 처리 (API에서 제공하지 않을 수 있음)
    const category = book.category || '일반';

    // 책 표지 이미지 처리 - cover 속성이 비어있으면 기본 이미지 사용
    let coverImage = 'assets/books/default-cover.svg';
    if (book.cover && book.cover.trim() !== '') {
      coverImage = book.cover;
    }

    console.log(`책 "${book.title}" 이미지 URL:`, coverImage);

    card.innerHTML = `
      <img src="${coverImage}" alt="${book.title}" class="book-cover" onerror="this.src='assets/books/default-cover.svg'; console.error('이미지 로드 실패:', '${book.title}');">
      <div class="book-info">
        <div class="book-title">${book.title}</div>
        <div class="book-author">${book.author}</div>
        <div class="book-meta">
          <span class="book-category">${category}</span>
          <span class="book-stats">${statsText}</span>
        </div>
      </div>
    `;

    grid.appendChild(card);
  });

  console.log(`${type} 그리드에 ${books.length}권의 책이 렌더링되었습니다.`);
}

function initTabSwitching() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabName = btn.getAttribute('data-tab');

      // 모든 탭 버튼과 컨텐츠에서 active 제거
      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));

      // 클릭한 탭 활성화
      btn.classList.add('active');
      document.getElementById(`${tabName}-content`).classList.add('active');
    });
  });
}

// 2. 스크롤 애니메이션 (Intersection Observer)
const observerOptions = {
  threshold: 0.15,
  rootMargin: "0px 0px -50px 0px"
};

const scrollObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('reveal-active');
    }
  });
}, observerOptions);

// Tilted Sections 애니메이션 Observer
function initTiltedSectionsAnimation() {
  const tiltedSections = document.querySelectorAll('.tilted-section');

  if (tiltedSections.length === 0) {
    console.log('⚠️ Tilted sections를 찾을 수 없습니다.');
    return;
  }

  // 각 섹션이 완전히 뷰포트에 들어왔을 때 트리거
  const tiltedObserverOptions = {
    threshold: 0.3,  // 섹션의 30%가 보일 때 트리거
    rootMargin: '0px'
  };

  const tiltedObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // 약간의 지연 후 active 클래스 추가 (부드러운 효과)
        setTimeout(() => {
          entry.target.classList.add('active');
        }, 100);

        // 한 번 애니메이션되면 관찰 중지 (재실행 방지)
        tiltedObserver.unobserve(entry.target);
      }
    });
  }, tiltedObserverOptions);

  tiltedSections.forEach(section => {
    tiltedObserver.observe(section);
  });

  console.log(`✅ Tilted sections 애니메이션 적용: ${tiltedSections.length}개`);
}

// 페이지 로드 시 모든 초기화 작업 실행
document.addEventListener('DOMContentLoaded', () => {
  console.log('🎉 DOM 로드 완료 - 초기화 시작');

  // 슬라이더 초기화
  initSlider();

  // 인기 도서 로드
  loadTrendingBooks();

  // 스크롤 애니메이션 observer 적용
  const revealElements = document.querySelectorAll('.reveal-on-scroll');
  console.log(`📜 스크롤 애니메이션 적용 대상: ${revealElements.length}개 요소`);
  revealElements.forEach(el => {
    scrollObserver.observe(el);
  });

  // Tilted sections 애니메이션 초기화
  initTiltedSectionsAnimation();

  // 3D Tilt 효과 적용
  initTiltEffect();

  console.log('✅ 모든 초기화 작업 완료');
});

// 2. 3D Tilt 효과 (후기 카드용)
function initTiltEffect() {
  const tiltCards = document.querySelectorAll('.tilt-card');

  tiltCards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((y - centerY) / centerY) * -5; // 최대 5도 회전
      const rotateY = ((x - centerX) / centerX) * 5;

      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
    });
  });
}

