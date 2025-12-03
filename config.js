// config.js - 桃汽水の魔力补给站 配置文件
// 请根据您的需求修改以下配置

const CONFIG = {
    // ========== 基础信息 ==========
    SITE_TITLE: "桃汽水の魔力补给站",
    SITE_SUBTITLE: "异世界精灵公主的周年庆典",
    CHARACTER_NAME: "桃汽水",
    CHARACTER_TITLE: "精灵公主",
    SITE_VERSION: "1.0.0",
    LAST_UPDATE: "2025-12-10",
    
    // ========== 时间配置 ==========
    // 重要：请根据您的周年庆时间修改以下日期
    EVENT_DATE: "2025-12-25T19:00:00",         // 周年庆直播开始时间
    COUNTDOWN_END_DATE: "2025-12-25T19:00:00", // 倒计时结束时间（与EVENT_DATE相同）
    SITE_LAUNCH_DATE: "2025-12-10T00:00:00",   // 网站发布时间（提前2周）
    EVENT_END_DATE: "2025-12-31T23:59:59",     // 活动结束时间
    
    // ========== 颜色主题 ==========
    COLORS: {
        // 主色系 - 粉色少女风
        PRIMARY: "#FF9AC8",      // 主粉色
        SECONDARY: "#FFC8E8",    // 次粉色
        ACCENT: "#FF6BAC",       // 强调粉色
        SUCCESS: "#A8E6CF",      // 成功色（薄荷绿）
        WARNING: "#FFD3B6",      // 警告色（珊瑚橙）
        INFO: "#74B9FF",         // 信息色（天空蓝）
        DARK: "#6A457F",         // 深紫色
        LIGHT: "#FFF0F5",        // 淡粉色
        LIGHTER: "#FFF8FB",      // 更淡粉色
        
        // 渐变
        GRADIENT_PRIMARY: "linear-gradient(135deg, #FF9AC8 0%, #FF6BAC 100%)",
        GRADIENT_SECONDARY: "linear-gradient(135deg, #FFC8E8 0%, #A8E6CF 100%)",
        GRADIENT_LIGHT: "linear-gradient(135deg, #FFF0F5 0%, #FFFFFF 100%)",
        GRADIENT_DARK: "linear-gradient(135deg, #6A457F 0%, #4A2F5D 100%)",
        
        // 转盘颜色（对应6个奖品区域）
        WHEEL_COLORS: ["#FF9AC8", "#FFC8E8", "#A8E6CF", "#FFD3B6", "#6A457F", "#FF6BAC"]
    },
    
    // ========== 游戏配置 ==========
    GAMES: {
        // 通用游戏设置
        GENERAL: {
            POINTS_PER_ACTION: 10,     // 每次成功操作获得的魔力值
            DIFFICULTY_INTERVAL: 600,  // 难度增加间隔（毫秒）600ms=0.6秒
            DIFFICULTY_INCREMENT: 0.1,  // 每次难度增加量（百分比）
            MAX_DIFFICULTY: 10.0,      // 最大难度倍数
            DIFFICULTY_START_DELAY: 30000, // 游戏开始后多久开始增加难度（毫秒）30秒后开始
        },
        
        // 游戏1：气泡捕捉术
        BUBBLE_GAME: {
            ID: "bubble-game",
            NAME: "气泡捕捉术",
            DESCRIPTION: "点击屏幕上飘过的桃色气泡，每捕捉一个获得10点魔力",
            ICON: "fa-cloud",
            
            // 初始参数
            INITIAL_BUBBLE_COUNT: 3,        // 初始气泡数量
            INITIAL_BUBBLE_SPEED: 2,        // 初始气泡速度（像素/帧）
            INITIAL_SPAWN_INTERVAL: 1500,   // 初始生成间隔（毫秒）
            BUBBLE_LIFETIME: 8000,          // 气泡生命周期（毫秒）
            
            // 难度增长参数（每经过DIFFICULTY_INTERVAL时间后的变化）
            BUBBLE_COUNT_INCREMENT: 0.1,    // 气泡数量增加量
            BUBBLE_SPEED_INCREMENT: 0.15,   // 气泡速度增加量
            SPAWN_INTERVAL_DECREMENT: 50,   // 生成间隔减少量（毫秒）
            MIN_SPAWN_INTERVAL: 300,        // 最小生成间隔（毫秒）
        },
        
        // 游戏2：记忆符文阵
        MEMORY_GAME: {
            ID: "memory-game",
            NAME: "记忆符文阵",
            DESCRIPTION: "记住魔法符文的位置并完成配对，每次成功配对获得50点魔力",
            ICON: "fa-clone",
            
            // 初始参数
            INITIAL_GRID_SIZE: 4,           // 初始网格大小（4x4）
            INITIAL_SHOW_TIME: 3000,        // 初始显示时间（毫秒）
            INITIAL_PAIRS: 8,               // 初始配对数量
            
            // 难度增长参数
            GRID_SIZE_INCREMENT_INTERVAL: 120000, // 网格增加间隔（毫秒）2分钟
            SHOW_TIME_DECREMENT: 100,       // 显示时间减少量（毫秒）
            MIN_SHOW_TIME: 1000,            // 最小显示时间（毫秒）
            MAX_GRID_SIZE: 8,               // 最大网格大小（8x8）
        },
        
        // 游戏3：快速咏唱测试
        REACTION_GAME: {
            ID: "reaction-game",
            NAME: "快速咏唱测试",
            DESCRIPTION: "快速按下屏幕上出现的咒语对应按键，每次成功获得20点魔力",
            ICON: "fa-keyboard",
            
            // 初始参数
            INITIAL_SHOW_TIME: 2000,        // 初始显示时间（毫秒）
            INITIAL_NEXT_DELAY: 1500,       // 初始下一个出现延迟（毫秒）
            INITIAL_WORD_COUNT: 1,          // 初始同时显示单词数量
            
            // 难度增长参数
            SHOW_TIME_DECREMENT: 80,        // 显示时间减少量（毫秒）
            NEXT_DELAY_DECREMENT: 60,       // 下一个延迟减少量（毫秒）
            MIN_SHOW_TIME: 400,             // 最小显示时间（毫秒）
            MIN_NEXT_DELAY: 300,            // 最小下一个延迟（毫秒）
            WORD_COUNT_INCREMENT_INTERVAL: 180000, // 单词数量增加间隔（毫秒）3分钟
            MAX_WORD_COUNT: 4,              // 最大同时显示单词数量
            
            // 咒语词汇表
            WORDS: ["可爱", "调皮", "魔法", "精灵", "公主", "契约", "魔力", "气泡", 
                   "桃色", "汽水", "闪耀", "梦幻", "快乐", "永恒", "星星", "月光"]
        }
    },
    
    // ========== 转盘配置 ==========
    WHEEL: {
        SPIN_COST: 500,                     // 每次抽奖消耗的魔力值
        PRIZES: [
            { 
                NAME: "公主的语音祝福", 
                PROBABILITY: 5,             // 概率百分比
                COLOR: "#FF9AC8",
                DESCRIPTION: "桃汽水公主的专属语音祝福"
            },
            { 
                NAME: "限定数字徽章", 
                PROBABILITY: 15,
                COLOR: "#FFC8E8",
                DESCRIPTION: "周年庆限定数字徽章"
            },
            { 
                NAME: "舰长续费红包", 
                PROBABILITY: 10,
                COLOR: "#A8E6CF",
                DESCRIPTION: "B站舰长续费红包"
            },
            { 
                NAME: "实体周边", 
                PROBABILITY: 2,
                COLOR: "#FFD3B6",
                DESCRIPTION: "桃汽水实体周边礼品"
            },
            { 
                NAME: "魔力翻倍卡", 
                PROBABILITY: 50,
                COLOR: "#6A457F",
                DESCRIPTION: "1小时内游戏获得魔力翻倍"
            },
            { 
                NAME: "亲笔签名照", 
                PROBABILITY: 3,
                COLOR: "#FF6BAC",
                DESCRIPTION: "桃汽水亲笔签名照片"
            },
            { 
                NAME: "谢谢参与", 
                PROBABILITY: 15,
                COLOR: "#E9ECEF",
                DESCRIPTION: "感谢参与，下次好运"
            }
        ],
        
        // 转盘动画设置
        ANIMATION: {
            DURATION: 3000,                 // 旋转动画持续时间（毫秒）
            EASING: "cubic-bezier(0.17, 0.67, 0.21, 0.99)", // 缓动函数
            SPINS: 5                        // 基础旋转圈数
        }
    },
    
    // ========== 排行榜配置 ==========
    RANKING: {
        UPDATE_INTERVAL: 30000,             // 排行榜更新间隔（毫秒）
        TOP_N: 10,                          // 显示前N名
        ITEMS_PER_PAGE: 20,                 // 每页显示数量
        
        // 奖励配置
        REWARDS: {
            DAILY_TOP_10: true,             // 每日前10名有奖励
            REWARD_LIST: [
                "第1名：公主的1对1语音祝福 + 限定徽章",
                "第2-3名：公主的语音祝福 + 限定徽章",
                "第4-10名：限定徽章"
            ]
        }
    },
    
    // ========== 留言板配置 ==========
    MESSAGES: {
        ENABLED: true,                      // 是否启用留言板
        MAX_MESSAGES_DISPLAY: 50,           // 最大显示留言数
        MAX_LENGTH: 140,                    // 每条留言最大长度
        REQUIRE_APPROVAL: false,            // 是否需要审核
        MESSAGES_PER_PAGE: 10,              // 每页显示留言数
        
        // 默认留言（当没有留言时显示）
        DEFAULT_MESSAGES: [
            {
                id: 1,
                user: "桃汽水头号粉丝",
                content: "公主殿下周年快乐！期待今晚的直播！",
                timestamp: "2025-12-10T10:30:00",
                likes: 24
            },
            {
                id: 2,
                user: "气泡捕捉大师",
                content: "已经攒了1000魔力了，我要抽大奖！",
                timestamp: "2025-12-10T11:15:00",
                likes: 18
            },
            {
                id: 3,
                user: "魔法阵研究员",
                content: "记忆符文阵的游戏真好玩，已经玩了10遍了！",
                timestamp: "2025-12-10T12:45:00",
                likes: 15
            },
            {
                id: 4,
                user: "次元旅行者",
                content: "从异世界赶来支持公主！希望网站能一直保留！",
                timestamp: "2025-12-10T14:20:00",
                likes: 32
            },
            {
                id: 5,
                user: "精灵契约者",
                content: "桃汽水公主最可爱了！希望每年都有周年庆！",
                timestamp: "2025-12-10T15:30:00",
                likes: 28
            }
        ]
    },
    
    // ========== 社交链接配置 ==========
    SOCIAL_LINKS: {
        // 请将以下链接替换为您自己的社交账号链接
        BILIBILI: "https://space.bilibili.com/您的UID",
        WEIBO: "https://weibo.com/您的微博",
        TWITTER: "https://twitter.com/您的推特",
        YOUTUBE: "https://youtube.com/您的频道",
        TWITCH: "https://twitch.tv/您的频道"
    },
    
    // ========== 文本内容配置 ==========
    TEXTS: {
        // 首页欢迎语
        WELCOME_TITLE: "欢迎来到桃汽水的魔力补给站",
        WELCOME_SUBTITLE: "来自异世界的精灵公主需要你的帮助！通过收集魔力，帮助公主维持次元裂缝，并有机会获得公主的特别礼物！",
        
        // 状态提示
        STATUS_BEFORE_EVENT: "🎉 周年庆倒计时中，网站已开放魔力收集！",
        STATUS_DURING_EVENT: "🎊 周年庆直播正在进行中！魔力双倍！",
        STATUS_AFTER_EVENT: "✨ 周年庆已结束，感谢大家的参与！",
        
        // 公告内容
        ANNOUNCEMENTS: [
            "契约者们~欢迎来到我的魔力补给站！",
            "周年庆直播将在 {eventDate} 开始，记得来哦！",
            "收集魔力最多的前十名，本公主会有特别奖励！",
            "小游戏没有时间限制，但难度会越来越高哦~",
            "坚持10分钟以上的都是真正的魔法大师！"
        ],
        
        // 游戏提示
        GAME_TIPS: [
            "游戏难度会随时间逐渐增加",
            "没有时间限制，但10分钟后会变得非常困难",
            "每次成功操作都会获得魔力",
            "魔力可以用来抽取公主的礼物",
            "挑战自己的极限吧！"
        ],
        
        // 倒计时消息
        COUNTDOWN_MESSAGES: {
            MORE_THAN_WEEK: "距离桃汽水公主的周年庆还有",
            LESS_THAN_DAY: "周年庆即将开始，准备好迎接惊喜了吗？",
            LESS_THAN_HOUR: "周年庆马上开始，最后准备！",
            STARTED: "周年庆直播已开始！快来吧~",
            ENDED: "周年庆已结束，感谢参与！"
        }
    },
    
    // ========== 功能开关 ==========
    FEATURES: {
        COUNTDOWN: true,                    // 倒计时功能
        GAMES: true,                        // 游戏功能
        WHEEL: true,                        // 转盘功能
        RANKING: true,                      // 排行榜功能
        MESSAGES: true,                     // 留言板功能
        SOCIAL_LINKS: true,                 // 社交链接
        AUTO_DIFFICULTY: true               // 自动增加难度
    },
    
    // ========== 开发配置 ==========
    DEBUG: true,                            // 调试模式
    USE_SAMPLE_DATA: true,                  // 使用示例数据
    
    // ========== 本地存储键名 ==========
    STORAGE_KEYS: {
        USER_NAME: "taoci_username",
        USER_POINTS: "taoci_user_points",
        USER_GAMES_PLAYED: "taoci_games_played",
        USER_WHEEL_SPINS: "taoci_wheel_spins",
        USER_MESSAGES: "taoci_user_messages",
        LAST_VISIT: "taoci_last_visit",
        TOTAL_POINTS: "taoci_total_points",
        GAME_HIGH_SCORES: "taoci_game_high_scores"
    },
    
    // ========== API配置（如果有后端） ==========
    API: {
        // 如果后续添加后端，可以在这里配置API端点
        BASE_URL: "",
        ENDPOINTS: {
            SUBMIT_SCORE: "/api/submit-score",
            GET_RANKING: "/api/ranking",
            SUBMIT_MESSAGE: "/api/message",
            GET_MESSAGES: "/api/messages"
        }
    }
};

