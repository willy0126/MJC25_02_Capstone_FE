document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const boardId = urlParams.get("id");

    // DOM 요소들
    const postTitleEl = document.getElementById("postTitle");
    const postContentEl = document.getElementById("postContent");
    const postTypeEl = document.getElementById("postType");
    const postDateEl = document.getElementById("postDate");
    const editBtn = document.getElementById("editBtn");
    const deleteBtn = document.getElementById("deleteBtn");

    // 수정 관련 DOM 요소
    const detailContent = document.querySelector(".detail-content");
    const detailHeader = document.querySelector(".detail-header h2");
    const editSection = document.querySelector(".edit-section");
    const editTitle = document.getElementById("editTitle");
    const editContent = document.getElementById("editContent");
    const saveBtn = document.getElementById("saveBtn");
    const cancelBtn = document.getElementById("cancelBtn");

    // 댓글 DOM 요소
    const replyContentEl = document.getElementById("replyContent");
    const submitReplyBtn = document.getElementById("submitReplyBtn");
    const repliesListEl = document.getElementById("repliesList");

    // 삭제 모달
    const deletePostModal = document.getElementById("deletePostModal");
    const deletePostTitle = document.getElementById("deletePostTitle");
    const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");
    const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");

    const deleteReplyModal = document.getElementById("deleteReplyModal");
    const deleteReplyContentDisplay = document.getElementById("deleteReplyContentDisplay");
    const cancelReplyDeleteBtn = document.getElementById("cancelReplyDeleteBtn");
    const confirmReplyDeleteBtn = document.getElementById("confirmReplyDeleteBtn");

    // 댓글 수정 모달
    const editReplyModal = document.getElementById("editReplyModal");
    const editReplyContent = document.getElementById("editReplyContent");
    const saveReplyBtn = document.getElementById("saveReplyBtn");
    const cancelReplyEditBtn = document.getElementById("cancelReplyEditBtn");

    let currentPost = null;
    let currentEditingReplyId = null; // 👈 댓글 수정에 필요한 변수

    if (!boardId) {
        postTitleEl.innerText = "잘못된 접근입니다.";
        postContentEl.innerText = "";
        editBtn.style.display = "none";
        deleteBtn.style.display = "none";
        return;
    }

    // ===================================
    // 1️⃣ 게시글 불러오기 및 초기 설정
    // ===================================
    async function loadPost() {
        try {
            const token = localStorage.getItem("accessToken");
            const res = await fetch(`http://localhost:18888/api/boards/${boardId}`, {
                method: "GET",
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (!res.ok) throw new Error("게시글 불러오기 실패");

            const result = await res.json();
            currentPost = result.data;

            postTitleEl.innerText = currentPost.title;
            postContentEl.innerText = currentPost.content;
            postTypeEl.innerText = currentPost.boardType || "기타";
            postDateEl.innerText = new Date(currentPost.createAt).toLocaleDateString();

            // 댓글 목록도 불러오기
            loadReplies();

        } catch (err) {
            console.error(err);
            postTitleEl.innerText = "게시글을 찾을 수 없습니다.";
            postContentEl.innerText = "";
            editBtn.style.display = "none";
            deleteBtn.style.display = "none";
        }
    }

    loadPost();

    // ===================================
    // 2️⃣ 게시글 수정 로직
    // ===================================
    editBtn.addEventListener("click", () => {
        // 수정 모드로 전환
        editTitle.value = currentPost.title;
        editContent.value = currentPost.content;

        detailContent.style.display = "none";
        detailHeader.style.display = "none";
        editSection.style.display = "block";

        editBtn.disabled = true;
        deleteBtn.disabled = true;
    });

    cancelBtn.addEventListener("click", () => {
        // 수정 취소
        detailContent.style.display = "block";
        detailHeader.style.display = "block";
        editSection.style.display = "none";

        editBtn.disabled = false;
        deleteBtn.disabled = false;
    });

    saveBtn.addEventListener("click", async () => {
        const title = editTitle.value.trim();
        const content = editContent.value.trim();

        if (!title || !content) {
            showToast("제목과 내용을 입력하세요.", "error");
            return;
        }

        const payload = { title, content, boardImage: null };

        try {
            const token = localStorage.getItem("accessToken");
            const res = await fetch(`http://localhost:18888/api/boards/${boardId}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error("수정 실패");

            showToast("글이 수정되었습니다.", "success");

            currentPost.title = title;
            currentPost.content = content;

            postTitleEl.innerText = title;
            postContentEl.innerText = content;

            detailContent.style.display = "block";
            detailHeader.style.display = "block";
            editSection.style.display = "none";

            editBtn.disabled = false;
            deleteBtn.disabled = false;

        } catch (err) {
            console.error(err);
            showToast("수정에 실패했습니다.", "error");
        }
    });

    // ===================================
    // 3️⃣ 게시글 삭제 로직 (모달)
    // ===================================
    deleteBtn.addEventListener("click", () => {
        deletePostTitle.innerText = postTitleEl.innerText;
        deletePostModal.style.display = "flex";
    });

    cancelDeleteBtn.addEventListener("click", () => {
        deletePostModal.style.display = "none";
    });

    confirmDeleteBtn.addEventListener("click", async () => {
        try {
            const token = localStorage.getItem("accessToken");
            const res = await fetch(`http://localhost:18888/api/boards/${boardId}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (!res.ok) throw new Error("삭제 실패");

            showToast("글이 삭제되었습니다.", "success");
            deletePostModal.style.display = "none";

            setTimeout(() => {
                window.location.href = "freeboard.html";
            }, 1500);

        } catch (err) {
            console.error(err);
            showToast("게시글 삭제에 실패했습니다.", "error");
            deletePostModal.style.display = "none";
        }
    });
    
    // -----------------------------------
    // 4️⃣ 댓글 기능 (불러오기/작성/수정/삭제)
    // -----------------------------------

    // 댓글 목록 렌더링
    function renderReplies(replies) {
        // 기존 댓글 목록을 초기화하지 않고 새로 불러온 댓글만 추가
        replies.forEach(reply => {
            const replyElement = document.createElement("div");
            replyElement.classList.add("reply-item");
            replyElement.innerHTML = `
                <div class="reply-header">
                    <span class="reply-author">${reply.userNickname}</span>
                    <span class="reply-date">${new Date(reply.createAt).toLocaleString()}</span>
                </div>
                <div class="reply-content">${reply.content}</div>
                <div class="reply-actions">
                    <button class="reply-edit-btn" data-reply-id="${reply.replyId}">수정</button>
                    <button class="reply-delete-btn" data-reply-id="${reply.replyId}">삭제</button>
                </div>
            `;

            repliesListEl.appendChild(replyElement);
        });
    }

    // 댓글 목록 불러오기
    async function loadReplies() {
        try {
            const token = localStorage.getItem("accessToken");
            const res = await fetch(`http://localhost:18888/api/boards/${boardId}/replies`, {
                method: "GET",
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (!res.ok) throw new Error("댓글 목록 조회 실패");

            const result = await res.json();
            const replies = result.data;
            
            // 댓글 목록을 새로 불러올 때마다 기존 목록을 비워주어야 중복 출력이 방지됩니다.
            repliesListEl.innerHTML = ''; 
            renderReplies(replies);

        } catch (err) {
            console.error("댓글 목록 조회 실패:", err);
        }
    }

    // 댓글 작성 버튼
    submitReplyBtn.addEventListener("click", async () => {
        const replyContent = replyContentEl.value.trim();

        if (!replyContent) {
            showToast("댓글을 작성해주세요.", "error");
            return;
        }

        try {
            const token = localStorage.getItem("accessToken");
            const res = await fetch(`http://localhost:18888/api/boards/${boardId}/replies`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ content: replyContent })
            });

            if (!res.ok) throw new Error("댓글 작성 실패");

            const result = await res.json();
            const reply = result.data;

            // 새 댓글을 화면에 추가 (맨 앞에)
            const replyElement = document.createElement("div");
            replyElement.classList.add("reply-item");
            replyElement.innerHTML = `
                <div class="reply-header">
                    <span class="reply-author">${reply.userNickname}</span>
                    <span class="reply-date">${new Date(reply.createAt).toLocaleString()}</span>
                </div>
                <div class="reply-content">${reply.content}</div>
                <div class="reply-actions">
                    <button class="reply-edit-btn" data-reply-id="${reply.replyId}">수정</button>
                    <button class="reply-delete-btn" data-reply-id="${reply.replyId}">삭제</button>
                </div>
            `;

            repliesListEl.prepend(replyElement); // 댓글 목록의 맨 앞에 추가
            replyContentEl.value = ''; // 입력창 초기화
            showToast("댓글이 등록되었습니다.", "success");

        } catch (err) {
            console.error(err);
            showToast("댓글 등록 중 오류 발생.", "error");
        }
    });

    // ===================================
    // 댓글 수정/삭제 이벤트 위임
    // ===================================
    repliesListEl.addEventListener("click", (event) => {
        const target = event.target;
        const replyId = target.getAttribute("data-reply-id");
        if (!replyId) return;

        // 🟢 댓글 삭제 버튼
        if (target.classList.contains("reply-delete-btn")) {
            const replyElement = target.closest(".reply-item");
            const replyContent = replyElement.querySelector(".reply-content").innerText;

            deleteReplyContentDisplay.innerText = replyContent;
            deleteReplyModal.style.display = "flex";
            confirmReplyDeleteBtn.setAttribute("data-reply-id", replyId);
        }
        
        // 🟡 댓글 수정 버튼 👈 추가된 핵심 로직
        if (target.classList.contains("reply-edit-btn")) {
            currentEditingReplyId = replyId;

            const replyElement = target.closest(".reply-item");
            const replyContent = replyElement.querySelector(".reply-content").innerText;

            editReplyContent.value = replyContent; // 모달의 textarea에 내용 채우기
            editReplyModal.style.display = "flex";
        }
    });

    // 댓글 삭제 모달 취소 버튼
    cancelReplyDeleteBtn.addEventListener("click", () => {
        deleteReplyModal.style.display = "none";
    });

    // 댓글 삭제 확인 버튼
    confirmReplyDeleteBtn.addEventListener("click", async () => {
        const replyId = confirmReplyDeleteBtn.getAttribute("data-reply-id");
        if (!replyId) return;

        try {
            const token = localStorage.getItem("accessToken");
            const res = await fetch(`http://localhost:18888/api/boards/${boardId}/replies/${replyId}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (!res.ok) throw new Error("댓글 삭제 실패");

            // UI에서 해당 댓글 삭제
            const replyElement = repliesListEl.querySelector(`[data-reply-id="${replyId}"]`).closest(".reply-item");
            if (replyElement) {
                replyElement.remove();
            }

            showToast("댓글이 삭제되었습니다!", "success");
            deleteReplyModal.style.display = "none";
        } catch (err) {
            console.error(err);
            showToast("댓글 삭제에 실패했습니다.", "error");
            deleteReplyModal.style.display = "none";
        }
    });
    
    // 댓글 수정 모달 취소 버튼 👈 추가된 로직
    cancelReplyEditBtn.addEventListener("click", () => {
        editReplyModal.style.display = "none";
        currentEditingReplyId = null; 
    });

    // 댓글 수정 저장 버튼 👈 추가된 핵심 로직
    saveReplyBtn.addEventListener("click", async () => {
        const replyId = currentEditingReplyId;
        const newContent = editReplyContent.value.trim();

        if (!replyId || !newContent) {
            showToast("댓글 내용을 입력하거나, 올바른 접근이 아닙니다.", "error");
            return;
        }

        try {
            const token = localStorage.getItem("accessToken");
            const res = await fetch(`http://localhost:18888/api/boards/${boardId}/replies/${replyId}`, {
                method: "PATCH", 
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ content: newContent })
            });

            if (!res.ok) throw new Error("댓글 수정 실패");

            // UI 업데이트
            const replyElement = repliesListEl.querySelector(`[data-reply-id="${replyId}"]`).closest(".reply-item");
            if (replyElement) {
                replyElement.querySelector(".reply-content").innerText = newContent;
            }

            editReplyModal.style.display = "none";
            currentEditingReplyId = null; 
            showToast("댓글이 수정되었습니다.", "success");

        } catch (err) {
            console.error("댓글 수정 실패:", err);
            showToast("댓글 수정에 실패했습니다.", "error");
        }
    });
});