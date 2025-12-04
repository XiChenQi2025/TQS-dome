// modules/messages.js - 留言板模块
// 支持本地存储和API两种模式

const MessageManager = {
    // 模块状态
    state: {
        messages: [],
        currentPage: 1,
        totalPages: 1,
        messagesPerPage: CONFIG.MESSAGES.MESSAGES_PER_PAGE || 10,
        sortBy: 'latest', // 'latest', 'oldest', 'popular'
        isLoading: false,
        hasMore: true,
        userMessages: [],
        lastUpdate: null
    },
    
    // API配置
    apiConfig: {
        mode: 'local', // 'local' 或 'api'
        baseUrl: CONFIG.API.BASE_URL || '',
        endpoints: CONFIG.API.ENDPOINTS || {},
        apiKey: null,
        useMock: CONFIG.USE_SAMPLE_DATA || true
    },
    
    // DOM元素
    elements: {
        messageList: null,
        messagePagination: null,
        messageForm: null,
        messageInput: null,
        userNameInput: null,
        publishButton: null,
        refreshButton: null,
        sortSelect: null,
        totalMessagesElement: null,
        uniqueUsersElement: null,
        latestMessageTimeElement: null,
        prevPageButton: null,
        nextPageButton: null,
        pageInfoElement: null,
        charCountElement: null
    },
    
    // 初始化
    init() {
        console.log('💬 初始化留言板模块...');
        
        this.cacheElements();
        this.bindEvents();
        this.loadMessages();
        this.updateStats();
        this.setupAutoRefresh();
        
        // 触发初始化完成事件
        window.dispatchEvent(new CustomEvent('messages:initialized'));
    },
    
    // 缓存DOM元素
    cacheElements() {
        this.elements = {
            messageList: document.getElementById('message-list-full'),
            messagePagination: document.getElementById('message-pagination'),
            messageForm: document.querySelector('.publish-form'),
            messageInput: document.getElementById('message-content'),
            userNameInput: document.getElementById('message-user-name'),
            publishButton: document.getElementById('publish-message'),
            refreshButton: document.getElementById('refresh-messages'),
            sortSelect: document.getElementById('sort-select'),
            totalMessagesElement: document.getElementById('total-messages'),
            uniqueUsersElement: document.getElementById('unique-users'),
            latestMessageTimeElement: document.getElementById('latest-message-time'),
            prevPageButton: document.getElementById('prev-page'),
            nextPageButton: document.getElementById('next-page'),
            pageInfoElement: document.getElementById('page-info'),
            charCountElement: document.getElementById('char-count')
        };
    },
    
    // 绑定事件
    bindEvents() {
        // 发布留言按钮
        if (this.elements.publishButton) {
            this.elements.publishButton.addEventListener('click', () => this.submitMessage());
        }
        
        // 留言输入框实时验证
        if (this.elements.messageInput) {
            this.elements.messageInput.addEventListener('input', (e) => {
                this.updateCharCount(e.target.value);
                this.validateMessageForm();
            });
        }
        
        // 用户名输入框实时验证
        if (this.elements.userNameInput) {
            this.elements.userNameInput.addEventListener('input', () => {
                this.validateMessageForm();
            });
        }
        
        // 刷新按钮
        if (this.elements.refreshButton) {
            this.elements.refreshButton.addEventListener('click', () => this.refreshMessages());
        }
        
        // 排序选择
        if (this.elements.sortSelect) {
            this.elements.sortSelect.addEventListener('change', (e) => {
                this.state.sortBy = e.target.value;
                this.loadMessages();
            });
        }
        
        // 分页按钮
        if (this.elements.prevPageButton) {
            this.elements.prevPageButton.addEventListener('click', () => this.goToPrevPage());
        }
        
        if (this.elements.nextPageButton) {
            this.elements.nextPageButton.addEventListener('click', () => this.goToNextPage());
        }
        
        // 键盘快捷键
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter' && this.isFormValid()) {
                this.submitMessage();
            }
        });
    },
    
    // ============================================
    // 留言数据管理
    // ============================================
    
    // 加载留言
    async loadMessages() {
        if (this.state.isLoading) return;
        
        this.state.isLoading = true;
        
        try {
            let messages = [];
            
            if (this.apiConfig.mode === 'api' && this.apiConfig.baseUrl) {
                // API模式
                messages = await this.fetchMessagesFromAPI();
            } else {
                // 本地存储模式
                messages = await this.loadMessagesFromLocal();
            }
            
            // 应用排序
            messages = this.sortMessages(messages);
            
            // 更新状态
            this.state.messages = messages;
            this.state.totalPages = Math.ceil(messages.length / this.state.messagesPerPage);
            this.state.currentPage = Math.min(this.state.currentPage, this.state.totalPages || 1);
            
            // 渲染留言列表
            this.renderMessages();
            
            // 更新分页控件
            this.updatePagination();
            
            // 更新统计
            this.updateStats();
            
        } catch (error) {
            console.error('加载留言失败:', error);
            App.showNotification('加载留言失败，请重试', 'error');
        } finally {
            this.state.isLoading = false;
            this.state.lastUpdate = new Date();
        }
    },
    
    // 从API获取留言
    async fetchMessagesFromAPI() {
        try {
            const url = `${this.apiConfig.baseUrl}${this.apiConfig.endpoints.GET_MESSAGES || '/api/messages'}`;
            const params = {
                page: this.state.currentPage,
                limit: this.state.messagesPerPage,
                sort: this.state.sortBy
            };
            
            const queryString = new URLSearchParams(params).toString();
            const response = await fetch(`${url}?${queryString}`, {
                headers: {
                    'Accept': 'application/json',
                    ...(this.apiConfig.apiKey && { 'Authorization': `Bearer ${this.apiConfig.apiKey}` })
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            
            // API返回格式应该包含 messages 和 total
            return data.messages || [];
            
        } catch (error) {
            console.warn('API请求失败，切换到本地模式:', error);
            this.apiConfig.mode = 'local';
            return this.loadMessagesFromLocal();
        }
    },
    
    // 从本地存储加载留言
    async loadMessagesFromLocal() {
        try {
            // 从localStorage加载
            const savedMessages = localStorage.getItem('taoci_messages');
            let messages = [];
            
            if (savedMessages) {
                messages = JSON.parse(savedMessages);
            } else if (this.apiConfig.useMock) {
                // 使用示例数据
                messages = [...CONFIG.MESSAGES.DEFAULT_MESSAGES];
            }
            
            return messages;
            
        } catch (error) {
            console.error('解析本地留言数据失败:', error);
            return [];
        }
    },
    
    // 提交留言
    async submitMessage() {
        if (!this.isFormValid()) {
            App.showNotification('请填写昵称和留言内容', 'warning');
            return;
        }
        
        const userName = this.elements.userNameInput.value.trim();
        const content = this.elements.messageInput.value.trim();
        
        // 创建留言对象
        const message = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            user: userName,
            content: content,
            timestamp: new Date().toISOString(),
            likes: 0,
            approved: !CONFIG.MESSAGES.REQUIRE_APPROVAL // 如果不需要审核，默认通过
        };
        
        try {
            let success = false;
            
            if (this.apiConfig.mode === 'api' && this.apiConfig.baseUrl) {
                // API提交
                success = await this.submitMessageToAPI(message);
            } else {
                // 本地存储提交
                success = await this.saveMessageToLocal(message);
            }
            
            if (success) {
                // 清空表单
                this.resetForm();
                
                // 显示成功消息
                App.showNotification('留言发布成功！', 'success');
                
                // 重新加载留言
                setTimeout(() => this.loadMessages(), 500);
                
                // 更新用户消息记录
                this.addUserMessage(message);
                
            } else {
                App.showNotification('留言发布失败，请重试', 'error');
            }
            
        } catch (error) {
            console.error('提交留言失败:', error);
            App.showNotification('提交失败，请检查网络连接', 'error');
        }
    },
    
    // 提交留言到API
    async submitMessageToAPI(message) {
        try {
            const url = `${this.apiConfig.baseUrl}${this.apiConfig.endpoints.SUBMIT_MESSAGE || '/api/message'}`;
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    ...(this.apiConfig.apiKey && { 'Authorization': `Bearer ${this.apiConfig.apiKey}` })
                },
                body: JSON.stringify(message)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            return data.success || false;
            
        } catch (error) {
            console.error('API提交失败:', error);
            return false;
        }
    },
    
    // 保存留言到本地存储
    async saveMessageToLocal(message) {
        try {
            // 加载现有留言
            const savedMessages = localStorage.getItem('taoci_messages');
            let messages = [];
            
            if (savedMessages) {
                messages = JSON.parse(savedMessages);
            }
            
            // 添加新留言到开头
            messages.unshift(message);
            
            // 限制最大数量
            if (messages.length > CONFIG.MESSAGES.MAX_MESSAGES_DISPLAY * 2) {
                messages = messages.slice(0, CONFIG.MESSAGES.MAX_MESSAGES_DISPLAY * 2);
            }
            
            // 保存到localStorage
            localStorage.setItem('taoci_messages', JSON.stringify(messages));
            
            return true;
            
        } catch (error) {
            console.error('保存到本地存储失败:', error);
            return false;
        }
    },
    
    // ============================================
    // 留言显示与渲染
    // ============================================
    
    // 渲染留言列表
    renderMessages() {
        if (!this.elements.messageList) return;
        
        // 计算当前页的留言
        const startIndex = (this.state.currentPage - 1) * this.state.messagesPerPage;
        const endIndex = startIndex + this.state.messagesPerPage;
        const pageMessages = this.state.messages.slice(startIndex, endIndex);
        
        if (pageMessages.length === 0) {
            this.renderEmptyState();
            return;
        }
        
        let messagesHTML = '';
        
        pageMessages.forEach((message, index) => {
            messagesHTML += this.renderMessageItem(message, index);
        });
        
        this.elements.messageList.innerHTML = messagesHTML;
        
        // 绑定点赞事件
        this.bindLikeEvents();
    },
    
    // 渲染单个留言项
    renderMessageItem(message, index) {
        const time = App.formatDateTime(message.timestamp);
        const userInitial = this.getUserInitial(message.user);
        const isApproved = message.approved !== false;
        const likeCount = message.likes || 0;
        
        return `
            <div class="message-item ${isApproved ? '' : 'pending'}" data-id="${message.id}">
                <div class="message-avatar" style="background: ${this.getAvatarColor(message.user)}">
                    ${userInitial}
                </div>
                <div class="message-content">
                    <div class="message-header">
                        <div class="message-user-info">
                            <span class="message-user">${message.user}</span>
                            ${!isApproved ? '<span class="pending-badge">待审核</span>' : ''}
                        </div>
                        <div class="message-meta">
                            <span class="message-time">${time}</span>
                            <button class="like-button ${message.liked ? 'liked' : ''}" 
                                    data-id="${message.id}"
                                    aria-label="点赞">
                                <i class="fas fa-heart"></i>
                                <span class="like-count">${likeCount}</span>
                            </button>
                        </div>
                    </div>
                    <div class="message-text">${this.escapeHTML(message.content)}</div>
                    ${this.shouldShowDeleteButton(message) ? this.renderDeleteButton(message) : ''}
                </div>
            </div>
        `;
    },
    
    // 渲染空状态
    renderEmptyState() {
        this.elements.messageList.innerHTML = `
            <div class="empty-message">
                <i class="fas fa-comment-slash fa-3x"></i>
                <h3>还没有留言</h3>
                <p>快来成为第一个给桃汽水公主留言的人吧！</p>
            </div>
        `;
    },
    
    // 渲染删除按钮（如果是用户自己的留言）
    renderDeleteButton(message) {
        return `
            <div class="message-actions">
                <button class="delete-button" data-id="${message.id}" aria-label="删除留言">
                    <i class="fas fa-trash"></i> 删除
                </button>
            </div>
        `;
    },
    
    // ============================================
    // 留言排序
    // ============================================
    
    // 排序留言
    sortMessages(messages) {
        const sorted = [...messages];
        
        switch (this.state.sortBy) {
            case 'latest':
                sorted.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                break;
                
            case 'oldest':
                sorted.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
                break;
                
            case 'popular':
                sorted.sort((a, b) => (b.likes || 0) - (a.likes || 0));
                break;
        }
        
        return sorted;
    },
    
    // ============================================
    // 分页功能
    // ============================================
    
    // 更新分页控件
    updatePagination() {
        if (!this.elements.prevPageButton || !this.elements.nextPageButton || !this.elements.pageInfoElement) {
            return;
        }
        
        // 更新按钮状态
        this.elements.prevPageButton.disabled = this.state.currentPage <= 1;
        this.elements.nextPageButton.disabled = this.state.currentPage >= this.state.totalPages;
        
        // 更新页码信息
        this.elements.pageInfoElement.textContent = 
            `第 ${this.state.currentPage} 页 / 共 ${this.state.totalPages} 页`;
        
        // 更新分页按钮显示
        this.renderPageButtons();
    },
    
    // 渲染页码按钮
    renderPageButtons() {
        // 如果有分页容器，可以在这里添加数字页码按钮
        // 目前只使用上一页/下一页
    },
    
    // 上一页
    goToPrevPage() {
        if (this.state.currentPage > 1) {
            this.state.currentPage--;
            this.loadMessages();
        }
    },
    
    // 下一页
    goToNextPage() {
        if (this.state.currentPage < this.state.totalPages) {
            this.state.currentPage++;
            this.loadMessages();
        }
    },
    
    // ============================================
    // 统计功能
    // ============================================
    
    // 更新统计信息
    updateStats() {
        const messages = this.state.messages;
        
        // 总留言数
        if (this.elements.totalMessagesElement) {
            this.elements.totalMessagesElement.textContent = messages.length;
        }
        
        // 唯一用户数
        if (this.elements.uniqueUsersElement) {
            const uniqueUsers = new Set(messages.map(m => m.user)).size;
            this.elements.uniqueUsersElement.textContent = uniqueUsers;
        }
        
        // 最新留言时间
        if (this.elements.latestMessageTimeElement && messages.length > 0) {
            const latestTime = Math.max(...messages.map(m => new Date(m.timestamp).getTime()));
            const latestDate = new Date(latestTime);
            const now = new Date();
            const diffHours = Math.floor((now - latestDate) / (1000 * 60 * 60));
            
            let timeText;
            if (diffHours < 1) {
                timeText = '刚刚';
            } else if (diffHours < 24) {
                timeText = `${diffHours}小时前`;
            } else {
                timeText = `${Math.floor(diffHours / 24)}天前`;
            }
            
            this.elements.latestMessageTimeElement.textContent = timeText;
        }
    },
    
    // ============================================
    // 表单验证
    // ============================================
    
    // 验证表单
    validateMessageForm() {
        const isValid = this.isFormValid();
        
        if (this.elements.publishButton) {
            this.elements.publishButton.disabled = !isValid;
        }
        
        return isValid;
    },
    
    // 检查表单是否有效
    isFormValid() {
        if (!this.elements.userNameInput || !this.elements.messageInput) {
            return false;
        }
        
        const userName = this.elements.userNameInput.value.trim();
        const content = this.elements.messageInput.value.trim();
        
        return userName.length > 0 && 
               userName.length <= 10 && 
               content.length > 0 && 
               content.length <= CONFIG.MESSAGES.MAX_LENGTH;
    },
    
    // 更新字符计数
    updateCharCount(text) {
        if (this.elements.charCountElement) {
            const count = text.length;
            this.elements.charCountElement.textContent = count;
            
            // 根据字符数改变颜色
            const maxLength = CONFIG.MESSAGES.MAX_LENGTH;
            if (count > maxLength * 0.9) {
                this.elements.charCountElement.style.color = CONFIG.COLORS.ACCENT;
            } else if (count > maxLength * 0.7) {
                this.elements.charCountElement.style.color = CONFIG.COLORS.WARNING;
            } else {
                this.elements.charCountElement.style.color = '';
            }
        }
    },
    
    // 重置表单
    resetForm() {
        if (this.elements.messageInput) {
            this.elements.messageInput.value = '';
            this.updateCharCount('');
        }
        this.validateMessageForm();
    },
    
    // ============================================
    // 点赞功能
    // ============================================
    
    // 绑定点赞事件
    bindLikeEvents() {
        document.querySelectorAll('.like-button').forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const messageId = e.currentTarget.dataset.id;
                this.toggleLike(messageId);
            });
        });
        
        // 绑定删除按钮事件
        document.querySelectorAll('.delete-button').forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const messageId = e.currentTarget.dataset.id;
                this.deleteMessage(messageId);
            });
        });
    },
    
    // 切换点赞状态
    async toggleLike(messageId) {
        const message = this.state.messages.find(m => m.id === messageId);
        if (!message) return;
        
        // 检查用户是否已经点过赞
        const userLikes = JSON.parse(localStorage.getItem('taoci_user_likes') || '[]');
        const hasLiked = userLikes.includes(messageId);
        
        if (hasLiked) {
            // 取消点赞
            message.likes = Math.max(0, (message.likes || 0) - 1);
            userLikes.splice(userLikes.indexOf(messageId), 1);
        } else {
            // 点赞
            message.likes = (message.likes || 0) + 1;
            userLikes.push(messageId);
        }
        
        // 保存点赞状态
        localStorage.setItem('taoci_user_likes', JSON.stringify(userLikes));
        
        // 更新显示
        this.renderMessages();
        
        // 如果是API模式，同步到服务器
        if (this.apiConfig.mode === 'api' && this.apiConfig.baseUrl) {
            await this.syncLikeToAPI(messageId, !hasLiked);
        }
    },
    
    // 同步点赞到API
    async syncLikeToAPI(messageId, like) {
        try {
            const url = `${this.apiConfig.baseUrl}/api/messages/${messageId}/like`;
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(this.apiConfig.apiKey && { 'Authorization': `Bearer ${this.apiConfig.apiKey}` })
                },
                body: JSON.stringify({ like })
            });
            
            if (!response.ok) {
                console.warn('点赞同步到API失败');
            }
        } catch (error) {
            console.error('同步点赞失败:', error);
        }
    },
    
    // 删除留言
    async deleteMessage(messageId) {
        if (!confirm('确定要删除这条留言吗？')) {
            return;
        }
        
        try {
            // 从本地数据中移除
            const messageIndex = this.state.messages.findIndex(m => m.id === messageId);
            if (messageIndex !== -1) {
                this.state.messages.splice(messageIndex, 1);
                
                // 保存到localStorage
                localStorage.setItem('taoci_messages', JSON.stringify(this.state.messages));
                
                // 重新加载留言
                this.loadMessages();
                
                App.showNotification('留言已删除', 'success');
                
                // 如果是API模式，同步删除
                if (this.apiConfig.mode === 'api' && this.apiConfig.baseUrl) {
                    await this.deleteMessageFromAPI(messageId);
                }
            }
        } catch (error) {
            console.error('删除留言失败:', error);
            App.showNotification('删除失败', 'error');
        }
    },
    
    // 从API删除留言
    async deleteMessageFromAPI(messageId) {
        try {
            const url = `${this.apiConfig.baseUrl}/api/messages/${messageId}`;
            const response = await fetch(url, {
                method: 'DELETE',
                headers: {
                    ...(this.apiConfig.apiKey && { 'Authorization': `Bearer ${this.apiConfig.apiKey}` })
                }
            });
            
            if (!response.ok) {
                console.warn('API删除留言失败');
            }
        } catch (error) {
            console.error('API删除失败:', error);
        }
    },
    
    // ============================================
    // 工具函数
    // ============================================
    
    // 获取用户头像颜色
    getAvatarColor(username) {
        const colors = [
            CONFIG.COLORS.PRIMARY,
            CONFIG.COLORS.ACCENT,
            CONFIG.COLORS.INFO,
            CONFIG.COLORS.SUCCESS,
            CONFIG.COLORS.WARNING,
            CONFIG.COLORS.DARK
        ];
        
        // 根据用户名生成确定性的颜色
        let hash = 0;
        for (let i = 0; i < username.length; i++) {
            hash = username.charCodeAt(i) + ((hash << 5) - hash);
        }
        
        const index = Math.abs(hash) % colors.length;
        return colors[index];
    },
    
    // 获取用户首字母
    getUserInitial(username) {
        if (!username || username.length === 0) return '?';
        
        // 获取第一个字符，如果是英文则大写
        const firstChar = username.charAt(0);
        return firstChar.match(/[a-z]/i) ? firstChar.toUpperCase() : firstChar;
    },
    
    // HTML转义
    escapeHTML(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },
    
    // 刷新留言
    refreshMessages() {
        this.state.currentPage = 1;
        this.loadMessages();
        
        // 显示刷新动画
        if (this.elements.refreshButton) {
            const icon = this.elements.refreshButton.querySelector('i');
            if (icon) {
                icon.classList.add('fa-spin');
                setTimeout(() => icon.classList.remove('fa-spin'), 1000);
            }
        }
        
        App.showNotification('留言已刷新', 'success');
    },
    
    // 添加用户留言记录
    addUserMessage(message) {
        // 保存用户自己的留言记录
        const userMessages = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.USER_MESSAGES) || '[]');
        userMessages.push({
            id: message.id,
            content: message.content,
            timestamp: message.timestamp
        });
        localStorage.setItem(CONFIG.STORAGE_KEYS.USER_MESSAGES, JSON.stringify(userMessages));
    },
    
    // 检查是否应该显示删除按钮（用户自己的留言）
    shouldShowDeleteButton(message) {
        // 这里可以根据业务逻辑判断
        // 例如：当前用户是管理员，或者是留言作者
        const currentUser = App.state.userData.name;
        return message.user === currentUser;
    },
    
    // 设置自动刷新
    setupAutoRefresh() {
        // 每5分钟自动刷新一次
        setInterval(() => {
            if (App.state.currentPage === 'messages' && !this.state.isLoading) {
                this.refreshMessages();
            }
        }, 5 * 60 * 1000); // 5分钟
    },
    
    // ============================================
    // API配置管理
    // ============================================
    
    // 设置API模式
    setAPIMode(apiConfig) {
        this.apiConfig = {
            ...this.apiConfig,
            ...apiConfig
        };
        
        console.log(`📡 切换到 ${this.apiConfig.mode} 模式`);
    },
    
    // 测试API连接
    async testAPIConnection() {
        if (!this.apiConfig.baseUrl) return false;
        
        try {
            const url = `${this.apiConfig.baseUrl}/api/health`;
            const response = await fetch(url, { timeout: 5000 });
            return response.ok;
        } catch (error) {
            return false;
        }
    },
    
    // ============================================
    // 公开方法
    // ============================================
    
    // 获取留言总数
    getTotalMessages() {
        return this.state.messages.length;
    },
    
    // 获取最新留言
    getLatestMessages(count = 5) {
        return this.sortMessages(this.state.messages)
            .slice(0, count)
            .filter(m => m.approved !== false);
    },
    
    // 清除所有留言（仅开发使用）
    clearAllMessages() {
        if (confirm('确定要清除所有留言吗？此操作不可撤销！')) {
            localStorage.removeItem('taoci_messages');
            localStorage.removeItem('taoci_user_likes');
            this.state.messages = [];
            this.loadMessages();
            App.showNotification('所有留言已清除', 'warning');
        }
    }
};

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MessageManager;
} else {
    // 浏览器环境
    window.MessageManager = MessageManager;
    
    // 自动初始化（当页面切换时）
    window.addEventListener('page:shown', (event) => {
        if (event.detail.page === 'messages' && CONFIG.FEATURES.MESSAGES) {
            // 延迟初始化，确保DOM完全加载
            setTimeout(() => {
                if (!MessageManager.state.initialized) {
                    MessageManager.init();
                    MessageManager.state.initialized = true;
                }
            }, 100);
        }
    });
    
    // 监听消息提交成功事件
    window.addEventListener('message:submitted', () => {
        if (App.state.currentPage !== 'messages') {
            // 如果不是在留言板页面，可以显示通知
            App.showNotification('您有新的留言已发布', 'info');
        }
    });
}

console.log('💬 messages.js 已加载，等待初始化...');