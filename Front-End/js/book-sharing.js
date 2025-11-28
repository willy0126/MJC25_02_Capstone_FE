document.addEventListener("DOMContentLoaded", () => {
    const writeBtn = document.getElementById("writeBtn");
    const writeModal = document.getElementById("writeModal");
    const writeModalClose = document.getElementById("writeModalClose");
    const saveBookBtn = document.getElementById("saveBookBtn");
    const tableBody = document.getElementById("book-sharingTableBody");

    const bookImageInput = document.getElementById("bookImageInput");
    const bookImagePreview = document.getElementById("bookImagePreview");
    const bookTitleInput = document.getElementById("bookTitleInput");
    const bookContentInput = document.getElementById("bookContentInput"); 
    const bookStatusInput = document.getElementById("bookStatusInput");

    const viewModal = document.getElementById("viewModal");
    const viewModalClose = document.getElementById("viewModalClose");
    const closeViewBtn = document.getElementById("closeViewBtn");

    const prevPageBtn = document.getElementById("prevPageBtn");
    const nextPageBtn = document.getElementById("nextPageBtn");
    const pageInfo = document.getElementById("pageInfo");

    let currentRow = null;
    const isAdmin = true;
    let notices = [];

    // 페이지네이션
    const rowsPerPage = 5;
    let currentPage = 1;

    writeModal.style.display = "none";

    function getBadgeText(badge) {
        switch(badge){
            case "info": return "정보";
            case "alert": return "공지";
            default: return "";
        }
    }

    // 이미지 미리보기
    if (bookImageInput) {
        bookImageInput.addEventListener("change", function(event) {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    bookImagePreview.src = e.target.result;
                    bookImagePreview.style.display = "block";
                };
                reader.readAsDataURL(file);
            } else {
                bookImagePreview.src = "";
                bookImagePreview.style.display = "none";
            }
        });
    }

    // 글쓰기 버튼 클릭
    writeBtn.addEventListener("click", () => {
        writeModal.style.display = "flex";
        currentRow = null;
        if (bookImageInput) bookImageInput.value = "";
        if (bookImagePreview) {
            bookImagePreview.src = "";
            bookImagePreview.style.display = "none";
        }
        bookTitleInput.value = "";
        bookContentInput.value = "";
        bookStatusInput.value = "나눔중";
    });

    writeModalClose.addEventListener("click", () => writeModal.style.display = "none");

    function renderTable() {
        tableBody.innerHTML = '';
        const start = (currentPage - 1) * rowsPerPage;
        const end = start + rowsPerPage;
        const pageNotices = notices.slice(start, end);

        pageNotices.forEach(notice => {
            const row = tableBody.insertRow();
            row.insertCell(0).innerHTML = `<img src="${notice.name}" alt="책 이미지" style="max-width:60px;">`;
            row.insertCell(1).textContent = notice.title;
            row.insertCell(2).textContent = notice.status;
            const actionCell = row.insertCell(3);

            const edit = document.createElement("button");
            edit.textContent = "수정";
            edit.className = "edit-btn";
            edit.addEventListener("click", e => {
                e.stopPropagation();
                currentRow = notice;
                bookImagePreview.src = notice.name;
                bookImagePreview.style.display = notice.name ? "block" : "none";
                if(bookImageInput) bookImageInput.value = "";
                bookTitleInput.value = notice.title;
                bookContentInput.value = notice.content;
                bookStatusInput.value = notice.status;
                writeModal.style.display = "flex";
            });

            const del = document.createElement("button");
            del.textContent = "삭제";
            del.className = "delete-btn";
            del.addEventListener("click", e => {
                e.stopPropagation();
                if(confirm("정말 삭제하시겠습니까?")) {
                    const index = notices.findIndex(n => n.id === notice.id);
                    if(index > -1) notices.splice(index, 1);
                    // 페이지가 비었으면 이전 페이지로
                    const totalPages = Math.ceil(notices.length / rowsPerPage) || 1;
                    if(currentPage > totalPages) currentPage = totalPages;
                    renderTable();
                }
            });

            actionCell.appendChild(edit);
            actionCell.appendChild(del);

            row.addEventListener("click", () => viewNotice(notice.id));
        });

        const totalPages = Math.ceil(notices.length / rowsPerPage) || 1;
        pageInfo.textContent = `${currentPage} / ${totalPages}`;
        prevPageBtn.disabled = currentPage === 1;
        nextPageBtn.disabled = currentPage === totalPages;
    }

    prevPageBtn.addEventListener("click", () => {
        if(currentPage > 1){
            currentPage--;
            renderTable();
        }
    });
    nextPageBtn.addEventListener("click", () => {
        const totalPages = Math.ceil(notices.length / rowsPerPage);
        if(currentPage < totalPages){
            currentPage++;
            renderTable();
        }
    });

    saveBookBtn.addEventListener("click", () => {
        const imageSrc = bookImagePreview.src.trim();
        const title = bookTitleInput.value.trim();
        const content = bookContentInput.value.trim();
        const status = bookStatusInput.value;

        if(!imageSrc || !title || !content){
            alert("책 이미지, 글 제목, 글 내용을 모두 입력하세요.");
            return;
        }

        if(currentRow){ // 수정
            currentRow.name = imageSrc;
            currentRow.title = title;
            currentRow.content = content;
            currentRow.status = status;
        } else { // 신규
            const newNotice = {
                id: notices.length ? notices[notices.length - 1].id + 1 : 1,
                name: imageSrc,
                title: title,
                content: content,
                status: status,
                author: "관리자",
                date: new Date().toISOString().slice(0,10),
                views: 0,
                badge: "info"
            };
            notices.push(newNotice);
        }

        writeModal.style.display = "none";
        bookImageInput.value = "";
        bookImagePreview.src = "";
        bookImagePreview.style.display = "none";
        bookTitleInput.value = "";
        bookContentInput.value = "";
        bookStatusInput.value = "나눔중";
        currentRow = null;

        const totalPages = Math.ceil(notices.length / rowsPerPage);
        if(currentPage > totalPages) currentPage = totalPages;
        renderTable();
    });

    function viewNotice(id){
        const notice = notices.find(n => n.id === id);
        if(!notice) return;
        notice.views++;
        document.getElementById('detailBadge').className = `detail-badge badge badge-${notice.badge}`;
        document.getElementById('detailBadge').textContent = getBadgeText(notice.badge);
        document.getElementById('detailImage').src = notice.name;
        document.getElementById('detailTitle').textContent = notice.title;
        document.getElementById('detailAuthor').textContent = `작성자: ${notice.author}`;
        document.getElementById('detailDate').textContent = `작성일: ${notice.date}`;
        document.getElementById('detailViews').textContent = `조회수: ${notice.views}`;
        document.getElementById('detailContent').textContent = notice.content;
        const detailActions = document.getElementById('detailActions');
        detailActions.style.display = isAdmin ? 'flex' : 'none';
        viewModal.classList.add('show');
    }

    function closeViewModal(){
        viewModal.classList.remove('show');
    }

    viewModalClose.addEventListener("click", closeViewModal);
    closeViewBtn.addEventListener("click", closeViewModal);

    window.addEventListener("click", e => {
        if(e.target === writeModal) writeModal.style.display = "none";
        if(e.target === viewModal) closeViewModal();
    });

    // 기존 테이블 초기화 (페이지네이션용)
    function initExistingRows() {
        tableBody.querySelectorAll("tr").forEach(row => {
            const notice = {
                id: notices.length ? notices[notices.length - 1].id + 1 : 1,
                name: row.cells[0].querySelector('img')?.src || "",
                title: row.cells[1].textContent,
                content: "",
                status: row.cells[2].textContent,
                author: "관리자",
                date: new Date().toISOString().slice(0,10),
                views: 0,
                badge: "info"
            };
            notices.push(notice);
        });
        renderTable();
    }

    initExistingRows();
});
