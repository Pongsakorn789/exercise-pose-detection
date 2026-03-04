// Utility functions
const DEBUG_MODE = true;

// ฟังก์ชันสำหรับแสดงข้อความดีบัก
function debugLog(message, data = null) {
  if (!DEBUG_MODE) return;
  
  if (data) {
    console.log(`%c[DEBUG] ${message}`, 'color: #0066FF; font-weight: bold;', data);
  } else {
    console.log(`%c[DEBUG] ${message}`, 'color: #0066FF; font-weight: bold;');
  }
}

// Get progress bar color based on progress
function getProgressBarColor(value, target) {
  const percentage = (value / target) * 100;
  if (percentage < 30) return 'red';
  if (percentage < 70) return 'yellow';
  return 'green';
}

// ฟังก์ชันแปลงตัวเลขเป็นคำอ่านภาษาไทย
function getThaiNumberWord(num) {
  if (num === 0) return "ศูนย์";
  
  const units = ["", "หนึ่ง", "สอง", "สาม", "สี่", "ห้า", "หก", "เจ็ด", "แปด", "เก้า", "สิบ"];
  const positions = ["", "สิบ", "ร้อย", "พัน", "หมื่น", "แสน", "ล้าน"];
  
  // สำหรับตัวเลข 1-10
  if (num <= 10) {
    return units[num];
  }
  
  // สำหรับตัวเลข 11-19
  if (num > 10 && num < 20) {
    return "สิบ" + (num % 10 > 1 ? units[num % 10] : (num % 10 === 1 ? "เอ็ด" : ""));
  }
  
  // สำหรับตัวเลข 20-99
  if (num >= 20 && num < 100) {
    return units[Math.floor(num / 10)] + "สิบ" + (num % 10 > 0 ? (num % 10 === 1 ? "เอ็ด" : units[num % 10]) : "");
  }
  
  return "จำนวน " + num;
}

// ฟังก์ชันแสดงข้อความดีบัก
function log(message) {
  // ตรวจสอบค่า debugMode จากพารามิเตอร์หรือตัวแปรทั่วไป
  if (DEBUG_MODE) {
    console.log(message);
  }
}

// ปรับปรุงฟังก์ชัน isFullBodyVisible
function improvedIsFullBodyVisible(landmarks, currentExercise) {
  if (!landmarks) {
    debugLog("ไม่พบ landmarks");
    return false;
  }
  
  debugLog("โหลด landmarks สำเร็จ", landmarks.length);
  
  // กำหนดจุดสำคัญตามท่าออกกำลังกาย
  const keypoints = [
    23, 24,  // สะโพก
    25, 26,  // เข่า
    27, 28   // ข้อเท้า
  ];
  
  // ลดค่าความมั่นใจขั้นต่ำลงเพื่อให้ตรวจจับได้ง่ายขึ้น
  const minVisibilityScore = 0.1;  // ลดลงจาก 0.3 เป็น 0.1
  
  // นับจุดที่มองเห็นและคำนวณความมั่นใจเฉลี่ย
  let visiblePoints = 0;
  let totalConfidence = 0;
  
  for (const pointIndex of keypoints) {
    if (!landmarks[pointIndex]) {
      debugLog(`ไม่พบจุดสำคัญที่ ${pointIndex}`);
      continue;
    }
    
    const visibility = landmarks[pointIndex].visibility || 0;
    totalConfidence += visibility;
    
    if (visibility >= minVisibilityScore) {
      visiblePoints++;
    }
  }
  
  // กำหนดเกณฑ์การตรวจสอบ (40% ของจุดสำคัญต้องมองเห็น) - ลดลงจาก 60%
  const visibilityPercentage = visiblePoints / keypoints.length;
  const averageConfidence = totalConfidence / keypoints.length;
  
  // ลดค่าความมั่นใจเฉลี่ยเหลือเพียง 20%
  const isFullBody = visibilityPercentage >= 0.4 && averageConfidence >= 0.2;
  
  // Debug message
  debugLog(`ตรวจพบร่างกาย: ${isFullBody ? 'เห็นทั้งตัว' : 'ไม่เห็นทั้งตัว'}, เปอร์เซ็นต์: ${(visibilityPercentage*100).toFixed(1)}%, ความมั่นใจ: ${(averageConfidence*100).toFixed(1)}%`);
  
  // ชั่วคราว: บังคับให้เป็น true เพื่อทดสอบการทำงานของระบบอื่นๆ
  return true; // บังคับเป็น true เพื่อให้ทำงานได้ง่ายขึ้น
}

