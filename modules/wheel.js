// modules/wheel.js - 转盘模块
// 负责转盘的绘制、旋转动画和抽奖逻辑

// 转盘状态
let wheelState = {
    isSpinning: false,
    isLoaded: false,
    wheelAngle: 0,
    currentPrize: null,
    spinHistory: [],
    lastSpinTime: 0,
    spinCooldown: 2000 // 2秒冷却时间
};

// DOM元素缓存
let wheelElements = {
    container: null,
    wheelCanvas: null,
    wheelPointer: null,
    spinButton: null,
    userPoints: null,
    spinCost: null,
    prizeList: null,
    spinHistoryList: null,
    prizeModal: null
};

// 转盘配置
let wheelConfig = {
    radius: 200,
    centerX: 0,
    centerY: 0,
    colors: CONFIG.COLORS.WHEEL_COLORS,
    prizes: CONFIG.WHEEL.PRIZES,
    spinCost: CONFIG.WHEEL.SPIN_COST,
    animationDuration: CONFIG.WHEEL.ANIMATION.DURATION,
    animationEasing: CONFIG.WHEEL.ANIMATION.EASING,
    minSpins: CONFIG.WHEEL.ANIMATION.SPINS
};

/**
 * 初始化转盘模块
 */
function initWheel() {
    console.log('🎡 初始化转盘模块');
    
    // 缓存DOM元素
    cacheWheelElements();
    
    // 初始化转盘
    initializeWheel();
    
    // 初始化事件监听器
    initWheelEventListeners();
    
    // 更新显示
    updateWheelDisplay();
    
    wheelState.isLoaded = true;
    
    // 触发自定义事件
    window.dispatchEvent(new CustomEvent('wheel:initialized'));
}

/**
 * 缓存转盘相关的DOM元素
 */
function cacheWheelElements() {
    wheelElements.container = document.getElementById('wheel-container');
    wheelElements.wheelCanvas = document.getElementById('wheel-canvas');
    wheelElements.wheelPointer = document.getElementById('wheel-pointer');
    wheelElements.spinButton = document.getElementById('spin-button');
    wheelElements.userPoints = document.getElementById('wheel-user-points');
    wheelElements.spinCost = document.getElementById('wheel-spin-cost');
    wheelElements.prizeList = document.getElementById('wheel-prize-list');
    wheelElements.spinHistoryList = document.getElementById('spin-history-list');
    wheelElements.prizeModal = document.getElementById('prize-modal');
    
    // 如果元素不存在，创建它们
    if (!wheelElements.wheelCanvas) {
        createWheelCanvas();
    }
    
    if (!wheelElements.prizeList) {
        createPrizeList();
    }
    
    if (!wheelElements.spinHistoryList) {
        createSpinHistory();
    }
}

/**
 * 创建转盘画布
 */
function createWheelCanvas() {
    const container = wheelElements.container;
    if (!container) return;
    
    // 清空容器
    container.innerHTML = '';
    
    // 创建转盘容器
    const wheelWrapper = document.createElement('div');
    wheelWrapper.className = 'wheel-wrapper';
    
    // 创建画布
    const canvas = document.createElement('canvas');
    canvas.id = 'wheel-canvas';
    canvas.width = 600;
    canvas.height = 600;
    canvas.className = 'wheel-canvas';
    
    // 创建指针
    const pointer = document.createElement('div');
    pointer.id = 'wheel-pointer';
    pointer.className = 'wheel-pointer';
    pointer.innerHTML = '<i class="fas fa-caret-down"></i>';
    
    // 创建中心按钮
    const center = document.createElement('div');
    center.className = 'wheel-center';
    center.innerHTML = '<i class="fas fa-gem"></i>';
    
    // 组装转盘
    wheelWrapper.appendChild(pointer);
    wheelWrapper.appendChild(canvas);
    wheelWrapper.appendChild(center);
    
    // 创建控制面板
    const controls = document.createElement('div');
    controls.className = 'wheel-controls';
    controls.innerHTML = `
        <div class="wheel-stats">
            <div class="stat-item">
                <span class="stat-label">当前魔力</span>
                <span class="stat-value" id="wheel-user-points">0</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">消耗魔力</span>
                <span class="stat-value" id="wheel-spin-cost">${wheelConfig.spinCost}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">剩余次数</span>
                <span class="stat-value" id="wheel-remaining-spins">∞</span>
            </div>
        </div>
        <button id="spin-button" class="spin-button">
            <i class="fas fa-redo"></i>
            <span>开始祈愿 (消耗${wheelConfig.spinCost}魔力)</span>
        </button>
        <div class="wheel-hint">
            <i class="fas fa-info-circle"></i>
            <span>每日最多可以祈愿10次</span>
        </div>
    `;
    
    // 添加到容器
    container.appendChild(wheelWrapper);
    container.appendChild(controls);
    
    // 重新缓存元素
    cacheWheelElements();
}

/**
 * 创建奖品列表
 */
