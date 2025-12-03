/**
 * modules/countdown.js - 桃汽水周年庆倒计时模块
 * 功能：显示周年庆直播的倒计时，支持不同状态显示
 */

// 模块状态
const CountdownModule = {
    element: null,
    messageElement: null,
    interval: null,
    isActive: false,
    lastUpdate: 0
};

// ============================================
// 公共API函数
// ============================================

/**
 * 初始化倒计时模块
 */
function initCountdown() {
    console.log('🕒 初始化倒计时模块...');
    
    // 获取DOM元素
    CountdownModule.element = document.getElementById('countdown-display');
    CountdownModule.messageElement = document.getElementById('countdown-message');
    
    // 检查配置和DOM元素
    if (!CONFIG.FEATURES.COUNTDOWN) {
        console.warn('倒计时功能已禁用，跳过初始化');
        disableCountdownDisplay();
        return;
    }
    
    if (!CountdownModule.element || !CountdownModule.messageElement) {
        console.error('找不到倒计时DOM元素');
        return;
    }
    
    // 显示加载状态
    showLoadingState();
    
    // 初始化倒计时
    updateCountdown();
    
    // 启动定时器
    startCountdownTimer();
    
    // 监听页面可见性变化
    initVisibilityListener();
    
    // 添加样式（如果尚未添加）
    addCountdownStyles();
    
    CountdownModule.isActive = true;
    console.log('✅ 倒计时模块初始化完成');
    
    // 触发自定义事件
    window.dispatchEvent(new CustomEvent('countdown:initialized'));
}

/**
 * 停止倒计时模块
 */
function stopCountdown() {
    if (CountdownModule.interval) {
        clearInterval(CountdownModule.interval);
        CountdownModule.interval = null;
    }
    
    if (CountdownModule.element) {
        CountdownModule.element.innerHTML = `
            <div class="countdown-item">
                <div class="countdown-value">--</div>
                <div class="countdown-label">天</div>
            </div>
            <div class="countdown-item">
                <div class="countdown-value">--</div>
                <div class="countdown-label">时</div>
            </div>
            <div class="countdown-item">
                <div class="countdown-value">--</div>
                <div class="countdown-label">分</div>
            </div>
            <div class="countdown-item">
                <div class="countdown-value">--</div>
                <div class="countdown-label">秒</div>
            </div>
        `;
    }
    
    if (CountdownModule.messageElement) {
        CountdownModule.messageElement.textContent = '倒计时已停止';
    }
    
    CountdownModule.isActive = false;
    console.log('⏹️ 倒计时已停止');
}

/**
 * 更新倒计时显示（手动调用）
 */
function updateCountdown() {
    if (!CountdownModule.element || !CountdownModule.messageElement) return;
    
    try {
        const now = new Date().getTime();
        const eventDate = new Date(CONFIG.COUNTDOWN_END_DATE).getTime();
        const distance = eventDate - now;
        
        // 避免过于频繁的更新（至少间隔200ms）
        if (now - CountdownModule.lastUpdate < 200 && distance > 1000) {
            return;
        }
        
        CountdownModule.lastUpdate = now;
        
        // 计算时间单位
        const timeData = calculateTimeUnits(distance);
        
        // 更新显示
        updateCountdownDisplay(timeData, distance);
        
        // 更新消息
        updateCountdownMessage(distance);
        
        // 处理倒计时结束
        if (distance < 0) {
            handleCountdownEnd();
        }
        
    } catch (error) {
        console.error('更新倒计时时出错:', error);
        showErrorState();
    }
}

// ============================================
// 内部函数
// ============================================

/**
 * 计算时间单位
 * @param {number} distance - 剩余毫秒数
 * @returns {Object} 时间单位对象
 */
function calculateTimeUnits(distance) {
    if (distance < 0) {
        return {
            days: 0,
            hours: 0,
            minutes: 0,
            seconds: 0,
            totalSeconds: 0
        };
    }
    
    const totalSeconds = Math.floor(distance / 1000);
    const days = Math.floor(totalSeconds / (3600 * 24));
    const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    return {
        days,
        hours,
        minutes,
        seconds,
        totalSeconds
    };
}

