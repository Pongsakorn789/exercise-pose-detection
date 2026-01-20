// standing-dumbbell-exercise.js - แก้ไขปัญหาการนับเวลา
// ท่าออกกำลังกายกล้ามเนื้อแขนแบบยืน (ยกดัมเบล)

import { globals } from './main.js';
import { utils } from './utils.js';
import { HoldTimer } from './hold-timer.js';
import { EventSystem } from './event-system.js';
import { AngleDisplay } from './angle-display.js';

// ค่าคงที่สำหรับช่วงมุมที่ถูกต้อง
const START_POSITION_MIN = 160;   // มุมเริ่มต้น (แขนลง) ขั้นต่ำ
const START_POSITION_MAX = 180;   // มุมเริ่มต้น (แขนลง) สูงสุด
const END_POSITION_MIN = 30;      // มุมสิ้นสุด (แขนขึ้น) ขั้นต่ำ
const END_POSITION_MAX = 60;      // มุมสิ้นสุด (แขนขึ้น) สูงสุด
const REQUIRED_HOLD_TIME = 2.0;   // เวลาที่ต้องค้าง 2.0 วินาที

// ค่าคงที่สำหรับการตรวจสอบท่าทางยืน
const MAX_BODY_LEAN_ANGLE = 10;   // มุมเอียงสูงสุดของลำตัวที่ยอมรับได้ (องศา)

// ตัวแปรสำหรับการติดตามสถานะ
let angleDisplayCreated = false;
let leftArmHoldTime = 0;
let rightArmHoldTime = 0;

// ตัวแปรสำหรับการติดตามเวลาเริ่มต้นการค้างแขน
let leftCorrectAngleStartTime = 0;
let rightCorrectAngleStartTime = 0;

// ตัวแปรสำหรับการติดตามสถานะท่าทาง
let leftArmState = 'start'; // 'start', 'holding_start', 'end', 'holding_end'
let rightArmState = 'start';

// ตัวแปรสำหรับการติดตามสถานะแจ้งเตือน
let postureWarningShown = false;
let lastPostureWarningTime = 0;
const POSTURE_WARNING_COOLDOWN = 3000;

// ตัวแปรสำหรับการแสดงเวลาแบบเรียลไทม์
let timerUpdateInterval = null;

// ตัวแปรสำหรับควบคุมความเรียบของเส้น
const SMOOTHING_FACTOR = 0.7;
let previousLeftArmData = null;
let previousRightArmData = null;

// ค่าคงที่สำหรับการแสดงผลแลนด์มาร์ค
const LANDMARK_STYLES = {
  CORRECT_COLOR: 'rgba(76, 175, 80, 0.9)',
  WARNING_COLOR: 'rgba(255, 193, 7, 0.9)', 
  ERROR_COLOR: 'rgba(255, 82, 82, 0.9)',
  ANGLE_BG_COLOR: 'rgba(0, 0, 0, 0.7)',
  TEXT_COLOR: 'white'
};

/**
 * อัปเดตการแสดงเวลาแบบเรียลไทม์
 */
