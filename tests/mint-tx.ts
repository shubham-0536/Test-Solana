
import { Connection, PublicKey, TransactionInstruction, clusterApiUrl, TransactionMessage } from "@solana/web3.js"
import { SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js"
import { MintLayout, createInitializeMintInstruction, createMintToInstruction, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token"
import { BN } from "@project-serum/anchor"
import {
	DataV2,
	Collection,
	Creator,
	CreateMetadataAccountV2InstructionArgs,
	CreateMasterEditionV3InstructionArgs,
    createCreateMetadataAccountV2Instruction,
    createCreateMasterEditionV3Instruction,
	createUpdateMetadataAccountV2Instruction,
	createVerifyCollectionInstruction,
} from "@metaplex-foundation/mpl-token-metadata"
import type { Uses } from "@metaplex-foundation/mpl-token-metadata"

import {Program,AnchorProvider, web3, utils } from "@project-serum/anchor";
import { bs58 } from "@project-serum/anchor/dist/cjs/utils/bytes"

const walletSecretKey = "4q7nQc1CxJiF4tgnmhVc1p1DM2itAXdT3WHNJg6F1nLAfFzRudM7sSZJ3egnjaPVyobkPuWxPx8Q75CcKmga5qKG";

const signer = web3.Keypair.fromSecretKey(bs58.decode(walletSecretKey));
const TOKEN_METADATA_PROGRAM_ID = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s")

const metaData = {"name":"Test3 Banana NFT","symbol":"TNFT","description":"Banana NFT description","seller_fee_basis_points":2500,"image":"https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Banana-Single.jpg/1360px-Banana-Single.jpg","attributes":[{"trait_type":"color","value":"yellow","display_type":"color"},{"trait_type":"size","value":"medium","display_type":"size"}],"external_url":"","properties":{"files":[{"uri":"https://ipfs.io/ipfs/bafybeifjrtpyi3r46l45ujhfrg5pb2mjft7oi7cb5fegfbywti73ubjqra/image.jpeg","type":"unknown"}],"category":"image","creators":[{"address":"DYFCo2Agj4dNta4VLwLQiLbfw5E2dHbzSafJx5Uzpav6","share":100}]}}

const network = clusterApiUrl("devnet");
// const opts ={
//     preflightCommitment: "processed"
//   }

const connection = new Connection(network);



function createMetaData(metaData){

    return ({
        name: metaData.name,
        symbol: metaData.symbol,
        uri: "https://ipfs.io/ipfs/bafybeifjrtpyi3r46l45ujhfrg5pb2mjft7oi7cb5fegfbywti73ubjqra/image.jpeg",
        sellerFeeBasisPoints: metaData.seller_fee_basis_points,
        creators: [
			{
			  address: signer.publicKey,
			  share: 100,
			  verified: true
			},
		  ],
        collection: {verified: false, key: new PublicKey("GDTU2v9Ncy8FrSRq2tHLfCgZjxuX5UiFseBmqugGVmCZ")},
        uses: metaData.uses,
    })
}

async function getMintInstructions(connection, masterEditionSupply){

const rent_mint = await connection.getMinimumBalanceForRentExemption(
    MintLayout.span
)

const mint = web3.Keypair.generate();
console.log(bs58.encode(mint.secretKey).toString())

const instructions = []

const userTokenAccoutAddress = await getTokenWallet(
    signer.publicKey,
    mint.publicKey,
)
console.log(signer)

const metadataAccount = await getMetadata(mint.publicKey)
const editionAccount = await getMasterEdition(mint.publicKey)


const mint_tx = new web3.Transaction().add(
    SystemProgram.createAccount({
        fromPubkey: signer.publicKey,
        newAccountPubkey: mint.publicKey,
        lamports: rent_mint,
        space: MintLayout.span,
        programId: TOKEN_PROGRAM_ID,
    }),
    createInitializeMintInstruction(
        mint.publicKey,
        0,
        signer.publicKey,
        signer.publicKey,
        TOKEN_PROGRAM_ID
    ),
    createAssociatedTokenAccountInstruction(
        userTokenAccoutAddress,
        signer.publicKey,
        signer.publicKey,
        mint.publicKey
    ),
    createCreateMetadataAccountV2Instruction(
        {
            metadata: metadataAccount,
            // metadataData: createMetaData(metaData),
            updateAuthority: signer.publicKey,
            mint: mint.publicKey,
            mintAuthority: signer.publicKey,
            payer: signer.publicKey
        }, {createMetadataAccountArgsV2: {data: createMetaData(metaData), isMutable: true}} 
    ),
    createMintToInstruction(
        mint.publicKey,
        userTokenAccoutAddress,
        signer.publicKey,
        1,
        []
    ),
    (
        createCreateMasterEditionV3Instruction(
        {
            edition: editionAccount,
            metadata: metadataAccount,
            mint: mint.publicKey,
            mintAuthority: signer.publicKey,
            updateAuthority: signer.publicKey,
            payer: signer.publicKey,
        }, {createMasterEditionArgs: {maxSupply: new BN(masterEditionSupply)}},
    )
),
	(
		createUpdateMetadataAccountV2Instruction(
			{
			  metadata: metadataAccount,
			  updateAuthority: signer.publicKey,
			},
			{
			  updateMetadataAccountArgsV2: {
				primarySaleHappened: false,
				data: createMetaData(metaData),
				isMutable: false,
				updateAuthority: signer.publicKey,
			  },
			}
		  )
	)
	// (createVerifyCollectionInstruction(
	// 	{
	// 		metadata: await getMetadata(new PublicKey(metadataAccount)),
	// 		collectionAuthority: signer.publicKey,
    //         payer: signer.publicKey,
	// 		collectionMint: mint.publicKey,
	// 		collection: metadataAccount,
	// 		collectionMasterEditionAccount: editionAccount,
	// 	})		
)


mint_tx.feePayer = signer.publicKey

    // console.log(mint_tx)
let t = await web3.sendAndConfirmTransaction(connection, mint_tx, [signer, mint])

console.log(t)

// }
}


function createAssociatedTokenAccountInstruction(
	associatedTokenAddress,
	payer,
	walletAddress,
	splTokenMintAddress,
) {
	const keys = [
		{
			pubkey: payer,
			isSigner: true,
			isWritable: true,
		},
		{
			pubkey: associatedTokenAddress,
			isSigner: false,
			isWritable: true,
		},
		{
			pubkey: walletAddress,
			isSigner: false,
			isWritable: false,
		},
		{
			pubkey: splTokenMintAddress,
			isSigner: false,
			isWritable: false,
		},
		{
			pubkey: SystemProgram.programId,
			isSigner: false,
			isWritable: false,
		},
		{
			pubkey: TOKEN_PROGRAM_ID,
			isSigner: false,
			isWritable: false,
		},
		{
			pubkey: SYSVAR_RENT_PUBKEY,
			isSigner: false,
			isWritable: false,
		},
	]
	return new TransactionInstruction({
		keys,
		programId: ASSOCIATED_TOKEN_PROGRAM_ID,
		data: Buffer.from([]),
	})
}
async function getMetadata(
	mint,
) {
	return (
		await PublicKey.findProgramAddress(
			[
				Buffer.from("metadata"),
				TOKEN_METADATA_PROGRAM_ID.toBuffer(),
				mint.toBuffer(),
			],
			TOKEN_METADATA_PROGRAM_ID,
		)
	)[0]
}

async function getTokenWallet(
	wallet,
	mint,
) {
	return (
		await PublicKey.findProgramAddress(
			[wallet.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
			ASSOCIATED_TOKEN_PROGRAM_ID,
		)
	)[0]
}

async function getMasterEdition(
	mint,
) {
	return (
		await PublicKey.findProgramAddress(
			[
				Buffer.from("metadata"),
				TOKEN_METADATA_PROGRAM_ID.toBuffer(),
				mint.toBuffer(),
				Buffer.from("edition"),
			],
			TOKEN_METADATA_PROGRAM_ID,
		)
	)[0]
}

getMintInstructions(connection, 1)
