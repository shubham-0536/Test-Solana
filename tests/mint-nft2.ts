import {
    TOKEN_PROGRAM_ID,
    createAssociatedTokenAccountInstruction,
    getAssociatedTokenAddress,
    createInitializeMintInstruction,
    MINT_SIZE,
  } from "@solana/spl-token";
import { LAMPORTS_PER_SOL, Connection, clusterApiUrl } from "@solana/web3.js";
import * as anchor from '@project-serum/anchor'
import { Program, Wallet } from '@project-serum/anchor'
import { MintNft } from '../target/types/mint_nft'
require('dotenv').config()



const { PublicKey, SystemProgram } = anchor.web3;
const TOKEN_METADATA_PROGRAM_ID = new anchor.web3.PublicKey(
        "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
      );

const url = process.env.ANCHOR_PROVIDER_URL
console.log(url)

const provider = anchor.AnchorProvider.env();
// const wallet = provider.wallet as Wallet;

anchor.setProvider(provider);
const program = anchor.workspace.MintNft

      const getMetadata = async (
        mint: anchor.web3.PublicKey
      ): Promise<anchor.web3.PublicKey> => {
        return (
          await anchor.web3.PublicKey.findProgramAddress(
            [
              Buffer.from("metadata"),
              TOKEN_METADATA_PROGRAM_ID.toBuffer(),
              mint.toBuffer(),
            ],
            TOKEN_METADATA_PROGRAM_ID
          )
        )[0];
      };
      const getMasterEdition = async (
        mint: anchor.web3.PublicKey
      ): Promise<anchor.web3.PublicKey> => {
        return (
          await anchor.web3.PublicKey.findProgramAddress(
            [
              Buffer.from("metadata"),
              TOKEN_METADATA_PROGRAM_ID.toBuffer(),
              mint.toBuffer(),
              Buffer.from("edition"),
            ],
            TOKEN_METADATA_PROGRAM_ID
          )
        )[0];
      };
const mintKey: anchor.web3.Keypair = anchor.web3.Keypair.generate();


//   console.log("NFT Account: ", NftTokenAccount.toBase58());

const main = async()=> {
    const NftTokenAccount = await getAssociatedTokenAddress(
        mintKey.publicKey,
        program.provider.publicKey
      );
    const lamports: number =
        await program.provider.connection.getMinimumBalanceForRentExemption(
          MINT_SIZE
        );
const mint_tx = new anchor.web3.Transaction().add(
    anchor.web3.SystemProgram.createAccount({
      fromPubkey: program.provider.publicKey,
      newAccountPubkey: mintKey.publicKey,
      space: MINT_SIZE,
      programId: TOKEN_PROGRAM_ID,
      lamports,
    }),
    createInitializeMintInstruction(
      mintKey.publicKey,
      0,
      program.provider.publicKey,
      program.provider.publicKey
    ),
    createAssociatedTokenAccountInstruction(
      program.provider.publicKey,
      NftTokenAccount,
      program.provider.publicKey,
      mintKey.publicKey
    )
  );
  console.log(mint_tx)
const res = await program.provider.sendAndConfirm(mint_tx, [mintKey]);
  console.log(
    await program.provider.connection.getParsedAccountInfo(mintKey.publicKey)
  );
  console.log("Account: ", res);
  console.log("Mint key: ", mintKey.publicKey.toString());
  console.log("User: ", program.provider.publicKey.toString());
  const metadataAddress = await getMetadata(mintKey.publicKey);
  const masterEdition = await getMasterEdition(mintKey.publicKey);
  console.log("Metadata address: ", metadataAddress.toBase58());
  console.log("MasterEdition: ", masterEdition.toBase58());

  const tx = await program.rpc.mintNft(
    mintKey.publicKey,
    "https://arweave.net/y5e5DJsiwH0s_ayfMwYk-SnrZtVZzHLQDSTZ5dNRUHA",
    "NFT Title",
    {
      accounts: {
        mintAuthority: program.provider.publicKey,
        mint: mintKey.publicKey,
        tokenAccount: NftTokenAccount,
        tokenProgram: "7aHg2BTF4qbPAshogMVRa8S2qFymE1yTjMWuabRZKcmh",
        metadata: metadataAddress,
        tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
        payer: program.provider.publicKey,
        systemProgram: SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        masterEdition: masterEdition,
      },
    }
  );
  console.log("Your transaction signature", tx);
}
main()

// module.exports = [main]