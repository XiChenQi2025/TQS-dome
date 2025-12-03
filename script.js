// script.js - 桃汽水の魔力补给站 主逻辑文件

// 全局状态对象
const APP_STATE = {
    currentPage: 'home',
    userData: null,
    gameInstances: {},
    wheelInstance: null,
    rankingData: [],
    messagesData: [],
    siteStats: {
        totalMagic: 0,
        totalUsers: 0,
        totalMessages: 0,
        onlineUsers: 0
    },
    isInitialized: false,
    isMobileMenuOpen: false
};

// DOM元素缓存
const DOM_CACHE = {
    pages: null,
    navLinks: null,
    mobileMenuButton: null,
    navLinksContainer: null,
    backToTopButton: null,
    loadingScreen: null,
    userAvatar: null,
    userNameDisplay: null,
    userPointsDisplay: null
};

// ============================================
// 初始化函数
// ============================================

/**
 * 初始化应用程序
 */
function initApp() {
    console.log('🎀 桃汽水の魔力补给站 初始化中...');
    
    // 缓存DOM元素
    cacheDOMElements();
    
    // 设置颜色主题
    applyColorTheme();
    
    // 初始化事件监听器
    initEventListeners();
    
    // 初始化用户数据
    initUserData();
    
    // 初始化页面内容
    initPageContent();
    
    // 初始化倒计时
    if (CONFIG.FEATURES.COUNTDOWN) {
        initCountdown();
    }
    
    // 初始化留言板预览
    if (CONFIG.FEATURES.MESSAGES) {
        initMessagePreview();
    }
    
    // 初始化站点统计
    initSiteStats();
    
    // 设置初始状态
    updateEventStatus();
    updatePageTitle();
    updateFooterInfo();
    initSocialLinks();
    
    // 隐藏加载动画
    setTimeout(() => {
        if (DOM_CACHE.loadingScreen) {
            DOM_CACHE.loadingScreen.style.opacity = '0';
            setTimeout(() => {
                DOM_CACHE.loadingScreen.style.display = 'none';
            }, 500);
        }
    }, 800);
    
    // 标记为已初始化
    APP_STATE.isInitialized = true;
    
    console.log('✨ 应用程序初始化完成！');
    
    // 触发自定义事件
    window.dispatchEvent(new CustomEvent('app:initialized'));
}

/**
 * 缓存常用的DOM元素
 */
function cacheDOMElements() {
    DOM_CACHE.pages = document.querySelectorAll('.page');
    DOM_CACHE.navLinks = document.querySelectorAll('.nav-link');
    DOM_CACHE.mobileMenuButton = document.getElementById('mobile-menu-button');
    DOM_CACHE.navLinksContainer = document.getElementById('nav-links');
    DOM_CACHE.backToTopButton = document.getElementById('back-to-top');
    DOM_CACHE.loadingScreen = document.getElementById('loading-screen');
    DOM_CACHE.userAvatar = document.getElementById('user-avatar');
    DOM_CACHE.userNameDisplay = document.getElementById('username-display-desktop');
    DOM_CACHE.userPointsDisplay = document.getElementById('user-points-display');
}

/**
 * 应用颜色主题
 */
function applyColorTheme() {
    const root = document.documentElement;
    
    // 设置CSS变量
    Object.entries(CONFIG.COLORS).forEach(([key, value]) => {
        if (typeof value === 'string') {
            const cssVar = key.toLowerCase().replace(/_/g, '-');
            root.style.setProperty(`--color-${cssVar}`, value);
        }
    });
}

/**
 * 初始化事件监听器
 */
function initEventListeners() {
    // 导航链接点击事件
    if (DOM_CACHE.navLinks) {
        DOM_CACHE.navLinks.forEach(link => {
            link.addEventListener('click', handleNavLinkClick);
        });
    }
    
    // 移动端菜单按钮
    if (DOM_CACHE.mobileMenuButton) {
        DOM_CACHE.mobileMenuButton.addEventListener('click', toggleMobileMenu);
    }
    
    // 回到顶部按钮
    if (DOM_CACHE.backToTopButton) {
        DOM_CACHE.backToTopButton.addEventListener('click', scrollToTop);
        window.addEventListener('scroll', handleScroll);
    }
    
    // 页面切换事件
    window.addEventListener('pagechange', handlePageChange);
    
    // 页面加载事件
    window.addEventListener('load', handlePageLoad);
    
    // 窗口大小变化事件
    window.addEventListener('resize', handleWindowResize);
    
    // 键盘快捷键
    document.addEventListener('keydown', handleKeyboardShortcuts);
}

