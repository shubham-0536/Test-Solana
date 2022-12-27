
import { Connection, PublicKey, TransactionInstruction, clusterApiUrl, PublicKeyInitData, Transaction, SYSVAR_INSTRUCTIONS_PUBKEY, AccountMeta } from "@solana/web3.js"
import { ASSOCIATED_TOKEN_PROGRAM_ID, NATIVE_MINT, Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import {AuctionHouseProgram } from "@metaplex-foundation/mpl-auction-house";
require('dotenv').config()

import {Program,AnchorProvider, web3, utils, BN } from "@project-serum/anchor";
import {BigNumber} from "bignumber.js";


import { bs58 } from "@project-serum/anchor/dist/cjs/utils/bytes"
import { AuctionHouse } from "@metaplex-foundation/mpl-auction-house/dist/src/generated/accounts";
import { createExecuteSaleInstruction, createPrintPurchaseReceiptInstruction } from "@metaplex-foundation/mpl-auction-house/dist/src/generated/instructions";
import { toBigNumber } from "@metaplex-foundation/js";

const walletSecretKey = process.env.SECRET_KEY;

const signer = web3.Keypair.fromSecretKey(bs58.decode(walletSecretKey));

const network = clusterApiUrl("devnet");

const connection = new Connection(network);


async function createAuctionHouse(){

    const sellerFeeBasisPoints = 100
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

const AUCTION_HOUSE_PROGRAM_ID = new PublicKey(
	"hausS13jsjafwWwGqZTUQRmWyvyxn9EQpqMwV1PBBmk",
)

function bigNumToBuffer(value: BigNumber, endian: BN.Endianness, length: number) {
	return bnToBuffer(bigNumToBn(value), endian, length)
}

function bnToBuffer(value: BN, endian: BN.Endianness, length: number) {
	return value.toArrayLike(Buffer, endian, length)
}

function bigNumToBn(value) {
	return new BN(value.toString())
}

async function getAuctionHouseTradeState (
	auctionHouse: PublicKey,
	wallet: PublicKey,
	tokenAccount: PublicKey,
	treasuryMint: PublicKey,
	tokenMint: PublicKey,
	tokenSize: BigNumber,
	buyPrice: BigNumber,
): Promise<[PublicKey, number]> {
	return await PublicKey.findProgramAddress(
		[
			Buffer.from("auction_house"),
			wallet.toBuffer(),
			auctionHouse.toBuffer(),
			tokenAccount.toBuffer(),
			treasuryMint.toBuffer(),
			tokenMint.toBuffer(),
			bigNumToBuffer(buyPrice, "le", 8),
			bigNumToBuffer(tokenSize, "le", 8),
		],
		AUCTION_HOUSE_PROGRAM_ID,
	)
}

async function sell(ahAddress, nft){

  const ah = await AuctionHouse.fromAccountAddress(connection, new PublicKey(ahAddress))
  // console.log(ah)
  const auctionHouse = new PublicKey(ahAddress)
  const authority = new PublicKey(ah.authority)
  const auctionHouseFeeAccount = new PublicKey(ah.auctionHouseFeeAccount)
  const price = new BigNumber(0.000005)
  const mantissa = 10 ** 9
	const totalValue = price.multipliedBy(mantissa).integerValue(BigNumber.ROUND_CEIL)
  const buyerPrice = totalValue
  const treasuryMint = new PublicKey(ah.treasuryMint)
  const tokenMint = new PublicKey(nft.mintAddress)
  const metadata = new PublicKey(nft.address)

  const associatedTokenAccount = new PublicKey(
    nft.owner.associatedTokenAccountAddress
  )
  // const x = await findAssociatedTokenAddress(signer.publicKey,tokenMint)

  // const [sellerTradeState, tradeStateBump] =
  // await AuctionHouseProgram.findTradeStateAddress(
  //   signer.publicKey,
  //   auctionHouse,
  //   associatedTokenAccount,
  //   treasuryMint,
  //   tokenMint,
  //   Number(buyerPrice),
  //   1
  // )

  const [sellerTradeState, tradeStateBump] = await getAuctionHouseTradeState( 
    auctionHouse, 
    signer.publicKey, 
    associatedTokenAccount, 
    treasuryMint, 
    tokenMint, 
    new BigNumber(1), 
    buyerPrice 
  );

  console.log(sellerTradeState.toString(), tradeStateBump)

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

      // const [freeTradeState, freeTradeBump] =
      // await getAuctionHouseTradeState( 
      //   auctionHouse, 
      //   signer.publicKey, 
      //   associatedTokenAccount, 
      //   treasuryMint, 
      //   tokenMint, 
      //   new BigNumber(0), 
      //   new BigNumber(1)
      // );

    const txt = new Transaction()

    const args = {
      tradeStateBump,
      freeTradeStateBump: freeTradeBump,
      programAsSignerBump: programAsSignerBump,
      buyerPrice: Number(buyerPrice),
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



// sell("FszMA3N7LevTMJ9NaG93yuV4vWcyU7H2pzPS4P4ierb6", {mintAddress: "5UUCBFAMd9oi14di9euJnTnppXUMwyAmDRujmD1mQS2Q", address: "9QYznB2LKuV51cW1tvTFY31ai8C6WcUD5VGW4PE94CeN", owner: {associatedTokenAccountAddress: "CNgYr6h3FQNhXY5YMjgUHwPx1tHTuDpVeCpQzy2JZ4ki"}})


async function buy(ahAddress, listing, nft) {
  const ah = await AuctionHouse.fromAccountAddress(connection, new PublicKey(ahAddress))
  const auctionHouse = new PublicKey(ahAddress)
  const authority = new PublicKey(ah.authority)
  const auctionHouseFeeAccount = new PublicKey(ah.auctionHouseFeeAccount)
  const treasuryMint = new PublicKey(ah.treasuryMint)
  const seller = new PublicKey(listing.seller)
  const tokenMint = new PublicKey(nft.mintAddress)
  const auctionHouseTreasury = new PublicKey(ah.auctionHouseTreasury)
  const sellerTradeState = new PublicKey(listing.tradeState)
  const buyerPrice = Number(listing.price)
  const tokenAccount = new PublicKey(nft.owner.associatedTokenAccountAddress)
  const metadata = new PublicKey(nft.address)
  const isNative = treasuryMint.equals(NATIVE_MINT)

  console.log("Buyer Price", buyerPrice)

  console.log("metadata", metadata.toString())

  console.log("sellerTradeState", sellerTradeState.toString())


  // const [listingReceipt, _listingReceiptBump] =
  //   await AuctionHouseProgram.findListingReceiptAddress(
  //     new PublicKey(listing.tradeState)
  //   )

  let sellerPaymentReceiptAccount = await Token.getAssociatedTokenAddress(
    ASSOCIATED_TOKEN_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
    treasuryMint,
    seller
  )

  if (isNative) {
    sellerPaymentReceiptAccount = seller
  }

  const [escrowPaymentAccount, escrowPaymentBump] =
    await AuctionHouseProgram.findEscrowPaymentAccountAddress(
      auctionHouse,
      signer.publicKey
    )

  const [buyerTradeState, _tradeStateBump] =
    await AuctionHouseProgram.findPublicBidTradeStateAddress(
      signer.publicKey,
      auctionHouse,
      treasuryMint,
      tokenMint,
      buyerPrice,
      1
    )
  const [freeTradeState, freeTradeStateBump] =
    await AuctionHouseProgram.findTradeStateAddress(
      seller,
      auctionHouse,
      tokenAccount,
      treasuryMint,
      tokenMint,
      0,
      1
    )
  const [programAsSigner, programAsSignerBump] =
    await AuctionHouseProgram.findAuctionHouseProgramAsSignerAddress()
  const [buyerReceiptTokenAccount] =
    await AuctionHouseProgram.findAssociatedTokenAccountAddress(
      tokenMint,
      signer.publicKey
    )

  // const [bidReceipt, _bidReceiptBump] =
  //   await AuctionHouseProgram.findBidReceiptAddress(buyerTradeState)
  // const [purchaseReceipt, purchaseReceiptBump] =
  //   await AuctionHouseProgram.findPurchaseReceiptAddress(
  //     sellerTradeState,
  //     buyerTradeState
  //   )
      console.log(">>>>>>>>>>", freeTradeState.toString(), tokenAccount.toString(), auctionHouse.toString(), seller.toString(), buyerPrice.toString(), tokenMint.toString())
      const executeSaleInstructionAccounts = {
        buyer: signer.publicKey,
        seller,
        tokenAccount,
        tokenMint,
        metadata,
        treasuryMint,
        escrowPaymentAccount,
        sellerPaymentReceiptAccount,
        buyerReceiptTokenAccount,
        authority,
        auctionHouse,
        auctionHouseFeeAccount,
        auctionHouseTreasury,
        buyerTradeState,
        sellerTradeState,
        freeTradeState,
        programAsSigner,
      }
  const executeSaleInstructionArgs = {
    escrowPaymentBump,
    freeTradeStateBump,
    programAsSignerBump,
    buyerPrice,
    tokenSize: 1,
    partialOrderSize: new BN(1),
    partialOrderPrice:new BN(1)
  }
  console.log(executeSaleInstructionArgs)
  const executeSaleInstruction = createExecuteSaleInstruction(
    executeSaleInstructionAccounts,
    executeSaleInstructionArgs
  )

  // const printPurchaseReceiptAccounts = {
  //   bookkeeper: signer.publicKey,
  //   purchaseReceipt,
  //   bidReceipt,
  //   listingReceipt,
  //   instruction: SYSVAR_INSTRUCTIONS_PUBKEY,
  // }
  // const printPurchaseReceiptArgs = {
  //   purchaseReceiptBump,
  // }

  // const printPurchaseReceiptInstruction =
  // createPrintPurchaseReceiptInstruction(
  //   printPurchaseReceiptAccounts,
  //   printPurchaseReceiptArgs
  // )

  const txt = new Transaction()

  let remainingAccounts: AccountMeta[] = []

    const creatorAccount = {
      pubkey: new PublicKey(nft.creator),
      isSigner: false,
      isWritable: true,
    }
    console.log("CreatorAccount", creatorAccount.pubkey.toString())
    remainingAccounts = [...remainingAccounts, creatorAccount]

    // if (isNative) {
    //   continue
    // }

    const pubkey = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      treasuryMint,
      creatorAccount.pubkey
    )

    const creatorAtaAccount = {
      pubkey,
      isSigner: false,
      isWritable: true,
    }

    remainingAccounts = [...remainingAccounts, creatorAtaAccount]

  txt
    .add(
      new TransactionInstruction({
        programId: AuctionHouseProgram.PUBKEY,
        data: executeSaleInstruction.data,
        keys: executeSaleInstruction.keys.concat(remainingAccounts),
      })
    )

  txt.feePayer = signer.publicKey
  let t = await web3.sendAndConfirmTransaction(connection, txt, [signer])

  console.log(t)  
}

buy("FszMA3N7LevTMJ9NaG93yuV4vWcyU7H2pzPS4P4ierb6", {tradeState: "3HcLiMoJrCtByRaPmUuo8jUTUnP9pmzcoEsWGMDpJnmH", price: 5000, seller: "DYFCo2Agj4dNta4VLwLQiLbfw5E2dHbzSafJx5Uzpav6"}, {mintAddress: "5UUCBFAMd9oi14di9euJnTnppXUMwyAmDRujmD1mQS2Q", address: "9QYznB2LKuV51cW1tvTFY31ai8C6WcUD5VGW4PE94CeN", owner: {associatedTokenAccountAddress: "CNgYr6h3FQNhXY5YMjgUHwPx1tHTuDpVeCpQzy2JZ4ki"}, creator: "DYFCo2Agj4dNta4VLwLQiLbfw5E2dHbzSafJx5Uzpav6"} )

// createAuctionHouse()
