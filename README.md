# Nexa wallet module

Altbase 0.1.9 uses the official `libnexa-ts` 3.0.3 library locally for mainnet P2ST accounts at `m/44'/29223'/0'/0/0`, with two decimal places. Keys and signatures remain local; public chain reads and explicit transaction submission use the Altbase backend's official Rostrum WSS upstream.

Nexa outpoint hashes are handled as Nexa outpoints, not Bitcoin transaction-output pairs. Coinbase outputs mature after 5,000 confirmations. Token outputs are excluded from native-coin selection. Amount calculations use exact integers, including values beyond JavaScript's safe Number range. MAX is bounded to 200 inputs and reports the remainder.

Supported: native NEXA balances, history, fee/MAX planning, and P2ST transfers. Token operations are not exposed. An uncertain submission is not retried automatically.
