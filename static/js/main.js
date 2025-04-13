function handleSubmit() {
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
            alert('failed:' + data.message);
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
        const response = await fetch('/get_pricing_qr');
        if (response.ok) {
            const blob = await response.blob();
            const qrCodeUrl = URL.createObjectURL(blob);
            console.log("qrCodeUrl:", qrCodeUrl);
            document.getElementById('qrCodeImage').src = qrCodeUrl;
            const qrCodeModal = new bootstrap.Modal(document.getElementById('qrCodeModal'));
            qrCodeModal.show();
        } else {
            alert('Failed to load wechat pay QR code.');
        }
    } catch (error) {
        console.error('Error fetching QR code:', error);
    }
});