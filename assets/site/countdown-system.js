// countdown-system.js
// ระบบนับถอยหลังก่อนเริ่มการออกกำลังกาย

/**
 * สร้างและแสดงการนับถอยหลัง
 * @param {number} seconds จำนวนวินาทีที่ต้องการนับถอยหลัง (ค่าเริ่มต้น 5 วินาที)
 * @param {Function} onComplete ฟังก์ชันที่จะเรียกเมื่อนับถอยหลังเสร็จ
 */
function startCountdown(seconds = 5, onComplete = null) {
    // สร้าง element สำหรับแสดงการนับถอยหลัง
    const countdownElement = document.createElement('div');
    countdownElement.id = 'countdown-container';
    countdownElement.innerHTML = `
      <div class="countdown-overlay"></div>
      <div class="countdown-content">
        <div class="countdown-text">เตรียมพร้อม</div>
        <div class="countdown-number">${seconds}</div>
        <div class="countdown-message">กำลังเริ่มนับการออกกำลังกาย</div>
      </div>
    `;
    
    // เพิ่ม CSS สำหรับการนับถอยหลัง
    const countdownStyle = document.createElement('style');
    countdownStyle.textContent = `
      #countdown-container {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 2000;
      }
      
      .countdown-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.7);
      }
      
      .countdown-content {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background-color: rgba(255, 255, 255, 0.9);
        border-radius: 16px;
        padding: 2rem;
        box-shadow: 0 0 30px rgba(0, 0, 0, 0.3);
        min-width: 300px;
        text-align: center;
      }
      
      .countdown-text {
        font-size: 1.5rem;
        font-weight: 600;
        color: #4285F4;
        margin-bottom: 1rem;
      }
      
      .countdown-number {
        font-size: 5rem;
        font-weight: 700;
        color: #4285F4;
        line-height: 1;
        margin-bottom: 1rem;
        width: 120px;
        height: 120px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        background: linear-gradient(135deg, #4285F4, #34A853);
        color: white;
        animation: pulse 1s infinite;
      }
      
      @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
      }
      
      .countdown-message {
        font-size: 1.2rem;
        color: #757575;
      }
      
      @media (max-width: 480px) {
        .countdown-content {
          min-width: 250px;
          padding: 1.5rem;
        }
        
        .countdown-text {
          font-size: 1.2rem;
        }
        
        .countdown-number {
          font-size: 4rem;
          width: 100px;
          height: 100px;
        }
        
        .countdown-message {
          font-size: 1rem;
        }
      }
    `;
    
    // เพิ่ม elements ลงใน DOM
    document.head.appendChild(countdownStyle);
    document.body.appendChild(countdownElement);
    
    // แสดงเสียงเตรียมพร้อม
    speakCountdown("เตรียมพร้อม");
    
    // เริ่มต้นการนับถอยหลัง
    let countdownValue = seconds;
    const numberElement = countdownElement.querySelector('.countdown-number');
    
    const countdownInterval = setInterval(() => {
      countdownValue -= 1;
      numberElement.textContent = countdownValue;
      
      // แสดงเสียงตัวเลข
      speakCountdown(countdownValue.toString());
      
      // ถ้านับถึง 0 แล้ว
      if (countdownValue <= 0) {
        clearInterval(countdownInterval);
        
        // แสดงข้อความเริ่มต้น
        numberElement.textContent = "เริ่ม!";
        speakCountdown("เริ่มการออกกำลังกาย");
        
        // ลบ element หลังจากแสดงเสร็จ
        setTimeout(() => {
          document.body.removeChild(countdownElement);
          
          // เรียกใช้ callback หลังจากนับถอยหลังเสร็จ
          if (typeof onComplete === 'function') {
            onComplete();
          }
        }, 1000);
      }
    }, 1000);
  }
  
  /**
   * ฟังก์ชันพูดตัวเลขนับถอยหลัง
   * @param {string} text ข้อความที่ต้องการให้พูด
   */
  function speakCountdown(text) {
    // ตรวจสอบว่ามีการเปิดใช้งานเสียงหรือไม่
    if (window.speechSynthesis && (window.voiceFeedbackEnabled === undefined || window.voiceFeedbackEnabled)) {
      // ยกเลิกเสียงที่กำลังพูดอยู่ (ถ้ามี)
      window.speechSynthesis.cancel();
      
      // สร้างข้อความใหม่
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'th-TH';
      utterance.volume = 1.0;
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      
      // พูดข้อความ
      window.speechSynthesis.speak(utterance);
    }
  }
  
  export const countdownSystem = {
    startCountdown
  };