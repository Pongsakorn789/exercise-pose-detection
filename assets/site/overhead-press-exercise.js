// overhead-press-exercise.js
// ท่ายกแขนเหนือศีรษะ (Overhead Press) - แปลงจากท่ายกขาด้านข้าง

import { globals } from './main.js';
import { utils } from './utils.js';
import { HoldTimer } from './hold-timer.js';
import { EventSystem } from './event-system.js';
import { AngleDisplay } from './angle-display.js';

// ค่าคงที่สำหรับช่วงมุมที่ถูกต้อง
const MIN_ANGLE = 160; // องศาขั้นต่ำสำหรับท่ายกแขนเหนือศีรษะ  
const MAX_ANGLE = 180; // องศาสูงสุด
const REQUIRED_HOLD_TIME = 2; // เวลาที่ต้องค้าง (วินาที)
const MIN_ELBOW_ANGLE = 140; // องศาข้อศอกขั้นต่ำที่ถือว่าแขนยกสูง

// ค่าคงที่สำหรับการตรวจสอบท่าทางถูกต้อง
const MAX_BODY_LEAN_ANGLE = 15; // มุมเอียงสูงสุดของลำตัวที่ยอมรับได้ (องศา)
const MIN_SHOULDER_WIDTH_RATIO = 0.8; // อัตราส่วนความกว้างไหล่ขั้นต่ำ

// ตัวแปรสำหรับการติดตามสถานะ
let angleDisplayCreated = false;
let leftArmHoldTime = 0;
let rightArmHoldTime = 0;

// ตัวแปรสำหรับการติดตามเวลาเริ่มต้นการค้างแขนที่ถูกต้อง
let leftCorrectAngleStartTime = 0;
let rightCorrectAngleStartTime = 0;

// ตัวแปรสำหรับการติดตามสถานะแจ้งเตือน
let leftElbowBendWarningShown = false;
let rightElbowBendWarningShown = false;
let bodyLeanWarningShown = false;
let lastBodyLeanWarningTime = 0;
const BODY_LEAN_WARNING_COOLDOWN = 3000; // 3 วินาทีระหว่างการแจ้งเตือน

// ตัวแปรสำหรับควบคุมความเรียบของเส้น
const SMOOTHING_FACTOR = 0.7;
let previousLeftArmData = null;
let previousRightArmData = null;

// ค่าคงที่สำหรับการแสดงผลแลนด์มาร์ค
const LANDMARK_STYLES = {
  CORRECT_COLOR: 'rgba(76, 175, 80, 0.9)',
  LOW_ANGLE_COLOR: 'rgba(255, 193, 7, 0.9)',
  HIGH_ANGLE_COLOR: 'rgba(255, 82, 82, 0.9)',
  CONNECTOR_COLOR: 'rgba(255, 255, 255, 0.7)',
  BODY_LEAN_COLOR: 'rgba(255, 152, 0, 0.9)',
  
  BASE_LANDMARK_SIZE: 8,
  BASE_LINE_WIDTH: 3,
  ANGLE_BG_COLOR: 'rgba(0, 0, 0, 0.7)',
  TEXT_COLOR: 'white',
  GLOW_COLOR: 'rgba(255, 255, 255, 0.6)'
};

/**
 * คำนวณมุมการยกแขนเหนือศีรษะ
 * @param {Object} shoulder จุดไหล่ {x, y}
 * @param {Object} elbow จุดข้อศอก {x, y}
 * @param {Object} wrist จุดข้อมือ {x, y}
 * @returns {number} มุมในหน่วยองศา
 */
function calculateArmOverheadAngle(shoulder, elbow, wrist) {
  // คำนวณมุมระหว่างไหล่-ข้อศอก-ข้อมือ
  return utils.calculateAngle(
    shoulder.x, shoulder.y,
    elbow.x, elbow.y,
    wrist.x, wrist.y
  );
}

/**
 * ตรวจสอบว่ามุมอยู่ในช่วงที่ถูกต้องหรือไม่
 * @param {number} angle มุมในหน่วยองศา
 * @returns {boolean} ผลการตรวจสอบ
 */
function isAngleInCorrectRange(angle) {
  return angle >= MIN_ANGLE && angle <= MAX_ANGLE;
}

/**
 * ได้สถานะของมุม
 * @param {number} angle มุมในหน่วยองศา
 * @returns {string} สถานะ ('low', 'high', 'correct')
 */
function getAngleStatus(angle) {
  if (angle < MIN_ANGLE) return 'low';
  if (angle > MAX_ANGLE) return 'high';
  return 'correct';
}

/**
 * ได้ข้อมูลสถานะมุมพร้อมสีและข้อความ
 * @param {number} angle มุมในหน่วยองศา
 * @param {number} minAngle มุมขั้นต่ำ
 * @param {number} maxAngle มุมสูงสุด
 * @returns {Object} ข้อมูลสถานะ
 */
function getAngleStatusInfo(angle, minAngle = MIN_ANGLE, maxAngle = MAX_ANGLE) {
  let status, color, message;
  
  if (angle < minAngle) {
    status = 'low';
    color = LANDMARK_STYLES.LOW_ANGLE_COLOR;
    message = 'ยกแขนสูงขึ้น';
  } else if (angle > maxAngle) {
    status = 'high';
    color = LANDMARK_STYLES.HIGH_ANGLE_COLOR;
    message = 'ลดมุมลง';
  } else {
    status = 'correct';
    color = LANDMARK_STYLES.CORRECT_COLOR;
    message = 'ถูกต้อง';
  }
  
  return { status, color, message };
}

/**
 * ตรวจสอบการเอียงของลำตัว
 * @param {Object} leftShoulder จุดไหล่ซ้าย {x, y}
 * @param {Object} rightShoulder จุดไหล่ขวา {x, y}
 * @param {Object} leftHip จุดสะโพกซ้าย {x, y}
 * @param {Object} rightHip จุดสะโพกขวา {x, y}
 * @returns {Object} ข้อมูลการเอียงของลำตัว
 */
