// angle-display.js - แก้ไขการแสดงเวลาค้างแขน
// ระบบแสดงผลมุมการยกแขน (Standing Dumbbell Curl) - ปรับปรุงการแสดงผล

/**
 * สร้างและแสดงแถบวัดมุมการยกแขน
 * @param {HTMLElement} container - element ที่ต้องการแสดงแถบวัด
 */
export function createAngleGauge(container) {
    // ตรวจสอบว่ามีแถบวัดอยู่แล้วหรือไม่
    if (document.getElementById('angle-gauge-container')) {
      return;
    }
  
    // สร้าง element สำหรับแสดงแถบวัดมุม
    const gaugeContainer = document.createElement('div');
    gaugeContainer.id = 'angle-gauge-container';
    gaugeContainer.className = 'angle-gauge-container';
  
    // สร้างแถบวัดสำหรับแขนซ้าย
    const leftGauge = document.createElement('div');
    leftGauge.id = 'left-angle-gauge';
    leftGauge.className = 'angle-gauge';
    leftGauge.innerHTML = `
      <div class="gauge-label">มุมแขนซ้าย: <span id="left-angle-value">0°</span></div>
      <div class="gauge-bar">
        <div class="gauge-scale"></div>
        <div class="gauge-target"></div>
        <div class="gauge-needle" id="left-gauge-needle"></div>
      </div>
      <div class="gauge-ticks">
        <span>0°</span>
        <span>30°</span>
        <span>60°</span>
        <span>90°</span>
        <span>120°</span>
        <span>150°</span>
        <span>180°</span>
      </div>
    `;
  
    // สร้างแถบวัดสำหรับแขนขวา
    const rightGauge = document.createElement('div');
    rightGauge.id = 'right-angle-gauge';
    rightGauge.className = 'angle-gauge';
    rightGauge.innerHTML = `
      <div class="gauge-label">มุมแขนขวา: <span id="right-angle-value">0°</span></div>
      <div class="gauge-bar">
        <div class="gauge-scale"></div>
        <div class="gauge-target"></div>
        <div class="gauge-needle" id="right-gauge-needle"></div>
      </div>
      <div class="gauge-ticks">
        <span>0°</span>
        <span>30°</span>
        <span>60°</span>
        <span>90°</span>
        <span>120°</span>
        <span>150°</span>
        <span>180°</span>
      </div>
    `;
  
    // เพิ่มตัวแสดงเวลาค้างแขนขนาดใหญ่
    const holdTimerDisplay = document.createElement('div');
    holdTimerDisplay.id = 'large-hold-timer';
    holdTimerDisplay.className = 'large-hold-timer hidden';
    holdTimerDisplay.innerHTML = `
      <div class="timer-display">
        <div class="timer-label">เวลาค้างแขน</div>
        <div class="timer-value" id="hold-timer-value">0.0</div>
        <div class="timer-unit">วินาที</div>
        <div class="timer-progress">
          <div class="timer-progress-bar" id="timer-progress-bar"></div>
        </div>
      </div>
    `;
  
    // เพิ่ม CSS สำหรับแถบวัดมุม (แก้ไขสำหรับท่ายกแขน)
    const gaugeStyle = document.createElement('style');
    gaugeStyle.textContent = `
      .angle-gauge-container {
        position: absolute;
        bottom: 20px;
        left: 0;
        width: 100%;
        display: flex;
        justify-content: space-around;
        flex-wrap: wrap;
        padding: 10px;
        background-color: rgba(0, 0, 0, 0.6);
        border-radius: 8px;
        z-index: 1000;
      }
      
      .angle-gauge {
        width: 45%;
        margin-bottom: 15px;
      }
      
      .gauge-label {
        color: white;
        font-size: 16px;
        font-weight: bold;
        margin-bottom: 5px;
        text-align: center;
      }
      
      .gauge-bar {
        position: relative;
        height: 20px;
        background-color: #333;
        border-radius: 10px;
        overflow: hidden;
      }
      
      .gauge-scale {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(to right, 
          #FF5252 0%, 
          #FF5252 16.7%, 
          #4CAF50 16.7%, 
          #4CAF50 33.3%, 
          #FFA726 33.3%, 
          #FFA726 50%, 
          #FFA726 50%, 
          #FFA726 66.7%,
          #4CAF50 66.7%,
          #4CAF50 83.3%,
          #FF5252 83.3%,
          #FF5252 100%);
        opacity: 0.6;
      }
      
      .gauge-target {
        position: absolute;
        top: 0;
        left: 16.7%;
        width: 16.6%;
        height: 100%;
        background-color: #4CAF50;
        border: 1px solid white;
        box-sizing: border-box;
      }
      
      .gauge-needle {
        position: absolute;
        top: -5px;
        left: 0;
        width: 3px;
        height: 30px;
        background-color: white;
        transition: left 0.2s ease-out;
      }
      
      .gauge-ticks {
        display: flex;
        justify-content: space-between;
        color: white;
        font-size: 12px;
        margin-top: 5px;
      }
      
      .large-hold-timer {
        width: 100%;
        display: flex;
        justify-content: center;
        margin-top: 10px;
      }
      
      .timer-display {
        display: flex;
        flex-direction: column;
        align-items: center;
        background-color: rgba(0, 0, 0, 0.8);
        padding: 15px 25px;
        border-radius: 12px;
        border: 3px solid #4CAF50;
        backdrop-filter: blur(10px);
        min-width: 200px;
      }
      
      .timer-label {
        color: white;
        font-size: 16px;
        font-weight: 600;
        margin-bottom: 5px;
      }
      
      .timer-value {
        color: #4CAF50;
        font-size: 42px;
        font-weight: bold;
        line-height: 1;
        margin-bottom: 5px;
        text-shadow: 0 0 15px rgba(76, 175, 80, 0.5);
        font-family: 'Courier New', monospace;
      }
      
      .timer-unit {
        color: white;
        font-size: 14px;
        margin-bottom: 10px;
      }
      
      .timer-progress {
        width: 100%;
        height: 8px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 4px;
        overflow: hidden;
      }
      
      .timer-progress-bar {
        height: 100%;
        background: linear-gradient(90deg, #4CAF50, #66BB6A);
        border-radius: 4px;
        transition: width 0.1s linear;
        width: 0%;
      }
      
      .timer-display.active {
        border-color: #FFC107;
        animation: pulse-timer 1s infinite;
      }
      
      .timer-display.active .timer-value {
        color: #FFC107;
        text-shadow: 0 0 15px rgba(255, 193, 7, 0.5);
      }
      
      .timer-display.active .timer-progress-bar {
        background: linear-gradient(90deg, #FFC107, #FFD54F);
      }
      
      .timer-display.completed {
        border-color: #4CAF50;
        animation: celebration 0.6s ease-out;
      }
      
      .timer-display.completed .timer-value {
        color: #4CAF50;
        animation: bounce 0.6s ease-out;
      }
      
      .timer-display.paused {
        border-color: #FF5252;
        animation: none;
      }
      
      .timer-display.paused .timer-value {
        color: #FF5252;
        text-shadow: 0 0 15px rgba(255, 82, 82, 0.5);
      }
      
      .timer-display.paused .timer-progress-bar {
        background: linear-gradient(90deg, #FF5252, #EF5350);
      }

      .hidden {
        display: none !important;
      }
      
      @keyframes pulse-timer {
        0% { 
          transform: scale(1); 
          box-shadow: 0 0 0 0 rgba(255, 193, 7, 0.7); 
        }
        50% { 
          transform: scale(1.03); 
          box-shadow: 0 0 0 10px rgba(255, 193, 7, 0.3); 
        }
        100% { 
          transform: scale(1); 
          box-shadow: 0 0 0 20px rgba(255, 193, 7, 0); 
        }
      }
      
      @keyframes celebration {
        0% { transform: scale(1); }
        25% { transform: scale(1.1) rotate(1deg); }
        50% { transform: scale(1.05) rotate(-1deg); }
        75% { transform: scale(1.08) rotate(0.5deg); }
        100% { transform: scale(1) rotate(0deg); }
      }
      
      @keyframes bounce {
        0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
        40% { transform: translateY(-10px); }
        60% { transform: translateY(-5px); }
      }
      
      /* ปรับแต่งให้เหมาะกับมือถือ */
      @media (max-width: 480px) {
        .angle-gauge {
          width: 100%;
        }
        
        .timer-value {
          font-size: 36px;
        }
        
        .timer-display {
          padding: 12px 20px;
          min-width: 180px;
        }
      }
    `;
  
    // เพิ่ม elements ลงใน container
    gaugeContainer.appendChild(leftGauge);
    gaugeContainer.appendChild(rightGauge);
    gaugeContainer.appendChild(holdTimerDisplay);
    document.head.appendChild(gaugeStyle);
    
    // เพิ่มลงใน container ที่ระบุ
    container.appendChild(gaugeContainer);
    
    console.log("✅ สร้างแถบวัดมุมและตัวจับเวลาเรียบร้อยแล้ว");
  }