/**
 * 更新倒计时显示
 * @param {Object} timeData - 时间单位数据
 * @param {number} distance - 剩余毫秒数
 */
function updateCountdownDisplay(timeData, distance) {
    if (!CountdownModule.element) return;
    
    const { days, hours, minutes, seconds } = timeData;
    
    // 创建倒计时HTML
    let countdownHTML = '';
    
    if (distance > 0) {
        countdownHTML = `
            <div class="countdown-item ${days === 0 ? 'highlight' : ''}">
                <div class="countdown-value">${days.toString().padStart(2, '0')}</div>
                <div class="countdown-label">天</div>
            </div>
            <div class="countdown-item ${days === 0 && hours < 24 ? 'highlight' : ''}">
                <div class="countdown-value">${hours.toString().padStart(2, '0')}</div>
                <div class="countdown-label">时</div>
            </div>
            <div class="countdown-item ${days === 0 && hours < 1 ? 'highlight' : ''}">
                <div class="countdown-value">${minutes.toString().padStart(2, '0')}</div>
                <div class="countdown-label">分</div>
            </div>
            <div class="countdown-item">
                <div class="countdown-value">${seconds.toString().padStart(2, '0')}</div>
                <div class="countdown-label">秒</div>
            </div>
        `;
    } else {
        // 倒计时结束，显示特殊状态
        countdownHTML = `
            <div class="countdown-item celebration">
                <div class="countdown-value">🎉</div>
                <div class="countdown-label">开始</div>
            </div>
            <div class="countdown-item celebration">
                <div class="countdown-value">🎊</div>
                <div class="countdown-label">庆祝</div>
            </div>
            <div class="countdown-item celebration">
                <div class="countdown-value">✨</div>
                <div class="countdown-label">直播</div>
            </div>
            <div class="countdown-item celebration">
                <div class="countdown-value">🎀</div>
                <div class="countdown-label">进行</div>
            </div>
        `;
    }
    
    CountdownModule.element.innerHTML = countdownHTML;
    
    // 添加动画效果（每秒钟更新时给秒数字添加脉冲动画）
    if (CountdownModule.element.querySelector('.countdown-item:last-child .countdown-value')) {
        const secondsValue = CountdownModule.element.querySelector('.countdown-item:last-child .countdown-value');
        secondsValue.classList.add('pulse');
        setTimeout(() => secondsValue.classList.remove('pulse'), 300);
    }
}

/**
 * 更新倒计时消息
 * @param {number} distance - 剩余毫秒数
 */
function updateCountdownMessage(distance) {
    if (!CountdownModule.messageElement) return;
    
    let message = '';
    
    if (distance < 0) {
        // 倒计时已结束
        message = CONFIG.TEXTS.COUNTDOWN_MESSAGES.STARTED;
    } else {
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        
        if (days > 7) {
            message = CONFIG.TEXTS.COUNTDOWN_MESSAGES.MORE_THAN_WEEK;
        } else if (days >= 1) {
            message = CONFIG.TEXTS.COUNTDOWN_MESSAGES.LESS_THAN_DAY;
        } else if (hours >= 1) {
            message = CONFIG.TEXTS.COUNTDOWN_MESSAGES.LESS_THAN_HOUR;
        } else {
            message = "最后倒计时！准备迎接惊喜！";
        }
    }
    
    CountdownModule.messageElement.textContent = message;
    
    // 如果距离直播开始小于1小时，添加闪烁动画
    if (distance > 0 && distance < 3600000) { // 1小时
        CountdownModule.messageElement.classList.add('blink');
    } else {
        CountdownModule.messageElement.classList.remove('blink');
    }
}

/**
 * 处理倒计时结束
 */
