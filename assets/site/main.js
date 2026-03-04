// main.js - ปรับปรุงสำหรับท่ายกดัมเบลแบบยืน
// เพิ่มโหมดดีบัก
const DEBUG_MODE = true;

// เริ่มต้นโค้ดดั้งเดิม
import { PoseLandmarker, FilesetResolver, DrawingUtils } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/+esm";
import { detectStandingDumbbellExercise, checkRoundCompletion } from './standing-dumbbell-exercise.js';
import { utils } from './utils.js';
import { exerciseTracker } from './exercise-tracker.js';
import { EventSystem } from './event-system.js';
import { CounterDisplay } from './counter-display.js';
import { countdownSystem } from './countdown-system.js';
import { PositionTracker } from './enhanced-position-tracker.js';

// เริ่มต้นระบบบันทึกการออกกำลังกาย
const tracker = exerciseTracker.initialize();

// DOM Elements
const demosSection = document.getElementById("demos");
const video = document.getElementById("webcam");
const canvasElement = document.getElementById("output_canvas");
const canvasCtx = canvasElement.getContext("2d");
const positionDisplayElement = document.getElementById("position-display");
const statusElement = document.getElementById("status");
const resetButton = document.getElementById("resetButton");
const testCountButton = document.getElementById("testCountButton");
const summaryButton = document.getElementById("summaryButton");
const exerciseInstruction = document.getElementById("exercise-instruction");

// Initialize variables
let poseLandmarker = undefined;
let runningMode = "IMAGE";
let enableWebcamButton = document.getElementById("webcamButton");
let webcamRunning = false;
let drawingUtils = new DrawingUtils(canvasCtx);

// ตัวแปรควบคุมระบบนับถอยหลัง
let countdownInProgress = false;
let trackingEnabled = false; // ตัวแปรควบคุมการเริ่มตรวจจับท่าทาง

// เพิ่มตัวแปรเก็บผลการตรวจจับครั้งล่าสุด
let lastDetectedLandmarks = null;

// Exercise variables - เปลี่ยนเป็นท่ายกดัมเบลแบบยืน
window.currentExercise = 3; // เปลี่ยนเป็นท่ายกดัมเบลแบบยืน
window.leftCounter = 0;
window.rightCounter = 0;
window.roundCounter = 0;
window.targetReps = 10; // จำนวนครั้งเป้าหมายต่อข้าง

// เพิ่มตัวแปรสำหรับท่ายกดัมเบลแบบยืน
window.isLeftExtended = false;    // สถานะการยกแขนซ้าย
window.isRightExtended = false;   // สถานะการยกแขนขวา

// ตัวแปรสำหรับการค้างแขน
window.isLeftHolding = false;     // สถานะการค้างแขนซ้าย
window.isRightHolding = false;    // สถานะการค้างแขนขวา
window.leftHoldStartTime = 0;     // เวลาเริ่มค้างแขนซ้าย
window.rightHoldStartTime = 0;    // เวลาเริ่มค้างแขนขวา
window.leftHoldNotified = false;  // สถานะการแจ้งเตือนค้างแขนซ้ายครบ
window.rightHoldNotified = false; // สถานะการแจ้งเตือนค้างแขนขวาครบ
window.requiredHoldTime = 2;      // เวลาที่ต้องค้าง 2 วินาที

window.achievementShown = false;
window.sessionStartTime = null; // เริ่มต้นตัวแปรเก็บเวลาเริ่มเล่น
window.debugMode = true; // เปิดโหมดดีบัก

// Full body detection variables
window.fullBodyVisible = false;
// เปลี่ยน required keypoints จากขาเป็นแขน
window.requiredKeypoints = [
  // Torso
  0, 11, 12, 23, 24,
  // Arms (เปลี่ยนจาก Legs)
  11, 12, 13, 14, 15, 16
];

// Global variables to store base positions
window.basePositions = {};
window.calibrated = false;
window.baseSamples = [];
window.movementHistory = []; // ประวัติการเคลื่อนไหว
window.historySize = 10; // เก็บประวัติย้อนหลัง 10 เฟรม

// สำหรับเก็บจำนวนคู่ (pair) ที่นับไว้ล่าสุด เพื่อให้การนับรอบเป็นคู่ (ซ้าย+ขวา)
window.lastPairCount = 0;

