import { useState, useEffect, useRef} from 'react'
import { createPortal } from 'react-dom'
import { Toast } from 'bootstrap'
import { useSession } from 'next-auth/react'

import { API_BASE_URL } from '../config'
import { on } from 'events'

declare const bootstrap: {
  Toast: typeof Toast;
};

const expire_time_seconds = 15 * 60; // 二维码过期时间，转换为秒

// function startPaymentPolling(userId: string, orderType: string, outTradeNo: string) {
//     const maxPollCount = expire_time_seconds + 1; // 轮询次数
//     const pollInterval = 1000; // 每1秒轮询一次
    
//     let pollCount = 0; //maxPollCount;

//     const poll = async () => {
//         try {
//             const response = await fetch(`${API_BASE_URL}/gen_img/query_payment_status`, {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json',
//                 },
//                 body: JSON.stringify({
//                     user_id: userId,
//                     order_type: orderType,
//                     out_trade_no: outTradeNo
//                 })
//             });

//             if (!response.ok) {
//               throw new Error(`HTTP error! status: ${response.status}`)
//             }
            
//             const result = await response.json();
            
//             if (result.success) {
//                 if (result.paid) {
//                     alert('payment success, page will refresh in 1 second...');
//                     setTimeout(() => {
//                         window.location.reload();
//                     }, 1000);
//                     return;
//                 } else {
//                     alert('payment failed, page will refresh in 1 second...');
//                     setTimeout(() => {
//                         window.location.reload();
//                     }, 1000);
//                     return;
//                 }
//             }
            
//             // 继续轮询
//             pollCount++;
//             if (pollCount < maxPollCount) {
//                 setTimeout(poll, pollInterval);
//             } else {
//                 // console.log('payment timeout');
//                 // alert('payment timeout, page will refresh in 1 second...');
//                 // setTimeout(() => {
//                 //     window.location.reload();
//                 // }, 1000);
//                 return;
//             }
//         } catch (error) {
//             console.error('轮询出错:', error);
//             alert('get payment result error');
//         }
//     };
    
//     // 开始轮询
//     poll();
// }

export async function  getQrCodeUrl(email: string, payAmount: number, payType: number): Promise<string[] | null> {
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
            return null;
        }
        
        const blob = await response.blob();
        const qrCodeUrl = URL.createObjectURL(blob);
        // console.log("Generated QR code URL:", qrCodeUrl);

        const userId = response.headers.get('X-User-Id');
        const orderType = response.headers.get('X-Order-Type');
        const outTradeNo = response.headers.get('X-Order-Id');
        // console.log("Response headers:", { userId, orderType, outTradeNo });

        if (!(userId && orderType && outTradeNo)) {
            console.error("Missing required headers:", { userId, orderType, outTradeNo });
            alert("Missing required payment information from server");
            return null;
        }

        return [qrCodeUrl, userId, orderType, outTradeNo];
    } catch (error) {
        console.error('Failed to fetch wechat pay QR code:', error);
        alert(`Failed to fetch wechat pay QR code: ${error instanceof Error ? error.message : String(error)}`);
        return null;
    }
}

interface WechatPayModalProps {
    isOpen: boolean
    onClose: () => void
    payAmount: number
    qrUrl: string[] | null
  }
  
export default function WechatPayModal({ isOpen, onClose, payAmount, qrUrl}: WechatPayModalProps) {
  const [timeRemaining, setTimeRemaining] = useState(expire_time_seconds);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 倒计时函数
  const countdown = (currentTime: number) => {
    if (currentTime <= 0) {
      alert('payment timeout');
      onClose();
      return;
    }

    // 更新显示时间
    setTimeRemaining(currentTime);
    queryPaymentStatus();
    
    // 递归调用
    timeoutRef.current = setTimeout(() => {
      countdown(currentTime - 1);
    }, 1000);
  };

  useEffect(() => {
    if (isOpen && qrUrl) {
      // 开始倒计时
      setTimeRemaining(expire_time_seconds);
      countdown(expire_time_seconds);
    }

    // 清理函数
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [isOpen, qrUrl]);

  // 查询支付状态的函数
  const queryPaymentStatus = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/gen_img/query_payment_status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: qrUrl?.[1],
          order_type: qrUrl?.[2],
          out_trade_no: qrUrl?.[3]
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        if (result.paid) {
          alert('payment success, credits added');
        } else {
          alert('payment failed');
        }
        onClose();
      }
      
    } catch (error) {
      console.error('poll error:', error);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  };
  
  if (!isOpen || !qrUrl) return null

  const modalContent = (
    <>
      <div className={`modal fade ${isOpen ? 'show' : ''}`} 
            style={{ display: isOpen ? 'block' : 'none' }}>
          <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title text-center w-100">
                    <i className="fab fa-weixin me-2" style={{ color: '#07C160' }}></i>
                    WeChat Pay ￥{payAmount/100} CNY
                    
                    {/* <div className="small mt-2">￥{payAmount/100} CNY</div> */}
                </h5>
                <button type="button" className="btn-close" onClick={onClose} aria-label="Close"></button>
                {/* <div className="small text-muted mt-2">Please complete payment within 15 minutes</div> */}
              </div>
              <div className="modal-body text-center">
                <div className="qr-code-container">
                    <img id="qrCodeImage" src={qrUrl[0]} alt="QR Code" className="img-fluid mb-3" />
                    <div className="text-muted mt-2">Please complete payment within 15 minutes</div>
                    <div className="timer text-muted">
                      <i className="far fa-clock me-1"></i>
                      <span id="paymentTimer">{formatTime(timeRemaining)}</span> remaining
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