/**
 * 初始化用户数据
 */
function initUserData() {
    // 从localStorage获取用户数据
    const savedName = localStorage.getItem(CONFIG.STORAGE_KEYS.USER_NAME);
    const savedPoints = localStorage.getItem(CONFIG.STORAGE_KEYS.USER_POINTS);
    
    APP_STATE.userData = {
        name: savedName || '契约者',
        points: parseInt(savedPoints) || 0,
        gamesPlayed: parseInt(localStorage.getItem(CONFIG.STORAGE_KEYS.USER_GAMES_PLAYED)) || 0,
        wheelSpins: parseInt(localStorage.getItem(CONFIG.STORAGE_KEYS.USER_WHEEL_SPINS)) || 0,
        lastVisit: localStorage.getItem(CONFIG.STORAGE_KEYS.LAST_VISIT) || new Date().toISOString()
    };
    
    // 保存访问时间
    localStorage.setItem(CONFIG.STORAGE_KEYS.LAST_VISIT, new Date().toISOString());
    
    // 更新用户界面
    updateUserDisplay();
}

/**
 * 初始化页面内容
 */
function initPageContent() {
    // 更新页面文本
    updatePageTexts();
    
    // 处理URL哈希
    handleHashChange();
    
    // 初始显示首页
    showPage('home');
}

/**
 * 初始化站点统计
 */
function initSiteStats() {
    // 从localStorage获取站点统计
    const savedTotalMagic = localStorage.getItem(CONFIG.STORAGE_KEYS.TOTAL_POINTS);
    
    APP_STATE.siteStats = {
        totalMagic: parseInt(savedTotalMagic) || 0,
        totalUsers: getTotalUsers(),
        totalMessages: CONFIG.MESSAGES.DEFAULT_MESSAGES.length,
        onlineUsers: 1 // 初始在线人数
    };
    
    // 更新统计显示
    updateStatsDisplay();
}

// ============================================
// 页面管理
// ============================================

/**
 * 显示指定页面
 * @param {string} pageId - 页面ID
 */
function showPage(pageId) {
    // 隐藏所有页面
    DOM_CACHE.pages.forEach(page => {
        page.classList.remove('active');
    });
    
    // 显示目标页面
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
        APP_STATE.currentPage = pageId;
        
        // 更新导航激活状态
        updateNavActiveState(pageId);
        
        // 触发页面显示事件
        window.dispatchEvent(new CustomEvent('page:shown', {
            detail: { page: pageId }
        }));
        
        // 延迟执行页面特定初始化
        setTimeout(() => initPageSpecificFeatures(pageId), 100);
    }
}

/**
 * 初始化页面特定功能
 * @param {string} pageId - 页面ID
 */
function initPageSpecificFeatures(pageId) {
    switch(pageId) {
        case 'home':
            // 首页已经初始化
            break;
            
        case 'games':
            if (CONFIG.FEATURES.GAMES && typeof initGames === 'function') {
                initGames();
            }
            break;
            
        case 'wheel':
            if (CONFIG.FEATURES.WHEEL && typeof initWheel === 'function') {
                initWheel();
            }
            break;
            
        case 'ranking':
            if (CONFIG.FEATURES.RANKING && typeof initRanking === 'function') {
                initRanking();
            }
            break;
            
        case 'messages':
            if (CONFIG.FEATURES.MESSAGES && typeof initMessages === 'function') {
                initMessages();
            }
            break;
    }
}

/**
 * 更新导航激活状态
 * @param {string} activePageId - 当前激活页面ID
 */