function updateTimerDisplay() {
  const now = Date.now();
  
  console.log(`Timer Update - Left: ${globals.isLeftHolding}, Right: ${globals.isRightHolding}`);
  
  // อัปเดตเวลาสำหรับแขนซ้าย
  if (globals.isLeftHolding && leftCorrectAngleStartTime > 0) {
    leftArmHoldTime = (now - leftCorrectAngleStartTime) / 1000;
    
    console.log(`อัปเดตเวลาแขนซ้าย: ${leftArmHoldTime.toFixed(2)} วินาที`);
    
    if (angleDisplayCreated) {
      AngleDisplay.updateHoldTimer(
        leftArmHoldTime, 
        REQUIRED_HOLD_TIME, 
        true, 
        leftArmHoldTime >= REQUIRED_HOLD_TIME, 
        true
      );
    }
    
    // อัปเดตสถานะบนหน้าจอ
    if (leftArmHoldTime < REQUIRED_HOLD_TIME) {
      globals.statusElement.textContent = `กำลังค้างแขนซ้าย ${leftArmHoldTime.toFixed(1)}/${REQUIRED_HOLD_TIME} วินาที`;
      globals.statusElement.style.color = "#FFA000";
    } else {
      globals.statusElement.textContent = `ค้างแขนซ้ายครบ ${REQUIRED_HOLD_TIME} วินาทีแล้ว`;
      globals.statusElement.style.color = "#4CAF50";
    }
  }
  
  // อัปเดตเวลาสำหรับแขนขวา
  if (globals.isRightHolding && rightCorrectAngleStartTime > 0) {
    rightArmHoldTime = (now - rightCorrectAngleStartTime) / 1000;
    
    console.log(`อัปเดตเวลาแขนขวา: ${rightArmHoldTime.toFixed(2)} วินาที`);
    
    if (angleDisplayCreated) {
      AngleDisplay.updateHoldTimer(
        rightArmHoldTime, 
        REQUIRED_HOLD_TIME, 
        true, 
        rightArmHoldTime >= REQUIRED_HOLD_TIME, 
        true
      );
    }
    
    // อัปเดตสถานะบนหน้าจอ
    if (rightArmHoldTime < REQUIRED_HOLD_TIME) {
      globals.statusElement.textContent = `กำลังค้างแขนขวา ${rightArmHoldTime.toFixed(1)}/${REQUIRED_HOLD_TIME} วินาที`;
      globals.statusElement.style.color = "#FFA000";
    } else {
      globals.statusElement.textContent = `ค้างแขนขวาครบ ${REQUIRED_HOLD_TIME} วินาทีแล้ว`;
      globals.statusElement.style.color = "#4CAF50";
    }
  }
}

/**
 * เริ่มต้นการอัปเดตเวลาแบบเรียลไทม์
 */
function startTimerUpdate() {
  if (!timerUpdateInterval) {
    console.log("🕒 เริ่มการอัปเดตเวลาแบบเรียลไทม์");
    timerUpdateInterval = setInterval(updateTimerDisplay, 100); // อัปเดตทุก 100ms
  }
}

/**
 * หยุดการอัปเดตเวลา
 */
function stopTimerUpdate() {
  if (timerUpdateInterval) {
    console.log("⏹️ หยุดการอัปเดตเวลา");
    clearInterval(timerUpdateInterval);
    timerUpdateInterval = null;
  }
}

/**
 * เริ่มการนับเวลา
 */
function startHoldTimer(side) {
  const now = Date.now();
  
  if (side === 'left') {
    globals.isLeftHolding = true;
    leftCorrectAngleStartTime = now;
    leftArmHoldTime = 0;
    console.log(`⏱️ เริ่มนับเวลาแขนซ้าย ณ เวลา ${now}`);
  } else {
    globals.isRightHolding = true;
    rightCorrectAngleStartTime = now;
    rightArmHoldTime = 0;
    console.log(`⏱️ เริ่มนับเวลาแขนขวา ณ เวลา ${now}`);
  }
  
  // เริ่มการอัปเดตเวลาแบบเรียลไทม์
  startTimerUpdate();
}

/**
 * หยุดการนับเวลา
 */
function stopHoldTimer(side, completed = false) {
  if (side === 'left') {
    globals.isLeftHolding = false;
    if (!completed) {
      leftCorrectAngleStartTime = 0;
      leftArmHoldTime = 0;
    }
    console.log(`⏹️ หยุดนับเวลาแขนซ้าย (${completed ? 'เสร็จสิ้น' : 'ยกเลิก'})`);
  } else {
    globals.isRightHolding = false;
    if (!completed) {
      rightCorrectAngleStartTime = 0;
      rightArmHoldTime = 0;
    }
    console.log(`⏹️ หยุดนับเวลาแขนขวา (${completed ? 'เสร็จสิ้น' : 'ยกเลิก'})`);
  }
  
  // หยุดการอัปเดตเวลาถ้าไม่มีแขนไหนที่กำลังค้าง
  if (!globals.isLeftHolding && !globals.isRightHolding) {
    stopTimerUpdate();
    
    // รีเซ็ตตัวแสดงเวลา
    if (angleDisplayCreated && !completed) {
      AngleDisplay.updateHoldTimer(0, REQUIRED_HOLD_TIME, false, false, false);
    }
  }
}

/**
 * คำนวณมุมแขน (ไหล่-ข้อศอก-ข้อมือ)
 */
