// enhanced-position-tracker.js
// ระบบติดตามและบันทึกตำแหน่งสะโพก เข่า ข้อเท้า ลง Excel
// ✅ อัปเดต: 100 FPS (1 เฟรม = 10ms, 1 วินาที = 100 เฟรม)
// ===== CONFIG =====
const ENABLE_POSITION_TRACKER_UI = false; // ❗ ปิด UI ที่นี่

// ตัวแปรเก็บข้อมูลตำแหน่ง
let positionData = [];
let isRecording = false;
let recordingStartTime = null;
let recordingStartTimeSeconds = null;
let recordingSession = 1;
let frameCounter = 0;

// ตัวแปรเก็บตำแหน่งเริ่มต้นและสิ้นสุด
let initialPositions = null;
let finalPositions = null;
let exerciseStartTime = null;
let exerciseEndTime = null;

// ✅ ข้อมูลเพิ่มเติมสำหรับการเลือกขาที่ยก
let legInfo = {
  leg_raised: 'left_leg', // ค่าเริ่มต้น
  movement_phase: 'tracking'
};

// การกำหนดจุดสำคัญที่ต้องการติดตาม (สะโพก, เข่า, ข้อเท้า)
const LANDMARK_NAMES = {
  23: 'left_hip',
  24: 'right_hip', 
  25: 'left_knee',
  26: 'right_knee',
  27: 'left_ankle',
  28: 'right_ankle'
};

// จุดสำคัญที่ต้องการติดตาม (สะโพก, เข่า, ข้อเท้า)
const TRACKED_LANDMARKS = [23, 24, 25, 26, 27, 28];

// ✅ ค่าคงที่สำหรับ Frame Rate
const FRAME_RATE = 100; // 100 FPS
const FRAME_DURATION_MS = 10; // 1 เฟรม = 10 มิลลิวินาที

/**
 * ✅ ตรวจสอบว่าไลบรารี XLSX พร้อมใช้งานหรือไม่
 */
function checkXLSXAvailability() {
  return new Promise((resolve) => {
    if (typeof XLSX !== 'undefined') {
      console.log('✅ XLSX library is available');
      resolve(true);
    } else {
      console.log('⏳ Waiting for XLSX library...');
      const checkInterval = setInterval(() => {
        if (typeof XLSX !== 'undefined') {
          clearInterval(checkInterval);
          console.log('✅ XLSX library loaded successfully');
          resolve(true);
        }
      }, 100);
      
      setTimeout(() => {
        clearInterval(checkInterval);
        console.error('❌ XLSX library failed to load');
        resolve(false);
      }, 5000);
    }
  });
}

/**
 * สร้าง UI สำหรับควบคุมการบันทึกตำแหน่ง
 */
