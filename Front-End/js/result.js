document.addEventListener('DOMContentLoaded', function() {
    const cardsGrid = document.getElementById('cardsGrid');
    const emptyState = document.getElementById('emptyState');

    // 서버에서 그림책 목록 로드
    loadPicturebooks();

    async function loadPicturebooks() {
        try {
            // 서버에서 종료된 대회 목록 조회 (이미지 포함)
            const response = await apiClient.request('/contest', {
                method: 'GET'
            });

            console.log('서버 대회 목록 응답:', response);

            // 이미지가 있는 종료된 대회만 필터링
            const picturebooks = (response || []).filter(contest => {
                const hasImages = contest.images && contest.images.length > 0;
                return hasImages;
            });

            console.log('이미지가 있는 그림책 목록:', picturebooks);

            if (picturebooks.length === 0) {
                // 빈 상태 표시
                emptyState.style.display = 'block';
                cardsGrid.style.display = 'none';
                return;
            }

            // 카드 렌더링
            emptyState.style.display = 'none';
            cardsGrid.style.display = 'grid';
            renderCards(picturebooks);

        } catch (error) {
            console.error('그림책 목록 로드 실패:', error);
            emptyState.style.display = 'block';
            cardsGrid.style.display = 'none';
        }
    }

    function renderCards(picturebooks) {
        cardsGrid.innerHTML = picturebooks.map(book => {
            // 날짜 포맷팅
            const date = new Date(book.createdAt);
            const formattedDate = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;

            // 작가 목록
            const authors = book.winnerStories?.map((story, idx) =>
                `<span class="author-item">${story.round} ${story.authorName || '익명'}</span>`
            ).join('') || '<span class="author-item">작가 정보 없음</span>';

            // 표지 이미지 URL
            let coverUrl = '';
            if (book.images) {
                console.log('book.images 구조:', book.images);
                // API 응답이 배열인 경우
                if (Array.isArray(book.images) && book.images.length > 0) {
                    // isCover가 true이거나 round가 0인 이미지 찾기
                    const coverImg = book.images.find(img => img.isCover || img.round === 0) || book.images[0];
                    console.log('표지 이미지 객체:', coverImg);
                    // imageUrl 우선, 다양한 필드명 지원
                    coverUrl = coverImg.imageUrl || coverImg.imagePath || coverImg.image_url ||
                               coverImg.url || coverImg.image || coverImg.path ||
                               (typeof coverImg === 'string' ? coverImg : '');
                } else if (book.images.coverImage) {
                    coverUrl = book.images.coverImage.imageUrl || book.images.coverImage.imagePath || book.images.coverImage.url || '';
                } else if (book.images.cover) {
                    coverUrl = book.images.cover.imageUrl || book.images.cover.imagePath || book.images.cover.url || '';
                } else if (book.images.images && book.images.images.length > 0) {
                    const coverImg = book.images.images[0];
                    coverUrl = coverImg.imageUrl || coverImg.imagePath || coverImg.url || '';
                }
            }
            console.log('추출된 coverUrl:', coverUrl);

            return `
                <div class="card" data-contest-id="${book.contestId}">
                    <div class="card-content">
                        <div class="card-image">
                            ${coverUrl
                                ? `<img src="${coverUrl}" alt="${book.title}">`
                                : `<div style="display: flex; align-items: center; justify-content: center; height: 100%; background: linear-gradient(135deg, #667eea, #764ba2); color: white; font-weight: bold; font-size: 14px; text-align: center; padding: 10px;">${book.title}</div>`
                            }
                        </div>
                        <div class="card-info">
                            <h3 class="book-title">${escapeHtml(book.title)}</h3>
                            <div class="author-list">
                                ${authors}
                            </div>
                            <span class="date">${formattedDate}</span>
                        </div>
                    </div>
                    <button class="view-button" onclick="viewPicturebook(${book.contestId})">보기</button>
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

// 그림책 보기 (모달)
async function viewPicturebook(contestId) {
    try {
        // 서버에서 대회 상세 정보 조회
        const response = await apiClient.request('/contest', {
            method: 'GET'
        });

        const book = (response || []).find(p => String(p.contestId) === String(contestId));

        if (!book) {
            alert('그림책을 찾을 수 없습니다.');
            return;
        }

        showPicturebookModal(book);

    } catch (error) {
        console.error('그림책 조회 실패:', error);
        alert('그림책을 불러오는데 실패했습니다.');
    }
}

// 그림책 모달 표시
function showPicturebookModal(book) {

    // 모달 생성
    const modal = document.createElement('div');
    modal.className = 'result-modal-overlay';
    modal.innerHTML = `
        <div class="result-modal-content">
            <button class="modal-close-btn" onclick="this.closest('.result-modal-overlay').remove()">&times;</button>

            <div class="modal-book-cover">
                ${getModalCoverHtml(book)}
            </div>

            <h2 class="modal-book-title">${escapeHtmlGlobal(book.title)}</h2>
            <p class="modal-book-authors">작가: ${book.winnerStories?.map(s => s.authorName || '익명').join(', ') || '익명'}</p>

            <div class="modal-stories-list">
                ${book.winnerStories?.map((story, index) => {
                    const pageImg = getModalPageImage(book, index);
                    return `
                        <div class="modal-story-item">
                            <div class="modal-story-image">
                                ${pageImg
                                    ? `<img src="${pageImg}" alt="${story.round}">`
                                    : `<div class="modal-image-placeholder">${story.round}</div>`
                                }
                            </div>
                            <div class="modal-story-content">
                                <span class="modal-story-round">${story.round}</span>
                                <p class="modal-story-author">${story.authorName || '익명'}</p>
                                <p class="modal-story-text">${escapeHtmlGlobal(story.content)}</p>
                                <span class="modal-story-votes">❤️ ${story.voteCount || 0}표</span>
                            </div>
                        </div>
                    `;
                }).join('') || '<p>이야기가 없습니다.</p>'}
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

// 모달용 표지 이미지 HTML
function getModalCoverHtml(book) {
    let coverUrl = '';
    if (book.images) {
        if (Array.isArray(book.images) && book.images.length > 0) {
            // isCover가 true이거나 round가 0인 이미지 찾기
            const coverImg = book.images.find(img => img.isCover || img.round === 0) || book.images[0];
            coverUrl = coverImg.imageUrl || coverImg.imagePath || coverImg.url ||
                       (typeof coverImg === 'string' ? coverImg : '');
        } else if (book.images.coverImage) {
            coverUrl = book.images.coverImage.imageUrl || book.images.coverImage.imagePath || book.images.coverImage.url || '';
        } else if (book.images.cover) {
            coverUrl = book.images.cover.imageUrl || book.images.cover.imagePath || book.images.cover.url || '';
        } else if (book.images.images && book.images.images.length > 0) {
            const coverImg = book.images.images[0];
            coverUrl = coverImg.imageUrl || coverImg.imagePath || coverImg.url || '';
        }
    }
    if (coverUrl) {
        return `<img src="${coverUrl}" alt="표지">`;
    }
    return `<div class="modal-cover-placeholder">${escapeHtmlGlobal(book.title)}</div>`;
}

// 모달용 페이지 이미지 URL (라운드별)
function getModalPageImage(book, index) {
    if (!book.images) return '';

    let pageImages = [];
    if (Array.isArray(book.images)) {
        // round가 index+1인 이미지 찾기 (표지 제외)
        const roundImage = book.images.find(img => img.round === index + 1);
        if (roundImage) {
            return roundImage.imageUrl || roundImage.imagePath || roundImage.url ||
                   (typeof roundImage === 'string' ? roundImage : '');
        }
        // 못 찾으면 순서대로 (표지 제외)
        pageImages = book.images.filter(img => !img.isCover && img.round !== 0);
    } else if (book.images.pageImages) {
        pageImages = book.images.pageImages;
    } else if (book.images.pages) {
        pageImages = book.images.pages;
    } else if (book.images.images) {
        pageImages = book.images.images;
    }

    // index에 해당하는 이미지 찾기
    if (pageImages[index]) {
        const img = pageImages[index];
        return img.imageUrl || img.imagePath || img.url ||
               (typeof img === 'string' ? img : '');
    }
    return '';
}

// HTML 이스케이프 (전역)
function escapeHtmlGlobal(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