function calculateArmAngle(shoulder, elbow, wrist) {
  return utils.calculateAngle(
    shoulder.x, shoulder.y,
    elbow.x, elbow.y,
    wrist.x, wrist.y
  );
}

/**
 * ตรวจสอบว่ามุมอยู่ในท่าเริ่มต้น (แขนลง) หรือไม่
 */
function isStartPosition(angle) {
  return angle >= START_POSITION_MIN && angle <= START_POSITION_MAX;
}

/**
 * ตรวจสอบว่ามุมอยู่ในท่าสิ้นสุด (แขนขึ้น) หรือไม่
 */
function isEndPosition(angle) {
  return angle >= END_POSITION_MIN && angle <= END_POSITION_MAX;
}

/**
 * ตรวจสอบการเอียงของลำตัว
 */
function checkBodyPosture(leftShoulder, rightShoulder, leftHip, rightHip) {
  const shoulderCenter = {
    x: (leftShoulder.x + rightShoulder.x) / 2,
    y: (leftShoulder.y + rightShoulder.y) / 2
  };
  
  const hipCenter = {
    x: (leftHip.x + rightHip.x) / 2,
    y: (leftHip.y + rightHip.y) / 2
  };
  
  const deltaX = hipCenter.x - shoulderCenter.x;
  const deltaY = hipCenter.y - shoulderCenter.y;
  
  let leanAngle = Math.atan2(Math.abs(deltaX), Math.abs(deltaY)) * (180 / Math.PI);
  
  let leanDirection = 'center';
  if (Math.abs(deltaX) > 0.02) {
    leanDirection = deltaX > 0 ? 'right' : 'left';
  }
  
  const isPostureCorrect = leanAngle <= MAX_BODY_LEAN_ANGLE;
  
  return {
    angle: leanAngle,
    isCorrect: isPostureCorrect,
    direction: leanDirection
  };
}

/**
 * ได้สถานะของมุมพร้อมสีและข้อความ
 */
function getAngleStatusInfo(angle, currentState) {
  let status, color, message;
  
  if (currentState === 'start' || currentState === 'holding_start') {
    if (isStartPosition(angle)) {
      status = 'correct';
      color = LANDMARK_STYLES.CORRECT_COLOR;
      message = 'ท่าเริ่มต้นถูกต้อง';
    } else if (angle < START_POSITION_MIN) {
      status = 'too_high';
      color = LANDMARK_STYLES.WARNING_COLOR;
      message = 'แขนยกสูงเกินไป ลดลง';
    } else {
      status = 'too_low';
      color = LANDMARK_STYLES.ERROR_COLOR;
      message = 'แขนต่ำเกินไป';
    }
  } else {
    if (isEndPosition(angle)) {
      status = 'correct';
      color = LANDMARK_STYLES.CORRECT_COLOR;
      message = 'ท่าสิ้นสุดถูกต้อง';
    } else if (angle > END_POSITION_MAX) {
      status = 'too_low';
      color = LANDMARK_STYLES.WARNING_COLOR;
      message = 'ยกแขนให้สูงขึ้น';
    } else {
      status = 'too_high';
      color = LANDMARK_STYLES.ERROR_COLOR;
      message = 'แขนสูงเกินไป';
    }
  }
  
  return { status, color, message };
}

/**
 * วาดข้อมูลช่วยเหลือบนหน้าจอ
 */
function drawHintInfo(ctx, position, text, color, scaleFactor = 1) {
  ctx.save();
  
  const fontSize = 14 * scaleFactor;
  ctx.font = `${fontSize}px Arial`;
  
  const textWidth = ctx.measureText(text).width;
  const padding = 6 * scaleFactor;
  const boxWidth = textWidth + (padding * 2);
  const boxHeight = fontSize + (padding * 1.2);
  
  ctx.fillStyle = LANDMARK_STYLES.ANGLE_BG_COLOR;
  ctx.fillRect(
    position.x - (boxWidth / 2),
    position.y - (boxHeight / 2), 
    boxWidth, 
    boxHeight
  );
  
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, position.x, position.y);
  
  ctx.restore();
}

/**
 * ฟังก์ชันหลักสำหรับตรวจจับท่ายกดัมเบลแบบยืน
 */