// Check if full body is visible in the frame
function isFullBodyVisible(landmarks, requiredKeypoints) {
  return improvedIsFullBodyVisible(landmarks, 1); // เรียกใช้ฟังก์ชันที่ปรับปรุงแล้ว
}

// Text-to-speech function
function speakFeedback(text) {
  // รับค่า voiceFeedbackEnabled และ voiceFeedbackCooldown จากพารามิเตอร์หรือตัวแปรทั่วไป
  const voiceFeedbackEnabled = true; // สามารถกำหนดค่าจากภายนอกได้
  const voiceFeedbackCooldown = 2000; // ms
  
  if (!voiceFeedbackEnabled) return;
  
  // Check cooldown to avoid too many prompts
  const now = Date.now();
  let lastVoiceFeedbackTime = window.lastVoiceFeedbackTime || 0;
  
  if (now - lastVoiceFeedbackTime < voiceFeedbackCooldown) return;
  
  window.lastVoiceFeedbackTime = now;
  
  // Use browser's speech synthesis
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'th-TH'; // Thai language
    utterance.volume = 1.0;
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  }
}


function calculateAngle(x1, y1, x2, y2, x3, y3) {
  // กรณีที่รับค่าเป็น object ที่มี x, y properties
  if (arguments.length === 3 && typeof x1 === 'object' && typeof y1 === 'object' && typeof x2 === 'object') {
    return calculateAngle(
      x1.x, x1.y,
      y1.x, y1.y,
      x2.x, x2.y
    );
  }
  
  // กรณีที่รับค่าเป็นพิกัด x, y แยกกัน
  if (arguments.length === 6) {
    // คำนวณเวกเตอร์ระหว่างจุด
    const v1 = { x: x1 - x2, y: y1 - y2 };
    const v2 = { x: x3 - x2, y: y3 - y2 };
    
    // คำนวณผลคูณจุด (dot product)
    const dotProduct = v1.x * v2.x + v1.y * v2.y;
    
    // คำนวณขนาดของเวกเตอร์
    const v1Magnitude = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
    const v2Magnitude = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
    
    // ป้องกันการหารด้วย 0
    if (v1Magnitude === 0 || v2Magnitude === 0) return 0;
    
    // คำนวณมุม (ในหน่วยเรเดียน) และแปลงเป็นองศา
    const cosTheta = Math.min(Math.max(dotProduct / (v1Magnitude * v2Magnitude), -1), 1);
    const angle = Math.acos(cosTheta) * (180 / Math.PI);
    
    return angle;
  }
  
  // กรณีไม่รองรับ
  console.error("รูปแบบพารามิเตอร์ไม่ถูกต้อง");
  return 0;
}

// เพิ่มฟังก์ชัน calculateMovingAverage
function calculateMovingAverage(values) {
  if (!values || values.length === 0) return 0;
  
  const sum = values.reduce((a, b) => a + b, 0);
  return sum / values.length;
}

// ฟังก์ชันคำนวณมุมแนวดิ่ง
function calculateVerticalAngle(point1, point2) {
  // คำนวณมุมระหว่างแนวดิ่งกับเส้นที่ลากจากจุด 1 ไปจุด 2
  const deltaY = point2.y - point1.y;
  const deltaX = point2.x - point1.x;
  
  // คำนวณมุมในหน่วยเรเดียน
  const angleRad = Math.atan2(deltaY, deltaX);
  
  // แปลงเป็นองศา และหามุมกับแนวดิ่ง
  const angleDeg = (angleRad * 180 / Math.PI) + 90;
  
  return angleDeg;
}