function createPositionTrackerUI() {
  if (document.getElementById('position-tracker-ui')) {
    return;
  }

  const trackerUI = document.createElement('div');
  trackerUI.id = 'position-tracker-ui';
  trackerUI.className = 'position-tracker-ui';
  
  trackerUI.innerHTML = `
    <div class="tracker-header" id="tracker-header">
      <h3>📊 Position Tracker</h3>
      <div class="drag-handle">⋮⋮</div>
      <div class="tracker-status" id="tracker-status">พร้อมบันทึก</div>
    </div>
    
    <div class="exercise-config">
      <h4>⚙️ การตั้งค่าการติดตาม</h4>
      <div class="config-grid">
        <div class="config-item">
          <label>ขาที่ยก:</label>
          <select id="leg-raised">
            <option value="left_leg">ขาซ้าย</option>
            <option value="right_leg">ขาขวา</option>
            <option value="both_legs">ทั้งสองข้าง</option>
          </select>
        </div>
        <div class="config-item">
          <label>ระยะ:</label>
          <select id="movement-phase">
            <option value="tracking">ติดตาม</option>
            <option value="up">ขึ้น</option>
            <option value="down">ลง</option>
            <option value="hold">คงท่า</option>
          </select>
        </div>
      </div>
    </div>
    
    <div class="tracker-controls">
      <button id="start-recording-btn" class="tracker-btn start-btn">
        <i class="fas fa-record-vinyl"></i> เริ่มบันทึก
      </button>
      
      <button id="stop-recording-btn" class="tracker-btn stop-btn" disabled>
        <i class="fas fa-stop"></i> หยุดบันทึก
      </button>
      
      <button id="export-excel-btn" class="tracker-btn export-btn">
        <i class="fas fa-file-excel"></i> ส่งออก Excel
      </button>
      
      <button id="clear-data-btn" class="tracker-btn clear-btn">
        <i class="fas fa-trash"></i> ล้างข้อมูล
      </button>
    </div>
    
    <div class="tracker-info">
      <div class="info-item">
        <span class="info-label">เฟรม:</span>
        <span id="frame-count">0</span>
      </div>
      <div class="info-item">
        <span class="info-label">เวลา:</span>
        <span id="recording-time">0.0 วิ</span>
      </div>
      <div class="info-item">
        <span class="info-label">เซสชัน:</span>
        <span id="session-number">${recordingSession}</span>
      </div>
      <div class="info-item">
        <span class="info-label">FPS:</span>
        <span id="fps-display">100</span>
      </div>
    </div>
    
    <div class="frame-timing-info">
      <div class="timing-details">
        <div class="timing-item">
          <span class="timing-label">1 เฟรม =</span>
          <span class="timing-value">10 ms</span>
        </div>
        <div class="timing-item">
          <span class="timing-label">1 วินาที =</span>
          <span class="timing-value">100 เฟรม</span>
        </div>
      </div>
    </div>
    
    <div class="current-positions" id="current-positions">
      <h4>📍 ตำแหน่งปัจจุบัน (Hip, Knee, Ankle)</h4>
      <div class="positions-grid" id="positions-display">
        <!-- จะถูกอัปเดตแบบเรียลไทม์ -->
      </div>
    </div>
    
    <div class="initial-final-comparison" id="comparison-section" style="display: none;">
      <h4>🔄 เปรียบเทียบเริ่มต้น-สิ้นสุด</h4>
      <div class="comparison-toggle">
        <button id="show-initial-btn" class="toggle-btn active">เริ่มต้น</button>
        <button id="show-final-btn" class="toggle-btn">สิ้นสุด</button>
        <button id="show-delta-btn" class="toggle-btn">การเปลี่ยนแปลง</button>
      </div>
      <div class="comparison-display" id="comparison-display">
        <!-- จะแสดงข้อมูลเปรียบเทียบ -->
      </div>
    </div>
  `;

  // เพิ่ม CSS
  const trackerStyle = document.createElement('style');
  trackerStyle.textContent = `
    .position-tracker-ui {
      position: fixed;
      top: 20px;
      right: 20px;
      width: 400px;
      max-height: 90vh;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(20px);
      border-radius: 16px;
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
      border: 1px solid rgba(255, 255, 255, 0.2);
      z-index: 1500;
      font-family: 'Sarabun', Arial, sans-serif;
      overflow-y: auto;
      user-select: none;
    }
    
    .tracker-header {
      padding: 1.5rem;
      background: linear-gradient(135deg, #4285F4, #3367d6);
      color: white;
      border-radius: 16px 16px 0 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: sticky;
      top: 0;
      z-index: 10;
      cursor: move;
    }
    
    .drag-handle {
      font-size: 1.2rem;
      opacity: 0.7;
      cursor: grab;
      padding: 0.5rem;
      border-radius: 4px;
      transition: all 0.3s ease;
    }
    
    .drag-handle:hover {
      opacity: 1;
      background: rgba(255, 255, 255, 0.2);
    }
    
    .tracker-header h3 {
      margin: 0;
      font-size: 1.2rem;
      font-weight: 700;
    }
    
    .tracker-status {
      background: rgba(255, 255, 255, 0.2);
      padding: 0.25rem 0.75rem;
      border-radius: 50px;
      font-size: 0.8rem;
      font-weight: 600;
    }
    
    .tracker-status.recording {
      background: rgba(239, 83, 80, 0.9);
      animation: pulse 1s infinite;
    }
    
    @keyframes pulse {
      0% { opacity: 1; }
      50% { opacity: 0.7; }
      100% { opacity: 1; }
    }
    
    .exercise-config {
      padding: 1rem;
      border-bottom: 1px solid rgba(0, 0, 0, 0.1);
      background: rgba(76, 175, 80, 0.05);
    }
    
    .exercise-config h4 {
      margin: 0 0 1rem 0;
      font-size: 1rem;
      color: #333;
    }
    
    .config-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
    }
    
    .config-item {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    
    .config-item label {
      font-size: 0.8rem;
      font-weight: 600;
      color: #666;
    }
    
    .config-item select {
      padding: 0.5rem;
      border: 1px solid #ddd;
      border-radius: 8px;
      font-size: 0.8rem;
      background: white;
    }
    
    .config-item select:focus {
      outline: none;
      border-color: #4285F4;
      box-shadow: 0 0 0 2px rgba(66, 133, 244, 0.2);
    }
    
    .tracker-controls {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
      padding: 1rem;
    }
    
    .tracker-btn {
      padding: 0.75rem;
      border: none;
      border-radius: 12px;
      font-weight: 600;
      font-size: 0.85rem;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      color: white;
    }
    
    .start-btn {
      background: linear-gradient(135deg, #4CAF50, #45a049);
    }
    
    .stop-btn {
      background: linear-gradient(135deg, #f44336, #d32f2f);
    }
    
    .export-btn {
      background: linear-gradient(135deg, #2196F3, #1976D2);
    }
    
    .clear-btn {
      background: linear-gradient(135deg, #FF9800, #F57C00);
    }
    
    .tracker-btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
    }
    
    .tracker-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
    }
    
    .tracker-info {
      padding: 1rem;
      border-top: 1px solid rgba(0, 0, 0, 0.1);
      display: grid;
      grid-template-columns: 1fr 1fr 1fr 1fr;
      gap: 0.5rem;
      text-align: center;
    }
    
    .info-item {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    
    .info-label {
      font-size: 0.8rem;
      color: #666;
      font-weight: 500;
    }
    
    .info-item span:last-child {
      font-weight: 700;
      color: #4285F4;
    }
    
    .frame-timing-info {
      padding: 0.75rem 1rem;
      background: rgba(255, 193, 7, 0.1);
      border-top: 1px solid rgba(255, 193, 7, 0.3);
    }
    
    .timing-details {
      display: flex;
      justify-content: space-around;
      align-items: center;
    }
    
    .timing-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.25rem;
    }
    
    .timing-label {
      font-size: 0.75rem;
      color: #666;
      font-weight: 500;
    }
    
    .timing-value {
      font-size: 0.85rem;
      font-weight: 700;
      color: #FF8F00;
      background: rgba(255, 193, 7, 0.2);
      padding: 0.25rem 0.5rem;
      border-radius: 6px;
    }
    
    .current-positions {
      padding: 1rem;
      border-top: 1px solid rgba(0, 0, 0, 0.1);
      max-height: 250px;
      overflow-y: auto;
    }
    
    .current-positions h4 {
      margin: 0 0 1rem 0;
      font-size: 1rem;
      color: #333;
    }
    
    .positions-grid {
      display: grid;
      gap: 0.5rem;
      font-size: 0.8rem;
    }
    
    .position-item {
      display: grid;
      grid-template-columns: auto 1fr 1fr 1fr;
      gap: 0.5rem;
      padding: 0.5rem;
      background: rgba(0, 0, 0, 0.05);
      border-radius: 8px;
      align-items: center;
    }
    
    .position-label {
      font-weight: 600;
      color: #4285F4;
      min-width: 80px;
    }
    
    .position-value {
      text-align: center;
      font-family: 'Courier New', monospace;
      font-size: 0.75rem;
      background: white;
      padding: 0.25rem;
      border-radius: 4px;
    }
    
    .initial-final-comparison {
      padding: 1rem;
      border-top: 1px solid rgba(0, 0, 0, 0.1);
      background: rgba(76, 175, 80, 0.05);
    }
    
    .initial-final-comparison h4 {
      margin: 0 0 1rem 0;
      font-size: 1rem;
      color: #333;
    }
    
    .comparison-toggle {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }
    
    .toggle-btn {
      flex: 1;
      padding: 0.5rem;
      border: 1px solid #4285F4;
      background: white;
      color: #4285F4;
      border-radius: 8px;
      cursor: pointer;
      font-size: 0.8rem;
      font-weight: 600;
      transition: all 0.3s ease;
    }
    
    .toggle-btn.active {
      background: #4285F4;
      color: white;
    }
    
    .comparison-display {
      max-height: 200px;
      overflow-y: auto;
    }
    
    .comparison-item {
      display: grid;
      grid-template-columns: auto 1fr 1fr 1fr;
      gap: 0.5rem;
      padding: 0.5rem;
      background: white;
      border-radius: 8px;
      align-items: center;
      margin-bottom: 0.5rem;
      font-size: 0.8rem;
    }
    
    .comparison-label {
      font-weight: 600;
      color: #4CAF50;
      min-width: 80px;
    }
    
    .comparison-value {
      text-align: center;
      font-family: 'Courier New', monospace;
      font-size: 0.75rem;
      padding: 0.25rem;
      border-radius: 4px;
      background: rgba(76, 175, 80, 0.1);
    }
    
    .delta-value {
      background: rgba(255, 193, 7, 0.2) !important;
      color: #FF8F00 !important;
      font-weight: 700;
    }
    
    @media (max-width: 768px) {
      .position-tracker-ui {
        position: relative;
        top: auto;
        right: auto;
        left: auto;
        width: 100%;
        max-width: 100%;
        margin: 1rem 0;
        border-radius: 12px;
      }
      
      .tracker-controls {
        grid-template-columns: 1fr;
      }
      
      .tracker-info {
        grid-template-columns: 1fr 1fr;
        gap: 0.75rem;
      }
      
      .config-grid {
        grid-template-columns: 1fr;
      }
    }
    
    .position-notification {
      position: fixed;
      top: 100px;
      right: 20px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
      z-index: 2000;
      animation: slideInRight 0.3s ease-out, fadeOut 0.3s ease-in 2.7s forwards;
      border-left: 4px solid;
      max-width: 300px;
      backdrop-filter: blur(10px);
    }
    
    .position-notification.success {
      border-left-color: #4CAF50;
    }
    
    .position-notification.error {
      border-left-color: #f44336;
    }
    
    .position-notification.info {
      border-left-color: #2196F3;
    }
    
    .notification-content {
      padding: 1rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-weight: 500;
    }
    
    .notification-content i {
      font-size: 1.2rem;
    }
    
    .position-notification.success .notification-content i {
      color: #4CAF50;
    }
    
    .position-notification.error .notification-content i {
      color: #f44336;
    }
    
    .position-notification.info .notification-content i {
      color: #2196F3;
    }
    
    @keyframes slideInRight {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes fadeOut {
      to { opacity: 0; transform: translateX(100%); }
    }
  `;

  document.head.appendChild(trackerStyle);
  document.body.appendChild(trackerUI);

  makeDraggable(trackerUI);
  setupEventListeners();
}

