// exercise-history.js
// ระบบแสดงประวัติการออกกำลังกายแบบ Modal

/**
 * แสดงหน้าต่างประวัติการออกกำลังกาย
 */
function showExerciseHistory() {
  // ดึงข้อมูลจาก localStorage
  const exerciseHistory = JSON.parse(localStorage.getItem('exerciseHistory')) || {};
  
  // สร้าง Modal
  const modal = document.createElement('div');
  modal.id = 'history-modal';
  modal.className = 'history-modal';
  
  // สร้างเนื้อหา Modal
  modal.innerHTML = `
    <div class="history-modal-content">
      <div class="history-header">
        <h2>ประวัติการออกกำลังกาย</h2>
        <button class="history-close-btn" onclick="closeExerciseHistory()">ปิด</button>
      </div>
      <div class="history-body" id="history-body">
        ${generateHistoryContent(exerciseHistory)}
      </div>
    </div>
  `;
  
  // เพิ่ม Modal ลงใน body
  document.body.appendChild(modal);
  
  // เพิ่ม CSS ถ้ายังไม่มี
  if (!document.getElementById('history-modal-styles')) {
    addHistoryStyles();
  }
}

/**
 * สร้างเนื้อหาประวัติการออกกำลังกาย
 */
function generateHistoryContent(exerciseHistory) {
  // ชื่อท่าออกกำลังกายที่ถูกต้อง
  const exerciseNames = {
    1: "ท่ายกแขนเหนือศีรษะ",
    2: "ท่าที่ 2"
  };
  
  // ตรวจสอบว่ามีข้อมูลหรือไม่
  if (Object.keys(exerciseHistory).length === 0) {
    return '<div class="no-history">ยังไม่มีประวัติการออกกำลังกาย</div>';
  }
  
  // เรียงลำดับวันที่จากใหม่ไปเก่า
  const sortedDates = Object.keys(exerciseHistory).sort((a, b) => {
    return new Date(b) - new Date(a);
  });
  
  let html = '';
  
  sortedDates.forEach(date => {
    // แปลงวันที่เป็นภาษาไทย
    const dateObj = new Date(date);
    const thaiDate = dateObj.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
    
    html += `<div class="history-date-section">`;
    html += `<h3 class="history-date">${thaiDate}</h3>`;
    
    // แสดงแต่ละท่าออกกำลังกาย
    const exercises = exerciseHistory[date];
    Object.keys(exercises).forEach(exerciseKey => {
      const exerciseNum = parseInt(exerciseKey.replace('exercise', ''));
      const exerciseName = exerciseNames[exerciseNum] || `ท่าที่ ${exerciseNum}`;
      const data = exercises[exerciseKey];
      
      html += `
        <div class="history-exercise-card">
          <h4 class="exercise-name">${exerciseName}</h4>
          <div class="exercise-stats">
            <div class="stat-row">
              <span class="stat-label">รอบ:</span>
              <span class="stat-value">${data.rounds}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">ขาซ้าย:</span>
              <span class="stat-value">${data.leftReps} ครั้ง</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">ขาขวา:</span>
              <span class="stat-value">${data.rightReps} ครั้ง</span>
            </div>
          </div>
        </div>
      `;
    });
    
    html += `</div>`;
  });
  
  return html;
}

/**
 * ปิดหน้าต่างประวัติ
 */
function closeExerciseHistory() {
  const modal = document.getElementById('history-modal');
  if (modal) {
    modal.remove();
  }
}

/**
 * เพิ่ม CSS สำหรับ Modal
 */
function addHistoryStyles() {
  const style = document.createElement('style');
  style.id = 'history-modal-styles';
  style.textContent = `
    /* History Modal Overlay */
    .history-modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.6);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
      animation: fadeIn 0.3s ease;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    /* Modal Content */
    .history-modal-content {
      background: white;
      border-radius: 20px;
      width: 90%;
      max-width: 600px;
      max-height: 80vh;
      display: flex;
      flex-direction: column;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
      animation: slideUp 0.3s ease;
    }
    
    @keyframes slideUp {
      from {
        transform: translateY(50px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }
    
    /* Header */
    .history-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 24px;
      border-bottom: 2px solid #E5E7EB;
      background: linear-gradient(135deg, #3B82F6, #2563EB);
      border-radius: 20px 20px 0 0;
    }
    
    .history-header h2 {
      margin: 0;
      color: white;
      font-size: 22px;
      font-weight: 700;
    }
    
    .history-close-btn {
      background: rgba(255, 255, 255, 0.95);
      color: #3B82F6;
      border: none;
      padding: 10px 24px;
      border-radius: 20px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .history-close-btn:hover {
      background: white;
      transform: scale(1.05);
    }
    
    /* Body */
    .history-body {
      padding: 20px;
      overflow-y: auto;
      flex: 1;
    }
    
    .no-history {
      text-align: center;
      padding: 60px 20px;
      color: #9CA3AF;
      font-size: 18px;
    }
    
    /* Date Section */
    .history-date-section {
      margin-bottom: 30px;
    }
    
    .history-date {
      color: #3B82F6;
      font-size: 18px;
      font-weight: 700;
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 2px solid #E5E7EB;
    }
    
    /* Exercise Card */
    .history-exercise-card {
      background: #F9FAFB;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 12px;
      border: 1px solid #E5E7EB;
      transition: all 0.2s;
    }
    
    .history-exercise-card:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      transform: translateY(-2px);
    }
    
    .exercise-name {
      margin: 0 0 16px 0;
      color: #1F2937;
      font-size: 18px;
      font-weight: 600;
    }
    
    /* Stats */
    .exercise-stats {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    
    .stat-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      background: white;
      border-radius: 8px;
      border: 1px solid #E5E7EB;
    }
    
    .stat-label {
      font-size: 14px;
      color: #6B7280;
      font-weight: 500;
    }
    
    .stat-value {
      font-size: 18px;
      color: #3B82F6;
      font-weight: 700;
    }
    
    /* Mobile Responsive */
    @media (max-width: 480px) {
      .history-modal-content {
        width: 95%;
        max-height: 85vh;
      }
      
      .history-header {
        padding: 20px;
      }
      
      .history-header h2 {
        font-size: 18px;
      }
      
      .history-close-btn {
        padding: 8px 16px;
        font-size: 14px;
      }
      
      .history-body {
        padding: 16px;
      }
    }
  `;
  
  document.head.appendChild(style);
}

// Export functions
export const ExerciseHistory = {
  show: showExerciseHistory,
  close: closeExerciseHistory
};

// ทำให้ฟังก์ชันเป็น global เพื่อให้เรียกใช้จาก onclick ได้
window.showExerciseHistory = showExerciseHistory;
window.closeExerciseHistory = closeExerciseHistory;