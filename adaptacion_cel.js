document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.getElementById('sidebar');
    const btnToggleMenu = document.getElementById('btn-toggle-menu');

    document.addEventListener('click', (event) => {
        if (window.innerWidth <= 768 && sidebar && sidebar.classList.contains('mobile-open')) {
            

            const clickEnSidebar = sidebar.contains(event.target);
            const clickEnBoton = btnToggleMenu ? btnToggleMenu.contains(event.target) : false;

            if (!clickEnSidebar && !clickEnBoton) {
                sidebar.classList.remove('mobile-open');
            }
        }
    });

    let touchStartX = 0;
    let touchEndX = 0;
    const umbralSwipe = 50; 

    document.addEventListener('touchstart', (event) => {
        touchStartX = event.changedTouches[0].screenX;
    }, { passive: true });

    
    document.addEventListener('touchend', (event) => {
        touchEndX = event.changedTouches[0].screenX;
        procesarGesto();
    }, { passive: true });

    function procesarGesto() {
        
        if (window.innerWidth > 768 || !sidebar) return;

        
        if (touchEndX < touchStartX - umbralSwipe) {
            if (sidebar.classList.contains('mobile-open')) {
                sidebar.classList.remove('mobile-open');
            }
        }
        
        
        if (touchEndX > touchStartX + umbralSwipe) {
 
            if (touchStartX < 30 && !sidebar.classList.contains('mobile-open')) {
                sidebar.classList.add('mobile-open');
            }
        }
    }

    window.addEventListener('resize', () => {

        if (window.innerWidth > 768 && sidebar) {
            sidebar.classList.remove('mobile-open');
        }
    });
});
