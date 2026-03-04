// improved-exercise2.js - เพิ่มการตรวจสอบลำตัวตรง
// ท่ายกขาด้านข้าง (Side Leg Raise) - ปรับปรุงการแสดงผลแบบ MediaPipe Style

import { globals } from './main.js';
import { utils } from './utils.js';
import { HoldTimer } from './hold-timer.js';
import { EventSystem } from './event-system.js';
import { AngleDisplay } from './angle-display.js';


// ค่าคงที่สำหรับช่วงมุมที่ถูกต้อง
const MIN_ANGLE = 30; // องศาขั้นต่ำ
const MAX_ANGLE = 45; // องศาสูงสุด
const REQUIRED_HOLD_TIME = 3; // เวลาที่ต้องค้าง (วินาที)
const MIN_KNEE_ANGLE = 160; // องศาเข่าขั้นต่ำที่ถือว่าขาตรง

// *** เพิ่มค่าคงที่สำหรับการตรวจสอบลำตัวตรง ***
const MAX_BODY_TILT_ANGLE = 15; // มุมเอียงสูงสุดของลำตัวที่ยอมรับได้ (องศา)
const MIN_TORSO_STRAIGHTNESS = 0.85; // ค่าความตรงขั้นต่ำของลำตัว (0-1)

// ตัวแปรสำหรับการติดตามสถานะ
let angleDisplayCreated = false;
let leftLegHoldTime = 0;
let rightLegHoldTime = 0;

// *** เพิ่มตัวแปรสำหรับจับเวลาการออกกำลังกาย ***
let exerciseStartTime = 0; // เวลาเริ่มต้นการออกกำลังกาย
let roundStartTime = 0; // เวลาเริ่มต้นรอบปัจจุบัน

// ตัวแปรสำหรับการติดตามเวลาเริ่มต้นการค้างขาที่ถูกต้อง
let leftCorrectAngleStartTime = 0;
let rightCorrectAngleStartTime = 0;

// ตัวแปรสำหรับการติดตามสถานะแจ้งเตือนการงอเข่า
let leftKneeBendWarningShown = false;
let rightKneeBendWarningShown = false;

// *** เพิ่มตัวแปรสำหรับการติดตามลำตัวเอียง ***
let bodyTiltWarningShown = false;
let lastBodyTiltWarningTime = 0;
const BODY_TILT_WARNING_COOLDOWN = 3000; // 3 วินาทีระหว่างการแจ้งเตือน

// ตัวแปรสำหรับติดตามสถานะการแสดงผลมุม
let angleArcDisplayed = false;

// เพิ่มตัวแปรควบคุมความเรียบของเส้น
const SMOOTHING_FACTOR = 0.7;
let previousLeftLegData = null;
let previousRightLegData = null;

// ค่าคงที่สำหรับการแสดงผลแลนด์มาร์ค
const LANDMARK_STYLES = {
  CORRECT_COLOR: 'rgba(76, 175, 80, 0.9)',
  LOW_ANGLE_COLOR: 'rgba(255, 193, 7, 0.9)',
  HIGH_ANGLE_COLOR: 'rgba(255, 82, 82, 0.9)',
  CONNECTOR_COLOR: 'rgba(255, 255, 255, 0.7)',
  // *** เพิ่มสีสำหรับการแจ้งเตือนลำตัวเอียง ***
  BODY_TILT_COLOR: 'rgba(255, 152, 0, 0.9)', // สีส้มสำหรับแจ้งเตือนลำตัวเอียง

  BASE_LANDMARK_SIZE: 8,
  BASE_LINE_WIDTH: 3,
  ANGLE_BG_COLOR: 'rgba(0, 0, 0, 0.7)',
  TEXT_COLOR: 'white',
  GLOW_COLOR: 'rgba(255, 255, 255, 0.6)'
};

// *** เพิ่มฟังก์ชันตรวจสอบลำตัวตรง ***
/**
 * คำนวณมุมเอียงของลำตัว
 * @param {Object} leftShoulder จุดไหล่ซ้าย {x, y}
 * @param {Object} rightShoulder จุดไหล่ขวา {x, y}
 * @param {Object} leftHip จุดสะโพกซ้าย {x, y}
 * @param {Object} rightHip จุดสะโพกขวา {x, y}
 * @returns {Object} ข้อมูลการเอียงของลำตัว { angle, isStraight, tiltDirection }
 */
function calculateBodyTilt(leftShoulder, rightShoulder, leftHip, rightHip) {
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

  // คำนวณมุมจากแนวตั้ง
  let tiltAngle = Math.atan2(Math.abs(deltaX), Math.abs(deltaY)) * (180 / Math.PI);

  // กำหนดทิศทางการเอียง
  let tiltDirection = 'center';
  if (Math.abs(deltaX) > 5) { // มีการเอียงที่มีนัยสำคัญ
    tiltDirection = deltaX > 0 ? 'right' : 'left';
  }

  // ตรวจสอบว่าลำตัวตรงหรือไม่
  const isStraight = tiltAngle <= MAX_BODY_TILT_ANGLE;

  return {
    angle: tiltAngle,
    isStraight: isStraight,
    tiltDirection: tiltDirection,
    deltaX: deltaX,
    deltaY: deltaY
  };
}

/**
 * ตรวจสอบความตรงของลำตัวโดยใช้หลายจุดอ้างอิง
 * @param {Array} landmarks จุดสำคัญของร่างกาย
 * @returns {Object} ข้อมูลความตรงของลำตัว
 */
