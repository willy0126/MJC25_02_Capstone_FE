// 페이지의 HTML 로드가 완료되면 실행 (공통 navbar와 footer)
document.addEventListener("DOMContentLoaded", function() {
    // fetch API를 사용해 navbar.html 파일의 내용을 가져옴
    fetch('layouts/navbar.html')
        .then(response => response.text()) // 응답을 텍스트 형태로 변환
        .then(data => {
            // id가 "navbar-placeholder"인 요소 안에 가져온 HTML 내용을 삽입
            document.getElementById("navbar-placeholder").innerHTML = data;

            // 스크롤 이벤트 리스너 추가
            window.addEventListener('scroll', function() {
                const navbar = document.querySelector('.navbar');
                if (window.scrollY > 50) {
                    navbar.classList.add('scrolled');
                } else {
                    navbar.classList.remove('scrolled');
                }
            });
        });

    // fetch API를 사용해 footer.html 파일의 내용을 가져옴
    fetch('layouts/footer.html')
        .then(response => response.text()) // 응답을 텍스트 형태로 변환
        .then(data => {
            // id가 "footer-placeholder"인 요소 안에 가져온 HTML 내용을 삽입
            document.getElementById("footer-placeholder").innerHTML = data;
        });
});