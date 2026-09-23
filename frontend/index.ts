import { defineCoinModule } from '../../../src/coin-modules/types'
export default defineCoinModule({
  id: 'nexa', name: 'Nexa', ticker: 'NEXA', networkId: 'nexa-mainnet',
  supportsMemo: false, satsPerCoin: 100, walletEngine: 'nexa-utxo', utxoReadProfile: 'electrum',
}, 'nexa-sdk')