function updateNavActiveState(activePageId) {
    DOM_CACHE.navLinks.forEach(link => {
        const page = link.getAttribute('data-page');
        if (page === activePageId) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

/**
 * 处理导航链接点击
 * @param {Event} event - 点击事件
 */
function handleNavLinkClick(event) {
    event.preventDefault();
    
    const link = event.currentTarget;
    const targetPage = link.getAttribute('data-page');
    
    if (targetPage) {
        showPage(targetPage);
        
        // 更新URL哈希
        window.location.hash = targetPage;
        
        // 如果是移动端，关闭菜单
        if (window.innerWidth <= 768 && APP_STATE.isMobileMenuOpen) {
            closeMobileMenu();
        }
    }
}

// ============================================
// 事件处理函数
// ============================================

/**
 * 处理页面切换事件
 * @param {Event} event - 页面切换事件
 */
function handlePageChange(event) {
    const page = event.detail.page;
    console.log(`📄 切换到页面: ${page}`);
}

/**
 * 处理页面加载事件
 */
function handlePageLoad() {
    console.log('📄 页面加载完成');
    
    // 更新在线用户数
    updateOnlineUsers();
}

/**
 * 处理窗口大小变化
 */
function handleWindowResize() {
    // 如果窗口变大且移动菜单打开，则关闭菜单
    if (window.innerWidth > 768 && APP_STATE.isMobileMenuOpen) {
        closeMobileMenu();
    }
    
    // 更新在线用户数显示
    updateOnlineUsers();
}

/**
 * 处理滚动事件
 */
function handleScroll() {
    // 显示/隐藏回到顶部按钮
    if (DOM_CACHE.backToTopButton) {
        if (window.scrollY > 300) {
            DOM_CACHE.backToTopButton.classList.add('visible');
        } else {
            DOM_CACHE.backToTopButton.classList.remove('visible');
        }
    }
    
    // 添加导航栏阴影
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        if (window.scrollY > 10) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    }
}

/**
 * 处理键盘快捷键
 * @param {KeyboardEvent} event - 键盘事件
 */
function handleKeyboardShortcuts(event) {
    // 只在没有输入焦点时触发
    if (document.activeElement.tagName === 'INPUT' || 
        document.activeElement.tagName === 'TEXTAREA') {
        return;
    }
    
    switch(event.key.toLowerCase()) {
        case '1':
            showPage('home');
            break;
        case '2':
            showPage('games');
            break;
        case '3':
            showPage('wheel');
            break;
        case '4':
            showPage('ranking');
            break;
        case '5':
            showPage('messages');
            break;
        case 'escape':
            if (APP_STATE.isMobileMenuOpen) {
                closeMobileMenu();
            }
            break;
    }
}

/**
 * 处理URL哈希变化
 */
function handleHashChange() {
    const hash = window.location.hash.replace('#', '');
    if (hash && document.getElementById(hash)) {
        showPage(hash);
    }
}

// ============================================
// 移动端菜单管理
// ============================================

/**
 * 切换移动端菜单
 */
function toggleMobileMenu() {
    if (APP_STATE.isMobileMenuOpen) {
        closeMobileMenu();
    } else {
        openMobileMenu();
    }
}

/**
 * 打开移动端菜单
 */
function openMobileMenu() {
    if (DOM_CACHE.navLinksContainer) {
        DOM_CACHE.navLinksContainer.classList.add('active');
        DOM_CACHE.mobileMenuButton.innerHTML = '<i class="fas fa-times"></i>';
        APP_STATE.isMobileMenuOpen = true;
        
        // 禁止背景滚动
        document.body.style.overflow = 'hidden';
    }
}

/**
 * 关闭移动端菜单
 */
function closeMobileMenu() {
    if (DOM_CACHE.navLinksContainer) {
        DOM_CACHE.navLinksContainer.classList.remove('active');
        DOM_CACHE.mobileMenuButton.innerHTML = '<i class="fas fa-bars"></i>';
        APP_STATE.isMobileMenuOpen = false;
        
        // 恢复背景滚动
        document.body.style.overflow = '';
    }
}

// ============================================
// 用户数据管理
// ============================================

/**
 * 更新用户显示
 */
function updateUserDisplay() {
    if (DOM_CACHE.userNameDisplay) {
        DOM_CACHE.userNameDisplay.textContent = APP_STATE.userData.name;
    }
    
    if (DOM_CACHE.userPointsDisplay) {
        DOM_CACHE.userPointsDisplay.textContent = `${APP_STATE.userData.points} 魔力`;
    }
    
    // 更新移动端显示
    const mobileNameDisplay = document.getElementById('username-display');
    if (mobileNameDisplay) {
        mobileNameDisplay.textContent = APP_STATE.userData.name;
    }
}

/**
 * 添加用户魔力
 * @param {number} points - 要添加的魔力值
 */
function addUserPoints(points) {
    if (points <= 0) return;
    
    APP_STATE.userData.points += points;
    APP_STATE.siteStats.totalMagic += points;
    
    // 保存到localStorage
    localStorage.setItem(CONFIG.STORAGE_KEYS.USER_POINTS, APP_STATE.userData.points.toString());
    localStorage.setItem(CONFIG.STORAGE_KEYS.TOTAL_POINTS, APP_STATE.siteStats.totalMagic.toString());
    
    // 更新显示
    updateUserDisplay();
    updateStatsDisplay();
    
    // 触发事件
    window.dispatchEvent(new CustomEvent('points:added', {
        detail: { points }
    }));
}

/**
 * 消耗用户魔力
 * @param {number} points - 要消耗的魔力值
 * @returns {boolean} 是否成功消耗
 */
function spendUserPoints(points) {
    if (APP_STATE.userData.points < points) {
        showNotification('魔力不足！', 'error');
        return false;
    }
    
    APP_STATE.userData.points -= points;
    
    // 保存到localStorage
    localStorage.setItem(CONFIG.STORAGE_KEYS.USER_POINTS, APP_STATE.userData.points.toString());
    
    // 更新显示
    updateUserDisplay();
    
    // 触发事件
    window.dispatchEvent(new CustomEvent('points:spent', {
        detail: { points }
    }));
    
    return true;
}

/**
 * 获取总用户数（从localStorage估算）
 * @returns {number} 总用户数
 */
function getTotalUsers() {
    // 这里可以扩展为从后端获取真实数据
    // 目前使用localStorage中存储的用户名数量作为估算
    let userCount = 0;
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.includes('taoci_user')) {
            userCount++;
        }
    }
    return Math.max(userCount, 1);
}