/**
 * ทำให้แถบควบคุมลากได้
 */
function makeDraggable(element) {
  const header = element.querySelector('.tracker-header');
  let isDragging = false;
  let currentX, currentY, initialX, initialY;
  let xOffset = 0, yOffset = 0;

  header.addEventListener('mousedown', dragStart);
  document.addEventListener('mousemove', dragMove);
  document.addEventListener('mouseup', dragEnd);

  header.addEventListener('touchstart', dragStart);
  document.addEventListener('touchmove', dragMove);
  document.addEventListener('touchend', dragEnd);

  function dragStart(e) {
    if (e.type === "touchstart") {
      initialX = e.touches[0].clientX - xOffset;
      initialY = e.touches[0].clientY - yOffset;
    } else {
      initialX = e.clientX - xOffset;
      initialY = e.clientY - yOffset;
    }

    if (e.target === header || header.contains(e.target)) {
      isDragging = true;
    }
  }

  function dragMove(e) {
    if (isDragging) {
      e.preventDefault();
      
      if (e.type === "touchmove") {
        currentX = e.touches[0].clientX - initialX;
        currentY = e.touches[0].clientY - initialY;
      } else {
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;
      }

      xOffset = currentX;
      yOffset = currentY;

      const maxX = window.innerWidth - element.offsetWidth;
      const maxY = window.innerHeight - element.offsetHeight;
      
      xOffset = Math.max(0, Math.min(xOffset, maxX));
      yOffset = Math.max(0, Math.min(yOffset, maxY));

      element.style.transform = `translate(${xOffset}px, ${yOffset}px)`;
    }
  }

  function dragEnd() {
    initialX = currentX;
    initialY = currentY;
    isDragging = false;
  }
}

