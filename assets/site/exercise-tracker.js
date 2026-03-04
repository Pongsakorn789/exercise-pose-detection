// exercise-tracker.js
// ระบบบันทึกการออกกำลังกายและเพิ่มเสียงบรรยาย - อัปเดตสำหรับท่ายกแขนเหนือศีรษะ

/* =================================================
   PATCH: GLOBAL STATE (เพิ่ม)
   ================================================= */
window.exercisePaused = false;
window.isAchievementShown = false;

/* =================================================
   ORIGINAL CODE (ของเดิมทั้งหมด)
   ================================================= */

// ข้อมูลการออกกำลังกาย
let exerciseHistory = {
  // format: { "2025-04-07": { "exercise1": { rounds: 2, leftReps: 20, rightReps: 20 } } }
};

// 🔄 ชื่อท่าออกกำลังกาย
const exerciseNames = {
  1: "ท่าเหยียดเข่า",
  2: "ท่ายกแขนเหนือศีรษะ"
};

// สร้างหรืออัปเดต localStorage
function initializeLocalStorage() {
  if (!localStorage.getItem('exerciseHistory')) {
    localStorage.setItem('exerciseHistory', JSON.stringify(exerciseHistory));
  } else {
    try {
      exerciseHistory = JSON.parse(localStorage.getItem('exerciseHistory')) || {};
    } catch (e) {
      console.error("เกิดข้อผิดพลาดในการอ่านประวัติการออกกำลังกาย:", e);
      exerciseHistory = {};
      localStorage.setItem('exerciseHistory', JSON.stringify(exerciseHistory));
    }
  }
}

// บันทึกการออกกำลังกาย
function saveExercise(exerciseNumber, rounds, leftReps, rightReps, durationSec = 0) {
  try {
    const storedHistory = JSON.parse(localStorage.getItem('exerciseHistory')) || {};
    const today = new Date().toISOString().split('T')[0];

    if (!storedHistory[today]) {
      storedHistory[today] = {};
    }

    const exerciseKey = `exercise${exerciseNumber}`;
    if (!storedHistory[today][exerciseKey]) {
      storedHistory[today][exerciseKey] = { rounds: 0, leftReps: 0, rightReps: 0 };
    }

    storedHistory[today][exerciseKey].rounds += rounds;
    storedHistory[today][exerciseKey].leftReps += leftReps;
    storedHistory[today][exerciseKey].rightReps += rightReps;

    localStorage.setItem('exerciseHistory', JSON.stringify(storedHistory));
    exerciseHistory = storedHistory;

    const exerciseName = exerciseNames[exerciseNumber];
    const speechText =
      `บันทึกการออกกำลังกาย ${exerciseName} จำนวน ${rounds} รอบ แขนซ้าย ${leftReps} ครั้ง แขนขวา ${rightReps} ครั้ง`;

    if (window.voiceFeedbackEnabled) {
      speakFeedback(speechText);
    }

    // ⭐ เพิ่ม: บันทึก summary พร้อมกัน
    saveSummaryData(exerciseNumber, rounds, leftReps, rightReps, durationSec);

    return true;
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการบันทึกการออกกำลังกาย:", error);
    return false;
  }
}

/* =================================================
   ⭐ NEW: SUMMARY DATA FUNCTIONS (เพิ่มใหม่)
   ================================================= */

// ฟังก์ชันบันทึก summary สำหรับแสดงในหน้า summary.html
function saveSummaryData(exerciseNumber, rounds, leftReps, rightReps, durationSec = 0) {
  try {
    const today = new Date().toLocaleString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
    
    const summaryData = {
      exerciseNumber: exerciseNumber,
      exerciseName: exerciseNames[exerciseNumber] || `ท่าที่ ${exerciseNumber}`,
      rounds: rounds,
      left: leftReps,
      right: rightReps,
      total: leftReps + rightReps,
      durationSec: durationSec,
      date: today,
      timestamp: Date.now()
    };
    
    localStorage.setItem('lastSummary', JSON.stringify(summaryData));
    console.log("✅ บันทึก summary สำเร็จ:", summaryData);
    return summaryData;
  } catch (error) {
    console.error("❌ เกิดข้อผิดพลาดในการบันทึก summary:", error);
    return null;
  }
}

// ฟังก์ชันแสดงหน้า summary
function showSummaryPage() {
  const summaryData = localStorage.getItem('lastSummary');
  if (summaryData) {
    console.log("📊 กำลังเปิดหน้าสรุปผล...");
    window.location.href = 'summary.html';
  } else {
    console.warn("⚠️ ไม่พบข้อมูล summary");
    alert("ไม่พบข้อมูลการออกกำลังกาย");
  }
}

/* =================================================
   PATCH: ACHIEVEMENT CONTROL (เพิ่ม)
   ================================================= */

