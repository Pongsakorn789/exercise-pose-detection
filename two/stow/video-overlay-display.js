// video-overlay-display.js
// ระบบแสดงข้อมูลการออกกำลังกายบนวิดีโอ

import { EventSystem } from './event-system.js';

/**
 * สร้างและจัดการ overlay สำหรับแสดงข้อมูลบนวิดีโอ
 */
class VideoOverlayDisplay {
  constructor() {
    this.overlayElement = null;
    this.statsData = {
      leftCounter: 0,
      rightCounter: 0,
      roundCounter: 0,
      targetReps: 10,
      totalLifetimeRounds: 0,
      totalLifetimeReps: 0,
      todayRounds: 0,
      todayReps: 0,
      sessionTime: 0,
      calories: 0
    };

    this.sessionStartTime = Date.now();
    this.timerInterval = null;

    this.initialize();
  }

  /**
   * สร้าง overlay element และเพิ่มเข้าไปในวิดีโอ container
   */
  initialize() {
    // โหลดข้อมูลสถิติจาก localStorage
    this.loadStatistics();

    // สร้าง overlay container
    this.createOverlay();

    // ตั้งค่า event listeners
    this.setupEventListeners();

    // เริ่มนับเวลา
    this.startSessionTimer();

    console.log('Video overlay display initialized');
  }

