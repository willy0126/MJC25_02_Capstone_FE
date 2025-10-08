// Intersection Observer for Scroll Animations
document.addEventListener('DOMContentLoaded', function() {
    // Configuration for the observer - full visibility for most elements
    const observerOptions = {
        root: null, // viewport
        rootMargin: '0px',
        threshold: 1.0 // Trigger when 100% of the element is visible (fully in viewport)
    };

    // Configuration for large sections that may not fit in viewport
    const partialObserverOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.3 // Trigger when 30% of the element is visible
    };

    // Callback function for the observer
    const observerCallback = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Add 'active' class when element enters viewport
                entry.target.classList.add('active');

                // Optional: Stop observing after animation (one-time animation)
                // observer.unobserve(entry.target);
            }
        });
    };

    // Create the observer
    const observer = new IntersectionObserver(observerCallback, observerOptions);

    // Create partial observer for large sections
    const partialObserver = new IntersectionObserver(observerCallback, partialObserverOptions);

    // Select elements with reveal classes (excluding large sections)
    const revealElements = document.querySelectorAll(
        '.reveal:not(.content-section):not(.cta-section), .reveal-left, .reveal-right, .reveal-stagger'
    );

    // Select large sections that need partial visibility threshold
    const largeSections = document.querySelectorAll(
        '.content-section.reveal, .content-section.reveal-scale, .cta-section.reveal, .stats-section.reveal-scale'
    );

    // Observe each small element with full visibility requirement
    revealElements.forEach(element => {
        observer.observe(element);
    });

    // Observe large sections with partial visibility requirement
    largeSections.forEach(element => {
        partialObserver.observe(element);
    });

    // Optional: Smooth scroll behavior for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Optional: Counter animation for stats section with easing
    const animateCounter = (element, target, duration = 4000) => {
        const startTime = performance.now();

        const updateCounter = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Apply ease-in-cubic effect (slow start, fast end)
            const easedProgress = progress * progress * progress;
            const currentValue = Math.floor(easedProgress * target);

            if (progress < 1) {
                element.textContent = currentValue.toLocaleString() + '+';
                requestAnimationFrame(updateCounter);
            } else {
                element.textContent = target.toLocaleString() + '+';
            }
        };

        requestAnimationFrame(updateCounter);
    };

    // Stats counter animation
    const statsObserverCallback = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const statItems = entry.target.querySelectorAll('.stat-item h3');
                statItems.forEach((item, index) => {
                    const text = item.textContent;
                    const number = parseInt(text.replace(/\D/g, ''));

                    // Animate the counter
                    setTimeout(() => {
                        animateCounter(item, number, 4000);
                    }, index * 100); // Stagger the animations
                });

                observer.unobserve(entry.target);
            }
        });
    };

    const statsObserver = new IntersectionObserver(statsObserverCallback, observerOptions);
    const statsSection = document.querySelector('.stats-section');

    if (statsSection) {
        statsObserver.observe(statsSection);
    }

    // Enhanced scroll effects for hero section
    const heroSection = document.querySelector('.hero-section');
    const heroContent = heroSection ? heroSection.querySelector('div') : null;

    if (heroSection && heroContent) {
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            const heroHeight = heroSection.offsetHeight;

            // Faster parallax effect (increased from 0.5 to 0.7)
            const parallax = scrolled * 0.7;
            heroSection.style.transform = `translateY(${parallax}px)`;

            // Calculate opacity and blur based on scroll position
            // Starts fading when scrolling begins, fully faded at hero section end
            const fadeProgress = Math.min(scrolled / heroHeight, 1);
            const opacity = 1 - fadeProgress;
            const blurAmount = fadeProgress * 2; // Max 2px blur

            // Apply opacity and blur to hero content
            heroContent.style.opacity = opacity;
            heroContent.style.filter = `blur(${blurAmount}px)`;
            heroContent.style.transform = `translateY(${scrolled * 0.3}px)`;
        });
    }
});
