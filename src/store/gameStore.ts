import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { Character, GameState, Item, LogEntry, NodeContent, Recipe, Shop } from '../types/game';
import { Language } from '../i18n/translations';

interface GameActions {
  // Localization
  language: Language;
  setLanguage: (lang: Language) => void;

  // Character Management
  addCharacter: (character: Omit<Character, 'id'>) => void;
  removeCharacter: (id: string) => void;
  updateCharacter: (id: string, updates: Partial<Character>) => void;
  
  // Inventory
  addToSharedInventory: (item: Item) => void;
  addItemToShared: (items: Item[]) => void;
  removeFromSharedInventory: (itemId: string) => void;
  clearSharedInventory: () => void;
  transferToPersonal: (charId: string, itemId: string) => void;
  transferToShared: (charId: string, itemId: string) => void;
  equipItem: (charId: string, itemId: string, slot: 'weapon' | 'armor' | 'acCore', fromShared?: boolean) => void;
  unequipItem: (charId: string, slot: 'weapon' | 'armor' | 'acCore') => void;
  moveEquippedToShared: (charId: string, slot: 'weapon' | 'armor' | 'acCore') => void;
  
  // Recipe Management
  addRecipe: (recipe: Recipe) => void;
  removeRecipe: (id: string) => void;
  
  // Shop Management
  addShop: (name: string) => void;
  removeShop: (id: string) => void;
  updateShop: (id: string, updates: Partial<Shop>) => void;
  shopBuyItem: (shopId: string, itemId: string, buyerId: string) => void;
  shopSellItem: (shopId: string, payeeId: string, item: Item, fromShared: boolean, charId?: string) => void;
  shopSellAllShared: (shopId: string, payeeId: string) => void;

  // Logging
  addLog: (type: LogEntry['type'], content: string, relatedEntityId?: string) => void;
  
  // Config Management
  updateConfig: (updates: Partial<GameState['configs']>) => void;
  updateNodeRegistry: (nodes: NodeContent[]) => void;
  updateNodeWeights: (weights: Record<string, number>) => void; // Deprecated but kept for type compat if needed
  
  // Map/Exploration
  setCurrentLayer: (layer: GameState['currentLayer']) => void;
  
  // Full State Import/Export
  importState: (state: GameState) => void;
  resetState: () => void;
}

type Store = GameState & GameActions;

const initialState: GameState = {
  characters: [],
  sharedInventory: [],
  credits: 0,
  currentLayer: 'Shallows',
  explorationProgress: 0,
  totalNodesVisited: 0,
  shops: [],
  logs: [],
  language: 'zh', // Default language
  configs: {
    nodeWeights: {},
    nodeRegistry: [],
    enemyWeights: {},
    customItems: [],
    customEnemies: [],
    recipes: [],
    skills: [],
    statusEffects: []
  }
};