// แสดงหน้าดีใจ (เรียกจาก main / counter ได้)
window.showAchievement = function () {
  if (window.isAchievementShown) return;

  const achievement = document.getElementById('achievement-animation');
  if (!achievement) return;

  achievement.style.display = 'flex';
  window.exercisePaused = true;
  window.isAchievementShown = true;

  console.log('🎉 Achievement shown');
};

// ให้กด "ดำเนินการต่อ" แล้วนับต่อได้
window.resumeExercise = function () {
  console.log('▶ Resume exercise');
  window.exercisePaused = false;
  window.isAchievementShown = false;
};

/* =================================================
   ORIGINAL HISTORY / VOICE / UI CODE (เดิมทั้งหมด)
   ================================================= */

// แสดงประวัติการออกกำลังกาย
function createExerciseHistoryDisplay() {
  try {
    const storedHistory = JSON.parse(localStorage.getItem('exerciseHistory')) || {};
    const historyContainer = document.createElement('div');
    historyContainer.id = 'exercise-history-container';
    historyContainer.className = 'exercise-history-container';

    historyContainer.innerHTML = `
      <div class="history-header">
        <h3>ประวัติการออกกำลังกาย</h3>
        <button id="close-history-btn" class="action-button">ปิด</button>
      </div>
      <div class="history-content"></div>
    `;

    document.body.appendChild(historyContainer);
    document.getElementById('close-history-btn').addEventListener('click', () => {
      historyContainer.remove();
    });

    const historyContent = historyContainer.querySelector('.history-content');

    if (Object.keys(storedHistory).length === 0) {
      historyContent.innerHTML = '<p class="no-history">ยังไม่มีประวัติการออกกำลังกาย</p>';
      return;
    }

    const sortedDates = Object.keys(storedHistory)
      .sort((a, b) => new Date(b) - new Date(a));

    sortedDates.forEach(date => {
      const dateObj = new Date(date);
      const formattedDate = dateObj.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
      });

      const dailyExercises = storedHistory[date];
      const exerciseKeys = Object.keys(dailyExercises);
      if (exerciseKeys.length === 0) return;

      const daySection = document.createElement('div');
      daySection.className = 'day-section';
      daySection.innerHTML = `<h4 class="date-header">${formattedDate}</h4>`;

      exerciseKeys.forEach(exerciseKey => {
        const exerciseNum = parseInt(exerciseKey.replace('exercise', ''));
        const exerciseName = exerciseNames[exerciseNum] || `ท่าที่ ${exerciseNum}`;
        const data = dailyExercises[exerciseKey];

        const exerciseItem = document.createElement('div');
        exerciseItem.className = 'exercise-item';
        exerciseItem.innerHTML = `
          <div class="exercise-name">${exerciseName}</div>
          <div class="exercise-details">
            <div class="detail-item">รอบ: <span>${data.rounds}</span></div>
            <div class="detail-item">แขนซ้าย: <span>${data.leftReps} ครั้ง</span></div>
            <div class="detail-item">แขนขวา: <span>${data.rightReps} ครั้ง</span></div>
          </div>
        `;
        daySection.appendChild(exerciseItem);
      });

      historyContent.appendChild(daySection);
    });

  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการแสดงประวัติการออกกำลังกาย:", error);
  }
}

// ระบบเสียง
function speakFeedback(text) {
  // ==========================================================
  // ⭐ โค้ดสะพานเชื่อม: ถ้าแอปเปิดอยู่ ให้ส่งข้อความไปให้แอป Flutter พูด
  if (window.flutter_inappwebview != null) {
    window.flutter_inappwebview.callHandler('speakText', text);
    return; // ส่งเสร็จแล้วจบการทำงานตรงนี้เลย (ไม่รันโค้ดเบราว์เซอร์ต่อ)
  }
  // ==========================================================

  if (!window.speechSynthesis) return;
  if (window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel();
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'th-TH';

  setTimeout(() => {
    window.speechSynthesis.speak(utterance);
  }, 100);
}

/* =================================================
   INIT / EXPORT (ของเดิม + เพิ่มฟังก์ชันใหม่)
   ================================================= */

function initializeExerciseTracker() {
  initializeLocalStorage();
  document.addEventListener('DOMContentLoaded', () => {
    addHistoryButton();
    addToggleVoiceButton();
  });

  window.voiceFeedbackEnabled =
    localStorage.getItem('voiceFeedbackEnabled') !== 'false';

  return {
    saveExercise,
    saveSummaryData,        // ⭐ เพิ่ม
    showSummaryPage,        // ⭐ เพิ่ม
    createExerciseHistoryDisplay,
    speakFeedback
  };
}

export const exerciseTracker = {
  initialize: initializeExerciseTracker,
  saveExercise,
  saveSummaryData,          // ⭐ เพิ่ม
  showSummaryPage,          // ⭐ เพิ่ม
  speakFeedback,
  showHistory: createExerciseHistoryDisplay
};