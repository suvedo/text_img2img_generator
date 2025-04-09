from flask import Flask, send_file
app = Flask(__name__)

@app.route('/image/<filename>')
def get_image(filename):
    return send_file(f'/root/data/{filename}', mimetype='image/jpeg')  # 直接返回图片流 [9,10](@ref)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000)