function createPrizeList() {
    const container = wheelElements.container;
    if (!container) return;
    
    const prizeSection = document.createElement('div');
    prizeSection.className = 'prize-section';
    prizeSection.innerHTML = `
        <h3 class="section-title">
            <i class="fas fa-gifts"></i>
            祈愿奖品
        </h3>
        <div class="prize-list" id="wheel-prize-list"></div>
    `;
    
    container.appendChild(prizeSection);
    wheelElements.prizeList = document.getElementById('wheel-prize-list');
}

/**
 * 创建抽奖历史
 */
function createSpinHistory() {
    const container = wheelElements.container;
    if (!container) return;
    
    const historySection = document.createElement('div');
    historySection.className = 'history-section';
    historySection.innerHTML = `
        <h3 class="section-title">
            <i class="fas fa-history"></i>
            祈愿记录
        </h3>
        <div class="history-list" id="spin-history-list">
            <div class="history-empty">
                <i class="fas fa-hourglass-half"></i>
                <p>还没有祈愿记录，快来试试手气吧！</p>
            </div>
        </div>
    `;
    
    container.appendChild(historySection);
    wheelElements.spinHistoryList = document.getElementById('spin-history-list');
}

/**
 * 初始化转盘
 */
function initializeWheel() {
    if (!wheelElements.wheelCanvas) {
        console.error('转盘画布不存在');
        return;
    }
    
    const canvas = wheelElements.wheelCanvas;
    const ctx = canvas.getContext('2d');
    
    // 计算中心点
    wheelConfig.centerX = canvas.width / 2;
    wheelConfig.centerY = canvas.height / 2;
    wheelConfig.radius = Math.min(canvas.width, canvas.height) / 2 - 20;
    
    // 绘制转盘
    drawWheel(ctx);
    
    // 加载抽奖历史
    loadSpinHistory();
    
    // 更新奖品列表
    updatePrizeList();
}

/**
 * 绘制转盘
 * @param {CanvasRenderingContext2D} ctx - 画布上下文
 */
function drawWheel(ctx) {
    const prizes = wheelConfig.prizes;
    const sliceAngle = (2 * Math.PI) / prizes.length;
    
    // 清空画布
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    // 绘制扇形区域
    prizes.forEach((prize, index) => {
        const startAngle = wheelState.wheelAngle + (index * sliceAngle);
        const endAngle = startAngle + sliceAngle;
        
        // 绘制扇形
        ctx.beginPath();
        ctx.moveTo(wheelConfig.centerX, wheelConfig.centerY);
        ctx.arc(wheelConfig.centerX, wheelConfig.centerY, wheelConfig.radius, startAngle, endAngle);
        ctx.closePath();
        
        // 填充颜色
        ctx.fillStyle = prize.color;
        ctx.fill();
        
        // 绘制边框
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // 绘制文字
        drawPrizeText(ctx, prize.name, startAngle, endAngle);
    });
    
    // 绘制中心圆
    ctx.beginPath();
    ctx.arc(wheelConfig.centerX, wheelConfig.centerY, 30, 0, 2 * Math.PI);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.strokeStyle = CONFIG.COLORS.ACCENT;
    ctx.lineWidth = 4;
    ctx.stroke();
    
    // 绘制中心图标
    ctx.font = '20px "Font Awesome 5 Free"';
    ctx.fillStyle = CONFIG.COLORS.ACCENT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('✨', wheelConfig.centerX, wheelConfig.centerY);
}

/**
 * 绘制奖品文字
 * @param {CanvasRenderingContext2D} ctx - 画布上下文
 * @param {string} text - 文字内容
 * @param {number} startAngle - 起始角度
 * @param {number} endAngle - 结束角度
 */
function drawPrizeText(ctx, text, startAngle, endAngle) {
    const midAngle = startAngle + (endAngle - startAngle) / 2;
    const textRadius = wheelConfig.radius * 0.7;
    
    // 计算文字位置
    const x = wheelConfig.centerX + Math.cos(midAngle) * textRadius;
    const y = wheelConfig.centerY + Math.sin(midAngle) * textRadius;
    
    // 保存上下文状态
    ctx.save();
    
    // 平移并旋转到文字位置
    ctx.translate(x, y);
    ctx.rotate(midAngle + Math.PI / 2);
    
    // 绘制文字
    ctx.font = 'bold 16px "Noto Sans SC", sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // 文字阴影
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 3;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;
    
    // 根据文字长度调整字体大小
    let fontSize = 16;
    if (text.length > 6) fontSize = 14;
    if (text.length > 8) fontSize = 12;
    ctx.font = `bold ${fontSize}px "Noto Sans SC", sans-serif`;
    
    // 分割长文本
    if (text.length > 6) {
        const half = Math.floor(text.length / 2);
        const firstHalf = text.substring(0, half);
        const secondHalf = text.substring(half);
        
        ctx.fillText(firstHalf, 0, -10);
        ctx.fillText(secondHalf, 0, 10);
    } else {
        ctx.fillText(text, 0, 0);
    }
    
    // 恢复上下文状态
    ctx.restore();
}

/**
 * 初始化事件监听器
 */