/**
 * อัปเดตแถบวัดมุมการยกแขน
 * @param {string} side - ด้านที่ต้องการอัปเดต ('left' หรือ 'right')
 * @param {number} angle - มุมการยกแขนในหน่วยองศา
 * @param {boolean} isCorrect - มุมอยู่ในช่วงที่ถูกต้องหรือไม่
 */
export function updateAngleGauge(side, angle, isCorrect) {
  // ตรวจสอบพารามิเตอร์
  if (side !== 'left' && side !== 'right') {
    console.error("ต้องระบุด้าน 'left' หรือ 'right' เท่านั้น");
    return;
  }
  
  // อัปเดตค่ามุม
  const angleValueElement = document.getElementById(`${side}-angle-value`);
  if (angleValueElement) {
    angleValueElement.textContent = `${angle.toFixed(1)}°`;
    angleValueElement.style.color = isCorrect ? '#4CAF50' : '#FF5252';
  }
  
  // อัปเดตตำแหน่งเข็มชี้
  const needleElement = document.getElementById(`${side}-gauge-needle`);
  if (needleElement) {
    // คำนวณตำแหน่งเข็มชี้ (สัดส่วนของมุม 0-180 องศา)
    const position = Math.min(100, Math.max(0, (angle / 180) * 100));
    needleElement.style.left = `${position}%`;
  }
}

