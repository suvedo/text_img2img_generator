import { useState, ChangeEvent, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Head from 'next/head'
import Navbar from '../components/Navbar'
import LoginModal from '../components/LoginModal'

export default function Home() {
  const { data: session, status } = useSession()
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [prompt, setPrompt] = useState('')
  const [isInitialized, setIsInitialized] = useState(false)
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImagePath, setGeneratedImagePath] = useState<string | null>(null)

  // Debug session state
  useEffect(() => {
    console.log('Session status:', status)
    console.log('Session data:', session)
  }, [session, status])

  // 模板数据
  const promptTemplates = [
    "The image showcases a dynamic fantasy character with long, flowing pink hair, fox-like ears, and a confident pose. She wears a red and gold outfit with intricate detailing, including a short, asymmetrical top and high-waisted dark leggings, exposing her midriff. She gracefully wields a large, ornate parasol adorned with red and gold, with a ribbon and a hanging bell tied near the handle. The background is filled with warm, glowing light, floating autumn leaves, and blurred lanterns, creating a festive, magical ambiance. The character’s fox tail, confident expression, and dynamic movement add to the sense of energy and enchantment in the scene. The overall color palette is warm, with rich reds, golds, and oranges dominating the image.",
    "The image features a fantastical, ethereal female figure floating gracefully through a celestial, dreamlike atmosphere. She wears ornate, golden armor pieces and a flowing, vibrant costume in orange, blue, and gold hues. Her long, dark hair is adorned with intricate golden headpieces, and she delicately plays a stylized string instrument resembling a pipa or lute. Surrounding her are swirling ribbons of light and color, which seem to dance with her movement. The background resembles a cosmic mural, blending starry skies with a painterly landscape of clouds and mythic patterns. The entire composition conveys elegance, motion, and divinity, suggesting she may be a goddess, spirit, or celestial muse drawn from Eastern mythology or fantasy art.", 
    "A masterpiece of dreamy photography. The girl holds a glowing glass jar in her hands, which emits a soft yellow light, illuminating her face and the surrounding environment. She wears a white lace dress with blue and pink decorations and a light blue bow tied around her waist. The girl wears a white headdress dotted with blue and pink flowers and carries twinkling blue wings on her back. Behind the girl, you can see a vast sea of ​​flowers, which sparkle with pink and gold light and are scattered on the green grass. The sky is full of sparkling stars, from the upper left corner to the lower right corner, as if the Milky Way is scattered in the night sky. The overall light is soft and full of magical colors, making the whole picture look like a fairy tale world",
    "Full body shot of young Asian face woman in sun hat and white dress standing on sunny beach with sea and mountains in background, high quality, sharp focus.",
    "A beautiful girl reading book, high quality."
  ]

  // 在客户端初始化时恢复保存的状态
  useEffect(() => {
    if (!isInitialized) {
      const savedPreviewUrl = localStorage.getItem('savedPreviewUrl')
      const savedPrompt = localStorage.getItem('savedPrompt')
      const savedImageBase64 = localStorage.getItem('savedImageBase64')

      if (savedPreviewUrl) setPreviewUrl(savedPreviewUrl)
      if (savedPrompt) setPrompt(savedPrompt)
      
      if (savedImageBase64) {
        fetch(savedImageBase64)
          .then(res => res.blob())
          .then(blob => {
            const file = new File([blob], 'restored-image', { type: blob.type })
            setImageFile(file)
          })
          .catch(console.error)
      }

      setIsInitialized(true)
    }
  }, [isInitialized])

  // 在组件挂载时检查是否有保存的base64图片
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedPreviewUrl = localStorage.getItem('savedPreviewUrl')
      const savedPrompt = localStorage.getItem('savedPrompt')
      const savedImageBase64 = localStorage.getItem('savedImageBase64')

      if (savedPreviewUrl) setPreviewUrl(savedPreviewUrl)
      if (savedPrompt) setPrompt(savedPrompt)
      if (savedImageBase64) {
        // 将base64转换回File对象
        fetch(savedImageBase64)
          .then(res => res.blob())
          .then(blob => {
            const file = new File([blob], 'restored-image', { type: blob.type })
            setImageFile(file)
          })
          .catch(console.error)
      }
    }
  }, [])

  // 保存状态到localStorage
  const saveStateToStorage = () => {
    if (imageFile) {
      const reader = new FileReader()
      reader.onloadend = () => {
        localStorage.setItem('savedImageBase64', reader.result as string)
      }
      reader.readAsDataURL(imageFile)
    }
    if (previewUrl) {
      localStorage.setItem('savedPreviewUrl', previewUrl)
    }
    if (prompt) {
      localStorage.setItem('savedPrompt', prompt)
    }
  }

  // 在状态改变时保存
  useEffect(() => {
    if (isInitialized) {
      saveStateToStorage()
    }
  }, [imageFile, previewUrl, prompt, isInitialized])

  // 清除保存的状态
  const clearSavedState = () => {
    localStorage.removeItem('savedImageBase64')
    localStorage.removeItem('savedPreviewUrl')
    localStorage.removeItem('savedPrompt')
  }

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setImageFile(file)
      setPreviewUrl(URL.createObjectURL(file))

      if (file) {
        const reader = new FileReader()
        reader.onloadend = () => {
          localStorage.setItem('savedImageBase64', reader.result as string)
        }
        reader.readAsDataURL(file)
      }
    
      localStorage.setItem('savedPreviewUrl', previewUrl)
      
    }
  }

  const updatePrompt = (newPrompt: string) => {
    setPrompt(newPrompt)
    localStorage.setItem('savedPrompt', newPrompt)
  }

  const handleSubmit = async () => {
    if (!imageFile || !prompt) {
      alert('Please upload an image and enter a prompt')
      return
    }

    // 等待 session 加载完成
    if (status === 'loading') {
      return
    }

    // 检查登录状态
    if (status !== 'authenticated' || !session?.user) {
      setIsLoginModalOpen(true)
      return
    }

    const formData = new FormData()
    formData.append('image', imageFile)
    formData.append('text', prompt)
    // 添加用户信息
    formData.append('user', JSON.stringify({
      email: session.user.email,
      name: session.user.name,
      id: session.user.id
    }))

    setIsGenerating(true)

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 600000); // 10分钟超时

        const res = await fetch('/gen_img/process', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
          },
          body: formData,
          signal: controller.signal
        }).catch(error => {
          if (error.name === 'AbortError') {
            throw new Error('Request timed out after 5 minutes');
          }
          throw error;
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const data = await res.json();
        
        if (data.success) {
          setGeneratedImagePath(data.img_id);
        } else if (!data.isAuthenticated) {
          setIsLoginModalOpen(true);
        } else {
          console.error("Generate image failed:", data.message);
          alert('Failed to generate image: ' + data.message);
        }
    } catch (error) {
      console.error('Error during image generation:', error);
      if (error.message.includes('timed out')) {
        alert('The request took too long. Please try again.');
      } else if (error.code === 'ECONNRESET') {
        alert('The connection was reset. Please try again.');
      } else {
        alert('An error occurred: ' + error.message);
      }
    } finally {
      setIsGenerating(false);
    }
  }

  const handleDownload = () => {
    if (generatedImagePath) {
      const filename = generatedImagePath.split('/').pop()
      window.open(`/gen_img/download/${filename}`, '_blank')
    }
  }

  return (
    <>
      <Head>
        <title>Image Factory</title>
      </Head>
      <Navbar />
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
      />
      {/* 微信支付模态框 */}
      {/* <div id="qrCodeModal" className="modal payment-modal" tabIndex={-1}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title text-center w-100">
                <i className="fab fa-weixin me-2" style={{ color: '#07C160' }}></i>
                WeChat Payment
                <div className="small text-muted mt-2">Please complete payment within 15 minutes</div>
              </h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body text-center">
              <div className="qr-code-container">
                <img id="qrCodeImage" src="" alt="QR Code" className="img-fluid mb-3" />
                <div className="timer">
                  <i className="far fa-clock me-1"></i>
                  <span id="paymentTimer">15:00</span> remaining
                </div>
              </div>
            </div>
          </div>
        </div>
      </div> */}

      <div className="container mt-5">
        {/* 欢迎消息 */}
        <div className="container mt-3">
          <div className="welcome-message">
            <p className="text-center p-4 rounded-lg animate__animated animate__fadeIn">
              <span className="welcome-title">Welcome to Image Factory!</span>
              <span className="welcome-text">
                Upload your image and generate your own masterpiece with custom prompts.<br />
                Explore endless possibilities until you find your perfect creation.
              </span>
            </p>
          </div>
        </div>
        

        <div className="row mb-4">
          {/* 图片上传区域 */}
          <div className="col-md-3">
            <div className="card h-100">
              <div className="card-body d-flex flex-column">
                <h5 className="card-title">Upload your image</h5>
                <div className="preview-area mt-3 flex-grow-1" id="preview">
                  <input
                    type="file"
                    id="imageUpload"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="form-control d-none"
                  />
                  <div className={`upload-container text-center ${previewUrl && imageFile ? 'd-none' : ''}`} id="uploadContainer">
                    <label htmlFor="imageUpload" className="upload-label">
                      <i className="fas fa-cloud-upload-alt"></i>
                      <span>click to upload</span>
                    </label>
                  </div>
                  <div className={`image-preview-container ${previewUrl && imageFile ? '' : 'd-none'}`} id="imagePreviewContainer">
                    {previewUrl && (
                      <div className="preview-wrapper position-relative">
                        <img src={previewUrl} className="preview-image" alt="Preview" />
                        <button
                          className="delete-image-btn"
                          onClick={() => {
                            setImageFile(null)
                            setPreviewUrl('')
                            localStorage.removeItem('savedImageBase64')
                            localStorage.removeItem('savedPreviewUrl')
                          }}
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 文本输入和按钮区域 */}
          <div className="col-md-9">
            <div className="card h-100">
              <div className="card-body d-flex flex-column">
                <h5 className="card-title">input your prompt</h5>
                <textarea
                  id="textInput"
                  className="form-control flex-grow-1 mb-3"
                  style={{ resize: 'none' }}
                  value={prompt}
                  onChange={(e) => updatePrompt(e.target.value)}
                />
                <button 
                  className="btn btn-primary btn-lg"
                  onClick={handleSubmit}
                  disabled={isGenerating}
                >
                  <i className="fas fa-magic me-2"></i>
                  {isGenerating ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      generating...
                    </>
                  ) : (
                    'generate image'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

       {/* Generated image preview */}
        <div className="row mb-4">
          <div className="col-md-12">
                  <div className="card mb-4">
                      <div className="card-body">
                          <h5 className="card-title">Generated image preview</h5>
                          <div className="generated-preview-area mt-3" id="generatedPreview">
                            {generatedImagePath ? (
                              <div className="text-center">
                                <img 
                                  src={`/gen_img/output/${generatedImagePath}`}
                                  alt="Generated image" 
                                  className="img-fluid mb-3"
                                  style={{ maxWidth: '100%', maxHeight: '500px' }}
                                />
                                <div>
                                  <button 
                                    className="btn btn-primary"
                                    onClick={handleDownload}
                                  >
                                    <i className="fas fa-download me-2"></i>
                                    Download Image
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <p className="text-muted">Your generated image will appear here</p>
                            )}
                          </div>
                      </div>
                  </div>
              </div>
        </div>

        {/* Prompt 模板区域 */}
        <div id="promptTemplates" className="row mb-4">
          <div className="col-12">
            <div className="card mb-4">
              <div className="card-body d-flex flex-column">
                <h5 className="card-title">prompt templates</h5>
                <ul className="list-group flex-grow-1" style={{ overflowY: 'auto' }}>
                  {promptTemplates.map((template, index) => (
                    <li 
                      key={index}
                      className="list-group-item prompt-template" 
                      style={{ cursor: 'pointer' }}
                      onClick={() => setPrompt(template)}
                    >
                      {template}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* User Cases 展示区域 */}
        <div id="userCases" className="row mb-4">
          <div className="col-12">
            <div className="card">
              <div className="card-body">
                <h5 className="card-title">User Cases</h5>
                <div className="user-cases-container">
                  <div className="user-case-item">
                    <div className="row align-items-center">
                      <div className="col-md-3">
                        <img src="/images/case1_original.jpg" className="img-fluid rounded" alt="Original Image" />
                        <p className="text-muted mt-2">Original Image</p>
                      </div>
                      <div className="col-md-6">
                        <div className="prompt-text">
                          <p>The image features a fantastical, ethereal female figure floating gracefully through a celestial, dreamlike atmosphere...</p>
                        </div>
                      </div>
                      <div className="col-md-3">
                        <img src="/images/case1_generated.jpg" className="img-fluid rounded" alt="Generated Image" />
                        <p className="text-muted mt-2">Generated Image</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toast 消息 */}
      <div className="toast-container position-fixed top-50 start-50 translate-middle" style={{ zIndex: 9999 }}>
        {/* Payment Success Toast */}
        <div id="paymentSuccessToast" className="toast" role="alert" aria-live="assertive" aria-atomic="true" data-bs-delay="3000">
          <div className="toast-header bg-success text-white">
            <strong className="me-auto">payment successful</strong>
            <button type="button" className="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
          </div>
          <div className="toast-body">
            payment complete, page will refresh shortly...
          </div>
        </div>

        {/* Payment Failed Toast */}
        <div id="paymentFailedToast" className="toast" role="alert" aria-live="assertive" aria-atomic="true" data-bs-delay="3000">
          <div className="toast-header bg-success text-white">
            <strong className="me-auto">payment failed</strong>
            <button type="button" className="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
          </div>
          <div className="toast-body">
            payment incomplete, page will refresh shortly...
          </div>
        </div>

        {/* Payment Timeout Toast */}
        <div id="paymentFailedTimeoutToast" className="toast" role="alert" aria-live="assertive" aria-atomic="true" data-bs-delay="3000">
          <div className="toast-header bg-success text-white">
            <strong className="me-auto">payment timed out</strong>
            <button type="button" className="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
          </div>
          <div className="toast-body">
            payment incomplete, page will refresh shortly...
          </div>
        </div>
      </div>
    </>
  )
}