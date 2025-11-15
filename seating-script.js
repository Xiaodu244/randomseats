// 座位安排主程序脚本

// 配置参数
const ROWS = 7;    // 纵向7行
const COLS = 8;    // 横向8列
let teacherDeskOnTop = true; // 讲台初始在上方
let currentSeating = []; // 当前座位安排
let nameSize = 16; // 姓名字号，默认16px
let nameList = []; // 学生姓名列表，从导入文件获取
let fixedSeats = {}; // 固定座位 {学生姓名: 座位索引}

// 学生历史记录
let studentHistory = {};

// 限制规则
let rowRestrictions = {}; // {学生姓名: [允许的行索引数组]}
let adjacencyRestrictions = []; // [{a: 学生A, b: 学生B}, ...] 左右相邻限制
let frontBackRestrictions = []; // [{a: 学生A, b: 学生B}, ...] 前后桌限制

// DOM 元素
let seatingGrid;
let nameSizeSlider;
let nameSizeValue;
let toggleDeskBtn;
let importRulesBtn;
let clearRulesBtn;
let rulesFileInput;
let settingsModal;
let closeSettings;
let showSettingsBtn;
let seatingSection;
let verticalShift;
let horizontalShift;
let shiftSeatsBtn;
let seatHistoryModal;
let closeHistory;
let historyContent;
let screenshotBtn;
let refreshBtn;
let loadLastSeatingBtn;

// 初始化DOM元素
function initDOM() {
    seatingGrid = document.getElementById('seatingGrid');
    nameSizeSlider = document.getElementById('nameSizeSlider');
    nameSizeValue = document.getElementById('nameSizeValue');
    toggleDeskBtn = document.getElementById('toggleDeskBtn');
    importRulesBtn = document.getElementById('importRulesBtn');
    clearRulesBtn = document.getElementById('clearRulesBtn');
    rulesFileInput = document.getElementById('rulesFileInput');
    settingsModal = document.getElementById('settingsModal');
    closeSettings = document.getElementById('closeSettings');
    showSettingsBtn = document.getElementById('showSettingsBtn');
    seatingSection = document.getElementById('seatingSection');
    verticalShift = document.getElementById('verticalShift');
    horizontalShift = document.getElementById('horizontalShift');
    shiftSeatsBtn = document.getElementById('shiftSeatsBtn');
    seatHistoryModal = document.getElementById('seatHistoryModal');
    closeHistory = document.getElementById('closeHistory');
    historyContent = document.getElementById('historyContent');
    screenshotBtn = document.getElementById('screenshotBtn');
    refreshBtn = document.getElementById('refreshBtn');
    loadLastSeatingBtn = document.getElementById('loadLastSeatingBtn');
}

// 初始化事件监听
function initEvents() {
    showSettingsBtn.addEventListener('click', openSettingsModal);
    closeSettings.addEventListener('click', closeSettingsModal);
    nameSizeSlider.addEventListener('input', adjustNameSize);
    shiftSeatsBtn.addEventListener('click', shiftSeats);
    toggleDeskBtn.addEventListener('click', toggleTeacherDeskPosition);
    importRulesBtn.addEventListener('click', importRules);
    clearRulesBtn.addEventListener('click', clearAllRules);
    closeHistory.addEventListener('click', closeSeatHistory);
    screenshotBtn.addEventListener('click', takeScreenshot);
    refreshBtn.addEventListener('click', refreshSeating);
    loadLastSeatingBtn.addEventListener('click', loadLastSeating);
    
    // 初始化键盘事件
    document.addEventListener('keydown', handleKeyPress);
}

// 初始化程序
function initApp() {
    initDOM();
    initEvents();
    loadFromCookies();
    generateSeating();
    adjustNameSize();
}

// 生成座位布局
function generateSeating() {
    seatingGrid.innerHTML = '';
    createSeats();
    updateDeskPosition();
}