/**
 * ตั้งค่า event listeners
 */
function setupEventListeners() {
  document.getElementById('start-recording-btn').addEventListener('click', startRecording);
  document.getElementById('stop-recording-btn').addEventListener('click', stopRecording);
  document.getElementById('export-excel-btn').addEventListener('click', exportToExcel);
  document.getElementById('clear-data-btn').addEventListener('click', clearData);

  // Event listeners สำหรับการตั้งค่า
  document.getElementById('leg-raised').addEventListener('change', updateLegConfig);
  document.getElementById('movement-phase').addEventListener('change', updateLegConfig);

  // Event listeners สำหรับปุ่มเปรียบเทียบ
  document.getElementById('show-initial-btn').addEventListener('click', () => showComparison('initial'));
  document.getElementById('show-final-btn').addEventListener('click', () => showComparison('final'));
  document.getElementById('show-delta-btn').addEventListener('click', () => showComparison('delta'));
}

/**
 * ✅ อัปเดตการตั้งค่าขาที่ยก
 */
function updateLegConfig() {
  legInfo.leg_raised = document.getElementById('leg-raised').value;
  legInfo.movement_phase = document.getElementById('movement-phase').value;
}

/**
 * ✅ เริ่มการบันทึกตำแหน่ง
 */
function startRecording() {
  isRecording = true;
  recordingStartTime = Date.now();
  exerciseStartTime = new Date();
  
  // บันทึกเวลาเริ่มต้นเป็นวินาทีของวัน
  const startDate = new Date(recordingStartTime);
  recordingStartTimeSeconds = startDate.getHours() * 3600 + 
                             startDate.getMinutes() * 60 + 
                             startDate.getSeconds() + 
                             startDate.getMilliseconds() / 1000;
  
  positionData = [];
  frameCounter = 0;
  initialPositions = null;
  finalPositions = null;

  // อัปเดตการตั้งค่า
  updateLegConfig();
  
  updateUI();
  
  const statusElement = document.getElementById('tracker-status');
  statusElement.textContent = 'กำลังบันทึก...';
  statusElement.className = 'tracker-status recording';

  console.log('🎬 เริ่มบันทึกตำแหน่งของสะโพก เข่า ข้อเท้า...');
  console.log(`⏰ เริ่มต้นที่: ${recordingStartTimeSeconds.toFixed(3)} วินาทีของวัน`);
  console.log(`🦵 ขาที่ยก: ${legInfo.leg_raised}`);
  console.log(`⏱️ Frame Rate: ${FRAME_RATE} FPS (${FRAME_DURATION_MS}ms/frame)`);
  
  showNotification(`เริ่มบันทึก ${legInfo.leg_raised} แล้ว (${FRAME_RATE} FPS)`, 'success');
}