function handleCountdownEnd() {
    console.log('🎉 倒计时结束！周年庆直播开始！');
    
    // 停止定时器
    if (CountdownModule.interval) {
        clearInterval(CountdownModule.interval);
        CountdownModule.interval = null;
    }
    
    // 更新状态
    CountdownModule.isActive = false;
    
    // 触发自定义事件
    window.dispatchEvent(new CustomEvent('countdown:ended'));
    
    // 更新页面状态
    updateEventStatus();
    
    // 显示庆祝效果
    showCelebrationEffect();
    
    // 10秒后重新开始慢速更新（防止页面长时间不更新）
    setTimeout(() => {
        CountdownModule.interval = setInterval(updateCountdown, 60000); // 每分钟更新一次
    }, 10000);
}

/**
 * 开始倒计时定时器
 */
function startCountdownTimer() {
    // 先清除可能存在的旧定时器
    if (CountdownModule.interval) {
        clearInterval(CountdownModule.interval);
    }
    
    // 计算更新间隔
    let updateInterval = 1000; // 默认1秒
    
    const now = new Date().getTime();
    const eventDate = new Date(CONFIG.COUNTDOWN_END_DATE).getTime();
    const distance = eventDate - now;
    
    // 根据剩余时间调整更新频率
    if (distance < 3600000) { // 小于1小时
        updateInterval = 200; // 200ms，更流畅
    } else if (distance < 86400000) { // 小于1天
        updateInterval = 500; // 500ms
    }
    
    // 启动定时器
    CountdownModule.interval = setInterval(updateCountdown, updateInterval);
    
    console.log(`⏰ 倒计时定时器启动，更新间隔: ${updateInterval}ms`);
}

/**
 * 初始化页面可见性监听
 */
function initVisibilityListener() {
    // 监听页面可见性变化
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            // 页面不可见时，降低更新频率
            if (CountdownModule.interval) {
                clearInterval(CountdownModule.interval);
                CountdownModule.interval = setInterval(updateCountdown, 30000); // 30秒更新一次
            }
        } else {
            // 页面可见时，恢复更新频率
            if (CountdownModule.interval) {
                clearInterval(CountdownModule.interval);
                startCountdownTimer();
                // 立即更新一次
                updateCountdown();
            }
        }
    });
    
    // 监听窗口聚焦事件
    window.addEventListener('focus', () => {
        if (CountdownModule.isActive) {
            updateCountdown();
        }
    });
}

/**
 * 显示加载状态
 */
function showLoadingState() {
    if (!CountdownModule.element) return;
    
    CountdownModule.element.innerHTML = `
        <div class="countdown-loading">
            <div class="loading-spinner">
                <div class="spinner-circle-small"></div>
            </div>
            <span>加载倒计时...</span>
        </div>
    `;
}

/**
 * 显示错误状态
 */
function showErrorState() {
    if (!CountdownModule.element) return;
    
    CountdownModule.element.innerHTML = `
        <div class="countdown-error">
            <i class="fas fa-exclamation-triangle"></i>
            <span>倒计时加载失败</span>
        </div>
    `;
    
    if (CountdownModule.messageElement) {
        CountdownModule.messageElement.textContent = '无法加载倒计时，请刷新页面';
    }
}

/**
 * 禁用倒计时显示
 */
function disableCountdownDisplay() {
    if (!CountdownModule.element) return;
    
    CountdownModule.element.innerHTML = `
        <div class="countdown-disabled">
            <i class="fas fa-ban"></i>
            <span>倒计时功能已禁用</span>
        </div>
    `;
    
    if (CountdownModule.messageElement) {
        CountdownModule.messageElement.textContent = '';
    }
}

/**
 * 更新活动状态（与script.js中的函数协作）
 */
function updateEventStatus() {
    // 尝试调用script.js中的函数，如果存在的话
    if (typeof App !== 'undefined' && typeof App.updateEventStatus === 'function') {
        App.updateEventStatus();
    } else if (typeof updateEventStatus === 'function') {
        updateEventStatus();
    }
}

/**
 * 显示庆祝效果
 */
