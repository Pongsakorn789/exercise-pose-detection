// angle-display.js (ปรับปรุง)
// ระบบแสดงผลมุมการยกขาด้านข้าง (Side Leg Raise) - ปรับปรุงการแสดงผล

/**
 * สร้างและแสดงแถบวัดมุมการยกขา
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
  
    // สร้างแถบวัดสำหรับขาซ้าย
    const leftGauge = document.createElement('div');
    leftGauge.id = 'left-angle-gauge';
    leftGauge.className = 'angle-gauge';
    leftGauge.innerHTML = `
      <div class="gauge-label">มุมขาซ้าย: <span id="left-angle-value">0°</span></div>
      <div class="gauge-bar">
        <div class="gauge-scale"></div>
        <div class="gauge-target"></div>
        <div class="gauge-needle" id="left-gauge-needle"></div>
      </div>
      <div class="gauge-ticks">
        <span>0°</span>
        <span>15°</span>
        <span>30°</span>
        <span>45°</span>
        <span>60°</span>
        <span>75°</span>
        <span>90°</span>
      </div>
    `;
  
    // สร้างแถบวัดสำหรับขาขวา
    const rightGauge = document.createElement('div');
    rightGauge.id = 'right-angle-gauge';
    rightGauge.className = 'angle-gauge';
    rightGauge.innerHTML = `
      <div class="gauge-label">มุมขาขวา: <span id="right-angle-value">0°</span></div>
      <div class="gauge-bar">
        <div class="gauge-scale"></div>
        <div class="gauge-target"></div>
        <div class="gauge-needle" id="right-gauge-needle"></div>
      </div>
      <div class="gauge-ticks">
        <span>0°</span>
        <span>15°</span>
        <span>30°</span>
        <span>45°</span>
        <span>60°</span>
        <span>75°</span>
        <span>90°</span>
      </div>
    `;
  
    // เพิ่มตัวแสดงเวลาค้างขาขนาดใหญ่
    const holdTimerDisplay = document.createElement('div');
    holdTimerDisplay.id = 'large-hold-timer';
    holdTimerDisplay.className = 'large-hold-timer hidden'; // เพิ่ม class hidden เพื่อซ่อนโดยค่าเริ่มต้น
    holdTimerDisplay.innerHTML = `
      <div class="timer-display">
        <div class="timer-label">เวลาค้างขา</div>
        <div class="timer-value" id="hold-timer-value">0.0</div>
        <div class="timer-unit">วินาที</div>
      </div>
    `;
  
    // เพิ่ม CSS สำหรับแถบวัดมุม
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
        background: linear-gradient(to right, #FF5252, #FF5252 33%, #4CAF50 33%, #4CAF50 50%, #FF5252 50%, #FF5252);
        opacity: 0.6;
      }
      
      .gauge-target {
        position: absolute;
        top: 0;
        left: 33%;
        width: 17%;
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
        background-color: rgba(0, 0, 0, 0.7);
        padding: 10px 20px;
        border-radius: 8px;
        border: 2px solid #4CAF50;
      }
      
      .timer-label {
        color: white;
        font-size: 16px;
      }
      
      .timer-value {
        color: #4CAF50;
        font-size: 36px;
        font-weight: bold;
        line-height: 1.2;
      }
      
      .timer-unit {
        color: white;
        font-size: 14px;
      }
      
      .timer-display.active {
        border-color: #FFC107;
        animation: pulse-timer 1s infinite;
      }
      
      .timer-display.completed {
        border-color: #4CAF50;
        animation: none;
      }
      
      .timer-display.paused {
        border-color: #FF5252;
        animation: none;
      }
  
      .hidden {
        display: none !important;
      }
      
      @keyframes pulse-timer {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
      }
      
      /* ปรับแต่งให้เหมาะกับมือถือ */
      @media (max-width: 480px) {
        .angle-gauge {
          width: 100%;
        }
      }
      
      /* สไตล์ใหม่สำหรับการแสดงมุมแบบโค้ง */
      .angle-arc {
        position: absolute;
        pointer-events: none;
      }
      
      .angle-arc.left {
        left: 25%;
        top: 55%;
      }
      
      .angle-arc.right {
        right: 25%;
        top: 55%;
      }
      
      .angle-marker {
        position: absolute;
        width: 160px;
        height: 160px;
        border: 2px dashed rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        clip-path: polygon(50% 50%, 0 0, 50% 0, 100% 0);
      }
      
      .angle-correct-zone {
        position: absolute;
        width: 160px;
        height: 160px;
        border-radius: 50%;
        clip-path: polygon(50% 50%, 25% 0, 40% 0, 50% 0);
        background-color: rgba(76, 175, 80, 0.3);
      }
      
      /* เพิ่มสไตล์ให้ตัวแสดงเวลาค้างขาเมื่อมุมไม่ถูกต้อง */
      .timer-value.paused {
        color: #FF5252;
      }
      
      /* เพิ่มข้อความแสดงสถานะเมื่อมุมไม่ถูกต้อง */
      .timer-status {
        color: white;
        font-size: 14px;
        text-align: center;
        margin-top: 5px;
      }
      
      .timer-status.paused {
        color: #FF5252;
      }
    `;
  
    // เพิ่ม elements ลงใน container
    gaugeContainer.appendChild(leftGauge);
    gaugeContainer.appendChild(rightGauge);
    gaugeContainer.appendChild(holdTimerDisplay);
    document.head.appendChild(gaugeStyle);
    
    // เพิ่มลงใน container ที่ระบุ
    container.appendChild(gaugeContainer);
    
    // เพิ่ม CSS สำหรับมือถือ
    addMobileAngleGaugeStyles();
    
    // ตรวจสอบโหมดเต็มจอและปรับตำแหน่ง
    const isFullscreen = document.body.classList.contains('fullscreen-mode');
    repositionAngleGauge(isFullscreen);
    
    // ตั้งค่าติดตามการเปลี่ยนแปลงโหมดเต็มจอ
    setupFullscreenListener();
  }
  
  /**
   * อัปเดตแถบวัดมุมการยกขา
   * @param {string} side - ด้านที่ต้องการอัปเดต ('left' หรือ 'right')
   * @param {number} angle - มุมการยกขาในหน่วยองศา
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
      // คำนวณตำแหน่งเข็มชี้ (สัดส่วนของมุม 0-90 องศา)
      const position = Math.min(100, (angle / 90) * 100);
      needleElement.style.left = `${position}%`;
    }
  }
  
  /**
   * อัปเดตตัวแสดงเวลาค้างขา
   * @param {number} time - เวลาค้างขาในหน่วยวินาที
   * @param {number} requiredTime - เวลาค้างที่ต้องการในหน่วยวินาที
   * @param {boolean} isHolding - กำลังค้างขาอยู่หรือไม่
   * @param {boolean} isCompleted - ค้างขาครบเวลาแล้วหรือไม่
   * @param {boolean} isAngleCorrect - มุมอยู่ในช่วงที่ถูกต้องหรือไม่ (เพิ่มพารามิเตอร์นี้)
   */
  export function updateHoldTimer(time, requiredTime, isHolding, isCompleted, isAngleCorrect = true) {
    const timerValueElement = document.getElementById('hold-timer-value');
    const timerDisplayElement = document.querySelector('.timer-display');
    const holdTimerContainer = document.getElementById('large-hold-timer');
    
    // แสดงหรือซ่อนตัวแสดงเวลาตามสถานะการค้าง
    if (holdTimerContainer) {
      if (isHolding || isCompleted) {
        holdTimerContainer.classList.remove('hidden');
      } else {
        holdTimerContainer.classList.add('hidden');
        return; // ออกจากฟังก์ชันถ้าไม่ต้องแสดงตัวจับเวลา
      }
    }
    
    if (timerValueElement) {
      // อัปเดตค่าเวลาเฉพาะเมื่อมุมถูกต้อง หากมุมไม่ถูกต้องให้แสดงค่าเดิม (ไม่เพิ่มเวลา)
      timerValueElement.textContent = time.toFixed(1);
      
      // ปรับสีตามสถานะ
      if (isCompleted) {
        timerValueElement.style.color = '#4CAF50'; // สีเขียว
      } else if (isHolding && isAngleCorrect) {
        timerValueElement.style.color = '#FFC107'; // สีเหลือง (กำลังนับ)
      } else if (isHolding && !isAngleCorrect) {
        timerValueElement.style.color = '#FF5252'; // สีแดง (หยุดนับชั่วคราว)
      } else {
        timerValueElement.style.color = '#FFFFFF'; // สีขาว
      }
    }
    
    if (timerDisplayElement) {
      // ปรับคลาสตามสถานะ
      timerDisplayElement.classList.remove('active', 'completed', 'paused');
      
      if (isCompleted) {
        timerDisplayElement.classList.add('completed');
      } else if (isHolding && isAngleCorrect) {
        timerDisplayElement.classList.add('active');
      } else if (isHolding && !isAngleCorrect) {
        timerDisplayElement.classList.add('paused'); // เพิ่มคลาสใหม่สำหรับสถานะหยุดนับชั่วคราว
      }
      
      // เพิ่มข้อความแสดงสถานะถ้ามุมไม่ถูกต้อง
      const statusElement = timerDisplayElement.querySelector('.timer-status');
      if (isHolding && !isAngleCorrect) {
        if (!statusElement) {
          const newStatusElement = document.createElement('div');
          newStatusElement.className = 'timer-status paused';
          newStatusElement.textContent = 'หยุดนับเวลา (มุมไม่ถูกต้อง)';
          timerDisplayElement.appendChild(newStatusElement);
        }
      } else if (statusElement) {
        statusElement.remove();
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
  
  // เพิ่มฟังก์ชันก์เพื่อปรับปรุง CSS ของแถบวัดมุมสำหรับมือถือ
  function addMobileAngleGaugeStyles() {
    // ตรวจสอบว่ามี style tag อยู่แล้วหรือไม่
    if (document.getElementById('mobile-angle-gauge-styles')) return;
    
    const mobileStyles = document.createElement('style');
    mobileStyles.id = 'mobile-angle-gauge-styles';
    mobileStyles.textContent = `
      @media (max-width: 768px) {
        .angle-gauge-container {
          bottom: 70px;
          width: calc(100% - 20px);
          left: 10px;
          padding: 8px;
        }
        
        .angle-gauge {
          width: 100%;
          margin-bottom: 10px;
        }
        
        .gauge-label {
          font-size: 14px;
        }
        
        .gauge-ticks {
          font-size: 10px;
        }
        
        .large-hold-timer {
          width: 100%;
        }
        
        .timer-value {
          font-size: 30px;
        }
        
        /* โหมดเต็มจอบนมือถือ */
        .fullscreen-mode .angle-gauge-container {
          position: fixed;
          bottom: 80px;
          z-index: 1001;
        }
        
        .fullscreen-mode .large-hold-timer {
          transform: scale(0.9);
          transform-origin: center bottom;
        }
      }
      
      @media (max-width: 480px) {
        .angle-gauge-container {
          bottom: 60px;
        }
        
        .gauge-label, .gauge-ticks {
          font-size: 10px;
        }
        
        .timer-value {
          font-size: 24px;
        }
      }
    `;
    
    document.head.appendChild(mobileStyles);
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
  
  /**
   * สร้างและแสดงแถบวัดองศาแบบเส้นโค้ง (รูปแบบใหม่)
   * @param {HTMLElement} container - element ที่ต้องการแสดงแถบวัด
   */
  export function createArcAngleGauge(container) {
    // ตรวจสอบว่ามีแถบวัดอยู่แล้วหรือไม่
    if (document.getElementById('arc-angle-gauge-container')) {
      return;
    }
  
    // สร้าง element สำหรับแสดงแถบวัดมุมแบบเส้นโค้ง
    const arcGaugeContainer = document.createElement('div');
    arcGaugeContainer.id = 'arc-angle-gauge-container';
    arcGaugeContainer.className = 'arc-angle-gauge-container';
  
    // เพิ่ม CSS สำหรับแถบวัดมุมแบบเส้นโค้ง
    const arcGaugeStyle = document.createElement('style');
    arcGaugeStyle.textContent = `
      .arc-angle-gauge-container {
        position: absolute;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 100;
      }
      
      .arc-angle-display {
        position: absolute;
        width: 200px;
        height: 200px;
        border-radius: 50%;
        overflow: visible;
      }
      
      .arc-angle-display.left {
        left: 25%;
        top: 50%;
        transform: translate(-50%, -50%);
      }
      
      .arc-angle-display.right {
        right: 25%;
        top: 50%;
        transform: translate(50%, -50%);
      }
      
      .angle-arc {
        position: absolute;
        width: 100%;
        height: 100%;
      }
      
      .angle-value-display {
        position: absolute;
        background-color: rgba(0, 0, 0, 0.7);
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 14px;
        font-weight: bold;
        white-space: nowrap;
      }
      
      .angle-value-display.correct {
        background-color: rgba(76, 175, 80, 0.7);
      }
      
      .angle-value-display.low {
        background-color: rgba(255, 193, 7, 0.7);
      }
      
      .angle-value-display.high {
        background-color: rgba(255, 82, 82, 0.7);
      }
    `;
  
    document.head.appendChild(arcGaugeStyle);
    
    // เพิ่มลงใน container ที่ระบุ
    container.appendChild(arcGaugeContainer);
  }
  
  /**
   * อัปเดตแถบวัดมุมการยกขาแบบเส้นโค้ง
   * @param {string} side - ด้านที่ต้องการอัปเดต ('left' หรือ 'right')
   * @param {Object} hip - จุดสะโพก {x, y}
   * @param {Object} knee - จุดเข่า {x, y}
   * @param {Object} ankle - จุดข้อเท้า {x, y}
   * @param {number} angle - มุมการยกขาในหน่วยองศา
   * @param {boolean} isCorrect - มุมอยู่ในช่วงที่ถูกต้องหรือไม่
   */
  export function updateArcAngleGauge(side, hip, knee, ankle, angle, isCorrect) {
    // ตรวจสอบพารามิเตอร์
    if (side !== 'left' && side !== 'right') {
      console.error("ต้องระบุด้าน 'left' หรือ 'right' เท่านั้น");
      return;
    }
    
    // สร้างตัวแสดงผลมุมถ้ายังไม่มี
    let angleDisplay = document.getElementById(`${side}-arc-angle-display`);
    const container = document.getElementById('arc-angle-gauge-container');
    
    if (!angleDisplay && container) {
      angleDisplay = document.createElement('div');
      angleDisplay.id = `${side}-arc-angle-display`;
      angleDisplay.className = `arc-angle-display ${side}`;
      
      const angleArc = document.createElement('canvas');
      angleArc.id = `${side}-angle-arc`;
      angleArc.className = 'angle-arc';
      angleArc.width = 200;
      angleArc.height = 200;
      
      const angleValue = document.createElement('div');
      angleValue.id = `${side}-angle-value-display`;
      angleValue.className = 'angle-value-display';
      
      angleDisplay.appendChild(angleArc);
      angleDisplay.appendChild(angleValue);
      container.appendChild(angleDisplay);
    }
    
    if (!angleDisplay) return;
    
    // อัปเดตตำแหน่งของตัวแสดงผลมุม
    angleDisplay.style.left = `${hip.x}px`;
    angleDisplay.style.top = `${hip.y}px`;
    
    // อัปเดตค่ามุม
    const angleValueDisplay = document.getElementById(`${side}-angle-value-display`);
    if (angleValueDisplay) {
      // กำหนดสถานะของมุม
      let angleStatus = 'correct';
      if (!isCorrect) {
        angleStatus = angle < 30 ? 'low' : 'high';
      }
      
      // ปรับตำแหน่งของการแสดงมุม
      let valueX, valueY;
      if (side === 'left') {
        valueX = -80;
        valueY = -30;
      } else {
        valueX = 80;
        valueY = -30;
      }
      
      angleValueDisplay.style.transform = `translate(${valueX}px, ${valueY}px)`;
      
      // กำหนดข้อความและคลาส
      angleValueDisplay.textContent = `${angle.toFixed(1)}°`;
      angleValueDisplay.className = `angle-value-display ${angleStatus}`;
      
      // เพิ่มข้อความแนะนำถ้ามุมไม่ถูกต้อง
      if (!isCorrect) {
        if (angleStatus === 'low') {
          angleValueDisplay.textContent += ' (ยกขาเพิ่ม)';
        } else {
          angleValueDisplay.textContent += ' (ลดมุมลง)';
        }
      }
    }
    
    // วาดเส้นโค้งแสดงมุม
    const canvas = document.getElementById(`${side}-angle-arc`);
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      // ล้าง canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // กำหนดค่าตำแหน่งศูนย์กลาง
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = 80;
      
      // วาดเส้นโค้งแสดงช่วงมุมที่ถูกต้อง (30-45 องศา)
      ctx.beginPath();
      if (side === 'left') {
        ctx.arc(centerX, centerY, radius, Math.PI * 1.5 - Math.PI / 4, Math.PI * 1.5 - Math.PI / 6, false);
      } else {
        ctx.arc(centerX, centerY, radius, Math.PI * 1.5 + Math.PI / 6, Math.PI * 1.5 + Math.PI / 4, false);
      }
      ctx.lineWidth = 10;
      ctx.strokeStyle = 'rgba(76, 175, 80, 0.5)';
      ctx.stroke();
      
      // วาดเส้นแนวตั้ง (0 องศา)
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(centerX, centerY - radius);
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.stroke();
      
      // คำนวณตำแหน่งปลายเส้นตามมุม
      let endX, endY;
      if (side === 'left') {
        const angleRad = (90 - angle) * Math.PI / 180;
        endX = centerX - Math.cos(angleRad) * radius;
        endY = centerY - Math.sin(angleRad) * radius;
      } else {
        const angleRad = (90 + angle) * Math.PI / 180;
        endX = centerX - Math.cos(angleRad) * radius;
        endY = centerY - Math.sin(angleRad) * radius;
      }
      
      // วาดเส้นตามมุมปัจจุบัน
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(endX, endY);
      ctx.lineWidth = 3;
      
      // กำหนดสีตามสถานะของมุม
      if (isCorrect) {
        ctx.strokeStyle = '#4CAF50'; // สีเขียว
      } else if (angle < 30) {
        ctx.strokeStyle = '#FFC107'; // สีเหลือง
      } else {
        ctx.strokeStyle = '#FF5252'; // สีแดง
      }
      
      ctx.stroke();
      
      // วาดจุดที่ปลายเส้น
      ctx.beginPath();
      ctx.arc(endX, endY, 5, 0, Math.PI * 2);
      ctx.fillStyle = isCorrect ? '#4CAF50' : (angle < 30 ? '#FFC107' : '#FF5252');
      ctx.fill();
    }
  }
  
  // ส่งออกฟังก์ชันและข้อมูล
  export const AngleDisplay = {
    createAngleGauge,
    updateAngleGauge,
    updateHoldTimer,
    toggleAngleDisplay,
    repositionAngleGauge,
    setupFullscreenListener,
    createArcAngleGauge,
    updateArcAngleGauge
  };