// ============================================
// 站点统计管理
// ============================================

/**
 * 更新统计显示
 */
function updateStatsDisplay() {
    // 更新总魔力
    const totalMagicElement = document.getElementById('total-magic');
    if (totalMagicElement) {
        totalMagicElement.textContent = APP_STATE.siteStats.totalMagic.toLocaleString();
    }
    
    // 更新总用户数
    const totalUsersElement = document.getElementById('total-users');
    if (totalUsersElement) {
        totalUsersElement.textContent = APP_STATE.siteStats.totalUsers.toLocaleString();
    }
    
    // 更新网站运行天数
    const daysActiveElement = document.getElementById('days-active');
    if (daysActiveElement) {
        daysActiveElement.textContent = CONFIG.getDaysSinceLaunch();
    }
    
    // 更新访问量
    const viewCountElement = document.getElementById('view-count');
    if (viewCountElement) {
        viewCountElement.textContent = APP_STATE.siteStats.totalUsers;
    }
}

/**
 * 更新在线用户数
 */
function updateOnlineUsers() {
    // 这里可以扩展为从后端获取真实在线数据
    // 目前使用一个简单的随机数模拟
    const baseOnline = Math.floor(APP_STATE.siteStats.totalUsers * 0.1);
    const randomVariation = Math.floor(Math.random() * 10);
    APP_STATE.siteStats.onlineUsers = Math.max(1, baseOnline + randomVariation);
    
    const onlineCountElement = document.getElementById('online-count');
    if (onlineCountElement) {
        onlineCountElement.textContent = APP_STATE.siteStats.onlineUsers;
    }
}

// ============================================
// 内容更新函数
// ============================================

/**
 * 更新页面文本
 */
