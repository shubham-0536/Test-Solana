
import { Connection, PublicKey, TransactionInstruction, clusterApiUrl, TransactionMessage } from "@solana/web3.js"

import {Program,AnchorProvider, web3, utils } from "@project-serum/anchor";
import { bs58 } from "@project-serum/anchor/dist/cjs/utils/bytes"
import { config } from "dotenv";

const walletSecretKey = "4q7nQc1CxJiF4tgnmhVc1p1DM2itAXdT3WHNJg6F1nLAfFzRudM7sSZJ3egnjaPVyobkPuWxPx8Q75CcKmga5qKG";

const signer = web3.Keypair.fromSecretKey(bs58.decode(walletSecretKey));
const TOKEN_METADATA_PROGRAM_ID = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s")

const network = clusterApiUrl("devnet");
// const opts ={
//     preflightCommitment: "processed"
//   }

const connection = new Connection(network);


async function main(txId){
    let hashExpired = false;
    let txSuccess = false;
    while (!hashExpired && !txSuccess) {
        const t = await connection.getParsedTransaction(txId);
        console.log(t)

        const {value: status} = await connection.getSignatureStatus(txId,{
            searchTransactionHistory: true,
          } )


        console.log(">>>>>>>>>>>.", await connection.getSignatureStatus(txId,{
            searchTransactionHistory: true,
          } ))

        // // Break loop if transaction has succeeded
        if (status && ((status.confirmationStatus === 'confirmed' || 'finalized'))) {
            txSuccess = true;
            console.log(`Transaction Success.`);
            console.log(`https://explorer.solana.com/tx/${txId}?cluster=devnet`);
            break;
        }

        // await new Promise(resolve => setTimeout(resolve, 2000));

        // hashExpired = await isBlockhashExpired(connection, lastValidHeight);
        
        // // Break loop if blockhash has expired
        // if (hashExpired) {
        //     const endTime = new Date();
        //     const elapsed = (endTime.getTime() - START_TIME.getTime())/1000;
        //     console.log(`Blockhash has expired. Elapsed time: ${elapsed} seconds.`);
        //     // (add your own logic to Fetch a new blockhash and resend the transaction or throw an error)
        //     break;
        // }
        // Check again after 2.5 sec
        // await sleep(2500);
    }
}

main("2Ae6nn9CL3v5w72QWDkuXQB8GcpjDhHMxbstJnjx6oUB5PhqrPWBTqAjZjbPExfgbjWGzseAwM3mrqzYkrdYmRjP")