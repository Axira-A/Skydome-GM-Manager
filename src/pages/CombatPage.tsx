import { useState } from 'react';
import { Skull, Plus } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import clsx from 'clsx';
import { useGameStore } from '../store/gameStore';
import type { Character, Enemy, Attribute } from '../types/game';
import { translations } from '../i18n/translations';

export default function CombatPage() {
  const { characters, updateCharacter, configs, addLog, language } = useGameStore();
  const t = translations[language || 'en'];
  const [activeEnemies, setActiveEnemies] = useState<Enemy[]>([]);
  
  // Combat Calculator State
  const [attackerId, setAttackerId] = useState<string>('');
  const [targetId, setTargetId] = useState<string>('');
  const [selectedSkillId, setSelectedSkillId] = useState<string>('');
  const [combatLog, setCombatLog] = useState<string[]>([]);
  const [lastResult, setLastResult] = useState<{damage: number, erosion: number, armorBroken?: boolean, targetId?: string, skillId?: string} | null>(null);

  // Helper to find entity (Char or Enemy)
  const getEntity = (id: string) => {
    const char = characters.find(c => c.id === id);
    if (char) return { ...char, kind: 'Character' as const };
    const enemy = activeEnemies.find(e => e.id === id);
    if (enemy) return { ...enemy, kind: 'Enemy' as const };
    return null;
  };

  const attrMap: Record<string, string> = {
    'Sever': '切断', 'Stable': '稳定', 'Flux': '变化', 'Precision': '精准'
  };

  const addEnemy = (enemyTemplate: Enemy) => {
    setActiveEnemies([...activeEnemies, { ...enemyTemplate, id: uuidv4() }]);
    addLog('Combat', `Enemy spawned: ${enemyTemplate.name}`);
  };

  // Helper to calculate derived stats
  const getDerivedStats = (char: Character) => {
    // Equipment Stats
    const armor = char.equipment.armor;
    const acCore = char.equipment.acCore;
    const acStats = acCore?.stats?.modifiers || {};
    
    // Base + Modifiers
    const phy = char.baseStats.PHY + (acStats.PHY || 0);
    const agi = char.baseStats.AGI + (acStats.AGI || 0);
    const mnd = char.baseStats.MND + (acStats.MND || 0);
    const syn = char.baseStats.SYN + (acStats.SYN || 0);
    
    // AV & SR
    let av = armor?.stats?.defense || 0;
    let sr = armor?.stats?.shielding || 0;
    
    // Apply Status Effects (Simple Implementation)
    char.activeStatusEffects.forEach(status => {
       const template = configs.statusEffects.find(s => s.id === status.effectId);
       if (template && template.modifiers) {
          if (template.modifiers.PHY) av += 0; // Or whatever logic, currently status mods are base stats mostly
          // We need status effects to modify AV/SR directly? Or just base stats?
          // The type StatusEffect.modifiers is Partial<Stats>. So it modifies stats.
          // Let's apply stat modifiers to PHY/AGI used for dice pool
       }
    });

    // Re-calculate derived with status effects
    // Note: This is getting complex to do inline. Ideally Character object should have a helper.
    // For now, let's just stick to equipment for AV/SR unless status specifically adds AV (not in Stats type yet).
    
    const loadMax = 5 + phy * 2;
    const currentLoad = char.inventory.reduce((acc, item) => acc + item.weight, 0);
    const isOverloaded = currentLoad > loadMax;
    
    // Dice pool penalty if overloaded
    const agilityPenalty = isOverloaded ? -1 : 0;
    
    return { av, sr, isOverloaded, agilityPenalty, phy, agi, mnd, syn };
  };

  const handleAttack = () => {
    const attacker = getEntity(attackerId);
    const target = getEntity(targetId);
    if (!attacker || !target) return;

    // 1. Determine Attributes and Stats
    let atkAttr: Attribute = 'Sever'; 
    let defAttr: Attribute = 'Sever';
    let atkDicePool = 0;
    let defAV = 0;
    let baseDmg = 0;
    let radiationIn = 0; // Radiation coming from attacker
    let sr = 0; // Shielding Rate of defender
    let armorPenetration = 0; // Flat AV reduction

    // Attacker Stats
    if (attacker.kind === 'Character') {
      const c = attacker as Character;
      const { agilityPenalty, phy, agi, syn } = getDerivedStats(c); // Added mnd/syn for skill scaling if needed
      
      // Skill Check
      let skill = null;
      if (selectedSkillId) {
          skill = configs.skills.find(s => s.id === selectedSkillId);
      }

      if (skill) {
          // Parse Formula if Damage type
          if (skill.type === 'Damage' && skill.formula) {
              // Simple parser: "1d10 + SYN"
              // Supported vars: PHY, AGI, MND, SYN
              // This is very basic.
              const parts = skill.formula.split('+').map(p => p.trim());
              let flat = 0;
              
              parts.forEach(p => {
                  if (p.includes('d')) {
                      // XdY
                      // const [count, sides] = p.split('d').map(n => parseInt(n));
                      // We don't roll here for baseDmg usually, but system uses Dice Pool.
                      // If formula is "1d10 + SYN", does it mean Roll 1d10 + SYN damage?
                      // OR does it mean ATK Dice Pool is based on formula?
                      // Standard rule: Check = Attribute. Damage = Base + Hits.
                      // Let's assume Skill Formula defines BASE DAMAGE or Dice Pool override.
                      // Let's assume it overrides Base Damage.
                      // Actually, for consistency, let's treat formula as:
                      // "X d Y" -> Adds X to dice pool? No.
                      // Let's assume formula calculates Base Damage.
                      // And we use SYN or relevant stat for Dice Pool?
                      // "Damage skills use specific stats".
                      // For now, let's just stick to weapon attack if no formula, 
                      // If formula exists, we try to parse it into Base Damage.
                      // But we also need Dice Pool.
                      // Let's use SYN for Skill Dice Pool by default if not specified.
                      atkDicePool = syn; // Default for skills?
                  } else {
                      if (['PHY','AGI','MND','SYN'].includes(p)) {
                          const val = (c.baseStats as any)[p] || 0;
                          flat += val;
                          if (p === 'SYN') atkDicePool = Math.max(atkDicePool, syn); // If SYN in formula, use SYN for pool?
                          if (p === 'PHY') atkDicePool = Math.max(atkDicePool, phy);
                      } else {
                          flat += parseInt(p) || 0;
                      }
                  }
              });
              baseDmg = flat;
              // If no dice pool set from stats, default to SYN
              if (atkDicePool === 0) atkDicePool = syn;
          } else if (skill.type === 'Effect') {
              // Effect skills might just auto-hit or use SYN
              atkDicePool = syn;
              baseDmg = 0;
          }
          
          // Cost
          if (skill.cost) {
              // Apply cost immediately? Or wait for result?
              // Let's log it.
          }
      } else {
          // Standard Weapon Attack
          const weapon = c.equipment.weapon;
          const category = weapon?.stats?.weaponCategory;
          const acCore = c.equipment.acCore;

          atkAttr = weapon?.stats?.attribute || acCore?.stats?.attribute || 'Sever'; 
          atkDicePool = Math.max(1, phy + agi + agilityPenalty); 
          baseDmg = phy + (weapon?.stats?.damage || 0);

          if (category === 'HeavyImpact') armorPenetration = 2;
          if (category === 'LightBlade') atkDicePool += 1;
      }

    } else {
      const e = attacker as Enemy;
      atkAttr = e.attribute;
      atkDicePool = e.stats.attack; 
      baseDmg = e.stats.attack;
      radiationIn = e.stats.radiation || 0;
      
      // Enemy Skills (Simple impl: if enemy has skills, maybe random use? For now just basic attack)
    }

    // Defender Stats
    if (target.kind === 'Character') {
      const c = target as Character;
      const derived = getDerivedStats(c);
      // AC Attribute comes from AC Core now
      const acCore = c.equipment.acCore;
      defAttr = acCore?.stats?.attribute || 'Sever'; // Default
      defAV = derived.av;
      sr = derived.sr;
    } else {
      const e = target as Enemy;
      defAttr = e.attribute;
      defAV = e.stats.av;
    }

    // Apply Armor Penetration
    let effectiveAV = Math.max(0, defAV - armorPenetration);

    // 2. Attribute Advantage
    // Sever -> Stable -> Flux -> Precision -> Sever
    const advantageMap: Record<Attribute, Attribute> = {
      'Sever': 'Stable',
      'Stable': 'Flux',
      'Flux': 'Precision',
      'Precision': 'Sever'
    };

    let multiplier = 1.0;
    let advantageMsg = '无修正';
    if (advantageMap[atkAttr] === defAttr) {
      multiplier = 1.5;
      advantageMsg = '克制 (x1.5)';
    } else if (advantageMap[defAttr] === atkAttr) {
      multiplier = 0.5;
      advantageMsg = '被克制 (x0.5)';
    }

    // 2.1 Critical Erosion (Attacker)
    // Rule: If Erosion > 50%, Damage dealt +0.2 mult
    if (attacker.kind === 'Character') {
      const c = attacker as Character;
      if (c.erosion > 50) {
        multiplier += 0.2;
        advantageMsg += ' + 狂暴(>50% 侵蚀)';
      }
    }

    // 3. Roll
    const rolls = Array.from({ length: atkDicePool }, () => Math.floor(Math.random() * 10) + 1);
    const successes = rolls.filter(r => r >= 6).length;
    const isCrit = rolls.filter(r => r === 10).length >= 2;

    // 4. Damage Calculation
    let damage = 0;
    let armorBroken = false;
    
    if (successes > 0) {
      // Rule: Damage calculation isn't explicitly "Base + Hits", but implied "Attack Dice Pool" vs Difficulty.
      // Let's stick to the previous interpretation: Base + Hits, but refined.
      let rawDmg = (baseDmg + successes) * multiplier; 
      if (isCrit) rawDmg *= 2;
      
      // Rule: Armor Break - If raw damage > 3 * AV, ignore AV and reduce AV permanently
      // Use effectiveAV for damage calc, but defAV for break threshold?
      // "If raw damage > 3 * AV" usually refers to the base armor value.
      if (defAV > 0 && rawDmg > 3 * defAV) {
        armorBroken = true;
        damage = Math.floor(rawDmg); // Ignore AV completely
      } else {
        damage = Math.max(1, Math.floor(rawDmg - effectiveAV));
      }
    }

    // 5. Erosion Calculation (If target is character)
    let erosionDamage = 0;
    if (target.kind === 'Character') {
      const c = target as Character;
      const srFactor = Math.min(1, Math.max(0, sr / 100));
      erosionDamage = Math.floor(radiationIn * (1 - srFactor));
      if (c.erosion > 50) {
        erosionDamage *= 2;
      }
    }

    // 6. Skill Cost & Effect Application
    let skillEffectMsg = '';
    // let statusApplied = false;
    
    if (attacker.kind === 'Character' && selectedSkillId) {
        const skill = configs.skills.find(s => s.id === selectedSkillId);
        if (skill) {
            // Apply Status Effect
            if (skill.type === 'Effect' || (skill.type === 'Damage' && skill.statusEffectId)) {
                if (skill.statusEffectId) {
                    // We need to apply this in applyResult, but let's record it in lastResult
                    // statusApplied = true;
                    skillEffectMsg = `\n    效果: 尝试施加异常状态`;
                }
            }
            
            // Cost (Erosion)
            if (skill.cost) {
                // Apply cost to attacker immediately or in result?
                // Better in result.
            }
        }
    }

    const log = `[${attacker.name}] ${selectedSkillId ? `使用技能 [${configs.skills.find(s=>s.id===selectedSkillId)?.name}]` : '攻击'} [${target.name}]
    属性: ${attrMap[atkAttr] || atkAttr} vs ${attrMap[defAttr] || defAttr} (${advantageMsg})
    掷骰 (${atkDicePool}d10): [${rolls.join(', ')}] -> ${successes} 成功 ${isCrit ? '致命!' : ''}
    伤害: (${baseDmg} 基础 + ${successes} 命中) * ${multiplier.toFixed(1)} = ${((baseDmg + successes) * multiplier).toFixed(1)} 原始
    防御: ${armorBroken ? `护甲破碎! (无视 ${defAV} AV)` : `${effectiveAV} AV (原始 ${defAV} - ${armorPenetration} 穿透)`}
    结果: ${damage} HP 伤害${skillEffectMsg}
    ${target.kind === 'Character' ? `侵蚀: ${radiationIn} 辐射 * (1 - ${sr}%) ${((target as Character).erosion > 50) ? '* 2 (致命)' : ''} = ${erosionDamage} 侵蚀` : ''}`;
    
    setCombatLog([log, ...combatLog]);
    setLastResult({ 
        damage, 
        erosion: erosionDamage, 
        armorBroken, 
        targetId: target.id, 
        skillId: selectedSkillId // Pass skill ID to apply effects/costs
    });
    addLog('Combat', `${attacker.name} 对 ${target.name} 造成了 ${damage} 点伤害`);
  };

  const applyResult = () => {
    if (!lastResult || !targetId) return;
    const target = getEntity(targetId);
    const attacker = getEntity(attackerId);
    if (!target || !attacker) return;

    // Apply Skill Costs (Attacker)
    if (attacker.kind === 'Character' && lastResult.skillId) {
        const skill = configs.skills.find(s => s.id === lastResult.skillId);
        if (skill && skill.cost) {
            const newEro = Math.min(100, (attacker as Character).erosion + skill.cost);
            updateCharacter(attacker.id, { erosion: newEro });
            addLog('Combat', `${attacker.name} 承受了 ${skill.cost} 点侵蚀代价`);
        }
    }

    // Apply Status Effects (Target)
    if (target.kind === 'Character' && lastResult.skillId) {
         const skill = configs.skills.find(s => s.id === lastResult.skillId);
         if (skill && skill.statusEffectId) {
             const effect = configs.statusEffects.find(e => e.id === skill.statusEffectId);
             if (effect) {
                 const currentEffects = (target as Character).activeStatusEffects || [];
                 // Check if already exists
                 const existing = currentEffects.find(e => e.effectId === effect.id);
                 let newEffects = [...currentEffects];
                 
                 if (existing) {
                     if (existing.stacks < effect.maxStacks) {
                         newEffects = newEffects.map(e => e.effectId === effect.id ? { ...e, stacks: e.stacks + 1, durationLeft: effect.duration } : e);
                     } else {
                         newEffects = newEffects.map(e => e.effectId === effect.id ? { ...e, durationLeft: effect.duration } : e); // Refresh duration
                     }
                 } else {
                     newEffects.push({ effectId: effect.id, stacks: 1, durationLeft: effect.duration });
                 }
                 updateCharacter(target.id, { activeStatusEffects: newEffects });
                 addLog('Combat', `${target.name} 被施加了状态: ${effect.name}`);
             }
         }
    }

    if (target.kind === 'Character') {
      const c = target as Character;
      const newHp = Math.max(0, c.hp.current - lastResult.damage);
      const newErosion = Math.min(100, c.erosion + lastResult.erosion);
      
      // Apply AV reduction if armor broken
      let newBody = c.equipment.armor;
      if (lastResult.armorBroken && newBody && newBody.stats && newBody.stats.defense) {
         newBody = {
             ...newBody,
             stats: {
                 ...newBody.stats,
                 defense: Math.max(0, newBody.stats.defense - 1)
             }
         };
         addLog('Combat', `${c.name} 的护甲受损了!`);
      }

      updateCharacter(c.id, { 
        hp: { ...c.hp, current: newHp },
        erosion: newErosion,
        equipment: {
            ...c.equipment,
            armor: newBody
        }
      });
    } else {
      const e = target as Enemy;
      const newHp = e.stats.hp - lastResult.damage;
      let newAv = e.stats.av;
      
      if (lastResult.armorBroken) {
          newAv = Math.max(0, newAv - 1);
          addLog('Combat', `${e.name} 的护甲破碎了!`);
      }

      if (newHp <= 0) {
        setActiveEnemies(activeEnemies.filter(en => en.id !== e.id));
        addLog('Combat', `${e.name} 被击败了!`);
        // TODO: Move to loot
      } else {
        setActiveEnemies(activeEnemies.map(en => en.id === e.id ? { 
            ...en, 
            stats: { ...en.stats, hp: newHp, av: newAv } 
        } : en));
      }
    }
    setLastResult(null);
  };

  const [round, setRound] = useState(1);

  const nextRound = () => {
      setRound(r => r + 1);
      addLog('Combat', `--- Round ${round + 1} Started ---`);
      // Handle status effects duration/tick here if needed
      // For characters:
      // characters.forEach(c => {
          // Decrement duration, apply DoT
          // This logic is complex, requires updating char state.
          // For now just log.
      // });
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 h-[calc(100vh-100px)]">
      
      {/* Left: Characters */}
      <div className="bg-gray-800 p-4 rounded-lg overflow-y-auto border border-gray-700 flex flex-col">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-blue-400">{t.combat.divers}</h3>
            <div className="text-sm bg-gray-900 px-3 py-1 rounded border border-gray-600">Round {round}</div>
        </div>
        <div className="space-y-4">
          {characters.map(c => (
            <div 
              key={c.id} 
              onClick={() => !attackerId ? setAttackerId(c.id) : setTargetId(c.id)}
              className={clsx("p-4 rounded cursor-pointer border-2 transition", {
                'border-blue-500 bg-blue-900/20': attackerId === c.id,
                'border-red-500 bg-red-900/20': targetId === c.id,
                'border-gray-700 hover:border-gray-500': attackerId !== c.id && targetId !== c.id,
                'opacity-50': c.hp.current <= 0
              })}
            >
              <div className="flex justify-between font-bold">
                <span>{c.name}</span>
                <span className={c.hp.current < 5 ? "text-red-500" : "text-green-400"}>HP: {c.hp.current}/{c.hp.max}</span>
              </div>
              <div className="text-sm text-gray-400 flex gap-2 mt-1 flex-wrap">
                 <span>AC: {attrMap[c.equipment.acCore?.stats?.attribute || 'Sever'] || (c.equipment.acCore?.stats?.attribute || 'Sever')}</span>
                 <span className={clsx({ "text-purple-400": c.erosion <= 50, "text-red-500 font-bold animate-pulse": c.erosion > 50 })}>
                    Ero: {c.erosion}%
                 </span>
                 <span>AV: {c.equipment.armor?.stats?.defense || 0}</span>
                 <span>SR: {c.equipment.armor?.stats?.shielding || 0}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Middle: Battle Controls */}
      <div className="bg-gray-900 p-4 rounded-lg flex flex-col gap-4 border border-gray-700 overflow-hidden">
        <h3 className="text-xl font-bold text-center text-yellow-500">{t.combat.battleComputer}</h3>
        
        {/* Skill Selection UI */}
        {attackerId && getEntity(attackerId)?.kind === 'Character' && (
            <div className="flex flex-col gap-2">
                <label className="text-xs text-gray-400">选择技能 (Optional)</label>
                <select 
                    className="bg-gray-800 p-2 rounded text-sm border border-gray-600"
                    value={selectedSkillId}
                    onChange={e => setSelectedSkillId(e.target.value)}
                >
                    <option value="">-- 普通攻击 --</option>
                    {(getEntity(attackerId) as Character).learnedSkills.map(sid => {
                        const s = configs.skills.find(k => k.id === sid);
                        return s ? <option key={s.id} value={s.id}>{s.name} ({s.cost} ER)</option> : null;
                    })}
                </select>
            </div>
        )}

        <div className="flex-1 bg-black rounded p-4 font-mono text-sm text-green-500 overflow-y-auto whitespace-pre-wrap max-h-[60vh] scrollbar-thin scrollbar-thumb-gray-700">
          {combatLog.length === 0 ? t.combat.waitingForInput : combatLog.join('\n\n')}
        </div>

        {lastResult ? (
           <button onClick={applyResult} className="w-full bg-red-600 hover:bg-red-700 p-4 rounded font-bold text-lg animate-pulse">
             {t.combat.apply}: {lastResult.damage} DMG / {lastResult.erosion} ERO
           </button>
        ) : (
           <button onClick={handleAttack} disabled={!attackerId || !targetId} className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 p-4 rounded font-bold text-lg">
             {t.combat.calculateAttack}
           </button>
        )}
        
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
           <button onClick={() => {setAttackerId(''); setTargetId(''); setSelectedSkillId(''); setLastResult(null);}} className="col-span-1 bg-gray-800 p-2 rounded hover:bg-gray-700">{t.combat.clearSelection}</button>
           <button onClick={nextRound} className="col-span-1 bg-gray-800 p-2 rounded hover:bg-gray-700 border border-gray-600">Next Round</button>
        </div>
      </div>

      {/* Right: Enemies */}
      <div className="bg-gray-800 p-4 rounded-lg overflow-y-auto border border-gray-700 flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-red-400">{t.combat.hostiles}</h3>
          <div className="relative group">
            <button className="bg-red-900/50 px-3 py-1 rounded hover:bg-red-900 flex items-center gap-1"><Plus size={16} /> Add</button>
            <div className="absolute right-0 top-8 w-64 bg-gray-900 border border-gray-600 rounded shadow-xl hidden group-hover:block z-50 max-h-60 overflow-y-auto">
               {configs.customEnemies.length === 0 && <div className="p-2 text-gray-500 text-xs">{t.combat.noEnemies}</div>}
               {configs.customEnemies.map(e => (
                 <div key={e.id} onClick={() => addEnemy(e)} className="p-3 hover:bg-gray-800 cursor-pointer text-sm border-b border-gray-800">
                   <div className="font-bold">{e.name}</div>
                   <div className="text-xs text-gray-500">HP: {e.stats.hp} | ATK: {e.stats.attack}</div>
                 </div>
               ))}
            </div>
          </div>
        </div>

        <div className="space-y-4 flex-1">
          {activeEnemies.length === 0 && <div className="text-center text-gray-500 mt-10">{t.combat.sectorClear}</div>}
          {activeEnemies.map(e => (
            <div 
              key={e.id}
              onClick={() => !attackerId ? setAttackerId(e.id) : setTargetId(e.id)}
              className={clsx("p-4 rounded cursor-pointer border-2 transition relative", {
                'border-blue-500 bg-blue-900/20': attackerId === e.id,
                'border-red-500 bg-red-900/20': targetId === e.id,
                'border-gray-700 hover:border-gray-500': attackerId !== e.id && targetId !== e.id,
              })}
            >
              <div className="flex justify-between font-bold">
                <span>{e.name}</span>
                <span className="text-red-400">HP: {e.stats.hp}/{e.stats.maxHp}</span>
              </div>
              <div className="text-sm text-gray-400 flex gap-2 mt-1 flex-wrap">
                 <span>Attr: {attrMap[e.attribute] || e.attribute}</span>
                 <span>AV: {e.stats.av}</span>
                 <span>ATK: {e.stats.attack}</span>
                 <span>RAD: {e.stats.radiation || 0}</span>
              </div>
              <button 
                onClick={(ev) => { ev.stopPropagation(); setActiveEnemies(activeEnemies.filter(en => en.id !== e.id)); }}
                className="absolute top-2 right-2 text-gray-600 hover:text-red-500"
              >
                <Skull size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
