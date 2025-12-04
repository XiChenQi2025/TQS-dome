// modules/ranking.js - 排行榜模块
// 支持本地数据和API数据，预留华为云服务器API接口

(function() {
    'use strict';
    
    // 私有变量
    let rankingData = [];
    let filteredData = [];
    let currentFilter = 'all'; // 'all', 'daily', 'weekly', 'monthly'
    let isInitialized = false;
    let updateInterval = null;
    
    // API配置
    const API_CONFIG = {
        BASE_URL: CONFIG.API.BASE_URL || '',
        ENDPOINTS: {
            GET_RANKING: CONFIG.API.ENDPOINTS?.GET_RANKING || '/api/ranking',
            SUBMIT_SCORE: CONFIG.API.ENDPOINTS?.SUBMIT_SCORE || '/api/submit-score',
            GET_USER_STATS: CONFIG.API.ENDPOINTS?.GET_USER_STATS || '/api/user-stats'
        },
        USE_API: false, // 默认不使用API，使用本地数据
        API_KEY: '', // 如果需要API密钥
        TIMEOUT: 10000 // API请求超时时间
    };
    
    // 检查是否有可用的API配置
    if (API_CONFIG.BASE_URL && API_CONFIG.BASE_URL !== '') {
        API_CONFIG.USE_API = true;
        console.log('🎯 排行榜模块：启用API模式，使用华为云服务器');
    } else {
        console.log('🎯 排行榜模块：启用本地数据模式');
    }
    
    // ============================================
    // 初始化函数
    // ============================================
    
    /**
     * 初始化排行榜模块
     */
    function initRanking() {
        if (isInitialized) return;
        
        console.log('🏆 初始化排行榜模块...');
        
        // 绑定事件监听器
        bindEvents();
        
        // 加载排行榜数据
        loadRankingData();
        
        // 设置自动更新
        if (CONFIG.RANKING.UPDATE_INTERVAL > 0) {
            updateInterval = setInterval(() => {
                loadRankingData();
            }, CONFIG.RANKING.UPDATE_INTERVAL);
        }
        
        isInitialized = true;
        
        // 触发自定义事件
        window.dispatchEvent(new CustomEvent('ranking:initialized'));
        
        console.log('✨ 排行榜模块初始化完成');
    }
    
    /**
     * 绑定事件监听器
     */
    function bindEvents() {
        // 筛选按钮
        const filterButtons = document.querySelectorAll('.ranking-filters .filter-button');
        filterButtons.forEach(button => {
            button.addEventListener('click', handleFilterClick);
        });
        
        // 刷新按钮
        const refreshButton = document.getElementById('refresh-ranking');
        if (refreshButton) {
            refreshButton.addEventListener('click', handleRefreshClick);
        }
        
        // 排行榜类型选择
        const typeSelect = document.getElementById('ranking-type-select');
        if (typeSelect) {
            typeSelect.addEventListener('change', handleTypeSelectChange);
        }
        
        // 分页按钮
        const prevPageBtn = document.getElementById('ranking-prev-page');
        const nextPageBtn = document.getElementById('ranking-next-page');
        
        if (prevPageBtn) prevPageBtn.addEventListener('click', handlePrevPageClick);
        if (nextPageBtn) nextPageBtn.addEventListener('click', handleNextPageClick);
    }
    
    // ============================================
    // 数据管理
    // ============================================
    
    /**
     * 加载排行榜数据
     */
    function loadRankingData() {
        if (API_CONFIG.USE_API) {
            loadFromAPI();
        } else {
            loadFromLocal();
        }
    }
    
    /**
     * 从API加载排行榜数据
     */
    async function loadFromAPI() {
        try {
            showLoadingState(true);
            
            // 构建请求参数
            const params = new URLSearchParams({
                type: currentFilter,
                limit: CONFIG.RANKING.TOP_N || 50,
                timestamp: Date.now()
            });
            
            // 发送API请求
            const response = await fetchWithTimeout(
                `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.GET_RANKING}?${params}`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(API_CONFIG.API_KEY ? { 'Authorization': `Bearer ${API_CONFIG.API_KEY}` } : {})
                    }
                },
                API_CONFIG.TIMEOUT
            );
            
            if (!response.ok) {
                throw new Error(`API请求失败: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success) {
                rankingData = data.data || [];
                filteredData = [...rankingData];
                renderRankingTable();
                updateUserRankInfo();
            } else {
                console.warn('API返回错误:', data.message);
                // 降级到本地数据
                loadFromLocal();
            }
            
        } catch (error) {
            console.error('加载API数据失败:', error);
            showNotification('无法连接服务器，使用本地数据', 'warning');
            // 降级到本地数据
            loadFromLocal();
        } finally {
            showLoadingState(false);
        }
    }
    
    /**
     * 从本地数据加载排行榜
     */
    function loadFromLocal() {
        try {
            showLoadingState(true);
            
            // 生成模拟数据
            generateMockData();
            
            // 应用当前筛选
            applyFilter(currentFilter);
            
            // 渲染表格
            renderRankingTable();
            
            // 更新用户排名信息
            updateUserRankInfo();
            
            // 更新最后更新时间
            updateLastUpdateTime();
            
        } catch (error) {
            console.error('加载本地数据失败:', error);
            showErrorState();
        } finally {
            showLoadingState(false);
        }
    }
    
    /**
     * 生成模拟排行榜数据
     */
    function generateMockData() {
        // 获取当前用户数据
        const currentUserData = window.App?.state?.userData || {
            name: '契约者',
            points: 0,
            gamesPlayed: 0,
            wheelSpins: 0
        };
        
        // 模拟用户名字列表
        const mockNames = [
            '桃汽水头号粉丝', '气泡捕捉大师', '魔法阵研究员', '次元旅行者', '精灵契约者',
            '桃色梦境', '汽水爱好者', '永恒契约', '魔法学徒', '星光守护者',
            '异世界勇者', '公主护卫队', '魔力收集者', '转盘赌神', '记忆大师',
            '快速反应王', '周年庆之星', '幸运契约者', '桃汽水应援团', '魔法使徒'
        ];
        
        // 生成模拟数据
        rankingData = [];
        
        // 添加当前用户
        rankingData.push({
            id: 'current_user',
            rank: 0,
            name: currentUserData.name,
            points: currentUserData.points,
            gamesPlayed: currentUserData.gamesPlayed || 0,
            wheelSpins: currentUserData.wheelSpins || 0,
            lastActive: new Date().toISOString(),
            isCurrentUser: true
        });
        
        // 生成其他用户数据
        for (let i = 0; i < mockNames.length; i++) {
            // 生成随机积分（范围：1000-50000）
            const randomPoints = Math.floor(Math.random() * 49000) + 1000;
            
            // 随机游戏次数
            const randomGames = Math.floor(Math.random() * 100) + 10;
            
            // 随机转盘次数
            const randomSpins = Math.floor(Math.random() * 50) + 5;
            
            // 随机最后活动时间（最近7天内）
            const randomDays = Math.floor(Math.random() * 7);
            const randomHours = Math.floor(Math.random() * 24);
            const lastActive = new Date();
            lastActive.setDate(lastActive.getDate() - randomDays);
            lastActive.setHours(lastActive.getHours() - randomHours);
            
            rankingData.push({
                id: `mock_user_${i + 1}`,
                rank: 0,
                name: mockNames[i],
                points: randomPoints,
                gamesPlayed: randomGames,
                wheelSpins: randomSpins,
                lastActive: lastActive.toISOString(),
                isCurrentUser: false
            });
        }
        
        // 按积分排序
        rankingData.sort((a, b) => b.points - a.points);
        
        // 更新排名
        rankingData.forEach((user, index) => {
            user.rank = index + 1;
        });
    }
    
    /**
     * 应用筛选条件
     * @param {string} filter - 筛选类型
     */
    function applyFilter(filter) {
        currentFilter = filter;
        
        switch(filter) {
            case 'daily':
                // 模拟筛选：只显示今天有活动的用户
                filteredData = rankingData.filter(user => {
                    const lastActive = new Date(user.lastActive);
                    const today = new Date();
                    return lastActive.toDateString() === today.toDateString();
                });
                break;
                
            case 'weekly':
                // 模拟筛选：显示本周有活动的用户
                filteredData = rankingData.filter(user => {
                    const lastActive = new Date(user.lastActive);
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return lastActive >= weekAgo;
                });
                break;
                
            case 'monthly':
                // 模拟筛选：显示本月有活动的用户
                filteredData = rankingData.filter(user => {
                    const lastActive = new Date(user.lastActive);
                    const monthAgo = new Date();
                    monthAgo.setMonth(monthAgo.getMonth() - 1);
                    return lastActive >= monthAgo;
                });
                break;
                
            default:
                // 'all' - 显示所有用户
                filteredData = [...rankingData];
        }
        
        // 重新排序
        filteredData.sort((a, b) => b.points - a.points);
        
        // 更新排名
        filteredData.forEach((user, index) => {
            user.filteredRank = index + 1;
        });
    }
    
    // ============================================
    // 渲染函数
    // ============================================
    
    /**
     * 渲染排行榜表格
     */
    function renderRankingTable() {
        const container = document.getElementById('ranking-container');
        if (!container) return;
        
        const itemsPerPage = CONFIG.RANKING.ITEMS_PER_PAGE || 20;
        const currentPage = getCurrentPage();
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const pageData = filteredData.slice(startIndex, endIndex);
        
        // 构建表格HTML
        let tableHTML = `
            <div class="ranking-header">
                <h2 class="ranking-title">
                    <i class="fas fa-trophy"></i>
                    <span id="ranking-filter-title">${getFilterTitle()}</span>
                    <span class="ranking-count">(${filteredData.length}名契约者)</span>
                </h2>
                <div class="ranking-controls">
                    <div class="ranking-filters">
                        <button class="filter-button ${currentFilter === 'all' ? 'active' : ''}" data-filter="all">
                            总榜
                        </button>
                        <button class="filter-button ${currentFilter === 'daily' ? 'active' : ''}" data-filter="daily">
                            日榜
                        </button>
                        <button class="filter-button ${currentFilter === 'weekly' ? 'active' : ''}" data-filter="weekly">
                            周榜
                        </button>
                        <button class="filter-button ${currentFilter === 'monthly' ? 'active' : ''}" data-filter="monthly">
                            月榜
                        </button>
                    </div>
                    <div class="ranking-extra">
                        <button class="refresh-button" id="refresh-ranking" title="刷新排行榜">
                            <i class="fas fa-sync-alt"></i>
                        </button>
                        <div class="api-status" id="api-status">
                            ${API_CONFIG.USE_API ? '<i class="fas fa-cloud"></i> 云端' : '<i class="fas fa-desktop"></i> 本地'}
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="ranking-table-wrapper">
                <table class="ranking-table">
                    <thead>
                        <tr>
                            <th width="80">排名</th>
                            <th>契约者</th>
                            <th width="120">魔力值</th>
                            <th width="100">游戏次数</th>
                            <th width="100">转盘次数</th>
                            <th width="150">最后活跃</th>
                        </tr>
                    </thead>
                    <tbody id="ranking-table-body">
        `;
        
        if (pageData.length === 0) {
            tableHTML += `
                <tr>
                    <td colspan="6" class="no-data">
                        <i class="fas fa-user-slash"></i>
                        <p>暂无排行榜数据</p>
                    </td>
                </tr>
            `;
        } else {
            pageData.forEach(user => {
                const rankClass = getRankClass(user.filteredRank || user.rank);
                const isCurrentUser = user.isCurrentUser || user.name === (window.App?.state?.userData?.name || '契约者');
                const userClass = isCurrentUser ? 'current-user' : '';
                
                tableHTML += `
                    <tr class="${rankClass} ${userClass}" data-user-id="${user.id}">
                        <td>
                            <div class="rank-cell">
                                <span class="rank-number">${user.filteredRank || user.rank}</span>
                                ${user.filteredRank <= 3 ? `<span class="rank-medal">${getRankMedal(user.filteredRank)}</span>` : ''}
                            </div>
                        </td>
                        <td>
                            <div class="user-cell">
                                <div class="user-avatar ${isCurrentUser ? 'current-user-avatar' : ''}">
                                    ${getUserInitial(user.name)}
                                </div>
                                <div class="user-info">
                                    <div class="user-name">
                                        ${user.name}
                                        ${isCurrentUser ? '<span class="current-user-badge">我</span>' : ''}
                                    </div>
                                    <div class="user-id">ID: ${user.id.substring(0, 8)}</div>
                                </div>
                            </div>
                        </td>
                        <td>
                            <div class="points-cell">
                                <span class="points-value">${user.points.toLocaleString()}</span>
                                <div class="points-progress">
                                    <div class="progress-bar" style="width: ${calculateProgress(user.points)}%"></div>
                                </div>
                            </div>
                        </td>
                        <td>
                            <div class="games-cell">
                                <i class="fas fa-gamepad"></i>
                                <span>${user.gamesPlayed}</span>
                            </div>
                        </td>
                        <td>
                            <div class="spins-cell">
                                <i class="fas fa-gift"></i>
                                <span>${user.wheelSpins}</span>
                            </div>
                        </td>
                        <td>
                            <div class="time-cell">
                                <i class="fas fa-clock"></i>
                                <span>${formatLastActive(user.lastActive)}</span>
                            </div>
                        </td>
                    </tr>
                `;
            });
        }
        
        tableHTML += `
                    </tbody>
                </table>
            </div>
            
            <div class="ranking-footer">
                <div class="pagination-controls">
                    <button class="page-button prev-button" id="ranking-prev-page" ${currentPage <= 1 ? 'disabled' : ''}>
                        <i class="fas fa-chevron-left"></i> 上一页
                    </button>
                    <span class="page-info" id="ranking-page-info">
                        第 ${currentPage} 页 / 共 ${Math.ceil(filteredData.length / itemsPerPage)} 页
                    </span>
                    <button class="page-button next-button" id="ranking-next-page" ${endIndex >= filteredData.length ? 'disabled' : ''}>
                        下一页 <i class="fas fa-chevron-right"></i>
                    </button>
                </div>
                <div class="last-update" id="ranking-last-update">
                    <i class="fas fa-sync"></i> 最后更新: 刚刚
                </div>
            </div>
            
            <div class="ranking-legend">
                <div class="legend-item">
                    <div class="legend-color rank-1-color"></div>
                    <span>第1名 (金牌)</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color rank-2-color"></div>
                    <span>第2名 (银牌)</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color rank-3-color"></div>
                    <span>第3名 (铜牌)</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color current-user-color"></div>
                    <span>当前用户</span>
                </div>
            </div>
        `;
        
        container.innerHTML = tableHTML;
        
        // 重新绑定事件
        rebindEvents();
        
        // 触发渲染完成事件
        window.dispatchEvent(new CustomEvent('ranking:rendered'));
    }
    
    /**
     * 更新用户排名信息
     */
    function updateUserRankInfo() {
        const currentUserName = window.App?.state?.userData?.name || '契约者';
        const currentUser = rankingData.find(user => user.name === currentUserName);
        
        if (!currentUser) return;
        
        const userRankInfo = document.getElementById('user-rank-info');
        if (userRankInfo) {
            userRankInfo.innerHTML = `
                <div class="user-rank-card">
                    <div class="rank-header">
                        <h3><i class="fas fa-user-crown"></i> 我的排名</h3>
                        <span class="rank-badge rank-${Math.min(currentUser.rank, 10)}">${currentUser.rank}</span>
                    </div>
                    <div class="rank-details">
                        <div class="detail-item">
                            <span class="label">魔力值:</span>
                            <span class="value">${currentUser.points.toLocaleString()}</span>
                        </div>
                        <div class="detail-item">
                            <span class="label">游戏次数:</span>
                            <span class="value">${currentUser.gamesPlayed}</span>
                        </div>
                        <div class="detail-item">
                            <span class="label">转盘次数:</span>
                            <span class="value">${currentUser.wheelSpins}</span>
                        </div>
                        <div class="detail-item">
                            <span class="label">超越用户:</span>
                            <span class="value">${Math.round((rankingData.length - currentUser.rank) / rankingData.length * 100)}%</span>
                        </div>
                    </div>
                </div>
            `;
        }
        
        // 更新顶部用户信息
        const userRankSummary = document.getElementById('user-rank-summary');
        if (userRankSummary) {
            userRankSummary.innerHTML = `
                <span class="user-rank">我的排名: <strong>${currentUser.rank}</strong></span>
                <span class="user-points">我的魔力: <strong>${currentUser.points.toLocaleString()}</strong></span>
            `;
        }
    }
    
    /**
     * 更新最后更新时间
     */
    function updateLastUpdateTime() {
        const lastUpdateElement = document.getElementById('ranking-last-update');
        if (lastUpdateElement) {
            const now = new Date();
            const timeString = now.toLocaleTimeString('zh-CN', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
            lastUpdateElement.innerHTML = `<i class="fas fa-sync"></i> 最后更新: ${timeString}`;
        }
    }
    
    // ============================================
    // 工具函数
    // ============================================
    
    /**
     * 获取筛选器标题
     * @returns {string} 标题文本
     */
    function getFilterTitle() {
        const titles = {
            'all': '总魔力排行榜',
            'daily': '今日魔力榜',
            'weekly': '本周魔力榜',
            'monthly': '本月魔力榜'
        };
        return titles[currentFilter] || titles.all;
    }
    
    /**
     * 获取排名样式类
     * @param {number} rank - 排名
     * @returns {string} CSS类名
     */
    function getRankClass(rank) {
        if (rank === 1) return 'rank-1';
        if (rank === 2) return 'rank-2';
        if (rank === 3) return 'rank-3';
        if (rank <= 10) return 'rank-top-10';
        if (rank <= 50) return 'rank-top-50';
        return '';
    }
    
    /**
     * 获取排名奖牌
     * @param {number} rank - 排名
     * @returns {string} 奖牌emoji
     */
    function getRankMedal(rank) {
        if (rank === 1) return '🥇';
        if (rank === 2) return '🥈';
        if (rank === 3) return '🥉';
        return '';
    }
    
    /**
     * 获取用户首字母
     * @param {string} name - 用户名
     * @returns {string} 首字母
     */
    function getUserInitial(name) {
        if (!name || name.length === 0) return '?';
        return name.charAt(0).toUpperCase();
    }
    
    /**
     * 计算进度百分比
     * @param {number} points - 魔力值
     * @returns {number} 百分比
     */
    function calculateProgress(points) {
        const maxPoints = Math.max(...rankingData.map(u => u.points));
        if (maxPoints === 0) return 0;
        return (points / maxPoints) * 100;
    }
    
    /**
     * 格式化最后活跃时间
     * @param {string} timestamp - ISO时间戳
     * @returns {string} 格式化时间
     */
    function formatLastActive(timestamp) {
        if (!timestamp) return '从未活跃';
        
        const lastActive = new Date(timestamp);
        const now = new Date();
        const diffMs = now - lastActive;
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffMins < 1) return '刚刚';
        if (diffMins < 60) return `${diffMins}分钟前`;
        if (diffHours < 24) return `${diffHours}小时前`;
        if (diffDays < 7) return `${diffDays}天前`;
        
        return lastActive.toLocaleDateString('zh-CN', { 
            month: 'short', 
            day: 'numeric' 
        });
    }
    
    /**
     * 获取当前页码
     * @returns {number} 当前页码
     */
    function getCurrentPage() {
        return 1; // 简化版本，固定为第一页
    }
    
    /**
     * 显示加载状态
     * @param {boolean} isLoading - 是否正在加载
     */
    function showLoadingState(isLoading) {
        const container = document.getElementById('ranking-container');
        if (!container) return;
        
        if (isLoading) {
            container.innerHTML = `
                <div class="ranking-loading">
                    <div class="loading-spinner">
                        <i class="fas fa-spinner fa-spin fa-3x"></i>
                        <p>加载排行榜数据中...</p>
                        ${API_CONFIG.USE_API ? '<small>正在连接华为云服务器</small>' : ''}
                    </div>
                </div>
            `;
        }
    }
    
    /**
     * 显示错误状态
     */
    function showErrorState() {
        const container = document.getElementById('ranking-container');
        if (!container) return;
        
        container.innerHTML = `
            <div class="ranking-error">
                <div class="error-icon">
                    <i class="fas fa-exclamation-triangle fa-3x"></i>
                </div>
                <h3>加载排行榜失败</h3>
                <p>无法加载排行榜数据，请稍后重试</p>
                <button class="retry-button" id="retry-ranking">
                    <i class="fas fa-redo"></i> 重试
                </button>
                ${API_CONFIG.USE_API ? 
                    '<p class="api-fallback">已切换到本地数据模式</p>' : 
                    ''
                }
            </div>
        `;
        
        // 绑定重试按钮事件
        const retryButton = document.getElementById('retry-ranking');
        if (retryButton) {
            retryButton.addEventListener('click', () => {
                loadRankingData();
            });
        }
    }
    
    /**
     * 显示通知
     * @param {string} message - 消息内容
     * @param {string} type - 消息类型
     */
    function showNotification(message, type = 'info') {
        if (window.App?.showNotification) {
            window.App.showNotification(message, type);
        } else {
            console.log(`${type}: ${message}`);
        }
    }
    
    /**
     * 带超时的fetch请求
     * @param {string} url - 请求URL
     * @param {Object} options - fetch选项
     * @param {number} timeout - 超时时间（毫秒）
     * @returns {Promise} fetch Promise
     */
    function fetchWithTimeout(url, options = {}, timeout = 10000) {
        return Promise.race([
            fetch(url, options),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('请求超时')), timeout)
            )
        ]);
    }
    
    // ============================================
    // 事件处理函数
    // ============================================
    
    /**
     * 处理筛选按钮点击
     * @param {Event} event - 点击事件
     */
    function handleFilterClick(event) {
        const button = event.currentTarget;
        const filter = button.getAttribute('data-filter');
        
        if (!filter || filter === currentFilter) return;
        
        // 更新按钮激活状态
        document.querySelectorAll('.filter-button').forEach(btn => {
            btn.classList.remove('active');
        });
        button.classList.add('active');
        
        // 应用筛选
        applyFilter(filter);
        
        // 重新渲染
        renderRankingTable();
        
        // 显示通知
        showNotification(`切换到${getFilterTitle()}`, 'info');
    }
    
    /**
     * 处理刷新按钮点击
     */
    function handleRefreshClick() {
        loadRankingData();
        showNotification('正在刷新排行榜...', 'info');
    }
    
    /**
     * 处理类型选择变更
     */
    function handleTypeSelectChange(event) {
        const type = event.target.value;
        // 这里可以添加根据类型加载不同数据的逻辑
        console.log('切换到排行榜类型:', type);
    }
    
    /**
     * 处理上一页点击
     */
    function handlePrevPageClick() {
        const currentPage = getCurrentPage();
        if (currentPage > 1) {
            // 更新页码并重新渲染
            renderRankingTable();
        }
    }
    
    /**
     * 处理下一页点击
     */
    function handleNextPageClick() {
        const itemsPerPage = CONFIG.RANKING.ITEMS_PER_PAGE || 20;
        const currentPage = getCurrentPage();
        const totalPages = Math.ceil(filteredData.length / itemsPerPage);
        
        if (currentPage < totalPages) {
            // 更新页码并重新渲染
            renderRankingTable();
        }
    }
    
    /**
     * 重新绑定事件
     */
    function rebindEvents() {
        // 筛选按钮
        const filterButtons = document.querySelectorAll('.filter-button');
        filterButtons.forEach(button => {
            button.removeEventListener('click', handleFilterClick);
            button.addEventListener('click', handleFilterClick);
        });
        
        // 刷新按钮
        const refreshButton = document.getElementById('refresh-ranking');
        if (refreshButton) {
            refreshButton.removeEventListener('click', handleRefreshClick);
            refreshButton.addEventListener('click', handleRefreshClick);
        }
        
        // 分页按钮
        const prevPageBtn = document.getElementById('ranking-prev-page');
        const nextPageBtn = document.getElementById('ranking-next-page');
        
        if (prevPageBtn) {
            prevPageBtn.removeEventListener('click', handlePrevPageClick);
            prevPageBtn.addEventListener('click', handlePrevPageClick);
        }
        
        if (nextPageBtn) {
            nextPageBtn.removeEventListener('click', handleNextPageClick);
            nextPageBtn.addEventListener('click', handleNextPageClick);
        }
    }
    
    // ============================================
    // API函数（供其他模块调用）
    // ============================================
    
    /**
     * 提交用户分数到API
     * @param {Object} scoreData - 分数数据
     * @returns {Promise} API响应
     */
    async function submitScoreToAPI(scoreData) {
        if (!API_CONFIG.USE_API) {
            console.log('API未启用，分数仅保存在本地');
            return { success: true, message: '本地保存成功' };
        }
        
        try {
            const response = await fetchWithTimeout(
                `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SUBMIT_SCORE}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(API_CONFIG.API_KEY ? { 'Authorization': `Bearer ${API_CONFIG.API_KEY}` } : {})
                    },
                    body: JSON.stringify(scoreData)
                },
                API_CONFIG.TIMEOUT
            );
            
            const data = await response.json();
            
            if (data.success) {
                console.log('分数提交成功:', data);
                return data;
            } else {
                console.warn('分数提交失败:', data.message);
                return { success: false, message: data.message };
            }
            
        } catch (error) {
            console.error('提交分数失败:', error);
            return { 
                success: false, 
                message: '网络错误，分数将保存在本地' 
            };
        }
    }
    
    /**
     * 获取用户统计数据
     * @param {string} userId - 用户ID
     * @returns {Promise} 用户统计数据
     */
    async function getUserStatsFromAPI(userId) {
        if (!API_CONFIG.USE_API) {
            console.log('API未启用，返回本地用户数据');
            return window.App?.state?.userData || null;
        }
        
        try {
            const response = await fetchWithTimeout(
                `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.GET_USER_STATS}/${userId}`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(API_CONFIG.API_KEY ? { 'Authorization': `Bearer ${API_CONFIG.API_KEY}` } : {})
                    }
                },
                API_CONFIG.TIMEOUT
            );
            
            const data = await response.json();
            
            if (data.success) {
                return data.data;
            } else {
                console.warn('获取用户数据失败:', data.message);
                return null;
            }
            
        } catch (error) {
            console.error('获取用户数据失败:', error);
            return null;
        }
    }
    
    // ============================================
    // 公开API
    // ============================================
    
    // 将模块功能暴露给全局App对象
    if (typeof window !== 'undefined') {
        window.App = window.App || {};
        window.App.ranking = {
            // 初始化
            init: initRanking,
            
            // 数据管理
            loadRankingData,
            refresh: loadRankingData,
            
            // API函数
            submitScore: submitScoreToAPI,
            getUserStats: getUserStatsFromAPI,
            
            // 数据访问
            getRankingData: () => rankingData,
            getFilteredData: () => filteredData,
            getCurrentFilter: () => currentFilter,
            
            // 工具函数
            formatLastActive,
            
            // 配置
            apiConfig: API_CONFIG
        };
    }
    
    // ============================================
    // 自动初始化
    // ============================================
    
    // 监听页面切换事件，在ranking页面显示时初始化
    window.addEventListener('page:shown', function(event) {
        if (event.detail.page === 'ranking') {
            initRanking();
        }
    });
    
    // 如果当前已经在ranking页面，直接初始化
    if (document.getElementById('ranking') && 
        document.getElementById('ranking').classList.contains('active')) {
        setTimeout(initRanking, 100);
    }
    
    console.log('🏆 ranking.js 模块加载完成');
    
})();