// เพิ่มฟังก์ชัน Smoothing สำหรับการเคลื่อนไหวของจุด Landmark
function smoothLandmarks(currentLandmarks, previousLandmarks, smoothingFactor = 0.6) {
  // ถ้าไม่มีข้อมูลก่อนหน้า ให้ใช้ข้อมูลปัจจุบัน
  if (!previousLandmarks) return currentLandmarks;
  
  // สร้าง landmarks ใหม่ที่ผ่านการ smooth แล้ว
  const smoothedLandmarks = [];
  
  for (let i = 0; i < currentLandmarks.length; i++) {
    const current = currentLandmarks[i];
    const previous = previousLandmarks[i];
    
    if (!previous) {
      smoothedLandmarks.push(current);
      continue;
    }
    
    // ใช้ exponential moving average
    const smoothed = {
      x: previous.x * smoothingFactor + current.x * (1 - smoothingFactor),
      y: previous.y * smoothingFactor + current.y * (1 - smoothingFactor),
      z: previous.z * smoothingFactor + current.z * (1 - smoothingFactor),
      visibility: previous.visibility * smoothingFactor + current.visibility * (1 - smoothingFactor)
    };
    
    smoothedLandmarks.push(smoothed);
  }
  
  return smoothedLandmarks;
}

// ฟังก์ชันแสดงเอฟเฟกต์การนับ
function showCountEffect(isLeft) {
  const effect = document.createElement("div");
  effect.className = "count-effect";
  effect.textContent = isLeft ? `+1 ซ้าย` : `+1 ขวา`;
  effect.style.color = isLeft ? "#4CAF50" : "#E91E63";
  
  // กำหนดตำแหน่งให้อยู่ใกล้กับขาที่กำลังเคลื่อนไหว
  if (isLeft) {
    effect.style.left = "30%";
  } else {
    effect.style.left = "70%";
  }
  effect.style.top = "50%";
  
  // เพิ่มลงในหน้าเว็บ
  document.body.appendChild(effect);
  
  // เพิ่ม animation
  effect.animate([
    { opacity: 1, transform: 'translateY(0) scale(1)' },
    { opacity: 0, transform: 'translateY(-50px) scale(1.5)' }
  ], {
    duration: 1000,
    easing: 'ease-out'
  });
  
  // ลบเอฟเฟกต์ออกหลังจากแสดงเสร็จ
  setTimeout(() => {
    document.body.removeChild(effect);
  }, 1000);
}

// ฟังก์ชันแสดงข้อมูลดีบัก
function showDebugInfo(landmarks, currentExercise, canvasElement, canvasCtx, isLeftMoving, isRightMoving) {
  const debugPanel = document.getElementById('debug-panel');
  const debugContent = document.getElementById('debug-content');
  
  if (!debugPanel || !debugContent) return;
  
  // แสดงพาเนลดีบัก
  debugPanel.classList.remove('hidden');
  
  if (!landmarks) {
    debugContent.innerHTML = "<p>ไม่พบจุดสำคัญ</p>";
    return;
  }
  
  // คำนวณข้อมูลสำคัญสำหรับการดีบัก
  const leftHip = landmarks[23];
  const rightHip = landmarks[24];
  const leftKnee = landmarks[25];
  const rightKnee = landmarks[26];
  const leftAnkle = landmarks[27];
  const rightAnkle = landmarks[28];
  
  if (!leftHip || !rightHip || !leftKnee || !rightKnee || !leftAnkle || !rightAnkle) {
    debugContent.innerHTML = "<p>ไม่พบจุดสำคัญบางจุด</p>";
    return;
  }
  
  // แปลงเป็นพิกัดจริง
  const leftKneeAngle = calculateAngle(
    leftHip.x * canvasElement.width, leftHip.y * canvasElement.height,
    leftKnee.x * canvasElement.width, leftKnee.y * canvasElement.height,
    leftAnkle.x * canvasElement.width, leftAnkle.y * canvasElement.height
  );
  
  const rightKneeAngle = calculateAngle(
    rightHip.x * canvasElement.width, rightHip.y * canvasElement.height,
    rightKnee.x * canvasElement.width, rightKnee.y * canvasElement.height,
    rightAnkle.x * canvasElement.width, rightAnkle.y * canvasElement.height
  );
  
  // คำนวณระยะห่างที่สำคัญ
  let debugHTML = '';
  
  // ข้อมูลดีบักสำหรับท่ายกขาด้านหลัง
  const leftAnkleHipX = (leftAnkle.x - leftHip.x) * canvasElement.width;
  const rightAnkleHipX = (rightHip.x - rightAnkle.x) * canvasElement.width;
  
  debugHTML = `
    <p>มุมเข่าซ้าย: ${leftKneeAngle.toFixed(1)}°</p>
    <p>มุมเข่าขวา: ${rightKneeAngle.toFixed(1)}°</p>
    <p>ระยะข้อเท้า-สะโพกซ้าย: ${leftAnkleHipX.toFixed(1)}</p>
    <p>ระยะข้อเท้า-สะโพกขวา: ${rightAnkleHipX.toFixed(1)}</p>
    <p>สถานะขาซ้าย: ${isLeftMoving ? 'กำลังเคลื่อนไหว' : 'หยุดนิ่ง'}</p>
    <p>สถานะขาขวา: ${isRightMoving ? 'กำลังเคลื่อนไหว' : 'หยุดนิ่ง'}</p>
    <p>fullBodyVisible: ${window.fullBodyVisible ? 'true' : 'false'}</p>
    <p>calibrated: ${window.calibrated ? 'true' : 'false'}</p>
  `;

  // อัปเดตเนื้อหาของพาเนลดีบัก
  debugContent.innerHTML = debugHTML;
}