export const useGameStore = create<Store>()(
  persist(
    (set, get) => ({
      ...initialState,

      setLanguage: (lang) => set({ language: lang }),

      addCharacter: (charData) => set((state) => {
        if (state.characters.length >= 4) {
            get().addLog('System', 'Cannot add more than 4 characters.');
            return state;
        }
        const newChar: Character = { ...charData, id: uuidv4() };
        get().addLog('System', `Character created: ${newChar.name}`);
        return { characters: [...state.characters, newChar] };
      }),

      removeCharacter: (id) => set((state) => ({
        characters: state.characters.filter((c) => c.id !== id)
      })),

      addItemToShared: (items: Item[]) => set((state) => ({
          sharedInventory: [...state.sharedInventory, ...items]
      })),
      
      updateCharacter: (id, updates) => set((state) => ({
        characters: state.characters.map(c => 
          c.id === id ? { ...c, ...updates } : c
        )
      })),

      addToSharedInventory: (item) => set((state) => ({
        sharedInventory: [...state.sharedInventory, item]
      })),

      removeFromSharedInventory: (itemId) => set((state) => ({
        sharedInventory: state.sharedInventory.filter((i) => i.id !== itemId)
      })),

      clearSharedInventory: () => set({ sharedInventory: [] }),

      transferToPersonal: (charId, itemId) => set((state) => {
        const item = state.sharedInventory.find(i => i.id === itemId);
        if (!item) return state;
        
        const char = state.characters.find(c => c.id === charId);
        if (!char) return state;

        const maxLoad = 5 + char.baseStats.PHY * 2; // Should really be final stats, but store doesn't compute derived. For transfer check base is safer or update logic.
        // Actually the previous code used char.stats.PHY, now char structure changed to baseStats.
        // Let's assume PHY is base for weight limit or we need to compute full stats. 
        // For simplicity use baseStats for now or if equipped items provide stats.
        const currentLoad = char.inventory.reduce((sum, i) => sum + i.weight, 0);

        if (currentLoad + item.weight > maxLoad) {
            get().addLog('System', `Cannot transfer ${item.name}: ${char.name}'s inventory is full (${currentLoad}/${maxLoad}).`);
            return state;
        }
        
        return {
          sharedInventory: state.sharedInventory.filter(i => i.id !== itemId),
          characters: state.characters.map(c => 
            c.id === charId ? { ...c, inventory: [...c.inventory, item] } : c
          )
        };
      }),

      transferToShared: (charId, itemId) => set((state) => {
        const char = state.characters.find(c => c.id === charId);
        if (!char) return state;
        const item = char.inventory.find(i => i.id === itemId);
        if (!item) return state;

        return {
          sharedInventory: [...state.sharedInventory, item],
          characters: state.characters.map(c => 
            c.id === charId ? { ...c, inventory: c.inventory.filter(i => i.id !== itemId) } : c
          )
        };
      }),

      equipItem: (charId, itemId, slot, fromShared) => set((state) => {
        const char = state.characters.find(c => c.id === charId);
        if (!char) return state;
        
        let newItem: Item | undefined;
        let newInventory = [...char.inventory];
        let newSharedInventory = [...state.sharedInventory];

        if (fromShared) {
            const itemIndex = state.sharedInventory.findIndex(i => i.id === itemId);
            if (itemIndex === -1) return state;
            newItem = state.sharedInventory[itemIndex];
            newSharedInventory.splice(itemIndex, 1);
        } else {
            const itemIndex = char.inventory.findIndex(i => i.id === itemId);
            if (itemIndex === -1) return state;
            newItem = char.inventory[itemIndex];
            newInventory.splice(itemIndex, 1);
        }

        if (!newItem) return state;

        // Check if slot is occupied
        const currentEquipped = char.equipment[slot];
        
        // If slot occupied, move old item to inventory (or shared if full)
        if (currentEquipped) {
            const maxLoad = 5 + char.baseStats.PHY * 2;
            const currentLoad = newInventory.reduce((sum, i) => sum + i.weight, 0);
            
            if (currentLoad + currentEquipped.weight <= maxLoad) {
                newInventory.push(currentEquipped);
            } else {
                get().addLog('System', `Inventory full. ${currentEquipped.name} moved to Shared Storage.`);
                newSharedInventory.push(currentEquipped); // Should push to shared
            }
        }

        return {
            sharedInventory: newSharedInventory,
            characters: state.characters.map(c => 
                c.id === charId ? { 
                    ...c, 
                    inventory: newInventory,
                    equipment: { ...c.equipment, [slot]: newItem! }
                } : c
            )
        };
      }),

      moveEquippedToShared: (charId, slot) => set((state) => {
          const char = state.characters.find(c => c.id === charId);
          if (!char) return state;
          const item = char.equipment[slot];
          if (!item) return state;

          get().addLog('System', `${char.name} unequipped ${item.name} to Shared Storage.`);
          return {
              sharedInventory: [...state.sharedInventory, item],
              characters: state.characters.map(c => 
                  c.id === charId ? { ...c, equipment: { ...c.equipment, [slot]: null } } : c
              )
          };
      }),

      unequipItem: (charId, slot) => set((state) => {
          const char = state.characters.find(c => c.id === charId);
          if (!char) return state;

          const item = char.equipment[slot];
          if (!item) return state;

          const maxLoad = 5 + char.baseStats.PHY * 2;
          const currentLoad = char.inventory.reduce((sum, i) => sum + i.weight, 0);

          if (currentLoad + item.weight > maxLoad) {
               get().addLog('System', `Cannot unequip ${item.name}: Inventory full. Moved to Shared Storage.`);
               get().addToSharedInventory(item);
               return {
                   characters: state.characters.map(c => 
                       c.id === charId ? { ...c, equipment: { ...c.equipment, [slot]: null } } : c
                   )
               };
          }

          return {
              characters: state.characters.map(c => 
                  c.id === charId ? { 
                      ...c, 
                      inventory: [...c.inventory, item],
                      equipment: { ...c.equipment, [slot]: null }
                  } : c
              )
          };
      }),

      addRecipe: (recipe) => set((state) => ({
          configs: { ...state.configs, recipes: [...state.configs.recipes, recipe] }
      })),

      removeRecipe: (id) => set((state) => ({
          configs: { ...state.configs, recipes: state.configs.recipes.filter(r => r.id !== id) }
      })),

      addShop: (name) => set((state) => ({
          shops: [...state.shops, { id: uuidv4(), name, inventory: [], discount: 0 }]
      })),

      removeShop: (id) => set((state) => ({
          shops: state.shops.filter(s => s.id !== id)
      })),

      updateShop: (id, updates) => set((state) => ({
          shops: state.shops.map(s => s.id === id ? { ...s, ...updates } : s)
      })),

      shopBuyItem: (shopId, itemId, buyerId) => set((state) => {
          const shop = state.shops.find(s => s.id === shopId);
          const buyer = state.characters.find(c => c.id === buyerId);
          if (!shop || !buyer) return state;

          const shopItem = shop.inventory.find(i => i.itemId === itemId);
          if (!shopItem) return state;

          const itemTemplate = state.configs.customItems.find(i => i.id === itemId);
          if (!itemTemplate) return state;

          const finalPrice = Math.floor(shopItem.price * (1 - shop.discount));

          if (buyer.credits < finalPrice) {
              get().addLog('System', `Purchase failed: ${buyer.name} has insufficient credits.`);
              return state;
          }

          if (shopItem.stock !== -1 && shopItem.stock <= 0) {
              get().addLog('System', `Purchase failed: Item out of stock.`);
              return state;
          }

          // Check inventory space
          const maxLoad = 5 + buyer.baseStats.PHY * 2;
          const currentLoad = buyer.inventory.reduce((sum, i) => sum + i.weight, 0);
          if (currentLoad + itemTemplate.weight > maxLoad) {
              get().addLog('System', `Purchase failed: ${buyer.name}'s inventory is full.`);
              return state;
          }

          // Deduct credits, add item, update stock
          const newItem = { ...itemTemplate, id: uuidv4() };
          
          return {
              characters: state.characters.map(c => c.id === buyerId ? {
                  ...c,
                  credits: c.credits - finalPrice,
                  inventory: [...c.inventory, newItem]
              } : c),
              shops: state.shops.map(s => s.id === shopId ? {
                  ...s,
                  inventory: s.inventory.map(i => i.itemId === itemId ? { 
                      ...i, 
                      stock: i.stock === -1 ? -1 : i.stock - 1 
                  } : i)
              } : s)
          };
      }),

      shopSellItem: (_shopId, payeeId, item, fromShared, charId) => set((state) => {
          const payee = state.characters.find(c => c.id === payeeId);
          if (!payee) return state;

          const value = item.value || 0;
          
          // Remove item
          let newShared = [...state.sharedInventory];
          let newChars = [...state.characters];

          if (fromShared) {
              const idx = newShared.findIndex(i => i.id === item.id);
              if (idx !== -1) newShared.splice(idx, 1);
          } else if (charId) {
              newChars = newChars.map(c => c.id === charId ? {
                  ...c,
                  inventory: c.inventory.filter(i => i.id !== item.id)
              } : c);
          }

          // Add credits to payee
          newChars = newChars.map(c => c.id === payeeId ? {
              ...c,
              credits: c.credits + value
          } : c);

          get().addLog('System', `Sold ${item.name} for ${value} credits (Payee: ${payee.name}).`);

          return {
              sharedInventory: newShared,
              characters: newChars
          };
      }),

      shopSellAllShared: (_shopId, payeeId) => set((state) => {
          const payee = state.characters.find(c => c.id === payeeId);
          if (!payee) return state;

          const totalValue = state.sharedInventory.reduce((sum, i) => sum + i.value, 0);
          if (totalValue === 0) return state;

          get().addLog('System', `Sold all shared items for ${totalValue} credits (Payee: ${payee.name}).`);

          return {
              sharedInventory: [],
              characters: state.characters.map(c => c.id === payeeId ? {
                  ...c,
                  credits: c.credits + totalValue
              } : c)
          };
      }),

      addLog: (type, content, relatedEntityId) => set((state) => ({
        logs: [{
          id: uuidv4(),
          timestamp: Date.now(),
          type,
          content,
          relatedEntityId
        }, ...state.logs]
      })),

      updateConfig: (updates) => set((state) => ({
        configs: { ...state.configs, ...updates }
      })),

      updateNodeRegistry: (nodes) => set((state) => ({
          configs: { ...state.configs, nodeRegistry: nodes }
      })),

      updateNodeWeights: (weights) => set((state) => ({
          configs: { ...state.configs, nodeWeights: weights }
      })),

      setCurrentLayer: (layer) => set({ currentLayer: layer }),

      importState: (newState) => set({ ...newState }),
      
      resetState: () => set(initialState),
    }),
    {
      name: 'trpg-game-storage-v2', // Bumped version to invalidate old state
      version: 2,
    }
  )
);
