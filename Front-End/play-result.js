document.addEventListener('DOMContentLoaded', function() {
    const emptyState = document.getElementById('emptyState');
    const picturebookList = document.getElementById('picturebookList');

    // localStorage에서 그림책 목록 로드
    loadPicturebooks();

    function loadPicturebooks() {
        const picturebooks = JSON.parse(localStorage.getItem('picturebooks') || '[]');

        if (picturebooks.length === 0) {
            // 빈 상태 표시
            emptyState.style.display = 'block';
            picturebookList.style.display = 'none';
            return;
        }

        // 목록 렌더링
        emptyState.style.display = 'none';
        picturebookList.style.display = 'grid';
        renderPicturebooks(picturebooks);
    }

    function renderPicturebooks(picturebooks) {
        picturebookList.innerHTML = picturebooks.map(book => {
            // 날짜 포맷팅
            const date = new Date(book.createdAt);
            const formattedDate = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;

            // 작가 목록
            const authors = book.winnerStories?.map(story =>
                `<span class="author-tag">${story.round} ${story.authorName || '익명'}</span>`
            ).join('') || '<span class="author-tag">작가 정보 없음</span>';

            // 표지 이미지 URL
            let coverUrl = '';
            if (book.images) {
                // API 응답이 배열인 경우 (response.data가 배열)
                if (Array.isArray(book.images) && book.images.length > 0) {
                    const coverImg = book.images[0];
                    coverUrl = coverImg.imagePath || coverImg.imageUrl || coverImg.url || '';
                } else if (book.images.coverImage) {
                    coverUrl = book.images.coverImage.imagePath || book.images.coverImage.url || book.images.coverImage.imageUrl || '';
                } else if (book.images.cover) {
                    coverUrl = book.images.cover.imagePath || book.images.cover.url || book.images.cover.imageUrl || '';
                } else if (book.images.images && book.images.images.length > 0) {
                    const coverImg = book.images.images[0];
                    coverUrl = coverImg.imagePath || coverImg.url || coverImg.imageUrl || '';
                }
            }

            return `
                <div class="picturebook-card" data-contest-id="${book.contestId}">
                    <div class="card-cover">
                        ${coverUrl
                            ? `<img src="${coverUrl}" alt="${escapeHtml(book.title)}">`
                            : `<div class="cover-placeholder">${escapeHtml(book.title)}</div>`
                        }
                    </div>
                    <div class="card-info">
                        <h3 class="card-title">${escapeHtml(book.title)}</h3>
                        <div class="card-authors">${authors}</div>
                        <span class="card-date">${formattedDate}</span>
                    </div>
                    <button class="view-btn" onclick="viewPicturebook(${book.contestId})">보기</button>
                </div>
            `;
        }).join('');
    }

    // HTML 이스케이프
    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
});

// 그림책 상세 보기 (모달로 표시)
function viewPicturebook(contestId) {
    const picturebooks = JSON.parse(localStorage.getItem('picturebooks') || '[]');
    const book = picturebooks.find(p => String(p.contestId) === String(contestId));

    if (!book) {
        showToast('그림책을 찾을 수 없습니다.', 'error');
        return;
    }

    // 모달 생성
    const modal = document.createElement('div');
    modal.className = 'picturebook-modal-overlay';
    modal.innerHTML = `
        <div class="picturebook-modal-content">
            <button class="modal-close" onclick="this.closest('.picturebook-modal-overlay').remove()">&times;</button>

            <div class="modal-cover">
                ${getCoverHtml(book)}
            </div>

            <h2 class="modal-title">${escapeHtml(book.title)}</h2>
            <p class="modal-authors">작가: ${book.winnerStories?.map(s => s.authorName || '익명').join(', ') || '익명'}</p>

            <div class="modal-stories">
                ${book.winnerStories?.map((story, index) => {
                    const pageImg = getPageImage(book, index);
                    return `
                        <div class="story-item">
                            <div class="story-image">
                                ${pageImg
                                    ? `<img src="${pageImg}" alt="${story.round}">`
                                    : `<div class="image-placeholder">${story.round}</div>`
                                }
                            </div>
                            <div class="story-content">
                                <span class="story-round">${story.round}</span>
                                <p class="story-author">${story.authorName || '익명'}</p>
                                <p class="story-text">${escapeHtml(story.content)}</p>
                                <span class="story-votes">❤️ ${story.voteCount || 0}표</span>
                            </div>
                        </div>
                    `;
                }).join('') || '<p>이야기가 없습니다.</p>'}
            </div>

            <div class="modal-actions">
                <button class="action-btn share-btn" onclick="sharePicturebook(${contestId})">공유하기</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // 배경 클릭 시 닫기
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// 표지 이미지 HTML
function getCoverHtml(book) {
    let coverUrl = '';
    if (book.images) {
        if (Array.isArray(book.images) && book.images.length > 0) {
            const coverImg = book.images[0];
            coverUrl = coverImg.imagePath || coverImg.imageUrl || coverImg.url || '';
        } else if (book.images.coverImage) {
            coverUrl = book.images.coverImage.imagePath || book.images.coverImage.url || book.images.coverImage.imageUrl || '';
        } else if (book.images.cover) {
            coverUrl = book.images.cover.imagePath || book.images.cover.url || book.images.cover.imageUrl || '';
        } else if (book.images.images && book.images.images.length > 0) {
            const coverImg = book.images.images[0];
            coverUrl = coverImg.imagePath || coverImg.url || coverImg.imageUrl || '';
        }
    }

    if (coverUrl) {
        return `<img src="${coverUrl}" alt="표지">`;
    }
    return `<div class="cover-placeholder-large">${escapeHtml(book.title)}</div>`;
}

// 페이지 이미지 URL
function getPageImage(book, index) {
    if (!book.images) return '';

    let pageImages = [];
    // API 응답이 배열인 경우 (첫 번째는 표지, 나머지는 페이지)
    if (Array.isArray(book.images) && book.images.length > 1) {
        pageImages = book.images.slice(1);
    } else if (book.images.pageImages) {
        pageImages = book.images.pageImages;
    } else if (book.images.pages) {
        pageImages = book.images.pages;
    } else if (book.images.images && book.images.images.length > 1) {
        pageImages = book.images.images.slice(1);
    }

    if (pageImages[index]) {
        const img = pageImages[index];
        return img.imagePath || img.imageUrl || img.url || '';
    }
    return '';
}

// 공유하기
function sharePicturebook(contestId) {
    const url = window.location.href;
    if (navigator.share) {
        navigator.share({
            title: '그림책',
            text: '그림책을 확인해보세요!',
            url: url
        });
    } else {
        navigator.clipboard.writeText(url);
        showToast('링크가 복사되었습니다.', 'success');
    }
}

// HTML 이스케이프 (전역)
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
