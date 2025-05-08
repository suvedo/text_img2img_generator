import smtplib
import traceback

from utils.log_util import logger

# 邮件发送服务
def send_email(request_id, smtp_host, smtp_port, smtp_user, smtp_pass, to_email, msg):
    # logger.info(f"request_id={request_id}, {smpt_user}, {smpt_pass}")
    try:
        # 创建 SMTP 连接
        server = smtplib.SMTP(smtp_host, smtp_port)
        server.starttls()  # 启用 TLS
        server.login(smtp_user, smtp_pass)
        
        server.sendmail(smtp_user, [to_email], msg)
        logger.info(f"request_id={request_id}, email sent successfully")
        return True
    except Exception as e:
        logger.info(f"request_id={request_id}, send mail failed: {traceback.format_exc()}")
        return False
    finally:
        # 安全关闭连接
        if server:
            try:
                server.quit()
            except Exception as e:
                logger.warning(f"request_id={request_id}, error closing SMTP connection: {str(e)}")