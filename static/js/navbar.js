document.getElementById('pricingButton').addEventListener('click', async () => {
    try {
        console.log("Fetching QR code...");
        const response = await fetch('/get_pricing_qr');
        if (response.ok) {
            const blob = await response.blob();
            const qrCodeUrl = URL.createObjectURL(blob);
            console.log("qrCodeUrl:", qrCodeUrl);
            document.getElementById('qrCodeImage').src = qrCodeUrl;
            const qrCodeModal = new bootstrap.Modal(document.getElementById('qrCodeModal'));
            qrCodeModal.show();

            const userId = response.headers.get('X-User-Id');
            const orderType = response.headers.get('X-Order-Type');
            const outTradeNo = response.headers.get('X-Order-Id');

            // 开始轮询支付状态
            startPaymentPolling(userId, orderType, outTradeNo);
        } else {
            alert('Failed to load wechat pay QR code.');
        }
    } catch (error) {
        console.error('Error fetching QR code:', error);
    }
});


// 添加登录表单处理
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        })
        .then(response => response.json())
        .then(response => {
            if (response.ok) {
                // 不要刷新整个页面,而是只更新导航栏
                updateNavbarAfterLogin(email);
                // 关闭登录模态框
                const loginModal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
                loginModal.hide();
            } else {
                alert(response.msg);
            }
        })
    } catch (error) {
        console.error('Login error:', error);
        alert('Login failed. Please try again.');
    }
});

// 添加更新导航栏的函数
function updateNavbarAfterLogin(email) {
    // 隐藏登录和注册按钮
    document.getElementById('loginButton').style.display = 'none';
    document.getElementById('signupButton').style.display = 'none';
    
    // 显示用户下拉菜单
    const userDropdown = document.createElement('div');
    userDropdown.className = 'dropdown';
    userDropdown.innerHTML = `
        <button class="btn dropdown-toggle" type="button" id="userDropdown" data-bs-toggle="dropdown" aria-expanded="false">
            ${email}
        </button>
        <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="userDropdown">
            <li><button class="dropdown-item" onclick="handleLogout()">Log out</button></li>
        </ul>
    `;
    
    // 添加到导航栏
    document.querySelector('.navbar .d-flex:last-child').appendChild(userDropdown);
}


// 添加注册表单处理
document.getElementById('signupForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (!email || !password || !confirmPassword) {
        alert('All fields are required!');
        return;
    }

    if (password !== confirmPassword) {
        alert('Passwords do not match!');
        return;
    }

    try {
        const response = await fetch('/api/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        })
        .then(response => response.json())
        .then(response => {
            if (response.ok) {
                alert('Registration successful! Please log in.');
                const signupModal = bootstrap.Modal.getInstance(document.getElementById('signupModal'));
                signupModal.hide();
                const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
                loginModal.show();
            } else {
                alert(response.msg);
            }
        })
    } catch (error) {
        console.error('Signup error:', error);
        alert('Registration failed. Please try again.');
    }
});

// 添加导航栏滚动效果
document.addEventListener('DOMContentLoaded', function() {
    const navbar = document.querySelector('.navbar');
    let lastScrollTop = 0;

    window.addEventListener('scroll', function() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        // 添加/移除滚动样式
        if (scrollTop > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        lastScrollTop = scrollTop;
    });
});


function switchToSignup() {
    // 隐藏登录模态框
    const loginModal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
    loginModal.hide();
    
    // 显示注册模态框
    const signupModal = new bootstrap.Modal(document.getElementById('signupModal'));
    signupModal.show();
};

function switchToLogin(){
    // 隐藏注册模态框
    const signupModal = bootstrap.Modal.getInstance(document.getElementById('signupModal'));
    signupModal.hide();
    
    // 显示登录模态框
    const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
    loginModal.show();
};

async function handleLogout() {
    try {
        const response = await fetch('/api/logout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            updateNavbarAfterLogout();
        } else {
            alert('Logout failed. Please try again.');
        }
    } catch (error) {
        console.error('Logout error:', error);
        alert('Logout failed. Please try again.');
    }
}

// 添加登出后更新导航栏的函数
function updateNavbarAfterLogout() {
    // 移除用户下拉菜单
    const userDropdown = document.querySelector('.navbar .dropdown');
    if (userDropdown) {
        userDropdown.remove();
    }
    
    // 显示登录和注册按钮
    document.getElementById('loginButton').style.display = '';
    document.getElementById('signupButton').style.display = '';
}