function updatePageTexts() {
    // 更新欢迎标题
    const welcomeTitle = document.getElementById('welcome-title');
    if (welcomeTitle) {
        welcomeTitle.textContent = CONFIG.TEXTS.WELCOME_TITLE;
    }
    
    // 更新欢迎副标题
    const welcomeSubtitle = document.getElementById('welcome-subtitle');
    if (welcomeSubtitle) {
        welcomeSubtitle.textContent = CONFIG.TEXTS.WELCOME_SUBTITLE;
    }
    
    // 更新网站标题和副标题
    const siteTitle = document.getElementById('site-title');
    if (siteTitle) {
        siteTitle.textContent = CONFIG.SITE_TITLE;
    }
    
    const siteSubtitle = document.getElementById('site-subtitle');
    if (siteSubtitle) {
        siteSubtitle.textContent = CONFIG.SITE_SUBTITLE;
    }
}

/**
 * 更新页面标题
 */
function updatePageTitle() {
    const currentPage = APP_STATE.currentPage;
    let pageTitle = CONFIG.SITE_TITLE;
    
    switch(currentPage) {
        case 'games':
            pageTitle = `收集魔力 - ${CONFIG.SITE_TITLE}`;
            break;
        case 'wheel':
            pageTitle = `祈愿转盘 - ${CONFIG.SITE_TITLE}`;
            break;
        case 'ranking':
            pageTitle = `魔力榜单 - ${CONFIG.SITE_TITLE}`;
            break;
        case 'messages':
            pageTitle = `留言板 - ${CONFIG.SITE_TITLE}`;
            break;
    }
    
    document.title = pageTitle;
}

/**
 * 更新活动状态
 */
function updateEventStatus() {
    const status = CONFIG.getEventStatus();
    const eventStatusElement = document.getElementById('event-status-badge');
    
    if (eventStatusElement) {
        switch(status) {
            case 'before':
                eventStatusElement.textContent = '准备中';
                eventStatusElement.style.background = CONFIG.COLORS.WARNING;
                break;
            case 'during':
                eventStatusElement.textContent = '进行中';
                eventStatusElement.style.background = CONFIG.COLORS.SUCCESS;
                break;
            case 'after':
                eventStatusElement.textContent = '已结束';
                eventStatusElement.style.background = CONFIG.COLORS.INFO;
                break;
        }
    }
}

/**
 * 更新页脚信息
 */
function updateFooterInfo() {
    // 更新活动日期
    const eventDateElement = document.getElementById('footer-event-date');
    if (eventDateElement) {
        eventDateElement.textContent = CONFIG.getFormattedEventDate();
    }
    
    // 更新网站版本
    const versionElement = document.getElementById('site-version');
    if (versionElement) {
        versionElement.textContent = `v${CONFIG.SITE_VERSION}`;
    }
    
    // 更新最后更新时间
    const lastUpdateElement = document.getElementById('last-update');
    if (lastUpdateElement) {
        const lastUpdate = new Date(CONFIG.LAST_UPDATE);
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        lastUpdateElement.textContent = lastUpdate.toLocaleDateString('zh-CN', options);
    }
}

/**
 * 初始化社交链接
 */
function initSocialLinks() {
    const socialLinksContainer = document.getElementById('social-links');
    if (!socialLinksContainer) return;
    
    let socialLinksHTML = '';
    
    Object.entries(CONFIG.SOCIAL_LINKS).forEach(([platform, url]) => {
        if (!url || !url.includes('您的')) { // 跳过未设置的链接
            const icon = getSocialIcon(platform);
            const name = getSocialName(platform);
            
            socialLinksHTML += `
                <a href="${url}" class="social-link" target="_blank" rel="noopener noreferrer" aria-label="${name}">
                    <i class="${icon}"></i>
                </a>
            `;
        }
    });
    
    socialLinksContainer.innerHTML = socialLinksHTML;
}

/**
 * 获取社交平台图标
 * @param {string} platform - 平台名称
 * @returns {string} 图标类名
 */
function getSocialIcon(platform) {
    const icons = {
        BILIBILI: 'fab fa-bilibili',
        WEIBO: 'fab fa-weibo',
        TWITTER: 'fab fa-twitter',
        YOUTUBE: 'fab fa-youtube',
        TWITCH: 'fab fa-twitch'
    };
    
    return icons[platform] || 'fas fa-share-alt';
}

/**
 * 获取社交平台名称
 * @param {string} platform - 平台名称
 * @returns {string} 平台中文名称
 */
