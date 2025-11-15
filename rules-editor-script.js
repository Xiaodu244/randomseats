// 规则编辑器脚本

// 配置参数
const ROWS = 7;    // 纵向7行
const COLS = 8;    // 横向8列

// 学生姓名列表
let nameList = [];

// 限制规则
let rowRestrictions = {}; // {学生姓名: [允许的行索引数组]}
let adjacencyRestrictions = []; // [{a: 学生A, b: 学生B}, ...] 左右相邻限制
let frontBackRestrictions = []; // [{a: 学生A, b: 学生B}, ...] 前后桌限制

// DOM 元素
let passwordModal;
let mainContent;
let passwordInput;
let submitPassword;
let passwordError;
let nameListInput;
let saveNameListBtn;
let studentSelectorRow;
let allowedRowsInput;
let addRowRestrictionBtn;
let rowRestrictionsList;
let studentSelectorA;
let studentSelectorB;
let addAdjacencyRestrictionBtn;
let adjacencyRestrictionsList;
let studentSelectorC;
let studentSelectorD;
let addFrontBackRestrictionBtn;
let frontBackRestrictionsList;
let exportRulesBtn;
let clearAllRulesBtn;

// 密码（示例密码，实际应用中应该使用更安全的方式）
const CORRECT_PASSWORD = '241305117';

// 初始化DOM元素
function initDOM() {
    passwordModal = document.getElementById('passwordModal');
    mainContent = document.getElementById('mainContent');
    passwordInput = document.getElementById('passwordInput');
    submitPassword = document.getElementById('submitPassword');
    passwordError = document.getElementById('passwordError');
    nameListInput = document.getElementById('nameListInput');
    saveNameListBtn = document.getElementById('saveNameListBtn');
    studentSelectorRow = document.getElementById('studentSelectorRow');
    allowedRowsInput = document.getElementById('allowedRowsInput');
    addRowRestrictionBtn = document.getElementById('addRowRestrictionBtn');
    rowRestrictionsList = document.getElementById('rowRestrictionsList');
    studentSelectorA = document.getElementById('studentSelectorA');
    studentSelectorB = document.getElementById('studentSelectorB');
    addAdjacencyRestrictionBtn = document.getElementById('addAdjacencyRestrictionBtn');
    adjacencyRestrictionsList = document.getElementById('adjacencyRestrictionsList');
    studentSelectorC = document.getElementById('studentSelectorC');
    studentSelectorD = document.getElementById('studentSelectorD');
    addFrontBackRestrictionBtn = document.getElementById('addFrontBackRestrictionBtn');
    frontBackRestrictionsList = document.getElementById('frontBackRestrictionsList');
    exportRulesBtn = document.getElementById('exportRulesBtn');
    clearAllRulesBtn = document.getElementById('clearAllRulesBtn');
}

// 初始化事件监听
function initEvents() {
    submitPassword.addEventListener('click', validatePassword);
    passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') validatePassword();
    });
    
    saveNameListBtn.addEventListener('click', saveNameList);
    addRowRestrictionBtn.addEventListener('click', addRowRestriction);
    addAdjacencyRestrictionBtn.addEventListener('click', addAdjacencyRestriction);
    addFrontBackRestrictionBtn.addEventListener('click', addFrontBackRestriction);
    exportRulesBtn.addEventListener('click', exportRules);
    clearAllRulesBtn.addEventListener('click', clearAllRules);
}

// 初始化程序
function initApp() {
    initDOM();
    initEvents();
    loadFromLocalStorage();
}

// 验证密码
function validatePassword() {
    const password = passwordInput.value.trim();
    
    if (password === CORRECT_PASSWORD) {
        passwordModal.style.display = 'none';
        mainContent.style.display = 'block';
        updateStudentSelectors();
        updateRestrictionLists();
        passwordError.textContent = '';
    } else {
        passwordError.textContent = '密码错误，请重试';
        passwordInput.value = '';
        passwordInput.focus();
    }
}

// 保存学生姓名列表
function saveNameList() {
    const inputText = nameListInput.value.trim();
    
    if (!inputText) {
        alert('请输入学生姓名列表');
        return;
    }
    
    // 尝试按逗号、空格或换行符分割
    const names = inputText.split(/[,\s\n]+/).filter(name => name.trim() !== '');
    
    if (names.length === 0) {
        alert('没有有效的学生姓名');
        return;
    }
    
    nameList = names;
    saveToLocalStorage();
    updateStudentSelectors();
    alert(`已保存 ${names.length} 名学生`);
}

