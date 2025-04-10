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
            alert('failed:' + data.message);
        }
    })
    .catch(error => {
        alert('failed:' + error.message);
    })
    .finally(() => toggleLoading(false));
}

function showDownloadSection(url) {
    // const downloadSection = document.getElementById('downloadSection');
    // const downloadLink = document.getElementById('downloadLink');
    // downloadLink.href = url;
    // downloadSection.style.display = 'block';

    const payload = { "url": url };
    fetch('/download', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json', // 必须与后端匹配[1,6](@ref)
        },
        body: JSON.stringify(payload)
    })

    // try {
    //     const response = fetch('/download/'+url);
    //     const data = response.json();
    //     console.log(data.message);  // 输出: "Hello, Alice! This is..."
    // } catch (error) {
    //     console.error('failed:', error);
    // }
}

function toggleLoading(loading) {
    const btn = document.querySelector('button');
    btn.innerHTML = loading ? 
        '<span class="spinner-border spinner-border-sm" role="status"></span> generating...' : 
        'generate image';
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