function getSocialName(platform) {
    const names = {
        BILIBILI: '哔哩哔哩',
        WEIBO: '微博',
        TWITTER: 'Twitter',
        YOUTUBE: 'YouTube',
        TWITCH: 'Twitch'
    };
    
    return names[platform] || platform;
}

// ============================================
// 工具函数
// ============================================

/**
 * 滚动到页面顶部
 */
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

/**
 * 显示通知
 * @param {string} message - 通知消息
 * @param {string} type - 通知类型（success, error, warning, info）
 * @param {number} duration - 显示持续时间（毫秒）
 */
function showNotification(message, type = 'info', duration = 3000) {
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    // 获取对应图标
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${icons[type] || 'fa-info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    // 添加到页面
    document.body.appendChild(notification);
    
    // 显示动画
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // 自动隐藏
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, duration);
}

/**
 * 格式化日期时间
 * @param {string|Date} date - 日期字符串或Date对象
 * @param {boolean} includeTime - 是否包含时间
 * @returns {string} 格式化后的日期字符串
 */
function formatDateTime(date, includeTime = true) {
    const d = new Date(date);
    
    if (isNaN(d.getTime())) {
        return '未知时间';
    }
    
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    // 如果是今天
    if (d.toDateString() === now.toDateString()) {
        if (diffMins < 1) {
            return '刚刚';
        } else if (diffMins < 60) {
            return `${diffMins}分钟前`;
        } else {
            return `${diffHours}小时前`;
        }
    }
    
    // 如果是昨天
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) {
        return '昨天 ' + d.toLocaleTimeString('zh-CN', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }
    
    // 如果是今年
    if (d.getFullYear() === now.getFullYear()) {
        const month = d.getMonth() + 1;
        const day = d.getDate();
        
        if (includeTime) {
            const time = d.toLocaleTimeString('zh-CN', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
            return `${month}月${day}日 ${time}`;
        } else {
            return `${month}月${day}日`;
        }
    }
    
    // 其他年份
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const day = d.getDate();
    
    if (includeTime) {
        const time = d.toLocaleTimeString('zh-CN', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        return `${year}年${month}月${day}日 ${time}`;
    } else {
        return `${year}年${month}月${day}日`;
    }
}

/**
 * 生成随机ID
 * @param {number} length - ID长度
 * @returns {string} 随机ID
 */
function generateRandomId(length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

/**
 * 防抖函数
 * @param {Function} func - 要执行的函数
 * @param {number} wait - 等待时间（毫秒）
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
 * 节流函数
 * @param {Function} func - 要执行的函数
 * @param {number} limit - 限制时间（毫秒）
 * @returns {Function} 节流后的函数
 */
function throttle(func, limit) {
    let inThrottle;
    return function executedFunction(...args) {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * 检查是否在移动设备上
 * @returns {boolean} 是否在移动设备上
 */
function isMobileDevice() {
    return window.innerWidth <= 768;
}

// ============================================
// 错误处理
// ============================================

/**
 * 初始化错误处理
 */
function initErrorHandling() {
    // 全局错误捕获
    window.addEventListener('error', handleGlobalError);
    
    // Promise rejection 捕获
    window.addEventListener('unhandledrejection', handlePromiseRejection);
}

/**
 * 处理全局错误
 * @param {ErrorEvent} event - 错误事件
 */
function handleGlobalError(event) {
    console.error('全局错误:', event.error);
    
    // 显示错误通知
    showNotification('发生了一个错误，请刷新页面重试', 'error', 5000);
    
    // 发送错误报告（如果需要）
    if (CONFIG.DEBUG) {
        console.log('错误详情:', {
            message: event.message,
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
            error: event.error
        });
    }
}

/**
 * 处理Promise拒绝
 * @param {PromiseRejectionEvent} event - Promise拒绝事件
 */
function handlePromiseRejection(event) {
    console.error('未处理的Promise拒绝:', event.reason);
    
    // 显示错误通知
    showNotification('发生了一个错误，请稍后重试', 'error', 5000);
}

// ============================================
// 倒计时功能
// ============================================

/**
 * 初始化倒计时
 */
function initCountdown() {
    const countdownElement = document.getElementById('countdown-display');
    const messageElement = document.getElementById('countdown-message');
    
    if (!countdownElement || !messageElement) return;
    
    function updateCountdown() {
        const now = new Date().getTime();
        const eventDate = new Date(CONFIG.COUNTDOWN_END_DATE).getTime();
        const distance = eventDate - now;
        
        // 计算天、时、分、秒
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        
        // 更新显示
        countdownElement.innerHTML = `
            <div class="countdown-item">
                <div class="countdown-value">${days}</div>
                <div class="countdown-label">天</div>
            </div>
            <div class="countdown-item">
                <div class="countdown-value">${hours}</div>
                <div class="countdown-label">时</div>
            </div>
            <div class="countdown-item">
                <div class="countdown-value">${minutes}</div>
                <div class="countdown-label">分</div>
            </div>
            <div class="countdown-item">
                <div class="countdown-value">${seconds}</div>
                <div class="countdown-label">秒</div>
            </div>
        `;
        
        // 更新消息
        messageElement.textContent = CONFIG.getCountdownMessage(distance);
        
        // 如果倒计时结束
        if (distance < 0) {
            clearInterval(countdownInterval);
            countdownElement.innerHTML = `
                <div class="countdown-item">
                    <div class="countdown-value">🎉</div>
                    <div class="countdown-label">已开始</div>
                </div>
            `;
            messageElement.textContent = CONFIG.TEXTS.COUNTDOWN_MESSAGES.STARTED;
        }
    }
    
    // 立即更新一次
    updateCountdown();
    
    // 每秒更新一次
    const countdownInterval = setInterval(updateCountdown, 1000);
}

// ============================================
// 留言板预览
// ============================================

/**
 * 初始化留言板预览
 */
function initMessagePreview() {
    const messageListElement = document.getElementById('message-preview-list');
    if (!messageListElement) return;
    
    // 使用配置中的默认留言
    const messages = CONFIG.MESSAGES.DEFAULT_MESSAGES.slice(0, 3); // 只显示前3条
    
    if (messages.length === 0) {
        messageListElement.innerHTML = `
            <div class="empty-message">
                <p>还没有留言，快来成为第一个吧！</p>
            </div>
        `;
        return;
    }
    
    let messagesHTML = '';
    
    messages.forEach(message => {
        const time = formatDateTime(message.timestamp);
        
        messagesHTML += `
            <div class="message-item">
                <div class="message-avatar">
                    ${getInitials(message.user)}
                </div>
                <div class="message-content">
                    <div class="message-header">
                        <span class="message-user">${message.user}</span>
                        <span class="message-time">${time}</span>
                    </div>
                    <div class="message-text">${message.content}</div>
                </div>
            </div>
        `;
    });
    
    messageListElement.innerHTML = messagesHTML;
}

/**
 * 获取用户名的首字母
 * @param {string} name - 用户名
 * @returns {string} 首字母
 */
function getInitials(name) {
    if (!name) return '?';
    return name.charAt(0);
}

// ============================================
// 导出函数（用于模块间调用）
// ============================================

// 将需要导出的函数挂载到全局对象上
if (typeof window !== 'undefined') {
    window.App = {
        // 应用状态
        state: APP_STATE,
        config: CONFIG,
        
        // 核心函数
        initApp,
        showPage,
        addUserPoints,
        spendUserPoints,
        showNotification,
        formatDateTime,
        
        // 工具函数
        generateRandomId,
        debounce,
        throttle,
        isMobileDevice,
        
        // 游戏相关
        getGameDifficulty: CONFIG.calculateGameDifficulty,
        getGameParams: CONFIG.getGameParams
    };
}

// ============================================
// 自动初始化
// ============================================

// 当DOM加载完成后初始化应用
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    // DOM已经加载完成
    setTimeout(initApp, 0);
}

// 监听哈希变化（用于处理直接通过链接访问的情况）
window.addEventListener('hashchange', handleHashChange);

// 初始化错误处理
initErrorHandling();

// 导出模块（如果使用模块系统）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initApp,
        showPage,
        addUserPoints,
        spendUserPoints,
        showNotification,
        formatDateTime,
        generateRandomId,
        debounce,
        throttle,
        isMobileDevice
    };
}

console.log('🎀 script.js 已加载，等待初始化...');