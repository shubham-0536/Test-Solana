import {
  isCandyMachineV2,
  SOL,
  sol,
  toBigNumber,
  toCandyMachineV2InstructionData,
  toPublicKey,
} from "@metaplex-foundation/js";
import { createInitializeCandyMachineInstruction, initializeCandyMachineStruct,  PROGRAM_ADDRESS } from "@metaplex-foundation/mpl-candy-machine";
import { web3 } from "@project-serum/anchor";
import { bs58 } from "@project-serum/anchor/dist/cjs/utils/bytes";
import { MintLayout } from "@solana/spl-token";
import { clusterApiUrl, Connection, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { SystemProgram, PublicKey } from "@solana/web3.js";
import { BN } from "bn.js";
import { v4 as uuidv4 } from "uuid";

const MAX_NAME_LENGTH = 32;
const MAX_SYMBOL_LENGTH = 10;
const MAX_URI_LENGTH = 200;
const MAX_CREATOR_LIMIT = 5;
const MAX_CREATOR_LEN = 32 + 1 + 1;
const CONFIG_LINE_SIZE = 4 + MAX_NAME_LENGTH + 4 + MAX_URI_LENGTH;
const CONFIG_ARRAY_START =
  8 + // key
  32 + // authority
  32 + // wallet
  33 + // token mint
  4 +
  6 + // uuid
  8 + // price
  8 + // items available
  9 + // go live
  10 + // end settings
  4 +
  MAX_SYMBOL_LENGTH + // u32 len + symbol
  2 + // seller fee basis points
  4 +
  MAX_CREATOR_LIMIT * MAX_CREATOR_LEN + // optional + u32 len + actual vec
  8 + // max supply
  1 + // is mutable
  1 + // retain authority
  1 + // option for hidden setting
  4 +
  MAX_NAME_LENGTH + // name length,
  4 +
  MAX_URI_LENGTH + // uri length,
  32 + // hash
  4 + // max number of lines;
  8 + // items redeemed
  1 + // whitelist option
  1 + // whitelist mint mode
  1 + // allow presale
  9 + // discount price
  32 + // mint key for whitelist
  1 +
  32 +
  1; // gatekeeper

const walletSecretKey =
  "3nJSV7qUVxLonUPAahBUthS664s3CX4WnouDh6SmfRiDirUjhnwsP5JMbvBjCEtimF1rpGb3cYw3ErjR3byq8rjN";

const signer = web3.Keypair.fromSecretKey(bs58.decode(walletSecretKey));
console.log(signer.publicKey.toString());

const network = clusterApiUrl("devnet");
// const opts ={
//     preflightCommitment: "processed"
//   }

const connection = new Connection(network);

async function createCandyMachine(connection) {
  const rent_candy = await connection.getMinimumBalanceForRentExemption(
    MintLayout.span
  );
  const candy = web3.Keypair.generate();
  console.log(candy.publicKey.toString());

  const args = {
    data: {
      uuid: uuidv4(),
      price: new BN(1),
      symbol: "CANDY",
      sellerFeeBasisPoints: 250,
      maxSupply: new BN(10),
      isMutable: true,
      retainAuthority: false,
      goLiveDate: null,
      endSettings: null,
      creators: [{ address: signer.publicKey, share: 100, verified: false }],
      hiddenSettings: null,
      whitelistMintSettings: null,
      itemsAvailable: new BN(1),
      gatekeeper: null,
    },
  };
  console.log("args ", args);
  try {
    const candy_tx = new web3.Transaction().add(
      SystemProgram.createAccount({
        fromPubkey: signer.publicKey,
        newAccountPubkey: candy.publicKey,
        space: getCandyMachineV2AccountSizeFromData(args),
        lamports: await connection.getMinimumBalanceForRentExemption(
          getCandyMachineV2AccountSizeFromData(args)
        ),
        programId: new PublicKey(PROGRAM_ADDRESS),
      }),
      createInitializeCandyMachineInstruction(
        {
          candyMachine: candy.publicKey,
          wallet: signer.publicKey,
          authority: signer.publicKey,
          payer: signer.publicKey,
          systemProgram: SystemProgram.programId,
          rent: new PublicKey(SYSVAR_RENT_PUBKEY),
        },
        args
      ));

    candy_tx.feePayer = signer.publicKey;
    
    console.log("candy_tx ", candy_tx);
    let x = await web3.sendAndConfirmTransaction(connection, candy_tx, [
      candy,
      signer,
    ]);
    console.log(x);
  } catch (err) {
    console.log(err);
  }
}

  function getCandyMachineV2AccountSizeFromData(data) {
    if (data.hiddenSettings != null) {
      return CONFIG_ARRAY_START;
    }
    const itemsAvailable = toBigNumber(data.itemsAvailable).toNumber();
    return Math.ceil(
      CONFIG_ARRAY_START +
        4 +
        itemsAvailable * CONFIG_LINE_SIZE +
        8 +
        2 * (itemsAvailable / 8 + 1)
    );
  }


createCandyMachine(connection);
