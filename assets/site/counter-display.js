// counter-display.js
// ระบบแสดงผลตัวนับและการออกกำลังกาย

// สถานะเริ่มต้นของตัวนับ
const initialState = {
    leftCounter: 0,
    rightCounter: 0,
    roundCounter: 0,
    targetReps: 10,
    currentExercise: 1
  };
  
  // สถานะปัจจุบันของตัวนับ
  let counterState = { ...initialState };
  
  /**
   * สร้างหน้าจอแสดงตัวนับ
   * @param {number} exerciseNumber หมายเลขท่าออกกำลังกาย
   * @param {Object} state สถานะของตัวนับ
   */
  function createCounterDisplay(exerciseNumber = null, state = null) {
    console.log("Creating counter display:", exerciseNumber, state);
    // ใช้ค่าปัจจุบันถ้าไม่ได้ระบุ
    const exercise = exerciseNumber || counterState.currentExercise;
    const displayState = state || counterState;
    
    // อัพเดตค่าในสถานะ
    counterState.currentExercise = exercise;
    if (state) {
      counterState = { ...counterState, ...state };
    }
    
    // ตรวจสอบว่ามีตัวนับอยู่แล้วหรือไม่
    const existingCounter = document.getElementById('counter-container');
    if (existingCounter) {
      existingCounter.remove();
    }
  
    const counterContainer = document.createElement('div');
    counterContainer.id = 'counter-container';
  
    // สร้างการแสดงผลตัวนับสำหรับท่ายกขาด้านข้าง (สลับตำแหน่งเหมือนกระจก)
    counterContainer.innerHTML = `
      <div id="counter-display">
        <div class="counter-header">
          <div class="counter-title">บันทึกการออกกำลังกาย</div>
          <div class="counter-round">รอบที่ ${displayState.roundCounter}</div>
        </div>
        <div class="counter-body">
          <div class="counter-item">
            <div class="counter-label">ข้างขวา</div>
            <div class="counter-value" id="right-leg-counter">${displayState.rightCounter}</div>
            <div class="counter-target">เป้าหมาย: ${displayState.targetReps} ครั้ง</div>
            <div class="progress-container">
              <div class="progress-bar ${getProgressBarColor(displayState.rightCounter, displayState.targetReps)}" id="right-progress-bar" style="width: ${Math.min(100, (displayState.rightCounter / displayState.targetReps) * 100)}%"></div>
            </div>
          </div>
          <div class="counter-item">
            <div class="counter-label">ข้างซ้าย</div>
            <div class="counter-value" id="left-leg-counter">${displayState.leftCounter}</div>
            <div class="counter-target">เป้าหมาย: ${displayState.targetReps} ครั้ง</div>
            <div class="progress-container">
              <div class="progress-bar ${getProgressBarColor(displayState.leftCounter, displayState.targetReps)}" id="left-progress-bar" style="width: ${Math.min(100, (displayState.leftCounter / displayState.targetReps) * 100)}%"></div>
            </div>
          </div>
        </div>
      </div>
    `;
  
    // แทรกตัวนับในส่วน counter-section
    const counterSection = document.querySelector('.counter-section');
    if (counterSection) {
      counterSection.appendChild(counterContainer);
    } else {
      // ถ้าไม่พบ counter-section ให้ใส่หลัง status
      const statusElement = document.getElementById('status');
      if (statusElement) {
        statusElement.parentNode.insertBefore(counterContainer, statusElement.nextSibling);
      } else {
        // ถ้าไม่พบ status ให้เพิ่มท้าย demos
        const demosSection = document.getElementById('demos');
        if (demosSection) {
          demosSection.appendChild(counterContainer);
        }
      }
    }
    
    console.log("Counter display created successfully");
  }
  
  /**
   * อัพเดตการแสดงผลตัวนับ
   * @param {Object} state สถานะใหม่ (ถ้ามี)
   */
  function updateCounterDisplay(state = null) {
    console.log("updateCounterDisplay called with state:", state);
    
    // ถ้ามีค่าสถานะใหม่ ให้อัพเดตค่าในสถานะปัจจุบัน
    if (state) {
      counterState = { ...counterState, ...state };
    }
    
    // บังคับให้อัพเดตการแสดงผลทันที
    updateDisplay();
  }
  
  /**
   * อัพเดตแสดงผลตามค่าในสถานะปัจจุบัน
   */
  function updateDisplay() {
    // ดึงค่าจากสถานะปัจจุบัน
    const { currentExercise, leftCounter, rightCounter, roundCounter, targetReps } = counterState;
    
    console.log("Updating display with:", counterState);
    
    // อัพเดตตัวแสดงผลจำนวนครั้งและแถบความก้าวหน้า
    const leftCounterElem = document.getElementById("left-leg-counter");
    const rightCounterElem = document.getElementById("right-leg-counter");
    const roundCounterElem = document.querySelector(".counter-round");
    
    if (leftCounterElem) {
      console.log("Updating left counter to:", leftCounter);
      leftCounterElem.textContent = leftCounter;
    } else {
      console.warn("left-leg-counter element not found");
      // หากไม่พบ element อาจต้องสร้างใหม่
      createCounterDisplay(currentExercise, counterState);
      return;
    }
    
    if (rightCounterElem) {
      console.log("Updating right counter to:", rightCounter);
      rightCounterElem.textContent = rightCounter;
    } else {
      console.warn("right-leg-counter element not found");
      // หากไม่พบ element อาจต้องสร้างใหม่
      createCounterDisplay(currentExercise, counterState);
      return;
    }
    
    if (roundCounterElem) {
      roundCounterElem.textContent = `รอบที่ ${roundCounter}`;
    }
    
    // อัพเดตตัวนับใน overlay บนวิดีโอ
    const overlayLeftCounter = document.getElementById("overlay-left-counter");
    const overlayRightCounter = document.getElementById("overlay-right-counter");
    const overlayRoundCounter = document.getElementById("overlay-round-counter");
    
    if (overlayLeftCounter) {
      overlayLeftCounter.textContent = leftCounter;
    }
    
    if (overlayRightCounter) {
      overlayRightCounter.textContent = rightCounter;
    }
    
    if (overlayRoundCounter) {
      overlayRoundCounter.textContent = roundCounter;
    }
    
    // อัพเดต progress bar สำหรับขาซ้าย
    const leftProgressBar = document.getElementById("left-progress-bar");
    if (leftProgressBar) {
      const leftPercentage = Math.min(100, (leftCounter / targetReps) * 100);
      leftProgressBar.style.width = `${leftPercentage}%`;
      leftProgressBar.className = `progress-bar ${getProgressBarColor(leftCounter, targetReps)}`;
    }
    
    // อัพเดต progress bar สำหรับขาขวา
    const rightProgressBar = document.getElementById("right-progress-bar");
    if (rightProgressBar) {
      const rightPercentage = Math.min(100, (rightCounter / targetReps) * 100);
      rightProgressBar.style.width = `${rightPercentage}%`;
      rightProgressBar.className = `progress-bar ${getProgressBarColor(rightCounter, targetReps)}`;
    }
  }
  
  /**
   * รีเซ็ตค่าตัวนับกลับเป็นค่าเริ่มต้น
   * @param {number} exercise หมายเลขท่าออกกำลังกายที่จะใช้ (ถ้าไม่ระบุจะใช้ค่าเดิม)
   */
  function resetCounter(exercise = null) {
    // ถ้าระบุท่าออกกำลังกาย ให้อัพเดตค่า
    if (exercise !== null) {
      counterState.currentExercise = exercise;
    }
    
    // รีเซ็ตค่าตัวนับ
    counterState.leftCounter = 0;
    counterState.rightCounter = 0;
    counterState.roundCounter = 0;
    
    // อัพเดตการแสดงผล
    updateCounterDisplay();
  }
  
  /**
   * อัพเดตค่าเป้าหมาย
   * @param {number} targetReps เป้าหมายการทำซ้ำ
   */
  function updateTargets(targetReps = null) {
    if (targetReps !== null) counterState.targetReps = targetReps;
    updateCounterDisplay();
  }
  
  /**
   * ฟังก์ชันช่วยเพื่อกำหนดสีของแถบความก้าวหน้า
   * @param {number} value ค่าปัจจุบัน
   * @param {number} target ค่าเป้าหมาย
   * @returns {string} ชื่อคลาสสี
   */
  function getProgressBarColor(value, target) {
    const percentage = (value / target) * 100;
    if (percentage < 30) return 'red';
    if (percentage < 70) return 'yellow';
    return 'green';
  }
  
  /**
   * ฟังก์ชันรองรับการอัพเดตจาก event
   * @param {Event} event เหตุการณ์
   */
  function handleUpdateCounter(event) {
    console.log("handleUpdateCounter event received:", event);
    if (event && event.detail) {
      updateCounterDisplay(event.detail);
    } else {
      updateCounterDisplay();
    }
  }
  
  /**
   * กำหนดและลงทะเบียนตัวรับฟัง event
   */
  function setupEventListeners() {
    // ถอดการลงทะเบียนก่อนเพื่อป้องกันการลงทะเบียนซ้ำ
    document.removeEventListener('updateCounter', handleUpdateCounter);
    document.removeEventListener('resetCounters', resetCounter);
    
    // ลงทะเบียนตัวรับฟัง event ใหม่
    document.addEventListener('updateCounter', handleUpdateCounter);
    document.addEventListener('resetCounters', () => resetCounter());
    
    console.log("Counter display event listeners registered");
  }
  
  // เริ่มต้นระบบ
  setupEventListeners();
  
  // ส่งออกฟังก์ชันและข้อมูล
  export const CounterDisplay = {
    createCounterDisplay,
    updateCounterDisplay,
    resetCounter,
    updateTargets,
    getState: () => counterState
  };