function checkBodyStraightness(landmarks) {
  // ดึงจุดสำคัญของลำตัว
  const leftShoulder = landmarks[11];
  const rightShoulder = landmarks[12];
  const leftHip = landmarks[23];
  const rightHip = landmarks[24];

  // ตรวจสอบว่ามีจุดสำคัญครบหรือไม่
  if (!leftShoulder || !rightShoulder || !leftHip || !rightHip) {
    return {
      isStraight: false,
      reason: 'ไม่สามารถตรวจจับจุดสำคัญของลำตัวได้',
      angle: 0,
      tiltDirection: 'unknown'
    };
  }

  // แปลงเป็นพิกัดพิกเซล
  const leftShoulderPx = {
    x: leftShoulder.x * globals.canvasElement.width,
    y: leftShoulder.y * globals.canvasElement.height
  };

  const rightShoulderPx = {
    x: rightShoulder.x * globals.canvasElement.width,
    y: rightShoulder.y * globals.canvasElement.height
  };

  const leftHipPx = {
    x: leftHip.x * globals.canvasElement.width,
    y: leftHip.y * globals.canvasElement.height
  };

  const rightHipPx = {
    x: rightHip.x * globals.canvasElement.width,
    y: rightHip.y * globals.canvasElement.height
  };

  // คำนวณการเอียงของลำตัว
  const bodyTilt = calculateBodyTilt(leftShoulderPx, rightShoulderPx, leftHipPx, rightHipPx);

  let reason = '';
  if (!bodyTilt.isStraight) {
    if (bodyTilt.tiltDirection === 'left') {
      reason = `ลำตัวเอียงไปทางซ้าย ${bodyTilt.angle.toFixed(1)}°`;
    } else if (bodyTilt.tiltDirection === 'right') {
      reason = `ลำตัวเอียงไปทางขวา ${bodyTilt.angle.toFixed(1)}°`;
    } else {
      reason = `ลำตัวเอียง ${bodyTilt.angle.toFixed(1)}°`;
    }
  }

  return {
    isStraight: bodyTilt.isStraight,
    reason: reason,
    angle: bodyTilt.angle,
    tiltDirection: bodyTilt.tiltDirection,
    shoulderCenter: {
      x: (leftShoulderPx.x + rightShoulderPx.x) / 2,
      y: (leftShoulderPx.y + rightShoulderPx.y) / 2
    },
    hipCenter: {
      x: (leftHipPx.x + rightHipPx.x) / 2,
      y: (leftHipPx.y + rightHipPx.y) / 2
    }
  };
}

// คัดลอกฟังก์ชันที่จำเป็นจากโค้ดเดิม
function calculateLegAbductionAngle(hip, knee) {
  const deltaX = knee.x - hip.x;
  const deltaY = knee.y - hip.y;
  let angleRad = Math.atan2(deltaX, deltaY);
  let angleDeg = (angleRad * 180) / Math.PI;
  angleDeg = Math.abs(angleDeg);
  return angleDeg;
}

function isAngleInCorrectRange(angle) {
  return angle >= MIN_ANGLE && angle <= MAX_ANGLE;
}

function getAngleStatus(angle) {
  if (angle < MIN_ANGLE) return 'low';
  if (angle > MAX_ANGLE) return 'high';
  return 'correct';
}

function getAngleStatusInfo(angle, minAngle = 30, maxAngle = 45) {
  let status, color, message;

  if (angle < minAngle) {
    status = 'low';
    color = LANDMARK_STYLES.LOW_ANGLE_COLOR;
    message = 'ยกขาเพิ่ม';
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

function adjustColor(color, factor) {
  const rgba = color.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([.\d]+)\)/);
  if (!rgba) return color;

  const r = Math.floor(parseInt(rgba[1]) * factor);
  const g = Math.floor(parseInt(rgba[2]) * factor);
  const b = Math.floor(parseInt(rgba[3]) * factor);
  const a = parseFloat(rgba[4]);

  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

function drawHintInfo(ctx, position, text, color, scaleFactor) {
  ctx.save();

  const fontSize = 14 * scaleFactor;
  ctx.font = `${fontSize}px Arial`;

  const textWidth = ctx.measureText(text).width;
  const padding = 6 * scaleFactor;
  const boxWidth = textWidth + (padding * 2);
  const boxHeight = fontSize + (padding * 1.2);

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
  ctx.shadowOffsetX = 1 * scaleFactor;
  ctx.shadowOffsetY = 1 * scaleFactor;

  ctx.fillStyle = color.replace(/[^,]+(?=\))/, '0.7');
  ctx.fill();

  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  ctx.fillStyle = LANDMARK_STYLES.TEXT_COLOR;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, position.x, position.y);

  ctx.restore();
}

// *** เพิ่มฟังก์ชันวาดการแสดงผลลำตัวเอียง ***
/**
 * วาดแสดงสถานะลำตัวเอียง
 * @param {Object} ctx คอนเท็กซ์ของแคนวาส
 * @param {Object} bodyCheck ผลการตรวจสอบลำตัว
 * @param {number} scaleFactor ปัจจัยการปรับขนาด
 */
function drawBodyTiltIndicator(ctx, bodyCheck, scaleFactor) {
  if (!bodyCheck.shoulderCenter || !bodyCheck.hipCenter) return;

  ctx.save();

  // วาดเส้นแกนลำตัว
  ctx.beginPath();
  ctx.moveTo(bodyCheck.shoulderCenter.x, bodyCheck.shoulderCenter.y);
  ctx.lineTo(bodyCheck.hipCenter.x, bodyCheck.hipCenter.y);

  // เลือกสีตามสถานะ
  if (bodyCheck.isStraight) {
    ctx.strokeStyle = LANDMARK_STYLES.CORRECT_COLOR;
    ctx.lineWidth = 4 * scaleFactor;
  } else {
    ctx.strokeStyle = LANDMARK_STYLES.BODY_TILT_COLOR;
    ctx.lineWidth = 6 * scaleFactor;

    // เพิ่มเอฟเฟกต์เรืองแสงเมื่อเอียง
    ctx.shadowColor = LANDMARK_STYLES.BODY_TILT_COLOR;
    ctx.shadowBlur = 10 * scaleFactor;
  }

  ctx.lineCap = 'round';
  ctx.stroke();

  // วาดจุดที่จุดกึ่งกลาง
  const centerX = (bodyCheck.shoulderCenter.x + bodyCheck.hipCenter.x) / 2;
  const centerY = (bodyCheck.shoulderCenter.y + bodyCheck.hipCenter.y) / 2;

  ctx.beginPath();
  ctx.arc(centerX, centerY, 8 * scaleFactor, 0, 2 * Math.PI);
  ctx.fillStyle = bodyCheck.isStraight ? LANDMARK_STYLES.CORRECT_COLOR : LANDMARK_STYLES.BODY_TILT_COLOR;
  ctx.fill();

  // วาดขอบจุด
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 2 * scaleFactor;
  ctx.stroke();

  // แสดงข้อความแจ้งเตือนถ้าลำตัวเอียง
  if (!bodyCheck.isStraight) {
    const warningPos = {
      x: centerX,
      y: centerY - 40 * scaleFactor
    };

    drawHintInfo(
      ctx,
      warningPos,
      bodyCheck.reason,
      LANDMARK_STYLES.BODY_TILT_COLOR,
      scaleFactor
    );
  }

  ctx.restore();
}