/**
 * ✅ หยุดการบันทึกตำแหน่ง
 */
function stopRecording() {
  if (!isRecording) return;

  isRecording = false;
  exerciseEndTime = new Date();

  updateUI();

  const statusElement = document.getElementById('tracker-status');
  statusElement.textContent = 'บันทึกเสร็จสิ้น';
  statusElement.className = 'tracker-status';

  // แสดงส่วนเปรียบเทียบ
  const comparisonSection = document.getElementById('comparison-section');
  if (comparisonSection && initialPositions && finalPositions) {
    comparisonSection.style.display = 'block';
    showComparison('initial');
  }

  const totalTimeMs = exerciseEndTime - exerciseStartTime;
  const expectedFrames = Math.floor(totalTimeMs / FRAME_DURATION_MS);

  console.log(`⏹️ หยุดบันทึก ได้ข้อมูล ${positionData.length} เฟรม ใช้เวลา ${(totalTimeMs / 1000).toFixed(2)} วินาที`);
  console.log(`📊 คาดหวัง: ${expectedFrames} เฟรม (${FRAME_RATE} FPS)`);
  
  showNotification(`บันทึกเสร็จสิ้น ได้ข้อมูล ${positionData.length} เฟรม`, 'success');
}

/**
 * ✅ ล้างข้อมูลทั้งหมด
 */
function clearData() {
  if (confirm('คุณต้องการล้างข้อมูลทั้งหมดหรือไม่?')) {
    positionData = [];
    initialPositions = null;
    finalPositions = null;
    frameCounter = 0;
    recordingSession++;
    recordingStartTimeSeconds = null;
    
    const comparisonSection = document.getElementById('comparison-section');
    if (comparisonSection) {
      comparisonSection.style.display = 'none';
    }
    
    updateUI();
    updateSessionNumber();
    
    showNotification('ล้างข้อมูลเรียบร้อยแล้ว', 'info');
  }
}

/**
 * ✅ บันทึกตำแหน่งปัจจุบัน - 100 FPS (10ms per frame)
 */
function recordPosition(landmarks) {
  if (!isRecording || !landmarks) return;

  const currentTime = Date.now();
  const relativeTimeMs = currentTime - recordingStartTime;
  const relativeTimeSeconds = relativeTimeMs / 1000;
  
  frameCounter++;

  // ✅ คำนวณเฟรมตาม 100 FPS (1 เฟรม = 10ms)
  const frameNumber = Math.floor(relativeTimeMs / FRAME_DURATION_MS);
  const frameTimeSeconds = frameNumber * (FRAME_DURATION_MS / 1000); // เวลาที่แม่นยำตามเฟรม
  
  // สร้าง timestamp แบบเดิม (เวลาจริง) ตามวินาที
  const adjustedTime = new Date(recordingStartTime + (frameTimeSeconds * 1000));
  const timestamp = adjustedTime.toLocaleTimeString('th-TH', { 
    hour12: false, 
    hour: '2-digit',
    minute: '2-digit', 
    second: '2-digit'
  });

  // ✅ สร้างข้อมูลที่มี frame และ time_seconds
  const frameData = {
    frame: frameNumber,
    time_seconds: parseFloat(frameTimeSeconds.toFixed(3)),
    timestamp: timestamp,
    leg_raised: legInfo.leg_raised
  };

  // ✅ เพิ่มเฉพาะตำแหน่งสะโพก เข่า ข้อเท้า
  TRACKED_LANDMARKS.forEach(landmarkIndex => {
    const landmark = landmarks[landmarkIndex];
    if (landmark) {
      const landmarkName = LANDMARK_NAMES[landmarkIndex];
      frameData[`${landmarkName}_x`] = parseFloat(landmark.x.toFixed(6));
      frameData[`${landmarkName}_y`] = parseFloat(landmark.y.toFixed(6));
      frameData[`${landmarkName}_z`] = parseFloat(landmark.z.toFixed(6));
    }
  });

  // เก็บตำแหน่งเริ่มต้น (เฟรมแรก)
  if (!initialPositions) {
    initialPositions = { ...frameData };
    console.log('📍 บันทึกตำแหน่งเริ่มต้น:', initialPositions);
  }

  // อัปเดตตำแหน่งสิ้นสุด (เฟรมล่าสุด)
  finalPositions = { ...frameData };

  // เพิ่มข้อมูลเฟรมลงในอาร์เรย์
  positionData.push(frameData);

  // อัปเดต UI
  updateFrameInfo();
  updateCurrentPositionsDisplay(landmarks);
}

