document.addEventListener("DOMContentLoaded", () => {
    console.log("📌 freeboard.js 실행됨 (DOMContentLoaded)");
    
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
        console.log("📡 게시글 조회 요청 실행됨");
        try {
            const token = localStorage.getItem("accessToken");
            const response = await fetch("http://localhost:18888/api/boards", {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error(`조회 실패: ${response.status}`);
            }
            
            const result = await response.json();
            posts = result.data || [];
            
            // 최신순 정렬 (createAt 기준 내림차순)
            posts.sort((a, b) => new Date(b.createAt) - new Date(a.createAt));
            
            console.log("📌 받아온 게시글:", posts);
            renderPage(1); // 첫 페이지 렌더링
            console.log("✅ 게시글 조회 성공");
        } catch (err) {
            console.error("❌ 게시글 조회 실패:", err);
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
            li.innerHTML = `
                <span class="board-type">자유글</span>
                <a class="board-title" href="freeboard-detail.html?id=${post.boardId}">
                    ${post.title}
                </a>
                <span class="board-date">
                    ${new Date(post.createAt).toLocaleDateString()}
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
            const token = localStorage.getItem("accessToken");
            const response = await fetch("http://localhost:18888/api/boards", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });
            
            if (!response.ok) {
                throw new Error(`저장 실패: ${response.status}`);
            }
            
            showToast("글이 등록되었습니다. ", "success");
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
        console.log("🔍 searchPosts 실행됨");
        const keyword = searchInput.value.trim();
        
        if (keyword === "") {
            renderPage(1);
            return;
        }
        
        const filtered = posts.filter(post =>
            post.title?.includes(keyword) || post.content?.includes(keyword)
        );
        
        console.log("📌 검색 결과:", filtered);
        renderPosts(filtered);
        pageInfo.textContent = `검색 결과: ${filtered.length}개`;
    }
    
    searchBtn?.addEventListener("click", () => {
        console.log("🔍 검색 버튼 클릭됨");
        searchPosts();
    });
    
    searchInput?.addEventListener("keyup", (e) => {
        if (e.key === "Enter") {
            console.log("🔍 Enter 검색 실행");
            searchPosts();
        }
    });
    
    // 첫 실행
    fetchPosts();
});