/**
 * ฟังก์ชันตรวจจับท่ายกขาด้านข้าง (Exercise 2)
 * @param {Array} landmarks จุดสำคัญของร่างกาย
 */
function detectSideLegRaiseExercise(landmarks) {
  improvedDetectSideLegRaiseExercise(landmarks);
}

/**
 * ปรับปรุงฟังก์ชันตรวจจับท่ายกขาด้านข้าง - เพิ่มการตรวจสอบลำตัวตรง
 * @param {Array} landmarks จุดสำคัญของร่างกาย
 */
function improvedDetectSideLegRaiseExercise(landmarks) {
  // บันทึกตำแหน่งทุกเฟรม
  if (window.PositionTracker) {
    window.PositionTracker.recordPosition(landmarks);
  }

  // *** เริ่มจับเวลาเมื่อเริ่มออกกำลังกาย ***
  if (exerciseStartTime === 0) {
    exerciseStartTime = Date.now();
    roundStartTime = Date.now();
    console.log("เริ่มจับเวลาการออกกำลังกาย:", new Date(exerciseStartTime).toLocaleTimeString());
  }

  // ... รหัสการตรวจจับท่าทางอื่นๆ


  utils.debugLog("ทำงานใน improvedDetectSideLegRaiseExercise");

  // สร้างแถบวัดมุมถ้ายังไม่มี
  if (!angleDisplayCreated) {
    const webcamContainer = document.getElementById('webcamContainer');
    if (webcamContainer) {
      AngleDisplay.createAngleGauge(webcamContainer);
      angleDisplayCreated = true;
    }
  }

  // ดึงจุดสำคัญสำหรับท่ายกขาด้านข้าง
  const leftHip = landmarks[23];
  const rightHip = landmarks[24];
  const leftKnee = landmarks[25];
  const rightKnee = landmarks[26];
  const leftAnkle = landmarks[27];
  const rightAnkle = landmarks[28];

  // ตรวจสอบจุดสำคัญ
  if (!leftHip || !rightHip || !leftKnee || !rightKnee || !leftAnkle || !rightAnkle) {
    utils.debugLog("จุดสำคัญบางจุดไม่ถูกตรวจพบ");
    return;
  }

  // *** เพิ่มการตรวจสอบลำตัวตรง ***
  const bodyCheck = checkBodyStraightness(landmarks);
  const isBodyStraight = bodyCheck.isStraight;

  // แปลงเป็นพิกัดพิกเซล
  let leftHipX = leftHip.x * globals.canvasElement.width;
  let rightHipX = rightHip.x * globals.canvasElement.width;
  let leftKneeX = leftKnee.x * globals.canvasElement.width;
  let rightKneeX = rightKnee.x * globals.canvasElement.width;
  let leftAnkleX = leftAnkle.x * globals.canvasElement.width;
  let rightAnkleX = rightAnkle.x * globals.canvasElement.width;

  let leftHipY = leftHip.y * globals.canvasElement.height;
  let rightHipY = rightHip.y * globals.canvasElement.height;
  let leftKneeY = leftKnee.y * globals.canvasElement.height;
  let rightKneeY = rightKnee.y * globals.canvasElement.height;
  let leftAnkleY = leftAnkle.y * globals.canvasElement.height;
  let rightAnkleY = rightAnkle.y * globals.canvasElement.height;

  // คำนวณมุมเข่า
  const leftKneeAngle = utils.calculateAngle(
    leftHipX, leftHipY,
    leftKneeX, leftKneeY,
    leftAnkleX, leftAnkleY
  );

  const rightKneeAngle = utils.calculateAngle(
    rightHipX, rightHipY,
    rightKneeX, rightKneeY,
    rightAnkleX, rightAnkleY
  );

  // คำนวณมุมการยกขาด้านข้าง
  const leftLegAbductionAngle = calculateLegAbductionAngle(
    { x: leftHipX, y: leftHipY },
    { x: leftKneeX, y: leftKneeY }
  );

  const rightLegAbductionAngle = calculateLegAbductionAngle(
    { x: rightHipX, y: rightHipY },
    { x: rightKneeX, y: rightKneeY }
  );

  // ทำ smoothing ค่ามุม
  let smoothedLeftAngle = leftLegAbductionAngle;
  let smoothedRightAngle = rightLegAbductionAngle;

  // สร้างข้อมูลขาปัจจุบัน
  const currentLeftLegData = {
    angle: leftLegAbductionAngle,
    hip: { x: leftHipX, y: leftHipY },
    knee: { x: leftKneeX, y: leftKneeY },
    ankle: { x: leftAnkleX, y: leftAnkleY }
  };

  const currentRightLegData = {
    angle: rightLegAbductionAngle,
    hip: { x: rightHipX, y: rightHipY },
    knee: { x: rightKneeX, y: rightKneeY },
    ankle: { x: rightAnkleX, y: rightAnkleY }
  };

  // ทำ smoothing สำหรับข้อมูลขาซ้าย
  if (previousLeftLegData) {
    smoothedLeftAngle = previousLeftLegData.angle * SMOOTHING_FACTOR +
      leftLegAbductionAngle * (1 - SMOOTHING_FACTOR);

    currentLeftLegData.hip.x = previousLeftLegData.hip.x * SMOOTHING_FACTOR +
      leftHipX * (1 - SMOOTHING_FACTOR);
    currentLeftLegData.hip.y = previousLeftLegData.hip.y * SMOOTHING_FACTOR +
      leftHipY * (1 - SMOOTHING_FACTOR);

    currentLeftLegData.knee.x = previousLeftLegData.knee.x * SMOOTHING_FACTOR +
      leftKneeX * (1 - SMOOTHING_FACTOR);
    currentLeftLegData.knee.y = previousLeftLegData.knee.y * SMOOTHING_FACTOR +
      leftKneeY * (1 - SMOOTHING_FACTOR);

    currentLeftLegData.ankle.x = previousLeftLegData.ankle.x * SMOOTHING_FACTOR +
      leftAnkleX * (1 - SMOOTHING_FACTOR);
    currentLeftLegData.ankle.y = previousLeftLegData.ankle.y * SMOOTHING_FACTOR +
      leftAnkleY * (1 - SMOOTHING_FACTOR);
  }

  // ทำ smoothing สำหรับข้อมูลขาขวา
  if (previousRightLegData) {
    smoothedRightAngle = previousRightLegData.angle * SMOOTHING_FACTOR +
      rightLegAbductionAngle * (1 - SMOOTHING_FACTOR);

    currentRightLegData.hip.x = previousRightLegData.hip.x * SMOOTHING_FACTOR +
      rightHipX * (1 - SMOOTHING_FACTOR);
    currentRightLegData.hip.y = previousRightLegData.hip.y * SMOOTHING_FACTOR +
      rightHipY * (1 - SMOOTHING_FACTOR);

    currentRightLegData.knee.x = previousRightLegData.knee.x * SMOOTHING_FACTOR +
      rightKneeX * (1 - SMOOTHING_FACTOR);
    currentRightLegData.knee.y = previousRightLegData.knee.y * SMOOTHING_FACTOR +
      rightKneeY * (1 - SMOOTHING_FACTOR);

    currentRightLegData.ankle.x = previousRightLegData.ankle.x * SMOOTHING_FACTOR +
      rightAnkleX * (1 - SMOOTHING_FACTOR);
    currentRightLegData.ankle.y = previousRightLegData.ankle.y * SMOOTHING_FACTOR +
      rightAnkleY * (1 - SMOOTHING_FACTOR);
  }

  // บันทึกข้อมูลปัจจุบันสำหรับใช้ในรอบถัดไป
  currentLeftLegData.angle = smoothedLeftAngle;
  currentRightLegData.angle = smoothedRightAngle;
  previousLeftLegData = currentLeftLegData;
  previousRightLegData = currentRightLegData;

  // ตรวจสอบว่ามุมอยู่ในช่วงที่ถูกต้องหรือไม่
  const isLeftAngleCorrect = isAngleInCorrectRange(smoothedLeftAngle);
  const isRightAngleCorrect = isAngleInCorrectRange(smoothedRightAngle);

  // อัปเดตแถบวัดมุม
  if (angleDisplayCreated) {
    AngleDisplay.updateAngleGauge('left', smoothedLeftAngle, isLeftAngleCorrect);
    AngleDisplay.updateAngleGauge('right', smoothedRightAngle, isRightAngleCorrect);
  }

  // ตรวจสอบว่าขาเหยียดตรงหรือไม่
  const isLeftLegStraight = leftKneeAngle > MIN_KNEE_ANGLE;
  const isRightLegStraight = rightKneeAngle > MIN_KNEE_ANGLE;

  // แสดงข้อมูลบนหน้าจอ
  try {
    globals.canvasCtx.save();
    globals.canvasCtx.font = "16px Arial";
    globals.canvasCtx.fillStyle = "white";

    // แสดงตัวนับ
    globals.canvasCtx.fillText(`ซ้าย: ${globals.leftCounter}/${globals.targetReps}`, currentLeftLegData.knee.x, currentLeftLegData.knee.y - 60);
    globals.canvasCtx.fillText(`ขวา: ${globals.rightCounter}/${globals.targetReps}`, currentRightLegData.knee.x, currentRightLegData.knee.y - 60);

    // *** วาดแสดงสถานะลำตัวเอียง ***
    const scaleFactor = Math.min(globals.canvasElement.width, globals.canvasElement.height) / 640;
    drawBodyTiltIndicator(globals.canvasCtx, bodyCheck, scaleFactor);

    // แสดงการแจ้งเตือนเมื่อเข่างอ 
    if (!isLeftLegStraight) {
      const warningPos = {
        x: currentLeftLegData.knee.x,
        y: currentLeftLegData.knee.y - 90
      };
      drawHintInfo(
        globals.canvasCtx,
        warningPos,
        "เข่าซ้ายงอ! ควรเหยียดเข่าให้ตรง",
        LANDMARK_STYLES.HIGH_ANGLE_COLOR,
        scaleFactor
      );
    }

    if (!isRightLegStraight) {
      const warningPos = {
        x: currentRightLegData.knee.x,
        y: currentRightLegData.knee.y - 90
      };
      drawHintInfo(
        globals.canvasCtx,
        warningPos,
        "เข่าขวางอ! ควรเหยียดเข่าให้ตรง",
        LANDMARK_STYLES.HIGH_ANGLE_COLOR,
        scaleFactor
      );
    }

    globals.canvasCtx.fillStyle = "white";
  } catch (error) {
    utils.debugLog("เกิดข้อผิดพลาดในการวาด canvas:", error);
  }

  // สร้าง baseSamples ถ้ายังไม่มี
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
      leftLegAbductionAngle: smoothedLeftAngle,
      rightLegAbductionAngle: smoothedRightAngle
    });

    globals.canvasCtx.fillText(`กำลังเก็บตัวอย่าง: ${window.baseSamples.length}/30`, 10, 60);

    if (window.baseSamples.length >= 30) {
      window.calibrated = true;
      globals.statusElement.textContent = "พร้อมนับแล้ว เริ่มออกกำลังกายได้";
      globals.statusElement.style.color = "#4CAF50";
      utils.hideCalibrationIndicator();
    }
  }

  // *** ปรับปรุงการตรวจจับให้รวมการตรวจสอบลำตัวตรง ***
  if (window.calibrated) {
    const now = Date.now();
    const timeSinceLastCount = now - globals.lastCountTime;

    // *** เพิ่มการตรวจสอบลำตัวตรงในการนับ ***

    // ตรวจจับขาซ้าย
    if (isLeftAngleCorrect && !globals.isLeftExtended && timeSinceLastCount > globals.autoCooldown) {
      // *** เพิ่มเงื่อนไขตรวจสอบลำตัวตรง ***
      if (!isBodyStraight) {
        // แจ้งเตือนเรื่องลำตัวเอียง
        const currentTime = Date.now();
        if (!bodyTiltWarningShown || (currentTime - lastBodyTiltWarningTime > BODY_TILT_WARNING_COOLDOWN)) {
          globals.statusElement.textContent = `${bodyCheck.reason} กรุณายืนให้ลำตัวตรง`;
          globals.statusElement.style.color = "#FF5252";

          if (window.voiceFeedbackEnabled) {
            import('./exercise-tracker.js').then(module => {
              module.exerciseTracker.speakFeedback("ลำตัวเอียงเกินไป");
            });
          }
          bodyTiltWarningShown = true;
          lastBodyTiltWarningTime = currentTime;
        }
        return; // ไม่นับถ้าลำตัวเอียง
      }

      // ตรวจสอบว่าเข่าตรงหรือไม่
      if (!isLeftLegStraight) {
        // แจ้งเตือนเรื่องการงอเข่า
        if (!leftKneeBendWarningShown) {
          globals.statusElement.textContent = "เข่าซ้ายงอเกินไป ควรเหยียดเข่าให้ตรง";
          globals.statusElement.style.color = "#FF5252";

          if (window.voiceFeedbackEnabled) {
            import('./exercise-tracker.js').then(module => {
              module.exerciseTracker.speakFeedback("เข่าซ้ายงอเกินไป ควรเหยียดเข่าให้ตรง");
            });
          }
          leftKneeBendWarningShown = true;
        }
        return; // ไม่นับถ้าเข่างอ
      }

      // รีเซ็ตตัวแปรแจ้งเตือน
      leftKneeBendWarningShown = false;
      bodyTiltWarningShown = false;

      // ผู้ใช้เริ่มยกขาซ้ายในมุมที่ถูกต้อง เข่าตรง และลำตัวตรง
      utils.debugLog("เริ่มยกขาซ้ายในมุมที่ถูกต้อง");
      globals.isLeftExtended = true;
      globals.isLeftHolding = true;
      globals.leftHoldStartTime = now;
      leftCorrectAngleStartTime = now;

      globals.statusElement.textContent = `กำลังยกขาซ้าย (${smoothedLeftAngle.toFixed(1)}°) ค้างไว้ ${REQUIRED_HOLD_TIME} วินาที`;
      globals.statusElement.style.color = "#FFA000";

      if (window.voiceFeedbackEnabled) {
        import('./exercise-tracker.js').then(module => {
          module.exerciseTracker.speakFeedback(`ยกขาซ้าย มุม ${Math.round(smoothedLeftAngle)} องศา ค้างไว้ ${REQUIRED_HOLD_TIME} วินาที`);
        });
      }
    }
    // ตรวจสอบขาซ้ายที่กำลังค้าง
    else if (globals.isLeftExtended && globals.isLeftHolding) {
      // *** เพิ่มการตรวจสอบลำตัวตรงระหว่างค้าง ***
      if (!isBodyStraight) {
        // แจ้งเตือนเรื่องลำตัวเอียงระหว่างค้าง
        globals.statusElement.textContent = `${bodyCheck.reason} การนับเวลาถูกยกเลิก`;
        globals.statusElement.style.color = "#FF5252";

        // ยกเลิกการนับเวลา
        globals.isLeftHolding = false;
        globals.isLeftExtended = false;
        globals.leftHoldStartTime = 0;
        leftCorrectAngleStartTime = 0;

        // รีเซ็ตตัวแสดงเวลาค้างขา
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

      // ตรวจสอบว่าเข่ายังตรงอยู่หรือไม่
      if (!isLeftLegStraight) {
        // แจ้งเตือนเรื่องการงอเข่าระหว่างค้าง
        globals.statusElement.textContent = "เข่าซ้ายงอเกินไป การนับเวลาถูกยกเลิก";
        globals.statusElement.style.color = "#FF5252";

        // ยกเลิกการนับเวลา
        globals.isLeftHolding = false;
        globals.isLeftExtended = false;
        globals.leftHoldStartTime = 0;
        leftCorrectAngleStartTime = 0;

        // รีเซ็ตตัวแสดงเวลาค้างขา
        if (angleDisplayCreated) {
          AngleDisplay.updateHoldTimer(0, REQUIRED_HOLD_TIME, false, false, false);
        }

        if (window.voiceFeedbackEnabled) {
          import('./exercise-tracker.js').then(module => {
            module.exerciseTracker.speakFeedback("เข่าซ้ายงอเกินไป การนับเวลาถูกยกเลิก");
          });
        }
        return;
      }

      // ตรวจสอบมุมที่กำลังค้าง
      if (isLeftAngleCorrect) {
        // หากมุมถูกต้อง ให้นับเวลาการค้าง
        if (leftCorrectAngleStartTime === 0) {
          // ถ้าเพิ่งกลับมาอยู่ในมุมที่ถูกต้อง ให้เริ่มนับเวลาใหม่
          leftCorrectAngleStartTime = now;
        }

        // คำนวณเวลาค้างที่มุมถูกต้อง
        leftLegHoldTime = (now - leftCorrectAngleStartTime) / 1000;

        // อัปเดตตัวแสดงเวลาค้างขาขนาดใหญ่
        if (angleDisplayCreated) {
          AngleDisplay.updateHoldTimer(leftLegHoldTime, REQUIRED_HOLD_TIME, true, false, true);
        }

        // ตรวจสอบว่าค้างครบเวลาหรือไม่
        if (leftLegHoldTime >= REQUIRED_HOLD_TIME) {
          // ค้างครบเวลาแล้ว
          globals.isLeftHolding = false;

          // อัปเดตตัวแสดงเวลา (ครบเวลาแล้ว)
          if (angleDisplayCreated) {
            AngleDisplay.updateHoldTimer(REQUIRED_HOLD_TIME, REQUIRED_HOLD_TIME, false, true, true);
          }

          globals.statusElement.textContent = `ค้างขาซ้ายครบ ${REQUIRED_HOLD_TIME} วินาที แล้ว วางขาลงได้`;
          globals.statusElement.style.color = "#4CAF50";

          if (!globals.leftHoldNotified && window.voiceFeedbackEnabled) {
            globals.leftHoldNotified = true;
            import('./exercise-tracker.js').then(module => {
              module.exerciseTracker.speakFeedback(`ค้างขาซ้ายครบ ${REQUIRED_HOLD_TIME} วินาที แล้ว วางขาลงได้`);
            });
          }
        } else {
          // กำลังค้าง แต่ยังไม่ครบเวลา
          globals.statusElement.textContent = `กำลังค้างขาซ้าย ${leftLegHoldTime.toFixed(1)}/${REQUIRED_HOLD_TIME} วินาที (มุม ${smoothedLeftAngle.toFixed(1)}°)`;
          globals.statusElement.style.color = "#FFA000";
        }
      } else {
        // มุมไม่ถูกต้อง แต่ยังกำลังค้างขาอยู่
        leftCorrectAngleStartTime = 0;

        // อัปเดตตัวแสดงเวลาค้างขา โดยใช้เวลาเดิม แต่กำหนด isAngleCorrect = false
        if (angleDisplayCreated) {
          AngleDisplay.updateHoldTimer(leftLegHoldTime, REQUIRED_HOLD_TIME, true, false, false);
        }

        // แสดงข้อความแนะนำให้ปรับมุม
        const angleStatus = getAngleStatus(smoothedLeftAngle);
        let statusMessage = "";

        if (angleStatus === 'low') {
          statusMessage = `มุมขาซ้ายต่ำเกินไป (${smoothedLeftAngle.toFixed(1)}°) ควรยกให้สูงขึ้น`;
        } else {
          statusMessage = `มุมขาซ้ายสูงเกินไป (${smoothedLeftAngle.toFixed(1)}°) ควรลดมุมลง`;
        }

        globals.statusElement.textContent = statusMessage;
        globals.statusElement.style.color = "#FF5252";
      }
    }
    // ตรวจสอบการวางขาซ้ายกลับที่เดิม (หลังจากค้างครบเวลา)
    else if (!isLeftAngleCorrect && globals.isLeftExtended) {
      // ผู้ใช้วางขาลงแล้ว (มุมไม่อยู่ในช่วง 30-45 องศา)

      // ตรวจสอบว่าได้ค้างขาครบเวลาหรือไม่
      if (globals.leftHoldStartTime > 0 && !globals.isLeftHolding) {
        // นับการออกกำลังกาย 1 ครั้ง
        utils.debugLog("นับการยกขาซ้าย 1 ครั้ง");

        globals.setLeftCounter(globals.leftCounter + 1);
        globals.lastCountTime = now;
        globals.isLeftExtended = false;
        globals.leftHoldStartTime = 0;
        globals.leftHoldNotified = false;
        leftCorrectAngleStartTime = 0;

        // แสดงผลการนับ
        globals.statusElement.textContent = `นับขาซ้าย ${globals.leftCounter}/${globals.targetReps} ครั้ง!`;
        globals.statusElement.style.color = "#4CAF50";

        // แสดงเอฟเฟกต์การนับ
        utils.showCountEffect(true);

        // อัปเดตตัวนับ พร้อมพิมพ์ข้อมูลสำหรับตรวจสอบ
        console.log("Dispatching updateCounter event - Left:", globals.leftCounter, "Right:", globals.rightCounter);
        EventSystem.updateCounter({
          leftCounter: globals.leftCounter,
          rightCounter: globals.rightCounter,
          roundCounter: globals.roundCounter,
          targetReps: globals.targetReps
        });

        // รีเซ็ตตัวแสดงเวลาค้างขา
        if (angleDisplayCreated) {
          AngleDisplay.updateHoldTimer(0, REQUIRED_HOLD_TIME, false, false, false);
        }

        // เพิ่มเสียงบรรยาย
        if (window.voiceFeedbackEnabled) {
          import('./exercise-tracker.js').then(module => {
            module.exerciseTracker.speakFeedback(`นับขาซ้าย ${globals.leftCounter} ครั้ง`);
          });
        }

        // ตรวจสอบการทำครบรอบ
        checkRoundCompletion();
      } else {
        // ไม่ได้ค้างครบเวลา ให้วางขาลงแล้วเริ่มใหม่
        globals.isLeftExtended = false;
        globals.isLeftHolding = false;
        globals.leftHoldStartTime = 0;
        globals.leftHoldNotified = false;
        leftCorrectAngleStartTime = 0;

        // รีเซ็ตตัวแสดงเวลาค้างขา
        if (angleDisplayCreated) {
          AngleDisplay.updateHoldTimer(0, REQUIRED_HOLD_TIME, false, false, false);
        }

        globals.statusElement.textContent = `วางขาซ้ายเร็วเกินไป ต้องค้างไว้ ${REQUIRED_HOLD_TIME} วินาที`;
        globals.statusElement.style.color = "#FF5252";
      }
    }

    // *** ตรวจจับขาขวา - เพิ่มการตรวจสอบลำตัวตรงเช่นเดียวกัน ***
    if (isRightAngleCorrect && !globals.isRightExtended && timeSinceLastCount > globals.autoCooldown) {
      // *** เพิ่มเงื่อนไขตรวจสอบลำตัวตรง ***
      if (!isBodyStraight) {
        // แจ้งเตือนเรื่องลำตัวเอียง
        const currentTime = Date.now();
        if (!bodyTiltWarningShown || (currentTime - lastBodyTiltWarningTime > BODY_TILT_WARNING_COOLDOWN)) {
          globals.statusElement.textContent = `${bodyCheck.reason} กรุณายืนให้ลำตัวตรง`;
          globals.statusElement.style.color = "#FF5252";

          if (window.voiceFeedbackEnabled) {
            import('./exercise-tracker.js').then(module => {
              module.exerciseTracker.speakFeedback("ลำตัวเอียงเกินไป");
            });
          }
          bodyTiltWarningShown = true;
          lastBodyTiltWarningTime = currentTime;
        }
        return; // ไม่นับถ้าลำตัวเอียง
      }

      // ตรวจสอบว่าเข่าตรงหรือไม่
      if (!isRightLegStraight) {
        // แจ้งเตือนเรื่องการงอเข่า
        if (!rightKneeBendWarningShown) {
          globals.statusElement.textContent = "เข่าขวางอเกินไป ควรเหยียดเข่าให้ตรง";
          globals.statusElement.style.color = "#FF5252";

          if (window.voiceFeedbackEnabled) {
            import('./exercise-tracker.js').then(module => {
              module.exerciseTracker.speakFeedback("เข่าขวางอเกินไป ควรเหยียดเข่าให้ตรง");
            });
          }
          rightKneeBendWarningShown = true;
        }
        return; // ไม่นับถ้าเข่างอ
      }

      // รีเซ็ตตัวแปรแจ้งเตือน
      rightKneeBendWarningShown = false;
      bodyTiltWarningShown = false;

      // ผู้ใช้เริ่มยกขาขวาในมุมที่ถูกต้อง เข่าตรง และลำตัวตรง
      utils.debugLog("เริ่มยกขาขวาในมุมที่ถูกต้อง");
      globals.isRightExtended = true;
      globals.isRightHolding = true;
      globals.rightHoldStartTime = now;
      rightCorrectAngleStartTime = now;

      globals.statusElement.textContent = `กำลังยกขาขวา (${smoothedRightAngle.toFixed(1)}°) ค้างไว้ ${REQUIRED_HOLD_TIME} วินาที`;
      globals.statusElement.style.color = "#FFA000";

      if (window.voiceFeedbackEnabled) {
        import('./exercise-tracker.js').then(module => {
          module.exerciseTracker.speakFeedback(`ยกขาขวา มุม ${Math.round(smoothedRightAngle)} องศา ค้างไว้ ${REQUIRED_HOLD_TIME} วินาที`);
        });
      }
    }
    // ตรวจสอบขาขวาที่กำลังค้าง
    else if (globals.isRightExtended && globals.isRightHolding) {
      // *** เพิ่มการตรวจสอบลำตัวตรงระหว่างค้าง ***
      if (!isBodyStraight) {
        // แจ้งเตือนเรื่องลำตัวเอียงระหว่างค้าง
        globals.statusElement.textContent = `${bodyCheck.reason} การนับเวลาถูกยกเลิก`;
        globals.statusElement.style.color = "#FF5252";

        // ยกเลิกการนับเวลา
        globals.isRightHolding = false;
        globals.isRightExtended = false;
        globals.rightHoldStartTime = 0;
        rightCorrectAngleStartTime = 0;

        // รีเซ็ตตัวแสดงเวลาค้างขา
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

      // ตรวจสอบว่าเข่ายังตรงอยู่หรือไม่
      if (!isRightLegStraight) {
        // แจ้งเตือนเรื่องการงอเข่าระหว่างค้าง
        globals.statusElement.textContent = "เข่าขวางอเกินไป การนับเวลาถูกยกเลิก";
        globals.statusElement.style.color = "#FF5252";

        // ยกเลิกการนับเวลา
        globals.isRightHolding = false;
        globals.isRightExtended = false;
        globals.rightHoldStartTime = 0;
        rightCorrectAngleStartTime = 0;

        // รีเซ็ตตัวแสดงเวลาค้างขา
        if (angleDisplayCreated) {
          AngleDisplay.updateHoldTimer(0, REQUIRED_HOLD_TIME, false, false, false);
        }

        if (window.voiceFeedbackEnabled) {
          import('./exercise-tracker.js').then(module => {
            module.exerciseTracker.speakFeedback("เข่าขวางอเกินไป การนับเวลาถูกยกเลิก");
          });
        }
        return;
      }

      // ตรวจสอบมุมที่กำลังค้าง
      if (isRightAngleCorrect) {
        // หากมุมถูกต้อง ให้นับเวลาการค้าง
        if (rightCorrectAngleStartTime === 0) {
          // ถ้าเพิ่งกลับมาอยู่ในมุมที่ถูกต้อง ให้เริ่มนับเวลาใหม่
          rightCorrectAngleStartTime = now;
        }

        // คำนวณเวลาค้างที่มุมถูกต้อง
        rightLegHoldTime = (now - rightCorrectAngleStartTime) / 1000;

        // อัปเดตตัวแสดงเวลาค้างขาขนาดใหญ่
        if (angleDisplayCreated) {
          AngleDisplay.updateHoldTimer(rightLegHoldTime, REQUIRED_HOLD_TIME, true, false, true);
        }

        // ตรวจสอบว่าค้างครบเวลาหรือไม่
        if (rightLegHoldTime >= REQUIRED_HOLD_TIME) {
          // ค้างครบเวลาแล้ว
          globals.isRightHolding = false;

          // อัปเดตตัวแสดงเวลา (ครบเวลาแล้ว)
          if (angleDisplayCreated) {
            AngleDisplay.updateHoldTimer(REQUIRED_HOLD_TIME, REQUIRED_HOLD_TIME, false, true, true);
          }

          globals.statusElement.textContent = `ค้างขาขวาครบ ${REQUIRED_HOLD_TIME} วินาที แล้ว วางขาลงได้`;
          globals.statusElement.style.color = "#4CAF50";

          if (!globals.rightHoldNotified && window.voiceFeedbackEnabled) {
            globals.rightHoldNotified = true;
            import('./exercise-tracker.js').then(module => {
              module.exerciseTracker.speakFeedback(`ค้างขาขวาครบ ${REQUIRED_HOLD_TIME} วินาที แล้ว วางขาลงได้`);
            });
          }
        } else {
          // กำลังค้าง แต่ยังไม่ครบเวลา
          globals.statusElement.textContent = `กำลังค้างขาขวา ${rightLegHoldTime.toFixed(1)}/${REQUIRED_HOLD_TIME} วินาที (มุม ${smoothedRightAngle.toFixed(1)}°)`;
          globals.statusElement.style.color = "#FFA000";
        }
      } else {
        // มุมไม่ถูกต้อง แต่ยังกำลังค้างขาอยู่
        rightCorrectAngleStartTime = 0;

        // อัปเดตตัวแสดงเวลาค้างขา โดยใช้เวลาเดิม แต่กำหนด isAngleCorrect = false
        if (angleDisplayCreated) {
          AngleDisplay.updateHoldTimer(rightLegHoldTime, REQUIRED_HOLD_TIME, true, false, false);
        }

        // แสดงข้อความแนะนำให้ปรับมุม
        const angleStatus = getAngleStatus(smoothedRightAngle);
        let statusMessage = "";

        if (angleStatus === 'low') {
          statusMessage = `มุมขาขวาต่ำเกินไป (${smoothedRightAngle.toFixed(1)}°) ควรยกให้สูงขึ้น`;
        } else {
          statusMessage = `มุมขาขวาสูงเกินไป (${smoothedRightAngle.toFixed(1)}°) ควรลดมุมลง`;
        }

        globals.statusElement.textContent = statusMessage;
        globals.statusElement.style.color = "#FF5252";
      }
    }
    // ตรวจสอบการวางขาขวากลับที่เดิม (หลังจากค้างครบเวลา)
    else if (!isRightAngleCorrect && globals.isRightExtended) {
      // ผู้ใช้วางขาลงแล้ว (มุมไม่อยู่ในช่วง 30-45 องศา)

      // ตรวจสอบว่าได้ค้างขาครบเวลาหรือไม่
      if (globals.rightHoldStartTime > 0 && !globals.isRightHolding) {
        // นับการออกกำลังกาย 1 ครั้ง
        utils.debugLog("นับการยกขาขวา 1 ครั้ง");

        globals.setRightCounter(globals.rightCounter + 1);
        globals.lastCountTime = now;
        globals.isRightExtended = false;
        globals.rightHoldStartTime = 0;
        globals.rightHoldNotified = false;
        rightCorrectAngleStartTime = 0;

        // แสดงผลการนับ
        globals.statusElement.textContent = `นับขาขวา ${globals.rightCounter}/${globals.targetReps} ครั้ง!`;
        globals.statusElement.style.color = "#4CAF50";

        // แสดงเอฟเฟกต์การนับ
        utils.showCountEffect(false);

        // อัปเดตตัวนับ พร้อมพิมพ์ข้อมูลสำหรับตรวจสอบ
        console.log("Dispatching updateCounter event - Left:", globals.leftCounter, "Right:", globals.rightCounter);
        EventSystem.updateCounter({
          leftCounter: globals.leftCounter,
          rightCounter: globals.rightCounter,
          roundCounter: globals.roundCounter,
          targetReps: globals.targetReps
        });

        // รีเซ็ตตัวแสดงเวลาค้างขา
        if (angleDisplayCreated) {
          AngleDisplay.updateHoldTimer(0, REQUIRED_HOLD_TIME, false, false, false);
        }

        // เพิ่มเสียงบรรยาย
        if (window.voiceFeedbackEnabled) {
          import('./exercise-tracker.js').then(module => {
            module.exerciseTracker.speakFeedback(`นับขาขวา ${globals.rightCounter} ครั้ง`);
          });
        }

        // ตรวจสอบการทำครบรอบ
        checkRoundCompletion();
      } else {
        // ไม่ได้ค้างครบเวลา ให้วางขาลงแล้วเริ่มใหม่
        globals.isRightExtended = false;
        globals.isRightHolding = false;
        globals.rightHoldStartTime = 0;
        globals.rightHoldNotified = false;
        rightCorrectAngleStartTime = 0;

        // รีเซ็ตตัวแสดงเวลาค้างขา
        if (angleDisplayCreated) {
          AngleDisplay.updateHoldTimer(0, REQUIRED_HOLD_TIME, false, false, false);
        }

        globals.statusElement.textContent = `วางขาขวาเร็วเกินไป ต้องค้างไว้ ${REQUIRED_HOLD_TIME} วินาที`;
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
    // คำนวณระยะเวลาที่ใช้ในรอบนี้
    const currentTime = Date.now();
    const roundDuration = Math.floor((currentTime - roundStartTime) / 1000); // วินาที
    
    console.log("=== การคำนวณระยะเวลา ===");
    console.log("roundStartTime:", roundStartTime, new Date(roundStartTime).toLocaleTimeString());
    console.log("currentTime:", currentTime, new Date(currentTime).toLocaleTimeString());
    console.log("roundDuration (seconds):", roundDuration);
    console.log("========================");
    
    // เพิ่มตัวนับรอบ
    globals.setRoundCounter(globals.roundCounter + 1);

    // แสดงผลการทำครบรอบ
    globals.statusElement.textContent = `ทำครบรอบที่ ${globals.roundCounter} แล้ว! (${globals.leftCounter}/${globals.targetReps} ซ้าย, ${globals.rightCounter}/${globals.targetReps} ขวา)`;
    globals.statusElement.style.color = "#4CAF50";

    // บันทึกการออกกำลังกาย พร้อมระยะเวลา
    EventSystem.roundCompleted(
      globals.currentExercise,
      1,
      globals.leftCounter,
      globals.rightCounter,
      roundDuration
    );

    // บรรยายผลสำเร็จ
    if (window.voiceFeedbackEnabled) {
      import('./exercise-tracker.js').then(module => {
        module.exerciseTracker.speakFeedback(`ทำครบรอบที่ ${globals.roundCounter} แล้ว! ขาซ้าย ${globals.leftCounter} ครั้ง ขาขวา ${globals.rightCounter} ครั้ง`);
      }).catch(err => {
        console.error("ไม่สามารถโหลดโมดูล exercise-tracker:", err);
      });
    }

    // รีเซ็ตตัวนับของแต่ละขา เริ่มรอบใหม่
    if (globals.autoCountEnabled) {
      setTimeout(() => {
        console.log("Resetting counters for new round");
        globals.setLeftCounter(0);
        globals.setRightCounter(0);
        
        // อัปเดต window variables
        window.leftCounter = 0;
        window.rightCounter = 0;
        
        // *** รีเซ็ตเวลาเริ่มต้นรอบใหม่ ***
        roundStartTime = Date.now();
        console.log("รีเซ็ตเวลาเริ่มรอบใหม่:", new Date(roundStartTime).toLocaleTimeString());

        // รีเซ็ตตัวนับเวลาค้างขา
        if (angleDisplayCreated) {
          AngleDisplay.updateHoldTimer(0, REQUIRED_HOLD_TIME, false, false, false);
        }

        // ส่งอีเวนต์ให้อัปเดตตัวแสดงผล
        console.log("Dispatching updateCounter event - Reset for new round");
        EventSystem.updateCounter({
          leftCounter: 0,
          rightCounter: 0,
          roundCounter: globals.roundCounter,
          targetReps: globals.targetReps
        });

        globals.statusElement.textContent = `เริ่มรอบที่ ${globals.roundCounter + 1}`;
        globals.statusElement.style.color = "#2196F3";

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

  // รีเซ็ตตัวแปรการค้างขา
  leftLegHoldTime = 0;
  rightLegHoldTime = 0;
  leftCorrectAngleStartTime = 0;
  rightCorrectAngleStartTime = 0;

  // รีเซ็ตตัวแปรแจ้งเตือน
  leftKneeBendWarningShown = false;
  rightKneeBendWarningShown = false;

  // *** รีเซ็ตตัวแปรลำตัวเอียง ***
  bodyTiltWarningShown = false;
  lastBodyTiltWarningTime = 0;

  // รีเซ็ตตัวแปรการ smoothing
  previousLeftLegData = null;
  previousRightLegData = null;

  // รีเซ็ตสถานะการแสดงผลมุม
  angleArcDisplayed = false;
  
  // *** รีเซ็ตเวลาการออกกำลังกาย ***
  exerciseStartTime = 0;
  roundStartTime = 0;
}

export {
  detectSideLegRaiseExercise,
  improvedDetectSideLegRaiseExercise,
  checkRoundCompletion,
  resetDetection,
  // *** เพิ่มฟังก์ชันใหม่ ***
  checkBodyStraightness,
  calculateBodyTilt,
  drawBodyTiltIndicator
};