// Variables for voice feedback
window.voiceFeedbackEnabled = true;
window.lastVoiceFeedbackTime = 0;
window.voiceFeedbackCooldown = 2000; // ms between voice prompts

// Auto-counting variables
window.autoCountEnabled = true;
window.autoCooldown = 800; // ระยะเวลาขั้นต่ำระหว่างการนับแต่ละครั้ง (มิลลิวินาที)
window.lastCountTime = 0;

// ตัวแปรสำหรับ main.js ที่ใช้ในตัวเอง
const currentExercise = window.currentExercise;
let leftCounter = window.leftCounter;
let rightCounter = window.rightCounter;
let roundCounter = window.roundCounter;
let targetReps = window.targetReps;
let isLeftExtended = window.isLeftExtended;
let isRightExtended = window.isRightExtended;
let isLeftHolding = window.isLeftHolding;
let isRightHolding = window.isRightHolding;
let leftHoldStartTime = window.leftHoldStartTime;
let rightHoldStartTime = window.rightHoldStartTime;
let leftHoldNotified = window.leftHoldNotified;
let rightHoldNotified = window.rightHoldNotified;
let requiredHoldTime = 2;  // แก้ไขเป็น 2 วินาที
let achievementShown = window.achievementShown;
let debugMode = window.debugMode;
let fullBodyVisible = window.fullBodyVisible;
let autoCountEnabled = window.autoCountEnabled;
let autoCooldown = window.autoCooldown;
let lastCountTime = window.lastCountTime;

// Export global variables for access by exercise modules
export const globals = {
  video,
  canvasElement,
  canvasCtx,
  statusElement,
  poseLandmarker,
  drawingUtils,
  lastDetectedLandmarks,
  currentExercise,
  leftCounter,
  rightCounter,
  roundCounter,
  targetReps,
  isLeftExtended,
  isRightExtended,
  // เพิ่มตัวแปรใหม่สำหรับการค้างแขน
  isLeftHolding,
  isRightHolding,
  leftHoldStartTime,
  rightHoldStartTime,
  leftHoldNotified,
  rightHoldNotified,
  requiredHoldTime: 2,    // แก้ไขเป็น 2 วินาที
  achievementShown,
  debugMode,
  fullBodyVisible,
  requiredKeypoints: window.requiredKeypoints,
  voiceFeedbackEnabled: window.voiceFeedbackEnabled,
  lastVoiceFeedbackTime: window.lastVoiceFeedbackTime,
  voiceFeedbackCooldown: window.voiceFeedbackCooldown,
  autoCountEnabled,
  autoCooldown,
  lastCountTime,

  // เพิ่มฟังก์ชันอัพเดตค่า เพื่อให้มั่นใจว่าการอัพเดตจะส่งผลถึงทั้ง window และ globals
  setLeftCounter: (value) => {
    leftCounter = value;
    window.leftCounter = value;
    globals.leftCounter = value;
  },
  setRightCounter: (value) => {
    rightCounter = value;
    window.rightCounter = value;
    globals.rightCounter = value;
  },
  setRoundCounter: (value) => {
    roundCounter = value;
    window.roundCounter = value;
    globals.roundCounter = value;
  }
};

// ฟังก์ชันดีบัก
function debugLog(message, data = null) {
  if (!DEBUG_MODE) return;

  if (data) {
    console.log(`%c[DEBUG] ${message}`, 'color: #0066FF; font-weight: bold;', data);
  } else {
    console.log(`%c[DEBUG] ${message}`, 'color: #0066FF; font-weight: bold;');
  }
}

// ปรับปรุงฟังก์ชันสร้างตัวนับให้ใช้ CounterDisplay
function createCounterDisplay() {
  // นำค่าจาก globals มาอัพเดต
  const state = {
    leftCounter: window.leftCounter,
    rightCounter: window.rightCounter,
    roundCounter: window.roundCounter,
    targetReps: window.targetReps,
    currentExercise: window.currentExercise
  };

  // เรียกใช้ระบบใหม่
  CounterDisplay.createCounterDisplay(currentExercise, state);
}

// ปรับปรุงฟังก์ชันอัพเดตตัวนับให้ใช้ CounterDisplay
function updateCounter() {
  const state = {
    leftCounter: window.leftCounter,
    rightCounter: window.rightCounter,
    roundCounter: window.roundCounter,
    targetReps: window.targetReps,
    currentExercise: window.currentExercise
  };

  // นำค่าปัจจุบันไปอัพเดต
  CounterDisplay.updateCounterDisplay(state);
}

