// exercise-tracker.js
// ระบบบันทึกการออกกำลังกายและเพิ่มเสียงบรรยาย - อัปเดตสำหรับท่ายกแขนเหนือศีรษะ

// ข้อมูลการออกกำลังกาย
let exerciseHistory = {
    // จะเก็บข้อมูลแต่ละท่า แยกตามวันที่
    // format: { "2025-04-07": { "exercise1": { rounds: 2, leftReps: 20, rightReps: 20 } } }
  };
  
  // 🔄 ชื่อท่าออกกำลังกาย (อัปเดตสำหรับท่ายกแขนเหนือศีรษะ)
  const exerciseNames = {
    1: "ท่าเหยียดเข่า",
    2: "ท่ายกแขนเหนือศีรษะ" // เปลี่ยนจาก "ท่ายกขาด้านข้าง"
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
  function saveExercise(exerciseNumber, rounds, leftReps, rightReps) {
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
        storedHistory[today][exerciseKey] = { rounds: 0, leftReps: 0, rightReps: 0 };
      }
      
      // อัปเดตข้อมูล
      storedHistory[today][exerciseKey].rounds += rounds;
      storedHistory[today][exerciseKey].leftReps += leftReps;
      storedHistory[today][exerciseKey].rightReps += rightReps;
      
      // บันทึกข้อมูลลง localStorage
      localStorage.setItem('exerciseHistory', JSON.stringify(storedHistory));
      
      // อัปเดตตัวแปร exerciseHistory
      exerciseHistory = storedHistory;
      
      // 🔄 บรรยายเสียงเกี่ยวกับการบันทึก (เปลี่ยนจากขาเป็นแขน)
      const exerciseName = exerciseNames[exerciseNumber];
      let speechText = `บันทึกการออกกำลังกาย ${exerciseName} จำนวน ${rounds} รอบ แขนซ้าย ${leftReps} ครั้ง แขนขวา ${rightReps} ครั้ง`;
      
      // ตรวจสอบว่ามีการเปิดใช้งานเสียงหรือไม่
      if (window.voiceFeedbackEnabled) {
        speakFeedback(speechText);
      }
      
      return true;
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการบันทึกการออกกำลังกาย:", error);
      return false;
    }
  }
  
  // แสดงประวัติการออกกำลังกาย
  function createExerciseHistoryDisplay() {
    try {
      // โหลดข้อมูลจาก localStorage
      const storedHistory = JSON.parse(localStorage.getItem('exerciseHistory')) || {};
      
      // สร้าง HTML element
      const historyContainer = document.createElement('div');
      historyContainer.id = 'exercise-history-container';
      historyContainer.className = 'exercise-history-container';
      
      // เพิ่ม header
      historyContainer.innerHTML = `
        <div class="history-header">
          <h3>ประวัติการออกกำลังกาย</h3>
          <button id="close-history-btn" class="action-button">ปิด</button>
        </div>
        <div class="history-content"></div>
      `;
      
      // เพิ่ม event listener สำหรับปุ่มปิด
      document.body.appendChild(historyContainer);
      document.getElementById('close-history-btn').addEventListener('click', () => {
        historyContainer.remove();
      });
      
      const historyContent = historyContainer.querySelector('.history-content');
      
      // จัดการข้อมูลและสร้าง HTML
      if (Object.keys(storedHistory).length === 0) {
        historyContent.innerHTML = '<p class="no-history">ยังไม่มีประวัติการออกกำลังกาย</p>';
        return;
      }
      
      // เรียงลำดับวันที่จากล่าสุดไปเก่าสุด
      const sortedDates = Object.keys(storedHistory).sort((a, b) => new Date(b) - new Date(a));
      
      // สร้าง HTML สำหรับแต่ละวัน
      sortedDates.forEach(date => {
        const dateObj = new Date(date);
        const formattedDate = dateObj.toLocaleDateString('th-TH', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          weekday: 'long'
        });
        
        const dailyExercises = storedHistory[date];
        const exerciseKeys = Object.keys(dailyExercises);
        
        if (exerciseKeys.length === 0) return;
        
        // สร้าง header สำหรับวันนี้
        const daySection = document.createElement('div');
        daySection.className = 'day-section';
        daySection.innerHTML = `<h4 class="date-header">${formattedDate}</h4>`;
        
        // สร้าง HTML สำหรับแต่ละท่าออกกำลังกาย
        exerciseKeys.forEach(exerciseKey => {
          const exerciseNum = parseInt(exerciseKey.replace('exercise', ''));
          const exerciseName = exerciseNames[exerciseNum] || `ท่าที่ ${exerciseNum}`;
          const data = dailyExercises[exerciseKey];
          
          const exerciseItem = document.createElement('div');
          exerciseItem.className = 'exercise-item';
          
          // แสดงข้อมูลท่าออกกำลังกาย
          exerciseItem.innerHTML = `
            <div class="exercise-name">${exerciseName}</div>
            <div class="exercise-details">
              <div class="detail-item">รอบ: <span>${data.rounds}</span></div>
              <div class="detail-item">แขนซ้าย: <span>${data.leftReps} ครั้ง</span></div>
              <div class="detail-item">แขนขวา: <span>${data.rightReps} ครั้ง</span></div>
            </div>
          `;
          
          daySection.appendChild(exerciseItem);
        });
        
        historyContent.appendChild(daySection);
      });
      
      // เพิ่ม CSS สำหรับหน้าต่างประวัติ
      const historyStyle = document.createElement('style');
      historyStyle.textContent = `
        .exercise-history-container {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 90%;
          max-width: 600px;
          max-height: 80vh;
          background-color: white;
          border-radius: 12px;
          box-shadow: 0 4px 25px rgba(0, 0, 0, 0.2);
          z-index: 2000;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        
        .history-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.5rem;
          background: linear-gradient(135deg, #4285F4, #3367d6);
          color: white;
        }
        
        .history-header h3 {
          margin: 0;
          font-size: 1.3rem;
        }
        
        .history-content {
          padding: 1.5rem;
          overflow-y: auto;
          max-height: calc(80vh - 60px);
        }
        
        .no-history {
          text-align: center;
          color: #757575;
          font-style: italic;
          padding: 2rem 0;
        }
        
        .day-section {
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #E0E0E0;
        }
        
        .date-header {
          color: #4285F4;
          margin-bottom: 1rem;
          font-size: 1.1rem;
        }
        
        .exercise-item {
          background-color: #f5f5f5;
          border-radius: 8px;
          padding: 1rem;
          margin-bottom: 1rem;
        }
        
        .exercise-name {
          font-weight: 600;
          margin-bottom: 0.5rem;
          color: #212121;
        }
        
        .exercise-details {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
        }
        
        .detail-item {
          font-size: 0.9rem;
          color: #757575;
        }
        
        .detail-item span {
          font-weight: 600;
          color: #4285F4;
        }
        
        #close-history-btn {
          background-color: rgba(255, 255, 255, 0.2);
          color: white;
          min-width: auto;
          padding: 0.5rem 1rem;
        }
        
        #close-history-btn:hover {
          background-color: rgba(255, 255, 255, 0.3);
        }
        
        @media (max-width: 768px) {
          .exercise-details {
            flex-direction: column;
            gap: 0.5rem;
          }
        }
      `;
      
      document.head.appendChild(historyStyle);
      
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการแสดงประวัติการออกกำลังกาย:", error);
    }
  }
  
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
  
  // เพิ่มปุ่มแสดงประวัติการออกกำลังกาย
  function addHistoryButton() {
    // ตรวจสอบว่ามีปุ่มอยู่แล้วหรือไม่
    if (document.getElementById('history-button')) {
      return;
    }
    
    const controlPanel = document.querySelector('.control-panel');
    if (!controlPanel) {
      console.error("ไม่พบ control-panel");
      return;
    }
    
    const historyButton = document.createElement('button');
    historyButton.id = 'history-button';
    historyButton.className = 'action-button';
    historyButton.textContent = 'ประวัติ';
    historyButton.addEventListener('click', createExerciseHistoryDisplay);
    
    controlPanel.appendChild(historyButton);
  }
  
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
      const { exerciseNumber, rounds, leftReps, rightReps } = event.detail;
      saveExercise(exerciseNumber, rounds, leftReps, rightReps);
    });
    
    // ตรวจจับเมื่อมีการสร้าง/แสดงหน้าจอหลักของโปรแกรม
    document.addEventListener('DOMContentLoaded', () => {
      initializeLocalStorage();
      
      // หน่วงเวลาเล็กน้อยให้แน่ใจว่า DOM สร้างเสร็จสมบูรณ์แล้ว
      setTimeout(() => {
        addHistoryButton();
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
        addHistoryButton();
        addToggleVoiceButton();
      }, 500);
    }
    
    // ตรวจสอบว่ามีการเปิดใช้งานเสียงหรือไม่
    const voiceEnabled = localStorage.getItem('voiceFeedbackEnabled') !== 'false';
    window.voiceFeedbackEnabled = voiceEnabled;
    
    return {
      saveExercise,
      createExerciseHistoryDisplay,
      speakFeedback
    };
  }
  
  // Export functions
  export const exerciseTracker = {
    initialize: initializeExerciseTracker,
    saveExercise,
    speakFeedback,
    showHistory: createExerciseHistoryDisplay
  };