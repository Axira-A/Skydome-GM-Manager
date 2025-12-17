export type Language = 'en' | 'zh';

export const translations = {
  en: {
    nav: {
      overview: 'Overview',
      combat: 'Combat',
      exploration: 'Exploration',
      manager: 'Manager',
      eventLogs: 'Event Logs',
      title: 'SKY DOME',
      subtitle: 'GM SYSTEM v1.0'
    },
    overview: {
      title: 'Squad Overview',
      teamFunds: 'Team Funds (Calculated)',
      recruitDiver: 'Recruit Diver',
      newDiver: 'New Diver',
      cancel: 'Cancel',
      recruit: 'Recruit',
      sharedInventory: 'Shared Logistics Container',
      emptyContainer: 'Empty container...',
      emptyBackpack: 'Empty Backpack',
      slots: 'Slots',
      inventory: 'INVENTORY'
    },
    combat: {
      divers: 'Divers',
      hostiles: 'Hostiles',
      battleComputer: 'Battle Computer',
      waitingForInput: '> Waiting for input...',
      calculateAttack: 'CALCULATE ATTACK',
      apply: 'APPLY',
      clearSelection: 'Clear Selection',
      sectorClear: 'Sector Clear',
      noEnemies: 'No enemies in database',
      enemySpawned: 'Enemy spawned',
      defeated: 'was defeated!'
    },
    map: {
      shallows: 'Shallows',
      redForest: 'Red Forest',
      deepSky: 'Deep Sky',
      exploreNext: 'Explore Next Node',
      skillCheck: 'Skill Check',
      selectChar: '-- Choose Diver --',
      roll: 'Roll',
      hits: 'Hits',
      criticalSuccess: 'CRITICAL SUCCESS!',
      noActiveNode: 'No active node. Start exploration.',
      enterCombat: 'Enter Combat Mode'
    },
    manager: {
      title: 'Game Manager',
      exportSave: 'Export Save',
      importSave: 'Import Save',
      resetAll: 'Reset All',
      itemRegistry: 'Item Registry',
      enemyBestiary: 'Enemy Bestiary',
      skillRegistry: 'Skill Registry',
      statusRegistry: 'Status Effect Registry',
      itemName: 'Item Name',
      enemyName: 'Enemy Name',
      weight: 'Weight',
      value: 'Value',
      hp: 'HP',
      atk: 'ATK',
      craftingTitle: 'Alchemy of Edge (Crafting Simulator)',
      selectRecipe: 'Select Recipe',
      stableSynth: 'Stable Synthesis',
      erosionSynth: 'Erosion Synthesis (+10 Ero, Chance for Mutation)',
      synthesize: 'Synthesize',
      awaitingInput: '> Awaiting input...',
      awaitingInputDesc: '> Select a recipe and mode to begin simulation.',
      recipes: {
        inhibitor: 'Red Moss Inhibitor (Biomass + Spores)',
        converter: 'AC Attribute Converter (Rad Core + Part)',
        armor: 'Composite Armor (Alloy + 2x Skin)',
        battery: 'Overload Battery (2x Battery + Crystal)'
      }
    },
    logs: {
      title: 'Event Logs',
      noEvents: 'No events recorded yet.'
    },
    common: {
      hp: 'HP',
      erosion: 'Erosion',
      ac: 'AC',
      av: 'AV',
      phy: 'PHY',
      agi: 'AGI',
      mnd: 'MND',
      syn: 'SYN'
    }
  },
  zh: {
    nav: {
      overview: '总览',
      combat: '战斗',
      exploration: '探索',
      manager: '管理',
      eventLogs: '日志',
      title: '天穹之下',
      subtitle: 'GM 系统 v1.0'
    },
    overview: {
      title: '小队总览',
      teamFunds: '团队资金 (合计)',
      recruitDiver: '招募潜渊者',
      newDiver: '新潜渊者',
      cancel: '取消',
      recruit: '招募',
      sharedInventory: '公共资源箱',
      emptyContainer: '箱子是空的...',
      emptyBackpack: '空背包',
      slots: '格',
      inventory: '背包'
    },
    combat: {
      divers: '潜渊者',
      hostiles: '敌对目标',
      battleComputer: '战斗计算终端',
      waitingForInput: '> 等待指令...',
      calculateAttack: '计算攻击',
      apply: '应用结果',
      clearSelection: '清除选择',
      sectorClear: '区域安全',
      noEnemies: '数据库中无敌人数据',
      enemySpawned: '敌人生成',
      defeated: '被击败了！'
    },
    map: {
      shallows: '浅层',
      redForest: '红森林',
      deepSky: '深空',
      exploreNext: '探索下一个节点',
      skillCheck: '技能检定',
      selectChar: '-- 选择潜渊者 --',
      roll: '检定',
      hits: '成功数',
      criticalSuccess: '大成功！',
      noActiveNode: '当前无活跃节点。请开始探索。',
      enterCombat: '进入战斗模式'
    },
    manager: {
      title: '全局管理',
      exportSave: '导出存档',
      importSave: '导入存档',
      resetAll: '重置所有',
      itemRegistry: '物品注册表',
      enemyBestiary: '怪物图鉴',
      skillRegistry: '技能注册表',
      statusRegistry: '异常状态注册表',
      itemName: '物品名称',
      enemyName: '敌人名称',
      weight: '重量',
      value: '价值',
      hp: '生命值',
      atk: '攻击力',
      craftingTitle: '边缘炼金术 (合成模拟)',
      selectRecipe: '选择配方',
      stableSynth: '稳定合成',
      erosionSynth: '侵蚀合成 (+10 侵蚀, 变异概率)',
      synthesize: '开始合成',
      awaitingInput: '> 等待输入...',
      awaitingInputDesc: '> 选择配方和模式以开始模拟。',
      recipes: {
        inhibitor: '红苔抑制剂 (生物质 + 孢子)',
        converter: 'AC 属性转换器 (辐射核心 + 部件)',
        armor: '复合战甲 (合金 + 2x 皮膜)',
        battery: '过载电池 (2x 电池 + 晶体)'
      }
    },
    logs: {
      title: '事件日志',
      noEvents: '暂无记录。'
    },
    common: {
      hp: '生命',
      erosion: '侵蚀',
      ac: '锚点',
      av: '护甲',
      phy: '体魄',
      agi: '机动',
      mnd: '精神',
      syn: '同步'
    }
  }
};