// Add exercise target achievement animation
function createAchievementAnimation() {
  const animationContainer = document.createElement("div");
  animationContainer.id = "achievement-animation";

  const achievementText = document.createElement("div");
  achievementText.id = "achievement-text";
  achievementText.textContent = "เยี่ยมมาก!";

  // เปลี่ยนข้อความจากขาเป็นแขน
  const achievementMessage = `คุณทำครบ ${targetReps} ครั้งทั้งสองแขนแล้ว`;

  const achievementSubtext = document.createElement("div");
  achievementSubtext.id = "achievement-subtext";
  achievementSubtext.textContent = achievementMessage;

  const continueButton = document.createElement("button");
  continueButton.textContent = "ดำเนินการต่อ";
  continueButton.id = "continue-button";
  continueButton.className = "action-button";
  continueButton.addEventListener("click", () => {
    animationContainer.style.display = "none";

    // รีเซ็ตสถานะหลังจากปิดการแสดงผล
    setTimeout(() => {
      window.leftCounter = 0;
      window.rightCounter = 0;
      leftCounter = 0;
      rightCounter = 0;

      window.roundCounter++;
      roundCounter++;
      window.achievementShown = false;
      achievementShown = false;
      updateCounter();

      statusElement.textContent = `เริ่มรอบที่ ${roundCounter + 1}`;
      if (window.voiceFeedbackEnabled) {
        exerciseTracker.speakFeedback(`เริ่มรอบที่ ${roundCounter + 1}`);
      }
    }, 500);
  });

  animationContainer.appendChild(achievementText);
  animationContainer.appendChild(achievementSubtext);
  animationContainer.appendChild(continueButton);

  document.body.appendChild(animationContainer);
}

// Show achievement animation
function showAchievementAnimation() {
  const animation = document.getElementById("achievement-animation");
  if (!animation) {
    createAchievementAnimation();
    return;
  }

  const subtext = document.getElementById("achievement-subtext");
  if (subtext) {
    // เปลี่ยนข้อความจากขาเป็นแขน
    let achievementMessage = `คุณทำครบ ${targetReps} ครั้งทั้งสองแขนแล้ว`;
    subtext.textContent = achievementMessage;
  }

  animation.style.display = "flex";

  // บันทึกการออกกำลังกาย - ใช้ EventSystem
  EventSystem.roundCompleted(
    currentExercise,
    1,
    leftCounter,
    rightCounter,
    0
  );

  // Speak achievement
  if (window.voiceFeedbackEnabled) {
    // เปลี่ยนข้อความจากขาเป็นแขน
    exerciseTracker.speakFeedback(`เยี่ยมมาก! คุณทำได้ครบ ${targetReps} ครั้งทั้งสองแขนแล้ว`);
  }
}

// ฟังก์ชันปรับเทียบตำแหน่งพื้นฐาน
function calibrateBasePosition() {
  window.basePositions = {};
  window.calibrated = false;
  window.baseSamples = [];
  window.movementHistory = [];
  utils.debugLog("รีเซ็ตค่าเริ่มต้น รอการปรับเทียบใหม่");

  // แสดงคำแนะนำ
  statusElement.textContent = "กำลังปรับเทียบ... กรุณายืนตรง";
  statusElement.style.color = "#2196F3";

  // รีเซ็ตตัวนับ
  window.leftCounter = 0;
  window.rightCounter = 0;
  window.roundCounter = 0;
  window.lastPairCount = 0;
  window.isLeftExtended = false;
  window.isRightExtended = false;
  window.isLeftHolding = false;
  window.isRightHolding = false;
  window.leftHoldStartTime = 0;
  window.rightHoldStartTime = 0;
  window.achievementShown = false;

  leftCounter = 0;
  rightCounter = 0;
  roundCounter = 0;
  isLeftExtended = false;
  isRightExtended = false;
  isLeftHolding = false;
  isRightHolding = false;
  leftHoldStartTime = 0;
  rightHoldStartTime = 0;
  achievementShown = false;

  updateCounter();
}

