import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Toast } from 'bootstrap'
import { useSession } from 'next-auth/react'

import { API_BASE_URL } from '../config'

declare const bootstrap: {
  Toast: typeof Toast;
};


function startPaymentPolling(userId: string, orderType: string, outTradeNo: string) {
    let pollCount = 0;
    const maxPollCount = 905; // 最多轮询905次，略多于15分钟
    const pollInterval = 1000; // 每1秒轮询一次
    
    const poll = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/gen_img/query_payment_status`, {
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

            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`)
            }
            
            const result = await response.json();
            
            if (result.success) {
                if (result.paid) {
                    alert('payment success, page will refresh in 3 seconds...');
                    setTimeout(() => {
                        window.location.reload();
                    }, 3000);
                    return;
                } else {
                    alert('payment failed, page will refresh in 3 seconds...');
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
                console.log('payment timeout');
                alert('payment timeout, page will refresh in 3 seconds...');
                setTimeout(() => {
                    window.location.reload();
                }, 3000);
                return;
            }
        } catch (error) {
            console.error('轮询出错:', error);
            alert('get payment result error');
        }
    };
    
    // 开始轮询
    poll();
}

export async function  getQrCodeUrl(email: string, payAmount: number, payType: number): Promise<string> {
    try {
        console.log("Fetching QR code for amount:", payAmount);
        const formData = new FormData();
        formData.append('user', JSON.stringify({
            email: email,
            name: email,
            id: email
        }));
        formData.append('amount', String(payAmount));
        formData.append('orderType', String(payType));
        
        const response = await fetch(`${API_BASE_URL}/gen_img/get_pricing_qr`, {
            method: 'POST',
            body: formData
        });
        console.log("Response status:", response.status);
        
        if (!response.ok) {
            const errorText = response.text();
            console.error("Error response:", errorText);
            alert(`Failed to load wechat pay QR code. Status: ${response.status}, Error: ${errorText}`);
            return "";
        }
        
        const blob = await response.blob();
        const qrCodeUrl = URL.createObjectURL(blob);
        console.log("Generated QR code URL:", qrCodeUrl);

        const userId = response.headers.get('X-User-Id');
        const orderType = response.headers.get('X-Order-Type');
        const outTradeNo = response.headers.get('X-Order-Id');
        console.log("Response headers:", { userId, orderType, outTradeNo });

        if (userId && orderType && outTradeNo) {
            startPaymentPolling(userId, orderType, outTradeNo);
        } else {
            console.error("Missing required headers:", { userId, orderType, outTradeNo });
            alert("Missing required payment information from server");
            return "";
        }

        return qrCodeUrl;
    } catch (error) {
        console.error('Failed to fetch wechat pay QR code:', error);
        alert(`Failed to fetch wechat pay QR code: ${error instanceof Error ? error.message : String(error)}`);
        return "";
    }
}

interface WechatPayModalProps {
    isOpen: boolean
    onClose: () => void
    payAmount: number
    qrUrl: string | undefined
  }
  
export default function WechatPayModal({ isOpen, onClose, payAmount, qrUrl}: WechatPayModalProps) {
    if (!isOpen) return null

    const modalContent = (
      <>
        <div className={`modal fade ${isOpen ? 'show' : ''}`} 
             style={{ display: isOpen ? 'block' : 'none' }}>
            <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
                <div className="modal-header">
                <h5 className="modal-title text-center w-100">
                    <i className="fab fa-weixin me-2" style={{ color: '#07C160' }}></i>
                    WeChat Payment
                    <div className="small text-muted mt-2">Please complete payment within 15 minutes</div>
                </h5>
                <button type="button" className="btn-close" onClick={onClose} aria-label="Close"></button>
                </div>
                <div className="modal-body text-center">
                <div className="qr-code-container">
                    <img id="qrCodeImage" src={qrUrl} alt="QR Code" className="img-fluid mb-3" />
                    <div className="timer">
                    <i className="far fa-clock me-1"></i>
                    <span id="paymentTimer">15:00</span> remaining
                    </div>
                </div>
                </div>
            </div>
            </div>
        </div>
        {isOpen && (
          <div className="modal-backdrop fade show"></div>
        )}

        {/* Toast 消息 */}
      {/* <div className="toast-container position-fixed top-50 start-50 translate-middle" style={{ zIndex: 9999 }}>
        
        <div id="paymentSuccessToast" className="toast" role="alert" aria-live="assertive" aria-atomic="true" data-bs-delay="3000">
          <div className="toast-header bg-success text-white">
            <strong className="me-auto">payment successful</strong>
            <button type="button" className="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
          </div>
          <div className="toast-body">
            payment complete, page will refresh shortly...
          </div>
        </div>

        <div id="paymentFailedToast" className="toast" role="alert" aria-live="assertive" aria-atomic="true" data-bs-delay="3000">
          <div className="toast-header bg-success text-white">
            <strong className="me-auto">payment failed</strong>
            <button type="button" className="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
          </div>
          <div className="toast-body">
            payment incomplete, page will refresh shortly...
          </div>
        </div>

        <div id="paymentFailedTimeoutToast" className="toast" role="alert" aria-live="assertive" aria-atomic="true" data-bs-delay="3000">
          <div className="toast-header bg-success text-white">
            <strong className="me-auto">payment timed out</strong>
            <button type="button" className="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
          </div>
          <div className="toast-body">
            payment incomplete, page will refresh shortly...
          </div>
        </div>
      </div> */}
    </>
  )

  // 使用 Portal 将模态框渲染到 body
  return createPortal(modalContent, document.body)
}