// 创建座位
function createSeats() {
    seatingGrid.style.gridTemplateColumns = `repeat(${COLS}, 1fr)`;
    
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            const seatIndex = row * COLS + col;
            const seatElement = document.createElement('div');
            seatElement.className = 'seat-container relative mb-4';
            
            const seatInner = document.createElement('div');
            seatInner.className = 'seat bg-white';
            seatInner.style.fontSize = `${nameSize}px`;
            
            if (currentSeating[seatIndex] && currentSeating[seatIndex] !== '') {
                seatInner.textContent = currentSeating[seatIndex];
                seatInner.classList.add('occupied');
                
                // 检查是否是固定座位
                if (fixedSeats[currentSeating[seatIndex]]) {
                    seatInner.classList.add('fixed');
                }
                
                // 添加点击事件查看历史和切换固定状态
                seatInner.addEventListener('click', (e) => {
                    const student = currentSeating[seatIndex];
                    // 双击切换固定状态
                    if (e.detail === 2) {
                        const isFixed = toggleSeatFixed(student);
                        createSeats(); // 重新生成以更新样式
                        alert(`${student} 已${isFixed ? '固定' : '取消固定'}`);
                    } else {
                        // 单击显示历史
                        showSeatHistory(student);
                    }
                });
            }
            
            seatElement.appendChild(seatInner);
            seatingGrid.appendChild(seatElement);
        }
    }
}

// 刷新座位安排
function refreshSeating() {
    // 创建所有座位索引的数组
    const allSeats = Array.from({length: ROWS * COLS}, (_, i) => i);
    
    // 创建新的座位安排
    const newSeating = new Array(ROWS * COLS).fill('');
    
    // 首先处理固定座位的学生
    for (const [student, seatIndex] of Object.entries(fixedSeats)) {
        if (nameList.includes(student) && seatIndex >= 0 && seatIndex < ROWS * COLS) {
            newSeating[seatIndex] = student;
            // 从可用座位中移除
            const seatPos = allSeats.indexOf(seatIndex);
            if (seatPos !== -1) {
                allSeats.splice(seatPos, 1);
            }
        }
    }
    
    // 复制姓名列表，排除已固定的学生
    let availableStudents = nameList.filter(student => !fixedSeats[student]);
    
    // 为有保底机制的学生优先分配座位
    const studentsNeedingGuarantee = checkGuaranteeNeeded().filter(student => !fixedSeats[student]);
    
    // 先处理需要保底的学生
    studentsNeedingGuarantee.forEach(student => {
        const allowedRows = rowRestrictions[student] || [];
        let possibleSeats = [];
        
        if (allowedRows.length > 0) {
            // 如果有行限制，只考虑允许的行
            allowedRows.forEach(rowIndex => {
                for (let col = 0; col < COLS; col++) {
                    const seatIndex = rowIndex * COLS + col;
                    if (allSeats.includes(seatIndex)) {
                        possibleSeats.push(seatIndex);
                    }
                }
            });
        } else {
            // 没有行限制，考虑所有可用座位
            possibleSeats = [...allSeats];
        }
        
        // 排除最后一排（保底机制）
        possibleSeats = possibleSeats.filter(seatIndex => Math.floor(seatIndex / COLS) !== ROWS - 1);
        
        if (possibleSeats.length > 0) {
            const randomIndex = Math.floor(Math.random() * possibleSeats.length);
            const selectedSeat = possibleSeats[randomIndex];
            
            newSeating[selectedSeat] = student;
            const studentPos = availableStudents.indexOf(student);
            if (studentPos !== -1) {
                availableStudents.splice(studentPos, 1);
            }
            const seatPos = allSeats.indexOf(selectedSeat);
            if (seatPos !== -1) {
                allSeats.splice(seatPos, 1);
            }
        }
    });
    
    // 随机打乱剩余学生和座位
    availableStudents = shuffleArray(availableStudents);
    const shuffledSeats = shuffleArray(allSeats);
    
    // 为剩余学生分配座位，尝试满足规则
    let attempts = 0;
    const maxAttempts = 100;
    
    while (availableStudents.length > 0 && shuffledSeats.length > 0 && attempts < maxAttempts) {
        attempts++;
        let assigned = false;
        
        for (let i = 0; i < availableStudents.length; i++) {
            const student = availableStudents[i];
            
            // 尝试找到符合所有规则的座位
            for (let j = 0; j < shuffledSeats.length; j++) {
                const seatIndex = shuffledSeats[j];
                
                if (checkSeatValidity(student, seatIndex, newSeating)) {
                    newSeating[seatIndex] = student;
                    availableStudents.splice(i, 1);
                    shuffledSeats.splice(j, 1);
                    assigned = true;
                    break;
                }
            }
            
            if (assigned) break;
        }
        
        // 如果没有分配成功，随机分配一个座位（兜底策略）
        if (!assigned && shuffledSeats.length > 0 && availableStudents.length > 0) {
            const student = availableStudents[0];
            const seatIndex = shuffledSeats[0];
            
            newSeating[seatIndex] = student;
            availableStudents.shift();
            shuffledSeats.shift();
        }
    }
    
    // 更新座位安排
    currentSeating = newSeating;
    
    // 更新学生历史记录
    updateStudentHistory();
    
    // 重新生成座位显示
    createSeats();
    
    // 保存到Cookie
    saveToCookies();
}