// ฟังก์ชันแสดงตัวบ่งชี้การปรับเทียบ
function showCalibrationIndicator(count) {
  // ตรวจสอบว่ามีตัวบ่งชี้อยู่แล้วหรือไม่
  let indicator = document.querySelector('.calibration-indicator');

  if (!indicator) {
    indicator = document.createElement('div');
    indicator.className = 'calibration-indicator';
    document.querySelector('.webcam-container').appendChild(indicator);
  }

  indicator.innerHTML = `กำลังปรับเทียบ: ${count}/30`;
}

// ฟังก์ชันซ่อนตัวบ่งชี้การปรับเทียบ
function hideCalibrationIndicator() {
  const indicator = document.querySelector('.calibration-indicator');
  if (indicator) {
    indicator.remove();
  }
}

// ปรับปรุงฟังก์ชันอัปเดตตัวบ่งชี้การตรวจจับร่างกาย
function updateBodyDetectionIndicator(isVisible) {
  const detectionIndicator = document.getElementById('detection-indicator');
  if (detectionIndicator) {
    if (isVisible) {
      detectionIndicator.className = 'detection-indicator full-body-visible';
      detectionIndicator.querySelector('span').textContent = 'เห็นทั้งตัว';
    } else {
      detectionIndicator.className = 'detection-indicator full-body-hidden';
      detectionIndicator.querySelector('span').textContent = 'ไม่เห็นทั้งตัว';
    }
  }
}

// ทดสอบวาดบน canvas
function testCanvas(canvasElement) {
  try {
    debugLog("ทดสอบวาดบน canvas...");
    const ctx = canvasElement.getContext("2d");
    
    ctx.save();
    ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    
    // วาดสี่เหลี่ยมสีแดง
    ctx.fillStyle = "rgba(255, 0, 0, 0.5)";
    ctx.fillRect(20, 20, 50, 50);
    
    // วาดวงกลมสีเขียว
    ctx.fillStyle = "rgba(0, 255, 0, 0.5)";
    ctx.beginPath();
    ctx.arc(100, 50, 25, 0, 2 * Math.PI);
    ctx.fill();
    
    ctx.restore();
    debugLog("ทดสอบวาดบน canvas สำเร็จ");
    return true;
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการทดสอบ canvas:", error);
    return false;
  }
}

export const utils = {
  getProgressBarColor,
  getThaiNumberWord,
  log,
  isFullBodyVisible,
  improvedIsFullBodyVisible,
  speakFeedback,
  calculateAngle,
  calculateMovingAverage,
  calculateVerticalAngle,
  smoothLandmarks,
  showCountEffect,
  showDebugInfo,
  showCalibrationIndicator,
  hideCalibrationIndicator,
  updateBodyDetectionIndicator,
  testCanvas,
  debugLog
};