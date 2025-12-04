// navigation.js - 导航模块
// 处理导航栏、用户认证、API接口等功能

/**
 * 导航模块初始化
 */
function initNavigation() {
    console.log('🚀 初始化导航模块...');
    
    // 初始化移动端菜单
    initMobileMenu();
    
    // 初始化用户认证
    initUserAuth();
    
    // 初始化API配置
    initAPI();
    
    // 初始化用户信息显示
    updateNavigationUserInfo();
    
    // 添加导航栏样式切换
    initNavbarScroll();
    
    console.log('✅ 导航模块初始化完成');
}

/**
 * 初始化移动端菜单
 */
function initMobileMenu() {
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const navLinks = document.getElementById('nav-links');
    
    if (!mobileMenuButton || !navLinks) return;
    
    // 点击菜单按钮切换菜单
    mobileMenuButton.addEventListener('click', function() {
        const isActive = navLinks.classList.contains('active');
        
        if (isActive) {
            closeMobileMenu();
        } else {
            openMobileMenu();
        }
    });
    
    // 点击菜单项后关闭菜单（移动端）
    const navItems = navLinks.querySelectorAll('.nav-link');
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            if (window.innerWidth <= 768) {
                closeMobileMenu();
            }
        });
    });
    
    // ESC键关闭菜单
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' && navLinks.classList.contains('active')) {
            closeMobileMenu();
        }
    });
    
    // 点击外部关闭菜单
    document.addEventListener('click', function(event) {
        if (navLinks.classList.contains('active') && 
            !navLinks.contains(event.target) && 
            !mobileMenuButton.contains(event.target)) {
            closeMobileMenu();
        }
    });
}

/**
 * 打开移动端菜单
 */
function openMobileMenu() {
    const navLinks = document.getElementById('nav-links');
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    
    if (!navLinks || !mobileMenuButton) return;
    
    navLinks.classList.add('active');
    mobileMenuButton.innerHTML = '<i class="fas fa-times"></i>';
    mobileMenuButton.setAttribute('aria-expanded', 'true');
    
    // 禁止背景滚动
    document.body.style.overflow = 'hidden';
    
    // 触发事件
    window.dispatchEvent(new CustomEvent('navigation:menu-opened'));
}

/**
 * 关闭移动端菜单
 */
function closeMobileMenu() {
    const navLinks = document.getElementById('nav-links');
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    
    if (!navLinks || !mobileMenuButton) return;
    
    navLinks.classList.remove('active');
    mobileMenuButton.innerHTML = '<i class="fas fa-bars"></i>';
    mobileMenuButton.setAttribute('aria-expanded', 'false');
    
    // 恢复背景滚动
    document.body.style.overflow = '';
    
    // 触发事件
    window.dispatchEvent(new CustomEvent('navigation:menu-closed'));
}

/**
 * 初始化用户认证
 */
function initUserAuth() {
    // 检查登录状态
    checkLoginStatus();
    
    // 监听用户数据变化
    window.addEventListener('user:updated', updateNavigationUserInfo);
    
    // 用户点击头像（未来可扩展为个人中心）
    const userAvatar = document.getElementById('user-avatar');
    if (userAvatar) {
        userAvatar.addEventListener('click', function() {
            showUserProfile();
        });
    }
}

/**
 * 检查登录状态
 */
function checkLoginStatus() {
    // 这里预留API接口，从后端获取登录状态
    // 目前使用localStorage模拟
    
    const username = localStorage.getItem(CONFIG.STORAGE_KEYS.USER_NAME) || '契约者';
    const points = localStorage.getItem(CONFIG.STORAGE_KEYS.USER_POINTS) || 0;
    
    // 触发用户数据更新事件
    window.dispatchEvent(new CustomEvent('user:data-loaded', {
        detail: { username, points }
    }));
}

/**
 * 更新导航栏用户信息显示
 */
function updateNavigationUserInfo() {
    const user = window.App?.state?.userData;
    if (!user) return;
    
    // 更新桌面端显示
    const desktopName = document.getElementById('username-display-desktop');
    const desktopPoints = document.getElementById('user-points-display');
    
    if (desktopName) {
        desktopName.textContent = user.name;
    }
    
    if (desktopPoints) {
        desktopPoints.textContent = `${user.points} 魔力`;
    }
    
    // 更新移动端显示
    const mobileName = document.getElementById('username-display');
    if (mobileName) {
        mobileName.textContent = user.name;
    }
    
    // 更新头像显示
    updateUserAvatar();
}

/**
 * 更新用户头像
 */