/**
 * ✅ อัปเดตการแสดงผลตำแหน่งปัจจุบัน
 */
function updateCurrentPositionsDisplay(landmarks) {
  const positionsDisplay = document.getElementById('positions-display');
  if (!positionsDisplay) return;

  let html = '';
  
  TRACKED_LANDMARKS.forEach(landmarkIndex => {
    const landmark = landmarks[landmarkIndex];
    if (landmark) {
      const landmarkName = LANDMARK_NAMES[landmarkIndex];
      const displayName = landmarkName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      
      html += `
        <div class="position-item">
          <div class="position-label">${displayName}</div>
          <div class="position-value">X: ${landmark.x.toFixed(3)}</div>
          <div class="position-value">Y: ${landmark.y.toFixed(3)}</div>
          <div class="position-value">Z: ${landmark.z.toFixed(3)}</div>
        </div>
      `;
    }
  });

  positionsDisplay.innerHTML = html;
}

/**
 * ✅ แสดงการเปรียบเทียบตำแหน่งเริ่มต้น-สิ้นสุด
 */
function showComparison(type) {
  if (!initialPositions || !finalPositions) return;

  // อัปเดตสถานะปุ่ม
  document.querySelectorAll('.toggle-btn').forEach(btn => btn.classList.remove('active'));
  document.getElementById(`show-${type}-btn`).classList.add('active');

  const comparisonDisplay = document.getElementById('comparison-display');
  let html = '';

  TRACKED_LANDMARKS.forEach(landmarkIndex => {
    const landmarkName = LANDMARK_NAMES[landmarkIndex];
    const displayName = landmarkName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

    let xValue, yValue, zValue;

    if (type === 'initial') {
      xValue = initialPositions[`${landmarkName}_x`];
      yValue = initialPositions[`${landmarkName}_y`];
      zValue = initialPositions[`${landmarkName}_z`];
    } else if (type === 'final') {
      xValue = finalPositions[`${landmarkName}_x`];
      yValue = finalPositions[`${landmarkName}_y`];
      zValue = finalPositions[`${landmarkName}_z`];
    } else if (type === 'delta') {
      xValue = (finalPositions[`${landmarkName}_x`] - initialPositions[`${landmarkName}_x`]).toFixed(6);
      yValue = (finalPositions[`${landmarkName}_y`] - initialPositions[`${landmarkName}_y`]).toFixed(6);
      zValue = (finalPositions[`${landmarkName}_z`] - initialPositions[`${landmarkName}_z`]).toFixed(6);
    }

    const valueClass = type === 'delta' ? 'comparison-value delta-value' : 'comparison-value';

    html += `
      <div class="comparison-item">
        <div class="comparison-label">${displayName}</div>
        <div class="${valueClass}">X: ${xValue}</div>
        <div class="${valueClass}">Y: ${yValue}</div>
        <div class="${valueClass}">Z: ${zValue}</div>
      </div>
    `;
  });

  comparisonDisplay.innerHTML = html;
}

/**
 * ✅ อัปเดตข้อมูลเฟรมและเวลา
 */
function updateFrameInfo() {
  const frameCountElement = document.getElementById('frame-count');
  const recordingTimeElement = document.getElementById('recording-time');
  const fpsElement = document.getElementById('fps-display');

  if (frameCountElement) {
    frameCountElement.textContent = positionData.length;
  }

  if (recordingTimeElement && recordingStartTime) {
    const elapsed = (Date.now() - recordingStartTime) / 1000;
    recordingTimeElement.textContent = `${elapsed.toFixed(1)} วิ`;
  }

  if (fpsElement) {
    fpsElement.textContent = FRAME_RATE.toString();
  }
}

/**
 * ✅ อัปเดตหมายเลขเซสชัน
 */
function updateSessionNumber() {
  const sessionElement = document.getElementById('session-number');
  if (sessionElement) {
    sessionElement.textContent = recordingSession;
  }
}

