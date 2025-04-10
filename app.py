import os
from datetime import datetime
from flask import Flask, render_template, request, jsonify, send_from_directory
from werkzeug.utils import secure_filename

app = Flask(__name__)
app.config.from_pyfile('config.py')

# 确保上传和输出目录存在
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs(app.config['OUTPUT_FOLDER'], exist_ok=True)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/process', methods=['POST'])
def process():
    try:
        # 处理图片上传
        if 'image' not in request.files:
            return jsonify(success=False, message="未上传图片")
        
        file = request.files['image']
        if file.filename == '':
            return jsonify(success=False, message="未选择文件")
        
        # 保存原始图片
        filename = secure_filename(file.filename)
        upload_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(upload_path)
        
        # 获取文本内容
        text_content = request.form.get('text', '')
        
        ####################################
        # 此处添加业务处理逻辑
        # 示例：生成一个空白图片
        from PIL import Image
        output_filename = f"processed_{datetime.now().strftime('%Y%m%d%H%M%S')}.png"
        output_path = os.path.join(app.config['OUTPUT_FOLDER'], output_filename)
        Image.new('RGB', (800, 600), (255, 255, 255)).save(output_path)
        ####################################
        
        return jsonify(
            success=True,
            download_url=f"/download/{output_filename}"
        )
        
    except Exception as e:
        return jsonify(success=False, message=str(e))

@app.route('/download/<filename>')
def download_file(filename):
    return send_from_directory(
        app.config['OUTPUT_FOLDER'],
        filename,
        as_attachment=True
    )

if __name__ == '__main__':
    app.run(debug=True)