function initWheelEventListeners() {
    // 旋转按钮点击事件
    if (wheelElements.spinButton) {
        wheelElements.spinButton.addEventListener('click', handleSpinClick);
    }
    
    // 窗口大小变化时重绘转盘
    window.addEventListener('resize', debounce(handleResize, 250));
    
    // 监听魔力变化事件
    window.addEventListener('points:added', updateWheelDisplay);
    window.addEventListener('points:spent', updateWheelDisplay);
}

/**
 * 处理旋转按钮点击
 */
function handleSpinClick() {
    if (wheelState.isSpinning) {
        showNotification('转盘正在旋转中，请稍候...', 'warning');
        return;
    }
    
    // 检查冷却时间
    const now = Date.now();
    if (now - wheelState.lastSpinTime < wheelState.spinCooldown) {
        const remaining = Math.ceil((wheelState.spinCooldown - (now - wheelState.lastSpinTime)) / 1000);
        showNotification(`请等待 ${remaining} 秒后再试`, 'warning');
        return;
    }
    
    // 检查魔力是否足够
    if (!App || typeof App.spendUserPoints !== 'function') {
        showNotification('系统错误：无法获取用户信息', 'error');
        return;
    }
    
    const userPoints = App.state.userData.points;
    if (userPoints < wheelConfig.spinCost) {
        showNotification(`魔力不足！需要 ${wheelConfig.spinCost} 魔力`, 'error');
        
        // 跳转到游戏页面
        setTimeout(() => {
            App.showPage('games');
        }, 1500);
        
        return;
    }
    
    // 开始旋转
    startSpin();
}

/**
 * 开始转盘旋转
 */
function startSpin() {
    wheelState.isSpinning = true;
    wheelState.lastSpinTime = Date.now();
    
    // 更新按钮状态
    if (wheelElements.spinButton) {
        wheelElements.spinButton.disabled = true;
        wheelElements.spinButton.innerHTML = `
            <i class="fas fa-spinner fa-spin"></i>
            <span>祈愿中...</span>
        `;
    }
    
    // 消耗魔力
    if (App && typeof App.spendUserPoints === 'function') {
        App.spendUserPoints(wheelConfig.spinCost);
    }
    
    // 选择奖品（基于概率）
    const selectedPrize = selectPrizeByProbability();
    wheelState.currentPrize = selectedPrize;
    
    // 计算旋转角度
    const targetAngle = calculateTargetAngle(selectedPrize);
    const totalRotation = (wheelConfig.minSpins * 360) + targetAngle;
    
    // 开始动画
    animateWheel(totalRotation, selectedPrize);
}

/**
 * 基于概率选择奖品
 * @returns {Object} 选中的奖品
 */
function selectPrizeByProbability() {
    const prizes = wheelConfig.prizes;
    
    // 计算总概率
    const totalProbability = prizes.reduce((sum, prize) => sum + prize.PROBABILITY, 0);
    
    // 生成随机数
    const random = Math.random() * totalProbability;
    
    // 根据概率选择奖品
    let currentSum = 0;
    for (const prize of prizes) {
        currentSum += prize.PROBABILITY;
        if (random <= currentSum) {
            return prize;
        }
    }
    
    // 默认返回第一个奖品
    return prizes[0];
}

/**
 * 计算目标旋转角度
 * @param {Object} prize - 选中的奖品
 * @returns {number} 目标角度（0-360度）
 */
function calculateTargetAngle(prize) {
    const prizes = wheelConfig.prizes;
    const sliceAngle = 360 / prizes.length;
    
    // 找到奖品在转盘中的索引
    const prizeIndex = prizes.findIndex(p => p.NAME === prize.NAME);
    
    // 计算目标角度（减去90度使指针指向区域中心）
    const targetAngle = -(prizeIndex * sliceAngle + sliceAngle / 2) + 90;
    
    // 转换为0-360度
    return ((targetAngle % 360) + 360) % 360;
}

/**
 * 动画旋转转盘
 * @param {number} totalRotation - 总旋转角度
 * @param {Object} prize - 选中的奖品
 */
function animateWheel(totalRotation, prize) {
    if (!wheelElements.wheelCanvas) return;
    
    const canvas = wheelElements.wheelCanvas;
    const startTime = Date.now();
    const duration = wheelConfig.animationDuration;
    
    // 缓动函数
    function easeOut(t) {
        return 1 - Math.pow(1 - t, 3);
    }
    
    // 动画帧
    function animate() {
        const now = Date.now();
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // 计算当前角度
        const easedProgress = easeOut(progress);
        const currentRotation = totalRotation * easedProgress;
        wheelState.wheelAngle = (currentRotation * Math.PI) / 180;
        
        // 重绘制转盘
        const ctx = canvas.getContext('2d');
        drawWheel(ctx);
        
        // 继续动画或结束
        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            finishSpin(prize);
        }
    }
    
    // 开始动画
    requestAnimationFrame(animate);
}

/**
 * 完成旋转
 * @param {Object} prize - 选中的奖品
 */