// 检查座位分配是否有效
function checkSeatValidity(student, seatIndex, seating) {
    const row = Math.floor(seatIndex / COLS);
    const col = seatIndex % COLS;
    
    // 检查行限制
    const allowedRows = rowRestrictions[student] || [];
    if (allowedRows.length > 0 && !allowedRows.includes(row)) {
        return false;
    }
    
    // 检查相邻限制（左右）
    // 检查左侧
    if (col > 0) {
        const leftIndex = seatIndex - 1;
        const leftStudent = seating[leftIndex];
        if (leftStudent && hasAdjacencyRestriction(student, leftStudent)) {
            return false;
        }
    }
    
    // 检查右侧
    if (col < COLS - 1) {
        const rightIndex = seatIndex + 1;
        const rightStudent = seating[rightIndex];
        if (rightStudent && hasAdjacencyRestriction(student, rightStudent)) {
            return false;
        }
    }
    
    // 检查前后桌限制
    // 检查前一行
    if (row > 0) {
        const frontIndex = (row - 1) * COLS + col;
        const frontStudent = seating[frontIndex];
        if (frontStudent && hasFrontBackRestriction(student, frontStudent)) {
            return false;
        }
    }
    
    // 检查后一行
    if (row < ROWS - 1) {
        const backIndex = (row + 1) * COLS + col;
        const backStudent = seating[backIndex];
        if (backStudent && hasFrontBackRestriction(student, backStudent)) {
            return false;
        }
    }
    
    return true;
}

// 检查是否有相邻限制
function hasAdjacencyRestriction(studentA, studentB) {
    return adjacencyRestrictions.some(rest => 
        (rest.a === studentA && rest.b === studentB) || 
        (rest.a === studentB && rest.b === studentA)
    );
}

// 检查是否有前后桌限制
function hasFrontBackRestriction(studentA, studentB) {
    return frontBackRestrictions.some(rest => 
        (rest.a === studentA && rest.b === studentB) || 
        (rest.a === studentB && rest.b === studentA)
    );
}

// 更新学生历史记录
function updateStudentHistory() {
    currentSeating.forEach((student, index) => {
        if (student && student !== '') {
            const row = Math.floor(index / COLS);
            
            if (!studentHistory[student]) {
                studentHistory[student] = [];
            }
            
            studentHistory[student].push(row);
            
            // 只保留最近10次的记录
            if (studentHistory[student].length > 10) {
                studentHistory[student].shift();
            }
        }
    });
}

// 检查哪些学生需要保底
function checkGuaranteeNeeded() {
    const result = [];
    
    nameList.forEach(student => {
        if (!studentHistory[student]) return;
        
        // 检查最近两次是否都在最后一排
        const history = studentHistory[student];
        if (history.length >= 2) {
            const lastRow = ROWS - 1;
            if (history[history.length - 1] === lastRow && 
                history[history.length - 2] === lastRow) {
                result.push(student);
            }
        }
    });
    
    return result;
}

// 切换讲台位置
function toggleTeacherDeskPosition() {
    teacherDeskOnTop = !teacherDeskOnTop;
    updateDeskPosition();
    saveToCookies();
}

// 更新讲台位置显示
function updateDeskPosition() {
    const deskElement = document.getElementById('teacherDesk');
    if (!deskElement) return;
    
    if (teacherDeskOnTop) {
        // 讲台在上方
        seatingSection.style.flexDirection = 'column';
        deskElement.style.marginBottom = '2rem';
        deskElement.style.marginTop = '0';
    } else {
        // 讲台在下方
        seatingSection.style.flexDirection = 'column-reverse';
        deskElement.style.marginBottom = '0';
        deskElement.style.marginTop = '2rem';
    }
}