// 更新学生选择器
function updateStudentSelectors() {
    // 更新行限制学生选择器
    updateStudentSelector(studentSelectorRow);
    
    // 更新相邻限制学生选择器
    updateStudentSelector(studentSelectorA);
    updateStudentSelector(studentSelectorB);
    
    // 更新前后桌限制学生选择器
    updateStudentSelector(studentSelectorC);
    updateStudentSelector(studentSelectorD);
}

// 更新单个学生选择器
function updateStudentSelector(selector) {
    selector.innerHTML = '<option value="">请选择学生</option>';
    
    nameList.forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        selector.appendChild(option);
    });
}

// 添加行限制
function addRowRestriction() {
    const student = studentSelectorRow.value;
    const rowsInput = allowedRowsInput.value.trim();
    
    if (!student) {
        alert('请选择学生');
        return;
    }
    
    if (!rowsInput) {
        alert('请输入允许的行号');
        return;
    }
    
    // 解析行号（支持逗号分隔）
    const rows = rowsInput.split(/[,\s]+/).map(row => {
        const rowNum = parseInt(row);
        // 转换为0-indexed并验证
        if (!isNaN(rowNum) && rowNum >= 1 && rowNum <= ROWS) {
            return rowNum - 1;
        }
        return null;
    }).filter(row => row !== null);
    
    if (rows.length === 0) {
        alert('没有有效的行号');
        return;
    }
    
    // 保存限制
    rowRestrictions[student] = rows;
    saveToLocalStorage();
    updateRestrictionLists();
    
    // 清空输入
    allowedRowsInput.value = '';
    alert('行限制已添加');
}

// 添加相邻限制
function addAdjacencyRestriction() {
    const studentA = studentSelectorA.value;
    const studentB = studentSelectorB.value;
    
    if (!studentA || !studentB) {
        alert('请选择两名学生');
        return;
    }
    
    if (studentA === studentB) {
        alert('不能选择同一个学生');
        return;
    }
    
    // 检查是否已存在
    const exists = adjacencyRestrictions.some(rest => 
        (rest.a === studentA && rest.b === studentB) || 
        (rest.a === studentB && rest.b === studentA)
    );
    
    if (exists) {
        alert('此限制已存在');
        return;
    }
    
    // 添加限制
    adjacencyRestrictions.push({ a: studentA, b: studentB });
    saveToLocalStorage();
    updateRestrictionLists();
    
    alert('相邻限制已添加');
}

// 添加前后桌限制
function addFrontBackRestriction() {
    const studentA = studentSelectorC.value;
    const studentB = studentSelectorD.value;
    
    if (!studentA || !studentB) {
        alert('请选择两名学生');
        return;
    }
    
    if (studentA === studentB) {
        alert('不能选择同一个学生');
        return;
    }
    
    // 检查是否已存在
    const exists = frontBackRestrictions.some(rest => 
        (rest.a === studentA && rest.b === studentB) || 
        (rest.a === studentB && rest.b === studentA)
    );
    
    if (exists) {
        alert('此限制已存在');
        return;
    }
    
    // 添加限制
    frontBackRestrictions.push({ a: studentA, b: studentB });
    saveToLocalStorage();
    updateRestrictionLists();
    
    alert('前后桌限制已添加');
}

// 更新限制列表显示
function updateRestrictionLists() {
    updateRowRestrictionsList();
    updateAdjacencyRestrictionsList();
    updateFrontBackRestrictionsList();
}

// 更新行限制列表
function updateRowRestrictionsList() {
    rowRestrictionsList.innerHTML = '';
    
    if (Object.keys(rowRestrictions).length === 0) {
        rowRestrictionsList.innerHTML = '<p class="text-gray-500">暂无行限制</p>';
        return;
    }
    
    Object.entries(rowRestrictions).forEach(([student, rows]) => {
        const rowElement = document.createElement('div');
        rowElement.className = 'restriction-item flex justify-between items-center p-2 border-b';
        
        const textSpan = document.createElement('span');
        const rowNumbers = rows.map(row => row + 1).join(', ');
        textSpan.textContent = `${student}: 允许行 ${rowNumbers}`;
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn text-red-500 hover:text-red-700';
        deleteBtn.textContent = '删除';
        deleteBtn.addEventListener('click', () => {
            delete rowRestrictions[student];
            saveToLocalStorage();
            updateRowRestrictionsList();
        });
        
        rowElement.appendChild(textSpan);
        rowElement.appendChild(deleteBtn);
        rowRestrictionsList.appendChild(rowElement);
    });
}