function checkBodyLean(leftShoulder, rightShoulder, leftHip, rightHip) {
  // คำนวณจุดกึ่งกลางของไหล่และสะโพก
  const shoulderCenter = {
    x: (leftShoulder.x + rightShoulder.x) / 2,
    y: (leftShoulder.y + rightShoulder.y) / 2
  };
  
  const hipCenter = {
    x: (leftHip.x + rightHip.x) / 2,
    y: (leftHip.y + rightHip.y) / 2
  };
  
  // คำนวณมุมเอียงของแกนลำตัว
  const deltaX = hipCenter.x - shoulderCenter.x;
  const deltaY = hipCenter.y - shoulderCenter.y;
  
  let leanAngle = Math.atan2(Math.abs(deltaX), Math.abs(deltaY)) * (180 / Math.PI);
  
  // กำหนดทิศทางการเอียง
  let leanDirection = 'center';
  if (Math.abs(deltaX) > 5) {
    leanDirection = deltaX > 0 ? 'right' : 'left';
  }
  
  const isPostureCorrect = leanAngle <= MAX_BODY_LEAN_ANGLE;
  
  return {
    angle: leanAngle,
    isCorrect: isPostureCorrect,
    direction: leanDirection,
    shoulderCenter: shoulderCenter,
    hipCenter: hipCenter
  };
}

/**
 * วาดสี่เหลี่ยมโค้งมน
 * @param {Object} ctx คอนเท็กซ์ของแคนวาส
 * @param {number} x พิกัด x
 * @param {number} y พิกัด y
 * @param {number} width ความกว้าง
 * @param {number} height ความสูง
 * @param {number} radius รัศมีโค้ง
 */
function roundRect(ctx, x, y, width, height, radius) {
  if (width < 2 * radius) radius = width / 2;
  if (height < 2 * radius) radius = height / 2;
  
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

/**
 * วาดข้อมูลช่วยเหลือบนหน้าจอ
 * @param {Object} ctx คอนเท็กซ์ของแคนวาส
 * @param {Object} position ตำแหน่ง {x, y}
 * @param {string} text ข้อความ
 * @param {string} color สี
 * @param {number} scaleFactor ปัจจัยการปรับขนาด
 */
function drawHintInfo(ctx, position, text, color, scaleFactor) {
  ctx.save();
  
  const fontSize = 14 * scaleFactor;
  ctx.font = `${fontSize}px Arial`;
  
  const textWidth = ctx.measureText(text).width;
  const padding = 6 * scaleFactor;
  const boxWidth = textWidth + (padding * 2);
  const boxHeight = fontSize + (padding * 1.2);
  
  // วาดพื้นหลัง
  ctx.beginPath();
  roundRect(
    ctx, 
    position.x - (boxWidth / 2),
    position.y - (boxHeight / 2), 
    boxWidth, 
    boxHeight, 
    4 * scaleFactor
  );
  
  ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
  ctx.shadowBlur = 3 * scaleFactor;
  ctx.fillStyle = color.replace(/[^,]+(?=\))/, '0.8');
  ctx.fill();
  
  // วาดข้อความ
  ctx.shadowColor = 'transparent';
  ctx.fillStyle = LANDMARK_STYLES.TEXT_COLOR;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, position.x, position.y);
  
  ctx.restore();
}

/**
 * วาดแสดงสถานะลำตัวเอียง
 * @param {Object} ctx คอนเท็กซ์ของแคนวาส
 * @param {Object} bodyCheck ผลการตรวจสอบลำตัว
 * @param {number} scaleFactor ปัจจัยการปรับขนาด
 */
function drawBodyLeanIndicator(ctx, bodyCheck, scaleFactor) {
  if (!bodyCheck.shoulderCenter || !bodyCheck.hipCenter) return;
  
  ctx.save();
  
  // วาดเส้นแกนลำตัว
  ctx.beginPath();
  ctx.moveTo(bodyCheck.shoulderCenter.x, bodyCheck.shoulderCenter.y);
  ctx.lineTo(bodyCheck.hipCenter.x, bodyCheck.hipCenter.y);
  
  // เลือกสีตามสถานะ
  if (bodyCheck.isCorrect) {
    ctx.strokeStyle = LANDMARK_STYLES.CORRECT_COLOR;
    ctx.lineWidth = 4 * scaleFactor;
  } else {
    ctx.strokeStyle = LANDMARK_STYLES.BODY_LEAN_COLOR;
    ctx.lineWidth = 6 * scaleFactor;
    ctx.shadowColor = LANDMARK_STYLES.BODY_LEAN_COLOR;
    ctx.shadowBlur = 10 * scaleFactor;
  }
  
  ctx.lineCap = 'round';
  ctx.stroke();
  
  // วาดจุดที่จุดกึ่งกลาง
  const centerX = (bodyCheck.shoulderCenter.x + bodyCheck.hipCenter.x) / 2;
  const centerY = (bodyCheck.shoulderCenter.y + bodyCheck.hipCenter.y) / 2;
  
  ctx.beginPath();
  ctx.arc(centerX, centerY, 8 * scaleFactor, 0, 2 * Math.PI);
  ctx.fillStyle = bodyCheck.isCorrect ? LANDMARK_STYLES.CORRECT_COLOR : LANDMARK_STYLES.BODY_LEAN_COLOR;
  ctx.fill();
  
  // แสดงข้อความแจ้งเตือนถ้าลำตัวเอียง
  if (!bodyCheck.isCorrect) {
    const warningPos = {
      x: centerX,
      y: centerY - 40 * scaleFactor
    };
    
    let message = '';
    if (bodyCheck.direction === 'left') {
      message = `ลำตัวเอียงซ้าย ${bodyCheck.angle.toFixed(1)}°`;
    } else if (bodyCheck.direction === 'right') {
      message = `ลำตัวเอียงขวา ${bodyCheck.angle.toFixed(1)}°`;
    } else {
      message = `ลำตัวเอียง ${bodyCheck.angle.toFixed(1)}°`;
    }
    
    drawHintInfo(
      ctx,
      warningPos,
      message,
      LANDMARK_STYLES.BODY_LEAN_COLOR,
      scaleFactor
    );
  }
  
  ctx.restore();
}

