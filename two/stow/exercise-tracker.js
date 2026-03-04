// exercise-tracker.js
// ระบบบันทึกการออกกำลังกายและเพิ่มเสียงบรรยาย

// ข้อมูลการออกกำลังกาย
let exerciseHistory = {
    // จะเก็บข้อมูลแต่ละท่า แยกตามวันที่
    // format: { "2025-04-07": { "exercise1": { rounds: 2, leftReps: 20, rightReps: 20 } } }
  };
  
  // ชื่อท่าออกกำลังกาย (ใช้ในการบันทึก)
  const exerciseNames = {
    1: "ท่ายกขาด้านข้าง",
    2: "ท่าอื่นๆ"
  };
  
  // สร้างหรืออัปเดต localStorage
  function initializeLocalStorage() {
    if (!localStorage.getItem('exerciseHistory')) {
      localStorage.setItem('exerciseHistory', JSON.stringify(exerciseHistory));
    } else {
      // โหลดข้อมูลจาก localStorage
      try {
        exerciseHistory = JSON.parse(localStorage.getItem('exerciseHistory')) || {};
      } catch (e) {
        console.error("เกิดข้อผิดพลาดในการอ่านประวัติการออกกำลังกาย:", e);
        exerciseHistory = {};
        localStorage.setItem('exerciseHistory', JSON.stringify(exerciseHistory));
      }
    }
  }
  
  // บันทึกการออกกำลังกาย
  function saveExercise(exerciseNumber, rounds, leftReps, rightReps, duration = 0) {
    console.log("=== saveExercise called ===");
    console.log("duration received:", duration);
    console.log("========================");
    
    try {
      // โหลดข้อมูลจาก localStorage
      const storedHistory = JSON.parse(localStorage.getItem('exerciseHistory')) || {};
      
      // รับวันที่ปัจจุบัน
      const today = new Date().toISOString().split('T')[0]; // format: YYYY-MM-DD
      
      // สร้างหรืออัปเดตโครงสร้างข้อมูล
      if (!storedHistory[today]) {
        storedHistory[today] = {};
      }
      
      const exerciseKey = `exercise${exerciseNumber}`;
      if (!storedHistory[today][exerciseKey]) {
        storedHistory[today][exerciseKey] = { rounds: 0, leftReps: 0, rightReps: 0, totalDuration: 0 };
      }
      
      // อัปเดตข้อมูล
      storedHistory[today][exerciseKey].rounds += rounds;
      storedHistory[today][exerciseKey].leftReps += leftReps;
      storedHistory[today][exerciseKey].rightReps += rightReps;
      storedHistory[today][exerciseKey].totalDuration = (storedHistory[today][exerciseKey].totalDuration || 0) + duration;
      
      // บันทึกข้อมูลลง localStorage
      localStorage.setItem('exerciseHistory', JSON.stringify(storedHistory));
      
      // อัปเดตตัวแปร exerciseHistory
      exerciseHistory = storedHistory;
      
      // บรรยายเสียงเกี่ยวกับการบันทึก
      const exerciseName = exerciseNames[exerciseNumber];
      let speechText = `บันทึกการออกกำลังกาย ${exerciseName} จำนวน ${rounds} รอบ ขาซ้าย ${leftReps} ครั้ง ขาขวา ${rightReps} ครั้ง`;
      
      // ตรวจสอบว่ามีการเปิดใช้งานเสียงหรือไม่
      if (window.voiceFeedbackEnabled) {
        speakFeedback(speechText);
      }
      
      // แสดงหน้าต่างบันทึกผลสำเร็จ
      showSaveResultPopup(exerciseNumber, rounds, leftReps, rightReps, duration);
      
      return true;
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการบันทึกการออกกำลังกาย:", error);
      return false;
    }
  }
  
  // แสดงหน้าต่างผลการบันทึก
  function showSaveResultPopup(exerciseNumber, rounds, leftReps, rightReps, duration = 0) {
    console.log("=== showSaveResultPopup called ===");
    console.log("duration:", duration);
    
    // ลบหน้าต่างเก่าถ้ามี
    const existingPopup = document.getElementById('save-result-popup');
    if (existingPopup) {
      existingPopup.remove();
    }
    
    const exerciseName = exerciseNames[exerciseNumber] || `ท่าที่ ${exerciseNumber}`;
    const totalReps = leftReps + rightReps;
    
    // แปลงระยะเวลาเป็นนาทีและวินาที
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    const durationText = `${minutes} นาที ${seconds} วินาที`;
    
    console.log("durationText:", durationText);
    console.log("==================================");
    
    // สร้างหน้าต่าง popup
    const popup = document.createElement('div');
    popup.id = 'save-result-popup';
    popup.innerHTML = `
      <div class="popup-overlay"></div>
      <div class="popup-content">
        <div class="popup-header">
          <div class="success-icon">✓</div>
          <h2>บันทึกสำเร็จ!</h2>
        </div>
        <div class="popup-body">
          <div class="exercise-summary">
            <h3>${exerciseName}</h3>
            <div class="summary-grid">
              <div class="summary-item">
                <div class="summary-label">จำนวนรอบ</div>
                <div class="summary-value">${rounds}</div>
              </div>
              <div class="summary-item">
                <div class="summary-label">ขาซ้าย</div>
                <div class="summary-value">${leftReps} ครั้ง</div>
              </div>
              <div class="summary-item">
                <div class="summary-label">ขาขวา</div>
                <div class="summary-value">${rightReps} ครั้ง</div>
              </div>
              <div class="summary-item">
                <div class="summary-label">ระยะเวลา</div>
                <div class="summary-value time">${durationText}</div>
              </div>
              <div class="summary-item highlight">
                <div class="summary-label">รวมทั้งหมด</div>
                <div class="summary-value">${totalReps} ครั้ง</div>
              </div>
            </div>
          </div>
          <div class="popup-message">
            ผลการออกกำลังกายของคุณถูกบันทึกเรียบร้อยแล้ว
          </div>
        </div>
        <div class="popup-footer">
          <button id="close-popup-btn" class="action-button primary">ปิด</button>
        </div>
      </div>
    `;
    
    // เพิ่ม CSS
    const popupStyle = document.createElement('style');
    popupStyle.id = 'save-result-popup-style';
    popupStyle.textContent = `
      #save-result-popup {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 3000;
        animation: fadeIn 0.3s ease-in-out;
      }
      
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      
      .popup-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.6);
      }
      
      .popup-content {
        position: relative;
        background: white;
        border-radius: 16px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        max-width: 500px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
        animation: slideUp 0.3s ease-out;
      }
      
      @keyframes slideUp {
        from {
          transform: translateY(50px);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }
      
      .popup-header {
        background: linear-gradient(135deg, #4CAF50, #45a049);
        color: white;
        padding: 2rem;
        text-align: center;
        border-radius: 16px 16px 0 0;
      }
      
      .success-icon {
        width: 80px;
        height: 80px;
        background: white;
        color: #4CAF50;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 3rem;
        font-weight: bold;
        margin: 0 auto 1rem;
        animation: scaleIn 0.5s ease-out;
      }
      
      @keyframes scaleIn {
        from {
          transform: scale(0);
        }
        to {
          transform: scale(1);
        }
      }
      
      .popup-header h2 {
        margin: 0;
        font-size: 1.8rem;
      }
      
      .popup-body {
        padding: 2rem;
      }
      
      .exercise-summary h3 {
        color: #4285F4;
        margin-top: 0;
        margin-bottom: 1.5rem;
        text-align: center;
        font-size: 1.3rem;
      }
      
      .summary-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 1rem;
        margin-bottom: 1.5rem;
      }
      
      .summary-item {
        background: #f5f5f5;
        padding: 1rem;
        border-radius: 8px;
        text-align: center;
      }
      
      .summary-item.highlight {
        grid-column: 1 / -1;
        background: linear-gradient(135deg, #4285F4, #3367d6);
        color: white;
      }
      
      .summary-label {
        font-size: 0.9rem;
        margin-bottom: 0.5rem;
        opacity: 0.8;
      }
      
      .summary-item.highlight .summary-label {
        opacity: 1;
      }
      
      .summary-value {
        font-size: 1.8rem;
        font-weight: bold;
        color: #4285F4;
      }
      
      .summary-value.time {
        font-size: 1.3rem;
      }
      
      .summary-item.highlight .summary-value {
        color: white;
      }
      
      .popup-message {
        text-align: center;
        color: #757575;
        font-size: 1rem;
        padding: 1rem;
        background: #E3F2FD;
        border-radius: 8px;
      }
      
      .popup-footer {
        display: flex;
        gap: 1rem;
        padding: 1.5rem 2rem;
        background: #f9f9f9;
        border-radius: 0 0 16px 16px;
      }
      
      .popup-footer .action-button {
        flex: 1;
        padding: 1rem;
        border: none;
        border-radius: 8px;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
      }
      
      .popup-footer .action-button.primary {
        background: linear-gradient(135deg, #4285F4, #3367d6);
        color: white;
      }
      
      .popup-footer .action-button.primary:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(66, 133, 244, 0.4);
      }
      
      .popup-footer .action-button.secondary {
        background: white;
        color: #4285F4;
        border: 2px solid #4285F4;
      }
      
      .popup-footer .action-button.secondary:hover {
        background: #4285F4;
        color: white;
      }
      
      @media (max-width: 480px) {
        .popup-content {
          width: 95%;
        }
        
        .popup-header {
          padding: 1.5rem;
        }
        
        .success-icon {
          width: 60px;
          height: 60px;
          font-size: 2rem;
        }
        
        .popup-header h2 {
          font-size: 1.5rem;
        }
        
        .popup-body {
          padding: 1.5rem;
        }
        
        .summary-grid {
          grid-template-columns: 1fr;
        }
        
        .summary-item.highlight {
          grid-column: 1;
        }
        
        .popup-footer {
          flex-direction: column;
          padding: 1rem 1.5rem;
        }
      }
    `;
    
    // ลบ style เก่าถ้ามี
    const oldStyle = document.getElementById('save-result-popup-style');
    if (oldStyle) {
      oldStyle.remove();
    }
    
    document.head.appendChild(popupStyle);
    document.body.appendChild(popup);
    
    // เพิ่ม event listeners
    document.getElementById('close-popup-btn').addEventListener('click', () => {
      popup.remove();
    });
    
    // ปิดเมื่อคลิกที่ overlay
    popup.querySelector('.popup-overlay').addEventListener('click', () => {
      popup.remove();
    });
  }
  
  // ฟังก์ชัน createExerciseHistoryDisplay ถูกลบออก
  // เพื่อไม่ให้แสดงประวัติการออกกำลังกาย
  // เหลือเฉพาะการบันทึกผลสำเร็จเท่านั้น
  
  // ปรับปรุงการบรรยายเสียง
  function speakFeedback(text) {
    if (!window.speechSynthesis) {
      console.warn("เบราว์เซอร์นี้ไม่รองรับ Speech Synthesis API");
      return;
    }
    
    // ตรวจสอบว่ากำลังพูดอยู่หรือไม่
    if (window.speechSynthesis.speaking) {
      // ถ้ากำลังพูดอยู่ ให้ยกเลิกการพูดปัจจุบัน
      window.speechSynthesis.cancel();
    }
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'th-TH';
    utterance.volume = 1.0;
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    
    // เพิ่ม delay เล็กน้อยเพื่อให้แน่ใจว่าจะไม่มีการพูดซ้อนกัน
    setTimeout(() => {
      window.speechSynthesis.speak(utterance);
    }, 100);
  }
  
  // ฟังก์ชัน addHistoryButton ถูกลบออก
  // เพื่อไม่ให้มีปุ่มแสดงประวัติ
  
  // เพิ่มปุ่มเปิด/ปิดเสียง
  function addToggleVoiceButton() {
    // ตรวจสอบว่ามีปุ่มอยู่แล้วหรือไม่
    if (document.getElementById('voice-button')) {
      return;
    }
    
    const controlPanel = document.querySelector('.control-panel');
    if (!controlPanel) {
      console.error("ไม่พบ control-panel");
      return;
    }
    
    // รับสถานะปัจจุบันจาก localStorage หรือตั้งค่าเริ่มต้นเป็น true
    let voiceEnabled = localStorage.getItem('voiceFeedbackEnabled') !== 'false';
    
    // กำหนดตัวแปร window.voiceFeedbackEnabled ด้วย
    window.voiceFeedbackEnabled = voiceEnabled;
    
    const voiceButton = document.createElement('button');
    voiceButton.id = 'voice-button';
    voiceButton.className = 'action-button';
    voiceButton.textContent = voiceEnabled ? 'ปิดเสียง' : 'เปิดเสียง';
    voiceButton.style.backgroundColor = voiceEnabled ? '#4CAF50' : '#FF5252';
    
    voiceButton.addEventListener('click', () => {
      voiceEnabled = !voiceEnabled;
      window.voiceFeedbackEnabled = voiceEnabled; // อัปเดตตัวแปรใน window
      localStorage.setItem('voiceFeedbackEnabled', voiceEnabled);
      
      voiceButton.textContent = voiceEnabled ? 'ปิดเสียง' : 'เปิดเสียง';
      voiceButton.style.backgroundColor = voiceEnabled ? '#4CAF50' : '#FF5252';
      
      // แจ้งเตือนด้วยเสียง
      if (voiceEnabled) {
        speakFeedback("เปิดใช้งานเสียงบรรยายแล้ว");
      }
    });
    
    controlPanel.appendChild(voiceButton);
  }
  
  // ฟังก์ชันสำหรับลงทะเบียน event listeners
  function registerEventListeners() {
    // ตรวจจับเมื่อทำครบรอบ
    document.addEventListener('roundCompleted', (event) => {
      const { exerciseNumber, rounds, leftReps, rightReps, duration } = event.detail;
      saveExercise(exerciseNumber, rounds, leftReps, rightReps, duration || 0);
    });
    
    // ตรวจจับเมื่อมีการสร้าง/แสดงหน้าจอหลักของโปรแกรม
    document.addEventListener('DOMContentLoaded', () => {
      initializeLocalStorage();
      
      // หน่วงเวลาเล็กน้อยให้แน่ใจว่า DOM สร้างเสร็จสมบูรณ์แล้ว
      setTimeout(() => {
        addToggleVoiceButton();
      }, 500);
    });
  }
  
  // เริ่มต้นระบบบันทึกการออกกำลังกาย
  function initializeExerciseTracker() {
    initializeLocalStorage();
    registerEventListeners();
    
    // เพิ่มปุ่มในกรณีที่ DOM สร้างเสร็จแล้ว
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      setTimeout(() => {
        addToggleVoiceButton();
      }, 500);
    }
    
    // ตรวจสอบว่ามีการเปิดใช้งานเสียงหรือไม่
    const voiceEnabled = localStorage.getItem('voiceFeedbackEnabled') !== 'false';
    window.voiceFeedbackEnabled = voiceEnabled;
    
    return {
      saveExercise,
      speakFeedback
    };
  }
  
  // Export functions
  export const exerciseTracker = {
    initialize: initializeExerciseTracker,
    saveExercise,
    speakFeedback
  };