function showCelebrationEffect() {
    // 在倒计时区域添加庆祝动画
    if (CountdownModule.element) {
        CountdownModule.element.classList.add('celebrating');
        
        // 创建庆祝粒子效果
        createCelebrationParticles();
        
        // 10秒后移除动画类
        setTimeout(() => {
            CountdownModule.element.classList.remove('celebrating');
        }, 10000);
    }
    
    // 播放庆祝音效（如果允许）
    playCelebrationSound();
    
    // 显示庆祝通知
    if (typeof App !== 'undefined' && typeof App.showNotification === 'function') {
        App.showNotification('🎉 周年庆直播开始啦！快来看吧！', 'success', 5000);
    }
}

/**
 * 创建庆祝粒子效果
 */
function createCelebrationParticles() {
    if (!CountdownModule.element) return;
    
    const container = CountdownModule.element;
    const colors = ['#FF9AC8', '#FFC8E8', '#A8E6CF', '#FFD3B6', '#6A457F', '#FF6BAC'];
    
    // 创建20个粒子
    for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        particle.className = 'celebration-particle';
        
        // 随机属性
        const size = Math.random() * 15 + 5;
        const color = colors[Math.floor(Math.random() * colors.length)];
        const startX = Math.random() * container.offsetWidth;
        const startY = container.offsetHeight;
        
        // 设置样式
        particle.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            background: ${color};
            border-radius: 50%;
            left: ${startX}px;
            top: ${startY}px;
            pointer-events: none;
            z-index: 100;
        `;
        
        // 添加到容器
        container.style.position = 'relative';
        container.appendChild(particle);
        
        // 动画
        const animation = particle.animate([
            { 
                transform: 'translateY(0) scale(1)',
                opacity: 1 
            },
            { 
                transform: `translateY(-${Math.random() * 200 + 100}px) translateX(${Math.random() * 100 - 50}px) scale(0)`,
                opacity: 0 
            }
        ], {
            duration: Math.random() * 1000 + 1000,
            easing: 'cubic-bezier(0.215, 0.610, 0.355, 1)'
        });
        
        // 动画结束后移除元素
        animation.onfinish = () => {
            if (particle.parentNode) {
                particle.parentNode.removeChild(particle);
            }
        };
    }
}

/**
 * 播放庆祝音效
 */
function playCelebrationSound() {
    // 检查用户是否允许播放声音
    if (typeof localStorage !== 'undefined') {
        const soundEnabled = localStorage.getItem('taoci_sound_enabled');
        if (soundEnabled === 'false') return;
    }
    
    try {
        // 创建简单的音效
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
        oscillator.frequency.exponentialRampToValueAtTime(1046.50, audioContext.currentTime + 0.5); // C6
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
        
    } catch (error) {
        // 音效播放失败，静默处理
        console.log('音效播放失败（可能是用户阻止了自动播放）');
    }
}

/**
 * 添加倒计时专用样式
 */
function addCountdownStyles() {
    // 检查样式是否已添加
    if (document.getElementById('countdown-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'countdown-styles';
    style.textContent = `
        /* 倒计时加载状态 */
        .countdown-loading {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: var(--spacing-lg);
            color: var(--color-pink-accent);
        }
        
        .loading-spinner {
            margin-bottom: var(--spacing-sm);
        }
        
        .spinner-circle-small {
            width: 30px;
            height: 30px;
            border: 3px solid var(--color-pink-light);
            border-top-color: var(--color-pink-accent);
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        
        /* 倒计时错误状态 */
        .countdown-error {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: var(--spacing-lg);
            color: var(--color-warning);
        }
        
        .countdown-error i {
            font-size: var(--font-size-2xl);
            margin-bottom: var(--spacing-sm);
        }
        
        /* 倒计时禁用状态 */
        .countdown-disabled {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: var(--spacing-lg);
            color: var(--color-gray-dark);
        }
        
        .countdown-disabled i {
            font-size: var(--font-size-2xl);
            margin-bottom: var(--spacing-sm);
        }
        
        /* 倒计时高亮状态 */
        .countdown-item.highlight .countdown-value {
            color: var(--color-pink-accent);
            animation: pulse 1s infinite;
        }
        
        /* 庆祝状态 */
        .countdown-item.celebration {
            background: var(--gradient-primary);
            color: var(--color-white);
        }
        
        .countdown-item.celebration .countdown-value {
            font-size: var(--font-size-3xl);
        }
        
        .countdown.celebrating {
            position: relative;
            overflow: hidden;
        }
        
        .countdown.celebrating::before {
            content: '';
            position: absolute;
            top: -10px;
            left: -10px;
            right: -10px;
            bottom: -10px;
            background: linear-gradient(45deg, 
                transparent, 
                rgba(255, 154, 200, 0.1), 
                transparent, 
                rgba(168, 230, 207, 0.1), 
                transparent
            );
            z-index: 1;
            animation: shimmer 3s infinite;
        }
        
        /* 粒子动画 */
        .celebration-particle {
            animation: float-up 1s ease-out forwards;
        }
        
        /* 闪烁动画 */
        .blink {
            animation: blink 1s infinite;
        }
        
        /* 脉冲动画 */
        .pulse {
            animation: pulse 0.3s ease-in-out;
        }
        
        /* 动画定义 */
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        
        @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
        }
        
        @keyframes blink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        
        @keyframes float-up {
            to {
                transform: translateY(-100px);
                opacity: 0;
            }
        }
        
        @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
        }
        
        /* 响应式调整 */
        @media (max-width: 768px) {
            .countdown-item.celebration .countdown-value {
                font-size: var(--font-size-2xl);
            }
            
            .countdown-loading,
            .countdown-error,
            .countdown-disabled {
                padding: var(--spacing-md);
            }
        }
    `;
    
    document.head.appendChild(style);
}

/**
 * 获取倒计时状态信息
 * @returns {Object} 倒计时状态
 */
function getCountdownStatus() {
    const now = new Date().getTime();
    const eventDate = new Date(CONFIG.COUNTDOWN_END_DATE).getTime();
    const distance = eventDate - now;
    const timeData = calculateTimeUnits(distance);
    
    return {
        isActive: CountdownModule.isActive,
        distance,
        timeData,
        isEnded: distance <= 0,
        isRunning: CountdownModule.interval !== null,
        lastUpdate: CountdownModule.lastUpdate
    };
}

/**
 * 重置倒计时（用于调试）
 */
function resetCountdown() {
    if (CountdownModule.interval) {
        clearInterval(CountdownModule.interval);
    }
    
    CountdownModule.isActive = false;
    CountdownModule.lastUpdate = 0;
    
    showLoadingState();
    
    setTimeout(() => {
        initCountdown();
    }, 1000);
    
    console.log('🔄 倒计时已重置');
}

// ============================================
// 模块导出
// ============================================

// 添加到全局App对象（如果存在）
if (typeof window !== 'undefined') {
    // 确保App对象存在
    if (!window.App) window.App = {};
    
    // 将倒计时模块添加到App
    window.App.Countdown = {
        init: initCountdown,
        stop: stopCountdown,
        update: updateCountdown,
        reset: resetCountdown,
        getStatus: getCountdownStatus,
        module: CountdownModule
    };
}

// 自动初始化（如果页面中有倒计时元素）
document.addEventListener('DOMContentLoaded', function() {
    // 检查是否需要自动初始化
    const hasCountdownElement = document.getElementById('countdown-display');
    const shouldAutoInit = hasCountdownElement && CONFIG.FEATURES.COUNTDOWN;
    
    if (shouldAutoInit) {
        // 延迟初始化，确保其他核心模块先加载
        setTimeout(initCountdown, 500);
    }
});

// 导出模块（如果使用模块系统）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initCountdown,
        stopCountdown,
        updateCountdown,
        resetCountdown,
        getCountdownStatus,
        CountdownModule
    };
}

console.log('🕒 countdown.js 模块已加载，等待初始化...');