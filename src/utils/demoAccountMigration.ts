/**
 * This utility handles the migration from "Sandbox Account" to "Demo Account"
 * It updates any references in localStorage to ensure consistency
 */

export function migrateSandboxToDemoAccount() {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return; // Skip if not in browser
  }

  try {
    console.log('[demoAccountMigration] Checking for Sandbox Account references in localStorage');
    
    // Update exchange_api_keys in localStorage
    const savedKeysStr = localStorage.getItem('exchange_api_keys');
    if (savedKeysStr) {
      const savedKeys = JSON.parse(savedKeysStr);
      let updated = false;
      
      if (Array.isArray(savedKeys)) {
        savedKeys.forEach((key) => {
          if (key.key_nickname === '🔰 Sandbox Account') {
            console.log('[demoAccountMigration] Updating Sandbox Account to Demo Account in exchange_api_keys');
            key.key_nickname = '🔰 Demo Account';
            updated = true;
          }
        });
        
        if (updated) {
          localStorage.setItem('exchange_api_keys', JSON.stringify(savedKeys));
          console.log('[demoAccountMigration] Updated exchange_api_keys in localStorage');
        }
      }
    }
    
    // Update selectedAccount in localStorage
    const selectedAccountStr = localStorage.getItem('selected-account');
    if (selectedAccountStr) {
      try {
        const selectedAccountData = JSON.parse(selectedAccountStr);
        if (selectedAccountData.state?.selectedAccount?.name === '🔰 Sandbox Account') {
          console.log('[demoAccountMigration] Updating Sandbox Account to Demo Account in selected-account');
          selectedAccountData.state.selectedAccount.name = '🔰 Demo Account';
          selectedAccountData.state.selectedAccount.exchange = 'Demo';
          localStorage.setItem('selected-account', JSON.stringify(selectedAccountData));
          console.log('[demoAccountMigration] Updated selected-account in localStorage');
        }
      } catch (error) {
        console.error('[demoAccountMigration] Error updating selected-account:', error);
      }
    }
    
    // Update any other localStorage items that might contain Sandbox Account references
    // This is a more generic approach to catch any other places
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || key === 'exchange_api_keys' || key === 'selected-account') continue;
      
      const value = localStorage.getItem(key);
      if (value && value.includes('Sandbox Account')) {
        console.log(`[demoAccountMigration] Found Sandbox Account reference in ${key}`);
        const updatedValue = value.replace(/Sandbox Account/g, 'Demo Account');
        localStorage.setItem(key, updatedValue);
        console.log(`[demoAccountMigration] Updated ${key} in localStorage`);
      }
    }
    
    console.log('[demoAccountMigration] Migration completed');
  } catch (error) {
    console.error('[demoAccountMigration] Error during migration:', error);
  }
}