function detectStandingDumbbellExercise(landmarks) {
  if (window.PositionTracker) {
    window.PositionTracker.recordPosition(landmarks);
  }
  
  utils.debugLog("ทำงานใน detectStandingDumbbellExercise");

  if (!angleDisplayCreated) {
    const webcamContainer = document.querySelector('.webcam-container');
    if (webcamContainer) {
      AngleDisplay.createAngleGauge(webcamContainer);
      angleDisplayCreated = true;
    }
  }

  const leftShoulder = landmarks[11];
  const rightShoulder = landmarks[12];
  const leftElbow = landmarks[13];
  const rightElbow = landmarks[14];
  const leftWrist = landmarks[15];
  const rightWrist = landmarks[16];
  const leftHip = landmarks[23];
  const rightHip = landmarks[24];

  if (!leftShoulder || !rightShoulder || !leftElbow || !rightElbow || 
      !leftWrist || !rightWrist || !leftHip || !rightHip) {
    utils.debugLog("จุดสำคัญบางจุดไม่ถูกตรวจพบ");
    return;
  }

  const canvasWidth = globals.canvasElement.width;
  const canvasHeight = globals.canvasElement.height;

  let leftShoulderX = leftShoulder.x * canvasWidth;
  let rightShoulderX = rightShoulder.x * canvasWidth;
  let leftElbowX = leftElbow.x * canvasWidth;
  let rightElbowX = rightElbow.x * canvasWidth;
  let leftWristX = leftWrist.x * canvasWidth;
  let rightWristX = rightWrist.x * canvasWidth;

  let leftShoulderY = leftShoulder.y * canvasHeight;
  let rightShoulderY = rightShoulder.y * canvasHeight;
  let leftElbowY = leftElbow.y * canvasHeight;
  let rightElbowY = rightElbow.y * canvasHeight;
  let leftWristY = leftWrist.y * canvasHeight;
  let rightWristY = rightWrist.y * canvasHeight;

  const leftArmAngle = calculateArmAngle(
    {x: leftShoulderX, y: leftShoulderY}, 
    {x: leftElbowX, y: leftElbowY},
    {x: leftWristX, y: leftWristY}
  );

  const rightArmAngle = calculateArmAngle(
    {x: rightShoulderX, y: rightShoulderY}, 
    {x: rightElbowX, y: rightElbowY},
    {x: rightWristX, y: rightWristY}
  );

  const postureCheck = checkBodyPosture(
    {x: leftShoulderX, y: leftShoulderY},
    {x: rightShoulderX, y: rightShoulderY},
    {x: leftHip.x * canvasWidth, y: leftHip.y * canvasHeight},
    {x: rightHip.x * canvasWidth, y: rightHip.y * canvasHeight}
  );
  const isPostureCorrect = postureCheck.isCorrect;

  let smoothedLeftAngle = leftArmAngle;
  let smoothedRightAngle = rightArmAngle;
  
  if (previousLeftArmData) {
    smoothedLeftAngle = previousLeftArmData.angle * SMOOTHING_FACTOR + 
                        leftArmAngle * (1 - SMOOTHING_FACTOR);
  }
  
  if (previousRightArmData) {
    smoothedRightAngle = previousRightArmData.angle * SMOOTHING_FACTOR + 
                         rightArmAngle * (1 - SMOOTHING_FACTOR);
  }

  previousLeftArmData = {angle: smoothedLeftAngle};
  previousRightArmData = {angle: smoothedRightAngle};

  const leftAngleInfo = getAngleStatusInfo(smoothedLeftAngle, leftArmState);
  const rightAngleInfo = getAngleStatusInfo(smoothedRightAngle, rightArmState);

  if (angleDisplayCreated) {
    AngleDisplay.updateAngleGauge('left', smoothedLeftAngle, leftAngleInfo.status === 'correct');
    AngleDisplay.updateAngleGauge('right', smoothedRightAngle, rightAngleInfo.status === 'correct');
  }

  try {
    globals.canvasCtx.save();
    
    const scaleFactor = Math.min(canvasWidth, canvasHeight) / 640;
    
    drawHintInfo(
      globals.canvasCtx,
      {x: leftElbowX, y: leftElbowY - 30},
      `ซ้าย: ${smoothedLeftAngle.toFixed(1)}° - ${leftAngleInfo.message}`,
      leftAngleInfo.color,
      scaleFactor
    );
    
    drawHintInfo(
      globals.canvasCtx,
      {x: rightElbowX, y: rightElbowY - 30},
      `ขวา: ${smoothedRightAngle.toFixed(1)}° - ${rightAngleInfo.message}`,
      rightAngleInfo.color,
      scaleFactor
    );

    globals.canvasCtx.fillStyle = "white";
    globals.canvasCtx.font = "16px Arial";
    globals.canvasCtx.fillText(`ซ้าย: ${globals.leftCounter}/${globals.targetReps}`, leftElbowX, leftElbowY - 60);
    globals.canvasCtx.fillText(`ขวา: ${globals.rightCounter}/${globals.targetReps}`, rightElbowX, rightElbowY - 60);
    
  } catch (error) {
    utils.debugLog("เกิดข้อผิดพลาดในการวาด canvas:", error);
  }

  // เก็บตัวอย่างพื้นฐาน
  if (!window.baseSamples) {
    window.baseSamples = [];
  }

  if (!window.basePositions) {
    window.basePositions = {};
  }

  if (!window.calibrated && window.baseSamples.length < 30) {
    window.baseSamples.push({
      leftArmAngle: smoothedLeftAngle,
      rightArmAngle: smoothedRightAngle
    });
    
    globals.canvasCtx.fillText(`กำลังเก็บตัวอย่าง: ${window.baseSamples.length}/30`, 10, 60);

    if (window.baseSamples.length >= 30) {
      window.calibrated = true;
      globals.statusElement.textContent = "พร้อมนับแล้ว เริ่มออกกำลังกายได้";
      globals.statusElement.style.color = "#4CAF50";
      utils.hideCalibrationIndicator();
    }
  }

  if (window.calibrated) {
    const now = Date.now();
    const timeSinceLastCount = now - globals.lastCountTime;
    
    processArmMovement('left', smoothedLeftAngle, leftAngleInfo, isPostureCorrect, now, timeSinceLastCount);
    processArmMovement('right', smoothedRightAngle, rightAngleInfo, isPostureCorrect, now, timeSinceLastCount);
  }

  try {
    globals.canvasCtx.restore();
  } catch (error) {
    utils.debugLog("เกิดข้อผิดพลาดใน canvasCtx.restore():", error);
  }
}