  /**
   * โหลดข้อมูลสถิติจาก localStorage
   */
  loadStatistics() {
    try {
      const exerciseHistory = JSON.parse(localStorage.getItem('exerciseHistory') || '{}');
      const today = new Date().toISOString().split('T')[0];

      let totalRounds = 0;
      let totalReps = 0;
      let todayRounds = 0;
      let todayReps = 0;

      // นับข้อมูลทั้งหมด
      Object.entries(exerciseHistory).forEach(([date, exercises]) => {
        Object.values(exercises).forEach(exercise => {
          const rounds = exercise.rounds || 0;
          const reps = (exercise.leftReps || 0) + (exercise.rightReps || 0);

          totalRounds += rounds;
          totalReps += reps;

          // นับข้อมูลวันนี้
          if (date === today) {
            todayRounds += rounds;
            todayReps += reps;
          }
        });
      });

      this.statsData.totalLifetimeRounds = totalRounds;
      this.statsData.totalLifetimeReps = totalReps;
      this.statsData.todayRounds = todayRounds;
      this.statsData.todayReps = todayReps;

    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  }

  /**
   * สร้าง overlay HTML structure
   */
  createOverlay() {
    const webcamContainer = document.querySelector('.webcam-container');
    if (!webcamContainer) {
      console.error('Webcam container not found');
      return;
    }

    // ลบ overlay เก่า (ถ้ามี)
    const existingOverlay = document.getElementById('video-stats-overlay');
    if (existingOverlay) {
      existingOverlay.remove();
    }

    // สร้าง overlay element
    this.overlayElement = document.createElement('div');
    this.overlayElement.id = 'video-stats-overlay';
    this.overlayElement.className = 'video-stats-overlay';
    this.overlayElement.innerHTML = this.getOverlayHTML();

    // เพิ่ม styles
    this.addStyles();

    // เพิ่ม overlay เข้าไปใน webcam container
    webcamContainer.appendChild(this.overlayElement);
  }

  /**
   * สร้าง HTML สำหรับ overlay
   */
  getOverlayHTML() {
    return `
      <!-- แสดงแยกข้างซ้ายและข้างขวา -->
      <div class="overlay-section top-right">
        <div class="stats-card simple-stats">
          <div class="lr-stats-container">
            <!-- ข้างซ้าย -->
            <div class="lr-stat-group">
              <div class="lr-label">ซ้าย</div>
              <div class="lr-values">
                <div class="lr-value-item">
                  <span class="lr-number left-color" id="overlay-left">${this.statsData.leftCounter}</span>
                  <span class="lr-unit">ครั้ง</span>
                </div>
              </div>
            </div>

            <div class="lr-divider">|</div>

            <!-- ข้างขวา -->
            <div class="lr-stat-group">
              <div class="lr-label">ขวา</div>
              <div class="lr-values">
                <div class="lr-value-item">
                  <span class="lr-number right-color" id="overlay-right">${this.statsData.rightCounter}</span>
                  <span class="lr-unit">ครั้ง</span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- แสดงรอบด้านล่าง -->
          <div class="round-display">
            <span class="round-label">รอบที่</span>
            <span class="round-number" id="overlay-round">${this.statsData.roundCounter}</span>
          </div>
        </div>
      </div>

      <!-- Achievement Popup (hidden by default) -->
      <div class="overlay-achievement" id="overlay-achievement" style="display: none;">
        <div class="achievement-content">
          <div class="achievement-icon">🎯</div>
          <div class="achievement-text">ทำครบเป้าหมาย!</div>
        </div>
      </div>
    `;
  }

  /**
   * เพิ่ม CSS styles สำหรับ overlay
   */
  addStyles() {
    // ตรวจสอบว่ามี styles อยู่แล้วหรือไม่
    if (document.getElementById('video-overlay-styles')) {
      return;
    }

    const styles = document.createElement('style');
    styles.id = 'video-overlay-styles';
    styles.textContent = `
      .video-stats-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 100;
      }

      .overlay-section {
        position: absolute;
        padding: 15px;
      }

      .overlay-section.top-right {
        top: 10px;
        right: 10px;
      }

      .stats-card {
        background: rgba(0, 0, 0, 0.85);
        backdrop-filter: blur(10px);
        border-radius: 12px;
        padding: 15px 20px;
        border: 2px solid rgba(255, 255, 255, 0.1);
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
        color: white;
        font-family: 'Sarabun', sans-serif;
        animation: fadeIn 0.3s ease;
      }

      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
      }

      .lr-stats-container {
        display: flex;
        align-items: center;
        gap: 20px;
        margin-bottom: 10px;
      }

      .lr-stat-group {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 5px;
      }

      .lr-label {
        font-size: 12px;
        font-weight: 600;
        color: rgba(255, 255, 255, 0.7);
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .lr-values {
        display: flex;
        align-items: center;
        gap: 5px;
      }

      .lr-value-item {
        display: flex;
        align-items: baseline;
        gap: 5px;
      }

      .lr-number {
        font-size: 32px;
        font-weight: 800;
        line-height: 1;
      }

      .left-color {
        color: #FF6B6B;
      }

      .right-color {
        color: #4ECDC4;
      }

      .lr-unit {
        font-size: 14px;
        font-weight: 600;
        color: #FFFFFF;
        opacity: 0.9;
      }

      .lr-divider {
        font-size: 32px;
        font-weight: 300;
        color: rgba(255, 255, 255, 0.3);
        margin: 0 5px;
      }

      .round-display {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding-top: 10px;
        border-top: 1px solid rgba(255, 255, 255, 0.2);
      }

      .round-label {
        font-size: 12px;
        font-weight: 600;
        color: rgba(255, 255, 255, 0.7);
      }

      .round-number {
        font-size: 20px;
        font-weight: 800;
        color: #FFA726;
      }

      /* Achievement Popup */
      .overlay-achievement {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 300;
        animation: achievementPop 0.5s ease;
      }

      @keyframes achievementPop {
        0% { transform: translate(-50%, -50%) scale(0); }
        70% { transform: translate(-50%, -50%) scale(1.1); }
        100% { transform: translate(-50%, -50%) scale(1); }
      }

      .achievement-content {
        background: linear-gradient(135deg, #FFD700, #FFA500);
        border-radius: 16px;
        padding: 30px 50px;
        box-shadow: 0 10px 40px rgba(255, 215, 0, 0.5);
        text-align: center;
      }

      .achievement-icon {
        font-size: 60px;
        margin-bottom: 10px;
      }

      .achievement-text {
        font-size: 28px;
        font-weight: 800;
        color: white;
        text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
      }

      /* Pulse animation */
      .pulse {
        animation: pulseNumber 0.3s ease;
      }

      @keyframes pulseNumber {
        0% { transform: scale(1); }
        50% { transform: scale(1.2); }
        100% { transform: scale(1); }
      }

      /* Responsive */
      @media (max-width: 768px) {
        .lr-number {
          font-size: 28px;
        }

        .lr-unit {
          font-size: 12px;
        }

        .lr-divider {
          font-size: 28px;
        }

        .stats-card {
          padding: 12px 15px;
        }

        .round-number {
          font-size: 18px;
        }
      }

      @media (max-width: 480px) {
        .lr-number {
          font-size: 24px;
        }

        .lr-unit {
          font-size: 11px;
        }

        .lr-label {
          font-size: 10px;
        }

        .lr-divider {
          font-size: 24px;
        }

        .stats-card {
          padding: 10px 12px;
        }

        .lr-stats-container {
          gap: 12px;
        }

        .round-number {
          font-size: 16px;
        }
      }
    `;

    document.head.appendChild(styles);
  }
  setupEventListeners() {
    // รับการอัพเดตตัวนับ
    document.addEventListener('updateCounter', (event) => {
      this.updateCurrentExercise(event.detail);
    });

    // รับการแจ้งเตือนครบรอบ
    document.addEventListener('roundCompleted', (event) => {
      this.handleRoundCompleted(event.detail);
    });

    // รับการรีเซ็ต
    document.addEventListener('resetCounters', () => {
      this.resetCurrentExercise();
    });

    // รับการแสดงความสำเร็จ
    document.addEventListener('showAchievement', () => {
      this.showAchievement();
    });
  }

  /**
   * อัพเดตข้อมูลการออกกำลังกายปัจจุบัน
   */
  updateCurrentExercise(data) {
    if (!data || !this.overlayElement) return;

    // อัพเดตข้อมูลใน statsData
    if (data.leftCounter !== undefined) this.statsData.leftCounter = data.leftCounter;
    if (data.rightCounter !== undefined) this.statsData.rightCounter = data.rightCounter;
    if (data.roundCounter !== undefined) this.statsData.roundCounter = data.roundCounter;
    if (data.targetReps !== undefined) this.statsData.targetReps = data.targetReps;

    // อัพเดต DOM elements
    this.updateElement('overlay-round', this.statsData.roundCounter);
    this.updateElement('overlay-left', this.statsData.leftCounter);
    this.updateElement('overlay-right', this.statsData.rightCounter);

    // อัพเดต progress bars
    const leftProgress = document.getElementById('overlay-left-progress');
    const rightProgress = document.getElementById('overlay-right-progress');

    if (leftProgress) {
      const leftPercent = Math.min(100, (this.statsData.leftCounter / this.statsData.targetReps) * 100);
      leftProgress.style.width = `${leftPercent}%`;

      // เพิ่ม effect เมื่อครบเป้าหมาย
      if (leftPercent >= 100) {
        leftProgress.style.boxShadow = '0 0 10px rgba(255, 107, 107, 0.8)';
      } else {
        leftProgress.style.boxShadow = 'none';
      }
    }

    if (rightProgress) {
      const rightPercent = Math.min(100, (this.statsData.rightCounter / this.statsData.targetReps) * 100);
      rightProgress.style.width = `${rightPercent}%`;

      // เพิ่ม effect เมื่อครบเป้าหมาย
      if (rightPercent >= 100) {
        rightProgress.style.boxShadow = '0 0 10px rgba(78, 205, 196, 0.8)';
      } else {
        rightProgress.style.boxShadow = 'none';
      }
    }

    // เพิ่ม animation effect เมื่อมีการนับ
    this.addCountAnimation(data);
  }

  /**
   * จัดการเมื่อครบรอบ
   */
  handleRoundCompleted(data) {
    // โหลดข้อมูลสถิติใหม่
    this.loadStatistics();

    // อัพเดตการแสดงผล
    this.updateElement('overlay-today-rounds', this.statsData.todayRounds);
    this.updateElement('overlay-today-reps', this.statsData.todayReps);
    this.updateElement('overlay-total-rounds', this.statsData.totalLifetimeRounds);
    this.updateElement('overlay-total-reps', this.statsData.totalLifetimeReps);

    // แสดงความสำเร็จ
    this.showAchievement();
  }

  /**
   * แสดง achievement popup
   */
  showAchievement() {
    const achievement = document.getElementById('overlay-achievement');
    if (!achievement) return;

    achievement.style.display = 'block';

    // ซ่อนหลังจาก 3 วินาที
    setTimeout(() => {
      achievement.style.display = 'none';
    }, 3000);
  }

  /**
   * รีเซ็ตข้อมูลการออกกำลังกายปัจจุบัน
   */
  resetCurrentExercise() {
    this.statsData.leftCounter = 0;
    this.statsData.rightCounter = 0;
    this.statsData.roundCounter = 0;

    this.updateCurrentExercise(this.statsData);
  }

  /**
   * เริ่มนับเวลา session
   */
  startSessionTimer() {
    this.timerInterval = setInterval(() => {
      this.updateSessionTime();
    }, 1000);
  }

  /**
   * อัพเดตเวลา session และแคลอรี่
   */
  updateSessionTime() {
    const elapsed = Math.floor((Date.now() - this.sessionStartTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;

    const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    this.updateElement('overlay-time', timeString);

    // คำนวณแคลอรี่ (ประมาณ 5 แคลอรี่ต่อนาที)
    const calories = Math.floor(minutes * 5);
    this.updateElement('overlay-calories', calories);

    this.statsData.sessionTime = elapsed;
    this.statsData.calories = calories;
  }

  /**
   * อัพเดต element ด้วย value
   */
  updateElement(id, value) {
    const element = document.getElementById(id);
    if (element && element.textContent !== value.toString()) {
      element.textContent = value;
    }
  }

  /**
   * เพิ่ม animation เมื่อมีการนับ
   */
  addCountAnimation(data) {
    // เพิ่ม pulse effect เมื่อมีการเปลี่ยนแปลง
    if (data.leftCounter !== undefined) {
      const leftElement = document.getElementById('overlay-left');
      if (leftElement) {
        leftElement.classList.add('pulse');
        setTimeout(() => leftElement.classList.remove('pulse'), 300);
      }
    }

    if (data.rightCounter !== undefined) {
      const rightElement = document.getElementById('overlay-right');
      if (rightElement) {
        rightElement.classList.add('pulse');
        setTimeout(() => rightElement.classList.remove('pulse'), 300);
      }
    }
  }

  /**
   * ทำลาย overlay และหยุด timer
   */
  destroy() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }

    if (this.overlayElement) {
      this.overlayElement.remove();
    }
  }
}

// สร้าง instance และ export
let overlayInstance = null;

export function initializeVideoOverlay() {
  if (!overlayInstance) {
    overlayInstance = new VideoOverlayDisplay();
  }
  return overlayInstance;
}

export function destroyVideoOverlay() {
  if (overlayInstance) {
    overlayInstance.destroy();
    overlayInstance = null;
  }
}

// เพิ่ม pulse animation style
const pulseStyle = document.createElement('style');
pulseStyle.textContent = `
  .pulse {
    animation: pulseNumber 0.3s ease;
  }

  @keyframes pulseNumber {
    0% { transform: scale(1); }
    50% { transform: scale(1.2); }
    100% { transform: scale(1); }
  }
`;
document.head.appendChild(pulseStyle);

export const VideoOverlay = {
  initialize: initializeVideoOverlay,
  destroy: destroyVideoOverlay
};