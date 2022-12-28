import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import {
  Metaplex,
  keypairIdentity,
  // bundlrStorage,
  // toMetaplexFile,
  toBigNumber,
  // CreateCandyMachineInput,
  // DefaultCandyGuardSettings,
  // CandyMachineItem,
  toDateTime,
  sol,
  // TransactionBuilder,
  // CreateCandyMachineBuilderContext,
} from "@metaplex-foundation/js";
// import secret from "./guideSecret.json";
import secret from "./guideSecret.json" assert { type: "json" };

// Solana Address: HbpVkLGZnQcmFvm64eZjP7KidHSVUb9o6ELN2BkXDYjS

const QUICKNODE_RPC =
  "";
const SESSION_HASH = "QNDEMO" + Math.ceil(Math.random() * 1e9); // Random unique identifier for your session
const SOLANA_CONNECTION = new Connection(QUICKNODE_RPC, {
  commitment: "finalized",
  httpHeaders: { "x-session-hash": SESSION_HASH },
});

const WALLET = Keypair.fromSecretKey(new Uint8Array(secret));
const NFT_METADATA =
  "https://storage.googleapis.com/sfmtest2/nftDrop3/metadata.json";
const COLLECTION_NFT_MINT = "EJQTQh1o4h82tbDknVVgBtJJgKmpT2PyoKodbNbNc8EU";
const CANDY_MACHINE_ID = "Fyzb1cT5k5MfdgTexfmRLfaJhFMJr4TY4vcQk5fsckCu";
const solanaAddress = "EzsgrNPTsztjRgLF6EpWLHEJ5dTsRkKbMLjraieeLf3a"

const METAPLEX = Metaplex.make(SOLANA_CONNECTION).use(keypairIdentity(WALLET));

async function createCollectionNft() {
  const { nft: collectionNft } = await METAPLEX.nfts().create({
    name: "Solana Demo NFT Collection",
    uri: NFT_METADATA,
    sellerFeeBasisPoints: 0,
    isCollection: true,
    updateAuthority: WALLET,
  });

  console.log(
    `✅ - Minted Collection NFT: ${collectionNft.address.toString()}`
  );
  console.log(
    `     https://explorer.solana.com/address/${collectionNft.address.toString()}?cluster=devnet`
  );
}

async function generateCandyMachine() {
  const candyMachineSettings = {
    itemsAvailable: toBigNumber(3), // Collection Size: 3
    sellerFeeBasisPoints: 1000, // 10% Royalties on Collection
    symbol: "DEMO",
    maxEditionSupply: toBigNumber(0), // 0 reproductions of each NFT allowed
    isMutable: true,
    creators: [{ address: WALLET.publicKey, share: 100 }],
    collection: {
      address: new PublicKey(COLLECTION_NFT_MINT), // Can replace with your own NFT or upload a new one
      updateAuthority: WALLET,
    },
  };
  const { candyMachine } = await METAPLEX.candyMachines().create(
    candyMachineSettings
  );
  console.log(`✅ - Created Candy Machine: ${candyMachine.address.toString()}`);
  console.log(
    `     https://explorer.solana.com/address/${candyMachine.address.toString()}?cluster=devnet`
  );
}

async function updateCandyMachine() {
  const candyMachine = await METAPLEX.candyMachines().findByAddress({
    address: new PublicKey(CANDY_MACHINE_ID),
  });

  const { response } = await METAPLEX.candyMachines().update({
    candyMachine,
    guards: {
      startDate: { date: toDateTime("2022-12-14T16:00:00Z") },
      mintLimit: {
        id: 1,
        limit: 2,
      },
      solPayment: {
        amount: sol(0.1),
        destination: METAPLEX.identity().publicKey,
      },
    },
  });
  console.log(response);

  console.log(`✅ - Updated Candy Machine: ${CANDY_MACHINE_ID}`);
  console.log(
    `     https://explorer.solana.com/tx/${response.signature}?cluster=devnet`
  );
}

async function addItems() {
  const candyMachine = await METAPLEX.candyMachines().findByAddress({
    address: new PublicKey(CANDY_MACHINE_ID),
  });
  const items = [];
  for (let i = 0; i < 3; i++) {
    // Add 3 NFTs (the size of our collection)
    items.push({
      name: `QuickNode Demo NFT # ${i + 1}`,
      uri: NFT_METADATA,
    });
  }
  const { response } = await METAPLEX.candyMachines().insertItems(
    {
      candyMachine,
      items: items,
    },
    { commitment: "finalized" }
  );

  console.log(`✅ - Items added to Candy Machine: ${CANDY_MACHINE_ID}`);
  console.log(
    `     https://explorer.solana.com/tx/${response.signature}?cluster=devnet`
  );
}

async function getMetaData() {
  const candyMachine = await METAPLEX.candyMachines().findByAddress({
    address: new PublicKey(CANDY_MACHINE_ID),
  });

  console.log(candyMachine.address.toString()); // The public key of the Candy Machine account.
  console.log(candyMachine.itemsAvailable.toString()); // Number of NFTs available.
  console.log(candyMachine.itemsMinted.toString()); // Number of NFTs minted.
  console.log(candyMachine.itemsRemaining.toString()); // Number of NFTs left to mint.
  console.log(candyMachine.items[0].index); // The index of the first loaded item.
  console.log(candyMachine.items[0].name); // The name of the first loaded item (with prefix).
  console.log(candyMachine.items[0].uri); // The URI of the first loaded item (with prefix).
  console.log(candyMachine.items[2].minted); // Whether the first item has been minted.
}

async function mintNft() {
  const candyMachine = await METAPLEX.candyMachines().findByAddress({
    address: new PublicKey(CANDY_MACHINE_ID),
  });
  let { nft, response } = await METAPLEX.candyMachines().mint(
    {
      candyMachine,
      collectionUpdateAuthority: WALLET.publicKey,
      owner: new PublicKey(solanaAddress)
    },
    { commitment: "finalized" },
    {
      payer: new PublicKey(solanaAddress)
    }
  );
  console.log("nft ", nft);
  console.log("response ", response);

  console.log(`✅ - Minted NFT: ${nft.address.toString()}`);
  console.log(
    `     https://explorer.solana.com/address/${nft.address.toString()}?cluster=devnet`
  );
  console.log(
    `     https://explorer.solana.com/tx/${response.signature}?cluster=devnet`
  );
}

// createCollectionNft();
// generateCandyMachine();
// updateCandyMachine()
// addItems();
// getMetaData();
// console.log("*********************");
await mintNft()
console.log("*********************");
await getMetaData()