function finishSpin(prize) {
    wheelState.isSpinning = false;
    
    // 保存抽奖记录
    saveSpinResult(prize);
    
    // 更新抽奖历史
    updateSpinHistory();
    
    // 更新按钮状态
    if (wheelElements.spinButton) {
        wheelElements.spinButton.disabled = false;
        wheelElements.spinButton.innerHTML = `
            <i class="fas fa-redo"></i>
            <span>开始祈愿 (消耗${wheelConfig.spinCost}魔力)</span>
        `;
    }
    
    // 显示奖品弹窗
    showPrizeModal(prize);
    
    // 播放音效（如果有）
    playSpinSound();
    
    // 触发自定义事件
    window.dispatchEvent(new CustomEvent('wheel:spun', {
        detail: { prize }
    }));
}

/**
 * 保存抽奖结果
 * @param {Object} prize - 选中的奖品
 */
function saveSpinResult(prize) {
    const spinRecord = {
        id: generateSpinId(),
        prize: prize.NAME,
        description: prize.DESCRIPTION,
        timestamp: new Date().toISOString(),
        pointsSpent: wheelConfig.spinCost
    };
    
    // 添加到历史记录
    wheelState.spinHistory.unshift(spinRecord);
    
    // 限制历史记录数量
    if (wheelState.spinHistory.length > 20) {
        wheelState.spinHistory = wheelState.spinHistory.slice(0, 20);
    }
    
    // 保存到localStorage
    saveSpinHistoryToStorage();
    
    // 更新用户统计数据
    updateUserSpinStats();
}

/**
 * 生成抽奖ID
 * @returns {string} 抽奖ID
 */
function generateSpinId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `spin_${timestamp}_${random}`;
}

/**
 * 保存抽奖历史到localStorage
 */
function saveSpinHistoryToStorage() {
    try {
        const historyKey = CONFIG.STORAGE_KEYS.USER_WHEEL_SPINS;
        localStorage.setItem(historyKey, JSON.stringify(wheelState.spinHistory));
    } catch (error) {
        console.error('保存抽奖历史失败:', error);
    }
}

/**
 * 加载抽奖历史
 */
function loadSpinHistory() {
    try {
        const historyKey = CONFIG.STORAGE_KEYS.USER_WHEEL_SPINS;
        const savedHistory = localStorage.getItem(historyKey);
        
        if (savedHistory) {
            wheelState.spinHistory = JSON.parse(savedHistory) || [];
        } else {
            wheelState.spinHistory = [];
        }
    } catch (error) {
        console.error('加载抽奖历史失败:', error);
        wheelState.spinHistory = [];
    }
}

/**
 * 更新用户抽奖统计
 */
function updateUserSpinStats() {
    if (!App || !App.state.userData) return;
    
    App.state.userData.wheelSpins = (App.state.userData.wheelSpins || 0) + 1;
    
    // 保存到localStorage
    localStorage.setItem(
        CONFIG.STORAGE_KEYS.USER_WHEEL_SPINS,
        App.state.userData.wheelSpins.toString()
    );
}

/**
 * 更新抽奖历史显示
 */
function updateSpinHistory() {
    if (!wheelElements.spinHistoryList) return;
    
    const history = wheelState.spinHistory;
    
    if (history.length === 0) {
        wheelElements.spinHistoryList.innerHTML = `
            <div class="history-empty">
                <i class="fas fa-hourglass-half"></i>
                <p>还没有祈愿记录，快来试试手气吧！</p>
            </div>
        `;
        return;
    }
    
    let historyHTML = '';
    
    history.slice(0, 10).forEach((record, index) => {
        const time = formatDateTime(record.timestamp);
        const isSpecialPrize = record.prize !== '谢谢参与';
        
        historyHTML += `
            <div class="history-item ${isSpecialPrize ? 'special-prize' : ''}">
                <div class="history-index">${index + 1}</div>
                <div class="history-details">
                    <div class="history-prize">
                        <span class="prize-name">${record.prize}</span>
                        ${isSpecialPrize ? '<span class="prize-badge">🎁</span>' : ''}
                    </div>
                    <div class="history-info">
                        <span class="history-time">${time}</span>
                        <span class="history-cost">-${record.pointsSpent}魔力</span>
                    </div>
                </div>
            </div>
        `;
    });
    
    wheelElements.spinHistoryList.innerHTML = historyHTML;
}

/**
 * 更新奖品列表显示
 */
function updatePrizeList() {
    if (!wheelElements.prizeList) return;
    
    const prizes = wheelConfig.prizes;
    let prizeHTML = '';
    
    prizes.forEach(prize => {
        const probability = prize.PROBABILITY;
        const isSpecial = probability < 10; // 小于10%概率的算特殊奖品
        
        prizeHTML += `
            <div class="prize-item ${isSpecial ? 'special' : ''}">
                <div class="prize-color" style="background-color: ${prize.color}"></div>
                <div class="prize-info">
                    <div class="prize-name">${prize.NAME}</div>
                    <div class="prize-description">${prize.DESCRIPTION}</div>
                </div>
                <div class="prize-probability">
                    <span class="probability-value">${probability}%</span>
                    <span class="probability-label">概率</span>
                </div>
            </div>
        `;
    });
    
    wheelElements.prizeList.innerHTML = prizeHTML;
}

