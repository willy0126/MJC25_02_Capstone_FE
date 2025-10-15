"use strict";

let next = document.querySelector(".next");
let prev = document.querySelector(".prev");
let autoToggle = document.querySelector(".auto-toggle");
let autoRotateInterval;
let isAutoRotating = true;

// 다음 슬라이드로 이동하는 함수
function moveToNext() {
  let items = document.querySelectorAll(".item");
  document.querySelector(".slide").appendChild(items[0]);
}

// 이전 슬라이드로 이동하는 함수
function moveToPrev() {
  let items = document.querySelectorAll(".item");
  document.querySelector(".slide").prepend(items[items.length - 1]);
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
document.querySelector(".slide").addEventListener("click", function (e) {
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

/* ===================================
   새로운 섹션 인터랙션 로직
   =================================== */

// 1. 인기 도서 데이터 로드 및 렌더링
async function loadTrendingBooks() {
  try {
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
    console.error('인기 도서 데이터 로드 실패:', error);
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
  if (!grid) return;

  grid.innerHTML = '';

  books.forEach((book, index) => {
    const card = document.createElement('div');
    card.className = `book-card reveal-on-scroll ${book.rank ? `rank-${book.rank}` : ''}`;
    card.style.transitionDelay = `${index * 0.1}s`;

    const statsText = type === 'top5'
      ? `📖 ${book.readCount.toLocaleString()}명 읽음`
      : `💬 ${book.mentionCount.toLocaleString()}회 언급`;

    card.innerHTML = `
      <img src="${book.cover}" alt="${book.title}" class="book-cover" onerror="this.style.display='none'">
      <div class="book-info">
        <div class="book-title">${book.title}</div>
        <div class="book-author">${book.author}</div>
        <div class="book-meta">
          <span class="book-category">${book.category}</span>
          <span class="book-stats">${statsText}</span>
        </div>
      </div>
    `;

    grid.appendChild(card);
  });
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

// 페이지 로드 시 인기 도서 로드
document.addEventListener('DOMContentLoaded', () => {
  loadTrendingBooks();
});

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

// 모든 reveal-on-scroll 요소에 observer 적용
document.addEventListener('DOMContentLoaded', () => {
  const revealElements = document.querySelectorAll('.reveal-on-scroll');
  revealElements.forEach(el => {
    scrollObserver.observe(el);
  });

  // 3D Tilt 효과 적용
  initTiltEffect();
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

/* ===================================
   독서 성장 애니메이션 (anime.js)
   =================================== */

function initGrowthAnimation() {
  const stage1 = document.querySelector('#stage-1');
  const stage2 = document.querySelector('#stage-2');
  const stage3 = document.querySelector('#stage-3');
  const growthSection = document.querySelector('.reading-growth-section');
  const sparkles = document.querySelector('#sparkles');
  const glowOuter = document.querySelector('#glow-outer');
  const glowMiddle = document.querySelector('#glow-middle');
  const glowInner = document.querySelector('#glow-inner');
  const waterDrops = document.querySelectorAll('#water-drops path, #water-drops circle');
  const apples = document.querySelectorAll('.apple-group');

  // SVG path 요소들 선택
  const giftPaths = document.querySelectorAll('.gift-draw');
  const sproutSoil = document.querySelectorAll('.sprout-soil');
  const sproutPaths = document.querySelectorAll('.sprout-draw');
  const treeSoil = document.querySelectorAll('.tree-soil');
  const treePaths = document.querySelectorAll('.tree-draw');

  if (!stage1 || !stage2 || !stage3 || !growthSection) {
    console.error('Stage 요소를 찾을 수 없습니다.');
    return;
  }

  // 각 path의 길이 계산 및 초기 설정
  const giftPathData = [];
  giftPaths.forEach((path) => {
    const length = path.getTotalLength();
    path.style.strokeDasharray = length;
    path.style.strokeDashoffset = length;
    giftPathData.push({ element: path, length: length });
  });

  const sproutSoilData = [];
  sproutSoil.forEach((path) => {
    const length = path.getTotalLength();
    path.style.strokeDasharray = length;
    path.style.strokeDashoffset = length;
    sproutSoilData.push({ element: path, length: length });
  });

  const sproutPathData = [];
  sproutPaths.forEach((path) => {
    const length = path.getTotalLength();
    path.style.strokeDasharray = length;
    path.style.strokeDashoffset = length;
    sproutPathData.push({ element: path, length: length });
  });

  const treeSoilData = [];
  treeSoil.forEach((path) => {
    const length = path.getTotalLength();
    path.style.strokeDasharray = length;
    path.style.strokeDashoffset = length;
    treeSoilData.push({ element: path, length: length });
  });

  const treePathData = [];
  treePaths.forEach((path) => {
    const length = path.getTotalLength();
    path.style.strokeDasharray = length;
    path.style.strokeDashoffset = length;
    treePathData.push({ element: path, length: length });
  });

  // 텍스트 설정
  const text1 = '책과의 첫 만남';
  const text2 = '조금씩 싹트는 독서 습관';
  const text3 = '훌륭한 밑거름이 되어 큰 효과를 가져옵니다';

  const textStage1 = document.getElementById('text-stage-1');
  const textStage2 = document.getElementById('text-stage-2');
  const textStage3 = document.getElementById('text-stage-3');

  // 텍스트를 개별 span으로 분리
  function createTextSpans(element, text) {
    element.innerHTML = '';
    for (let i = 0; i < text.length; i++) {
      const span = document.createElement('span');
      span.textContent = text[i];
      span.style.opacity = '0';
      span.style.display = 'inline-block';
      if (text[i] === ' ') {
        span.style.width = '0.5em';
      }
      element.appendChild(span);
    }
  }

  createTextSpans(textStage1, text1);
  createTextSpans(textStage2, text2);
  createTextSpans(textStage3, text3);

  // 초기 상태 설정
  stage1.style.opacity = '1';
  stage2.style.opacity = '0';
  stage3.style.opacity = '0';

  // 스크롤 이벤트
  window.addEventListener('scroll', () => {
    const rect = growthSection.getBoundingClientRect();
    const sectionTop = rect.top;
    const sectionHeight = rect.height;
    const windowHeight = window.innerHeight;

    // 섹션이 화면에 들어왔을 때 진행도 계산
    if (sectionTop <= 0 && sectionTop + sectionHeight > windowHeight) {
      const scrollableHeight = sectionHeight - windowHeight;
      const scrollProgress = Math.max(0, Math.min(1, -sectionTop / scrollableHeight));

      // Stage 전환 (0-0.30: stage1, 0.35-0.63: stage2, 0.68-1: stage3)
      // 각 stage 사이에 공백(0.05) 추가로 완성된 문구 확인 가능
      if (scrollProgress < 0.30) {
        // Stage 1: 선물상자
        const stage1Progress = scrollProgress / 0.30;
        stage1.style.opacity = '1';
        stage2.style.opacity = '0';
        stage3.style.opacity = '0';

        // Path 그리기 애니메이션
        giftPathData.forEach((pathData, index) => {
          const delay = index * 0.02; // 순차적으로 그려지도록 딜레이
          const pathProgress = Math.max(0, Math.min(1, (stage1Progress - delay) / (1 - delay)));
          const offset = pathData.length * (1 - pathProgress);
          pathData.element.style.strokeDashoffset = offset.toString();
        });

        // Sparkles 애니메이션
        if (sparkles) {
          const sparkleOpacity = Math.sin(stage1Progress * Math.PI * 4) * 0.5 + 0.5;
          sparkles.style.opacity = sparkleOpacity.toString();
        }

        // Glow 효과 (90% 이상일 때)
        if (stage1Progress > 0.9) {
          const glowProgress = (stage1Progress - 0.9) / 0.1;
          const glowOpacity = Math.sin(glowProgress * Math.PI);
          if (glowOuter) glowOuter.style.opacity = (glowOpacity * 0.4).toString();
          if (glowMiddle) glowMiddle.style.opacity = (glowOpacity * 0.5).toString();
          if (glowInner) glowInner.style.opacity = (glowOpacity * 0.6).toString();
        } else {
          if (glowOuter) glowOuter.style.opacity = '0';
          if (glowMiddle) glowMiddle.style.opacity = '0';
          if (glowInner) glowInner.style.opacity = '0';
        }

        // 텍스트 애니메이션 (한 글자씩)
        const text1Spans = textStage1.querySelectorAll('span');
        text1Spans.forEach((span, index) => {
          const charProgress = Math.max(0, Math.min(1, (stage1Progress * text1Spans.length - index) / 1));
          span.style.opacity = charProgress.toString();
        });

      } else if (scrollProgress < 0.30 + 0.05) {
        // Stage 1 완성 상태 유지 (0.30-0.35)
        stage1.style.opacity = '1';
        stage2.style.opacity = '0';
        stage3.style.opacity = '0';

        // 모든 요소 완전히 그려진 상태 유지
        giftPathData.forEach((pathData) => {
          pathData.element.style.strokeDashoffset = '0';
        });

        // 텍스트 완전히 표시
        const text1Spans = textStage1.querySelectorAll('span');
        text1Spans.forEach((span) => {
          span.style.opacity = '1';
        });

      } else if (scrollProgress < 0.63) {
        // Stage 2: 새싹
        const stage2Progress = (scrollProgress - 0.35) / 0.28;

        // Stage 전환 (fade in/out)
        if (stage2Progress < 0.05) {
          const fadeProgress = stage2Progress / 0.05;
          stage1.style.opacity = (1 - fadeProgress).toString();
          stage2.style.opacity = fadeProgress.toString();
          stage3.style.opacity = '0';
        } else {
          stage1.style.opacity = '0';
          stage2.style.opacity = '1';
          stage3.style.opacity = '0';
        }

        // 순차적 애니메이션: 흙(0-20%) → 새싹(20-80%) → 물방울(80-100%)
        if (stage2Progress < 0.2) {
          // 1단계: 흙 그리기 (0-20%)
          const soilProgress = stage2Progress / 0.2;
          sproutSoilData.forEach((pathData) => {
            const offset = pathData.length * (1 - soilProgress);
            pathData.element.style.strokeDashoffset = offset.toString();
          });
          // 새싹과 물방울은 숨김
          sproutPathData.forEach((pathData) => {
            pathData.element.style.strokeDashoffset = pathData.length.toString();
          });
          if (waterDrops.length > 0) {
            waterDrops.forEach((drop) => {
              drop.style.opacity = '0';
              drop.style.transform = 'translate(0, 0)';
            });
          }
        } else if (stage2Progress < 0.8) {
          // 2단계: 새싹 그리기 (20-80%)
          const sproutProgress = (stage2Progress - 0.2) / 0.6;
          // 흙은 완전히 그려진 상태
          sproutSoilData.forEach((pathData) => {
            pathData.element.style.strokeDashoffset = '0';
          });
          // 새싹 그리기
          sproutPathData.forEach((pathData, index) => {
            const delay = index * 0.03;
            const pathProgress = Math.max(0, Math.min(1, (sproutProgress - delay) / (1 - delay)));
            const offset = pathData.length * (1 - pathProgress);
            pathData.element.style.strokeDashoffset = offset.toString();
          });
          // 물방울은 아직 숨김
          if (waterDrops.length > 0) {
            waterDrops.forEach((drop) => {
              drop.style.opacity = '0';
              drop.style.transform = 'translate(0, 0)';
            });
          }
        } else {
          // 3단계: 물방울 애니메이션 (80-100%)
          const dropPhase = (stage2Progress - 0.8) / 0.2;
          // 흙과 새싹 완전히 그려진 상태
          sproutSoilData.forEach((pathData) => {
            pathData.element.style.strokeDashoffset = '0';
          });
          sproutPathData.forEach((pathData) => {
            pathData.element.style.strokeDashoffset = '0';
          });
          // 물방울 애니메이션
          if (waterDrops.length > 0) {
            waterDrops.forEach((drop, index) => {
              const delay = index * 0.1;
              const dropProgress = Math.max(0, Math.min(1, (dropPhase - delay) / (1 - delay)));
              const translateX = dropProgress * 50;
              const translateY = dropProgress * 150;
              drop.style.transform = `translate(${translateX}px, ${translateY}px)`;
              drop.style.opacity = (1 - dropProgress * 0.7).toString();
            });
          }
        }

        // 텍스트 애니메이션 (한 글자씩)
        const text2Spans = textStage2.querySelectorAll('span');
        text2Spans.forEach((span, index) => {
          const charProgress = Math.max(0, Math.min(1, (stage2Progress * text2Spans.length - index) / 1));
          span.style.opacity = charProgress.toString();
        });

      } else if (scrollProgress < 0.63 + 0.05) {
        // Stage 2 완성 상태 유지 (0.63-0.68)
        stage1.style.opacity = '0';
        stage2.style.opacity = '1';
        stage3.style.opacity = '0';

        // 모든 요소 완전히 그려진 상태 유지
        sproutSoilData.forEach((pathData) => {
          pathData.element.style.strokeDashoffset = '0';
        });
        sproutPathData.forEach((pathData) => {
          pathData.element.style.strokeDashoffset = '0';
        });

        // 물방울 최종 상태
        if (waterDrops.length > 0) {
          waterDrops.forEach((drop) => {
            drop.style.transform = 'translate(50px, 150px)';
            drop.style.opacity = '0.3';
          });
        }

        // 텍스트 완전히 표시
        const text2Spans = textStage2.querySelectorAll('span');
        text2Spans.forEach((span) => {
          span.style.opacity = '1';
        });

      } else {
        // Stage 3: 나무
        const stage3Progress = (scrollProgress - 0.68) / 0.32;

        // Stage 전환 (fade in/out)
        if (stage3Progress < 0.05) {
          const fadeProgress = stage3Progress / 0.05;
          stage1.style.opacity = '0';
          stage2.style.opacity = (1 - fadeProgress).toString();
          stage3.style.opacity = fadeProgress.toString();
        } else {
          stage1.style.opacity = '0';
          stage2.style.opacity = '0';
          stage3.style.opacity = '1';
        }

        // 순차적 애니메이션: 흙(0-15%) → 나무(15-75%) → 사과(75-100%)
        if (stage3Progress < 0.15) {
          // 1단계: 흙 그리기 (0-15%)
          const soilProgress = stage3Progress / 0.15;
          treeSoilData.forEach((pathData) => {
            const offset = pathData.length * (1 - soilProgress);
            pathData.element.style.strokeDashoffset = offset.toString();
          });
          // 나무와 사과는 숨김
          treePathData.forEach((pathData) => {
            pathData.element.style.strokeDashoffset = pathData.length.toString();
          });
          if (apples.length > 0) {
            apples.forEach((apple) => {
              apple.style.opacity = '0';
            });
          }
        } else if (stage3Progress < 0.75) {
          // 2단계: 나무 그리기 (15-75%)
          const treeProgress = (stage3Progress - 0.15) / 0.6;
          // 흙은 완전히 그려진 상태
          treeSoilData.forEach((pathData) => {
            pathData.element.style.strokeDashoffset = '0';
          });
          // 나무 그리기
          treePathData.forEach((pathData, index) => {
            const delay = index * 0.1;
            const pathProgress = Math.max(0, Math.min(1, (treeProgress - delay) / (1 - delay)));
            const offset = pathData.length * (1 - pathProgress);
            pathData.element.style.strokeDashoffset = offset.toString();
          });
          // 사과는 아직 숨김
          if (apples.length > 0) {
            apples.forEach((apple) => {
              apple.style.opacity = '0';
            });
          }
        } else {
          // 3단계: 사과 애니메이션 (75-100%)
          const applePhase = (stage3Progress - 0.75) / 0.25;
          // 흙과 나무 완전히 그려진 상태
          treeSoilData.forEach((pathData) => {
            pathData.element.style.strokeDashoffset = '0';
          });
          treePathData.forEach((pathData) => {
            pathData.element.style.strokeDashoffset = '0';
          });
          // 사과 그리기 애니메이션
          const appleElements = document.querySelectorAll('#apples circle, #apples line');
          if (appleElements.length > 0) {
            // 7개 사과, 각 사과는 4개 요소 (외곽선, 채움, 하이라이트, 줄기)
            const applesPerGroup = 4;
            const totalApples = 7;

            for (let i = 0; i < totalApples; i++) {
              const delay = i * 0.08;
              const appleProgress = Math.max(0, Math.min(1, (applePhase - delay) / (1 - delay)));

              // easeOutElastic 효과
              let scale;
              if (appleProgress === 0) {
                scale = 0;
              } else if (appleProgress === 1) {
                scale = 1;
              } else {
                const p = 0.3;
                const s = p / 4;
                scale = Math.pow(2, -10 * appleProgress) * Math.sin((appleProgress - s) * (2 * Math.PI) / p) + 1;
              }

              // 각 사과의 4개 요소에 적용
              for (let j = 0; j < applesPerGroup; j++) {
                const elementIndex = i * applesPerGroup + j;
                if (elementIndex < appleElements.length) {
                  appleElements[elementIndex].style.opacity = appleProgress.toString();
                  appleElements[elementIndex].style.transform = `scale(${scale})`;
                  appleElements[elementIndex].style.transformOrigin = 'center';
                }
              }
            }
          }
        }

        // 텍스트 애니메이션 (한 글자씩)
        const text3Spans = textStage3.querySelectorAll('span');
        text3Spans.forEach((span, index) => {
          const charProgress = Math.max(0, Math.min(1, (stage3Progress * text3Spans.length - index) / 1));
          span.style.opacity = charProgress.toString();
        });
      }
    } else if (sectionTop > 0) {
      // 섹션 위에 있을 때
      stage1.style.opacity = '0';
      stage2.style.opacity = '0';
      stage3.style.opacity = '0';
    } else {
      // 섹션 아래로 완전히 지나갔을 때
      stage1.style.opacity = '0';
      stage2.style.opacity = '0';
      stage3.style.opacity = '1';
    }
  });
}

// 페이지 로드 후 애니메이션 초기화
if (typeof anime !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initGrowthAnimation, 500);
  });
}