/**
 * ประมวลผลการเคลื่อนไหวของแขน
 */
function processArmMovement(side, angle, angleInfo, isPostureCorrect, now, timeSinceLastCount) {
  const isLeft = side === 'left';
  const currentState = isLeft ? leftArmState : rightArmState;
  const isExtended = isLeft ? globals.isLeftExtended : globals.isRightExtended;
  const isHolding = isLeft ? globals.isLeftHolding : globals.isRightHolding;

  console.log(`🔄 ประมวลผลแขน${side}: สถานะ=${currentState}, มุม=${angle.toFixed(1)}°, กำลังค้าง=${isHolding}, ยก=${isExtended}`);

  if (!isPostureCorrect) {
    const currentTime = Date.now();
    if (!postureWarningShown || (currentTime - lastPostureWarningTime > POSTURE_WARNING_COOLDOWN)) {
      globals.statusElement.textContent = `ลำตัวเอียงเกินไป กรุณายืนให้ตรง`;
      globals.statusElement.style.color = "#FF5252";
      
      if (window.voiceFeedbackEnabled) {
        import('./exercise-tracker.js').then(module => {
          module.exerciseTracker.speakFeedback("ลำตัวเอียงเกินไป");
        });
      }
      postureWarningShown = true;
      lastPostureWarningTime = currentTime;
    }
    return;
  }

  postureWarningShown = false;

  if (currentState === 'start') {
    if (angleInfo.status === 'correct' && !isExtended && timeSinceLastCount > globals.autoCooldown) {
      console.log(`✅ เริ่มค้างท่าเริ่มต้นแขน${side}`);
      
      if (isLeft) {
        globals.isLeftExtended = true;
        leftArmState = 'holding_start';
      } else {
        globals.isRightExtended = true;
        rightArmState = 'holding_start';
      }
      
      // เริ่มการนับเวลา
      startHoldTimer(side);
      
      globals.statusElement.textContent = `กำลังค้างท่าเริ่มต้นแขน${side} (${angle.toFixed(1)}°) ค้างไว้ ${REQUIRED_HOLD_TIME} วินาที`;
      globals.statusElement.style.color = "#FFA000";
      
      if (window.voiceFeedbackEnabled) {
        import('./exercise-tracker.js').then(module => {
          module.exerciseTracker.speakFeedback(`ค้างท่าเริ่มต้นแขน${side} ${REQUIRED_HOLD_TIME} วินาที`);
        });
      }
    }
  } 
  else if (currentState === 'holding_start') {
    if (angleInfo.status === 'correct') {
      // มุมถูกต้อง - เวลาจะถูกอัปเดตโดย updateTimerDisplay()
      const currentHoldTime = isLeft ? leftArmHoldTime : rightArmHoldTime;
      
      if (currentHoldTime >= REQUIRED_HOLD_TIME) {
        console.log(`✅ ค้างท่าเริ่มต้นแขน${side}ครบเวลาแล้ว`);
        
        // หยุดการนับเวลาและเปลี่ยนสถานะ
        stopHoldTimer(side, true);
        
        if (isLeft) {
          leftArmState = 'end';
        } else {
          rightArmState = 'end';
        }
        
        globals.statusElement.textContent = `ค้างท่าเริ่มต้นแขน${side}ครบ ${REQUIRED_HOLD_TIME} วินาที แล้ว ยกแขนขึ้นได้`;
        globals.statusElement.style.color = "#4CAF50";
        
        if (window.voiceFeedbackEnabled) {
          import('./exercise-tracker.js').then(module => {
            module.exerciseTracker.speakFeedback(`ครบเวลาแล้ว ยกแขน${side}ขึ้นได้`);
          });
        }
      }
    } else {
      console.log(`❌ แขน${side}ออกจากท่าเริ่มต้น - ยกเลิกการนับเวลา`);
      
      // มุมไม่ถูกต้อง - ยกเลิกการนับเวลา
      stopHoldTimer(side, false);
      
      if (isLeft) {
        globals.isLeftExtended = false;
        leftArmState = 'start';
      } else {
        globals.isRightExtended = false;
        rightArmState = 'start';
      }
      
      globals.statusElement.textContent = `แขน${side}ออกจากท่าเริ่มต้น กรุณาเริ่มใหม่`;
      globals.statusElement.style.color = "#FF5252";
    }
  }
  else if (currentState === 'end') {
    if (angleInfo.status === 'correct') {
      console.log(`✅ เริ่มค้างท่าสิ้นสุดแขน${side}`);
      
      if (isLeft) {
        leftArmState = 'holding_end';
      } else {
        rightArmState = 'holding_end';
      }
      
      // เริ่มการนับเวลาท่าสิ้นสุด
      startHoldTimer(side);
      
      globals.statusElement.textContent = `กำลังค้างท่าสิ้นสุดแขน${side} (${angle.toFixed(1)}°) ค้างไว้ ${REQUIRED_HOLD_TIME} วินาที`;
      globals.statusElement.style.color = "#FFA000";
    }
  }
  else if (currentState === 'holding_end') {
    if (angleInfo.status === 'correct') {
      // มุมถูกต้อง - เวลาจะถูกอัปเดตโดย updateTimerDisplay()
      const currentHoldTime = isLeft ? leftArmHoldTime : rightArmHoldTime;
      
      if (currentHoldTime >= REQUIRED_HOLD_TIME) {
        console.log(`นับการยกแขน${side} 1 ครั้ง`);
        
        // นับเสร็จ 1 ครั้ง
        if (isLeft) {
          globals.leftCounter++;
          globals.isLeftExtended = false;
          leftArmState = 'start';
        } else {
          globals.rightCounter++;
          globals.isRightExtended = false;
          rightArmState = 'start';
        }
        
        stopHoldTimer(side, true);
        globals.lastCountTime = now;
        
        globals.statusElement.textContent = `นับแขน${side} ${isLeft ? globals.leftCounter : globals.rightCounter}/${globals.targetReps} ครั้ง!`;
        globals.statusElement.style.color = "#4CAF50";
        
        utils.showCountEffect(isLeft);
        
        EventSystem.updateCounter({
          leftCounter: globals.leftCounter,
          rightCounter: globals.rightCounter,
          roundCounter: globals.roundCounter
        });
        
        if (window.voiceFeedbackEnabled) {
          import('./exercise-tracker.js').then(module => {
            module.exerciseTracker.speakFeedback(`นับแขน${side} ${isLeft ? globals.leftCounter : globals.rightCounter} ครั้ง`);
          });
        }
        
        checkRoundCompletion();
      }
    } else {
      console.log(`แขน${side}ออกจากท่าสิ้นสุด - ยกเลิกการนับเวลา`);
      
      // มุมไม่ถูกต้อง - ยกเลิกการนับเวลา
      stopHoldTimer(side, false);
      
      if (isLeft) {
        leftArmState = 'end';
      } else {
        rightArmState = 'end';
      }
      
      globals.statusElement.textContent = `แขน${side}ออกจากท่าสิ้นสุด กรุณาปรับท่าใหม่`;
      globals.statusElement.style.color = "#FF5252";
    }
  }
}