/**
 * ✅ อัปเดต UI ตามสถานะ
 */
function updateUI() {
  const startBtn = document.getElementById('start-recording-btn');
  const stopBtn = document.getElementById('stop-recording-btn');
  const exportBtn = document.getElementById('export-excel-btn');

  if (startBtn && stopBtn && exportBtn) {
    startBtn.disabled = isRecording;
    stopBtn.disabled = !isRecording;
    exportBtn.disabled = positionData.length === 0;
  }
}

/**
 * ✅ ส่งออกข้อมูลเป็นไฟล์ Excel - 100 FPS
 */
async function exportToExcel() {
  console.log('🚀 Starting Excel export process (100 FPS)...');
  
  if (positionData.length === 0) {
    showNotification('ไม่มีข้อมูลให้ส่งออก', 'error');
    return;
  }

  try {
    const xlsxAvailable = await checkXLSXAvailability();
    if (!xlsxAvailable) {
      throw new Error('ไลบรารี XLSX ไม่พร้อมใช้งาน กรุณารีเฟรชหน้าเว็บ');
    }

    showNotification('กำลังสร้างไฟล์ Excel...', 'info');
    console.log('📊 Creating Excel workbook...');

    const wb = XLSX.utils.book_new();

    // ✅ ชีตเดียว: ข้อมูลตำแหน่ง Hip, Knee, Ankle (100 FPS)
    console.log('📄 Creating position tracking data sheet (100 FPS)...');
    const ws = XLSX.utils.json_to_sheet(positionData);
    
    // ปรับความกว้างของคอลัมน์
    const colWidths = [
      {wch: 8},  // frame
      {wch: 12}, // time_seconds
      {wch: 12}, // timestamp
      {wch: 15}, // leg_raised
      // ตำแหน่ง Hip, Knee, Ankle (6 จุด x 3 ค่า = 18 คอลัมน์)
      {wch: 15}, {wch: 15}, {wch: 15}, // left_hip_x, y, z
      {wch: 15}, {wch: 15}, {wch: 15}, // right_hip_x, y, z
      {wch: 15}, {wch: 15}, {wch: 15}, // left_knee_x, y, z
      {wch: 15}, {wch: 15}, {wch: 15}, // right_knee_x, y, z
      {wch: 15}, {wch: 15}, {wch: 15}, // left_ankle_x, y, z
      {wch: 15}, {wch: 15}, {wch: 15}  // right_ankle_x, y, z
    ];
    
    ws['!cols'] = colWidths;
    XLSX.utils.book_append_sheet(wb, ws, "position-tracking-100fps");

    // สร้างชื่อไฟล์
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const timeStr = new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
    const filename = `position-tracking-100fps_${legInfo.leg_raised}_Session${recordingSession}_${timestamp}_${timeStr}.xlsx`;

    console.log('💾 Writing Excel file...');
    XLSX.writeFile(wb, filename);

    const totalTime = positionData.length > 0 ? positionData[positionData.length - 1].time_seconds : 0;
    
    showNotification(`ส่งออกไฟล์ ${filename} เรียบร้อยแล้ว`, 'success');
    console.log(`✅ Successfully exported ${positionData.length} frames to: ${filename}`);
    console.log(`⏱️ Total recording time: ${totalTime.toFixed(3)} seconds`);
    console.log(`📊 Frame rate: ${FRAME_RATE} FPS (${FRAME_DURATION_MS}ms per frame)`);

  } catch (error) {
    console.error('❌ Excel export error:', error);
    showNotification(`เกิดข้อผิดพลาด: ${error.message}`, 'error');
  }
}

/**
 * ✅ แสดงการแจ้งเตือน
 */
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `position-notification ${type}`;
  
  notification.innerHTML = `
    <div class="notification-content">
      <i class="fas fa-${getNotificationIcon(type)}"></i>
      <span>${message}</span>
    </div>
  `;

  document.body.appendChild(notification);
  
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 3000);
}

/**
 * ✅ ได้ไอคอนสำหรับการแจ้งเตือน
 */
function getNotificationIcon(type) {
  const icons = {
    success: 'check-circle',
    error: 'exclamation-circle',
    info: 'info-circle'
  };
  return icons[type] || 'info-circle';
}

/**
 * ✅ เชื่อมต่อกับระบบตรวจจับท่าทาง
 */