function updateUserAvatar() {
    const userAvatar = document.getElementById('user-avatar');
    const user = window.App?.state?.userData;
    
    if (!userAvatar || !user) return;
    
    // 可以根据用户等级或成就显示不同头像
    // 这里简单根据用户名生成颜色
    const colors = ['#FF9AC8', '#FFC8E8', '#A8E6CF', '#FFD3B6', '#74B9FF'];
    const colorIndex = user.name.charCodeAt(0) % colors.length;
    const bgColor = colors[colorIndex];
    
    userAvatar.style.background = `linear-gradient(135deg, ${bgColor}, ${darkenColor(bgColor, 20)})`;
    userAvatar.innerHTML = `<span>${user.name.charAt(0)}</span>`;
}

/**
 * 颜色加深
 */
function darkenColor(color, percent) {
    // 简化处理，实际应解析颜色值
    return color;
}

/**
 * 显示用户个人资料
 */
function showUserProfile() {
    const user = window.App?.state?.userData;
    if (!user) return;
    
    const modalContent = `
        <div class="modal-content user-profile">
            <div class="profile-header">
                <div class="profile-avatar" style="background: linear-gradient(135deg, #FF9AC8, #FF6BAC);">
                    <span>${user.name.charAt(0)}</span>
                </div>
                <h2 class="profile-name">${user.name}</h2>
                <p class="profile-title">桃汽水公主的契约者</p>
            </div>
            
            <div class="profile-stats">
                <div class="stat-item">
                    <div class="stat-value">${user.points}</div>
                    <div class="stat-label">魔力值</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${user.gamesPlayed || 0}</div>
                    <div class="stat-label">游戏次数</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${user.wheelSpins || 0}</div>
                    <div class="stat-label">抽奖次数</div>
                </div>
            </div>
            
            <div class="profile-actions">
                <button class="btn btn-secondary" onclick="changeUsername()">
                    <i class="fas fa-edit"></i> 修改昵称
                </button>
                <button class="btn btn-secondary" onclick="resetProgress()">
                    <i class="fas fa-redo"></i> 重置进度
                </button>
            </div>
            
            <div class="profile-footer">
                <p>UID: ${generateUserId(user.name)}</p>
                <p>注册时间: ${formatDateTime(user.lastVisit, false)}</p>
            </div>
        </div>
    `;
    
    showModal('用户信息', modalContent, { width: '400px', showClose: true });
}

/**
 * 生成用户ID
 */
function generateUserId(username) {
    // 简单hash生成用户ID
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
        hash = ((hash << 5) - hash) + username.charCodeAt(i);
        hash |= 0;
    }
    return 'TC' + Math.abs(hash).toString().slice(0, 8);
}

/**
 * 初始化API配置
 */
