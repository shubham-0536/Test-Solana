import { clusterApiUrl, Connection, Keypair, PublicKey } from "@solana/web3.js";
import {  } from "@solana/spl-token";

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
// import secret from "./guideSecret.json" assert { type: "json" };

import {Program,AnchorProvider, web3, utils, BN, Wallet } from "@project-serum/anchor";
import { bs58 } from "@project-serum/anchor/dist/cjs/utils/bytes";


// Solana Address: HbpVkLGZnQcmFvm64eZjP7KidHSVUb9o6ELN2BkXDYjS

const QUICKNODE_RPC =
  "";
const SESSION_HASH = "QNDEMO" + Math.ceil(Math.random() * 1e9); // Random unique identifier for your session
const network = clusterApiUrl("devnet");

const SOLANA_CONNECTION = new Connection(network);

const walletSecretKey =
  "4pX4jJvbYvR8ZaMYRYpvcxMDHLJ3gP6nfTJAbt3uWMGP7cRfXAknN83qGSxJ9YBfGE8RN3QkxnGMUAPBrfg7uUoa";

const WALLET = web3.Keypair.fromSecretKey(bs58.decode(walletSecretKey));

const NFT_METADATA =
  "https://storage.googleapis.com/sfmtest2/nftDrop3/metadata.json";
const COLLECTION_NFT_MINT = "EJQTQh1o4h82tbDknVVgBtJJgKmpT2PyoKodbNbNc8EU";
const CANDY_MACHINE_ID = "Cnha2uaW6WEK5YTAWgKELtRnDbBmUFAUYhQ9zWkNmqd7";
const solanaAddress = "EzsgrNPTsztjRgLF6EpWLHEJ5dTsRkKbMLjraieeLf3a"

const METAPLEX = Metaplex.make(SOLANA_CONNECTION);

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
    maxEditionSupply: toBigNumber(1), // 0 reproductions of each NFT allowed
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

// async function mintNft() {
//   const candyMachine = await METAPLEX.candyMachines().findByAddress({
//     address: new PublicKey(CANDY_MACHINE_ID),
//   });
//   let { nft, response } = await METAPLEX.candyMachines().mint(
//     {
//       candyMachine,
//       collectionUpdateAuthority: WALLET.publicKey,
//       owner: new PublicKey(solanaAddress)
//     },
//     { commitment: "finalized" },
//     {
//       payer: new PublicKey(solanaAddress)
//     }
//   );
//   console.log("nft ", nft);
//   console.log("response ", response);

//   console.log(`✅ - Minted NFT: ${nft.address.toString()}`);
//   console.log(
//     `     https://explorer.solana.com/address/${nft.address.toString()}?cluster=devnet`
//   );
//   console.log(
//     `     https://explorer.solana.com/tx/${response.signature}?cluster=devnet`
//   );
// }


async function getCandyMachineState(){

  const state = await METAPLEX.candyMachines().findByAddress({
    address: new PublicKey(CANDY_MACHINE_ID),
  });

  console.log(state.itemsAvailable.toString())

  console.log(state.itemsLoaded)


  const [guards] = state.candyGuard.groups.filter(group=>{
    if(group.label === 'Pre')
      return group.guards
  })

  // console.log(guards.guards.allowList.merkleRoot)
//   const g = guards.filter(function( element ) {
//     return element !== undefined;
//  });

//  console.log(g)
  // const itemsAvailable = state.data.itemsAvailable.toNumber();
  // const itemsRedeemed = state.itemsRedeemed.toNumber();
  // const itemsRemaining = itemsAvailable - itemsRedeemed;

  // const publicSaleStartTime = state.candyGuard.guards.startDate.date
  // console.log(toDateTime(publicSaleStartTime).toString(), new Date().valueOf()/1000)


  // // console.log(new Date(publicSaleStartTime) > new Date(new Date().toUTCString()))
  
  //   console.log(Number(state.candyGuard.guards.solPayment.amount.basisPoints)*Number(state.itemsMinted))
}
    // state: {
    //   itemsAvailable: state.itemsAvailable,
    //   itemsRedeemed: state.,
    //   itemsRemaining,
    //   isSoldOut: itemsRemaining === 0,
    //   isActive: false,
    //   isPresale: false,
    //   isWhitelistOnly: false,
    //   goLiveDate: state.data.goLiveDate,
    //   treasury: state.wallet,
    //   tokenMint: state.tokenMint,
    //   gatekeeper: state.data.gatekeeper,
    //   endSettings: state.data.endSettings,
    //   whitelistMintSettings: state.data.whitelistMintSettings,
    //   hiddenSettings: state.data.hiddenSettings,
    //   price: state.data.price,
    // },


// getCandyMachineState()


async function owner(){

  const tokenMint = "G2hq2a9iVtAgm9xZMwr7TfsGrZ4kex1Q1oKwbnBj4PNz"

  // const largestAccounts = await METAPLEX.nfts().findAllByCreator({creator: new PublicKey("DYFCo2Agj4dNta4VLwLQiLbfw5E2dHbzSafJx5Uzpav6")});

  // console.log(largestAccounts)
  // const nfts = await METAPLEX.candyMachinesV2().findMintedNfts({ candyMachine: new PublicKey("6L9H7ewwHRZHNm1XfnQSHMYSmmfSgfG4fAukBJrq5GWv") });

  // console.log(nfts)

  const largestAccounts = await SOLANA_CONNECTION.getTokenLargestAccounts(
    new PublicKey(tokenMint)
  );
  const largestAccountInfo = await SOLANA_CONNECTION.getParsedAccountInfo(
    largestAccounts.value[0].address
  );
  const data = largestAccountInfo.value.data['parsed']
  console.log(Number(data.info.tokenAmount.amount));
  console.log( PublicKey.isOnCurve(tokenMint))

  let tokenAccountInfo = await SOLANA_CONNECTION.getAccountInfo(
    new PublicKey(tokenMint),
    "confirmed")

  console.log(tokenAccountInfo?.data)

}


// (async () => {

//   let tokenAccountInfo = await SOLANA_CONNECTION.getAccountInfo(
//     new PublicKey(mintKeyPair.toString()),
//     "confirmed",
//   );

//   console.log(tokenAccountInfo)
  
// })();

owner()

// createCollectionNft();
// generateCandyMachine();
// updateCandyMachine()
// addItems();
// getMetaData();
// console.log("*********************");
// await mintNft()
// console.log("*********************");
// await getMetaData()
