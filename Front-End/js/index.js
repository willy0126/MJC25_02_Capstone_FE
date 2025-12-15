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
    logger.warn('⚠️ 슬라이더 요소를 찾을 수 없습니다.');
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
  logger.log('✅ 슬라이더 초기화 완료');
}

/* ===================================
   새로운 섹션 인터랙션 로직
   =================================== */

// 1. 인기 도서 데이터 로드 및 렌더링
async function loadTrendingBooks() {
  try {
    // 도서관 정보나루 API를 사용하여 데이터 가져오기
    logger.log('도서관 정보나루 API에서 데이터 로딩 중...');

    // Top 5: 인기 대출 도서 (최근 7일)
    const loanBooksResult = await LibraryAPI.getLoanBooks({
      pageSize: 5
    });

    // Community Hot: 급상승 도서 (오늘 날짜)
    const hotTrendResult = await LibraryAPI.getHotTrendBooks();

    if (loanBooksResult.success) {
      logger.log('인기 대출 도서:', loanBooksResult.books);
      renderBooks(loanBooksResult.books, 'top5-grid', 'top5');
    } else {
      logger.error('인기 대출 도서 로드 실패:', loanBooksResult.error);
      // 폴백: 로컬 데이터 사용
      await loadTrendingBooksFromLocal();
      return;
    }

    if (hotTrendResult.success) {
      logger.log('급상승 도서:', hotTrendResult.books);
      renderBooks(hotTrendResult.books.slice(0, 5), 'community-grid', 'community');
    } else {
      logger.error('급상승 도서 로드 실패:', hotTrendResult.error);
      // 폴백: 로컬 데이터 사용
      await loadTrendingBooksFromLocal();
      return;
    }

    // 탭 전환 기능
    initTabSwitching();
  } catch (error) {
    logger.error('인기 도서 데이터 로드 실패:', error);
    // 에러 발생 시 로컬 데이터 사용
    await loadTrendingBooksFromLocal();
  }
}

// 로컬 JSON 파일에서 데이터 로드 (폴백용)
async function loadTrendingBooksFromLocal() {
  try {
    logger.log('로컬 데이터에서 로딩 중...');
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
    logger.error('로컬 데이터 로드 실패:', error);
  }
}

function displayMetaInfo(meta) {
  // 데이터 갱신 정보를 UI에 표시 (선택적)
  const lastUpdated = new Date(meta.lastUpdated);
  const nextUpdate = new Date(meta.nextUpdate);

  logger.log(`데이터 업데이트: ${lastUpdated.toLocaleDateString('ko-KR')}`);
  logger.log(`다음 업데이트: ${nextUpdate.toLocaleDateString('ko-KR')}`);
  logger.log(`데이터 기간: ${meta.dataSourcePeriod.startDate} ~ ${meta.dataSourcePeriod.endDate}`);
}

function renderBooks(books, gridId, type) {
  const grid = document.getElementById(gridId);
  if (!grid) {
    logger.error(`❌ 그리드 요소를 찾을 수 없습니다: #${gridId}`);
    logger.log('현재 페이지의 모든 ID:', Array.from(document.querySelectorAll('[id]')).map(el => el.id).join(', '));
    return;
  }

  grid.innerHTML = '';

  logger.log(`📚 렌더링 시작 - 그리드: ${gridId}, 타입: ${type}, 책 개수: ${books.length}`);

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

    logger.log(`책 "${book.title}" 이미지 URL:`, coverImage);

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

  logger.log(`${type} 그리드에 ${books.length}권의 책이 렌더링되었습니다.`);
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
    logger.log('⚠️ Tilted sections를 찾을 수 없습니다.');
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

  logger.log(`✅ Tilted sections 애니메이션 적용: ${tiltedSections.length}개`);
}

/* ===================================
   최신 공지사항 로드 및 렌더링
   =================================== */