function initAPI() {
    // 创建API实例
    window.ApiClient = {
        // API基础URL - 请根据您的华为云服务器配置修改
        baseURL: 'https://your-domain.com/api', // TODO: 替换为您的服务器地址
        
        // 默认请求头
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        
        /**
         * 发起API请求
         */
        async request(endpoint, options = {}) {
            const url = this.baseURL + endpoint;
            const config = {
                method: options.method || 'GET',
                headers: { ...this.headers, ...options.headers },
                ...options
            };
            
            try {
                console.log(`📡 API请求: ${config.method} ${url}`);
                const response = await fetch(url, config);
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const data = await response.json();
                return data;
            } catch (error) {
                console.error('API请求失败:', error);
                throw error;
            }
        },
        
        // ========== 用户相关API ==========
        
        /**
         * 获取用户信息
         */
        async getUserInfo(userId) {
            try {
                return await this.request(`/users/${userId}`);
            } catch (error) {
                // 如果后端API未实现，返回本地数据
                return getLocalUserInfo();
            }
        },
        
        /**
         * 更新用户信息
         */
        async updateUserInfo(userData) {
            try {
                return await this.request('/users/update', {
                    method: 'POST',
                    body: JSON.stringify(userData)
                });
            } catch (error) {
                // 保存到本地存储
                saveUserInfoLocal(userData);
                return { success: true, message: '本地保存成功' };
            }
        },
        
        /**
         * 提交游戏分数
         */
        async submitGameScore(gameData) {
            try {
                return await this.request('/scores/submit', {
                    method: 'POST',
                    body: JSON.stringify(gameData)
                });
            } catch (error) {
                console.warn('提交分数失败，使用本地存储:', error);
                saveScoreLocal(gameData);
                return { success: true, message: '本地保存成功' };
            }
        },
        
        /**
         * 获取排行榜数据
         */
        async getRankingList(type = 'daily', limit = 100) {
            try {
                return await this.request(`/ranking/${type}?limit=${limit}`);
            } catch (error) {
                // 返回本地模拟数据
                return generateRankingData(limit);
            }
        },
        
        /**
         * 提交留言
         */
        async submitMessage(messageData) {
            try {
                return await this.request('/messages/submit', {
                    method: 'POST',
                    body: JSON.stringify(messageData)
                });
            } catch (error) {
                // 保存到本地
                saveMessageLocal(messageData);
                return { 
                    success: true, 
                    message: '留言已保存到本地',
                    data: { id: Date.now(), ...messageData }
                };
            }
        },
        
        /**
         * 获取留言列表
         */
        async getMessages(page = 1, limit = 20) {
            try {
                return await this.request(`/messages?page=${page}&limit=${limit}`);
            } catch (error) {
                // 返回本地数据
                return getLocalMessages(page, limit);
            }
        },
        
        /**
         * 检查服务器状态
         */
        async checkServerStatus() {
            try {
                const response = await this.request('/health');
                return {
                    online: true,
                    responseTime: Date.now() - performance.now(),
                    ...response
                };
            } catch (error) {
                return {
                    online: false,
                    error: error.message
                };
            }
        },
        
        /**
         * 上传文件（如图片）
         */
        async uploadFile(file, type = 'image') {
            try {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('type', type);
                
                return await this.request('/upload', {
                    method: 'POST',
                    headers: {},
                    body: formData
                });
            } catch (error) {
                // 转换为Data URL并保存到本地
                return new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        resolve({
                            success: true,
                            url: e.target.result,
                            message: '文件已保存到本地'
                        });
                    };
                    reader.readAsDataURL(file);
                });
            }
        },
        
        /**
         * 获取实时统计数据
         */
        async getRealtimeStats() {
            try {
                return await this.request('/stats/realtime');
            } catch (error) {
                // 返回模拟数据
                return {
                    onlineUsers: Math.floor(Math.random() * 100) + 50,
                    activeGames: Math.floor(Math.random() * 20) + 5,
                    totalPointsToday: Math.floor(Math.random() * 10000) + 5000,
                    messagesToday: Math.floor(Math.random() * 50) + 10
                };
            }
        }
    };
    
    // 设置默认baseURL（如果配置中有）
    if (CONFIG.API && CONFIG.API.BASE_URL) {
        window.ApiClient.baseURL = CONFIG.API.BASE_URL;
    }
    
    // 测试服务器连接
    testAPIConnection();
}

/**
 * 测试API连接
 */
async function testAPIConnection() {
    if (!CONFIG.DEBUG) return;
    
    try {
        const status = await window.ApiClient.checkServerStatus();
        console.log('🌐 服务器状态:', status.online ? '在线' : '离线');
        
        if (status.online) {
            console.log('✅ API接口可用');
        } else {
            console.warn('⚠️  API接口不可用，将使用本地存储');
        }
    } catch (error) {
        console.warn('⚠️  API测试失败:', error.message);
    }
}

/**
 * 获取本地用户信息
 */
function getLocalUserInfo() {
    const username = localStorage.getItem(CONFIG.STORAGE_KEYS.USER_NAME) || '契约者';
    const points = parseInt(localStorage.getItem(CONFIG.STORAGE_KEYS.USER_POINTS)) || 0;
    
    return {
        id: generateUserId(username),
        username,
        points,
        level: Math.floor(points / 1000) + 1,
        joinDate: new Date().toISOString(),
        achievements: []
    };
}

/**
 * 保存用户信息到本地
 */
function saveUserInfoLocal(userData) {
    if (userData.username) {
        localStorage.setItem(CONFIG.STORAGE_KEYS.USER_NAME, userData.username);
    }
    if (userData.points !== undefined) {
        localStorage.setItem(CONFIG.STORAGE_KEYS.USER_POINTS, userData.points.toString());
    }
    
    // 更新全局状态
    if (window.App && window.App.state) {
        window.App.state.userData = {
            ...window.App.state.userData,
            ...userData
        };
        window.dispatchEvent(new CustomEvent('user:updated'));
    }
}

/**
 * 保存分数到本地
 */
function saveScoreLocal(gameData) {
    const { game, score, time } = gameData;
    
    // 获取现有分数
    const highScores = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.GAME_HIGH_SCORES) || '{}');
    
    if (!highScores[game] || score > highScores[game].score) {
        highScores[game] = { score, time: Date.now(), ...gameData };
        localStorage.setItem(CONFIG.STORAGE_KEYS.GAME_HIGH_SCORES, JSON.stringify(highScores));
        
        // 触发事件
        window.dispatchEvent(new CustomEvent('game:high-score', { detail: gameData }));
    }
}

