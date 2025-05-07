import { useState, ChangeEvent, useEffect, ChangeEventHandler } from 'react'
import { useSession } from 'next-auth/react'
import Head from 'next/head'
import { AuroraText } from '@/components/magicui/aurora-text'
import { TextRevealSimple } from '@/components/magicui/text-reveal-simple'
import { assert, Console } from 'console'

import Navbar from '../components/Navbar'
import LoginModal from '../components/LoginModal'
import Footer from '../components/Footer'
import WechatPayModal from '../components/WechatPay'
import { getQrCodeUrl } from '../components/WechatPay'
import { API_BASE_URL } from '../config'


export default function Home() {
  const { data: session, status } = useSession()
  // 用户上传的图片名称
  const [uploadImageFileName, setUploadImageFileName] = useState('')
  // 用户输入的prompt
  const [prompt, setPrompt] = useState('')
  // 登录模态框是否打开
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  // 微信支付模态框是否打开
  const [isWechatPayModalOpen, setIsWechatPayModalOpen] = useState(false)
  // 微信支付二维码url
  const [qrCodeUrl, setQrCodeUrl] = useState<string[] | null>(null)
  // 支付金额
  const [payAmount, setPayAmount] = useState(0)
  // 是否正在获取支付二维码
  const [isGettingPricingQrCodeURL, setIsGettingPricingQrCodeURL] = useState(false)
  const [isGettingPricingQrCodeURL2, setIsGettingPricingQrCodeURL2] = useState(false)
  const [isGettingPricingQrCodeURL3, setIsGettingPricingQrCodeURL3] = useState(false)
  const [isGettingPricingQrCodeURL4, setIsGettingPricingQrCodeURL4] = useState(false)
  // 是否正在生成图片
  const [isGenerating, setIsGenerating] = useState(false)
  // 生成的图片的名称
  const [generatedImagePath, setGeneratedImagePath] = useState('')
  // 图片查看模态框，用户上传的图片和生成的图片都用这个模态框展示
  const [showImageModal, setShowImageModal] = useState(false)
  const [modalImage, setModalImage] = useState<string | undefined>(undefined)
  // 用户生图区域的记录
  const [userCreationList, setUserCreationList] = useState<string[]>([])

  // Add new state for case filtering
  const [selectedPromptId, setSelectedPromptId] = useState<number | null>(null);

  // 模板数据
  // const promptTemplates = [
  //   "The image showcases a dynamic fantasy character with long, flowing pink hair, fox-like ears, and a confident pose. She wears a red and gold outfit with intricate detailing, including a short, asymmetrical top and high-waisted dark leggings, exposing her midriff. She gracefully wields a large, ornate parasol adorned with red and gold, with a ribbon and a hanging bell tied near the handle. The background is filled with warm, glowing light, floating autumn leaves, and blurred lanterns, creating a festive, magical ambiance. The character's fox tail, confident expression, and dynamic movement add to the sense of energy and enchantment in the scene. The overall color palette is warm, with rich reds, golds, and oranges dominating the image.",
  //   "The image features a fantastical, ethereal female figure floating gracefully through a celestial, dreamlike atmosphere. She wears ornate, golden armor pieces and a flowing, vibrant costume in orange, blue, and gold hues. Her long, dark hair is adorned with intricate golden headpieces, and she delicately plays a stylized string instrument resembling a pipa or lute. Surrounding her are swirling ribbons of light and color, which seem to dance with her movement. The background resembles a cosmic mural, blending starry skies with a painterly landscape of clouds and mythic patterns. The entire composition conveys elegance, motion, and divinity, suggesting she may be a goddess, spirit, or celestial muse drawn from Eastern mythology or fantasy art.", 
  //   "A masterpiece of dreamy photography. The girl holds a glowing glass jar in her hands, which emits a soft yellow light, illuminating her face and the surrounding environment. She wears a white lace dress with blue and pink decorations and a light blue bow tied around her waist. The girl wears a white headdress dotted with blue and pink flowers and carries twinkling blue wings on her back. Behind the girl, you can see a vast sea of ​​flowers, which sparkle with pink and gold light and are scattered on the green grass. The sky is full of sparkling stars, from the upper left corner to the lower right corner, as if the Milky Way is scattered in the night sky. The overall light is soft and full of magical colors, making the whole picture look like a fairy tale world",
  //   "Full body shot of young Asian face woman in sun hat and white dress standing on sunny beach with sea and mountains in background, high quality, sharp focus.",
  //   "A beautiful girl reading book, high quality."
  // ]

  const promptList = [
    {
      "prompt_id": 1, 
      "role_name": "Furina", 
      "image_type": "portrait",
      "origin_game": "Genshin Impact",
      "prompt_content": "You are an advanced AI image generation model. Your task is to transform the provided portrait image of a person by replacing their outfit and accessories with those of the character Furina (also known as Focalors) from the game Genshin Impact. Follow the instructions carefully:\n"
        + "1. Change the person's clothing to match Furina's official outfit:\n"
        +"- Elegant, theatrical, noble blue-themed outfit with white and silver elements.\n"
        +"- High collar, puffed sleeves, layered skirt with dramatic flair.\n"
        +"- Add water-themed accessories, such as water droplet-shaped gems and motifs.\n"
        +"\n"
        +"2. Include Furina's signature props:\n"
        +"- A small floating water elemental creature (Gowne) near her shoulder.\n"
        +"- Optionally include a staff, cane, or theatrical baton-style prop that looks elegant and symbolic.\n"
        +"\n"
        +"3. Style and aesthetics:\n"
        +"- Maintain anime-style details inspired by the original Genshin Impact character art.\n"
        +"- Incorporate subtle blue lighting or water effects around the outfit or background.\n"
        +"- Preserve the person's facial features and hairstyle as much as possible while blending with the Genshin style.\n"
        +"\n"
        +"4. Do not change the background unless necessary, but feel free to enhance it with light water or stage effects for coherence.\n"
        +"\n"
        +"Output should be a full-body portrait.\n", 
    },
    {
      "prompt_id": 2, 
      "role_name": "Raiden Shogun", 
      "image_type": "portrait",
      "origin_game": "Genshin Impact",
      "prompt_content": "You are an advanced AI image generation model. Your task is to transform the provided portrait image of a person by replacing their outfit and accessories with those of the character Raiden Ei from the game Genshin Impact. Follow the instructions carefully:\n"
      + "\n"
      + "1. Change the person's clothing to match Raiden Ei's official outfit:\n"
      + "- A regal, purple-themed outfit with elements of lavender, violet, and dark purple.\n"
      + "- Elegant and flowing, with a high collar, short sleeves, and a long skirt with layered fabric.\n"
      + "- Intricate details such as golden trim, lightning motifs, and a stylized lightning bolt on the chest area.\n"
      + "- A traditional, yet slightly futuristic armor-inspired aesthetic.\n"
      + "\n"
      + "2. Include Raiden Ei's signature props:\n"
      + "- A polearm weapon, the \"Kagura's Verity\" , which is a long, elegantly designed polearm with purple and golden accents.\n"
      + "- Optional: A subtle aura of electro-energy or lightning effects around her weapon or body to signify her Electro Archon power.\n"
      + "\n"
      + "3. Style and aesthetics:\n"
      + "- Maintain anime-style details inspired by the original Genshin Impact character art.\n"
      + "- Incorporate purple and electric lighting effects around the outfit or background for coherence with the Electro theme.\n"
      + "- Preserve the person's facial features and hairstyle as much as possible while blending with the Genshin style.\n"
      + "\n"
      + "4. Do not change the background unless necessary, but feel free to enhance it with light electric or lightning effects for a dynamic look.\n"
      + "\n"
      + "Output should be a full-body portrait.\n",
    },
    {
      "prompt_id": 3, 
      "role_name": "Furina", 
      "image_type": "figurine",
      "origin_game": "Genshin Impact",
      "prompt_content": "You are an advanced AI image generation model specialized in transforming portrait images into anime-style 3D figurines. The user will provide a photo of a person. Your task is to:\n"
      + "\n"
      + "1. Replace the person's outfit with the full official outfit of Furina (Focalors) from Genshin Impact:\n"
      + "- A noble and theatrical blue-and-white ensemble with silver accents.\n"
      + "- High collar, puffed sleeves, and a dramatic layered short skirt.\n"
      + "- Knee-high boots, detailed water-themed accessories, and elegant gloves.\n"
      + "\n"
      + "2. Add Furina's signature accessories:\n"
      + "- A small floating water elemental creature (Gowne) near the shoulder.\n"
      + "- An ornate staff or theatrical baton, carried or posed nearby.\n"
      + "- Subtle water effects or energy traces as a visual accent.\n"
      + "\n"
      + "3. Transform the entire character into a **full-body 3D figurine**:\n"
      + "- Plastic or resin-like material finish.\n"
      + "- Visible base/stand typical of collectible anime figures.\n"
      + "- Lighting and rendering consistent with high-quality figurine product photos.\n"
      + "- Keep the pose elegant, with slight drama or flair, as if she's on stage or mid-performance.\n"
      + "\n"
      + "4. Preserve the person's facial structure and hairstyle, but adapt them to anime-style proportions and rendering, consistent with Furina's character design.\n"
      + "\n"
      + "5. The background should be clean or display a soft studio-style gradient (white, gray, or soft blue), typical of professional figure photography.\n"
      + "\n"
      + "6. The final result should resemble a real collectible figurine product image, not a 2D anime illustration or cosplay.\n"
      + "\n"
      + "Be precise, elegant, and ensure a perfect blend between the original person's identity and Furina's iconic style.\n", 
    },
    {
      "prompt_id": 4, 
      "role_name": "Raiden Shogun", 
      "image_type": "figurine",
      "origin_game": "Genshin Impact",
      "prompt_content": "You are an advanced AI image generation model specialized in transforming portrait images into anime-style 3D figurines. \n"
      + "The user will provide a photo of a person. Your task is to:\n"
      + "\n"
      + "1. Replace the person's outfit with the full official outfit of Raiden Shogun (Ei) from Genshin Impact:\n"
      + "  - A regal and traditional Inazuman-inspired kimono-style ensemble.\n"
      + "   - Deep purple and violet hues with lightning motifs.\n"
      + "   - Ornate sleeves, layered fabric with sakura and electro designs, and a form-fitting bodice.\n"
      + "   - Thigh-high stockings, elegant sandals, and ribbon embellishments.\n"
      + "\n"
      + "2. Add Raiden Shogun's signature accessories:\n"
      + "   - The **Engulfing Lightning** polearm, either held in hand or posed behind.\n"
      + "   - Floating **Electro** sigils or symbols, emitting soft purple lightning effects.\n"
      + "   - Her signature flower hairpin and electro vision visible on the outfit.\n"
      + "\n"
      + "3. Transform the entire character into a **full-body 3D figurine**:\n"
      + "   - Resin or high-quality PVC finish, resembling real collectible anime figures.\n"
      + "   - Mounted on a decorated circular stand with electro-themed elements.\n"
      + "   - Soft studio lighting and professional figurine rendering quality.\n"
      + "   - Pose should be strong, commanding, and elegant—like she's about to unleash her elemental burst.\n"
      + "\n"
      + "4. Preserve the person's facial structure and hairstyle, but adapt them into anime-style with Raiden Shogun's color palette and elegance:\n"
      + "   - Maintain the character's serious and composed aura.\n"
      + "   - Hair may be stylized with purples and blended with the original style.\n"
      + "\n"
      + "5. The background should be clean and minimal, such as a white or soft lavender gradient backdrop, typical of product photography for figures.\n"
      + "\n"
      + "6. The final result must look like a high-end anime **3D collectible figurine**, not a cosplay or 2D illustration.",
    },
  ]

  const userCaseArr = [
    {
      "origin_image_path": "/images/origin2.jpg",
      "prompt_id": 1,
      "generated_image_path": "/images/origin2_furina_portrait.png"
    },
    {
      "origin_image_path": "/images/origin2.jpg",
      "prompt_id": 2,
      "generated_image_path": "/images/origin2_raidenshogun_portrait.webp"
    },
    {
      "origin_image_path": "/images/origin2.jpg",
      "prompt_id": 3,
      "generated_image_path": "/images/origin2_furina_figurine.jpg"
    },
    {
      "origin_image_path": "/images/origin2.jpg",
      "prompt_id": 4,
      "generated_image_path": "/images/origin2_raidenshogun_figurine.jpg"
    },
    // [
    //   "/images/origin2.jpg",
    //   "You are an advanced AI image generation model. Your task is to transform the provided portrait image of a person by replacing their outfit and accessories with those of the character Raiden Ei from the game Genshin Impact. Follow the instructions carefully:\n"
    //   + "\n"
    //   + "1. Change the person's clothing to match Raiden Ei's official outfit:\n"
    //   + "- A regal, purple-themed outfit with elements of lavender, violet, and dark purple.\n"
    //   + "- Elegant and flowing, with a high collar, short sleeves, and a long skirt with layered fabric.\n"
    //   + "- Intricate details such as golden trim, lightning motifs, and a stylized lightning bolt on the chest area.\n"
    //   + "- A traditional, yet slightly futuristic armor-inspired aesthetic.\n"
    //   + "\n"
    //   + "2. Include Raiden Ei's signature props:\n"
    //   + "- A polearm weapon, the \"Kagura's Verity\" , which is a long, elegantly designed polearm with purple and golden accents.\n"
    //   + "- Optional: A subtle aura of electro-energy or lightning effects around her weapon or body to signify her Electro Archon power.\n"
    //   + "\n"
    //   + "3. Style and aesthetics:\n"
    //   + "- Maintain anime-style details inspired by the original Genshin Impact character art.\n"
    //   + "- Incorporate purple and electric lighting effects around the outfit or background for coherence with the Electro theme.\n"
    //   + "- Preserve the person's facial features and hairstyle as much as possible while blending with the Genshin style.\n"
    //   + "\n"
    //   + "4. Do not change the background unless necessary, but feel free to enhance it with light electric or lightning effects for a dynamic look.\n"
    //   + "\n"
    //   + "Output should be a full-body portrait.\n",
    //   "/images/origin2_raidenshogun_portrait.webp"
    // ],
    // [
    //   "/images/origin2.jpg",
    //   "You are an advanced AI image generation model specialized in transforming portrait images into anime-style 3D figurines. The user will provide a photo of a person. Your task is to:\n"
    //   + "\n"
    //   + "1. Replace the person's outfit with the full official outfit of Furina (Focalors) from Genshin Impact:\n"
    //   + "- A noble and theatrical blue-and-white ensemble with silver accents.\n"
    //   + "- High collar, puffed sleeves, and a dramatic layered short skirt.\n"
    //   + "- Knee-high boots, detailed water-themed accessories, and elegant gloves.\n"
    //   + "\n"
    //   + "2. Add Furina's signature accessories:\n"
    //   + "- A small floating water elemental creature (Gowne) near the shoulder.\n"
    //   + "- An ornate staff or theatrical baton, carried or posed nearby.\n"
    //   + "- Subtle water effects or energy traces as a visual accent.\n"
    //   + "\n"
    //   + "3. Transform the entire character into a **full-body 3D figurine**:\n"
    //   + "- Plastic or resin-like material finish.\n"
    //   + "- Visible base/stand typical of collectible anime figures.\n"
    //   + "- Lighting and rendering consistent with high-quality figurine product photos.\n"
    //   + "- Keep the pose elegant, with slight drama or flair, as if she's on stage or mid-performance.\n"
    //   + "\n"
    //   + "4. Preserve the person's facial structure and hairstyle, but adapt them to anime-style proportions and rendering, consistent with Furina's character design.\n"
    //   + "\n"
    //   + "5. The background should be clean or display a soft studio-style gradient (white, gray, or soft blue), typical of professional figure photography.\n"
    //   + "\n"
    //   + "6. The final result should resemble a real collectible figurine product image, not a 2D anime illustration or cosplay.\n"
    //   + "\n"
    //   + "Be precise, elegant, and ensure a perfect blend between the original person's identity and Furina's iconic style.\n",
    //   "/images/origin2_furina_figurine.jpg"
    // ],
    // [
    //   "/images/origin2.jpg",
    //   "You are an advanced AI image generation model specialized in transforming portrait images into anime-style 3D figurines. \n"
    //   + "The user will provide a photo of a person. Your task is to:\n"
    //   + "\n"
    //   + "1. Replace the person's outfit with the full official outfit of Raiden Shogun (Ei) from Genshin Impact:\n"
    //   + "  - A regal and traditional Inazuman-inspired kimono-style ensemble.\n"
    //   + "   - Deep purple and violet hues with lightning motifs.\n"
    //   + "   - Ornate sleeves, layered fabric with sakura and electro designs, and a form-fitting bodice.\n"
    //   + "   - Thigh-high stockings, elegant sandals, and ribbon embellishments.\n"
    //   + "\n"
    //   + "2. Add Raiden Shogun's signature accessories:\n"
    //   + "   - The **Engulfing Lightning** polearm, either held in hand or posed behind.\n"
    //   + "   - Floating **Electro** sigils or symbols, emitting soft purple lightning effects.\n"
    //   + "   - Her signature flower hairpin and electro vision visible on the outfit.\n"
    //   + "\n"
    //   + "3. Transform the entire character into a **full-body 3D figurine**:\n"
    //   + "   - Resin or high-quality PVC finish, resembling real collectible anime figures.\n"
    //   + "   - Mounted on a decorated circular stand with electro-themed elements.\n"
    //   + "   - Soft studio lighting and professional figurine rendering quality.\n"
    //   + "   - Pose should be strong, commanding, and elegant—like she's about to unleash her elemental burst.\n"
    //   + "\n"
    //   + "4. Preserve the person's facial structure and hairstyle, but adapt them into anime-style with Raiden Shogun's color palette and elegance:\n"
    //   + "   - Maintain the character's serious and composed aura.\n"
    //   + "   - Hair may be stylized with purples and blended with the original style.\n"
    //   + "\n"
    //   + "5. The background should be clean and minimal, such as a white or soft lavender gradient backdrop, typical of product photography for figures.\n"
    //   + "\n"
    //   + "6. The final result must look like a high-end anime **3D collectible figurine**, not a cosplay or 2D illustration.",
    //   "/images/origin2_raidenshogun_figurine.jpg"
    // ]
  ]

  // 1. 生成所有角色-游戏组合
  const characterGameOptions = Array.from(new Set(promptList.map(item => `${item.role_name}(${item.origin_game})`)));
  // 2. 筛选条件 state
  const [characterGameFilter, setCharacterGameFilter] = useState('All');
  // 3. 根据筛选条件过滤promptList
  const filteredPromptList = promptList.filter(item => {
    return characterGameFilter === 'All' || `${item.role_name}(${item.origin_game})` === characterGameFilter;
  });

  const scrollToUserCases = () => {
    const element = document.getElementById('userCases');
    if (element) {
      const offset = 100; // 向上偏移的像素值,可以根据需要调整
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  };

  // 在客户端初始化时恢复所有保存的状态
  useEffect(() => {
    // 确保只在客户端执行
    const savedGeneratedImagePath = localStorage.getItem('savedGeneratedImagePath')
    const savedUploadImageFileName = localStorage.getItem('savedUploadImageFileName')
    const savedPrompt = localStorage.getItem('savedPrompt')

    if (savedGeneratedImagePath) setGeneratedImagePath(savedGeneratedImagePath)
    if (savedUploadImageFileName) setUploadImageFileName(savedUploadImageFileName)
    if (savedPrompt) setPrompt(savedPrompt)
  }, []) // 仅在组件挂载时执行一次

  // 监听session状态变化，当session加载完成时刷新用户创作区域
  useEffect(() => {
    console.log("debug status:", status)
    console.log("debug session:", session)
    if (status === 'authenticated' && session?.user?.email) {
      refresh_user_creation_area()
    }
  }, [status, session])

  // 保存状态到localStorage
  const saveStateToStorage = () => {
    localStorage.setItem('savedUploadImageFileName', uploadImageFileName)
    localStorage.setItem('savedPrompt', prompt)
    localStorage.setItem('savedGeneratedImagePath', generatedImagePath)
  }

  // 在状态改变时保存
  useEffect(() => {
    saveStateToStorage()
  }, [uploadImageFileName, prompt, generatedImagePath])

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]

      // 创建FormData对象
      const formData = new FormData()
      formData.append('image', file)

      try {
        // 上传图片到服务器
        const response = await fetch(`${API_BASE_URL}/gen_img/upload`, {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          throw new Error(`fetch gen_img/upload status not ok, status is ${response.status}`)
        }

        const data = await response.json()
        
        if (data.success) {
          setUploadImageFileName(data.file_path)
        } else {
          alert('Failed to upload image: ' + data.message)
        }
      } catch (error) {
        console.error('Error uploading image:', error)
        alert('Error uploading image: ' + error)
      }
    } else {
      alert('no image to upload')
    }
  }

  const updatePrompt = async (e: ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value)
  }

  const handlePurchase = async (payType: number) => {
    // 等待 session 加载完成
    if (status === 'loading') {
      return
    }

    // 检查登录状态
    if (status !== 'authenticated' || !session?.user) {
      setIsLoginModalOpen(true)
      return
    }

    if (!session.user.email) {
      setIsLoginModalOpen(true)
      return
    }

    var amount = 1
    // switch (payType) {
    //   case 1: { 
    //     amount = 790;
    //   }
    //   default: amount = 0
    // }
    if (payType === 1) {
      setIsGettingPricingQrCodeURL(true);
      amount = 790;
    } else if (payType === 2) {
      setIsGettingPricingQrCodeURL2(true);
      amount = 2190;
    } else if (payType === 3) {
      setIsGettingPricingQrCodeURL3(true);
      amount = 3390;
    } else if (payType === 4) {
      setIsGettingPricingQrCodeURL4(true);
      amount = 5590;
    }
    
    try {
      const ret = await getQrCodeUrl(session.user.email, amount, payType);
      if (ret !== null) {
        // const qrUrl = ret[0];
        // const userId = ret[1];
        // const orderType = ret[2];
        // const outTradeNo = ret[3];
        setQrCodeUrl(ret)
        setPayAmount(amount)
        setIsWechatPayModalOpen(true)
      // } else {
      //   alert("get wechat pay qr failed")
      }
    } catch (error) {
      alert("get wechat pay qr error")
    } finally {
      if (payType === 1) {
        setIsGettingPricingQrCodeURL(false)
      } else if (payType === 2) {
        setIsGettingPricingQrCodeURL2(false)
      } else if (payType === 3) {
        setIsGettingPricingQrCodeURL3(false)
      } else if (payType === 4) {
        setIsGettingPricingQrCodeURL4(false)
      }
    }
  }

  // const substractCredits = async (num: number) => {
  //   if (status === 'loading') {
  //     return
  //   }

  //   // 检查登录状态
  //   if (status !== 'authenticated' || !session?.user) {
  //     setIsLoginModalOpen(true)
  //     return
  //   }

  //   if (!session.user.email) {
  //     setIsLoginModalOpen(true)
  //     return
  //   }

  //   try {
  //     const res = await fetch(`${API_BASE_URL}/gen_img/substract_credits/${session.user.email}/${num}`, {
  //       method: 'POST',
  //       credentials: 'include',
  //       headers: {
  //         'Accept': 'application/json',
  //       },
  //     })

  //     if (!res.ok) {
  //       throw new Error('Failed to subtract credits')
  //     }
    
  //   } catch (error) {
  //     console.error('Error subtracting credits:', error)
  //     alert('Error subtracting credits:' + error)
  //   }
  // }

  const refresh_user_creation_area = async () => {
    if (status === 'loading') {
      return
    }

    if (status !== 'authenticated' || !session?.user) {
      return
    }

    if (!session.user.email) {
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/gen_img/get_creation/${session.user.email}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Response was not JSON')
      }

      const data = await response.json()
      const creation_list = data.user_creation || []
      setUserCreationList(creation_list)
    } catch (error) {
      console.error("get user creation failed:", error)
      setUserCreationList([])
    }
  }

  const handleSubmit = async () => {
    if (!uploadImageFileName || !prompt) {
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
    formData.append('image', uploadImageFileName)
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

        const res = await fetch(`${API_BASE_URL}/gen_img/process`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
          },
          body: formData,
          signal: controller.signal
        }).catch(error => {
          if (error.name === 'AbortError') {
            throw new Error('Request timed out after 10 minutes');
          }
          throw error;
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`HTTP error! status: ${res.status}, message: ${errorText}`);
        }
        
        const data = await res.json();
        
        if (data.success) {
          setGeneratedImagePath(data.img_id);
          refresh_user_creation_area();
          
        } else if (!data.isAuthenticated) {
          setIsLoginModalOpen(true);
        } else {
          console.error("Generate image failed:", data.message);
          alert('Failed to generate image: ' + data.message);
        }
    } catch (error) {
      console.error('Error during image generation:', error);
      alert('Error during image generation:' + error)
    } finally {
      setIsGenerating(false);
    }
  }

  const handleDownload = () => {
    if (generatedImagePath) {
      // const filename = generatedImagePath.split('/').pop()
      window.open(`${API_BASE_URL}/gen_img/download/${generatedImagePath}`, '_blank')
    } else {
      alert('no image to download')
    }
  }

  return (
    <>
      <Head>
        <title>Pixel Myth</title>
        <link rel="icon" href="/images/logo.png" type="image/png" />
      </Head>
      <Navbar />
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
      />
      <WechatPayModal 
        isOpen={isWechatPayModalOpen} 
        onClose={() => {
          setIsWechatPayModalOpen(false)
          setPayAmount(0)
          setQrCodeUrl(null)
        }}
        payAmount={payAmount}
        qrUrl={qrCodeUrl}
      />

      <div className="container mt-5">
        {/* 欢迎消息 */}
        <div className="container mt-3">
          <div className="welcome-message">
            <div className="text-center p-4 rounded-lg animate__animated animate__fadeIn">
              <AuroraText>
                <span className="welcome-title">Dress Up Your Photos As Game Characters</span>
              </AuroraText>
              <TextRevealSimple className="welcome-text mt-4">
              <b>Turn your photo into iconic game characters with AI while keeping facial features.<br/> 
              Choose from built-in prompt templates inspired by King of Glory and Genshin Impact.<br/>
              New characters added regularly—explore endless creative possibilities!</b>
              </TextRevealSimple>
            </div>
          </div>
        </div>

        <div className="row mb-4">
          {/* 图片上传区域 */}
          <div className="col-md-3">
            <div className="card h-100">
              <div className="card-body d-flex flex-column">
                {/* <h5 className="card-title">Upload your photo</h5> */}
                <div className="preview-area mt-3 flex-grow-1" id="preview">
                  <input
                    type="file"
                    id="imageUpload"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="form-control d-none"
                  />
                  <div className={`upload-container text-center ${uploadImageFileName? 'd-none' : ''}`} id="uploadContainer">
                    <label htmlFor="imageUpload" className="upload-label">
                      <i className="fas fa-cloud-upload-alt"></i>
                      <span>upload your photo</span>
                    </label>
                  </div>
                  <div className={`image-preview-container ${uploadImageFileName? '' : 'd-none'}`} id="imagePreviewContainer">
                    {uploadImageFileName && (
                      <div className="preview-wrapper position-relative">
                        <img 
                          src={`${API_BASE_URL}/gen_img/upload/${uploadImageFileName}`} 
                          className="preview-image" 
                          alt="Preview" 
                          onClick={() => {
                            setModalImage(`${API_BASE_URL}/gen_img/upload/${uploadImageFileName}`)
                            setShowImageModal(true)
                          }}
                          style={{ cursor: 'pointer' }}
                        />
                        <button
                          className="delete-image-btn"
                          onClick={() => {
                            setUploadImageFileName('')
                            // localStorage.removeItem('savedUploadImageFileName')
                          }}
                          style={{ position: 'absolute', top: 10, right: 10, zIndex: 1000 }}
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
                {/* <h5 className="card-title">input your prompt</h5> */}
                <textarea
                  id="textInput"
                  className="form-control flex-grow-1 mb-3"
                  style={{ resize: 'none' }}
                  value={prompt}
                  onChange={updatePrompt}
                  placeholder="Choose from our preset prompt templates below or craft your own unique prompt"
                />
                <button 
                  className="btn btn-primary"
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

        {/* Prompt 模板区域 */}
        <div id="promptTemplates" className="row mb-4">
          <div className="col-12">
            <div className="card mb-4">
              <div className="card-body d-flex flex-column">
                <h5 className="card-title">prompt templates</h5>
                <div style={{ 
                  maxHeight: '600px', 
                  overflowY: 'auto',
                  paddingRight: '10px'
                }}>
                  <table className="table">
                  <thead>
                    <tr>
                      <th style={{ width: '20%', textAlign: 'center' }}>
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '0.5rem', 
                          whiteSpace: 'nowrap',
                          justifyContent: 'center' 
                        }}>
                          <span>Character(Game)</span>
                          <select
                            className="form-select"
                            style={{ width: 120, minWidth: 120, fontSize: '0.95em', padding: '2px 8px' }}
                            value={characterGameFilter}
                            onChange={e => setCharacterGameFilter(e.target.value)}
                          >
                            <option value="All">All</option>
                            {characterGameOptions.map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        </div>
                      </th>
                      <th style={{ width: '60%', textAlign: 'center' }}>Prompt</th>
                      <th style={{ width: '20%', textAlign: 'center' }}>Operation</th>
                    </tr>
                  </thead>
                    <tbody>
                      {filteredPromptList.map((promptItem, index) => (
                        <tr key={index}>
                          <td>
                            <div style={{ 
                              height: '150px', 
                              overflowY: 'auto',
                              padding: '10px',
                              fontSize: '0.9rem',
                              whiteSpace: 'nowrap',
                              display: 'flex',
                              alignItems: 'center'
                            }}>
                              {promptItem["role_name"]} <span style={{ color: '#888', marginLeft: 4 }}>({promptItem["origin_game"]})</span>
                            </div>
                          </td>
                          <td>
                          <div style={{ 
                              height: '150px', 
                              overflowY: 'auto',
                              padding: '10px',
                              fontSize: '0.9rem',
                              whiteSpace: 'pre-line'
                            }}>
                              {promptItem["prompt_content"]}
                            </div>
                          </td>
                          <td>
                            <div className="d-flex flex-column gap-2">
                              <button 
                                className="btn btn-primary mb-2"
                                onClick={() => {
                                  if (prompt) {
                                    setPrompt(prompt + '\n' + promptItem["prompt_content"])
                                  } else {
                                    setPrompt(promptItem["prompt_content"]) 
                                  }
                                }}
                              >
                                Use Prompt
                              </button>
                              <button 
                                className="btn btn-outline-primary"
                                onClick={() => {
                                  setSelectedPromptId(promptItem.prompt_id);
                                  scrollToUserCases();
                                }}
                              >
                                VIEW CASES
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* <ul className="list-group flex-grow-1" style={{ overflowY: 'auto' }}>
                  {userCaseArr.map((template, index) => (
                    <li 
                      key={index}
                      className="list-group-item prompt-template" 
                      style={{ cursor: 'pointer' }}
                      onClick={() => setPrompt(template[1])}
                    >
                      {template[1]}
                    </li>
                  ))}
                </ul> */}
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
                                  src={`${API_BASE_URL}/gen_img/output/${generatedImagePath}`}
                                  alt="Generated image" 
                                  className="img-fluid mb-3"
                                  style={{ maxWidth: '100%', maxHeight: '500px', cursor: 'pointer' }}
                                  onClick={() => {
                                    setModalImage(`${API_BASE_URL}/gen_img/output/${generatedImagePath}`)
                                    setShowImageModal(true)
                                  }}
                                />
                                <button
                                  className="delete-image-btn"
                                  onClick={() => {
                                    setGeneratedImagePath('')
                                    // localStorage.removeItem('savedGeneratedImagePath')
                                  }}
                                  style={{ position: 'absolute', top: 10, right: 10, zIndex: 1000 }}
                                >
                                  <i className="fas fa-times"></i>
                                </button>
                                <div>
                                  <button 
                                    className="btn btn-primary"
                                    onClick={handleDownload}
                                  >
                                    <i className="fas fa-download me-2"></i>
                                    Download High-quality Image
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

        {/* my creations 展示区域 */}
        <div id="myCreations" className="row mb-4">
          <div className="col-12">
            <div className="card">
              <div className="card-body">
                <h5 className="card-title">My Creations</h5>
                <div className="row" style={{ 
                  maxHeight: '600px', 
                  overflowY: 'auto',
                  paddingRight: '10px'
                }}>
                  {userCreationList && userCreationList.map((path: string, index: number) => (
                    <div key={index} className="col-md-4 mb-4">
                      <div className="creation-item">
                        <img 
                          src={`${API_BASE_URL}/gen_img/output/${path}`} 
                          className="img-fluid rounded" 
                          alt={`Generated Image ${index + 1}`}
                          style={{ 
                            width: '100%', 
                            height: '300px', 
                            objectFit: 'cover',
                            cursor: 'pointer'
                          }}
                          onClick={() => {
                            setModalImage(`${API_BASE_URL}/gen_img/output/${path}`);
                            setShowImageModal(true);
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* User Cases 展示区域 */}
        <div id="userCases" className="row mb-4">
          <div className="col-12">
            <div className="card">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="card-title mb-0">User Cases</h5>
                {selectedPromptId && (
                  <button 
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => setSelectedPromptId(null)}
                  >
                    Show All Cases
                  </button>
                )}
              </div>
                <div style={{ 
                  maxHeight: '600px', 
                  overflowY: 'auto',
                  paddingRight: '10px'
                }}>
                  <table className="table">
                    <thead>
                      <tr>
                        <th style={{ width: '12%', textAlign: 'center' }}>Character(Game)</th>
                        <th style={{ width: '58%', textAlign: 'center' }}>Prompt</th>
                        <th style={{ width: '15%', textAlign: 'center' }}>Original Image</th>
                        <th style={{ width: '15%', textAlign: 'center' }}>Generated Image</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userCaseArr
                        .filter(caseItem => selectedPromptId === null || caseItem.prompt_id === selectedPromptId)
                        .map((caseItem, index) => {
                        // 通过 prompt_id 查找对应的 prompt 信息
                        const promptInfo = promptList.find(p => p.prompt_id === caseItem.prompt_id);
                        return (
                          <tr key={index}>
                            <td>
                              <div style={{ 
                                height: '150px', 
                                overflowY: 'auto',
                                padding: '10px',
                                fontSize: '0.9rem',
                                whiteSpace: 'nowrap',
                                display: 'flex',
                                alignItems: 'center'
                              }}>
                                {promptInfo?.role_name} <span style={{ color: '#888', marginLeft: 4 }}>({promptInfo?.origin_game})</span>
                              </div>
                            </td>
                            <td>
                              <div style={{ 
                                height: '150px', 
                                overflowY: 'auto',
                                padding: '10px',
                                fontSize: '0.9rem',
                                whiteSpace: 'pre-line'
                              }}>
                                {promptInfo?.prompt_content}
                              </div>
                            </td>
                            <td>
                              <img 
                                src={caseItem.origin_image_path} 
                                className="img-fluid rounded" 
                                alt="Original Image"
                                style={{ 
                                  width: '100%', 
                                  height: '150px', 
                                  objectFit: 'contain',
                                  cursor: 'pointer',
                                  backgroundColor: '#f8f9fa'
                                }}
                                onClick={() => {
                                  setModalImage(caseItem.origin_image_path);
                                  setShowImageModal(true);
                                }}
                              />
                            </td>
                            <td>
                              <img 
                                src={caseItem.generated_image_path} 
                                className="img-fluid rounded" 
                                alt="Generated Image"
                                style={{ 
                                  width: '100%', 
                                  height: '150px', 
                                  objectFit: 'contain',
                                  cursor: 'pointer',
                                  backgroundColor: '#f8f9fa'
                                }}
                                onClick={() => {
                                  setModalImage(caseItem.generated_image_path);
                                  setShowImageModal(true);
                                }}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing 展示区域 */}
        <div id="pricingAera" className="row mb-4">
          <div className="col-12">
            <div className="card">
              <div className="card-body">
                <h5 className="card-title">Pricing</h5>
                <div className="row align-items-center">
                  <div className="col-md-3">
                    <div className="card pricing-card h-100">
                      <div className="card-body d-flex flex-column">
                        <h5 className="card-title">for trial</h5>
                        <div className="preview-area mt-3 flex-grow-1" id="pricingAera1">
                          <div className="pricing-item">
                              <div>
                                  <span className="price-amount">￥7.9</span>
                                  <span className="price-times">[10 times]</span>
                                  {/* <span style={{ color: '#888', marginLeft: 4 }}>(10 times)</span> */}
                              </div>
                              <button 
                                  className="purchase-button"
                                  onClick={() => handlePurchase(1)}
                                  disabled={isGettingPricingQrCodeURL}
                              >
                                  {isGettingPricingQrCodeURL ? (
                                      <>
                                          <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                          purchasing...
                                      </>
                                  ) : (
                                      'purchase'
                                  )}
                              </button>
                              <div className="feature-list">
                                <div className="feature-item">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" 
                                        viewBox="0 0 24 24" fill="none" stroke="currentColor" 
                                        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
                                        className="lucide lucide-check h-5 w-5 text-primary">
                                      <path d="M20 6 9 17l-5-5"></path>
                                    </svg>
                                    <span><b>10 pictures</b></span>
                                </div>
                                <div className="feature-item">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" 
                                        viewBox="0 0 24 24" fill="none" stroke="currentColor" 
                                        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
                                        className="lucide lucide-check h-5 w-5 text-primary">
                                      <path d="M20 6 9 17l-5-5"></path>
                                    </svg>
                                    <span>high quality download</span>
                                </div>
                                <div className="feature-item">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" 
                                        viewBox="0 0 24 24" fill="none" stroke="currentColor" 
                                        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
                                        className="lucide lucide-check h-5 w-5 text-primary">
                                      <path d="M20 6 9 17l-5-5"></path>
                                    </svg>
                                    <span><b>prompt templates</b></span>
                                </div>
                                <div className="feature-item">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" 
                                        viewBox="0 0 24 24" fill="none" stroke="currentColor" 
                                        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
                                        className="lucide lucide-check h-5 w-5 text-primary">
                                      <path d="M20 6 9 17l-5-5"></path>
                                    </svg>
                                    <span>all styles</span>
                                </div>
                                <div className="feature-item">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" 
                                    viewBox="0 0 24 24" fill="none" stroke="currentColor" 
                                    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
                                    className="lucide lucide-check h-5 w-5 text-primary">
                                      <path d="M20 6 9 17l-5-5"></path>
                                    </svg>
                                    <span>no watermarks</span>
                                </div>
                                <div className="feature-item">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" 
                                        viewBox="0 0 24 24" fill="none" stroke="currentColor" 
                                        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
                                        className="lucide lucide-check h-5 w-5 text-primary">
                                      <path d="M20 6 9 17l-5-5"></path>
                                    </svg>
                                    <span>no advertisements</span>
                                </div>
                                <div className="feature-item">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" 
                                        viewBox="0 0 24 24" fill="none" stroke="currentColor" 
                                        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
                                        className="lucide lucide-check h-5 w-5 text-primary">
                                      <path d="M20 6 9 17l-5-5"></path>
                                    </svg>
                                    <span>commercial usage rights</span>
                                </div>
                              </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="card pricing-card h-100">
                      <div className="card-body d-flex flex-column">
                        <h5 className="card-title">standard</h5>
                        <div className="preview-area mt-3 flex-grow-1" id="pricingAera2">
                          <div className="pricing-item">
                              <div>
                                  <span className="price-amount">￥21.9</span>
                                  <span className="price-times">[30 times]</span>
                              </div>
                              <button 
                                  className="purchase-button"
                                  onClick={() => handlePurchase(2)}
                                  disabled={isGettingPricingQrCodeURL2}
                              >
                                  {isGettingPricingQrCodeURL2 ? (
                                      <>
                                          <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                          purchasing...
                                      </>
                                  ) : (
                                      'purchase'
                                  )}
                              </button>
                              <div className="feature-list">
                                <div className="feature-item">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" 
                                        viewBox="0 0 24 24" fill="none" stroke="currentColor" 
                                        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
                                        className="lucide lucide-check h-5 w-5 text-primary">
                                      <path d="M20 6 9 17l-5-5"></path>
                                    </svg>
                                    <span><b>30 pictures</b></span>
                                </div>
                                <div className="feature-item">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" 
                                        viewBox="0 0 24 24" fill="none" stroke="currentColor" 
                                        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
                                        className="lucide lucide-check h-5 w-5 text-primary">
                                      <path d="M20 6 9 17l-5-5"></path>
                                    </svg>
                                    <span>high quality download</span>
                                </div>
                                <div className="feature-item">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" 
                                        viewBox="0 0 24 24" fill="none" stroke="currentColor" 
                                        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
                                        className="lucide lucide-check h-5 w-5 text-primary">
                                      <path d="M20 6 9 17l-5-5"></path>
                                    </svg>
                                    <span><b>prompt templates</b></span>
                                </div>
                                <div className="feature-item">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" 
                                        viewBox="0 0 24 24" fill="none" stroke="currentColor" 
                                        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
                                        className="lucide lucide-check h-5 w-5 text-primary">
                                      <path d="M20 6 9 17l-5-5"></path>
                                    </svg>
                                    <span>all styles</span>
                                </div>
                                <div className="feature-item">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" 
                                    viewBox="0 0 24 24" fill="none" stroke="currentColor" 
                                    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
                                    className="lucide lucide-check h-5 w-5 text-primary">
                                      <path d="M20 6 9 17l-5-5"></path>
                                    </svg>
                                    <span>no watermarks</span>
                                </div>
                                <div className="feature-item">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" 
                                        viewBox="0 0 24 24" fill="none" stroke="currentColor" 
                                        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
                                        className="lucide lucide-check h-5 w-5 text-primary">
                                      <path d="M20 6 9 17l-5-5"></path>
                                    </svg>
                                    <span>no advertisements</span>
                                </div>
                                <div className="feature-item">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" 
                                        viewBox="0 0 24 24" fill="none" stroke="currentColor" 
                                        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
                                        className="lucide lucide-check h-5 w-5 text-primary">
                                      <path d="M20 6 9 17l-5-5"></path>
                                    </svg>
                                    <span>commercial usage rights</span>
                                </div>
                              </div>
                            </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="card pricing-card h-100">
                      <div className="card-body d-flex flex-column">
                        <h5 className="card-title">premium</h5>
                        <div className="preview-area mt-3 flex-grow-1" id="pricingAera3">
                          <div className="pricing-item">
                              <div>
                                  <span className="price-amount">￥33.9</span>
                                  <span className="price-times">[50 times]</span>
                              </div>
                              <button 
                                  className="purchase-button"
                                  onClick={() => handlePurchase(3)}
                                  disabled={isGettingPricingQrCodeURL3}
                              >
                                  {isGettingPricingQrCodeURL3 ? (
                                      <>
                                          <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                          purchasing...
                                      </>
                                  ) : (
                                      'purchase'
                                  )}
                              </button>
                              <div className="feature-list">
                                <div className="feature-item">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" 
                                        viewBox="0 0 24 24" fill="none" stroke="currentColor" 
                                        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
                                        className="lucide lucide-check h-5 w-5 text-primary">
                                      <path d="M20 6 9 17l-5-5"></path>
                                    </svg>
                                    <span><b>50 pictures</b></span>
                                </div>
                                <div className="feature-item">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" 
                                        viewBox="0 0 24 24" fill="none" stroke="currentColor" 
                                        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
                                        className="lucide lucide-check h-5 w-5 text-primary">
                                      <path d="M20 6 9 17l-5-5"></path>
                                    </svg>
                                    <span>high quality download</span>
                                </div>
                                <div className="feature-item">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" 
                                        viewBox="0 0 24 24" fill="none" stroke="currentColor" 
                                        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
                                        className="lucide lucide-check h-5 w-5 text-primary">
                                      <path d="M20 6 9 17l-5-5"></path>
                                    </svg>
                                    <span><b>prompt templates</b></span>
                                </div>
                                <div className="feature-item">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" 
                                        viewBox="0 0 24 24" fill="none" stroke="currentColor" 
                                        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
                                        className="lucide lucide-check h-5 w-5 text-primary">
                                      <path d="M20 6 9 17l-5-5"></path>
                                    </svg>
                                    <span><b>high availability model</b></span>
                                </div>
                                <div className="feature-item">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" 
                                        viewBox="0 0 24 24" fill="none" stroke="currentColor" 
                                        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
                                        className="lucide lucide-check h-5 w-5 text-primary">
                                      <path d="M20 6 9 17l-5-5"></path>
                                    </svg>
                                    <span>all styles</span>
                                </div>
                                <div className="feature-item">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" 
                                    viewBox="0 0 24 24" fill="none" stroke="currentColor" 
                                    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
                                    className="lucide lucide-check h-5 w-5 text-primary">
                                      <path d="M20 6 9 17l-5-5"></path>
                                    </svg>
                                    <span>no watermarks</span>
                                </div>
                                <div className="feature-item">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" 
                                        viewBox="0 0 24 24" fill="none" stroke="currentColor" 
                                        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
                                        className="lucide lucide-check h-5 w-5 text-primary">
                                      <path d="M20 6 9 17l-5-5"></path>
                                    </svg>
                                    <span>no advertisements</span>
                                </div>
                                <div className="feature-item">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" 
                                        viewBox="0 0 24 24" fill="none" stroke="currentColor" 
                                        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
                                        className="lucide lucide-check h-5 w-5 text-primary">
                                      <path d="M20 6 9 17l-5-5"></path>
                                    </svg>
                                    <span>commercial usage rights</span>
                                </div>
                              </div>
                            </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="card pricing-card h-100">
                      <div className="card-body d-flex flex-column">
                        <h5 className="card-title">professional</h5>
                        <div className="preview-area mt-3 flex-grow-1" id="pricingAera4">
                          <div className="pricing-item">
                            <div>
                                <span className="price-amount">￥55.9</span>
                                <span className="price-times">[100 times]</span>
                            </div>
                            <button 
                                className="purchase-button"
                                onClick={() => handlePurchase(4)}
                                disabled={isGettingPricingQrCodeURL4}
                            >
                                {isGettingPricingQrCodeURL4 ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                        purchasing...
                                    </>
                                ) : (
                                    'purchase'
                                )}
                            </button>
                            <div className="feature-list">
                              <div className="feature-item">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" 
                                      viewBox="0 0 24 24" fill="none" stroke="currentColor" 
                                      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
                                      className="lucide lucide-check h-5 w-5 text-primary">
                                    <path d="M20 6 9 17l-5-5"></path>
                                  </svg>
                                  <span><b>100 pictures</b></span>
                              </div>
                              <div className="feature-item">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" 
                                      viewBox="0 0 24 24" fill="none" stroke="currentColor" 
                                      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
                                      className="lucide lucide-check h-5 w-5 text-primary">
                                    <path d="M20 6 9 17l-5-5"></path>
                                  </svg>
                                  <span>high quality download</span>
                              </div>
                              <div className="feature-item">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" 
                                      viewBox="0 0 24 24" fill="none" stroke="currentColor" 
                                      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
                                      className="lucide lucide-check h-5 w-5 text-primary">
                                    <path d="M20 6 9 17l-5-5"></path>
                                  </svg>
                                  <span><b>prompt templates</b></span>
                              </div>
                              <div className="feature-item">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" 
                                      viewBox="0 0 24 24" fill="none" stroke="currentColor" 
                                      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
                                      className="lucide lucide-check h-5 w-5 text-primary">
                                    <path d="M20 6 9 17l-5-5"></path>
                                  </svg>
                                  <span><b>high availability model</b></span>
                              </div>
                              <div className="feature-item">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" 
                                      viewBox="0 0 24 24" fill="none" stroke="currentColor" 
                                      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
                                      className="lucide lucide-check h-5 w-5 text-primary">
                                    <path d="M20 6 9 17l-5-5"></path>
                                  </svg>
                                  <span>all styles</span>
                              </div>
                              <div className="feature-item">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" 
                                  viewBox="0 0 24 24" fill="none" stroke="currentColor" 
                                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
                                  className="lucide lucide-check h-5 w-5 text-primary">
                                    <path d="M20 6 9 17l-5-5"></path>
                                  </svg>
                                  <span>no watermarks</span>
                              </div>
                              <div className="feature-item">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" 
                                      viewBox="0 0 24 24" fill="none" stroke="currentColor" 
                                      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
                                      className="lucide lucide-check h-5 w-5 text-primary">
                                    <path d="M20 6 9 17l-5-5"></path>
                                  </svg>
                                  <span>no advertisements</span>
                              </div>
                              <div className="feature-item">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" 
                                      viewBox="0 0 24 24" fill="none" stroke="currentColor" 
                                      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
                                      className="lucide lucide-check h-5 w-5 text-primary">
                                    <path d="M20 6 9 17l-5-5"></path>
                                  </svg>
                                  <span>commercial usage rights</span>
                              </div>
                              <div className="feature-item">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" 
                                      viewBox="0 0 24 24" fill="none" stroke="currentColor" 
                                      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
                                      className="lucide lucide-check h-5 w-5 text-primary">
                                    <path d="M20 6 9 17l-5-5"></path>
                                  </svg>
                                  <span><b>build-in prompt optimization</b></span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>  

        <Footer />
      
      </div>

      {/* 图片查看模态框 */}
      <div 
        className={`modal fade ${showImageModal ? 'show' : ''}`} 
        style={{ display: showImageModal ? 'block' : 'none' }}
        onClick={() => {
          setShowImageModal(false)
          setModalImage(undefined)
        }}
      >
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-body p-0">
              <button 
                type="button" 
                className="delete-image-btn"
                style={{ position: 'absolute', top: 10, right: 10, zIndex: 1000 }}
                onClick={() => {
                  setShowImageModal(false)
                  setModalImage(undefined)
                }}
              ><i className="fas fa-times"></i></button>
              <img 
                src={modalImage} 
                className="img-fluid" 
                alt="Full size preview"
                style={{ width: '100%', height: 'auto', display: modalImage ? 'block' : 'none' }}
              />
            </div>
          </div>
        </div>
      </div>
      {showImageModal && (
        <div className="modal-backdrop fade show"></div>
      )}
    </>
  )
}