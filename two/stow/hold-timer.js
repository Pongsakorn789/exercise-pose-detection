// hold-timer.js
// ระบบแสดงผลตัวนับเวลาการค้างขา

import { globals } from './main.js';
import { utils } from './utils.js';

/**
 * สร้างหรืออัปเดตตัวแสดงผลเวลาค้างขา
 * @param {string} side ด้านที่ต้องการแสดงผล ('left' หรือ 'right')
 * @param {number} currentTime เวลาค้างปัจจุบัน (วินาที)
 * @param {number} requiredTime เวลาค้างที่ต้องการ (วินาที)
 * @param {boolean} isHolding สถานะกำลังค้างอยู่หรือไม่
 */
function updateHoldTimerDisplay(side, currentTime, requiredTime, isHolding) {
  // ตรวจสอบพารามิเตอร์
  if (side !== 'left' && side !== 'right') {
    console.error("ต้องระบุด้าน 'left' หรือ 'right' เท่านั้น");
    return;
  }

  const containerId = `${side}-hold-timer`;
  let timerContainer = document.getElementById(containerId);
  
  // สร้าง element ถ้ายังไม่มี
  if (!timerContainer) {
    timerContainer = document.createElement('div');
    timerContainer.id = containerId;
    timerContainer.className = `hold-timer ${side}`;
    document.querySelector('.webcam-container').appendChild(timerContainer);
  }
  
  // คำนวณเปอร์เซ็นต์ความก้าวหน้า
  const progressPercent = Math.min(100, (currentTime / requiredTime) * 100);
  
  // อัปเดตคลาสตามสถานะ
  if (isHolding) {
    timerContainer.classList.add('holding');
    timerContainer.classList.remove('completed');
  } else if (currentTime >= requiredTime) {
    timerContainer.classList.add('completed');
    timerContainer.classList.remove('holding');
  } else {
    timerContainer.classList.remove('holding', 'completed');
  }
  
  // อัปเดตเนื้อหา
  timerContainer.innerHTML = `
    <div>ค้าง ${currentTime.toFixed(1)}/${requiredTime.toFixed(1)} วินาที</div>
    <div class="hold-progress">
      <div class="hold-progress-bar ${currentTime >= requiredTime ? 'complete' : ''}" 
           style="width: ${progressPercent}%"></div>
    </div>
  `;
  
  // แสดงหรือซ่อน element ตามสถานะ
  if (isHolding || currentTime >= requiredTime) {
    timerContainer.style.display = 'block';
  } else {
    timerContainer.style.display = 'none';
  }
}

/**
 * ลบตัวแสดงผลเวลาค้างขา
 * @param {string} side ด้านที่ต้องการลบ ('left', 'right' หรือ 'all')
 */
function removeHoldTimerDisplay(side = 'all') {
  if (side === 'left' || side === 'all') {
    const leftTimer = document.getElementById('left-hold-timer');
    if (leftTimer) {
      leftTimer.remove();
    }
  }
  
  if (side === 'right' || side === 'all') {
    const rightTimer = document.getElementById('right-hold-timer');
    if (rightTimer) {
      rightTimer.remove();
    }
  }
}

/**
 * ตรวจสอบและอัปเดตการแสดงผลการค้างขาในรอบการทำงานปัจจุบัน
 */
function checkAndUpdateHoldTimers() {
  const now = Date.now();
  
  // อัปเดตการแสดงผลขาซ้าย
  if (globals.isLeftExtended && globals.isLeftHolding) {
    const holdDuration = (now - globals.leftHoldStartTime) / 1000; // แปลงเป็นวินาที
    updateHoldTimerDisplay('left', holdDuration, globals.requiredHoldTime, true);
  } else if (globals.isLeftExtended && !globals.isLeftHolding && globals.leftHoldStartTime > 0) {
    // ค้างครบเวลาแล้ว แต่ยังไม่วางขา
    const holdDuration = globals.requiredHoldTime; // แสดงเวลาครบแล้ว
    updateHoldTimerDisplay('left', holdDuration, globals.requiredHoldTime, false);
  } else {
    removeHoldTimerDisplay('left');
  }
  
  // อัปเดตการแสดงผลขาขวา
  if (globals.isRightExtended && globals.isRightHolding) {
    const holdDuration = (now - globals.rightHoldStartTime) / 1000; // แปลงเป็นวินาที
    updateHoldTimerDisplay('right', holdDuration, globals.requiredHoldTime, true);
  } else if (globals.isRightExtended && !globals.isRightHolding && globals.rightHoldStartTime > 0) {
    // ค้างครบเวลาแล้ว แต่ยังไม่วางขา
    const holdDuration = globals.requiredHoldTime; // แสดงเวลาครบแล้ว
    updateHoldTimerDisplay('right', holdDuration, globals.requiredHoldTime, false);
  } else {
    removeHoldTimerDisplay('right');
  }
}

/**
 * ฟังก์ชันที่จะเรียกเมื่อเริ่มค้างขา
 * @param {string} side ด้านที่เริ่มค้าง ('left' หรือ 'right')
 */
function startHolding(side) {
  if (side === 'left') {
    globals.isLeftHolding = true;
    globals.leftHoldStartTime = Date.now();
    globals.leftHoldNotified = false;
  } else if (side === 'right') {
    globals.isRightHolding = true;
    globals.rightHoldStartTime = Date.now();
    globals.rightHoldNotified = false;
  }
  
  checkAndUpdateHoldTimers();
}

/**
 * ฟังก์ชันที่จะเรียกเมื่อสิ้นสุดการค้างขา
 * @param {string} side ด้านที่สิ้นสุดการค้าง ('left' หรือ 'right')
 * @param {boolean} isCompleted สถานะว่าค้างครบเวลาหรือไม่
 */
function stopHolding(side, isCompleted = false) {
  if (side === 'left') {
    globals.isLeftHolding = false;
    if (!isCompleted) {
      globals.leftHoldStartTime = 0;
    }
  } else if (side === 'right') {
    globals.isRightHolding = false;
    if (!isCompleted) {
      globals.rightHoldStartTime = 0;
    }
  }
  
  checkAndUpdateHoldTimers();
  
  // ถ้าค้างไม่ครบเวลา
  if (!isCompleted) {
    removeHoldTimerDisplay(side);
  }
}

/**
 * รีเซ็ตระบบการนับเวลาค้างขาทั้งหมด
 */
function resetHoldTimers() {
  globals.isLeftHolding = false;
  globals.isRightHolding = false;
  globals.leftHoldStartTime = 0;
  globals.rightHoldStartTime = 0;
  globals.leftHoldNotified = false;
  globals.rightHoldNotified = false;
  
  removeHoldTimerDisplay('all');
}

// ส่งออกฟังก์ชันและข้อมูล
export const HoldTimer = {
  updateHoldTimerDisplay,
  removeHoldTimerDisplay,
  checkAndUpdateHoldTimers,
  startHolding,
  stopHolding,
  resetHoldTimers
};