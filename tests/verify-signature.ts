import { Connection, PublicKey, TransactionInstruction, clusterApiUrl, TransactionMessage } from "@solana/web3.js"
import {Program,AnchorProvider, web3, utils } from "@project-serum/anchor";
import { bs58 } from "@project-serum/anchor/dist/cjs/utils/bytes"
import nacl from "tweetnacl";



async function main(){

    const solanaConnection = new Connection(
        clusterApiUrl('devnet'),
        'confirmed'
      );
      const slot = await solanaConnection?.getSlot();
      const block = await solanaConnection?.getBlock(slot);

      const signerAddress = "Fkpsic7UKEHSC1spt8baM3AzWJgEoDLTcrLdieCdBEGY"

      const signingMessage = await prepareMessage(signerAddress, "0xasdasdasdasfas")
      const verified = nacl.sign.detached.verify(new TextEncoder().encode(signingMessage), 
      bs58.decode("8fb4e4e5d4f5da0f3bd07476d23ebd4efccd984560ba98cfeda4ba74052283abb595ecb211260799b14c84f981c44408d24f152a22aa97b437e5032b445b720f"),
      bs58.decode(signerAddress))

      console.log(verified)
}

main()


// {
//     "loginChallenge": "1cb50d8008964592b6df91f23c2b4f2d",
//     "signerAddress": "Fkpsic7UKEHSC1spt8baM3AzWJgEoDLTcrLdieCdBEGY",
//     "chainType": "SOLANA",
//     "signedMessage": "8fb4e4e5d4f5da0f3bd07476d23ebd4efccd984560ba98cfeda4ba74052283abb595ecb211260799b14c84f981c44408d24f152a22aa97b437e5032b445b720f",
//     "blockNumber": "175798027"
// }

async function prepareMessage(signerAddress: string, blockHash: string): Promise<string>{

    return `Welcome to Safemoon!
    Click "Sign" to sign in. No password needed!
I   accept the Safemoon Terms of Service: https://b45dfbcabbbb2eb74b7f4ed26f238cf6.tk/terms&service
    Wallet address:
    ${signerAddress}
    nonce: ${blockHash}`
  }