// 更新相邻限制列表
function updateAdjacencyRestrictionsList() {
    adjacencyRestrictionsList.innerHTML = '';
    
    if (adjacencyRestrictions.length === 0) {
        adjacencyRestrictionsList.innerHTML = '<p class="text-gray-500">暂无相邻限制</p>';
        return;
    }
    
    adjacencyRestrictions.forEach((restriction, index) => {
        const rowElement = document.createElement('div');
        rowElement.className = 'restriction-item flex justify-between items-center p-2 border-b';
        
        const textSpan = document.createElement('span');
        textSpan.textContent = `${restriction.a} 与 ${restriction.b} 不能相邻`;
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn text-red-500 hover:text-red-700';
        deleteBtn.textContent = '删除';
        deleteBtn.addEventListener('click', () => {
            adjacencyRestrictions.splice(index, 1);
            saveToLocalStorage();
            updateAdjacencyRestrictionsList();
        });
        
        rowElement.appendChild(textSpan);
        rowElement.appendChild(deleteBtn);
        adjacencyRestrictionsList.appendChild(rowElement);
    });
}

// 更新前后桌限制列表
function updateFrontBackRestrictionsList() {
    frontBackRestrictionsList.innerHTML = '';
    
    if (frontBackRestrictions.length === 0) {
        frontBackRestrictionsList.innerHTML = '<p class="text-gray-500">暂无前后桌限制</p>';
        return;
    }
    
    frontBackRestrictions.forEach((restriction, index) => {
        const rowElement = document.createElement('div');
        rowElement.className = 'restriction-item flex justify-between items-center p-2 border-b';
        
        const textSpan = document.createElement('span');
        textSpan.textContent = `${restriction.a} 与 ${restriction.b} 不能前后桌`;
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn text-red-500 hover:text-red-700';
        deleteBtn.textContent = '删除';
        deleteBtn.addEventListener('click', () => {
            frontBackRestrictions.splice(index, 1);
            saveToLocalStorage();
            updateFrontBackRestrictionsList();
        });
        
        rowElement.appendChild(textSpan);
        rowElement.appendChild(deleteBtn);
        frontBackRestrictionsList.appendChild(rowElement);
    });
}

// 导出规则
function exportRules() {
    // 确保学生名单不为空
    if (nameList.length === 0) {
        alert('请先添加学生名单');
        return;
    }
    
    // 准备导出数据（包含学生名单和所有规则）
    const exportData = {
        nameList: nameList,
        rowRestrictions: rowRestrictions,
        adjacencyRestrictions: adjacencyRestrictions,
        frontBackRestrictions: frontBackRestrictions,
        exportDate: new Date().toISOString()
    };
    
    // 导出为JSON文件
    downloadJSON(exportData, 'seating_rules.json');
    alert('规则导出成功');
}

// 清除所有数据（包括学生名单和规则）
function clearAllRules() {
    if (confirm('确定要清除所有数据（包括学生名单和所有规则）吗？')) {
        nameList = [];
        rowRestrictions = {};
        adjacencyRestrictions = [];
        frontBackRestrictions = [];
        
        // 清空输入框
        nameListInput.value = '';
        allowedRowsInput.value = '';
        
        // 保存并更新UI
        saveToLocalStorage();
        updateStudentSelectors();
        updateRestrictionLists();
        
        alert('所有数据已清除');
    }
}

// 保存到本地存储
function saveToLocalStorage() {
    localStorage.setItem('ruleEditorNameList', encrypt(nameList));
    localStorage.setItem('ruleEditorRowRestrictions', encrypt(rowRestrictions));
    localStorage.setItem('ruleEditorAdjacencyRestrictions', encrypt(adjacencyRestrictions));
    localStorage.setItem('ruleEditorFrontBackRestrictions', encrypt(frontBackRestrictions));
}

// 从本地存储加载
function loadFromLocalStorage() {
    try {
        if (localStorage.getItem('ruleEditorNameList')) {
            nameList = decrypt(localStorage.getItem('ruleEditorNameList'));
            nameListInput.value = nameList.join('\n');
        }
        
        if (localStorage.getItem('ruleEditorRowRestrictions')) {
            rowRestrictions = decrypt(localStorage.getItem('ruleEditorRowRestrictions'));
        }
        
        if (localStorage.getItem('ruleEditorAdjacencyRestrictions')) {
            adjacencyRestrictions = decrypt(localStorage.getItem('ruleEditorAdjacencyRestrictions'));
        }
        
        if (localStorage.getItem('ruleEditorFrontBackRestrictions')) {
            frontBackRestrictions = decrypt(localStorage.getItem('ruleEditorFrontBackRestrictions'));
        }
    } catch (e) {
        console.error('Failed to load from localStorage', e);
    }
}

// 页面加载完成后初始化
window.addEventListener('DOMContentLoaded', initApp);