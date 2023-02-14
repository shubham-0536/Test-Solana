
import { Connection, PublicKey, TransactionInstruction, clusterApiUrl, TransactionMessage } from "@solana/web3.js"
import { SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js"
// import { MintLayout, createInitializeMintInstruction, createMintToInstruction, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token"
import { BN } from "@project-serum/anchor"
import {
	DataV2,
	Collection,
	Creator,
	CreateMetadataAccountV2InstructionArgs,
	CreateMasterEditionV3InstructionArgs,
    createCreateMetadataAccountV2Instruction,
    createCreateMasterEditionV3Instruction,
    createVerifyCollectionInstruction,
    Metadata,
    createSetAndVerifySizedCollectionItemInstruction,
	createVerifySizedCollectionItemInstruction,
} from "@metaplex-foundation/mpl-token-metadata"
import type { Uses } from "@metaplex-foundation/mpl-token-metadata"

import {Program,AnchorProvider, web3, utils } from "@project-serum/anchor";
import { bs58 } from "@project-serum/anchor/dist/cjs/utils/bytes"

const walletSecretKey = "4q7nQc1CxJiF4tgnmhVc1p1DM2itAXdT3WHNJg6F1nLAfFzRudM7sSZJ3egnjaPVyobkPuWxPx8Q75CcKmga5qKG";

const signer = web3.Keypair.fromSecretKey(bs58.decode(walletSecretKey));
const TOKEN_METADATA_PROGRAM_ID = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s")

const metaData = {"name":"Test3 Banana NFT","symbol":"TNFT","description":"Banana NFT description","seller_fee_basis_points":2500,"image":"https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Banana-Single.jpg/1360px-Banana-Single.jpg","attributes":[{"trait_type":"color","value":"yellow","display_type":"color"},{"trait_type":"size","value":"medium","display_type":"size"}],"external_url":"","properties":{"files":[{"uri":"https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Banana-Single.jpg/1360px-Banana-Single.jpg","type":"unknown"}],"category":"image","creators":[{"address":"2XyukL1KvwDkfNcdBpfXbj6UtPqF7zcUdTDURNjLFAMo","share":100}]}}

const network = clusterApiUrl("devnet");
// const opts ={
//     preflightCommitment: "processed"
//   }

const connection = new Connection(network);

const mintSecretKey = "4zTvANAKErfKnhiRQuBWur3No4Am2fHiV6VLKM9fGXAHrdhPdfPHH2d1jdjcAxj4ku8u3LBT7EgUK9J45xnBky1f"
const minter = web3.Keypair.fromSecretKey(bs58.decode(mintSecretKey));

const metaDataAccount = "8E8xnB7VCvyaTXxTJdDJqBj4WRLuNtrsSArobVYRVc89"
const collection = "4ux5PLuiGPGdWiWzg6zhxFFcCuiZjTf51HvVuNMWmgQV"

async function main(){

    const metadataAccount = new PublicKey("8E8xnB7VCvyaTXxTJdDJqBj4WRLuNtrsSArobVYRVc89")
	const collectionMetadataAccount = await getMetadata(new PublicKey(collection))
	// console.log(metaDataAccount.toString(), collectionMetadataAccount.toString())
	const collectionMasterEdition = await getMasterEdition(new PublicKey(collection))

    const metadata = await getMetadata(new PublicKey("3HxMQSNtugUyscK5rnxnCq2WK1zJwZknmZu3fn7rK3mk"));

	const collectionMetadata = await getMetadata(new PublicKey("8E8xnB7VCvyaTXxTJdDJqBj4WRLuNtrsSArobVYRVc89"));
	// console.log(">>>>>>>>.", collectionMetadata.toString())

    const data = await Metadata.fromAccountAddress(
      connection,
      metadata
    );
    console.log("Collection Address", data.collection.key.toString())

    const verify_collection_instruction  = createVerifySizedCollectionItemInstruction(
		{
			metadata: collectionMetadataAccount,
			collectionAuthority: signer.publicKey,
            payer: signer.publicKey,
			collectionMint: new PublicKey("FWiQ1UBavvDqVFq4m3nBPbs5KEcK3c9iPJtHigVCNpaz"),
			collection:new PublicKey("4ux5PLuiGPGdWiWzg6zhxFFcCuiZjTf51HvVuNMWmgQV"),
			collectionMasterEditionAccount: metadataAccount,
			collectionAuthorityRecord: undefined
		},
	)

	const verify_collection_instruction1  = createVerifyCollectionInstruction(
		{
			metadata: collectionMetadataAccount,
			collectionAuthority:new PublicKey("FWiQ1UBavvDqVFq4m3nBPbs5KEcK3c9iPJtHigVCNpaz"),
            payer: signer.publicKey,
			collectionMint: new PublicKey("4ux5PLuiGPGdWiWzg6zhxFFcCuiZjTf51HvVuNMWmgQV"),
			collection:new PublicKey("FWiQ1UBavvDqVFq4m3nBPbs5KEcK3c9iPJtHigVCNpaz"),
			collectionMasterEditionAccount: metadataAccount,
		},
	)

	

    // const veriy_collection_ix = createSetAndVerifySizedCollectionItemInstruction({
    //     collection: metadataAccount,
    //     collectionAuthority: signer.publicKey,
    //     collectionMasterEditionAccount: collectionMasterEdition,
    //     collectionAuthorityRecord: undefined,
    //     payer: signer.publicKey,
    //     metadata,
    //     collection: new PublicKey(collection),
    //     updateAuthority: signer.publicKey,
    //   });

    // verify_collection_instruction.keys.map((key)=>{console.log(key.pubkey.toString())})

    // const verify_tx = new web3.Transaction({feePayer: signer.publicKey}).add(verify_collection_instruction)
    // console.log(verify_tx)   

	// const owners = await connection.getTokenLargestAccounts(new PublicKey("4ux5PLuiGPGdWiWzg6zhxFFcCuiZjTf51HvVuNMWmgQV"))

	// console.log(owners.value.at(0).address.toString())
	
	// // await web3.sendAndConfirmRawTransaction(c)
    // // let t = web3.sendAndConfirmTransaction(connection, verify_tx, [signer])
	// // await connection.sendTransaction(verify_tx, [signer, minter])
	// let t = await web3.sendAndConfirmTransaction(connection, verify_tx, [signer])

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

main()