/**
 * 更新转盘显示
 */
function updateWheelDisplay() {
    if (!wheelElements.userPoints) return;
    
    // 更新用户魔力显示
    if (App && App.state.userData) {
        wheelElements.userPoints.textContent = App.state.userData.points;
    }
    
    // 更新消耗魔力显示
    if (wheelElements.spinCost) {
        wheelElements.spinCost.textContent = wheelConfig.spinCost;
    }
    
    // 更新剩余抽奖次数
    const remainingSpinsElement = document.getElementById('wheel-remaining-spins');
    if (remainingSpinsElement) {
        const today = new Date().toDateString();
        const lastSpinDate = wheelState.spinHistory[0] ? 
            new Date(wheelState.spinHistory[0].timestamp).toDateString() : null;
        
        if (lastSpinDate === today) {
            const todaySpins = wheelState.spinHistory.filter(record => 
                new Date(record.timestamp).toDateString() === today
            ).length;
            
            const remaining = Math.max(0, 10 - todaySpins);
            remainingSpinsElement.textContent = remaining;
            
            // 如果达到上限，禁用按钮
            if (wheelElements.spinButton && remaining <= 0) {
                wheelElements.spinButton.disabled = true;
                wheelElements.spinButton.innerHTML = `
                    <i class="fas fa-ban"></i>
                    <span>今日已达上限</span>
                `;
            }
        } else {
            remainingSpinsElement.textContent = '10';
        }
    }
}

/**
 * 显示奖品弹窗
 * @param {Object} prize - 选中的奖品
 */
function showPrizeModal(prize) {
    // 如果弹窗不存在，创建它
    if (!wheelElements.prizeModal) {
        createPrizeModal();
    }
    
    const modal = wheelElements.prizeModal;
    const isSpecialPrize = prize.PROBABILITY < 10;
    
    // 更新弹窗内容
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <div class="prize-result ${isSpecialPrize ? 'special' : ''}">
                    <div class="prize-icon">
                        ${isSpecialPrize ? '🎁' : '✨'}
                    </div>
                    <h2 class="prize-title">恭喜你！</h2>
                    <p class="prize-name-large">${prize.NAME}</p>
                    <p class="prize-description">${prize.DESCRIPTION}</p>
                    ${isSpecialPrize ? `
                        <div class="prize-celebration">
                            <i class="fas fa-trophy"></i>
                            <span>获得稀有奖品！</span>
                        </div>
                    ` : ''}
                </div>
            </div>
            <div class="modal-footer">
                <button class="modal-action" id="close-modal">确定</button>
                ${isSpecialPrize ? `
                    <button class="modal-action share" id="share-prize">
                        <i class="fas fa-share-alt"></i>
                        分享喜悦
                    </button>
                ` : ''}
            </div>
        </div>
    `;
    
    // 显示弹窗
    modal.classList.add('show');
    
    // 添加弹窗事件监听器
    initModalEventListeners(prize);
    
    // 添加庆祝效果
    if (isSpecialPrize) {
        addCelebrationEffects();
    }
}

/**
 * 创建奖品弹窗
 */
function createPrizeModal() {
    const modal = document.createElement('div');
    modal.id = 'prize-modal';
    modal.className = 'modal';
    document.body.appendChild(modal);
    wheelElements.prizeModal = modal;
}

/**
 * 初始化弹窗事件监听器
 * @param {Object} prize - 选中的奖品
 */
function initModalEventListeners(prize) {
    const modal = wheelElements.prizeModal;
    if (!modal) return;
    
    // 关闭按钮
    const closeBtn = modal.querySelector('.modal-close');
    const closeModalBtn = modal.querySelector('#close-modal');
    
    if (closeBtn) {
        closeBtn.addEventListener('click', closePrizeModal);
    }
    
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closePrizeModal);
    }
    
    // 分享按钮
    const shareBtn = modal.querySelector('#share-prize');
    if (shareBtn) {
        shareBtn.addEventListener('click', () => sharePrizeResult(prize));
    }
    
    // 点击背景关闭
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closePrizeModal();
        }
    });
    
    // ESC键关闭
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('show')) {
            closePrizeModal();
        }
    });
}

/**
 * 关闭奖品弹窗
 */
function closePrizeModal() {
    if (wheelElements.prizeModal) {
        wheelElements.prizeModal.classList.remove('show');
    }
}

/**
 * 分享抽奖结果
 * @param {Object} prize - 选中的奖品
 */
function sharePrizeResult(prize) {
    const shareText = `🎉 我在桃汽水的魔力补给站抽中了【${prize.NAME}】！\n${prize.DESCRIPTION}\n\n快来和我一起收集魔力吧！`;
    
    if (navigator.share) {
        // 使用Web Share API
        navigator.share({
            title: '桃汽水の魔力补给站',
            text: shareText,
            url: window.location.href
        }).catch(error => {
            console.log('分享失败:', error);
            copyToClipboard(shareText);
        });
    } else {
        // 回退方案：复制到剪贴板
        copyToClipboard(shareText);
    }
}

/**
 * 复制文本到剪贴板
 * @param {string} text - 要复制的文本
 */
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showNotification('分享链接已复制到剪贴板！', 'success');
    }).catch(error => {
        console.error('复制失败:', error);
        showNotification('复制失败，请手动复制', 'error');
    });
}

/**
 * 添加庆祝效果
 */
function addCelebrationEffects() {
    const modal = wheelElements.prizeModal;
    if (!modal) return;
    
    // 添加庆祝动画类
    const content = modal.querySelector('.prize-result');
    if (content) {
        content.classList.add('celebrating');
    }
    
    // 添加一些庆祝元素
    for (let i = 0; i < 20; i++) {
        setTimeout(() => {
            createConfetti();
        }, i * 100);
    }
}

/**
 * 创建五彩纸屑效果
 */
function createConfetti() {
    const modal = wheelElements.prizeModal;
    if (!modal) return;
    
    const confetti = document.createElement('div');
    confetti.className = 'confetti';
    confetti.style.left = `${Math.random() * 100}%`;
    confetti.style.backgroundColor = CONFIG.COLORS.WHEEL_COLORS[
        Math.floor(Math.random() * CONFIG.COLORS.WHEEL_COLORS.length)
    ];
    confetti.style.animationDelay = `${Math.random() * 1}s`;
    
    modal.querySelector('.modal-body').appendChild(confetti);
    
    // 动画结束后移除
    setTimeout(() => {
        if (confetti.parentNode) {
            confetti.parentNode.removeChild(confetti);
        }
    }, 2000);
}

/**
 * 播放音效
 */
function playSpinSound() {
    // 这里可以添加音效播放逻辑
    // 由于是纯前端且GitHub Pages部署，暂时使用简单的音频播放方案
    // 可以替换为实际的音效文件
    console.log('播放转盘音效');
}

/**
 * 处理窗口大小变化
 */
function handleResize() {
    if (!wheelElements.wheelCanvas || !wheelState.isLoaded) return;
    
    const canvas = wheelElements.wheelCanvas;
    const container = canvas.parentElement;
    
    // 根据容器大小调整画布大小
    if (container) {
        const size = Math.min(container.offsetWidth, container.offsetHeight, 600);
        canvas.width = size;
        canvas.height = size;
        
        // 重新计算配置
        wheelConfig.centerX = canvas.width / 2;
        wheelConfig.centerY = canvas.height / 2;
        wheelConfig.radius = Math.min(canvas.width, canvas.height) / 2 - 20;
        
        // 重绘制转盘
        const ctx = canvas.getContext('2d');
        drawWheel(ctx);
    }
}

/**
 * 防抖函数
 * @param {Function} func - 要执行的函数
 * @param {number} wait - 等待时间
 * @returns {Function} 防抖后的函数
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * 格式化日期时间
 * @param {string} dateString - 日期字符串
 * @returns {string} 格式化后的时间
 */
function formatDateTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    
    // 如果是今天
    if (date.toDateString() === now.toDateString()) {
        return date.toLocaleTimeString('zh-CN', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }
    
    // 如果是今年
    if (date.getFullYear() === now.getFullYear()) {
        const month = date.getMonth() + 1;
        const day = date.getDate();
        return `${month}月${day}日`;
    }
    
    // 其他年份
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${year}年${month}月${day}日`;
}

