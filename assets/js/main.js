document.addEventListener('DOMContentLoaded', () => {
    // === 0. Preloader & Scroll Animations ===
    const preloader = document.createElement('div');
    preloader.className = 'preloader';
    preloader.innerHTML = '<i class="fa-solid fa-fire fa-beat" style="font-size: 4rem; color: var(--primary);"></i><h2 style="margin-right:15px;color:#fff;font-weight:900;">فليمز</h2>';
    document.body.appendChild(preloader);
    
    window.addEventListener('load', () => {
        preloader.classList.add('hide');
        setTimeout(() => preloader.remove(), 500);
        
        // Setup Intersection Observer for scroll reveal AFTER load
        const observerOptions = { threshold: 0.15, rootMargin: '0px 0px -50px 0px' };
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if(entry.isIntersecting) {
                    entry.target.classList.add('active');
                }
            });
        }, observerOptions);

        document.querySelectorAll('.anim-fade').forEach(el => observer.observe(el));
    });

    // === 1. LocalStorage Management ===
    let cart = JSON.parse(localStorage.getItem('flames_cart')) || [];
    updateCartBadge();

    // === 2. Add to Cart Handling (index & menu) ===
    const addButtons = document.querySelectorAll('.add-btn');
    addButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const card = btn.closest('.food-card');
            const id = card.getAttribute('data-id');
            const title = card.querySelector('.food-title').innerText;
            const priceText = card.querySelector('.food-price').innerText;
            const price = parseFloat(priceText.replace(/[^\d.]/g, ''));
            const img = card.querySelector('img').src;

            addToCart({ id, title, price, img });
            showToast(`تم إضافة ${title} إلى السلة!`);
            
            // Visual click effect
            btn.innerHTML = '<i class="fa-solid fa-check"></i>';
            btn.style.background = '#10b981';
            btn.style.borderColor = '#10b981';
            setTimeout(() => {
                btn.innerHTML = '<i class="fa-solid fa-plus"></i>';
                btn.style.background = '';
                btn.style.borderColor = '';
            }, 1000);
        });
    });

    function addToCart(item) {
        const existing = cart.find(i => i.id === item.id);
        if (existing) {
            existing.quantity += 1;
        } else {
            cart.push({ ...item, quantity: 1 });
        }
        saveCart();
    }

    // === 3. Cart Page Rendering (Only runs on cart.html) ===
    const cartItemsContainer = document.getElementById('cart-items-container');
    if (cartItemsContainer) {
        renderCartPage();
    }

    function renderCartPage() {
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = `<div style="text-align:center; padding: 50px 0; color: var(--text-muted);">
                <i class="fa-solid fa-basket-shopping" style="font-size: 4rem; opacity: 0.5; margin-bottom: 20px;"></i>
                <h3>السلة فارغة حالياً</h3>
                <a href="menu.html" class="btn btn-primary" style="margin-top: 20px;">تصفح المنيو</a>
            </div>`;
            document.getElementById('cart-subtotal').innerText = '0 ج.م';
            document.getElementById('cart-total').innerText = '0 ج.م';
            return;
        }

        let html = '';
        let subtotal = 0;

        cart.forEach(item => {
            subtotal += (item.price * item.quantity);
            html += `
            <div class="cart-item anim-fade" style="background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius); padding: 20px; display: flex; gap: 25px; margin-bottom: 20px; position: relative;">
                <img src="${item.img}" style="width: 100px; height: 100px; border-radius: 50%; object-fit: cover;">
                <div style="flex:1;">
                    <h3 style="font-size: 1.3rem; margin-bottom: 10px;">${item.title}</h3>
                    <div style="color: var(--primary); font-size: 1.2rem; font-weight: 800;">${item.price} ج.م</div>
                </div>
                <div style="display: flex; gap: 15px; align-items: center; background: rgba(255,255,255,0.05); padding: 5px 15px; border-radius: var(--radius-round); height: fit-content; align-self: center;">
                    <button class="cart-minus" data-id="${item.id}" style="background:none; border:none; color:#fff; cursor:pointer; font-size: 1.2rem;">-</button>
                    <span style="font-weight: 800; font-size: 1.1rem; width: 20px; text-align: center;">${item.quantity}</span>
                    <button class="cart-plus" data-id="${item.id}" style="background:none; border:none; color:var(--primary); cursor:pointer; font-size: 1.2rem;">+</button>
                </div>
                <button class="cart-remove-btn" data-id="${item.id}" style="position: absolute; top: 15px; left: 15px; background: none; border: none; color: #ef4444; font-size: 1.2rem; cursor: pointer;"><i class="fa-solid fa-trash-can"></i></button>
            </div>
            `;
        });

        cartItemsContainer.innerHTML = html;
        document.getElementById('cart-subtotal').innerText = `${subtotal} ج.م`;
        const total = subtotal > 0 ? subtotal + 25 : 0; // 25 shipping
        document.getElementById('cart-total').innerText = `${total} ج.م`;

        // Bind events to rendered buttons
        document.querySelectorAll('.cart-minus').forEach(b => b.addEventListener('click', () => changeQuantity(b.dataset.id, -1)));
        document.querySelectorAll('.cart-plus').forEach(b => b.addEventListener('click', () => changeQuantity(b.dataset.id, 1)));
        document.querySelectorAll('.cart-remove-btn').forEach(b => b.addEventListener('click', () => removeItem(b.dataset.id)));
    }

    function changeQuantity(id, delta) {
        let item = cart.find(i => i.id === id);
        if (item) {
            item.quantity += delta;
            if (item.quantity <= 0) {
                cart = cart.filter(i => i.id !== id);
            }
            saveCart();
            renderCartPage();
        }
    }

    function removeItem(id) {
        cart = cart.filter(i => i.id !== id);
        saveCart();
        renderCartPage();
        showToast('تمت الإزالة من السلة');
    }

    // === Global Utilities ===
    function saveCart() {
        localStorage.setItem('flames_cart', JSON.stringify(cart));
        updateCartBadge();
    }

    // Makes it available globally if needed by inline handlers
    window.clearCart = function() {
        cart = [];
        saveCart();
    }

    function updateCartBadge() {
        const badges = document.querySelectorAll('.cart-badge');
        const count = cart.reduce((sum, item) => sum + item.quantity, 0);
        badges.forEach(b => {
            b.innerText = count;
            b.style.transform = 'scale(1.3)';
            setTimeout(() => b.style.transform = 'scale(1)', 200);
        });
    }

    function showToast(message) {
        let toast = document.getElementById('toast-notification');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'toast-notification';
            toast.className = 'toast-msg';
            toast.innerHTML = `<i class="fa-solid fa-circle-check text-primary"></i> <span id="toast-text"></span>`;
            document.body.appendChild(toast);
        }
        document.getElementById('toast-text').innerText = message;
        
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    }
});
