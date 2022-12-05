
import { Connection, PublicKey, TransactionInstruction, clusterApiUrl } from "@solana/web3.js"
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
} from "@metaplex-foundation/mpl-token-metadata"
import type { Uses } from "@metaplex-foundation/mpl-token-metadata"

import {Program,AnchorProvider, web3, utils } from "@project-serum/anchor";
import { bs58 } from "@project-serum/anchor/dist/cjs/utils/bytes"

const walletSecretKey = "4q7nQc1CxJiF4tgnmhVc1p1DM2itAXdT3WHNJg6F1nLAfFzRudM7sSZJ3egnjaPVyobkPuWxPx8Q75CcKmga5qKG";

const signer = web3.Keypair.fromSecretKey(bs58.decode(walletSecretKey));

const metaData = {"name":"Test Banana NFT","symbol":"TNFT","description":"Banana NFT description","seller_fee_basis_points":2500,"image":"https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Banana-Single.jpg/1360px-Banana-Single.jpg","attributes":[{"trait_type":"color","value":"yellow","display_type":"color"},{"trait_type":"size","value":"medium","display_type":"size"}],"external_url":"","properties":{"files":[{"uri":"https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Banana-Single.jpg/1360px-Banana-Single.jpg","type":"unknown"}],"category":"image","creators":[{"address":"2XyukL1KvwDkfNcdBpfXbj6UtPqF7zcUdTDURNjLFAMo","share":100}]}}

const network = clusterApiUrl("devnet");
// const opts ={
//     preflightCommitment: "processed"
//   }

const connection = new Connection(network);



function createMetaData(metaData){

    return ({
        name: metaData.name,
        symbol: metaData.symbol,
        uri: metaData.properties.files[0].uri,
        sellerFeeBasisPoints: metaData.seller_fee_basis_points,
        creators: metaData.creators,
        collection: null,
        uses: metaData.uses,
    })
}

async function getMintInstructions(connection, masterEditionSupply){

const rent_mint = await connection.getMinimumBalanceForRentExemption(
    MintLayout.span
)

const mint = web3.Keypair.generate();

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
        5,
        [],
		TOKEN_PROGRAM_ID
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
)
)
mint_tx.feePayer = signer.publicKey

    console.log(mint_tx)
let x = await web3.sendAndConfirmTransaction(connection, mint_tx, [signer, mint])
console.log(x)

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
				TOKEN_PROGRAM_ID.toBuffer(),
				mint.toBuffer(),
			],
			TOKEN_PROGRAM_ID,
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
				TOKEN_PROGRAM_ID.toBuffer(),
				mint.toBuffer(),
				Buffer.from("edition"),
			],
			TOKEN_PROGRAM_ID,
		)
	)[0]
}

getMintInstructions(connection, 4)