/**
 * 显示通知
 * @param {string} message - 消息内容
 * @param {string} type - 消息类型
 */
function showNotification(message, type = 'info') {
    if (typeof App !== 'undefined' && App.showNotification) {
        App.showNotification(message, type);
    } else {
        console.log(`[${type}] ${message}`);
    }
}

// ============================================
// 样式注入
// ============================================

/**
 * 注入转盘模块样式
 */
function injectWheelStyles() {
    const styleId = 'wheel-module-styles';
    if (document.getElementById(styleId)) return;
    
    const styles = `
        /* 转盘容器 */
        .wheel-wrapper {
            position: relative;
            width: 100%;
            max-width: 600px;
            margin: 0 auto 2rem;
        }
        
        .wheel-canvas {
            width: 100%;
            height: auto;
            display: block;
            border-radius: 50%;
            box-shadow: 0 10px 40px rgba(106, 69, 127, 0.2);
        }
        
        /* 指针 */
        .wheel-pointer {
            position: absolute;
            top: -20px;
            left: 50%;
            transform: translateX(-50%);
            font-size: 2.5rem;
            color: ${CONFIG.COLORS.ACCENT};
            text-shadow: 0 2px 10px rgba(255, 107, 172, 0.5);
            z-index: 10;
            animation: pointerPulse 2s infinite;
        }
        
        @keyframes pointerPulse {
            0%, 100% { transform: translateX(-50%) scale(1); }
            50% { transform: translateX(-50%) scale(1.1); }
        }
        
        /* 中心按钮 */
        .wheel-center {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 60px;
            height: 60px;
            background: ${CONFIG.COLORS.WHITE};
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.5rem;
            color: ${CONFIG.COLORS.ACCENT};
            box-shadow: 0 0 20px rgba(0, 0, 0, 0.2);
            z-index: 5;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .wheel-center:hover {
            transform: translate(-50%, -50%) scale(1.1);
            box-shadow: 0 0 30px rgba(255, 107, 172, 0.4);
        }
        
        /* 控制面板 */
        .wheel-controls {
            background: ${CONFIG.COLORS.WHITE};
            border-radius: 20px;
            padding: 2rem;
            margin: 2rem auto;
            max-width: 600px;
            box-shadow: 0 5px 20px rgba(106, 69, 127, 0.1);
            text-align: center;
        }
        
        .wheel-stats {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 1rem;
            margin-bottom: 1.5rem;
        }
        
        .stat-item {
            background: ${CONFIG.COLORS.LIGHT};
            padding: 1rem;
            border-radius: 12px;
        }
        
        .stat-label {
            display: block;
            font-size: 0.9rem;
            color: ${CONFIG.COLORS.DARK};
            margin-bottom: 0.5rem;
        }
        
        .stat-value {
            display: block;
            font-size: 1.5rem;
            font-weight: bold;
            color: ${CONFIG.COLORS.ACCENT};
        }
        
        /* 旋转按钮 */
        .spin-button {
            background: ${CONFIG.COLORS.GRADIENT_PRIMARY};
            color: ${CONFIG.COLORS.WHITE};
            border: none;
            border-radius: 50px;
            padding: 1rem 3rem;
            font-size: 1.2rem;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s ease;
            display: inline-flex;
            align-items: center;
            gap: 0.75rem;
            margin: 0 auto;
            box-shadow: 0 5px 20px rgba(255, 107, 172, 0.3);
        }
        
        .spin-button:hover:not(:disabled) {
            transform: translateY(-3px);
            box-shadow: 0 8px 25px rgba(255, 107, 172, 0.4);
        }
        
        .spin-button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }
        
        .wheel-hint {
            margin-top: 1rem;
            font-size: 0.9rem;
            color: ${CONFIG.COLORS.DARK};
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
        }
        
        /* 奖品区域 */
        .prize-section {
            margin: 3rem auto;
            max-width: 800px;
        }
        
        .section-title {
            font-size: 1.5rem;
            color: ${CONFIG.COLORS.ACCENT};
            margin-bottom: 1.5rem;
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }
        
        .prize-list {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 1rem;
        }
        
        .prize-item {
            background: ${CONFIG.COLORS.WHITE};
            border-radius: 15px;
            padding: 1rem;
            display: flex;
            align-items: center;
            gap: 1rem;
            box-shadow: 0 3px 15px rgba(106, 69, 127, 0.1);
            transition: all 0.3s ease;
            border: 2px solid transparent;
        }
        
        .prize-item:hover {
            transform: translateY(-3px);
            box-shadow: 0 5px 20px rgba(106, 69, 127, 0.2);
        }
        
        .prize-item.special {
            border-color: ${CONFIG.COLORS.ACCENT};
        }
        
        .prize-color {
            width: 20px;
            height: 20px;
            border-radius: 50%;
            flex-shrink: 0;
        }
        
        .prize-info {
            flex: 1;
        }
        
        .prize-name {
            font-weight: bold;
            color: ${CONFIG.COLORS.DARK};
            margin-bottom: 0.25rem;
        }
        
        .prize-description {
            font-size: 0.9rem;
            color: ${CONFIG.COLORS.DARK};
            opacity: 0.7;
        }
        
        .prize-probability {
            text-align: right;
        }
        
        .probability-value {
            display: block;
            font-size: 1.2rem;
            font-weight: bold;
            color: ${CONFIG.COLORS.ACCENT};
        }
        
        .probability-label {
            display: block;
            font-size: 0.8rem;
            color: ${CONFIG.COLORS.DARK};
            opacity: 0.7;
        }
        
        /* 历史记录 */
        .history-section {
            margin: 3rem auto;
            max-width: 600px;
        }
        
        .history-list {
            background: ${CONFIG.COLORS.WHITE};
            border-radius: 15px;
            padding: 1.5rem;
            max-height: 400px;
            overflow-y: auto;
            box-shadow: 0 3px 15px rgba(106, 69, 127, 0.1);
        }
        
        .history-empty {
            text-align: center;
            padding: 3rem 1rem;
            color: ${CONFIG.COLORS.DARK};
            opacity: 0.5;
        }
        
        .history-empty i {
            font-size: 3rem;
            margin-bottom: 1rem;
        }
        
        .history-item {
            display: flex;
            align-items: center;
            gap: 1rem;
            padding: 1rem;
            border-bottom: 1px solid ${CONFIG.COLORS.LIGHT};
        }
        
        .history-item:last-child {
            border-bottom: none;
        }
        
        .history-item.special-prize {
            background: rgba(255, 107, 172, 0.05);
            border-radius: 10px;
            margin: 0.5rem 0;
        }
        
        .history-index {
            width: 30px;
            height: 30px;
            background: ${CONFIG.COLORS.LIGHT};
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            color: ${CONFIG.COLORS.ACCENT};
            flex-shrink: 0;
        }
        
        .history-details {
            flex: 1;
        }
        
        .history-prize {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin-bottom: 0.25rem;
        }
        
        .prize-name {
            font-weight: bold;
            color: ${CONFIG.COLORS.DARK};
        }
        
        .prize-badge {
            background: ${CONFIG.COLORS.ACCENT};
            color: ${CONFIG.COLORS.WHITE};
            font-size: 0.7rem;
            padding: 0.1rem 0.4rem;
            border-radius: 10px;
        }
        
        .history-info {
            display: flex;
            justify-content: space-between;
            font-size: 0.8rem;
            color: ${CONFIG.COLORS.DARK};
            opacity: 0.7;
        }
        
        /* 弹窗 */
        .modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 2000;
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease;
        }
        
        .modal.show {
            opacity: 1;
            visibility: visible;
        }
        
        .modal-content {
            background: ${CONFIG.COLORS.WHITE};
            border-radius: 20px;
            width: 90%;
            max-width: 500px;
            overflow: hidden;
            transform: scale(0.9);
            transition: transform 0.3s ease;
        }
        
        .modal.show .modal-content {
            transform: scale(1);
        }
        
        .modal-header {
            padding: 1rem;
            text-align: right;
        }
        
        .modal-close {
            background: none;
            border: none;
            font-size: 1.5rem;
            color: ${CONFIG.COLORS.DARK};
            cursor: pointer;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
        }
        
        .modal-close:hover {
            background: ${CONFIG.COLORS.LIGHT};
        }
        
        .modal-body {
            padding: 2rem;
            text-align: center;
        }
        
        .prize-result {
            animation: fadeIn 0.5s ease;
        }
        
        .prize-result.special {
            animation: specialReveal 0.8s ease;
        }
        
        @keyframes specialReveal {
            0% { transform: scale(0.5); opacity: 0; }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); opacity: 1; }
        }
        
        .prize-icon {
            font-size: 4rem;
            margin-bottom: 1rem;
            animation: bounce 1s infinite alternate;
        }
        
        @keyframes bounce {
            from { transform: translateY(0); }
            to { transform: translateY(-10px); }
        }
        
        .prize-title {
            color: ${CONFIG.COLORS.DARK};
            margin-bottom: 0.5rem;
        }
        
        .prize-name-large {
            font-size: 2rem;
            font-weight: bold;
            color: ${CONFIG.COLORS.ACCENT};
            margin-bottom: 1rem;
        }
        
        .prize-description {
            color: ${CONFIG.COLORS.DARK};
            opacity: 0.8;
            margin-bottom: 1.5rem;
        }
        
        .prize-celebration {
            background: ${CONFIG.COLORS.LIGHT};
            border-radius: 50px;
            padding: 0.75rem 1.5rem;
            display: inline-flex;
            align-items: center;
            gap: 0.75rem;
            font-weight: bold;
            color: ${CONFIG.COLORS.ACCENT};
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
        }
        
        .modal-footer {
            padding: 1.5rem;
            display: flex;
            gap: 1rem;
            background: ${CONFIG.COLORS.LIGHT};
        }
        
        .modal-action {
            flex: 1;
            padding: 1rem;
            border: none;
            border-radius: 12px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .modal-action:first-child {
            background: ${CONFIG.COLORS.ACCENT};
            color: ${CONFIG.COLORS.WHITE};
        }
        
        .modal-action.share {
            background: ${CONFIG.COLORS.WHITE};
            color: ${CONFIG.COLORS.ACCENT};
            border: 2px solid ${CONFIG.COLORS.ACCENT};
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
        }
        
        .modal-action:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
        }
        
        /* 五彩纸屑 */
        .confetti {
            position: absolute;
            width: 10px;
            height: 10px;
            border-radius: 2px;
            animation: confettiFall 2s linear forwards;
            z-index: 100;
        }
        
        @keyframes confettiFall {
            0% {
                transform: translateY(-100px) rotate(0deg);
                opacity: 1;
            }
            100% {
                transform: translateY(500px) rotate(360deg);
                opacity: 0;
            }
        }
        
        /* 响应式设计 */
        @media (max-width: 768px) {
            .wheel-stats {
                grid-template-columns: 1fr;
            }
            
            .prize-list {
                grid-template-columns: 1fr;
            }
            
            .modal-footer {
                flex-direction: column;
            }
        }
    `;
    
    const styleElement = document.createElement('style');
    styleElement.id = styleId;
    styleElement.textContent = styles;
    document.head.appendChild(styleElement);
}

// ============================================
// 模块导出
// ============================================

// 将函数导出到全局对象
if (typeof window !== 'undefined') {
    window.WheelModule = {
        initWheel,
        startSpin,
        updateWheelDisplay,
        showPrizeModal
    };
}

// 注入样式
injectWheelStyles();

// 导出模块（如果使用模块系统）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initWheel,
        startSpin,
        updateWheelDisplay,
        showPrizeModal
    };
}

console.log('🎡 wheel.js 模块已加载');