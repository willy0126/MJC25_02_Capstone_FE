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