function integrateWithPoseDetection() {
  // ❌ สร้าง UI เฉพาะเมื่ออนุญาต
  if (ENABLE_POSITION_TRACKER_UI) {
    createPositionTrackerUI();
  }

  // ✅ logic ทั้งหมด “ยังอยู่”
  window.PositionTracker = {
    recordPosition,
    startRecording,
    stopRecording,
    exportToExcel,
    clearData,
    updateLegInfo: (info) => {
      Object.assign(legInfo, info);
    },
    isRecording: () => isRecording,
    getDataCount: () => positionData.length,
    getCurrentSession: () => recordingSession,
    getRecordingTime: () => {
      if (!recordingStartTime) return 0;
      return (Date.now() - recordingStartTime) / 1000;
    },
    getFrameRate: () => FRAME_RATE,
    getFrameDuration: () => FRAME_DURATION_MS
  };
}


// เริ่มต้นระบบเมื่อโหลดหน้าเว็บ
document.addEventListener('DOMContentLoaded', () => {
  integrateWithPoseDetection();
});

// ส่งออกฟังก์ชันสำหรับการใช้งานแบบ ES6 modules
export const PositionTracker = {
  recordPosition,
  startRecording,
  stopRecording,
  exportToExcel,
  clearData,
  updateLegInfo: (info) => {
    Object.assign(legInfo, info);
  },
  createPositionTrackerUI,
  integrateWithPoseDetection,
  isRecording: () => isRecording,
  getDataCount: () => positionData.length,
  getCurrentSession: () => recordingSession,
  getRecordingTime: () => {
    if (!recordingStartTime) return 0;
    return (Date.now() - recordingStartTime) / 1000;
  },
  getFrameRate: () => FRAME_RATE,
  getFrameDuration: () => FRAME_DURATION_MS
};

/*
✅ สรุปการอัปเดตเป็น 100 FPS (1 เฟรม = 10ms):

1. ✅ Frame Rate Configuration:
   - FRAME_RATE = 100 (เฟรมต่อวินาที)
   - FRAME_DURATION_MS = 10 (มิลลิวินาทีต่อเฟรม)
   - 1 วินาที = 100 เฟรม
   - 1 เฟรม = 10 มิลลิวินาที

2. ✅ Data Structure ใหม่:
   - เพิ่มคอลัมน์ "frame" (เฟรมที่คำนวณจาก relativeTimeMs / 10)
   - เพิ่มคอลัมน์ "time_seconds" (เวลาที่แม่นยำตามเฟรม)
   - timestamp (เวลาจริง)
   - leg_raised (ขาที่ยก)

3. ✅ UI Updates:
   - แสดง FPS: 100
   - เพิ่มส่วน Frame Timing Info แสดง "1 เฟรม = 10 ms" และ "1 วินาที = 100 เฟรม"
   - อัปเดตสีและสไตล์ให้เข้ากับข้อมูลการตั้งค่าใหม่

4. ✅ Excel Export:
   - ชื่อชีต: "position-tracking-100fps"
   - ชื่อไฟล์: รวม "100fps" ในชื่อไฟล์
   - คอลัมน์ลำดับ: frame, time_seconds, timestamp, leg_raised, hip/knee/ankle positions

📋 โครงสร้างไฟล์ Excel ใหม่ (100 FPS):
| frame | time_seconds | timestamp | leg_raised | left_hip_x | left_hip_y | left_hip_z | right_hip_x | right_hip_y | right_hip_z | left_knee_x | left_knee_y | left_knee_z | right_knee_x | right_knee_y | right_knee_z | left_ankle_x | left_ankle_y | left_ankle_z | right_ankle_x | right_ankle_y | right_ankle_z |
|-------|--------------|-----------|------------|------------|------------|------------|-------------|-------------|-------------|-------------|-------------|-------------|--------------|--------------|--------------|--------------|--------------|--------------|---------------|---------------|---------------|
| 0     | 0.000        | 14:30:00  | left_leg   | 0.592068   | 0.496316   | 0.130376   | 0.535730    | 0.498364    | -0.130621   | 0.585385    | 0.702803    | 0.251644    | 0.544162     | 0.723793     | -0.041109    | 0.589016     | 0.881281     | 0.500811     | 0.477771      | 0.898641      | 0.225393      |
| 1     | 0.010        | 14:30:00  | left_leg   | 0.592070   | 0.496318   | 0.130378   | 0.535732    | 0.498366    | -0.130619   | 0.585387    | 0.702805    | 0.251646    | 0.544164     | 0.723795     | -0.041107    | 0.589018     | 0.881283     | 0.500813     | 0.477773      | 0.898643      | 0.225395      |

🎯 ประโยชน์:
- ความละเอียดสูงมาก: 100 เฟรมต่อวินาที
- ความแม่นยำการจับเวลา: ทุก 10 มิลลิวินาที
- เหมาะสำหรับการวิเคราะห์การเคลื่อนไหวแบบละเอียด
- ข้อมูลครบถ้วนสำหรับการวิจัยทางกายภาพบำบัด
- สามารถตรวจจับการเปลี่ยนแปลงเล็กน้อยของท่าทาง
*/