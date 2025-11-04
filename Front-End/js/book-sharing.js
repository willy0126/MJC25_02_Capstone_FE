document.addEventListener("DOMContentLoaded", () => {
    const writeBtn = document.getElementById("writeBtn");
    const writeModal = document.getElementById("writeModal");
    const writeModalClose = document.getElementById("writeModalClose");
    const saveBookBtn = document.getElementById("saveBookBtn");
    const tableBody = document.getElementById("book-sharingTableBody");

    const bookNameInput = document.getElementById("bookNameInput");
    const bookTitleInput = document.getElementById("bookTitleInput");
    const bookStatusInput = document.getElementById("bookStatusInput");

    const viewModal = document.getElementById("viewModal");
    const viewModalClose = document.getElementById("viewModalClose");
    const closeViewBtn = document.getElementById("closeViewBtn");

    let currentRow = null;

    // 관리자 여부
    const isAdmin = true; // 실제 로그인 상태에 따라 변경 가능

    // 공지/글 데이터
    const notices = [];

    function getBadgeText(badge) {
        switch(badge){
            case "info": return "정보";
            case "alert": return "공지";
            default: return "";
        }
    }

    // 글쓰기 버튼 클릭
    writeBtn.addEventListener("click", () => {
        writeModal.style.display = "flex";
        currentRow = null;
        bookNameInput.value = "";
        bookTitleInput.value = "";
        bookStatusInput.value = "나눔중";
    });

    // 모달 닫기
    writeModalClose.addEventListener("click", () => writeModal.style.display = "none");

    // 저장 버튼 클릭
    saveBookBtn.addEventListener("click", () => {
        const name = bookNameInput.value.trim();
        const title = bookTitleInput.value.trim();
        const status = bookStatusInput.value;

        if(!name || !title){
            alert("책 이름과 글 제목을 입력하세요.");
            return;
        }

        if(currentRow){
            // 수정
            currentRow.cells[0].textContent = name;
            currentRow.cells[1].textContent = title;
            currentRow.cells[2].textContent = status;

            const notice = notices.find(n => n.row === currentRow);
            if(notice){
                notice.name = name;
                notice.title = title;
                notice.status = status;
            }
        } else {
            // 새 글 추가
            const row = tableBody.insertRow();
            row.insertCell(0).textContent = name;
            row.insertCell(1).textContent = title;
            row.insertCell(2).textContent = status;

            const actionCell = row.insertCell(3);

            const edit = document.createElement("button");
            edit.textContent = "수정";
            edit.className = "edit-btn";
            edit.addEventListener("click", e => {
                e.stopPropagation();
                currentRow = row;
                bookNameInput.value = row.cells[0].textContent;
                bookTitleInput.value = row.cells[1].textContent;
                bookStatusInput.value = row.cells[2].textContent;
                writeModal.style.display = "flex";
            });

            const del = document.createElement("button");
            del.textContent = "삭제";
            del.className = "delete-btn";
            del.addEventListener("click", e => {
                e.stopPropagation();
                if(confirm("정말 삭제하시겠습니까?")) {
                    const noticeIndex = notices.findIndex(n => n.row === row);
                    if(noticeIndex > -1) notices.splice(noticeIndex, 1);
                    row.remove();
                }
            });

            actionCell.appendChild(edit);
            actionCell.appendChild(del);

            // notices 배열에 저장
            const newNotice = {
                id: notices.length + 1,
                row: row,
                name: name,
                title: title,
                status: status,
                author: "관리자",
                date: new Date().toISOString().slice(0,10),
                views: 0,
                content: `${name} - ${title} 상세 내용입니다.`,
                badge: "info"
            };
            notices.push(newNotice);

            // 테이블 클릭 시 상세보기
            row.addEventListener("click", () => viewNotice(newNotice.id));
        }

        writeModal.style.display = "none";
        bookNameInput.value = "";
        bookTitleInput.value = "";
        bookStatusInput.value = "나눔중";
        currentRow = null;
    });

    // 기존 테이블에 대한 초기화
    function initExistingRows() {
        tableBody.querySelectorAll("tr").forEach((row, index) => {
            // edit/delete 버튼
            const editBtn = row.querySelector(".edit-btn");
            const delBtn = row.querySelector(".delete-btn");

            editBtn.addEventListener("click", e => {
                e.stopPropagation();
                currentRow = row;
                bookNameInput.value = row.cells[0].textContent;
                bookTitleInput.value = row.cells[1].textContent;
                bookStatusInput.value = row.cells[2].textContent;
                writeModal.style.display = "flex";
            });

            delBtn.addEventListener("click", e => {
                e.stopPropagation();
                if(confirm("정말 삭제하시겠습니까?")) row.remove();
            });

            // notices 배열에 추가
            const notice = {
                id: notices.length + 1,
                row: row,
                name: row.cells[0].textContent,
                title: row.cells[1].textContent,
                status: row.cells[2].textContent,
                author: "관리자",
                date: new Date().toISOString().slice(0,10),
                views: 0,
                content: `${row.cells[0].textContent} - ${row.cells[1].textContent} 상세 내용입니다.`,
                badge: "info"
            };
            notices.push(notice);

            // 테이블 클릭 시 상세보기
            row.addEventListener("click", () => viewNotice(notice.id));
        });
    }

    // 상세보기 모달 열기
    function viewNotice(id){
        const notice = notices.find(n => n.id === id);
        if(!notice) return;
        notice.views++;

        document.getElementById('detailBadge').className = `detail-badge badge badge-${notice.badge}`;
        document.getElementById('detailBadge').textContent = getBadgeText(notice.badge);
        document.getElementById('detailTitle').textContent = notice.title;
        document.getElementById('detailAuthor').textContent = `작성자: ${notice.author}`;
        document.getElementById('detailDate').textContent = `작성일: ${notice.date}`;
        document.getElementById('detailViews').textContent = `조회수: ${notice.views}`;
        document.getElementById('detailContent').textContent = notice.content;

        const detailActions = document.getElementById('detailActions');
        if(isAdmin){
            detailActions.style.display = 'flex';
        } else {
            detailActions.style.display = 'none';
        }

        viewModal.classList.add('show');
    }

    function closeViewModal(){
        viewModal.classList.remove('show');
    }

    viewModalClose.addEventListener("click", closeViewModal);
    closeViewBtn.addEventListener("click", closeViewModal);

    // 모달 외부 클릭 시 닫기
    window.addEventListener("click", e => {
        if(e.target === writeModal) writeModal.style.display = "none";
        if(e.target === viewModal) closeViewModal();
    });

    initExistingRows();
});