/**
 * 生成排行榜模拟数据
 */
function generateRankingData(limit = 100) {
    const data = [];
    const names = ['桃汽水头号粉丝', '气泡捕捉大师', '魔法阵研究员', '次元旅行者', 
                  '精灵契约者', '桃色梦境', '汽水爱好者', '永恒契约', '魔法学徒', '星光守护者'];
    
    for (let i = 0; i < limit; i++) {
        const nameIndex = i % names.length;
        const baseScore = 10000 - (i * 100);
        const randomScore = Math.floor(Math.random() * 500);
        
        data.push({
            rank: i + 1,
            userId: `USER${1000 + i}`,
            username: i < names.length ? names[i] : `契约者${i + 1}`,
            points: Math.max(100, baseScore + randomScore),
            level: Math.floor(i / 10) + 1,
            gamesPlayed: Math.floor(Math.random() * 100) + 10,
            lastActive: new Date(Date.now() - Math.random() * 86400000).toISOString() // 24小时内
        });
    }
    
    return data;
}

/**
 * 保存留言到本地
 */
function saveMessageLocal(messageData) {
    const messages = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.USER_MESSAGES) || '[]');
    
    const newMessage = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        ...messageData
    };
    
    messages.unshift(newMessage);
    localStorage.setItem(CONFIG.STORAGE_KEYS.USER_MESSAGES, JSON.stringify(messages.slice(0, 100)));
    
    // 触发事件
    window.dispatchEvent(new CustomEvent('message:submitted', { detail: newMessage }));
}

/**
 * 获取本地留言
 */
function getLocalMessages(page = 1, limit = 20) {
    const allMessages = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.USER_MESSAGES) || '[]');
    
    // 如果没有留言，返回默认留言
    if (allMessages.length === 0) {
        return {
            messages: CONFIG.MESSAGES.DEFAULT_MESSAGES,
            total: CONFIG.MESSAGES.DEFAULT_MESSAGES.length,
            page,
            limit,
            totalPages: 1
        };
    }
    
    const start = (page - 1) * limit;
    const end = start + limit;
    
    return {
        messages: allMessages.slice(start, end),
        total: allMessages.length,
        page,
        limit,
        totalPages: Math.ceil(allMessages.length / limit)
    };
}

/**
 * 初始化导航栏滚动效果
 */
function initNavbarScroll() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;
    
    let lastScroll = 0;
    const scrollThreshold = 100;
    
    window.addEventListener('scroll', function() {
        const currentScroll = window.pageYOffset;
        
        // 向下滚动超过阈值时隐藏导航栏
        if (currentScroll > lastScroll && currentScroll > scrollThreshold) {
            navbar.classList.add('navbar-hidden');
        } else {
            navbar.classList.remove('navbar-hidden');
        }
        
        // 添加滚动阴影
        if (currentScroll > 10) {
            navbar.classList.add('navbar-scrolled');
        } else {
            navbar.classList.remove('navbar-scrolled');
        }
        
        lastScroll = currentScroll;
    }, { passive: true });
}

/**
 * 显示模态框
 */