// 导出配置
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
} else {
    // 浏览器环境
    window.CONFIG = CONFIG;
    
    // 添加一些辅助函数到CONFIG对象
    CONFIG.getFormattedEventDate = function() {
        const eventDate = new Date(CONFIG.EVENT_DATE);
        const options = { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        return eventDate.toLocaleDateString('zh-CN', options);
    };
    
    CONFIG.getEventStatus = function() {
        const now = new Date();
        const eventDate = new Date(CONFIG.EVENT_DATE);
        const eventEndDate = new Date(CONFIG.EVENT_END_DATE);
        
        if (now < eventDate) {
            return "before";
        } else if (now >= eventDate && now <= eventEndDate) {
            return "during";
        } else {
            return "after";
        }
    };
    
    CONFIG.getDaysSinceLaunch = function() {
        const launchDate = new Date(CONFIG.SITE_LAUNCH_DATE);
        const now = new Date();
        const diffTime = Math.abs(now - launchDate);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };
    
    CONFIG.getCountdownMessage = function(distance) {
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        
        if (days > 7) {
            return CONFIG.TEXTS.COUNTDOWN_MESSAGES.MORE_THAN_WEEK;
        } else if (days >= 1) {
            return CONFIG.TEXTS.COUNTDOWN_MESSAGES.LESS_THAN_DAY;
        } else if (distance < 24 * 60 * 60 * 1000) {
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            if (hours >= 1) {
                return CONFIG.TEXTS.COUNTDOWN_MESSAGES.LESS_THAN_DAY;
            } else {
                return CONFIG.TEXTS.COUNTDOWN_MESSAGES.LESS_THAN_HOUR;
            }
        }
        return CONFIG.TEXTS.COUNTDOWN_MESSAGES.MORE_THAN_WEEK;
    };
    
    // 游戏难度计算函数
    CONFIG.calculateGameDifficulty = function(gameType, timePlayed) {
        // timePlayed单位：毫秒
        const general = CONFIG.GAMES.GENERAL;
        
        // 计算基础难度倍数
        let difficulty = 1.0;
        
        if (timePlayed > general.DIFFICULTY_START_DELAY) {
            const effectiveTime = timePlayed - general.DIFFICULTY_START_DELAY;
            const intervals = Math.floor(effectiveTime / general.DIFFICULTY_INTERVAL);
            difficulty = 1.0 + (intervals * general.DIFFICULTY_INCREMENT);
        }
        
        // 限制最大难度
        difficulty = Math.min(difficulty, general.MAX_DIFFICULTY);
        
        return difficulty;
    };
    
    // 获取游戏具体参数
    CONFIG.getGameParams = function(gameType, timePlayed) {
        const difficulty = CONFIG.calculateGameDifficulty(gameType, timePlayed);
        const gameConfig = CONFIG.GAMES[gameType];
        
        if (!gameConfig) return null;
        
        // 根据游戏类型返回计算后的参数
        switch(gameType) {
            case 'BUBBLE_GAME':
                return {
                    bubbleCount: Math.floor(gameConfig.INITIAL_BUBBLE_COUNT * difficulty),
                    bubbleSpeed: gameConfig.INITIAL_BUBBLE_SPEED * difficulty,
                    spawnInterval: Math.max(
                        gameConfig.MIN_SPAWN_INTERVAL,
                        gameConfig.INITIAL_SPAWN_INTERVAL - (difficulty * gameConfig.SPAWN_INTERVAL_DECREMENT)
                    )
                };
                
            case 'MEMORY_GAME':
                // 记忆游戏难度增长较慢
                const slowDifficulty = 1.0 + ((difficulty - 1.0) * 0.5);
                const gridSizeIncrease = Math.floor((timePlayed - CONFIG.GAMES.GENERAL.DIFFICULTY_START_DELAY) / 
                                                   gameConfig.GRID_SIZE_INCREMENT_INTERVAL);
                
                return {
                    gridSize: Math.min(
                        gameConfig.MAX_GRID_SIZE,
                        gameConfig.INITIAL_GRID_SIZE + gridSizeIncrease
                    ),
                    showTime: Math.max(
                        gameConfig.MIN_SHOW_TIME,
                        gameConfig.INITIAL_SHOW_TIME - (slowDifficulty * gameConfig.SHOW_TIME_DECREMENT)
                    ),
                    pairs: gameConfig.INITIAL_PAIRS + gridSizeIncrease * 2
                };
                
            case 'REACTION_GAME':
                // 反应游戏难度适中
                const mediumDifficulty = 1.0 + ((difficulty - 1.0) * 0.7);
                const wordCountIncrease = Math.floor((timePlayed - CONFIG.GAMES.GENERAL.DIFFICULTY_START_DELAY) / 
                                                    gameConfig.WORD_COUNT_INCREMENT_INTERVAL);
                
                return {
                    showTime: Math.max(
                        gameConfig.MIN_SHOW_TIME,
                        gameConfig.INITIAL_SHOW_TIME - (mediumDifficulty * gameConfig.SHOW_TIME_DECREMENT)
                    ),
                    nextDelay: Math.max(
                        gameConfig.MIN_NEXT_DELAY,
                        gameConfig.INITIAL_NEXT_DELAY - (mediumDifficulty * gameConfig.NEXT_DELAY_DECREMENT)
                    ),
                    wordCount: Math.min(
                        gameConfig.MAX_WORD_COUNT,
                        gameConfig.INITIAL_WORD_COUNT + wordCountIncrease
                    )
                };
                
            default:
                return null;
        }
    };
    
    // 格式化时间显示
    CONFIG.formatTime = function(milliseconds) {
        const totalSeconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };
    
    // 获取当前活动状态文本
    CONFIG.getStatusText = function() {
        const status = CONFIG.getEventStatus();
        switch(status) {
            case 'before': return CONFIG.TEXTS.STATUS_BEFORE_EVENT;
            case 'during': return CONFIG.TEXTS.STATUS_DURING_EVENT;
            case 'after': return CONFIG.TEXTS.STATUS_AFTER_EVENT;
            default: return CONFIG.TEXTS.STATUS_BEFORE_EVENT;
        }
    };
}

// 控制台提示
console.log(`
🎀 桃汽水の魔力补给站 配置文件已加载
✨ 版本: ${CONFIG.SITE_VERSION}
📅 周年庆: ${CONFIG.getFormattedEventDate()}
🎮 游戏难度: 随时间递增，10分钟后非常困难
🐛 调试模式: ${CONFIG.DEBUG ? '开启' : '关闭'}
`);