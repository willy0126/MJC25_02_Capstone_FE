// FAQ Accordion Functionality
document.addEventListener('DOMContentLoaded', function() {
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

    // Function to close all accordion items
    function closeAllAccordions() {
        const allItems = document.querySelectorAll('.accordion-item');
        allItems.forEach(item => {
            item.classList.remove('active');
        });
    }

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
});
