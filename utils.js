// 工具函数库

// Cookie操作函数
function setCookie(name, value, days = 30) {
    const d = new Date();
    d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = "expires=" + d.toUTCString();
    document.cookie = name + "=" + value + ";" + expires + ";path=/";
}

function getCookie(name) {
    const cname = name + "=";
    const decodedCookie = decodeURIComponent(document.cookie);
    const ca = decodedCookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(cname) == 0) {
            return c.substring(cname.length, c.length);
        }
    }
    return "";
}

// 简单的加密解密函数（用于本地存储）
function encrypt(data) {
    return btoa(JSON.stringify(data));
}

function decrypt(data) {
    return JSON.parse(atob(data));
}

// 模态框操作函数
function openModal(modalElement) {
    modalElement.classList.remove('hidden');
    modalElement.classList.add('flex');
    // 防止背景滚动
    document.body.style.overflow = 'hidden';
}

function closeModal(modalElement) {
    modalElement.classList.add('hidden');
    modalElement.classList.remove('flex');
    // 恢复背景滚动
    document.body.style.overflow = 'auto';
}

// 导出为JSON文件
function exportJSON(data, filename) {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'export.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// 加载JSON文件
function loadJSONFile(inputElement, callback) {
    inputElement.onchange = function(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = JSON.parse(e.target.result);
                callback(null, data);
            } catch (error) {
                callback(error);
            }
        };
        reader.readAsText(file);
    };
    inputElement.click();
}

// 复制文本到剪贴板
function copyToClipboard(text) {
    navigator.clipboard.writeText(text)
        .then(() => {
            alert('复制成功');
        })
        .catch(err => {
            console.error('复制失败:', err);
            alert('复制失败');
        });
}

// 生成随机数
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// 随机打乱数组
function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}