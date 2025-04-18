// 初始化所有的 Toast 组件
document.addEventListener('DOMContentLoaded', function() {
    const toastElList = [].slice.call(document.querySelectorAll('.toast'));
    toastElList.map(function(toastEl) {
        return new bootstrap.Toast(toastEl, {
            autohide: true,
            delay: 3000
        });
    });

    // 调用图片上传初始化函数
    initializeImageUpload();
    
    // 初始化模板点击事件
    document.querySelectorAll('.prompt-template').forEach(item => {
        item.addEventListener('click', function() {
            const textInput = document.getElementById('textInput');
            textInput.value = this.textContent;
        });
    });
});

function initializeImageUpload() {
    const fileInput = document.getElementById('imageUpload');
    const uploadContainer = document.getElementById('uploadContainer');
    const imagePreviewContainer = document.getElementById('imagePreviewContainer');

    if (!fileInput || !uploadContainer || !imagePreviewContainer) {
        console.error('无法初始化文件上传功能，找不到必要元素');
        return;
    }

    fileInput.addEventListener('change', function(e) {
        if (this.files && this.files[0]) {
            // 创建预览容器
            const previewWrapper = document.createElement('div');
            previewWrapper.className = 'preview-wrapper position-relative';
            
            // 创建预览图片
            const img = document.createElement('img');
            img.classList.add('preview-image');
            img.src = URL.createObjectURL(this.files[0]);
            
            // 创建删除按钮
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-image-btn';
            deleteBtn.innerHTML = '<i class="fas fa-times"></i>';
            deleteBtn.onclick = function(e) {
                e.preventDefault();
                // 清空文件输入
                fileInput.value = '';
                // 显示上传容器
                uploadContainer.classList.remove('d-none');
                // 隐藏预览容器
                imagePreviewContainer.classList.add('d-none');
                // 清空预览容器
                imagePreviewContainer.innerHTML = '';
            };
            
            // 组装预览界面
            previewWrapper.appendChild(img);
            previewWrapper.appendChild(deleteBtn);
            
            // 清空并更新预览容器
            imagePreviewContainer.innerHTML = '';
            imagePreviewContainer.appendChild(previewWrapper);
            
            // 切换显示状态
            uploadContainer.classList.add('d-none');
            imagePreviewContainer.classList.remove('d-none');
        }
    });
}

async function handleSubmit() {
    const fileInput = document.getElementById('imageUpload');
    const textInput = document.getElementById('textInput').value;
    
    // 检查元素是否存在
    if (!fileInput || !textInput) {
        alert('please upload your image and input your prompt or use prompt template');
        return;
    }

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


// // 图片预览功能
// document.getElementById('imageUpload').addEventListener('change', function(e) {
//     const preview = document.getElementById('preview');
//     preview.innerHTML = '';
    
//     if (this.files && this.files[0]) {
//         const img = document.createElement('img');
//         img.classList.add('preview-image');
//         img.src = URL.createObjectURL(this.files[0]);
//         preview.appendChild(img);
//     }
// });

// document.querySelectorAll('.prompt-template').forEach(item => {
//     item.addEventListener('click', function() {
//         const textInput = document.getElementById('textInput');
//         textInput.value = this.textContent; // 将模板内容填充到输入框
//     });
// });