/**
 * อัปเดตตัวแสดงเวลาค้างแขน - แก้ไขปัญหาการแสดงผล
 * @param {number} time - เวลาค้างปัจจุบัน (วินาที)
 * @param {number} requiredTime - เวลาค้างที่ต้องการ (วินาที)
 * @param {boolean} isHolding - กำลังค้างอยู่หรือไม่
 * @param {boolean} isCompleted - ค้างครบเวลาแล้วหรือไม่
 * @param {boolean} isAngleCorrect - มุมอยู่ในช่วงที่ถูกต้องหรือไม่
 */
export function updateHoldTimer(time, requiredTime, isHolding, isCompleted, isAngleCorrect = true) {
  console.log(`🕐 updateHoldTimer: time=${time.toFixed(2)}, required=${requiredTime}, holding=${isHolding}, completed=${isCompleted}, angleCorrect=${isAngleCorrect}`);
  
  const timerValueElement = document.getElementById('hold-timer-value');
  const timerDisplayElement = document.querySelector('.timer-display');
  const holdTimerContainer = document.getElementById('large-hold-timer');
  const progressBar = document.getElementById('timer-progress-bar');
  
  // แสดงหรือซ่อนตัวแสดงเวลาตามสถานะ
  if (holdTimerContainer) {
    if (isHolding || isCompleted) {
      holdTimerContainer.classList.remove('hidden');
      console.log("📺 แสดงตัวจับเวลา");
    } else {
      holdTimerContainer.classList.add('hidden');
      console.log("🙈 ซ่อนตัวจับเวลา");
      return;
    }
  }
  
  if (timerValueElement) {
    // อัปเดตค่าเวลา
    timerValueElement.textContent = time.toFixed(1);
    console.log(`🔢 อัปเดตเวลา: ${time.toFixed(1)} วินาที`);
  }
  
  // อัปเดตแถบความก้าวหน้า
  if (progressBar) {
    const progressPercent = Math.min(100, (time / requiredTime) * 100);
    progressBar.style.width = `${progressPercent}%`;
    console.log(`📊 อัปเดตความก้าวหน้า: ${progressPercent.toFixed(1)}%`);
  }
  
  if (timerDisplayElement) {
    // ปรับคลาสตามสถานะ
    timerDisplayElement.classList.remove('active', 'completed', 'paused');
    
    if (isCompleted) {
      timerDisplayElement.classList.add('completed');
      console.log("✅ สถานะ: เสร็จสิ้น");
    } else if (isHolding && isAngleCorrect) {
      timerDisplayElement.classList.add('active');
      console.log("🔄 สถานะ: กำลังนับเวลา");
    } else if (isHolding && !isAngleCorrect) {
      timerDisplayElement.classList.add('paused');
      console.log("⏸️ สถานะ: หยุดชั่วคราว");
    }
  }
}

/**
 * แสดงหรือซ่อนตัวแสดงผลมุมและเวลาค้าง
 * @param {boolean} visible - แสดงหรือซ่อน
 */
export function toggleAngleDisplay(visible) {
  const container = document.getElementById('angle-gauge-container');
  if (container) {
    container.style.display = visible ? 'flex' : 'none';
  }
}

/**
 * ปรับตำแหน่งแถบวัดมุมตามโหมดการแสดงผล
 * @param {boolean} isFullscreen สถานะโหมดเต็มจอ
 */
export function repositionAngleGauge(isFullscreen) {
  const gaugeContainer = document.getElementById('angle-gauge-container');
  if (!gaugeContainer) return;
  
  if (isFullscreen) {
    // ปรับแถบวัดมุมในโหมดเต็มจอ
    gaugeContainer.style.position = 'fixed';
    gaugeContainer.style.bottom = '80px';
    gaugeContainer.style.zIndex = '1001';
  } else {
    // กลับไปยังตำแหน่งปกติ
    gaugeContainer.style.position = 'absolute';
    gaugeContainer.style.bottom = '20px';
    gaugeContainer.style.zIndex = '1000';
  }
}

/**
 * ตั้งค่าตัวติดตามการเปลี่ยนแปลงโหมดเต็มจอ
 */
export function setupFullscreenListener() {
  // สร้าง MutationObserver เพื่อติดตามการเปลี่ยนแปลง class ของ body
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.attributeName === 'class') {
        const isFullscreen = document.body.classList.contains('fullscreen-mode');
        repositionAngleGauge(isFullscreen);
      }
    });
  });
  
  // เริ่มติดตามการเปลี่ยนแปลง
  observer.observe(document.body, { attributes: true });
}

// ส่งออกฟังก์ชันและข้อมูล
export const AngleDisplay = {
  createAngleGauge,
  updateAngleGauge,
  updateHoldTimer,
  toggleAngleDisplay,
  repositionAngleGauge,
  setupFullscreenListener
};