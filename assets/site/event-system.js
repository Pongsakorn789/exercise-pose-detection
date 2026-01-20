// event-system.js
// ระบบการสื่อสารข้อมูลระหว่างโมดูลใช้ Event

/**
 * ระบบการจัดการเหตุการณ์สำหรับการสื่อสารระหว่างโมดูล
 * ใช้ Custom Event ในการส่งข้อมูลระหว่างโมดูลต่างๆ
 */

// ชนิดของเหตุการณ์ที่ใช้ในระบบ
const EventTypes = {
    // การอัพเดตตัวนับ
    UPDATE_COUNTER: 'updateCounter',
    
    // การทำครบรอบ
    ROUND_COMPLETED: 'roundCompleted',
    
    // แสดงความสำเร็จ
    SHOW_ACHIEVEMENT: 'showAchievement',
    
    // การกำหนดค่าเริ่มต้นใหม่
    RESET_COUNTERS: 'resetCounters',
    
    // อัพเดตค่าพารามิเตอร์
    UPDATE_PARAMS: 'updateParams',
    
    // แสดงข้อความสถานะ
    UPDATE_STATUS: 'updateStatus'
  };
  
  /**
   * ฟังก์ชันสร้างและส่งเหตุการณ์
   * @param {string} eventType ชนิดของเหตุการณ์
   * @param {Object} detail ข้อมูลที่จะส่งไปกับเหตุการณ์
   */
  function dispatchCustomEvent(eventType, detail = {}) {
    console.log(`Dispatching event: ${eventType}`, detail);
    const event = new CustomEvent(eventType, { detail });
    document.dispatchEvent(event);
  }
  
  /**
   * ส่งคำสั่งให้อัพเดตตัวนับ
   * @param {Object} counters ข้อมูลตัวนับที่จะอัพเดต (optional)
   */
  function updateCounter(counters = null) {
    dispatchCustomEvent(EventTypes.UPDATE_COUNTER, counters);
  }
  
  /**
   * ส่งข้อมูลการทำครบรอบ
   * @param {number} exerciseNumber หมายเลขท่าออกกำลังกาย (1)
   * @param {number} rounds จำนวนรอบที่ทำเสร็จ
   * @param {number} leftReps จำนวนครั้งของขาซ้าย
   * @param {number} rightReps จำนวนครั้งของขาขวา
   */
  function roundCompleted(exerciseNumber, rounds, leftReps = 0, rightReps = 0) {
    dispatchCustomEvent(EventTypes.ROUND_COMPLETED, {
      exerciseNumber,
      rounds,
      leftReps,
      rightReps,
      duration: 0
    });
  }
  
  /**
   * ส่งคำสั่งให้แสดงความสำเร็จ
   */
  function showAchievement() {
    dispatchCustomEvent(EventTypes.SHOW_ACHIEVEMENT);
  }
  
  /**
   * ส่งคำสั่งให้รีเซ็ตตัวนับ
   */
  function resetCounters() {
    dispatchCustomEvent(EventTypes.RESET_COUNTERS);
  }
  
  /**
   * ส่งคำสั่งให้อัพเดตพารามิเตอร์การทำงาน
   * @param {Object} params พารามิเตอร์ที่จะอัพเดต
   */
  function updateParams(params) {
    dispatchCustomEvent(EventTypes.UPDATE_PARAMS, params);
  }
  
  /**
   * ส่งคำสั่งให้อัพเดตข้อความสถานะ
   * @param {string} message ข้อความสถานะ
   * @param {string} color สีของข้อความ (hex หรือ css color name)
   */
  function updateStatus(message, color = '#4CAF50') {
    dispatchCustomEvent(EventTypes.UPDATE_STATUS, { message, color });
  }
  
  /**
   * ตรวจสอบการทำครบรอบ
   * @param {number} leftReps จำนวนครั้งของขาซ้าย
   * @param {number} rightReps จำนวนครั้งของขาขวา
   * @param {number} targetReps จำนวนครั้งเป้าหมาย
   * @returns {boolean} ผลการตรวจสอบ
   */
  function checkRoundCompletion(leftReps, rightReps, targetReps) {
    return leftReps >= targetReps && rightReps >= targetReps;
  }
  
  // ส่งออกฟังก์ชันและค่าคงที่
  export const EventSystem = {
    EventTypes,
    updateCounter,
    roundCompleted,
    showAchievement,
    resetCounters,
    updateParams,
    updateStatus,
    checkRoundCompletion
  };