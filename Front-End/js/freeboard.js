document.addEventListener("DOMContentLoaded", () => {
    // 페이지 변수
    let currentPage = 1;
    const postsPerPage = 5;
    let posts = [];
    
    // DOM 요소
    const freeboardList = document.getElementById("freeboardList");
    const pageInfo = document.getElementById("pageInfo");
    const prevBtn = document.getElementById("prevPageBtn");
    const nextBtn = document.getElementById("nextPageBtn");
    
    // 글쓰기 모달 관련
    const writeBtn = document.getElementById("writeBtn");
    const writeModal = document.getElementById("writeModal");
    const writeModalClose = document.getElementById("writeModalClose");
    const savePostBtn = document.getElementById("savePostBtn");
    const postTitleInput = document.getElementById("postTitleInput");
    const postContentInput = document.getElementById("postContentInput");
    
    // 검색 DOM
    const searchInput = document.getElementById("searchInput");
    const searchBtn = document.getElementById("searchBtn");
    
    // =========================
    // 1. 게시글 조회
    // =========================
    async function fetchPosts() {
        try {
            const result = await apiClient.getBoards();

            // API 응답 구조에 따라 배열 추출
            if (Array.isArray(result)) {
                posts = result;
            } else if (Array.isArray(result.data)) {
                posts = result.data;
            } else if (result.data && Array.isArray(result.data.content)) {
                // 페이징 응답인 경우
                posts = result.data.content;
            } else {
                posts = [];
            }

            // 최신순 정렬 (createAt 기준 내림차순)
            if (posts.length > 0) {
                posts.sort((a, b) => new Date(b.createAt) - new Date(a.createAt));
            }

            renderPage(1); // 첫 페이지 렌더링
        } catch (err) {
            showToast("게시글을 조회하는 데 실패했습니다.", "error");
        }
    }
    
    // =========================
    // 2. 렌더링
    // =========================
    function renderPosts(list) {
        freeboardList.innerHTML = "";
        if (!list || list.length === 0) {
            freeboardList.innerHTML = `<li>작성된 게시글이 없습니다.</li>`;
            return;
        }
        
        list.forEach(post => {
            const li = document.createElement("li");
            const authorName = escapeHtml(post.user?.nickname) || '익명';
            li.innerHTML = `
                <span class="board-type">${escapeHtml(post.boardType) || '자유글'}</span>
                <a class="board-title" href="freeboard-detail.html?id=${post.boardId}">
                    ${escapeHtml(post.title)}
                </a>
                <span class="board-meta">
                    ${authorName} · ${new Date(post.createAt).toLocaleDateString()}
                </span>
            `;
            freeboardList.appendChild(li);
        });
    }
    
    function renderPage(page) {
        currentPage = page;
        const totalPages = Math.ceil(posts.length / postsPerPage) || 1;
        const start = (page - 1) * postsPerPage;
        const end = start + postsPerPage;
        
        renderPosts(posts.slice(start, end));
        pageInfo.textContent = `${page} / ${totalPages}`;
    }
    
    // 페이지 이동
    prevBtn.addEventListener("click", () => {
        if (currentPage > 1) renderPage(currentPage - 1);
    });
    
    nextBtn.addEventListener("click", () => {
        const totalPages = Math.ceil(posts.length / postsPerPage);
        if (currentPage < totalPages) renderPage(currentPage + 1);
    });
    
    // =========================
    // 3. 글쓰기 모달
    // =========================
    writeBtn?.addEventListener("click", () => {
        writeModal.style.display = "flex";
    });
    
    writeModalClose?.addEventListener("click", () => {
        writeModal.style.display = "none";
    });
    
    // =========================
    // 4. 게시글 저장
    // =========================
    savePostBtn?.addEventListener("click", async () => {
        const title = postTitleInput.value.trim();
        const content = postContentInput.value.trim();

        if (!title || !content) {
            showToast("제목과 내용을 입력하세요.", "error");
            return;
        }

        const payload = {
            title,
            content,
            boardImage: null
        };

        try {
            await apiClient.createBoard(payload);

            showToast("글이 등록되었습니다.", "success");
            writeModal.style.display = "none";
            postTitleInput.value = "";
            postContentInput.value = "";

            // 전체 목록 다시 불러오기 (서버에서 최신 데이터 가져옴)
            await fetchPosts();

        } catch (err) {
            console.error("❌ 게시글 저장 실패", err);
            showToast("글 저장에 실패했습니다.", "error");
        }
    });
    
    // =========================
    // 5. 검색 기능
    // =========================
    function searchPosts() {
        const keyword = searchInput.value.trim();

        if (keyword === "") {
            renderPage(1);
            return;
        }

        const filtered = posts.filter(post =>
            post.title?.includes(keyword) || post.content?.includes(keyword)
        );

        renderPosts(filtered);
        pageInfo.textContent = `검색 결과: ${filtered.length}개`;
    }

    searchBtn?.addEventListener("click", () => {
        searchPosts();
    });
    
    searchInput?.addEventListener("keyup", (e) => {
        if (e.key === "Enter") {
            searchPosts();
        }
    });
    
    // 첫 실행
    fetchPosts();
});
