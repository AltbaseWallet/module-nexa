'use strict'
const n = require('libnexa-ts')
const { mnemonicToSeedSync, validateMnemonic } = require('@scure/bip39')
const { wordlist } = require('@scure/bip39/wordlists/english')
const { select, publicPlan } = require('../../../src/wallet-engines/sdk/planner.cjs')
const addressObject = address => {
  if (typeof address!=='string' || !address.startsWith('nexa:') || address.length>200) throw new Error('Invalid Nexa mainnet address')
  const a=n.Address.fromString(address)
  if (a.network.name!=='mainnet' || !['P2ST','P2PKH'].includes(a.type)) throw new Error('Unsupported Nexa address type')
  return a
}
const keyFor = mnemonic => {
  if(!validateMnemonic(mnemonic,wordlist))throw new Error('Invalid recovery phrase')
  const seed=Buffer.from(mnemonicToSeedSync(mnemonic))
  try{return n.HDPrivateKey.fromSeed(seed,'mainnet').deriveChild("m/44'/29223'/0'/0/0").privateKey}
  finally{seed.fill(0)}
}
const addressFor=key=>key.toAddress().toString()
const plan=p=>{
  const source=addressObject(p.fromAddress);addressObject(p.toAddress||p.fromAddress)
  const own=n.ScriptFactory.buildOutFromAddress(source).toHex()
  const feeRate=Number(p.feeRate||3)
  if(!Number.isFinite(feeRate)||feeRate<3||feeRate>1000000)throw new Error('Invalid Nexa fee rate')
  return select(p,{decimals:2,dust:546n,
    feeFor:(inputs,outputs)=>BigInt(Math.ceil((32+160*inputs+100*outputs)*feeRate)),
    validateUtxo:r=>{
      if(!/^[0-9a-f]{64}$/i.test(r.outpoint))throw new Error('Nexa requires the full outpoint hash')
      if(r.hasToken || r.has_token)throw new Error('Token outputs must not be spent as native Nexa')
      if(String(r.script).toLowerCase()!==own)throw new Error('UTXO does not belong to the selected address')
      return r.outpoint
    }})
}
module.exports={
  derive:p=>({address:addressFor(keyFor(p.mnemonic))}),
  validate:p=>{try{addressObject(p.address);return{valid:true}}catch{return{valid:false}}},
  plan:p=>publicPlan(plan(p)),
  sign:p=>{
    const key=keyFor(p.mnemonic)
    if(addressFor(key)!==p.fromAddress)throw new Error('Signing key does not match the source address')
    const selected=plan(p)
    if(p.sendMax && p.amountCoin!==selected.amountCoin)throw new Error('MAX amount changed; review it again before confirming')
    const b=new n.TransactionBuilder()
    for(const row of selected.selected)b.from({outpoint:row.outpoint,scriptPubKey:row.script,satoshis:row.value})
    b.to(addressObject(p.toAddress),selected.amount)
    if(selected.change)b.to(addressObject(p.fromAddress),selected.change)
    b.fee(Number(selected.fee)).sign(key)
    const tx=b.build()
    if(!tx.isFullySigned())throw new Error('Nexa transaction is not fully signed')
    const hex=tx.checkedSerialize()
    if(BigInt(hex.length/2)*BigInt(Math.ceil(p.feeRate||3))>selected.fee)throw new Error('Transaction fee changed; calculate it again')
    return{...publicPlan(selected),hex,txid:tx.id,txidem:tx.idem}
  },
  export:p=>({secret:keyFor(p.mnemonic).toWIF()}),
}
