document.addEventListener('DOMContentLoaded', () => {
    // 1. 處理平滑捲動 (Smooth Scrolling)
    // 適用於 Hero 的「開始旅程」按鈕和總覽地圖的熱點
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // ================= 彈出視窗 (Modal) 邏輯 =================

    // 獲取所有觸發 Modal 的按鈕
    const modalButtons = document.querySelectorAll('.modal-btn');
    // 獲取所有關閉按鈕
    const closeButtons = document.querySelectorAll('.close-btn');
    // 獲取所有 Modal 遮罩層
    const modals = document.querySelectorAll('.modal-overlay');

    // 開啟 Modal 的函式
    function openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('show');
            document.body.style.overflow = 'hidden'; // 防止背景捲動
        }
    }

    // 關閉所有 Modal 的函式
    function closeAllModals() {
        modals.forEach(modal => {
            modal.classList.remove('show');
        });
        document.body.style.overflow = ''; // 恢復背景捲動
    }

    // 為每個觸發按鈕添加點擊事件
    modalButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const modalId = btn.getAttribute('data-modal');
            openModal(modalId);
        });
    });

    // 為每個關閉按鈕添加點擊事件
    closeButtons.forEach(btn => {
        btn.addEventListener('click', closeAllModals);
    });

    // 點擊遮罩層背景時也關閉 Modal
    modals.forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeAllModals();
            }
        });
    });

    // 按下 ESC 鍵關閉 Modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeAllModals();
        }
    });
});