// 调整姓名字号
function adjustNameSize() {
    nameSize = parseInt(nameSizeSlider.value);
    nameSizeValue.textContent = `${nameSize}px`;
    
    const seats = document.querySelectorAll('.seat');
    seats.forEach(seat => {
        seat.style.fontSize = `${nameSize}px`;
    });
    
    saveToCookies();
}

// 座位平移功能
function shiftSeats() {
    const vShift = parseInt(verticalShift.value);
    const hShift = parseInt(horizontalShift.value);
    
    if (vShift === 0 && hShift === 0) {
        alert('请选择平移方向和距离');
        return;
    }
    
    const newSeating = new Array(ROWS * COLS).fill('');
    
    // 遍历所有座位
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            const currentIndex = row * COLS + col;
            const student = currentSeating[currentIndex];
            
            if (student && student !== '') {
                // 计算新位置
                let newRow = row + vShift;
                let newCol = col - hShift; // 注意：这里减号是因为向右平移时，原来的学生应该向右移动
                
                // 处理讲台位置的反转
                if (!teacherDeskOnTop) {
                    newRow = ROWS - 1 - newRow;
                }
                
                // 检查是否在有效范围内
                if (newRow >= 0 && newRow < ROWS && newCol >= 0 && newCol < COLS) {
                    // 再次处理讲台位置的反转
                    if (!teacherDeskOnTop) {
                        newRow = ROWS - 1 - newRow;
                    }
                    
                    const newIndex = newRow * COLS + newCol;
                    newSeating[newIndex] = student;
                    
                    // 更新固定座位位置
                    if (fixedSeats[student]) {
                        fixedSeats[student] = newIndex;
                    }
                } else {
                    // 如果超出范围，保持原位置
                    newSeating[currentIndex] = student;
                }
            }
        }
    }
    
    // 更新座位
    currentSeating = newSeating;
    generateSeating();
    saveToCookies();
    alert('座位平移完成');
}

// 切换座位固定状态
function toggleSeatFixed(student) {
    if (fixedSeats[student]) {
        delete fixedSeats[student];
        return false;
    } else {
        // 找到学生当前的座位索引
        const seatIndex = currentSeating.indexOf(student);
        if (seatIndex !== -1) {
            fixedSeats[student] = seatIndex;
            return true;
        }
        return false;
    }
}

// 导入姓名与规则
function importRules() {
    loadJSONFile(rulesFileInput, (error, data) => {
        if (error) {
            console.error('导入失败:', error);
            alert('导入失败，请检查文件格式');
            return;
        }
        
        if (data.nameList && data.rowRestrictions) {
            // 导入学生姓名
            nameList = data.nameList;
            
            // 导入规则
            rowRestrictions = data.rowRestrictions;
            adjacencyRestrictions = data.adjacencyRestrictions || [];
            frontBackRestrictions = data.frontBackRestrictions || [];
            
            // 为新学生初始化历史记录
            nameList.forEach(student => {
                if (!studentHistory[student]) {
                    studentHistory[student] = [];
                }
            });
            
            // 清空固定座位和当前座位
            fixedSeats = {};
            currentSeating = [];
            
            // 刷新座位
            refreshSeating();
            saveToCookies();
            alert('姓名和规则导入成功');
        } else {
            alert('无效的文件，请使用规则编辑器生成');
        }
    });
}

// 清除所有数据
function clearAllRules() {
    if (confirm('确定要清除所有数据（包括姓名、规则和座位安排）吗？')) {
        nameList = [];
        rowRestrictions = {};
        adjacencyRestrictions = [];
        frontBackRestrictions = [];
        fixedSeats = {};
        currentSeating = [];
        generateSeating();
        saveToCookies();
        alert('所有数据已清除');
    }
}

// 显示座位历史
function showSeatHistory(student) {
    if (!student || !studentHistory[student] || studentHistory[student].length === 0) {
        historyContent.innerHTML = '<p class="text-gray-500">暂无历史记录</p>';
    } else {
        const historyHTML = `
            <h4 class="font-semibold mb-2">${student} 的座位历史</h4>
            <ul class="space-y-1">
                ${studentHistory[student].map((row, index) => 
                    `<li>第${studentHistory[student].length - index}次：第${row + 1}行</li>`
                ).join('')}
            </ul>
        `;
        historyContent.innerHTML = historyHTML;
    }
    
    openModal(seatHistoryModal);
}

