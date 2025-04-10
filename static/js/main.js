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
            showDownloadSection(data.download_url);
        } else {
            alert('处理失败：' + data.message);
        }
    })
    .catch(error => {
        alert('请求失败：' + error.message);
    })
    .finally(() => toggleLoading(false));
}

function showDownloadSection(url) {
    const downloadSection = document.getElementById('downloadSection');
    const downloadLink = document.getElementById('downloadLink');
    downloadLink.href = url;
    downloadSection.style.display = 'block';
}

function toggleLoading(loading) {
    const btn = document.querySelector('button');
    btn.innerHTML = loading ? 
        '<span class="spinner-border spinner-border-sm" role="status"></span> 处理中...' : 
        '提交处理';
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