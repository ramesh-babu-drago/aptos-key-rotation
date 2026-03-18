/* eslint-disable no-console */
import "dotenv/config";

import {
  Account,
  AccountAddress,
  Aptos,
  AptosConfig,
  Ed25519Account,
  Ed25519PrivateKey,
  Network,
  NetworkToNetworkName,
} from "@aptos-labs/ts-sdk";

const WIDTH = 16;

const APTOS_NETWORK: Network = NetworkToNetworkName[process.env.APTOS_NETWORK ?? Network.DEVNET];
const config = new AptosConfig({ network: APTOS_NETWORK });
const aptos = new Aptos(config);

function truncate(address: AccountAddress): string {
  return `${address.toString().substring(0, 6)}...${address
    .toString()
    .substring(address.toString().length - 4, address.toString().length)}`;
}

function formatAccountInfo(account: Ed25519Account): string {
  const vals: any[] = [account.accountAddress, account.publicKey.authKey(), account.privateKey, account.publicKey];
  return vals.map((v) => truncate(v).padEnd(WIDTH)).join(" ");
}

(async () => {
  const oldAccountPrivateKey = Account.fromPrivateKey({ privateKey: new Ed25519PrivateKey(process.env.OLD_ACCOUNT_PRIVATE_KEY!) });
  const newAccountPrivateKey = Account.fromPrivateKey({ privateKey: new Ed25519PrivateKey(process.env.NEW_ACCOUNT_PRIVATE_KEY!) });

  console.log(
    `\n${"Account".padEnd(WIDTH)} ${"Address".padEnd(WIDTH)} ${"Auth Key".padEnd(WIDTH)} ${"Private Key".padEnd(
      WIDTH,
    )} ${"Public Key".padEnd(WIDTH)}`,
  );
  console.log("---------------------------------------------------------------------------------");
  console.log(`${"old".padEnd(WIDTH)} ${formatAccountInfo(oldAccountPrivateKey)}`);
  console.log(`${"new".padEnd(WIDTH)} ${formatAccountInfo(newAccountPrivateKey)}`);
  console.log("\n...rotating...".padStart(WIDTH));

  // Rotate the key!
  const transaction = await aptos.rotateAuthKey({ fromAccount: oldAccountPrivateKey, toNewPrivateKey: newAccountPrivateKey.privateKey });
  await aptos.signAndSubmitTransaction({ signer: oldAccountPrivateKey, transaction });

  const oldAccountNew = Account.fromPrivateKey({ privateKey: newAccountPrivateKey.privateKey, address: oldAccountPrivateKey.accountAddress });

  console.log(`\n${"old".padEnd(WIDTH)} ${formatAccountInfo(oldAccountNew)}`);
  console.log(`${"new".padEnd(WIDTH)} ${formatAccountInfo(newAccountPrivateKey)}\n`);
})();