// 关闭座位历史模态框
function closeSeatHistory() {
    closeModal(seatHistoryModal);
}

// 打开设置模态框
function openSettingsModal() {
    openModal(settingsModal);
}

// 关闭设置模态框
function closeSettingsModal() {
    closeModal(settingsModal);
}

// 保存数据到Cookie
function saveToCookies() {
    setCookie('seatNames', encrypt(nameList));
    setCookie('studentHistory', encrypt(studentHistory));
    setCookie('rowRestrictions', encrypt(rowRestrictions));
    setCookie('adjacencyRestrictions', encrypt(adjacencyRestrictions));
    setCookie('frontBackRestrictions', encrypt(frontBackRestrictions));
    setCookie('teacherDeskOnTop', encrypt(teacherDeskOnTop));
    setCookie('currentSeating', encrypt(currentSeating));
    setCookie('nameSize', encrypt(nameSize));
    setCookie('fixedSeats', encrypt(fixedSeats));
}

// 从Cookie加载数据
function loadFromCookies() {
    if (getCookie('seatNames')) {
        try {
            nameList = decrypt(getCookie('seatNames'));
        } catch (e) {
            console.error('Failed to decrypt seat names', e);
        }
    }
    
    if (getCookie('studentHistory')) {
        try {
            studentHistory = decrypt(getCookie('studentHistory'));
        } catch (e) {
            console.error('Failed to decrypt student history', e);
        }
    }
    
    if (getCookie('rowRestrictions')) {
        try {
            rowRestrictions = decrypt(getCookie('rowRestrictions'));
        } catch (e) {
            console.error('Failed to decrypt row restrictions', e);
        }
    }
    
    if (getCookie('adjacencyRestrictions')) {
        try {
            adjacencyRestrictions = decrypt(getCookie('adjacencyRestrictions'));
        } catch (e) {
            console.error('Failed to decrypt adjacency restrictions', e);
        }
    }
    
    if (getCookie('frontBackRestrictions')) {
        try {
            frontBackRestrictions = decrypt(getCookie('frontBackRestrictions'));
        } catch (e) {
            console.error('Failed to decrypt front-back restrictions', e);
        }
    }
    
    if (getCookie('teacherDeskOnTop')) {
        try {
            teacherDeskOnTop = decrypt(getCookie('teacherDeskOnTop'));
        } catch (e) {
            console.error('Failed to decrypt teacher desk position', e);
        }
    }
    
    if (getCookie('currentSeating')) {
        try {
            currentSeating = decrypt(getCookie('currentSeating'));
        } catch (e) {
            console.error('Failed to decrypt current seating', e);
        }
    }
    
    if (getCookie('nameSize')) {
        try {
            nameSize = decrypt(getCookie('nameSize'));
            nameSizeSlider.value = nameSize;
        } catch (e) {
            console.error('Failed to decrypt name size', e);
        }
    }
    
    if (getCookie('fixedSeats')) {
        try {
            fixedSeats = decrypt(getCookie('fixedSeats'));
        } catch (e) {
            console.error('Failed to decrypt fixed seats', e);
        }
    }
}

// 加载上次座位安排
function loadLastSeating() {
    if (currentSeating.length === 0 || currentSeating.every(seat => seat === '')) {
        alert('没有上次的座位安排');
        return;
    }
    
    generateSeating();
    alert('已加载上次座位安排');
}

// 截图功能
function takeScreenshot() {
    alert('截图功能需要额外的库支持，此处仅作示例');
    // 实际项目中可以使用html2canvas等库实现
}

// 处理键盘事件
function handleKeyPress(e) {
    // F5刷新座位
    if (e.key === 'F5' && !e.ctrlKey) {
        e.preventDefault();
        refreshSeating();
    }
    
    // S键打开设置（需按住Ctrl）
    if (e.key === 's' && e.ctrlKey) {
        e.preventDefault();
        openSettingsModal();
    }
}

// 页面加载完成后初始化
window.addEventListener('DOMContentLoaded', initApp);