async function loadLatestNotices() {
  const grid = document.getElementById('latest-notices-grid');
  if (!grid) {
    logger.error('❌ 공지사항 그리드를 찾을 수 없습니다.');
    return;
  }

  try {
    logger.log('📢 최신 공지사항 로딩 중...');

    // API에서 공지사항 가져오기
    const response = await apiClient.getNotices(0, 3);

    let notices = [];
    if (response.success && response.data) {
      // 페이지네이션 응답 처리: { content: [...], totalPages, ... }
      if (Array.isArray(response.data)) {
        notices = response.data.slice(0, 3);
      } else if (response.data.content && Array.isArray(response.data.content)) {
        notices = response.data.content.slice(0, 3);
      }
    }

    // 하드코딩 데이터 (폴백용)
    const hardcodedNotices = [
      {
        noticeId: 'hard_1',
        badge: 'important',
        title: '책·이음 서비스 정기 점검 안내',
        username: '관리자',
        createAt: '2025-01-15T09:00:00'
      },
      {
        noticeId: 'hard_2',
        badge: 'new',
        title: '2025년 신규 독서 프로그램 안내',
        username: '관리자',
        createAt: '2025-01-10T14:30:00'
      },
      {
        noticeId: 'hard_3',
        badge: 'event',
        title: '겨울방학 특별 창작 대회 개최',
        username: '관리자',
        createAt: '2025-01-05T10:00:00'
      }
    ];

    // API 데이터가 없으면 하드코딩 데이터 사용
    if (notices.length === 0) {
      notices = hardcodedNotices;
      logger.log('⚠️ API 데이터 없음 - 하드코딩 데이터 사용');
    }

    renderNotices(notices);
    logger.log(`✅ 최신 공지사항 ${notices.length}개 렌더링 완료`);
  } catch (error) {
    logger.error('❌ 공지사항 로드 실패:', error);

    // 에러 시 하드코딩 데이터 표시
    const hardcodedNotices = [
      {
        noticeId: 'hard_1',
        badge: 'important',
        title: '책·이음 서비스 정기 점검 안내',
        username: '관리자',
        createAt: '2025-01-15T09:00:00'
      },
      {
        noticeId: 'hard_2',
        badge: 'new',
        title: '2025년 신규 독서 프로그램 안내',
        username: '관리자',
        createAt: '2025-01-10T14:30:00'
      },
      {
        noticeId: 'hard_3',
        badge: 'event',
        title: '겨울방학 특별 창작 대회 개최',
        username: '관리자',
        createAt: '2025-01-05T10:00:00'
      }
    ];
    renderNotices(hardcodedNotices);
  }
}

function renderNotices(notices) {
  const grid = document.getElementById('latest-notices-grid');
  if (!grid) return;

  grid.innerHTML = '';

  notices.forEach((notice, index) => {
    const card = document.createElement('div');
    card.className = 'notice-card reveal-on-scroll';
    card.style.transitionDelay = `${index * 0.1}s`;

    // 배지 타입 결정
    const badgeType = notice.badge || 'normal';
    const badgeText = {
      'important': '중요',
      'new': '신규',
      'event': '이벤트',
      'normal': '일반'
    }[badgeType] || '일반';

    // 날짜 포맷팅
    const date = notice.createAt ? formatNoticeDate(notice.createAt) : '-';
    const author = notice.username || '관리자';

    card.innerHTML = `
      <div class="notice-badge ${badgeType}">${badgeText}</div>
      <div class="notice-title">${notice.title}</div>
      <div class="notice-meta">
        <span class="notice-author">${author}</span>
        <span class="notice-date">${date}</span>
      </div>
    `;

    // 클릭 시 공지사항 페이지로 이동 + 해당 글 모달 자동 열기
    card.addEventListener('click', () => {
      window.location.href = `notice.html?noticeId=${notice.noticeId}`;
    });

    grid.appendChild(card);

    // 스크롤 애니메이션 observer 적용
    scrollObserver.observe(card);
  });
}

