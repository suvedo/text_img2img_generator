async function handleSubmit() {
    const fileInput = document.getElementById('imageUpload');
    const textInput = document.getElementById('textInput').value;
    const formData = new FormData();

    if (fileInput.files.length === 0) {
        alert('please upload your image first');
        return;
    }

    formData.append('image', fileInput.files[0]);
    formData.append('text', textInput);

    toggleLoading(true);

    fetch('/process', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showGeneratedImage(data.img_path);
            // console.info('finish generating image');
        } else {
            if (!data.isAuthenticated) {
                // 显示登录模态框
                const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
                loginModal.show();
            } else {
                alert('failed:' + data.message);
            }
        }
    })
    .catch(error => {
        alert('failed:' + error.message);
    })
    .finally(() => toggleLoading(false));
}

function showGeneratedImage(path) {
    const generatedPreview = document.getElementById('generatedPreview');
    generatedPreview.innerHTML = ''; // 清空之前的内容

    const img = document.createElement('img');
    img.src = path;
    img.alt = 'Generated Image';
    img.style.maxWidth = '100%';
    img.style.border = '1px solid #ddd';
    img.style.borderRadius = '5px';
    img.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
    generatedPreview.appendChild(img);
}

// function downLoadImageFromHf(url) {
//     // const downloadSection = document.getElementById('downloadSection');
//     // const downloadLink = document.getElementById('downloadLink');
//     // downloadLink.href = url;
//     // downloadSection.style.display = 'block';

//     const payload = { "url": url };
//     fetch('/download', {
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/json', // 必须与后端匹配[1,6](@ref)
//         },
//         body: JSON.stringify(payload)
//     }).then(response => response.json())
//     .then(data => {
//         if (data.success) {
//             console.log('Image downloaded successfully:', data.img_url);
//             showGeneratedImage(data.img_url)
//         } else {
//             console.error('Error:', 'failed to download image');
//         }
//     })

//     // try {
//     //     const response = fetch('/download/'+url);
//     //     const data = response.json();
//     //     console.log(data.message);  // 输出: "Hello, Alice! This is..."
//     // } catch (error) {
//     //     console.error('failed:', error);
//     // }
// }

function toggleLoading(loading) {
    const btn = document.getElementById('generateButton'); // 只操作特定按钮
    if (btn) {
        btn.innerHTML = loading ? 
            '<span class="spinner-border spinner-border-sm" role="status"></span> generating...' : 
            'generate image';
    }
}

function startPaymentPolling(userId, orderType, outTradeNo) {
    let pollCount = 0;
    const maxPollCount = 905; // 最多轮询905次，略多于15分钟
    const pollInterval = 1000; // 每1秒轮询一次
    
    const poll = async () => {
        try {
            const response = await fetch('/query_payment_status', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_id: userId,
                    order_type: orderType,
                    out_trade_no: outTradeNo
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                if (result.paid) {
                    // 显示支付成功的 Toast
                    const toastElement = document.getElementById('paymentSuccessToast');
                    const toast = bootstrap.Toast.getInstance(toastElement) || new bootstrap.Toast(toastElement);
                    toast.show();
                    
                    setTimeout(() => {
                        window.location.reload();
                    }, 3000);
                    return;
                } else {
                    // 显示支付失败的 Toast
                    const toastElement = document.getElementById('paymentFailedToast');
                    const toast = bootstrap.Toast.getInstance(toastElement) || new bootstrap.Toast(toastElement);
                    toast.show();
                    
                    setTimeout(() => {
                        window.location.reload();
                    }, 3000);
                    return;
                }
            }
            
            // 继续轮询
            pollCount++;
            if (pollCount < maxPollCount) {
                setTimeout(poll, pollInterval);
            } else {
                console.log('支付超时');
                // 显示支付失败的 Toast
                const toastElement = document.getElementById('paymentFailedTimeoutToast');
                const toast = bootstrap.Toast.getInstance(toastElement) || new bootstrap.Toast(toastElement);
                toast.show();
                
                setTimeout(() => {
                    window.location.reload();
                }, 3000);
                return;
            }
        } catch (error) {
            console.error('轮询出错:', error);
        }
    };
    
    // 开始轮询
    poll();
}

// 初始化所有的 Toast 组件
document.addEventListener('DOMContentLoaded', function() {
    const toastElList = [].slice.call(document.querySelectorAll('.toast'));
    toastElList.map(function(toastEl) {
        return new bootstrap.Toast(toastEl, {
            autohide: true,
            delay: 3000
        });
    });
});

// 图片预览功能
document.getElementById('imageUpload').addEventListener('change', function(e) {
    const preview = document.getElementById('preview');
    preview.innerHTML = '';
    
    if (this.files && this.files[0]) {
        const img = document.createElement('img');
        img.classList.add('preview-image');
        img.src = URL.createObjectURL(this.files[0]);
        preview.appendChild(img);
    }
});

document.querySelectorAll('.prompt-template').forEach(item => {
    item.addEventListener('click', function() {
        const textInput = document.getElementById('textInput');
        textInput.value = this.textContent; // 将模板内容填充到输入框
    });
});

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
                location.reload();
            } else {
                alert(response.msg);
            }
        })
    } catch (error) {
        console.error('Login error:', error);
        alert('Login failed. Please try again.');
    }
});


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
            alert('Logout successful!');
            location.reload();
        } else {
            alert('Logout failed. Please try again.');
        }
    } catch (error) {
        console.error('Logout error:', error);
        alert('Logout failed. Please try again.');
    }
}


