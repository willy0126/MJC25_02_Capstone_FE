// FAQ Accordion and Tab Functionality
document.addEventListener('DOMContentLoaded', function() {
    // Tab switching functionality
    initTabSwitching();

    // Accordion functionality
    initAccordion();

    // Notice functionality
    initNotice();
});

// Tab Switching
function initTabSwitching() {
    const sidebarTabs = document.querySelectorAll('.sidebar-tab');
    const tabContents = document.querySelectorAll('.tab-content');

    sidebarTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const targetTab = this.getAttribute('data-tab');

            // Remove active class from all tabs and contents
            sidebarTabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            // Add active class to clicked tab
            this.classList.add('active');

            // Show corresponding content
            const targetContent = document.getElementById(targetTab + '-tab');
            if (targetContent) {
                targetContent.classList.add('active');
            }

            // Scroll to top of FAQ section smoothly
            const faqSection = document.querySelector('.faq-section');
            if (faqSection) {
                const offsetTop = faqSection.getBoundingClientRect().top + window.pageYOffset - 100;
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }

            // Close all accordions when switching tabs
            closeAllAccordions();
        });
    });
}

// Accordion Functionality
function initAccordion() {
    // Get all accordion headers
    const accordionHeaders = document.querySelectorAll('.accordion-header');

    // Add click event listener to each header
    accordionHeaders.forEach(header => {
        header.addEventListener('click', function() {
            const accordionItem = this.parentElement;
            const isActive = accordionItem.classList.contains('active');

            // Close all accordion items
            closeAllAccordions();

            // If the clicked item was not active, open it
            if (!isActive) {
                accordionItem.classList.add('active');
            }
        });
    });


    // Optional: Close accordion when clicking outside
    document.addEventListener('click', function(event) {
        const isAccordion = event.target.closest('.accordion-item');
        if (!isAccordion) {
            // Uncomment the line below if you want to close all accordions when clicking outside
            // closeAllAccordions();
        }
    });

    // Optional: Keyboard accessibility
    accordionHeaders.forEach(header => {
        header.addEventListener('keydown', function(event) {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                this.click();
            }
        });
    });

    // Optional: Smooth scroll to accordion item when opened
    accordionHeaders.forEach(header => {
        header.addEventListener('click', function() {
            setTimeout(() => {
                const accordionItem = this.parentElement;
                if (accordionItem.classList.contains('active')) {
                    const headerOffset = 100;
                    const elementPosition = accordionItem.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });
                }
            }, 100);
        });
    });
}

// Function to close all accordion items
function closeAllAccordions() {
    const allItems = document.querySelectorAll('.accordion-item');
    allItems.forEach(item => {
        item.classList.remove('active');
    });
}

// Notice Functionality
function initNotice() {
    // Notice item click event
    const noticeItems = document.querySelectorAll('.notice-item');
    noticeItems.forEach(item => {
        item.addEventListener('click', function() {
            // 여기에 공지사항 상세 페이지로 이동하는 로직을 추가할 수 있습니다
            console.log('공지사항 클릭:', this.querySelector('.notice-title').textContent);
        });
    });

    // Pagination functionality
    const pageButtons = document.querySelectorAll('.page-num');
    const prevButton = document.querySelector('.page-prev');
    const nextButton = document.querySelector('.page-next');

    pageButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all page buttons
            pageButtons.forEach(btn => btn.classList.remove('active'));

            // Add active class to clicked button
            this.classList.add('active');

            // Scroll to top of section
            const faqSection = document.querySelector('.faq-section');
            if (faqSection) {
                const offsetTop = faqSection.getBoundingClientRect().top + window.pageYOffset - 100;
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Previous/Next button functionality
    if (prevButton) {
        prevButton.addEventListener('click', function() {
            const activeButton = document.querySelector('.page-num.active');
            const prevNum = activeButton.previousElementSibling;
            if (prevNum && prevNum.classList.contains('page-num')) {
                prevNum.click();
            }
        });
    }

    if (nextButton) {
        nextButton.addEventListener('click', function() {
            const activeButton = document.querySelector('.page-num.active');
            const nextNum = activeButton.nextElementSibling;
            if (nextNum && nextNum.classList.contains('page-num')) {
                nextNum.click();
            }
        });
    }
}
