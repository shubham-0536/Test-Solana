
const { Connection, PublicKey, TransactionInstruction, clusterApiUrl } = require("@solana/web3.js")
const { SystemProgram, SYSVAR_RENT_PUBKEY, } = require("@solana/web3.js")
const { MintLayout,  createInitializeMintInstruction, createMintToInstruction, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } = require("@solana/spl-token")
const {
	DataV2,
	Collection,
	Creator,
	CreateMetadataV2,
	CreateMasterEditionV3,
} = require("@metaplex-foundation/mpl-token-metadata")
const { Uses } = require("@metaplex-foundation/mpl-token-metadata")

const {Program,AnchorProvider, web3, utils, BN } = require("@project-serum/anchor");
const { bs58 } = require("@project-serum/anchor/dist/cjs/utils/bytes")

const walletSecretKey = "4q7nQc1CxJiF4tgnmhVc1p1DM2itAXdT3WHNJg6F1nLAfFzRudM7sSZJ3egnjaPVyobkPuWxPx8Q75CcKmga5qKG";

const signer = web3.Keypair.fromSecretKey(bs58.decode(walletSecretKey));

const metaData = {"name":"Test Banana NFT","symbol":"TNFT","description":"Banana NFT description","seller_fee_basis_points":2500,"image":"https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Banana-Single.jpg/1360px-Banana-Single.jpg","attributes":[{"trait_type":"color","value":"yellow","display_type":"color"},{"trait_type":"size","value":"medium","display_type":"size"}],"external_url":"","properties":{"files":[{"uri":"https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Banana-Single.jpg/1360px-Banana-Single.jpg","type":"unknown"}],"category":"image","creators":[{"address":"2XyukL1KvwDkfNcdBpfXbj6UtPqF7zcUdTDURNjLFAMo","share":100}]}}

const network = clusterApiUrl("devnet");
const opts ={
    preflightCommitment: "processed"
  }

const connection = new Connection(network, opts.preflightCommitment);



function createMetaData(metaData){

    return {
        name: metaData.name,
        symbol: metaData.symbol,
        uri: metaData.properties.files[0].uri,
        sellerFeeBasisPoints: metaData.seller_fee_basis_points,
        creators: metaData.creators,
        collection: null,
        uses: metaData.uses,
    }
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

const metadataAccount = await getMetadata(mint.publicKey)
const editionAccount = await getMasterEdition(mint.publicKey)


const mint_tx = await web3.Transaction().add(
    SystemProgram.createAccount({
        fromPubkey: signer.publicKey,
        newAccountPubkey: mint.publicKey,
        lamports: rent_mint,
        space: MintLayout.span,
        programId: TOKEN_PROGRAM_ID,
    }),
    createInitializeMintInstruction(
        TOKEN_PROGRAM_ID,
        0,
        mint.publicKey,
        signer.publicKey,
        signer.publicKey,
    ),
   createAssociatedTokenAccountInstruction(
        userTokenAccoutAddress,
        signer.publicKey,
        signer.publicKey,
        mint.publicKey,
    ),
        ({ feePayer: signer.publicKey },
        {
            metadata: metadataAccount,
            metadataData: createMetaData(metaData),
            updateAuthority: signer.publicKey,
            mint: mint.publicKey,
            mintAuthority: signer.publicKey,
        }).instructions,
    createMintToInstruction(
        mint.publicKey,
        userTokenAccoutAddress,
        signer.publicKey,
        5,
        []
    ),
(
            {
                feePayer: signer.publicKey,
            },
            {
                edition: editionAccount,
                metadata: metadataAccount,
                mint: mint.publicKey,
                mintAuthority: signer.publicKey,
                updateAuthority: signer.publicKey,
                maxSupply: new BN(masterEditionSupply),
            },
).instructions
)
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