function formatNoticeDate(isoDate) {
  if (!isoDate) return '-';
  const date = new Date(isoDate);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}.${month}.${day}`;
}

/* ===================================
   최근 활동 타임라인 로드 및 렌더링
   =================================== */
async function loadRecentActivities() {
  const section = document.getElementById('recentActivitySection');
  const timeline = document.getElementById('activityTimeline');

  if (!section || !timeline) {
    logger.log('⚠️ 최근 활동 섹션을 찾을 수 없습니다.');
    return;
  }

  // 로그인 상태 확인
  const accessToken = localStorage.getItem('accessToken');
  if (!accessToken) {
    section.style.display = 'none';
    logger.log('🔒 로그인하지 않음 - 최근 활동 섹션 숨김');
    return;
  }

  section.style.display = 'block';
  logger.log('📊 최근 활동 로딩 중...');

  try {
    // TODO: 백엔드 API가 준비되면 실제 API 호출로 교체
    // const response = await apiClient.getRecentActivities();
    // if (response.success && response.data) {
    //   renderActivities(response.data);
    //   return;
    // }

    // 현재는 목 데이터 사용
    const mockActivities = [
      {
        type: 'reading',
        icon: '📖',
        title: '어린왕자',
        description: '독서를 시작했어요',
        time: '2시간 전',
        link: 'calendar.html'
      },
      {
        type: 'complete',
        icon: '✅',
        title: '해리포터와 마법사의 돌',
        description: '독서를 완료했어요',
        time: '1일 전',
        link: 'bookcase.html'
      },
      {
        type: 'challenge',
        icon: '🎯',
        title: '겨울 독서 챌린지',
        description: '챌린지에 참여했어요',
        time: '3일 전',
      }
    ];

    renderActivities(mockActivities);
    logger.log(`✅ 최근 활동 ${mockActivities.length}개 렌더링 완료`);
  } catch (error) {
    logger.error('❌ 최근 활동 로드 실패:', error);
    showEmptyState();
  }
}

function renderActivities(activities) {
  const timeline = document.getElementById('activityTimeline');
  if (!timeline) return;

  if (!activities || activities.length === 0) {
    showEmptyState();
    return;
  }

  timeline.innerHTML = activities.map(activity => `
    <div class="activity-item" onclick="location.href='${activity.link}'">
      <div class="activity-icon type-${activity.type}">
        ${activity.icon}
      </div>
      <div class="activity-content">
        <div class="activity-title">${activity.title}</div>
        <div class="activity-description">${activity.description}</div>
        <div class="activity-time">🕐 ${activity.time}</div>
      </div>
    </div>
  `).join('');

  // 스크롤 애니메이션 적용
  const activityItems = timeline.querySelectorAll('.activity-item');
  activityItems.forEach(item => {
    scrollObserver.observe(item);
  });
}

function showEmptyState() {
  const timeline = document.getElementById('activityTimeline');
  if (!timeline) return;

  timeline.innerHTML = `
    <div class="activity-empty">
      <div class="activity-empty-icon">📚</div>
      <div class="activity-empty-text">아직 활동 내역이 없어요</div>
      <div class="activity-empty-desc">책을 읽고 다양한 활동에 참여해보세요!</div>
    </div>
  `;
}

// 페이지 로드 시 모든 초기화 작업 실행
document.addEventListener('DOMContentLoaded', () => {
  logger.log('🎉 DOM 로드 완료 - 초기화 시작');

  // 슬라이더 초기화
  initSlider();

  // 인기 도서 로드
  loadTrendingBooks();

  // 최신 공지사항 로드
  loadLatestNotices();

  // 최근 활동 타임라인 로드
  loadRecentActivities();

  // 스크롤 애니메이션 observer 적용
  const revealElements = document.querySelectorAll('.reveal-on-scroll');
  logger.log(`📜 스크롤 애니메이션 적용 대상: ${revealElements.length}개 요소`);
  revealElements.forEach(el => {
    scrollObserver.observe(el);
  });

  // Tilted sections 애니메이션 초기화
  initTiltedSectionsAnimation();

  logger.log('✅ 모든 초기화 작업 완료');
});