function showModal(title, content, options = {}) {
    const modalId = 'modal-' + Date.now();
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = modalId;
    modal.innerHTML = `
        <div class="modal-overlay"></div>
        <div class="modal-dialog" style="max-width: ${options.width || '600px'}">
            <div class="modal-header">
                <h3 class="modal-title">${title}</h3>
                ${options.showClose ? '<button class="modal-close" aria-label="关闭">&times;</button>' : ''}
            </div>
            <div class="modal-body">${content}</div>
            ${options.footer ? `<div class="modal-footer">${options.footer}</div>` : ''}
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // 显示动画
    setTimeout(() => {
        modal.classList.add('active');
    }, 10);
    
    // 绑定关闭事件
    if (options.showClose) {
        const closeBtn = modal.querySelector('.modal-close');
        const overlay = modal.querySelector('.modal-overlay');
        
        const closeModal = () => {
            modal.classList.remove('active');
            setTimeout(() => {
                if (modal.parentNode) {
                    modal.parentNode.removeChild(modal);
                }
            }, 300);
        };
        
        if (closeBtn) closeBtn.addEventListener('click', closeModal);
        if (overlay) overlay.addEventListener('click', closeModal);
        
        // ESC键关闭
        if (options.escClose !== false) {
            const escHandler = (e) => {
                if (e.key === 'Escape') {
                    closeModal();
                    document.removeEventListener('keydown', escHandler);
                }
            };
            document.addEventListener('keydown', escHandler);
        }
    }
    
    return modalId;
}

/**
 * 修改用户名
 */
function changeUsername() {
    const currentName = window.App?.state?.userData?.name || '契约者';
    
    const modalContent = `
        <div class="change-username-form">
            <div class="form-group">
                <label for="new-username">新昵称：</label>
                <input type="text" id="new-username" class="form-control" 
                       value="${currentName}" maxlength="10">
                <p class="form-hint">最多10个字符</p>
            </div>
            <div class="form-actions">
                <button class="btn btn-primary" onclick="saveUsername()">
                    <i class="fas fa-save"></i> 保存
                </button>
                <button class="btn btn-secondary" onclick="closeCurrentModal()">
                    取消
                </button>
            </div>
        </div>
    `;
    
    showModal('修改昵称', modalContent, { width: '400px', showClose: true });
}

/**
 * 保存用户名
 */
function saveUsername() {
    const newName = document.getElementById('new-username').value.trim();
    
    if (!newName) {
        window.App.showNotification('昵称不能为空', 'error');
        return;
    }
    
    if (newName.length > 10) {
        window.App.showNotification('昵称最多10个字符', 'error');
        return;
    }
    
    // 保存到本地
    localStorage.setItem(CONFIG.STORAGE_KEYS.USER_NAME, newName);
    
    // 更新全局状态
    if (window.App && window.App.state) {
        window.App.state.userData.name = newName;
        window.dispatchEvent(new CustomEvent('user:updated'));
    }
    
    // 尝试同步到后端
    if (window.ApiClient) {
        window.ApiClient.updateUserInfo({ username: newName })
            .then(result => {
                if (result.success) {
                    window.App.showNotification('昵称修改成功', 'success');
                }
            })
            .catch(error => {
                window.App.showNotification('昵称已保存到本地', 'warning');
            });
    } else {
        window.App.showNotification('昵称修改成功', 'success');
    }
    
    closeCurrentModal();
}

/**
 * 重置游戏进度
 */
function resetProgress() {
    const modalContent = `
        <div class="reset-confirm">
            <div class="warning-icon">
                <i class="fas fa-exclamation-triangle"></i>
            </div>
            <h4>确认重置进度吗？</h4>
            <p>这将清空你的所有数据：</p>
            <ul>
                <li>魔力值归零</li>
                <li>游戏记录清空</li>
                <li>排行榜记录移除</li>
                <li>抽奖次数重置</li>
            </ul>
            <p class="warning-text">此操作不可撤销！</p>
            <div class="confirm-actions">
                <button class="btn btn-danger" onclick="performReset()">
                    <i class="fas fa-trash-alt"></i> 确认重置
                </button>
                <button class="btn btn-secondary" onclick="closeCurrentModal()">
                    取消
                </button>
            </div>
        </div>
    `;
    
    showModal('重置进度', modalContent, { width: '450px', showClose: true });
}

/**
 * 执行重置
 */
function performReset() {
    // 清除所有相关数据
    localStorage.removeItem(CONFIG.STORAGE_KEYS.USER_POINTS);
    localStorage.removeItem(CONFIG.STORAGE_KEYS.GAME_HIGH_SCORES);
    localStorage.removeItem(CONFIG.STORAGE_KEYS.USER_GAMES_PLAYED);
    localStorage.removeItem(CONFIG.STORAGE_KEYS.USER_WHEEL_SPINS);
    
    // 重置用户数据
    if (window.App && window.App.state) {
        window.App.state.userData = {
            ...window.App.state.userData,
            points: 0,
            gamesPlayed: 0,
            wheelSpins: 0
        };
        
        // 触发更新
        window.dispatchEvent(new CustomEvent('user:updated'));
    }
    
    // 显示通知
    window.App.showNotification('进度已重置', 'success');
    
    closeCurrentModal();
}

/**
 * 关闭当前模态框
 */
function closeCurrentModal() {
    const modal = document.querySelector('.modal.active');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => {
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
        }, 300);
    }
}

// ============================================
// 导出模块
// ============================================

// 如果使用模块系统
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initNavigation,
        openMobileMenu,
        closeMobileMenu,
        updateNavigationUserInfo,
        showModal,
        changeUsername,
        resetProgress
    };
}

// 浏览器环境 - 等待DOM加载后初始化
if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function() {
        // 等待主应用初始化完成
        if (window.App && window.App.state) {
            initNavigation();
        } else {
            // 如果App未加载，延迟初始化
            setTimeout(initNavigation, 500);
        }
    });
}

console.log('🧭 navigation.js 已加载');