/**
 * ฟังก์ชันตรวจจับท่ายกแขนเหนือศีรษะ
 * @param {Array} landmarks จุดสำคัญของร่างกาย
 */
function detectOverheadPressExercise(landmarks) {
  // บันทึกตำแหน่งทุกเฟรม
  if (window.PositionTracker) {
    window.PositionTracker.recordPosition(landmarks);
  }
  
  utils.debugLog("ทำงานใน detectOverheadPressExercise");

  // สร้างแถบวัดมุมถ้ายังไม่มี
  if (!angleDisplayCreated) {
    const webcamContainer = document.querySelector('.webcam-container');
    if (webcamContainer) {
      AngleDisplay.createAngleGauge(webcamContainer);
      angleDisplayCreated = true;
    }
  }

  // ดึงจุดสำคัญสำหรับท่ายกแขนเหนือศีรษะ
  const leftShoulder = landmarks[11];
  const rightShoulder = landmarks[12];
  const leftElbow = landmarks[13];
  const rightElbow = landmarks[14];
  const leftWrist = landmarks[15];
  const rightWrist = landmarks[16];
  const leftHip = landmarks[23];
  const rightHip = landmarks[24];

  // ตรวจสอบจุดสำคัญ
  if (!leftShoulder || !rightShoulder || !leftElbow || !rightElbow || 
      !leftWrist || !rightWrist || !leftHip || !rightHip) {
    utils.debugLog("จุดสำคัญบางจุดไม่ถูกตรวจพบ");
    return;
  }

  // ตรวจสอบลำตัวตรง
  const bodyCheck = checkBodyLean(
    {x: leftShoulder.x * globals.canvasElement.width, y: leftShoulder.y * globals.canvasElement.height},
    {x: rightShoulder.x * globals.canvasElement.width, y: rightShoulder.y * globals.canvasElement.height},
    {x: leftHip.x * globals.canvasElement.width, y: leftHip.y * globals.canvasElement.height},
    {x: rightHip.x * globals.canvasElement.width, y: rightHip.y * globals.canvasElement.height}
  );
  const isBodyPostureCorrect = bodyCheck.isCorrect;
  
  // แปลงเป็นพิกัดพิกเซล
  let leftShoulderX = leftShoulder.x * globals.canvasElement.width;
  let rightShoulderX = rightShoulder.x * globals.canvasElement.width;
  let leftElbowX = leftElbow.x * globals.canvasElement.width;
  let rightElbowX = rightElbow.x * globals.canvasElement.width;
  let leftWristX = leftWrist.x * globals.canvasElement.width;
  let rightWristX = rightWrist.x * globals.canvasElement.width;

  let leftShoulderY = leftShoulder.y * globals.canvasElement.height;
  let rightShoulderY = rightShoulder.y * globals.canvasElement.height;
  let leftElbowY = leftElbow.y * globals.canvasElement.height;
  let rightElbowY = rightElbow.y * globals.canvasElement.height;
  let leftWristY = leftWrist.y * globals.canvasElement.height;
  let rightWristY = rightWrist.y * globals.canvasElement.height;

  // คำนวณมุมข้อศอก
  const leftElbowAngle = utils.calculateAngle(
    leftShoulderX, leftShoulderY,
    leftElbowX, leftElbowY,
    leftWristX, leftWristY
  );

  const rightElbowAngle = utils.calculateAngle(
    rightShoulderX, rightShoulderY,
    rightElbowX, rightElbowY,
    rightWristX, rightWristY
  );

  // คำนวณมุมการยกแขนเหนือศีรษะ
  const leftArmOverheadAngle = calculateArmOverheadAngle(
    {x: leftShoulderX, y: leftShoulderY}, 
    {x: leftElbowX, y: leftElbowY},
    {x: leftWristX, y: leftWristY}
  );

  const rightArmOverheadAngle = calculateArmOverheadAngle(
    {x: rightShoulderX, y: rightShoulderY}, 
    {x: rightElbowX, y: rightElbowY},
    {x: rightWristX, y: rightWristY}
  );
  
  // ทำ smoothing ค่ามุม
  let smoothedLeftAngle = leftArmOverheadAngle;
  let smoothedRightAngle = rightArmOverheadAngle;
  
  // สร้างข้อมูลแขนปัจจุบัน
  const currentLeftArmData = {
    angle: leftArmOverheadAngle,
    shoulder: {x: leftShoulderX, y: leftShoulderY},
    elbow: {x: leftElbowX, y: leftElbowY},
    wrist: {x: leftWristX, y: leftWristY}
  };
  
  const currentRightArmData = {
    angle: rightArmOverheadAngle,
    shoulder: {x: rightShoulderX, y: rightShoulderY},
    elbow: {x: rightElbowX, y: rightElbowY},
    wrist: {x: rightWristX, y: rightWristY}
  };
  
  // ทำ smoothing สำหรับข้อมูลแขนซ้าย
  if (previousLeftArmData) {
    smoothedLeftAngle = previousLeftArmData.angle * SMOOTHING_FACTOR + 
                        leftArmOverheadAngle * (1 - SMOOTHING_FACTOR);
    currentLeftArmData.angle = smoothedLeftAngle;
  }
  
  // ทำ smoothing สำหรับข้อมูลแขนขวา
  if (previousRightArmData) {
    smoothedRightAngle = previousRightArmData.angle * SMOOTHING_FACTOR + 
                         rightArmOverheadAngle * (1 - SMOOTHING_FACTOR);
    currentRightArmData.angle = smoothedRightAngle;
  }
  
  // บันทึกข้อมูลปัจจุบันสำหรับใช้ในรอบถัดไป
  previousLeftArmData = currentLeftArmData;
  previousRightArmData = currentRightArmData;
  
  // ตรวจสอบว่ามุมอยู่ในช่วงที่ถูกต้องหรือไม่
  const isLeftAngleCorrect = isAngleInCorrectRange(smoothedLeftAngle);
  const isRightAngleCorrect = isAngleInCorrectRange(smoothedRightAngle);
  
  // อัปเดตแถบวัดมุม
  if (angleDisplayCreated) {
    AngleDisplay.updateAngleGauge('left', smoothedLeftAngle, isLeftAngleCorrect);
    AngleDisplay.updateAngleGauge('right', smoothedRightAngle, isRightAngleCorrect);
  }
  
  // ตรวจสอบว่าข้อศอกเหยียดตรงหรือไม่
  const isLeftElbowStraight = leftElbowAngle > MIN_ELBOW_ANGLE;
  const isRightElbowStraight = rightElbowAngle > MIN_ELBOW_ANGLE;

  // แสดงข้อมูลบนหน้าจอ
  try {
    globals.canvasCtx.save();
    globals.canvasCtx.font = "16px Arial";
    globals.canvasCtx.fillStyle = "white";
    
    // แสดงตัวนับ
    globals.canvasCtx.fillText(`ซ้าย: ${globals.leftCounter}/${globals.targetReps}`, currentLeftArmData.elbow.x, currentLeftArmData.elbow.y - 60);
    globals.canvasCtx.fillText(`ขวา: ${globals.rightCounter}/${globals.targetReps}`, currentRightArmData.elbow.x, currentRightArmData.elbow.y - 60);
    
    // วาดแสดงสถานะลำตัวเอียง
    const scaleFactor = Math.min(globals.canvasElement.width, globals.canvasElement.height) / 640;
    drawBodyLeanIndicator(globals.canvasCtx, bodyCheck, scaleFactor);
    
    // แสดงการแจ้งเตือนเมื่อข้อศอกงอ 
    if (!isLeftElbowStraight) {
      const warningPos = {
        x: currentLeftArmData.elbow.x,
        y: currentLeftArmData.elbow.y - 90
      };
      drawHintInfo(
        globals.canvasCtx,
        warningPos,
        "ข้อศอกซ้ายงอ! ควรเหยียดให้ตรง",
        LANDMARK_STYLES.HIGH_ANGLE_COLOR,
        scaleFactor
      );
    }
    
    if (!isRightElbowStraight) {
      const warningPos = {
        x: currentRightArmData.elbow.x,
        y: currentRightArmData.elbow.y - 90
      };
      drawHintInfo(
        globals.canvasCtx,
        warningPos,
        "ข้อศอกขวางอ! ควรเหยียดให้ตรง",
        LANDMARK_STYLES.HIGH_ANGLE_COLOR,
        scaleFactor
      );
    }
    
    globals.canvasCtx.fillStyle = "white";
  } catch (error) {
    utils.debugLog("เกิดข้อผิดพลาดในการวาด canvas:", error);
  }

  // สร้าง baseSamples ถ้ายังไม่มี
  if (!window.baseSamples) {
    window.baseSamples = [];
  }

  if (!window.basePositions) {
    window.basePositions = {};
  }

  // เก็บตัวอย่างพื้นฐาน
  if (!window.calibrated && window.baseSamples.length < 30) {
    window.baseSamples.push({
      leftArmOverheadAngle: smoothedLeftAngle,
      rightArmOverheadAngle: smoothedRightAngle
    });
    
    globals.canvasCtx.fillText(`กำลังเก็บตัวอย่าง: ${window.baseSamples.length}/30`, 10, 60);

    if (window.baseSamples.length >= 30) {
      window.calibrated = true;
      globals.statusElement.textContent = "พร้อมนับแล้ว เริ่มออกกำลังกายได้";
      globals.statusElement.style.color = "#4CAF50";
      utils.hideCalibrationIndicator();
    }
  }

  // ระบบการตรวจจับและนับ
  if (window.calibrated) {
    const now = Date.now();
    const timeSinceLastCount = now - globals.lastCountTime;
    
    // ตรวจจับแขนซ้าย
    if (isLeftAngleCorrect && !globals.isLeftExtended && timeSinceLastCount > globals.autoCooldown) {
      // เพิ่มเงื่อนไขตรวจสอบลำตัวตรง
      if (!isBodyPostureCorrect) {
        const currentTime = Date.now();
        if (!bodyLeanWarningShown || (currentTime - lastBodyLeanWarningTime > BODY_LEAN_WARNING_COOLDOWN)) {
          globals.statusElement.textContent = `ลำตัวเอียงเกินไป กรุณายืนให้ตรง`;
          globals.statusElement.style.color = "#FF5252";
          
          if (window.voiceFeedbackEnabled) {
            import('./exercise-tracker.js').then(module => {
              module.exerciseTracker.speakFeedback("ลำตัวเอียงเกินไป");
            });
          }
          bodyLeanWarningShown = true;
          lastBodyLeanWarningTime = currentTime;
        }
        return;
      }
      
      // ตรวจสอบว่าข้อศอกตรงหรือไม่
      if (!isLeftElbowStraight) {
        if (!leftElbowBendWarningShown) {
          globals.statusElement.textContent = "ข้อศอกซ้ายงอเกินไป ควรเหยียดให้ตรง";
          globals.statusElement.style.color = "#FF5252";
          
          if (window.voiceFeedbackEnabled) {
            import('./exercise-tracker.js').then(module => {
              module.exerciseTracker.speakFeedback("ข้อศอกซ้ายงอเกินไป ควรเหยียดให้ตรง");
            });
          }
          leftElbowBendWarningShown = true;
        }
        return;
      }
      
      // รีเซ็ตตัวแปรแจ้งเตือน
      leftElbowBendWarningShown = false;
      bodyLeanWarningShown = false;
      
      // ผู้ใช้เริ่มยกแขนซ้ายในมุมที่ถูกต้อง
      utils.debugLog("เริ่มยกแขนซ้ายในมุมที่ถูกต้อง");
      globals.isLeftExtended = true;
      globals.isLeftHolding = true;
      globals.leftHoldStartTime = now;
      leftCorrectAngleStartTime = now;
      
      globals.statusElement.textContent = `กำลังยกแขนซ้าย (${smoothedLeftAngle.toFixed(1)}°) ค้างไว้ ${REQUIRED_HOLD_TIME} วินาที`;
      globals.statusElement.style.color = "#FFA000";
      
      if (window.voiceFeedbackEnabled) {
        import('./exercise-tracker.js').then(module => {
          module.exerciseTracker.speakFeedback(`ยกแขนซ้าย มุม ${Math.round(smoothedLeftAngle)} องศา ค้างไว้ ${REQUIRED_HOLD_TIME} วินาที`);
        });
      }
    } 
    // ตรวจสอบแขนซ้ายที่กำลังค้าง
    else if (globals.isLeftExtended && globals.isLeftHolding) {
      // ตรวจสอบลำตัวตรงระหว่างค้าง
      if (!isBodyPostureCorrect) {
        globals.statusElement.textContent = `ลำตัวเอียงเกินไป การนับเวลาถูกยกเลิก`;
        globals.statusElement.style.color = "#FF5252";
        
        // ยกเลิกการนับเวลา
        globals.isLeftHolding = false;
        globals.isLeftExtended = false;
        globals.leftHoldStartTime = 0;
        leftCorrectAngleStartTime = 0;
        
        // รีเซ็ตตัวแสดงเวลาค้างแขน
        if (angleDisplayCreated) {
          AngleDisplay.updateHoldTimer(0, REQUIRED_HOLD_TIME, false, false, false);
        }
        
        if (window.voiceFeedbackEnabled) {
          import('./exercise-tracker.js').then(module => {
            module.exerciseTracker.speakFeedback("ลำตัวเอียงเกินไป");
          });
        }
        return;
      }
      
      // ตรวจสอบว่าข้อศอกยังตรงอยู่หรือไม่
      if (!isLeftElbowStraight) {
        globals.statusElement.textContent = "ข้อศอกซ้ายงอเกินไป การนับเวลาถูกยกเลิก";
        globals.statusElement.style.color = "#FF5252";
        
        // ยกเลิกการนับเวลา
        globals.isLeftHolding = false;
        globals.isLeftExtended = false;
        globals.leftHoldStartTime = 0;
        leftCorrectAngleStartTime = 0;
        
        // รีเซ็ตตัวแสดงเวลาค้างแขน
        if (angleDisplayCreated) {
          AngleDisplay.updateHoldTimer(0, REQUIRED_HOLD_TIME, false, false, false);
        }
        
        if (window.voiceFeedbackEnabled) {
          import('./exercise-tracker.js').then(module => {
            module.exerciseTracker.speakFeedback("ข้อศอกซ้ายงอเกินไป การนับเวลาถูกยกเลิก");
          });
        }
        return;
      }
      
      // ตรวจสอบมุมที่กำลังค้าง
      if (isLeftAngleCorrect) {
        // หากมุมถูกต้อง ให้นับเวลาการค้าง
        if (leftCorrectAngleStartTime === 0) {
          leftCorrectAngleStartTime = now;
        }
        
        // คำนวณเวลาค้างที่มุมถูกต้อง
        leftArmHoldTime = (now - leftCorrectAngleStartTime) / 1000;
        
        // อัปเดตตัวแสดงเวลาค้างแขนขนาดใหญ่
        if (angleDisplayCreated) {
          AngleDisplay.updateHoldTimer(leftArmHoldTime, REQUIRED_HOLD_TIME, true, false, true);
        }
        
        // ตรวจสอบว่าค้างครบเวลาหรือไม่
        if (leftArmHoldTime >= REQUIRED_HOLD_TIME) {
          // ค้างครบเวลาแล้ว
          globals.isLeftHolding = false;
          
          // อัปเดตตัวแสดงเวลา (ครบเวลาแล้ว)
          if (angleDisplayCreated) {
            AngleDisplay.updateHoldTimer(REQUIRED_HOLD_TIME, REQUIRED_HOLD_TIME, false, true, true);
          }
          
          globals.statusElement.textContent = `ค้างแขนซ้ายครบ ${REQUIRED_HOLD_TIME} วินาที แล้ว ลดแขนลงได้`;
          globals.statusElement.style.color = "#4CAF50";
          
          if (!globals.leftHoldNotified && window.voiceFeedbackEnabled) {
            globals.leftHoldNotified = true;
            import('./exercise-tracker.js').then(module => {
              module.exerciseTracker.speakFeedback(`ค้างแขนซ้ายครบ ${REQUIRED_HOLD_TIME} วินาที แล้ว ลดแขนลงได้`);
            });
          }
        } else {
          // กำลังค้าง แต่ยังไม่ครบเวลา
          globals.statusElement.textContent = `กำลังค้างแขนซ้าย ${leftArmHoldTime.toFixed(1)}/${REQUIRED_HOLD_TIME} วินาที (มุม ${smoothedLeftAngle.toFixed(1)}°)`;
          globals.statusElement.style.color = "#FFA000";
        }
      } else {
        // มุมไม่ถูกต้อง แต่ยังกำลังค้างแขนอยู่
        leftCorrectAngleStartTime = 0;
        
        // อัปเดตตัวแสดงเวลาค้างแขน โดยใช้เวลาเดิม แต่กำหนด isAngleCorrect = false
        if (angleDisplayCreated) {
          AngleDisplay.updateHoldTimer(leftArmHoldTime, REQUIRED_HOLD_TIME, true, false, false);
        }
        
        // แสดงข้อความแนะนำให้ปรับมุม
        const angleStatus = getAngleStatus(smoothedLeftAngle);
        let statusMessage = "";
        
        if (angleStatus === 'low') {
          statusMessage = `มุมแขนซ้ายต่ำเกินไป (${smoothedLeftAngle.toFixed(1)}°) ควรยกให้สูงขึ้น`;
        } else {
          statusMessage = `มุมแขนซ้ายสูงเกินไป (${smoothedLeftAngle.toFixed(1)}°) ควรลดมุมลง`;
        }
        
        globals.statusElement.textContent = statusMessage;
        globals.statusElement.style.color = "#FF5252";
      }
    }
    // ตรวจสอบการลดแขนซ้ายกลับที่เดิม (หลังจากค้างครบเวลา)
    else if (!isLeftAngleCorrect && globals.isLeftExtended) {
      // ผู้ใช้ลดแขนลงแล้ว (มุมไม่อยู่ในช่วง 160-180 องศา)
      
      // ตรวจสอบว่าได้ค้างแขนครบเวลาหรือไม่
      if (globals.leftHoldStartTime > 0 && !globals.isLeftHolding) {
        // นับการออกกำลังกาย 1 ครั้ง
        utils.debugLog("นับการยกแขนซ้าย 1 ครั้ง");
        
        globals.leftCounter++;
        globals.lastCountTime = now;
        globals.isLeftExtended = false;
        globals.leftHoldStartTime = 0;
        globals.leftHoldNotified = false;
        leftCorrectAngleStartTime = 0;
        
        // แสดงผลการนับ
        globals.statusElement.textContent = `นับแขนซ้าย ${globals.leftCounter}/${globals.targetReps} ครั้ง!`;
        globals.statusElement.style.color = "#4CAF50";
        
        // แสดงเอฟเฟกต์การนับ
        utils.showCountEffect(true);
        
        // อัปเดตตัวนับ
        EventSystem.updateCounter({
          leftCounter: globals.leftCounter,
          rightCounter: globals.rightCounter,
          roundCounter: globals.roundCounter
        });
        
        // รีเซ็ตตัวแสดงเวลาค้างแขน
        if (angleDisplayCreated) {
          AngleDisplay.updateHoldTimer(0, REQUIRED_HOLD_TIME, false, false, false);
        }
        
        // เพิ่มเสียงบรรยาย
        if (window.voiceFeedbackEnabled) {
          import('./exercise-tracker.js').then(module => {
            module.exerciseTracker.speakFeedback(`นับแขนซ้าย ${globals.leftCounter} ครั้ง`);
          });
        }
        
        // ตรวจสอบการทำครบรอบ
        checkRoundCompletion();
      } else {
        // ไม่ได้ค้างครบเวลา ให้ลดแขนลงแล้วเริ่มใหม่
        globals.isLeftExtended = false;
        globals.isLeftHolding = false;
        globals.leftHoldStartTime = 0;
        globals.leftHoldNotified = false;
        leftCorrectAngleStartTime = 0;
        
        // รีเซ็ตตัวแสดงเวลาค้างแขน
        if (angleDisplayCreated) {
          AngleDisplay.updateHoldTimer(0, REQUIRED_HOLD_TIME, false, false, false);
        }
        
        globals.statusElement.textContent = `ลดแขนซ้ายเร็วเกินไป ต้องค้างไว้ ${REQUIRED_HOLD_TIME} วินาที`;
        globals.statusElement.style.color = "#FF5252";
      }
    }

    // ตรวจจับแขนขวา - เหมือนกับแขนซ้าย
    if (isRightAngleCorrect && !globals.isRightExtended && timeSinceLastCount > globals.autoCooldown) {
      // เพิ่มเงื่อนไขตรวจสอบลำตัวตรง
      if (!isBodyPostureCorrect) {
        const currentTime = Date.now();
        if (!bodyLeanWarningShown || (currentTime - lastBodyLeanWarningTime > BODY_LEAN_WARNING_COOLDOWN)) {
          globals.statusElement.textContent = `ลำตัวเอียงเกินไป กรุณายืนให้ตรง`;
          globals.statusElement.style.color = "#FF5252";
          
          if (window.voiceFeedbackEnabled) {
            import('./exercise-tracker.js').then(module => {
              module.exerciseTracker.speakFeedback("ลำตัวเอียงเกินไป");
            });
          }
          bodyLeanWarningShown = true;
          lastBodyLeanWarningTime = currentTime;
        }
        return;
      }
      
      // ตรวจสอบว่าข้อศอกตรงหรือไม่
      if (!isRightElbowStraight) {
        if (!rightElbowBendWarningShown) {
          globals.statusElement.textContent = "ข้อศอกขวางอเกินไป ควรเหยียดให้ตรง";
          globals.statusElement.style.color = "#FF5252";
          
          if (window.voiceFeedbackEnabled) {
            import('./exercise-tracker.js').then(module => {
              module.exerciseTracker.speakFeedback("ข้อศอกขวางอเกินไp ควรเหยียดให้ตรง");
            });
          }
          rightElbowBendWarningShown = true;
        }
        return;
      }
      
      // รีเซ็ตตัวแปรแจ้งเตือน
      rightElbowBendWarningShown = false;
      bodyLeanWarningShown = false;
      
      // ผู้ใช้เริ่มยกแขนขวาในมุมที่ถูกต้อง
      utils.debugLog("เริ่มยกแขนขวาในมุมที่ถูกต้อง");
      globals.isRightExtended = true;
      globals.isRightHolding = true;
      globals.rightHoldStartTime = now;
      rightCorrectAngleStartTime = now;
      
      globals.statusElement.textContent = `กำลังยกแขนขวา (${smoothedRightAngle.toFixed(1)}°) ค้างไว้ ${REQUIRED_HOLD_TIME} วินาที`;
      globals.statusElement.style.color = "#FFA000";
      
      if (window.voiceFeedbackEnabled) {
        import('./exercise-tracker.js').then(module => {
          module.exerciseTracker.speakFeedback(`ยกแขนขวา มุม ${Math.round(smoothedRightAngle)} องศา ค้างไว้ ${REQUIRED_HOLD_TIME} วินาที`);
        });
      }
    } 
    // ตรวจสอบแขนขวาที่กำลังค้าง
    else if (globals.isRightExtended && globals.isRightHolding) {
      // ตรวจสอบลำตัวตรงระหว่างค้าง
      if (!isBodyPostureCorrect) {
        globals.statusElement.textContent = `ลำตัวเอียงเกินไป การนับเวลาถูกยกเลิก`;
        globals.statusElement.style.color = "#FF5252";
        
        // ยกเลิกการนับเวลา
        globals.isRightHolding = false;
        globals.isRightExtended = false;
        globals.rightHoldStartTime = 0;
        rightCorrectAngleStartTime = 0;
        
        // รีเซ็ตตัวแสดงเวลาค้างแขน
        if (angleDisplayCreated) {
          AngleDisplay.updateHoldTimer(0, REQUIRED_HOLD_TIME, false, false, false);
        }
        
        if (window.voiceFeedbackEnabled) {
          import('./exercise-tracker.js').then(module => {
            module.exerciseTracker.speakFeedback("ลำตัวเอียงเกินไป");
          });
        }
        return;
      }
      
      // ตรวจสอบว่าข้อศอกยังตรงอยู่หรือไม่
      if (!isRightElbowStraight) {
        globals.statusElement.textContent = "ข้อศอกขวางอเกินไป การนับเวลาถูกยกเลิก";
        globals.statusElement.style.color = "#FF5252";
        
        // ยกเลิกการนับเวลา
        globals.isRightHolding = false;
        globals.isRightExtended = false;
        globals.rightHoldStartTime = 0;
        rightCorrectAngleStartTime = 0;
        
        // รีเซ็ตตัวแสดงเวลาค้างแขน
        if (angleDisplayCreated) {
          AngleDisplay.updateHoldTimer(0, REQUIRED_HOLD_TIME, false, false, false);
        }
        
        if (window.voiceFeedbackEnabled) {
          import('./exercise-tracker.js').then(module => {
            module.exerciseTracker.speakFeedback("ข้อศอกขวางอเกินไป การนับเวลาถูกยกเลิก");
          });
        }
        return;
      }
      
      // ตรวจสอบมุมที่กำลังค้าง
      if (isRightAngleCorrect) {
        // หากมุมถูกต้อง ให้นับเวลาการค้าง
        if (rightCorrectAngleStartTime === 0) {
          rightCorrectAngleStartTime = now;
        }
        
        // คำนวณเวลาค้างที่มุมถูกต้อง
        rightArmHoldTime = (now - rightCorrectAngleStartTime) / 1000;
        
        // อัปเดตตัวแสดงเวลาค้างแขนขนาดใหญ่
        if (angleDisplayCreated) {
          AngleDisplay.updateHoldTimer(rightArmHoldTime, REQUIRED_HOLD_TIME, true, false, true);
        }
        
        // ตรวจสอบว่าค้างครบเวลาหรือไม่
        if (rightArmHoldTime >= REQUIRED_HOLD_TIME) {
          // ค้างครบเวลาแล้ว
          globals.isRightHolding = false;
          
          // อัปเดตตัวแสดงเวลา (ครบเวลาแล้ว)
          if (angleDisplayCreated) {
            AngleDisplay.updateHoldTimer(REQUIRED_HOLD_TIME, REQUIRED_HOLD_TIME, false, true, true);
          }
          
          globals.statusElement.textContent = `ค้างแขนขวาครบ ${REQUIRED_HOLD_TIME} วินาที แล้ว ลดแขนลงได้`;
          globals.statusElement.style.color = "#4CAF50";
          
          if (!globals.rightHoldNotified && window.voiceFeedbackEnabled) {
            globals.rightHoldNotified = true;
            import('./exercise-tracker.js').then(module => {
              module.exerciseTracker.speakFeedback(`ค้างแขนขวาครบ ${REQUIRED_HOLD_TIME} วินาที แล้ว ลดแขนลงได้`);
            });
          }
        } else {
          // กำลังค้าง แต่ยังไม่ครบเวลา
          globals.statusElement.textContent = `กำลังค้างแขนขวา ${rightArmHoldTime.toFixed(1)}/${REQUIRED_HOLD_TIME} วินาที (มุม ${smoothedRightAngle.toFixed(1)}°)`;
          globals.statusElement.style.color = "#FFA000";
        }
      } else {
        // มุมไม่ถูกต้อง แต่ยังกำลังค้างแขนอยู่
        rightCorrectAngleStartTime = 0;
        
        // อัปเดตตัวแสดงเวลาค้างแขน โดยใช้เวลาเดิม แต่กำหนด isAngleCorrect = false
        if (angleDisplayCreated) {
          AngleDisplay.updateHoldTimer(rightArmHoldTime, REQUIRED_HOLD_TIME, true, false, false);
        }
        
        // แสดงข้อความแนะนำให้ปรับมุม
        const angleStatus = getAngleStatus(smoothedRightAngle);
        let statusMessage = "";
        
        if (angleStatus === 'low') {
          statusMessage = `มุมแขนขวาต่ำเกินไป (${smoothedRightAngle.toFixed(1)}°) ควรยกให้สูงขึ้น`;
        } else {
          statusMessage = `มุมแขนขวาสูงเกินไป (${smoothedRightAngle.toFixed(1)}°) ควรลดมุมลง`;
        }
        
        globals.statusElement.textContent = statusMessage;
        globals.statusElement.style.color = "#FF5252";
      }
    }
    // ตรวจสอบการลดแขนขวากลับที่เดิม (หลังจากค้างครบเวลา)
    else if (!isRightAngleCorrect && globals.isRightExtended) {
      // ผู้ใช้ลดแขนลงแล้ว (มุมไม่อยู่ในช่วง 160-180 องศา)
      
      // ตรวจสอบว่าได้ค้างแขนครบเวลาหรือไม่
      if (globals.rightHoldStartTime > 0 && !globals.isRightHolding) {
        // นับการออกกำลังกาย 1 ครั้ง
        utils.debugLog("นับการยกแขนขวา 1 ครั้ง");
        
        globals.rightCounter++;
        globals.lastCountTime = now;
        globals.isRightExtended = false;
        globals.rightHoldStartTime = 0;
        globals.rightHoldNotified = false;
        rightCorrectAngleStartTime = 0;
        
        // แสดงผลการนับ
        globals.statusElement.textContent = `นับแขนขวา ${globals.rightCounter}/${globals.targetReps} ครั้ง!`;
        globals.statusElement.style.color = "#4CAF50";
        
        // แสดงเอฟเฟกต์การนับ
        utils.showCountEffect(false);
        
        // อัปเดตตัวนับ
        EventSystem.updateCounter({
          leftCounter: globals.leftCounter,
          rightCounter: globals.rightCounter,
          roundCounter: globals.roundCounter
        });
        
        // รีเซ็ตตัวแสดงเวลาค้างแขน
        if (angleDisplayCreated) {
          AngleDisplay.updateHoldTimer(0, REQUIRED_HOLD_TIME, false, false, false);
        }
        
        // เพิ่มเสียงบรรยาย
        if (window.voiceFeedbackEnabled) {
          import('./exercise-tracker.js').then(module => {
            module.exerciseTracker.speakFeedback(`นับแขนขวา ${globals.rightCounter} ครั้ง`);
          });
        }
        
        // ตรวจสอบการทำครบรอบ
        checkRoundCompletion();
      } else {
        // ไม่ได้ค้างครบเวลา ให้ลดแขนลงแล้วเริ่มใหม่
        globals.isRightExtended = false;
        globals.isRightHolding = false;
        globals.rightHoldStartTime = 0;
        globals.rightHoldNotified = false;
        rightCorrectAngleStartTime = 0;
        
        // รีเซ็ตตัวแสดงเวลาค้างแขน
        if (angleDisplayCreated) {
          AngleDisplay.updateHoldTimer(0, REQUIRED_HOLD_TIME, false, false, false);
        }
        
        globals.statusElement.textContent = `ลดแขนขวาเร็วเกินไป ต้องค้างไว้ ${REQUIRED_HOLD_TIME} วินาที`;
        globals.statusElement.style.color = "#FF5252";
      }
    }
  }

  try {
    globals.canvasCtx.restore();
  } catch (error) {
    utils.debugLog("เกิดข้อผิดพลาดใน canvasCtx.restore():", error);
  }
}