/**
 * ตรวจสอบการทำครบรอบ
 */
function checkRoundCompletion() {
  if (globals.leftCounter >= globals.targetReps && globals.rightCounter >= globals.targetReps) {
    globals.roundCounter++;
     
    globals.statusElement.textContent = `ทำครบรอบที่ ${globals.roundCounter} แล้ว! (${globals.leftCounter}/${globals.targetReps} ซ้าย, ${globals.rightCounter}/${globals.targetReps} ขวา)`;
    globals.statusElement.style.color = "#4CAF50";
     
    EventSystem.roundCompleted(
      globals.currentExercise,
      1,
      globals.leftCounter,
      globals.rightCounter
    );
     
    if (window.voiceFeedbackEnabled) {
      import('./exercise-tracker.js').then(module => {
        module.exerciseTracker.speakFeedback(`ทำครบรอบที่ ${globals.roundCounter} แล้ว! แขนซ้าย ${globals.leftCounter} ครั้ง แขนขวา ${globals.rightCounter} ครั้ง`);
      }).catch(err => {
        console.error("ไม่สามารถโหลดโมดูล exercise-tracker:", err);
      });
    }
     
    if (globals.autoCountEnabled) {
      setTimeout(() => {
        globals.leftCounter = 0;
        globals.rightCounter = 0;
        
        leftArmState = 'start';
        rightArmState = 'start';
        leftArmHoldTime = 0;
        rightArmHoldTime = 0;
        leftCorrectAngleStartTime = 0;
        rightCorrectAngleStartTime = 0;
        
        if (angleDisplayCreated) {
          AngleDisplay.updateHoldTimer(0, REQUIRED_HOLD_TIME, false, false, false);
        }
        
        EventSystem.updateCounter({
          leftCounter: globals.leftCounter,
          rightCounter: globals.rightCounter,
          roundCounter: globals.roundCounter
        });
        
        globals.statusElement.textContent = `เริ่มรอบที่ ${globals.roundCounter + 1}`;
        
        if (window.voiceFeedbackEnabled) {
          import('./exercise-tracker.js').then(module => {
            module.exerciseTracker.speakFeedback(`เริ่มรอบที่ ${globals.roundCounter + 1}`);
          }).catch(err => {
            console.error("ไม่สามารถโหลดโมดูล exercise-tracker:", err);
          });
        }
      }, 3000);
    }
  }
}

/**
 * รีเซ็ตตัวแปรที่เกี่ยวข้องกับการตรวจจับ
 */
function resetDetection() {
  stopTimerUpdate();
  angleDisplayCreated = false;
  leftArmHoldTime = 0;
  rightArmHoldTime = 0;
  leftCorrectAngleStartTime = 0;
  rightCorrectAngleStartTime = 0;
  leftArmState = 'start';
  rightArmState = 'start';
  postureWarningShown = false;
  lastPostureWarningTime = 0;
  previousLeftArmData = null;
  previousRightArmData = null;
}

export { 
  detectStandingDumbbellExercise,
  checkRoundCompletion,
  resetDetection,
  checkBodyPosture,
  calculateArmAngle
};