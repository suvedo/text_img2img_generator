import qrcode

def gen_qr_img_from_url(url):
    qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
    qr.add_data(url)
    qr.make(fit=True)

    # 将二维码保存到内存
    img = qr.make_image(fill_color="black", back_color="white")

    return img