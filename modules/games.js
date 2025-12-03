// modules/games.js - 小游戏模块

// 游戏管理器
const GameManager = {
    currentGame: null,
    games: {},
    activeGames: new Map(),
    
    // 初始化游戏模块
    init() {
        console.log('🎮 初始化游戏模块...');
        
        // 获取游戏容器
        this.container = document.getElementById('games-container');
        if (!this.container) {
            console.error('找不到游戏容器');
            return;
        }
        
        // 创建游戏选择界面
        this.createGameSelection();
        
        // 绑定事件
        this.bindEvents();
        
        // 预加载游戏
        this.preloadGames();
        
        console.log('✅ 游戏模块初始化完成');
    },
    
    // 创建游戏选择界面
    createGameSelection() {
        const games = CONFIG.GAMES;
        let html = `
            <div class="games-header">
                <div class="games-intro">
                    <h2><i class="fas fa-magic"></i> 选择游戏开始收集魔力</h2>
                    <p>每个游戏难度都会随时间逐渐增加，挑战你的极限吧！</p>
                    <div class="difficulty-info">
                        <i class="fas fa-info-circle"></i>
                        <span>游戏每30秒难度增加一次，10分钟后将变得非常困难</span>
                    </div>
                </div>
            </div>
            
            <div class="games-grid">
        `;
        
        // 气泡捕捉术
        html += this.createGameCard('BUBBLE_GAME');
        
        // 记忆符文阵
        html += this.createGameCard('MEMORY_GAME');
        
        // 快速咏唱测试
        html += this.createGameCard('REACTION_GAME');
        
        html += `
            </div>
            
            <div class="games-stats">
                <div class="stats-card">
                    <h3><i class="fas fa-chart-line"></i> 难度说明</h3>
                    <ul class="difficulty-list">
                        <li><i class="fas fa-clock"></i> 前30秒：熟悉阶段</li>
                        <li><i class="fas fa-rocket"></i> 30秒-5分钟：逐渐加速</li>
                        <li><i class="fas fa-fire"></i> 5-10分钟：挑战阶段</li>
                        <li><i class="fas fa-crown"></i> 10分钟+：大师模式</li>
                    </ul>
                </div>
                
                <div class="stats-card">
                    <h3><i class="fas fa-trophy"></i> 我的游戏记录</h3>
                    <div id="game-personal-stats">
                        加载中...
                    </div>
                </div>
            </div>
        `;
        
        this.container.innerHTML = html;
        
        // 加载个人游戏记录
        this.loadPersonalStats();
    },
    
    // 创建游戏卡片
    createGameCard(gameKey) {
        const game = CONFIG.GAMES[gameKey];
        const gameConfig = CONFIG.GAMES[gameKey];
        
        return `
            <div class="game-card" data-game="${gameKey}">
                <div class="game-card-header">
                    <div class="game-icon">
                        <i class="fas ${game.ICON}"></i>
                    </div>
                    <div class="game-title">
                        <h3>${game.NAME}</h3>
                        <span class="game-points">+${CONFIG.GAMES.GENERAL.POINTS_PER_ACTION} 魔力/次</span>
                    </div>
                </div>
                
                <div class="game-card-body">
                    <p class="game-description">${game.DESCRIPTION}</p>
                    
                    <div class="game-difficulty">
                        <div class="difficulty-bar">
                            <div class="difficulty-label">当前难度：</div>
                            <div class="difficulty-dots">
                                ${Array(5).fill('<span class="dot"></span>').join('')}
                            </div>
                        </div>
                    </div>
                    
                    <div class="game-stats">
                        <div class="stat">
                            <i class="fas fa-clock"></i>
                            <span>游戏时长：<span class="stat-value" id="${gameKey}-time">0秒</span></span>
                        </div>
                        <div class="stat">
                            <i class="fas fa-bolt"></i>
                            <span>获得魔力：<span class="stat-value" id="${gameKey}-points">0</span></span>
                        </div>
                        <div class="stat">
                            <i class="fas fa-star"></i>
                            <span>最高记录：<span class="stat-value" id="${gameKey}-highscore">0</span></span>
                        </div>
                    </div>
                </div>
                
                <div class="game-card-footer">
                    <button class="btn-play" data-game="${gameKey}">
                        <i class="fas fa-play"></i>
                        <span>开始游戏</span>
                    </button>
                    
                    <button class="btn-info" data-game="${gameKey}">
                        <i class="fas fa-question-circle"></i>
                        <span>游戏说明</span>
                    </button>
                </div>
            </div>
        `;
    },
    
    // 绑定事件
    bindEvents() {
        // 游戏卡片点击事件
        this.container.addEventListener('click', (e) => {
            const playBtn = e.target.closest('.btn-play');
            const infoBtn = e.target.closest('.btn-info');
            
            if (playBtn) {
                const gameKey = playBtn.dataset.game;
                this.startGame(gameKey);
            }
            
            if (infoBtn) {
                const gameKey = infoBtn.dataset.game;
                this.showGameInstructions(gameKey);
            }
        });
        
        // 窗口失焦暂停游戏
        window.addEventListener('blur', () => {
            if (this.currentGame && this.currentGame.isPlaying) {
                this.currentGame.pause();
            }
        });
        
        window.addEventListener('focus', () => {
            if (this.currentGame && this.currentGame.isPaused) {
                this.currentGame.resume();
            }
        });
    },
    
    // 预加载游戏
    preloadGames() {
        // 初始化游戏实例
        this.games = {
            BUBBLE_GAME: new BubbleGame(),
            MEMORY_GAME: new MemoryGame(),
            REACTION_GAME: new ReactionGame()
        };
        
        // 设置游戏回调
        Object.values(this.games).forEach(game => {
            game.onScore = (points) => this.handleGameScore(game, points);
            game.onGameOver = () => this.handleGameOver(game);
            game.onDifficultyUpdate = (difficulty) => this.updateDifficultyDisplay(game, difficulty);
        });
    },
    
    // 开始游戏
    startGame(gameKey) {
        // 如果有正在进行的游戏，先结束它
        if (this.currentGame && this.currentGame.isPlaying) {
            this.currentGame.stop();
        }
        
        const game = this.games[gameKey];
        if (!game) {
            console.error('游戏不存在:', gameKey);
            return;
        }
        
        // 创建游戏容器
        this.createGameContainer(gameKey);
        
        // 启动游戏
        game.start();
        this.currentGame = game;
        
        // 记录游戏开始
        this.activeGames.set(gameKey, {
            startTime: Date.now(),
            points: 0
        });
        
        // 更新UI
        this.updateGameUI(gameKey, 'playing');
    },
    
    // 创建游戏容器
    createGameContainer(gameKey) {
        const game = this.games[gameKey];
        const gameType = gameKey.toLowerCase().replace('_game', '');
        
        this.container.innerHTML = `
            <div class="game-fullscreen" id="game-fullscreen">
                <div class="game-header">
                    <button class="btn-back" id="game-back-btn">
                        <i class="fas fa-arrow-left"></i>
                        <span>返回游戏大厅</span>
                    </button>
                    
                    <div class="game-header-info">
                        <h2>${game.config.NAME}</h2>
                        <div class="game-time">
                            <i class="fas fa-clock"></i>
                            <span id="game-timer">00:00</span>
                        </div>
                    </div>
                    
                    <div class="game-header-stats">
                        <div class="stat">
                            <i class="fas fa-bolt"></i>
                            <span id="game-current-points">0</span>
                        </div>
                        <div class="stat">
                            <i class="fas fa-chart-line"></i>
                            <span id="game-difficulty-level">1.0x</span>
                        </div>
                    </div>
                </div>
                
                <div class="game-area" id="game-area">
                    <div class="game-loading">
                        <div class="loading-spinner"></div>
                        <p>加载游戏中...</p>
                    </div>
                </div>
                
                <div class="game-controls">
                    <button class="btn-control btn-pause" id="game-pause-btn">
                        <i class="fas fa-pause"></i>
                        <span>暂停</span>
                    </button>
                    
                    <button class="btn-control btn-restart" id="game-restart-btn">
                        <i class="fas fa-redo"></i>
                        <span>重新开始</span>
                    </button>
                    
                    <div class="game-hint">
                        <i class="fas fa-lightbulb"></i>
                        <span id="game-hint-text">${game.getHint()}</span>
                    </div>
                </div>
            </div>
        `;
        
        // 绑定游戏控制事件
        document.getElementById('game-back-btn').addEventListener('click', () => {
            this.exitGame();
        });
        
        document.getElementById('game-pause-btn').addEventListener('click', () => {
            this.togglePause();
        });
        
        document.getElementById('game-restart-btn').addEventListener('click', () => {
            this.restartGame();
        });
        
        // 初始化游戏画布
        setTimeout(() => {
            const gameArea = document.getElementById('game-area');
            game.initCanvas(gameArea);
        }, 100);
    },
    
    // 更新游戏UI状态
    updateGameUI(gameKey, state) {
        const gameCard = document.querySelector(`.game-card[data-game="${gameKey}"]`);
        if (!gameCard) return;
        
        gameCard.classList.remove('playing', 'paused');
        gameCard.classList.add(state);
    },
    
    // 处理游戏得分
    handleGameScore(game, points) {
        if (!game || !points) return;
        
        const gameKey = this.getGameKey(game);
        if (!gameKey) return;
        
        // 更新活跃游戏记录
        const gameRecord = this.activeGames.get(gameKey);
        if (gameRecord) {
            gameRecord.points += points;
        }
        
        // 更新UI
        this.updateGameStats(gameKey);
        
        // 添加到用户魔力
        App.addUserPoints(points);
        
        // 显示得分效果
        this.showScoreEffect(points);
    },
    
    // 处理游戏结束
    handleGameOver(game) {
        const gameKey = this.getGameKey(game);
        if (!gameKey) return;
        
        // 保存游戏记录
        this.saveGameRecord(gameKey);
        
        // 显示游戏结束界面
        this.showGameOverScreen(gameKey);
    },
    
    // 更新难度显示
    updateDifficultyDisplay(game, difficulty) {
        const difficultyElement = document.getElementById('game-difficulty-level');
        if (difficultyElement) {
            difficultyElement.textContent = difficulty.toFixed(1) + 'x';
            
            // 根据难度改变颜色
            if (difficulty >= 5.0) {
                difficultyElement.style.color = '#FF6BAC';
            } else if (difficulty >= 3.0) {
                difficultyElement.style.color = '#FF9AC8';
            } else if (difficulty >= 1.5) {
                difficultyElement.style.color = '#A8E6CF';
            }
        }
        
        // 更新游戏卡片的难度显示
        const gameKey = this.getGameKey(game);
        if (gameKey) {
            this.updateDifficultyDots(gameKey, difficulty);
        }
    },
    
    // 更新难度点显示
    updateDifficultyDots(gameKey, difficulty) {
        const dots = document.querySelectorAll(`.game-card[data-game="${gameKey}"] .dot`);
        if (!dots.length) return;
        
        // 根据难度点亮不同数量的点（1-5个）
        const activeDots = Math.min(5, Math.ceil(difficulty * 2));
        
        dots.forEach((dot, index) => {
            if (index < activeDots) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    },
    
    // 显示得分效果
    showScoreEffect(points) {
        const gameArea = document.getElementById('game-area');
        if (!gameArea) return;
        
        const effect = document.createElement('div');
        effect.className = 'score-effect';
        effect.textContent = `+${points}`;
        effect.style.left = `${Math.random() * 70 + 15}%`;
        effect.style.top = `${Math.random() * 70 + 15}%`;
        
        gameArea.appendChild(effect);
        
        // 移除效果
        setTimeout(() => {
            if (effect.parentNode) {
                effect.parentNode.removeChild(effect);
            }
        }, 1000);
    },
    
    // 更新游戏统计
    updateGameStats(gameKey) {
        const gameRecord = this.activeGames.get(gameKey);
        if (!gameRecord) return;
        
        const game = this.games[gameKey];
        if (!game) return;
        
        // 更新游戏内显示
        const pointsElement = document.getElementById('game-current-points');
        if (pointsElement) {
            pointsElement.textContent = gameRecord.points;
        }
        
        // 更新计时器
        const timerElement = document.getElementById('game-timer');
        if (timerElement && game.startTime) {
            const elapsed = Math.floor((Date.now() - game.startTime) / 1000);
            const minutes = Math.floor(elapsed / 60);
            const seconds = elapsed % 60;
            timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
        
        // 更新游戏卡片显示
        const pointsCardElement = document.getElementById(`${gameKey}-points`);
        if (pointsCardElement) {
            pointsCardElement.textContent = gameRecord.points;
        }
        
        const timeCardElement = document.getElementById(`${gameKey}-time`);
        if (timeCardElement) {
            const elapsed = Math.floor((Date.now() - gameRecord.startTime) / 1000);
            timeCardElement.textContent = `${elapsed}秒`;
        }
    },
    
    // 显示游戏结束界面
    showGameOverScreen(gameKey) {
        const gameRecord = this.activeGames.get(gameKey);
        if (!gameRecord) return;
        
        const game = this.games[gameKey];
        if (!game) return;
        
        const elapsed = Math.floor((Date.now() - gameRecord.startTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        
        const gameArea = document.getElementById('game-area');
        if (!gameArea) return;
        
        gameArea.innerHTML = `
            <div class="game-over-screen">
                <div class="game-over-content">
                    <div class="game-over-icon">
                        <i class="fas fa-crown"></i>
                    </div>
                    
                    <h2>游戏结束！</h2>
                    
                    <div class="game-over-stats">
                        <div class="stat-item">
                            <div class="stat-label">游戏时长</div>
                            <div class="stat-value">${minutes}分${seconds}秒</div>
                        </div>
                        
                        <div class="stat-item">
                            <div class="stat-label">获得魔力</div>
                            <div class="stat-value">${gameRecord.points}</div>
                        </div>
                        
                        <div class="stat-item">
                            <div class="stat-label">最终难度</div>
                            <div class="stat-value">${game.difficulty ? game.difficulty.toFixed(1) : '1.0'}x</div>
                        </div>
                    </div>
                    
                    <div class="game-over-message">
                        <p>${this.getGameOverMessage(gameRecord.points, elapsed)}</p>
                    </div>
                    
                    <div class="game-over-actions">
                        <button class="btn-action btn-play-again" id="play-again-btn">
                            <i class="fas fa-redo"></i>
                            再玩一次
                        </button>
                        
                        <button class="btn-action btn-back-to-lobby" id="back-to-lobby-btn">
                            <i class="fas fa-home"></i>
                            返回大厅
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // 绑定按钮事件
        document.getElementById('play-again-btn').addEventListener('click', () => {
            this.startGame(gameKey);
        });
        
        document.getElementById('back-to-lobby-btn').addEventListener('click', () => {
            this.exitGame();
        });
        
        // 保存最高记录
        this.updateHighScore(gameKey, gameRecord.points);
    },
    
    // 获取游戏结束消息
    getGameOverMessage(points, elapsed) {
        if (elapsed >= 600) { // 10分钟以上
            return '太厉害了！你坚持了10分钟以上，已经是魔法大师了！';
        } else if (elapsed >= 300) { // 5-10分钟
            return '优秀的成绩！你已经超越了大部分契约者！';
        } else if (elapsed >= 60) { // 1-5分钟
            return '不错的表现！继续挑战更高的难度吧！';
        } else {
            return '第一次玩吗？多练习几次会更好的！';
        }
    },
    
    // 更新最高分
    updateHighScore(gameKey, score) {
        const highScoreElement = document.getElementById(`${gameKey}-highscore`);
        if (!highScoreElement) return;
        
        const currentHigh = parseInt(highScoreElement.textContent) || 0;
        if (score > currentHigh) {
            highScoreElement.textContent = score;
            
            // 保存到localStorage
            const storageKey = `taoci_${gameKey}_highscore`;
            localStorage.setItem(storageKey, score.toString());
            
            // 显示新记录提示
            if (score > 0) {
                App.showNotification(`🎉 恭喜创造新纪录：${score}分！`, 'success');
            }
        }
    },
    
    // 加载个人统计
    loadPersonalStats() {
        const statsContainer = document.getElementById('game-personal-stats');
        if (!statsContainer) return;
        
        let html = '';
        
        Object.keys(this.games).forEach(gameKey => {
            const game = CONFIG.GAMES[gameKey];
            const highScore = localStorage.getItem(`taoci_${gameKey}_highscore`) || '0';
            const totalPoints = localStorage.getItem(`taoci_${gameKey}_total_points`) || '0';
            
            html += `
                <div class="personal-stat">
                    <span class="stat-name">${game.NAME}</span>
                    <div class="stat-details">
                        <span>最高：${highScore}</span>
                        <span>总计：${totalPoints}</span>
                    </div>
                </div>
            `;
        });
        
        statsContainer.innerHTML = html || '<p>暂无游戏记录</p>';
    },
    
    // 保存游戏记录
    saveGameRecord(gameKey) {
        const gameRecord = this.activeGames.get(gameKey);
        if (!gameRecord) return;
        
        // 保存总魔力
        const totalPointsKey = `taoci_${gameKey}_total_points`;
        const currentTotal = parseInt(localStorage.getItem(totalPointsKey)) || 0;
        localStorage.setItem(totalPointsKey, (currentTotal + gameRecord.points).toString());
        
        // 保存游戏次数
        const playCountKey = `taoci_${gameKey}_play_count`;
        const currentCount = parseInt(localStorage.getItem(playCountKey)) || 0;
        localStorage.setItem(playCountKey, (currentCount + 1).toString());
    },
    
    // 显示游戏说明
    showGameInstructions(gameKey) {
        const game = CONFIG.GAMES[gameKey];
        if (!game) return;
        
        // 创建说明模态框
        const modal = document.createElement('div');
        modal.className = 'game-instruction-modal';
        modal.innerHTML = `
            <div class="instruction-content">
                <div class="instruction-header">
                    <h2><i class="fas ${game.ICON}"></i> ${game.NAME}</h2>
                    <button class="btn-close-instruction">&times;</button>
                </div>
                
                <div class="instruction-body">
                    <p class="instruction-description">${game.DESCRIPTION}</p>
                    
                    <div class="instruction-rules">
                        <h3><i class="fas fa-book"></i> 游戏规则</h3>
                        <ul>
                            ${this.getGameRules(gameKey)}
                        </ul>
                    </div>
                    
                    <div class="instruction-controls">
                        <h3><i class="fas fa-gamepad"></i> 操作方法</h3>
                        <ul>
                            ${this.getGameControls(gameKey)}
                        </ul>
                    </div>
                    
                    <div class="instruction-tips">
                        <h3><i class="fas fa-lightbulb"></i> 技巧提示</h3>
                        <ul>
                            ${this.getGameTips(gameKey)}
                        </ul>
                    </div>
                </div>
                
                <div class="instruction-footer">
                    <button class="btn btn-start-instruction" data-game="${gameKey}">
                        <i class="fas fa-play"></i>
                        开始游戏
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // 绑定事件
        modal.querySelector('.btn-close-instruction').addEventListener('click', () => {
            modal.remove();
        });
        
        modal.querySelector('.btn-start-instruction').addEventListener('click', () => {
            modal.remove();
            this.startGame(gameKey);
        });
        
        // 点击背景关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    },
    
    // 获取游戏规则
    getGameRules(gameKey) {
        const rules = {
            BUBBLE_GAME: [
                '点击屏幕上飘过的气泡即可获得魔力',
                '每个气泡价值10点魔力',
                '气泡会随时间越来越快，越来越多',
                '没有时间限制，但难度会不断增加'
            ],
            MEMORY_GAME: [
                '记住魔法符文的位置和图案',
                '点击卡片翻开，找到匹配的图案',
                '每次成功配对获得50点魔力',
                '网格会随时间变大，显示时间变短'
            ],
            REACTION_GAME: [
                '快速按下屏幕上出现的咒语对应按键',
                '每次成功获得20点魔力',
                '显示时间会越来越短',
                '可能同时出现多个咒语'
            ]
        };
        
        return (rules[gameKey] || []).map(rule => `<li>${rule}</li>`).join('');
    },
    
    // 获取游戏控制
    getGameControls(gameKey) {
        const controls = {
            BUBBLE_GAME: [
                '鼠标/触摸：点击气泡',
                '空格键：暂停/继续游戏'
            ],
            MEMORY_GAME: [
                '鼠标/触摸：点击卡片',
                '空格键：重新开始',
                'ESC键：返回大厅'
            ],
            REACTION_GAME: [
                '键盘：按下对应咒语的按键',
                '空格键：跳过当前咒语（无奖励）',
                'ESC键：返回大厅'
            ]
        };
        
        return (controls[gameKey] || []).map(control => `<li>${control}</li>`).join('');
    },
    
    // 获取游戏技巧
    getGameTips(gameKey) {
        const tips = {
            BUBBLE_GAME: [
                '开始时专注于准确点击，不要着急',
                '使用整个屏幕，不要只盯着一个区域',
                '难度增加后，可以尝试预测气泡路径',
                '保持放松，不要过度紧张'
            ],
            MEMORY_GAME: [
                '开始时先记住角落和边缘的卡片',
                '建立记忆模式，比如记住颜色分布',
                '随着网格变大，可以分区记忆',
                '如果记不住，可以先记住3-4个配对'
            ],
            REACTION_GAME: [
                '熟悉每个咒语的位置',
                '眼睛可以提前移动到下一个可能出现的位置',
                '保持手指在键盘上方，不要按在键上',
                '如果来不及，使用空格跳过避免错误'
            ]
        };
        
        return (tips[gameKey] || []).map(tip => `<li>${tip}</li>`).join('');
    },
    
    // 退出游戏
    exitGame() {
        if (this.currentGame) {
            this.currentGame.stop();
        }
        
        // 重新创建游戏选择界面
        this.createGameSelection();
        this.bindEvents();
        this.preloadGames();
        
        // 更新个人统计
        this.loadPersonalStats();
    },
    
    // 切换暂停状态
    togglePause() {
        if (!this.currentGame) return;
        
        if (this.currentGame.isPaused) {
            this.currentGame.resume();
            document.getElementById('game-pause-btn').innerHTML = '<i class="fas fa-pause"></i><span>暂停</span>';
        } else {
            this.currentGame.pause();
            document.getElementById('game-pause-btn').innerHTML = '<i class="fas fa-play"></i><span>继续</span>';
        }
    },
    
    // 重新开始游戏
    restartGame() {
        if (!this.currentGame) return;
        
        const gameKey = this.getGameKey(this.currentGame);
        if (gameKey) {
            this.currentGame.stop();
            this.startGame(gameKey);
        }
    },
    
    // 获取游戏键名
    getGameKey(gameInstance) {
        for (const [key, game] of Object.entries(this.games)) {
            if (game === gameInstance) {
                return key;
            }
        }
        return null;
    }
};

// ============================================
// 游戏基类
// ============================================

class BaseGame {
    constructor(configKey) {
        this.config = CONFIG.GAMES[configKey];
        this.isPlaying = false;
        this.isPaused = false;
        this.startTime = null;
        this.points = 0;
        this.difficulty = 1.0;
        this.gameLoop = null;
        this.canvas = null;
        this.ctx = null;
        
        // 回调函数
        this.onScore = null;
        this.onGameOver = null;
        this.onDifficultyUpdate = null;
    }
    
    // 开始游戏
    start() {
        this.isPlaying = true;
        this.isPaused = false;
        this.startTime = Date.now();
        this.points = 0;
        this.difficulty = 1.0;
        
        console.log(`🎮 开始游戏: ${this.config.NAME}`);
    }
    
    // 停止游戏
    stop() {
        this.isPlaying = false;
        this.isPaused = false;
        
        if (this.gameLoop) {
            cancelAnimationFrame(this.gameLoop);
            this.gameLoop = null;
        }
    }
    
    // 暂停游戏
    pause() {
        this.isPaused = true;
    }
    
    // 继续游戏
    resume() {
        this.isPaused = false;
        this.startTime = Date.now() - (this.pauseStartTime - this.startTime);
        this.update();
    }
    
    // 初始化画布
    initCanvas(container) {
        this.canvas = document.createElement('canvas');
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight - 60; // 留出一些空间给UI
        
        // 设置画布样式
        this.canvas.style.display = 'block';
        this.canvas.style.margin = '0 auto';
        this.canvas.style.backgroundColor = '#FFF0F5';
        this.canvas.style.borderRadius = '12px';
        this.canvas.style.boxShadow = '0 4px 16px rgba(106, 69, 127, 0.12)';
        
        // 清空容器并添加画布
        container.innerHTML = '';
        container.appendChild(this.canvas);
        
        this.ctx = this.canvas.getContext('2d');
        
        // 初始化游戏
        this.init();
    }
    
    // 更新游戏状态（子类实现）
    update() {
        // 子类实现
    }
    
    // 绘制游戏（子类实现）
    draw() {
        // 子类实现
    }
    
    // 游戏循环
    gameLoop() {
        if (!this.isPlaying || this.isPaused) return;
        
        // 更新难度
        this.updateDifficulty();
        
        // 更新游戏状态
        this.update();
        
        // 绘制游戏
        this.draw();
        
        // 继续循环
        this.gameLoop = requestAnimationFrame(() => this.gameLoop());
    }
    
    // 更新难度
    updateDifficulty() {
        if (!this.startTime) return;
        
        const elapsed = Date.now() - this.startTime;
        
        // 30秒后才开始增加难度
        if (elapsed < CONFIG.GAMES.GENERAL.DIFFICULTY_START_DELAY) {
            this.difficulty = 1.0;
            return;
        }
        
        // 计算难度
        this.difficulty = CONFIG.calculateGameDifficulty(
            this.constructor.name.toUpperCase(),
            elapsed
        );
        
        // 触发难度更新回调
        if (this.onDifficultyUpdate) {
            this.onDifficultyUpdate(this.difficulty);
        }
    }
    
    // 添加得分
    addScore(points) {
        this.points += points;
        
        if (this.onScore) {
            this.onScore(points);
        }
    }
    
    // 游戏结束
    gameOver() {
        this.stop();
        
        if (this.onGameOver) {
            this.onGameOver();
        }
    }
    
    // 获取游戏提示（子类实现）
    getHint() {
        return '开始游戏吧！';
    }
}

// ============================================
// 气泡捕捉术
// ============================================

class BubbleGame extends BaseGame {
    constructor() {
        super('BUBBLE_GAME');
        this.bubbles = [];
        this.bubbleSpawnTimer = 0;
        this.missedBubbles = 0;
        this.maxMissedBubbles = 10; // 最多错过10个气泡
    }
    
    init() {
        this.bubbles = [];
        this.bubbleSpawnTimer = 0;
        this.missedBubbles = 0;
        
        // 绑定点击事件
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        
        // 绑定键盘事件
        document.addEventListener('keydown', (e) => this.handleKeydown(e));
        
        // 开始游戏循环
        this.gameLoop = requestAnimationFrame(() => this.loop());
        
        // 初始生成一些气泡
        for (let i = 0; i < this.config.INITIAL_BUBBLE_COUNT; i++) {
            this.spawnBubble();
        }
    }
    
    start() {
        super.start();
        this.init();
    }
    
    stop() {
        super.stop();
        
        // 移除事件监听器
        if (this.canvas) {
            this.canvas.removeEventListener('click', (e) => this.handleClick(e));
        }
        document.removeEventListener('keydown', (e) => this.handleKeydown(e));
    }
    
    loop() {
        if (!this.isPlaying || this.isPaused) return;
        
        // 更新难度
        this.updateDifficulty();
        
        // 更新气泡
        this.updateBubbles();
        
        // 生成新气泡
        this.spawnNewBubbles();
        
        // 绘制
        this.draw();
        
        // 继续循环
        this.gameLoop = requestAnimationFrame(() => this.loop());
    }
    
    updateBubbles() {
        const currentTime = Date.now();
        
        for (let i = this.bubbles.length - 1; i >= 0; i--) {
            const bubble = this.bubbles[i];
            
            // 更新位置
            bubble.y -= bubble.speed * this.difficulty;
            
            // 气泡离开屏幕
            if (bubble.y + bubble.radius < 0) {
                this.bubbles.splice(i, 1);
                this.missedBubbles++;
                
                // 检查是否游戏结束
                if (this.missedBubbles >= this.maxMissedBubbles) {
                    this.gameOver();
                    return;
                }
            }
            
            // 气泡生命周期结束
            if (currentTime > bubble.createdAt + this.config.BUBBLE_LIFETIME) {
                this.bubbles.splice(i, 1);
            }
        }
    }
    
    spawnNewBubbles() {
        const gameParams = CONFIG.getGameParams('BUBBLE_GAME', Date.now() - this.startTime);
        const spawnInterval = gameParams.spawnInterval || this.config.INITIAL_SPAWN_INTERVAL;
        
        if (Date.now() - this.bubbleSpawnTimer > spawnInterval) {
            this.spawnBubble();
            this.bubbleSpawnTimer = Date.now();
        }
    }
    
    spawnBubble() {
        const gameParams = CONFIG.getGameParams('BUBBLE_GAME', Date.now() - this.startTime);
        const bubbleSpeed = gameParams.bubbleSpeed || this.config.INITIAL_BUBBLE_SPEED;
        
        const bubble = {
            x: Math.random() * (this.canvas.width - 80) + 40,
            y: this.canvas.height + 40,
            radius: 20 + Math.random() * 15,
            speed: bubbleSpeed + Math.random() * 2,
            color: this.getRandomBubbleColor(),
            createdAt: Date.now(),
            isClicked: false
        };
        
        this.bubbles.push(bubble);
    }
    
    draw() {
        // 清空画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制背景
        this.drawBackground();
        
        // 绘制气泡
        this.bubbles.forEach(bubble => {
            this.drawBubble(bubble);
        });
        
        // 绘制UI
        this.drawUI();
    }
    
    drawBackground() {
        // 渐变背景
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#FFF0F5');
        gradient.addColorStop(1, '#FFC8E8');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制魔法阵背景
        this.ctx.strokeStyle = 'rgba(255, 154, 200, 0.1)';
        this.ctx.lineWidth = 2;
        
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const radius = Math.min(this.canvas.width, this.canvas.height) / 3;
        
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        this.ctx.stroke();
        
        // 绘制小魔法阵
        for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI) / 4;
            const x = centerX + Math.cos(angle) * (radius * 0.7);
            const y = centerY + Math.sin(angle) * (radius * 0.7);
            
            this.ctx.beginPath();
            this.ctx.arc(x, y, radius * 0.1, 0, Math.PI * 2);
            this.ctx.stroke();
        }
    }
    
    drawBubble(bubble) {
        // 气泡主体
        this.ctx.beginPath();
        this.ctx.arc(bubble.x, bubble.y, bubble.radius, 0, Math.PI * 2);
        
        // 渐变填充
        const gradient = this.ctx.createRadialGradient(
            bubble.x - bubble.radius * 0.3,
            bubble.y - bubble.radius * 0.3,
            0,
            bubble.x,
            bubble.y,
            bubble.radius
        );
        
        gradient.addColorStop(0, `${bubble.color}CC`);
        gradient.addColorStop(1, `${bubble.color}66`);
        
        this.ctx.fillStyle = gradient;
        this.ctx.fill();
        
        // 气泡高光
        this.ctx.beginPath();
        this.ctx.arc(
            bubble.x - bubble.radius * 0.3,
            bubble.y - bubble.radius * 0.3,
            bubble.radius * 0.3,
            0,
            Math.PI * 2
        );
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.fill();
        
        // 气泡边框
        this.ctx.strokeStyle = `${bubble.color}AA`;
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        // 气泡内的加号
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.font = `${bubble.radius * 0.8}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('+', bubble.x, bubble.y);
    }
    
    drawUI() {
        // 绘制分数
        this.ctx.fillStyle = '#6A457F';
        this.ctx.font = 'bold 24px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`魔力: ${this.points}`, 20, 40);
        
        // 绘制难度
        this.ctx.fillStyle = this.difficulty >= 5.0 ? '#FF6BAC' : 
                           this.difficulty >= 3.0 ? '#FF9AC8' : '#A8E6CF';
        this.ctx.fillText(`难度: ${this.difficulty.toFixed(1)}x`, 20, 70);
        
        // 绘制剩余气泡
        this.ctx.fillStyle = '#6A457F';
        this.ctx.fillText(`错过: ${this.missedBubbles}/${this.maxMissedBubbles}`, 20, 100);
        
        // 绘制游戏时间
        const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        this.ctx.fillText(`时间: ${minutes}:${seconds.toString().padStart(2, '0')}`, 20, 130);
        
        // 绘制游戏提示
        this.ctx.fillStyle = '#8B6B9E';
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('点击气泡收集魔力！', this.canvas.width / 2, this.canvas.height - 30);
    }
    
    handleClick(event) {
        if (!this.isPlaying || this.isPaused) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        // 检查是否点击到气泡
        for (let i = this.bubbles.length - 1; i >= 0; i--) {
            const bubble = this.bubbles[i];
            const distance = Math.sqrt((x - bubble.x) ** 2 + (y - bubble.y) ** 2);
            
            if (distance <= bubble.radius) {
                // 移除气泡
                this.bubbles.splice(i, 1);
                
                // 添加得分
                this.addScore(CONFIG.GAMES.GENERAL.POINTS_PER_ACTION);
                
                // 播放点击效果
                this.showClickEffect(x, y);
                
                break;
            }
        }
    }
    
    handleKeydown(event) {
        if (event.code === 'Space') {
            GameManager.togglePause();
        } else if (event.code === 'Escape') {
            GameManager.exitGame();
        }
    }
    
    showClickEffect(x, y) {
        // 创建点击效果
        const particles = [];
        const color = this.getRandomBubbleColor();
        
        for (let i = 0; i < 8; i++) {
            particles.push({
                x, y,
                vx: Math.cos((i * Math.PI) / 4) * 3,
                vy: Math.sin((i * Math.PI) / 4) * 3,
                radius: 3,
                color,
                life: 1.0
            });
        }
        
        // 动画效果
        const animateParticles = () => {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.draw(); // 重绘游戏
            
            let allDead = true;
            
            particles.forEach((particle, index) => {
                if (particle.life <= 0) return;
                
                allDead = false;
                
                // 更新粒子
                particle.x += particle.vx;
                particle.y += particle.vy;
                particle.life -= 0.05;
                particle.radius *= 0.95;
                
                // 绘制粒子
                this.ctx.beginPath();
                this.ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
                this.ctx.fillStyle = `${particle.color}${Math.floor(particle.life * 255).toString(16).padStart(2, '0')}`;
                this.ctx.fill();
            });
            
            if (!allDead) {
                requestAnimationFrame(animateParticles);
            }
        };
        
        animateParticles();
    }
    
    getRandomBubbleColor() {
        const colors = ['#FF9AC8', '#FF6BAC', '#A8E6CF', '#74B9FF', '#FFD3B6', '#FFEAA7'];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    getHint() {
        return '点击屏幕上飘过的气泡即可获得魔力！难度会随时间增加。';
    }
}

// ============================================
// 记忆符文阵
// ============================================

class MemoryGame extends BaseGame {
    constructor() {
        super('MEMORY_GAME');
        this.cards = [];
        this.flippedCards = [];
        this.matchedPairs = 0;
        this.totalPairs = 0;
        this.showingCards = false;
        this.showCardsStartTime = 0;
        this.gridSize = 4;
    }
    
    init() {
        // 根据当前难度设置网格大小
        const gameParams = CONFIG.getGameParams('MEMORY_GAME', Date.now() - this.startTime);
        this.gridSize = gameParams.gridSize || this.config.INITIAL_GRID_SIZE;
        this.totalPairs = this.gridSize * this.gridSize / 2;
        
        // 生成卡片
        this.generateCards();
        
        // 绑定点击事件
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        
        // 绑定键盘事件
        document.addEventListener('keydown', (e) => this.handleKeydown(e));
        
        // 开始显示卡片
        this.showCards();
    }
    
    start() {
        super.start();
        this.matchedPairs = 0;
        this.flippedCards = [];
        this.showingCards = false;
        this.init();
    }
    
    generateCards() {
        this.cards = [];
        const symbols = ['🌸', '⭐', '🍑', '💖', '✨', '🎀', '🎮', '👑', '🎁', '🎵', '🎊', '🎉'];
        const usedSymbols = [];
        
        // 选择需要的符号数量
        for (let i = 0; i < this.totalPairs; i++) {
            let symbol;
            do {
                symbol = symbols[Math.floor(Math.random() * symbols.length)];
            } while (usedSymbols.filter(s => s === symbol).length >= 2);
            
            usedSymbols.push(symbol);
        }
        
        // 每个符号需要两枚
        const cardSymbols = [...usedSymbols, ...usedSymbols];
        
        // 打乱顺序
        for (let i = cardSymbols.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [cardSymbols[i], cardSymbols[j]] = [cardSymbols[j], cardSymbols[i]];
        }
        
        // 创建卡片
        let index = 0;
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                this.cards.push({
                    row, col,
                    symbol: cardSymbols[index],
                    isFlipped: false,
                    isMatched: false,
                    index: index
                });
                index++;
            }
        }
    }
    
    showCards() {
        this.showingCards = true;
        this.showCardsStartTime = Date.now();
        
        // 翻转所有卡片
        this.cards.forEach(card => {
            card.isFlipped = true;
        });
        
        // 绘制
        this.draw();
        
        // 设置计时器，之后隐藏卡片
        const gameParams = CONFIG.getGameParams('MEMORY_GAME', Date.now() - this.startTime);
        const showTime = gameParams.showTime || this.config.INITIAL_SHOW_TIME;
        
        setTimeout(() => {
            this.showingCards = false;
            this.cards.forEach(card => {
                if (!card.isMatched) {
                    card.isFlipped = false;
                }
            });
            this.draw();
        }, showTime);
    }
    
    draw() {
        // 清空画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制背景
        this.drawBackground();
        
        // 绘制卡片
        this.drawCards();
        
        // 绘制UI
        this.drawUI();
    }
    
    drawBackground() {
        // 渐变背景
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#FFF0F5');
        gradient.addColorStop(1, '#A8E6CF');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制魔法符文阵背景
        this.ctx.strokeStyle = 'rgba(168, 230, 207, 0.3)';
        this.ctx.lineWidth = 1;
        
        const gridSize = this.gridSize;
        const cardWidth = (this.canvas.width - 40) / gridSize;
        const cardHeight = (this.canvas.height - 100) / gridSize;
        const startX = 20;
        const startY = 80;
        
        // 绘制网格线
        for (let i = 0; i <= gridSize; i++) {
            // 垂直线
            this.ctx.beginPath();
            this.ctx.moveTo(startX + i * cardWidth, startY);
            this.ctx.lineTo(startX + i * cardWidth, startY + gridSize * cardHeight);
            this.ctx.stroke();
            
            // 水平线
            this.ctx.beginPath();
            this.ctx.moveTo(startX, startY + i * cardHeight);
            this.ctx.lineTo(startX + gridSize * cardWidth, startY + i * cardHeight);
            this.ctx.stroke();
        }
    }
    
    drawCards() {
        const gridSize = this.gridSize;
        const cardWidth = (this.canvas.width - 40) / gridSize;
        const cardHeight = (this.canvas.height - 100) / gridSize;
        const startX = 20;
        const startY = 80;
        
        this.cards.forEach(card => {
            const x = startX + card.col * cardWidth;
            const y = startY + card.row * cardHeight;
            const padding = 5;
            
            if (card.isFlipped || card.isMatched) {
                // 卡片正面
                this.ctx.fillStyle = '#FFFFFF';
                this.ctx.fillRect(x + padding, y + padding, cardWidth - padding * 2, cardHeight - padding * 2);
                
                this.ctx.strokeStyle = '#FF9AC8';
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(x + padding, y + padding, cardWidth - padding * 2, cardHeight - padding * 2);
                
                // 绘制符号
                this.ctx.fillStyle = '#FF6BAC';
                this.ctx.font = `${Math.min(cardWidth, cardHeight) * 0.4}px Arial`;
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText(card.symbol, x + cardWidth / 2, y + cardHeight / 2);
                
                // 如果已匹配，添加特效
                if (card.isMatched) {
                    this.ctx.strokeStyle = '#A8E6CF';
                    this.ctx.lineWidth = 3;
                    this.ctx.strokeRect(x + padding, y + padding, cardWidth - padding * 2, cardHeight - padding * 2);
                }
            } else {
                // 卡片背面
                const gradient = this.ctx.createLinearGradient(x, y, x + cardWidth, y + cardHeight);
                gradient.addColorStop(0, '#FFC8E8');
                gradient.addColorStop(1, '#FF9AC8');
                
                this.ctx.fillStyle = gradient;
                this.ctx.fillRect(x + padding, y + padding, cardWidth - padding * 2, cardHeight - padding * 2);
                
                this.ctx.strokeStyle = '#FFFFFF';
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(x + padding, y + padding, cardWidth - padding * 2, cardHeight - padding * 2);
                
                // 绘制问号
                this.ctx.fillStyle = '#FFFFFF';
                this.ctx.font = `${Math.min(cardWidth, cardHeight) * 0.3}px Arial`;
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText('?', x + cardWidth / 2, y + cardHeight / 2);
            }
        });
    }
    
    drawUI() {
        // 绘制分数
        this.ctx.fillStyle = '#6A457F';
        this.ctx.font = 'bold 24px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`魔力: ${this.points}`, 20, 40);
        
        // 绘制配对进度
        this.ctx.fillStyle = '#6A457F';
        this.ctx.fillText(`配对: ${this.matchedPairs}/${this.totalPairs}`, 200, 40);
        
        // 绘制游戏状态
        if (this.showingCards) {
            const gameParams = CONFIG.getGameParams('MEMORY_GAME', Date.now() - this.startTime);
            const showTime = gameParams.showTime || this.config.INITIAL_SHOW_TIME;
            const elapsed = Date.now() - this.showCardsStartTime;
            const remaining = Math.max(0, (showTime - elapsed) / 1000).toFixed(1);
            
            this.ctx.fillStyle = '#FF6BAC';
            this.ctx.font = '20px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(`记忆时间: ${remaining}秒`, this.canvas.width / 2, 40);
        }
        
        // 绘制游戏提示
        this.ctx.fillStyle = '#8B6B9E';
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'center';
        
        if (this.showingCards) {
            this.ctx.fillText('记住这些符文的位置！', this.canvas.width / 2, this.canvas.height - 30);
        } else if (this.flippedCards.length === 2) {
            this.ctx.fillText('正在检查配对...', this.canvas.width / 2, this.canvas.height - 30);
        } else {
            this.ctx.fillText('点击卡片翻开，找到匹配的符文', this.canvas.width / 2, this.canvas.height - 30);
        }
    }
    
    handleClick(event) {
        if (!this.isPlaying || this.isPaused || this.showingCards) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        // 计算点击的卡片
        const gridSize = this.gridSize;
        const cardWidth = (this.canvas.width - 40) / gridSize;
        const cardHeight = (this.canvas.height - 100) / gridSize;
        const startX = 20;
        const startY = 80;
        
        const col = Math.floor((x - startX) / cardWidth);
        const row = Math.floor((y - startY) / cardHeight);
        
        if (col >= 0 && col < gridSize && row >= 0 && row < gridSize) {
            const cardIndex = row * gridSize + col;
            const card = this.cards[cardIndex];
            
            // 如果卡片可以翻开
            if (!card.isFlipped && !card.isMatched && this.flippedCards.length < 2) {
                card.isFlipped = true;
                this.flippedCards.push(card);
                
                // 绘制更新
                this.draw();
                
                // 如果翻开了两张卡片，检查是否匹配
                if (this.flippedCards.length === 2) {
                    setTimeout(() => this.checkMatch(), 500);
                }
            }
        }
    }
    
    checkMatch() {
        const [card1, card2] = this.flippedCards;
        
        if (card1.symbol === card2.symbol) {
            // 匹配成功
            card1.isMatched = true;
            card2.isMatched = true;
            this.matchedPairs++;
            
            // 添加得分
            this.addScore(CONFIG.GAMES.GENERAL.POINTS_PER_ACTION * 5); // 记忆游戏得分更高
            
            // 检查游戏是否结束
            if (this.matchedPairs === this.totalPairs) {
                setTimeout(() => this.gameOver(), 500);
            }
        } else {
            // 匹配失败，翻转回去
            card1.isFlipped = false;
            card2.isFlipped = false;
        }
        
        this.flippedCards = [];
        this.draw();
    }
    
    handleKeydown(event) {
        if (event.code === 'Space') {
            // 重新开始
            GameManager.restartGame();
        } else if (event.code === 'Escape') {
            GameManager.exitGame();
        }
    }
    
    getHint() {
        return '记住魔法符文的位置，找到匹配的配对！难度增加后网格会变大。';
    }
}

// ============================================
// 快速咏唱测试
// ============================================

class ReactionGame extends BaseGame {
    constructor() {
        super('REACTION_GAME');
        this.currentWord = '';
        this.nextWordTimer = 0;
        this.wordStartTime = 0;
        this.correctCount = 0;
        this.wrongCount = 0;
        this.activeWords = [];
        this.availableWords = [...this.config.WORDS];
    }
    
    init() {
        this.currentWord = '';
        this.nextWordTimer = 0;
        this.wordStartTime = 0;
        this.correctCount = 0;
        this.wrongCount = 0;
        this.activeWords = [];
        
        // 打乱单词顺序
        this.shuffleWords();
        
        // 绑定键盘事件
        document.addEventListener('keydown', (e) => this.handleKeydown(e));
        
        // 开始游戏循环
        this.gameLoop = requestAnimationFrame(() => this.loop());
        
        // 生成第一个单词
        this.generateNewWord();
    }
    
    start() {
        super.start();
        this.init();
    }
    
    stop() {
        super.stop();
        
        // 移除事件监听器
        document.removeEventListener('keydown', (e) => this.handleKeydown(e));
    }
    
    loop() {
        if (!this.isPlaying || this.isPaused) return;
        
        // 更新难度
        this.updateDifficulty();
        
        // 更新单词状态
        this.updateWords();
        
        // 生成新单词
        this.generateNewWords();
        
        // 绘制
        this.draw();
        
        // 继续循环
        this.gameLoop = requestAnimationFrame(() => this.loop());
    }
    
    updateWords() {
        const currentTime = Date.now();
        
        // 检查当前活跃单词是否超时
        for (let i = this.activeWords.length - 1; i >= 0; i--) {
            const word = this.activeWords[i];
            
            // 如果单词显示时间结束
            if (currentTime > word.createdAt + word.showTime) {
                this.activeWords.splice(i, 1);
                this.wrongCount++;
                
                // 如果错误太多，游戏结束
                if (this.wrongCount >= 10) {
                    this.gameOver();
                }
            }
        }
    }
    
    generateNewWords() {
        if (Date.now() - this.nextWordTimer > this.getNextWordDelay()) {
            this.generateNewWord();
            this.nextWordTimer = Date.now();
        }
    }
    
    generateNewWord() {
        const gameParams = CONFIG.getGameParams('REACTION_GAME', Date.now() - this.startTime);
        const wordCount = gameParams.wordCount || this.config.INITIAL_WORD_COUNT;
        const showTime = gameParams.showTime || this.config.INITIAL_SHOW_TIME;
        
        // 生成指定数量的单词
        for (let i = 0; i < wordCount; i++) {
            if (this.availableWords.length === 0) {
                this.availableWords = [...this.config.WORDS];
            }
            
            const word = this.availableWords.pop();
            const x = Math.random() * (this.canvas.width - 200) + 100;
            const y = Math.random() * (this.canvas.height - 100) + 50;
            const key = this.getKeyForWord(word);
            
            this.activeWords.push({
                text: word,
                x, y,
                key,
                showTime,
                createdAt: Date.now(),
                isMatched: false
            });
        }
    }
    
    getNextWordDelay() {
        const gameParams = CONFIG.getGameParams('REACTION_GAME', Date.now() - this.startTime);
        return gameParams.nextDelay || this.config.INITIAL_NEXT_DELAY;
    }
    
    draw() {
        // 清空画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制背景
        this.drawBackground();
        
        // 绘制单词
        this.drawWords();
        
        // 绘制UI
        this.drawUI();
    }
    
    drawBackground() {
        // 渐变背景
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#FFF0F5');
        gradient.addColorStop(1, '#74B9FF');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制魔法咒语背景
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'center';
        
        const words = ['可爱', '调皮', '魔法', '精灵', '公主', '契约', '魔力'];
        for (let i = 0; i < words.length; i++) {
            const x = Math.random() * this.canvas.width;
            const y = Math.random() * this.canvas.height;
            this.ctx.fillText(words[i], x, y);
        }
    }
    
    drawWords() {
        this.activeWords.forEach(word => {
            // 计算剩余时间百分比
            const elapsed = Date.now() - word.createdAt;
            const timeLeft = Math.max(0, word.showTime - elapsed);
            const percentage = timeLeft / word.showTime;
            
            // 根据剩余时间改变颜色
            let color;
            if (percentage > 0.7) {
                color = '#A8E6CF'; // 绿色，时间充足
            } else if (percentage > 0.3) {
                color = '#FFD3B6'; // 橙色，时间中等
            } else {
                color = '#FF6BAC'; // 红色，时间紧迫
            }
            
            // 绘制单词背景
            this.ctx.fillStyle = color + '40';
            this.ctx.fillRect(word.x - 60, word.y - 35, 120, 70);
            
            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(word.x - 60, word.y - 35, 120, 70);
            
            // 绘制单词
            this.ctx.fillStyle = '#6A457F';
            this.ctx.font = 'bold 24px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(word.text, word.x, word.y - 5);
            
            // 绘制对应按键
            this.ctx.fillStyle = '#8B6B9E';
            this.ctx.font = '16px Arial';
            this.ctx.fillText(`按键: ${word.key}`, word.x, word.y + 20);
            
            // 绘制时间条
            this.ctx.fillStyle = color;
            this.ctx.fillRect(word.x - 50, word.y + 30, 100 * percentage, 5);
            
            // 如果已匹配，添加特效
            if (word.isMatched) {
                this.ctx.strokeStyle = '#FFD700';
                this.ctx.lineWidth = 3;
                this.ctx.strokeRect(word.x - 60, word.y - 35, 120, 70);
            }
        });
    }
    
    drawUI() {
        // 绘制分数
        this.ctx.fillStyle = '#6A457F';
        this.ctx.font = 'bold 24px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`魔力: ${this.points}`, 20, 40);
        
        // 绘制正确/错误计数
        this.ctx.fillStyle = '#A8E6CF';
        this.ctx.fillText(`正确: ${this.correctCount}`, 20, 70);
        
        this.ctx.fillStyle = '#FF6BAC';
        this.ctx.fillText(`错误: ${this.wrongCount}`, 20, 100);
        
        // 绘制活跃单词数量
        this.ctx.fillStyle = '#6A457F';
        this.ctx.fillText(`单词: ${this.activeWords.length}`, 20, 130);
        
        // 绘制游戏提示
        this.ctx.fillStyle = '#8B6B9E';
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('快速按下咒语对应的按键！空格键跳过，ESC退出', this.canvas.width / 2, this.canvas.height - 30);
    }
    
    handleKeydown(event) {
        if (!this.isPlaying || this.isPaused) return;
        
        const key = event.key.toUpperCase();
        
        if (key === 'ESCAPE') {
            GameManager.exitGame();
            return;
        }
        
        if (key === ' ') {
            // 空格键跳过当前所有单词
            this.activeWords = [];
            return;
        }
        
        // 检查是否匹配
        let matched = false;
        for (let i = this.activeWords.length - 1; i >= 0; i--) {
            const word = this.activeWords[i];
            
            if (word.key === key && !word.isMatched) {
                // 匹配成功
                this.activeWords.splice(i, 1);
                this.correctCount++;
                matched = true;
                
                // 添加得分
                this.addScore(CONFIG.GAMES.GENERAL.POINTS_PER_ACTION * 2);
                
                // 显示匹配效果
                this.showMatchEffect(word.x, word.y);
                break;
            }
        }
        
        // 如果没有匹配且按的不是空格，增加错误计数
        if (!matched && key !== ' ') {
            this.wrongCount++;
            
            // 如果错误太多，游戏结束
            if (this.wrongCount >= 10) {
                this.gameOver();
            }
        }
    }
    
    showMatchEffect(x, y) {
        // 创建匹配特效
        const particles = [];
        
        for (let i = 0; i < 12; i++) {
            const angle = (i * Math.PI) / 6;
            particles.push({
                x, y,
                vx: Math.cos(angle) * 5,
                vy: Math.sin(angle) * 5,
                radius: 4 + Math.random() * 3,
                color: ['#FF9AC8', '#FF6BAC', '#A8E6CF', '#74B9FF'][Math.floor(Math.random() * 4)],
                life: 1.0
            });
        }
        
        // 动画效果
        const animateParticles = () => {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.draw(); // 重绘游戏
            
            let allDead = true;
            
            particles.forEach((particle, index) => {
                if (particle.life <= 0) return;
                
                allDead = false;
                
                // 更新粒子
                particle.x += particle.vx;
                particle.y += particle.vy;
                particle.life -= 0.05;
                particle.radius *= 0.95;
                
                // 绘制粒子
                this.ctx.beginPath();
                this.ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
                this.ctx.fillStyle = `${particle.color}${Math.floor(particle.life * 255).toString(16).padStart(2, '0')}`;
                this.ctx.fill();
            });
            
            if (!allDead) {
                requestAnimationFrame(animateParticles);
            }
        };
        
        animateParticles();
    }
    
    shuffleWords() {
        for (let i = this.availableWords.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.availableWords[i], this.availableWords[j]] = [this.availableWords[j], this.availableWords[i]];
        }
    }
    
    getKeyForWord(word) {
        // 为每个单词分配一个按键
        const keyMapping = {
            '可爱': 'A',
            '调皮': 'S',
            '魔法': 'D',
            '精灵': 'F',
            '公主': 'G',
            '契约': 'H',
            '魔力': 'J',
            '气泡': 'K',
            '桃色': 'L',
            '汽水': 'Z',
            '闪耀': 'X',
            '梦幻': 'C',
            '快乐': 'V',
            '永恒': 'B',
            '星星': 'N',
            '月光': 'M'
        };
        
        return keyMapping[word] || word.charAt(0).toUpperCase();
    }
    
    getHint() {
        return '快速按下咒语对应的按键！显示时间会越来越短。';
    }
}

// ============================================
// 初始化函数
// ============================================

function initGames() {
    // 添加游戏样式
    addGameStyles();
    
    // 初始化游戏管理器
    GameManager.init();
}

// ============================================
// 添加游戏样式
// ============================================

function addGameStyles() {
    const style = document.createElement('style');
    style.textContent = `
        /* 游戏卡片样式 */
        .games-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 24px;
            margin: 32px 0;
        }
        
        .game-card {
            background: white;
            border-radius: 16px;
            padding: 24px;
            box-shadow: 0 4px 16px rgba(106, 69, 127, 0.12);
            border: 2px solid #FFC8E8;
            transition: all 0.3s ease;
        }
        
        .game-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 8px 32px rgba(106, 69, 127, 0.2);
            border-color: #FF9AC8;
        }
        
        .game-card.playing {
            border-color: #A8E6CF;
            box-shadow: 0 0 0 3px rgba(168, 230, 207, 0.3);
        }
        
        .game-card-header {
            display: flex;
            align-items: center;
            gap: 16px;
            margin-bottom: 20px;
        }
        
        .game-icon {
            width: 60px;
            height: 60px;
            background: linear-gradient(135deg, #FF9AC8, #FF6BAC);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 24px;
        }
        
        .game-title h3 {
            color: #6A457F;
            font-size: 20px;
            margin: 0 0 4px 0;
        }
        
        .game-points {
            background: #FFC8E8;
            color: #FF6BAC;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 600;
        }
        
        .game-description {
            color: #8B6B9E;
            line-height: 1.6;
            margin-bottom: 20px;
        }
        
        .game-difficulty {
            margin-bottom: 20px;
        }
        
        .difficulty-bar {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        
        .difficulty-label {
            color: #6A457F;
            font-size: 14px;
            font-weight: 500;
            white-space: nowrap;
        }
        
        .difficulty-dots {
            display: flex;
            gap: 6px;
        }
        
        .difficulty-dots .dot {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: #E9ECEF;
            transition: all 0.3s ease;
        }
        
        .difficulty-dots .dot.active {
            background: #FF9AC8;
            transform: scale(1.2);
        }
        
        .game-stats {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 12px;
            margin-bottom: 24px;
        }
        
        .game-stats .stat {
            background: #FFF8FB;
            border-radius: 8px;
            padding: 12px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .game-stats .stat i {
            color: #FF9AC8;
        }
        
        .game-stats .stat-value {
            font-weight: 600;
            color: #6A457F;
        }
        
        .game-card-footer {
            display: flex;
            gap: 12px;
        }
        
        .btn-play, .btn-info {
            flex: 1;
            padding: 12px 24px;
            border: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            transition: all 0.3s ease;
        }
        
        .btn-play {
            background: linear-gradient(135deg, #FF9AC8, #FF6BAC);
            color: white;
        }
        
        .btn-play:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(255, 107, 172, 0.4);
        }
        
        .btn-info {
            background: #FFF0F5;
            color: #6A457F;
            border: 2px solid #FFC8E8;
        }
        
        .btn-info:hover {
            background: #FFC8E8;
        }
        
        /* 游戏全屏模式 */
        .game-fullscreen {
            min-height: 600px;
            background: white;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 8px 32px rgba(106, 69, 127, 0.16);
        }
        
        .game-header {
            background: linear-gradient(135deg, #FF9AC8, #FF6BAC);
            color: white;
            padding: 16px 24px;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        
        .btn-back {
            background: rgba(255, 255, 255, 0.2);
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 8px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: all 0.3s ease;
        }
        
        .btn-back:hover {
            background: rgba(255, 255, 255, 0.3);
        }
        
        .game-header-info {
            text-align: center;
        }
        
        .game-header-info h2 {
            margin: 0;
            font-size: 24px;
        }
        
        .game-time {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            font-size: 14px;
            opacity: 0.9;
        }
        
        .game-header-stats {
            display: flex;
            gap: 24px;
        }
        
        .game-header-stats .stat {
            background: rgba(255, 255, 255, 0.2);
            padding: 8px 16px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            gap: 8px;
            font-weight: 600;
        }
        
        .game-area {
            height: 500px;
            position: relative;
            overflow: hidden;
        }
        
        .game-loading {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100%;
            color: #8B6B9E;
        }
        
        .game-loading .loading-spinner {
            width: 40px;
            height: 40px;
            border: 4px solid #FFC8E8;
            border-top-color: #FF9AC8;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 16px;
        }
        
        .game-controls {
            background: #FFF8FB;
            padding: 16px 24px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-top: 2px solid #FFC8E8;
        }
        
        .btn-control {
            background: white;
            border: 2px solid #FFC8E8;
            color: #6A457F;
            padding: 12px 24px;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: all 0.3s ease;
        }
        
        .btn-control:hover {
            background: #FFC8E8;
            transform: translateY(-2px);
        }
        
        .game-hint {
            background: rgba(168, 230, 207, 0.2);
            padding: 12px 20px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            gap: 8px;
            color: #6A457F;
            max-width: 400px;
        }
        
        .game-hint i {
            color: #A8E6CF;
        }
        
        /* 游戏结束界面 */
        .game-over-screen {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100%;
            background: rgba(255, 255, 255, 0.95);
        }
        
        .game-over-content {
            background: white;
            border-radius: 16px;
            padding: 32px;
            text-align: center;
            box-shadow: 0 8px 32px rgba(106, 69, 127, 0.16);
            max-width: 500px;
            width: 90%;
        }
        
        .game-over-icon {
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, #FF9AC8, #FF6BAC);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 20px;
            color: white;
            font-size: 32px;
        }
        
        .game-over-content h2 {
            color: #6A457F;
            margin: 0 0 24px 0;
        }
        
        .game-over-stats {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 16px;
            margin-bottom: 24px;
        }
        
        .game-over-stats .stat-item {
            background: #FFF8FB;
            padding: 16px;
            border-radius: 8px;
        }
        
        .game-over-stats .stat-label {
            font-size: 14px;
            color: #8B6B9E;
            margin-bottom: 8px;
        }
        
        .game-over-stats .stat-value {
            font-size: 20px;
            font-weight: 600;
            color: #FF6BAC;
        }
        
        .game-over-message {
            background: #FFF0F5;
            padding: 16px;
            border-radius: 8px;
            margin-bottom: 24px;
        }
        
        .game-over-message p {
            margin: 0;
            color: #6A457F;
            line-height: 1.6;
        }
        
        .game-over-actions {
            display: flex;
            gap: 16px;
        }
        
        .btn-action {
            flex: 1;
            padding: 16px 24px;
            border: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            transition: all 0.3s ease;
        }
        
        .btn-play-again {
            background: linear-gradient(135deg, #FF9AC8, #FF6BAC);
            color: white;
        }
        
        .btn-play-again:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(255, 107, 172, 0.4);
        }
        
        .btn-back-to-lobby {
            background: white;
            color: #6A457F;
            border: 2px solid #FFC8E8;
        }
        
        .btn-back-to-lobby:hover {
            background: #FFC8E8;
            transform: translateY(-2px);
        }
        
        /* 得分效果 */
        .score-effect {
            position: absolute;
            font-size: 24px;
            font-weight: bold;
            color: #FF6BAC;
            text-shadow: 0 2px 4px rgba(255, 255, 255, 0.8);
            animation: floatUp 1s ease-out forwards;
            pointer-events: none;
            z-index: 100;
        }
        
        @keyframes floatUp {
            0% {
                opacity: 1;
                transform: translateY(0) scale(1);
            }
            100% {
                opacity: 0;
                transform: translateY(-50px) scale(1.5);
            }
        }
        
        /* 游戏说明模态框 */
        .game-instruction-modal {
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
            padding: 20px;
        }
        
        .instruction-content {
            background: white;
            border-radius: 16px;
            max-width: 600px;
            width: 100%;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 16px 48px rgba(106, 69, 127, 0.2);
        }
        
        .instruction-header {
            background: linear-gradient(135deg, #FF9AC8, #FF6BAC);
            color: white;
            padding: 20px;
            border-radius: 16px 16px 0 0;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        
        .instruction-header h2 {
            margin: 0;
            display: flex;
            align-items: center;
            gap: 12px;
        }
        
        .btn-close-instruction {
            background: none;
            border: none;
            color: white;
            font-size: 32px;
            cursor: pointer;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            transition: all 0.3s ease;
        }
        
        .btn-close-instruction:hover {
            background: rgba(255, 255, 255, 0.2);
        }
        
        .instruction-body {
            padding: 24px;
        }
        
        .instruction-description {
            color: #6A457F;
            font-size: 18px;
            line-height: 1.6;
            margin-bottom: 24px;
            padding: 16px;
            background: #FFF8FB;
            border-radius: 8px;
        }
        
        .instruction-rules,
        .instruction-controls,
        .instruction-tips {
            margin-bottom: 24px;
        }
        
        .instruction-rules h3,
        .instruction-controls h3,
        .instruction-tips h3 {
            color: #FF6BAC;
            margin: 0 0 12px 0;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .instruction-rules ul,
        .instruction-controls ul,
        .instruction-tips ul {
            margin: 0;
            padding-left: 20px;
        }
        
        .instruction-rules li,
        .instruction-controls li,
        .instruction-tips li {
            color: #6A457F;
            margin-bottom: 8px;
            line-height: 1.5;
        }
        
        .instruction-footer {
            padding: 20px 24px;
            border-top: 2px solid #FFC8E8;
            text-align: center;
        }
        
        .btn-start-instruction {
            background: linear-gradient(135deg, #FF9AC8, #FF6BAC);
            color: white;
            border: none;
            padding: 16px 32px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 18px;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 12px;
            transition: all 0.3s ease;
        }
        
        .btn-start-instruction:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(255, 107, 172, 0.4);
        }
        
        /* 游戏统计 */
        .games-stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 24px;
            margin-top: 32px;
        }
        
        .stats-card {
            background: white;
            border-radius: 16px;
            padding: 24px;
            box-shadow: 0 4px 16px rgba(106, 69, 127, 0.12);
            border: 2px solid #A8E6CF;
        }
        
        .stats-card h3 {
            color: #6A457F;
            margin: 0 0 20px 0;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .difficulty-list {
            list-style: none;
            padding: 0;
            margin: 0;
        }
        
        .difficulty-list li {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px 0;
            border-bottom: 1px solid #FFC8E8;
            color: #8B6B9E;
        }
        
        .difficulty-list li:last-child {
            border-bottom: none;
        }
        
        .difficulty-list li i {
            color: #FF9AC8;
            width: 20px;
        }
        
        .personal-stat {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 0;
            border-bottom: 1px solid #FFC8E8;
        }
        
        .personal-stat:last-child {
            border-bottom: none;
        }
        
        .personal-stat .stat-name {
            font-weight: 600;
            color: #6A457F;
        }
        
        .personal-stat .stat-details {
            display: flex;
            gap: 16px;
        }
        
        .personal-stat .stat-details span {
            background: #FFF0F5;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 14px;
            color: #FF6BAC;
        }
        
        /* 响应式调整 */
        @media (max-width: 768px) {
            .games-grid {
                grid-template-columns: 1fr;
            }
            
            .game-stats {
                grid-template-columns: 1fr;
            }
            
            .game-over-stats {
                grid-template-columns: 1fr;
            }
            
            .game-over-actions {
                flex-direction: column;
            }
            
            .game-header {
                flex-direction: column;
                gap: 16px;
            }
            
            .game-header-stats {
                width: 100%;
                justify-content: space-around;
            }
            
            .game-controls {
                flex-direction: column;
                gap: 16px;
            }
            
            .games-stats {
                grid-template-columns: 1fr;
            }
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
    `;
    
    document.head.appendChild(style);
}

// ============================================
// 导出和初始化
// ============================================

// 导出到全局对象
if (typeof window !== 'undefined') {
    window.GameManager = GameManager;
    window.BubbleGame = BubbleGame;
    window.MemoryGame = MemoryGame;
    window.ReactionGame = ReactionGame;
    window.initGames = initGames;
}

// 如果是通过模块导入，导出相关类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        GameManager,
        BubbleGame,
        MemoryGame,
        ReactionGame,
        initGames
    };
}

console.log('🎮 games.js 模块已加载');