/**
 * ตรวจสอบการทำครบรอบ
 */
function checkRoundCompletion() {
  if (globals.leftCounter >= globals.targetReps && globals.rightCounter >= globals.targetReps) {
    // เพิ่มตัวนับรอบ
    globals.roundCounter++;
     
     // แสดงผลการทำครบรอบ
     globals.statusElement.textContent = `ทำครบรอบที่ ${globals.roundCounter} แล้ว! (${globals.leftCounter}/${globals.targetReps} ซ้าย, ${globals.rightCounter}/${globals.targetReps} ขวา)`;
     globals.statusElement.style.color = "#4CAF50";
     
     // บันทึกการออกกำลังกาย
     EventSystem.roundCompleted(
       globals.currentExercise,
       1,
       globals.leftCounter,
       globals.rightCounter
     );
     
     // บรรยายผลสำเร็จ
     if (window.voiceFeedbackEnabled) {
       import('./exercise-tracker.js').then(module => {
         module.exerciseTracker.speakFeedback(`ทำครบรอบที่ ${globals.roundCounter} แล้ว! แขนซ้าย ${globals.leftCounter} ครั้ง แขนขวา ${globals.rightCounter} ครั้ง`);
       }).catch(err => {
         console.error("ไม่สามารถโหลดโมดูล exercise-tracker:", err);
       });
     }
     
     // รีเซ็ตตัวนับของแต่ละแขน เริ่มรอบใหม่
     if (globals.autoCountEnabled) {
       setTimeout(() => {
         globals.leftCounter = 0;
         globals.rightCounter = 0;
         
         // รีเซ็ตตัวนับเวลาค้างแขน
         if (angleDisplayCreated) {
           AngleDisplay.updateHoldTimer(0, REQUIRED_HOLD_TIME, false, false, false);
         }
         
         // ส่งอีเวนต์ให้อัปเดตตัวแสดงผล
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
       }, 3000); // รอ 3 วินาทีก่อนเริ่มรอบใหม่
     }
   }
}

// รีเซ็ตตัวแปรที่เกี่ยวข้องกับการตรวจจับ
function resetDetection() {
   // รีเซ็ตตัวแปรการแสดงมุม
   angleDisplayCreated = false;
   
   // รีเซ็ตตัวแปรการค้างแขน
   leftArmHoldTime = 0;
   rightArmHoldTime = 0;
   leftCorrectAngleStartTime = 0;
   rightCorrectAngleStartTime = 0;
   
   // รีเซ็ตตัวแปรแจ้งเตือน
   leftElbowBendWarningShown = false;
   rightElbowBendWarningShown = false;
   bodyLeanWarningShown = false;
   lastBodyLeanWarningTime = 0;
   
   // รีเซ็ตตัวแปรการ smoothing
   previousLeftArmData = null;
   previousRightArmData = null;
}

// ส่งออกฟังก์ชัน
export { 
   detectOverheadPressExercise,
   checkRoundCompletion,
   resetDetection,
   checkBodyLean,
   calculateArmOverheadAngle,
   drawBodyLeanIndicator
};