
import { Connection, PublicKey, TransactionInstruction, clusterApiUrl, PublicKeyInitData, Transaction } from "@solana/web3.js"
import { NATIVE_MINT } from "@solana/spl-token";
import {AuctionHouseProgram } from "@metaplex-foundation/mpl-auction-house";
require('dotenv').config()

import {Program,AnchorProvider, web3, utils } from "@project-serum/anchor";

import { bs58 } from "@project-serum/anchor/dist/cjs/utils/bytes"
import { AuctionHouse } from "@metaplex-foundation/mpl-auction-house/dist/src/generated/accounts";

const walletSecretKey = process.env.SECRET_KEY;

const signer = web3.Keypair.fromSecretKey(bs58.decode(walletSecretKey));

const network = clusterApiUrl("devnet");

const connection = new Connection(network);


async function createAuctionHouse(){

    const sellerFeeBasisPoints = 250
    const canChangeSalesPrice = false
    const requiresSignOff = false
    const treasuryWithdrawalDestination = signer.publicKey
    const feeWithdrawalDestination = signer.publicKey
    const tMintKey = NATIVE_MINT 

    const treasoryMintAssociatedTokenAccountAddress= tMintKey.equals(NATIVE_MINT)?
        treasuryWithdrawalDestination:
        (await AuctionHouseProgram.findAssociatedTokenAccountAddress(
            tMintKey,
            treasuryWithdrawalDestination
        ))[0]

    const [auctionHouse, bump] = await AuctionHouseProgram.findAuctionHouseAddress(
        signer.publicKey,
        tMintKey
    )

    const [feeAccount, feePayerBump] =
    await AuctionHouseProgram.findAuctionHouseFeeAddress(auctionHouse);

  const [treasuryAccount, treasuryBump] =
    await AuctionHouseProgram.findAuctionHouseTreasuryAddress(auctionHouse);

const instruction = AuctionHouseProgram.instructions.createCreateAuctionHouseInstruction(
    {
      treasuryMint: tMintKey,
      payer: signer.publicKey,
      authority: signer.publicKey,
      feeWithdrawalDestination: feeWithdrawalDestination,
      treasuryWithdrawalDestination: treasoryMintAssociatedTokenAccountAddress,
      treasuryWithdrawalDestinationOwner: treasuryWithdrawalDestination,
      auctionHouse,
      auctionHouseFeeAccount: feeAccount,
      auctionHouseTreasury: treasuryAccount,
    },
    {
      bump,
      feePayerBump,
      treasuryBump,
      sellerFeeBasisPoints,
      requiresSignOff,
      canChangeSalePrice: false,
    }
  );

  console.log(instruction)

  const tx = new web3.Transaction().add(instruction)

  tx.feePayer = signer.publicKey

  let t = await web3.sendAndConfirmTransaction(connection, tx, [signer])

console.log(t)

}


async function sell(ahAddress, nft){

  const ah = await AuctionHouse.fromAccountAddress(connection, new PublicKey(ahAddress))
  console.log(ah)
  const auctionHouse = new PublicKey(ahAddress)
  const authority = new PublicKey(ah.authority)
  const auctionHouseFeeAccount = new PublicKey(ah.auctionHouseFeeAccount)
  const buyerPrice = 120
  const treasuryMint = new PublicKey(ah.treasuryMint)
  const tokenMint = new PublicKey(nft.mintAddress)
  const metadata = new PublicKey(nft.address)

  const associatedTokenAccount = new PublicKey(
    nft.owner.associatedTokenAccountAddress
  )

  const [sellerTradeState, tradeStateBump] =
  await AuctionHouseProgram.findTradeStateAddress(
    signer.publicKey,
    auctionHouse,
    associatedTokenAccount,
    treasuryMint,
    tokenMint,
    buyerPrice,
    1
  )

  const [programAsSigner, programAsSignerBump] =
      await AuctionHouseProgram.findAuctionHouseProgramAsSignerAddress()

    const [freeTradeState, freeTradeBump] =
      await AuctionHouseProgram.findTradeStateAddress(
        signer.publicKey,
        auctionHouse,
        associatedTokenAccount,
        treasuryMint,
        tokenMint,
        0,
        1
      )

    const txt = new Transaction()

    const args = {
      tradeStateBump,
      freeTradeStateBump: freeTradeBump,
      programAsSignerBump: programAsSignerBump,
      buyerPrice,
      tokenSize: 1,
    }

    const sellInstructionAccounts = {
      wallet: signer.publicKey,
      tokenAccount: associatedTokenAccount,
      metadata: metadata,
      authority: authority,
      auctionHouse: auctionHouse,
      auctionHouseFeeAccount: auctionHouseFeeAccount,
      sellerTradeState: sellerTradeState,
      freeSellerTradeState: freeTradeState,
      programAsSigner: programAsSigner,
    }

    const sellInstruction = AuctionHouseProgram.instructions.createSellInstruction(
      sellInstructionAccounts,
      args
    )


    txt.add(sellInstruction)

    txt.feePayer = signer.publicKey
    console.log(txt)
  let t = await web3.sendAndConfirmTransaction(connection, txt, [signer])

  console.log(t)
}


sell("NMSne9A8kPqSd2eJbPdRU525pvQN4tPJLDsjNDxNePA", {mintAddress: "HA31A9RybctvJJpuniVMMqhr53Wv3B2JqBELHDfs7gr2", address: "Gev9VfePZLzCoimibL1nTZgA6k7eXu1Unat1sDbvZdew", owner: {associatedTokenAccountAddress: "DZL6usxqZGYJhNNE6BoM7wfByXeAKTy58V5bsro3eXkS"}})


// createAuctionHouse()