// Initialize PoseLandmarker
const createPoseLandmarker = async () => {
  try {
    debugLog("กำลังโหลดโมเดล...");
    const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm");
    debugLog("โหลด vision module สำเร็จ:", vision);

    poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task`,
        delegate: "GPU"
      },
      runningMode: runningMode,
      numPoses: 1,
      // ปรับค่า confidence ให้ต่ำลงเพื่อให้ตรวจจับได้ง่ายขึ้น
      minPoseDetectionConfidence: 0.1,
      minPosePresenceConfidence: 0.1,
      minTrackingConfidence: 0.1
    });

    debugLog("สร้าง PoseLandmarker สำเร็จ:", poseLandmarker);
    demosSection.classList.remove("invisible");
    debugLog("โมเดลถูกโหลดสำเร็จ");

    // Create the counter display when the model is loaded
    createCounterDisplay();

    return true;
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการโหลดโมเดล:", error);
    alert("เกิดข้อผิดพลาดในการโหลดโมเดล กรุณารีเฟรชหน้าเว็บ");
    return false;
  }
};

// Start initialization
createPoseLandmarker();

// Summary button handler: save summary and exercise data, then open summary.html
if (summaryButton) {
  summaryButton.addEventListener('click', () => {
    console.log('📊 กดปุ่มสรุปผล');
    
    // ดึงค่าจาก window (global state)
    const left = window.leftCounter || 0;
    const right = window.rightCounter || 0;
    const rounds = window.roundCounter || 0;
    const total = left + right;
    
    // คำนวณระยะเวลา
    const durationSec = window.sessionStartTime 
      ? Math.floor((Date.now() - window.sessionStartTime) / 1000) 
      : 0;
    
    // สร้างวันที่แบบไทย
    const date = new Date().toLocaleString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
    
    console.log('📝 ข้อมูลที่จะบันทึก:', { left, right, rounds, total, durationSec, date });
    
    // 1. บันทึกข้อมูลสรุปผลสำหรับหน้า summary.html
    const summary = {
      exerciseNumber: window.currentExercise || 3,
      exerciseName: 'ท่ายกแขนเหนือศีรษะ',
      date,
      left,
      right,
      rounds,
      total,
      durationSec,
      timestamp: Date.now()
    };
    
    try {
      localStorage.setItem('lastSummary', JSON.stringify(summary));
      console.log('✅ บันทึก lastSummary สำเร็จ');
    } catch (e) {
      console.error('❌ ไม่สามารถบันทึก lastSummary:', e);
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
      return;
    }
    
    // 2. บันทึกลงประวัติการออกกำลังกาย (exerciseHistory)
    if (rounds > 0 || total > 0) {
      try {
        const saved = exerciseTracker.saveExercise(
          window.currentExercise || 3,
          rounds,
          left,
          right,
          durationSec
        );
        
        if (saved) {
          console.log('✅ บันทึกลง exerciseHistory สำเร็จ');
        } else {
          console.warn('⚠️ การบันทึกลง exerciseHistory ไม่สำเร็จ');
        }
      } catch (e) {
        console.error('❌ เกิดข้อผิดพลาดในการบันทึก exerciseHistory:', e);
      }
    } else {
      console.log('ℹ️ ไม่มีข้อมูลการออกกำลังกายให้บันทึก (rounds=0, total=0)');
    }
   if (window.flutter_inappwebview != null) {
      window.flutter_inappwebview.callHandler('saveExerciseData', {
        'exercise': summary.exerciseName,
        'rounds': summary.rounds,
        'left': summary.left,     // แก้ให้ตรงกับที่ Dart รอรับ
        'right': summary.right,   // แก้ให้ตรงกับที่ Dart รอรับ
        'total': summary.total,   // แก้ให้ตรงกับที่ Dart รอรับ
        'durationSec': summary.durationSec
      });
      console.log('✅ ส่งข้อมูล saveExerciseData ให้ Flutter จัดการเซฟลง Firebase แล้ว');
    }
    
    // 3. เปิดหน้า summary.html
    console.log('🔄 กำลังเปิดหน้า summary.html');
    window.location.href = 'summary.html';
  });
  
  console.log('✅ ลงทะเบียน summaryButton event listener สำเร็จ');
}

// เพิ่มปุ่มทดสอบนับ
testCountButton.addEventListener("click", () => {
  // ทดสอบการนับแบบปลอม
  window.leftCounter++;
  window.rightCounter++;
  leftCounter++;
  rightCounter++;

  // อัพเดตตัวนับด้วย EventSystem
  EventSystem.updateCounter({
    leftCounter: window.leftCounter,
    rightCounter: window.rightCounter,
    roundCounter: window.roundCounter
  });

  // อัพเดตด้วยตรง
  updateCounter();

  debugLog("ทดสอบนับแบบปลอม: ซ้าย=" + leftCounter + ", ขวา=" + rightCounter);
});

// Reset button handler
resetButton.addEventListener("click", async () => {
  try {
    debugLog("กำลังรีเซ็ตระบบ...");

    // ปิดกล้องถ้ากำลังเปิดอยู่
    if (webcamRunning) {
      webcamRunning = false;
      enableWebcamButton.innerText = "เปิดกล้อง";

      // หยุดกล้อง
      if (video.srcObject) {
        const tracks = video.srcObject.getTracks();
        tracks.forEach(track => track.stop());
        video.srcObject = null;
      }
    }

    // รีเซ็ตตัวแปร
    runningMode = "IMAGE";
    lastDetectedLandmarks = null;
    window.fullBodyVisible = false;
    fullBodyVisible = false;

    window.leftCounter = 0;
    window.rightCounter = 0;
    window.roundCounter = 0;
    window.isLeftExtended = false;
    window.isRightExtended = false;
    window.isLeftHolding = false;
    window.isRightHolding = false;
    window.leftHoldStartTime = 0;
    window.rightHoldStartTime = 0;
    window.achievementShown = false;
    window.sessionStartTime = null;

    leftCounter = 0;
    rightCounter = 0;
    roundCounter = 0;
    isLeftExtended = false;
    isRightExtended = false;
    isLeftHolding = false;
    isRightHolding = false;
    leftHoldStartTime = 0;
    rightHoldStartTime = 0;
    achievementShown = false;
    trackingEnabled = false;

    calibrateBasePosition();

    // รีโหลดโมเดลใหม่
    await createPoseLandmarker();

    // สร้าง DrawingUtils ใหม่
    drawingUtils = new DrawingUtils(canvasCtx);

    statusElement.textContent = "รีเซ็ตระบบเรียบร้อย กรุณาเปิดกล้องเพื่อเริ่มใหม่";
    statusElement.style.color = "#4CAF50";

    // ส่ง Event resetCounters
    const resetEvent = new CustomEvent('resetCounters');
    document.dispatchEvent(resetEvent);

    // Update counter display
    createCounterDisplay();

    alert("รีเซ็ตระบบเรียบร้อย กรุณาเปิดกล้องเพื่อเริ่มใหม่");
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการรีเซ็ตระบบ:", error);
    alert("เกิดข้อผิดพลาดในการรีเซ็ตระบบ กรุณารีเฟรชหน้าเว็บ");
  }
});

// Check if webcam access is supported
const hasGetUserMedia = () => {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
};

// If webcam supported, add event listener to button
if (hasGetUserMedia()) {
  enableWebcamButton.addEventListener("click", enableCam);
} else {
  console.warn("getUserMedia() ไม่รองรับโดยเบราว์เซอร์ของคุณ");
  alert("กล้องเว็บแคมไม่รองรับโดยเบราว์เซอร์ของคุณ");
}

// Enable webcam and start detection
function enableCam(event) {
  if (!poseLandmarker) {
    debugLog("โมเดลยังไม่ถูกโหลด โปรดรอสักครู่");
    return;
  }

  if (webcamRunning === true) {
    webcamRunning = false;
    enableWebcamButton.innerText = "เปิดกล้อง";
    trackingEnabled = false;

    // หยุดกล้อง
    if (video.srcObject) {
      const tracks = video.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      video.srcObject = null;
    }
  } else {
    webcamRunning = true;
    enableWebcamButton.innerText = "ปิดกล้อง";

    // ทดสอบวาดลงบน canvas
    utils.testCanvas(canvasElement);

    // กำหนดขนาดความละเอียดกล้องให้เป็น 640x720 หรือใกล้เคียง
    const constraints = {
      video: {
        width: { ideal: 640 },
        height: { ideal: 720 },
        facingMode: "user" // ใช้กล้องหน้า
      },
      audio: false
    };

    // Start webcam stream
    navigator.mediaDevices.getUserMedia(constraints)
      .then((stream) => {
        video.srcObject = stream;

        // เริ่มโหลดข้อมูลวิดีโอ แต่ยังไม่เริ่มตรวจจับท่าทางจนกว่าจะนับถอยหลังเสร็จ
        video.addEventListener("loadeddata", () => {
          // ตั้งค่าขนาด canvas ให้ตรงกับขนาดที่ต้องการ (640x720)
          canvasElement.width = 640;
          canvasElement.height = 720;

          // เริ่มการนับถอยหลังเมื่อวิดีโอพร้อม
          if (!countdownInProgress) {
            countdownInProgress = true;
            statusElement.textContent = "กำลังเตรียมพร้อม...";
            statusElement.style.color = "#2196F3";

            // เริ่มนับถอยหลัง
            countdownSystem.startCountdown(5, () => {
              // เมื่อนับถอยหลังเสร็จแล้ว
              countdownInProgress = false;
              trackingEnabled = true; // เปิดใช้งานการตรวจจับท่าทาง

              // เริ่มการปรับเทียบ
              calibrateBasePosition();

              // เริ่มจับเวลา
              window.sessionStartTime = Date.now();

              // เริ่มการตรวจจับแบบต่อเนื่อง
              improvedPredictWebcam();
            });
          }
        });
      })
      .catch((err) => {
        console.error("เกิดข้อผิดพลาดในการเข้าถึงกล้องเว็บแคม:", err);
        webcamRunning = false;
        enableWebcamButton.innerText = "เปิดกล้อง";
        alert("ไม่สามารถเข้าถึงกล้องได้ กรุณาตรวจสอบว่าอนุญาตให้เข้าถึงกล้องแล้ว");
      });
  }
}

// ฟังก์ชันจัดการเมื่อไม่พบร่างกาย
function handleNoBodyDetection() {
  statusElement.textContent = "ไม่พบร่างกาย กรุณายืนในตำแหน่งที่กล้องมองเห็น";
  statusElement.style.color = "#FF5252";

  // แสดงข้อความเตือนบน canvas
  canvasCtx.font = "24px Arial";
  canvasCtx.fillStyle = "red";
  canvasCtx.textAlign = "start";

  // อัปเดตตัวบ่งชี้
  utils.updateBodyDetectionIndicator(false);
}

// ฟังก์ชันตรวจสอบการบรรลุเป้าหมาย
function checkAchievement() {
  if ((window.leftCounter >= window.targetReps && window.rightCounter >= window.targetReps) && !window.achievementShown) {
    showAchievementAnimation();
    window.achievementShown = true;
    achievementShown = true;
  }
}

// ปรับปรุงฟังก์ชัน predictWebcam
async function improvedPredictWebcam() {
  // ตรวจสอบว่ากล้องทำงานอยู่และผ่านการนับถอยหลังแล้ว
  if (!webcamRunning || !trackingEnabled) {
    return;
  }

  // ปรับขนาด canvas ให้เป็น 640x720 เสมอ
  if (canvasElement.width !== 640 || canvasElement.height !== 720) {
    canvasElement.width = 640;
    canvasElement.height = 720;
  }

  // เปลี่ยนโหมดจาก IMAGE เป็น VIDEO สำหรับการสตรีม
  if (runningMode === "IMAGE") {
    runningMode = "VIDEO";
    await poseLandmarker.setOptions({
      runningMode: "VIDEO",
      smoothLandmarks: true // เพิ่มการทำ smoothing ในระดับ MediaPipe
    });
  }



  let startTimeMs = performance.now();
  let previousLandmarks = lastDetectedLandmarks; // เก็บค่า landmarks ครั้งก่อนหน้า

  try {
    // เพิ่มการตรวจสอบ
    debugLog("กำลังเรียก poseLandmarker.detectForVideo...");

    // ตรวจจับท่าทาง
    poseLandmarker.detectForVideo(video, startTimeMs, (result) => {
      debugLog("ได้รับผลลัพธ์จาก detectForVideo");

      canvasCtx.save();
      canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

      // ตรวจสอบผลลัพธ์
      if (result.landmarks && result.landmarks.length > 0) {
        debugLog("ตรวจพบ landmarks จำนวน:", result.landmarks[0].length);

        // ทำ smoothing เพื่อลดการกระโดดของจุด landmarks
        const landmarks = utils.smoothLandmarks(result.landmarks[0], previousLandmarks);

        // เก็บค่า landmarks ปัจจุบันสำหรับการ smooth ในครั้งถัดไป
        lastDetectedLandmarks = JSON.parse(JSON.stringify(landmarks));

        // ตรวจสอบว่าเห็นร่างกายทั้งตัวหรือไม่
        fullBodyVisible = utils.improvedIsFullBodyVisible(landmarks, currentExercise);
        window.fullBodyVisible = fullBodyVisible; // บันทึกค่าใน window เพื่อให้เข้าถึงได้จากทุกที่

        debugLog(`สถานะการตรวจจับร่างกาย: ${fullBodyVisible ? 'เห็นทั้งตัว' : 'ไม่เห็นทั้งตัว'}`);

        // วาดจุด landmarks และเส้นเชื่อมต่อด้วยสีที่แตกต่างกันตามการมองเห็น
        drawingUtils.drawLandmarks(landmarks, {
          radius: 5,
          color: fullBodyVisible ? '#00FF00' : '#FFA500',
          fillColor: fullBodyVisible ? '#00FF00' : '#FFA500'
        });

        drawingUtils.drawConnectors(landmarks, PoseLandmarker.POSE_CONNECTIONS, {
          color: fullBodyVisible ? '#00FFFF' : '#F9A826',
          lineWidth: 3
        });

        // อัปเดตตัวบ่งชี้การตรวจจับร่างกาย
        utils.updateBodyDetectionIndicator(fullBodyVisible);

        // แสดงสถานะการตรวจจับบน canvas
        if (fullBodyVisible) {
          canvasCtx.fillStyle = "rgba(76, 175, 80, 0.7)";
          canvasCtx.fillRect(10, 10, 20, 20);
          canvasCtx.strokeStyle = "#FFFFFF";
          canvasCtx.strokeRect(10, 10, 20, 20);
          canvasCtx.fillStyle = "#FFFFFF";
          canvasCtx.font = "14px Arial";
          canvasCtx.fillText("เห็นทั้งตัว", 35, 25);

          // เรียกใช้ฟังก์ชันตรวจจับท่าออกกำลังกายใหม่
          detectStandingDumbbellExercise(landmarks);

          // จัดการการปรับเทียบตำแหน่ง
          if (!window.calibrated && window.baseSamples && window.baseSamples.length < 30) {
            statusElement.textContent = `กำลังปรับเทียบตำแหน่ง... (${window.baseSamples.length}/30) กรุณายืนตรง`;
            statusElement.style.color = "#2196F3";

            // แสดงตัวบ่งชี้การปรับเทียบ
            utils.showCalibrationIndicator(window.baseSamples.length);
          }
        } else {
          canvasCtx.fillStyle = "rgba(255, 82, 82, 0.7)";
          canvasCtx.fillRect(10, 10, 20, 20);
          canvasCtx.strokeStyle = "#FFFFFF";
          canvasCtx.strokeRect(10, 10, 20, 20);
          canvasCtx.fillStyle = "#FFFFFF";
          canvasCtx.font = "14px Arial";
          canvasCtx.fillText("ไม่เห็นทั้งตัว", 35, 25);

          // แสดงข้อความให้ยืนให้กล้องเห็นทั้งตัว
          statusElement.textContent = "กรุณายืนให้กล้องเห็นทั้งตัว";
          statusElement.style.color = "#FF5252";

          // บายพาสการตรวจจับร่างกายทั้งตัวเพื่อทดสอบ
          debugLog("กำลังเรียกฟังก์ชันวิเคราะห์ท่าทางแม้จะไม่เห็นร่างกายทั้งตัว");
          // เรียกใช้ฟังก์ชันตรวจจับใหม่
          detectStandingDumbbellExercise(landmarks);
        }

        // ตรวจสอบการบรรลุเป้าหมายและแสดงผลความสำเร็จ
        checkAchievement();

        // // แสดงข้อมูลดีบัก (เฉพาะเมื่อเปิดโหมดดีบัก)
        // if (debugMode) {
        //   utils.showDebugInfo(landmarks, currentExercise, canvasElement, canvasCtx, isLeftExtended, isRightExtended);
        // }
      } else {
        // กรณีไม่พบร่างกาย
        debugLog("ไม่พบร่างกายในเฟรมนี้");
        handleNoBodyDetection();
      }

      canvasCtx.restore();
    });
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการตรวจจับ:", error);
    if (webcamRunning && trackingEnabled) {
      setTimeout(() => {
        window.requestAnimationFrame(improvedPredictWebcam);
      }, 500);
      return;
    }
  }

  // ขอเฟรมถัดไป
  if (webcamRunning && trackingEnabled) {
    window.requestAnimationFrame(improvedPredictWebcam);
  }
}