import { FileCopyOutlined } from "@mui/icons-material";
import Button from "@mui/material/Button";
import React, { useState } from "react";
import CopyToClipboard from "react-copy-to-clipboard";
import {
  fromHex,
  pubkeyToAddress,
  SecretNetworkClient,
  toHex,
  MetaMaskSigner,
} from "secretjs";
import { chains } from "./config";
import { sha256 } from "@noble/hashes/sha256";
import * as secp256k1 from "@noble/secp256k1";

import { MetaMaskInpageProvider } from "@metamask/providers";
declare global {
  interface Window {
    ethereum: MetaMaskInpageProvider;
  }
}

const SECRET_CHAIN_ID = chains["Secret Network"].chain_id;
const SECRET_RPC = chains["Secret Network"].rpc;

export function MetamaskPanel({
  secretjs,
  setSecretjs,
  secretAddress,
  setSecretAddress,
}: {
  secretjs: SecretNetworkClient | null;
  setSecretjs: React.Dispatch<React.SetStateAction<SecretNetworkClient | null>>;
  secretAddress: string;
  setSecretAddress: React.Dispatch<React.SetStateAction<string>>;
}) {
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const content = (
    <div style={{ display: "flex", placeItems: "center", borderRadius: 10 }}>
      <img src="/MetaMask.svg" style={{ width: "1.8rem", borderRadius: 10 }} />
      <span style={{ margin: "0 0.3rem" }}>
        {secretjs ? secretAddress : "Connect wallet"}
      </span>
    </div>
  );

  if (secretjs) {
    return (
      <CopyToClipboard
        text={secretAddress}
        onCopy={() => {
          setIsCopied(true);
          setTimeout(() => setIsCopied(false), 3000);
        }}
      >
        <Button
          variant="contained"
          style={{
            background: "white",
            textTransform: "none",
            color: "black",
          }}
        >
          {content}{" "}
          <FileCopyOutlined
            fontSize="small"
            style={isCopied ? { fill: "green" } : undefined}
          />
        </Button>
      </CopyToClipboard>
    );
  } else {
    return (
      <Button
        id="keplr-button"
        variant="contained"
        style={{ background: "white", color: "black" }}
        onClick={() => setupMetamask(setSecretjs, setSecretAddress)}
      >
        {content}
      </Button>
    );
  }
}

async function setupMetamask(
  setSecretjs: React.Dispatch<React.SetStateAction<SecretNetworkClient | null>>,
  setSecretAddress: React.Dispatch<React.SetStateAction<string>>
) {
  const sleep = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  while (typeof window.ethereum === "undefined") {
    await sleep(50);
  }

  // @ts-ignore
  const [ethAddress] = await window.ethereum.request({
    method: "eth_requestAccounts",
  });
  console.log("ethAddress", ethAddress);

  let pubkeyHex = localStorage.getItem(ethAddress);
  let pubkey: Uint8Array;

  if (pubkeyHex) {
    pubkey = fromHex(pubkeyHex);
  } else {
    const msgHash = sha256("blabla");
    // @ts-ignore
    const sigResult: string = await window.ethereum.request({
      method: "eth_sign",
      params: [ethAddress, "0x" + toHex(msgHash)],
    });

    const sig = fromHex(sigResult.slice(2, -2));
    const recoveryBit = parseInt(sigResult.slice(-2), 16) - 27;

    pubkey = secp256k1.recoverPublicKey(msgHash, sig, recoveryBit, true);

    if (!localStorage.getItem(ethAddress)) {
      localStorage.setItem(ethAddress, toHex(pubkey));
    }
  }

  const secretAddress = pubkeyToAddress(pubkey);
  console.log("secretAddress", secretAddress);

  const signer = new MetaMaskSigner(ethAddress, pubkey);

  const secretjs = await SecretNetworkClient.create({
    grpcWebUrl: SECRET_RPC,
    chainId: SECRET_CHAIN_ID,
    wallet: signer,
    walletAddress: secretAddress,
  });

  setSecretAddress(secretAddress);
  setSecretjs(secretjs);

  const tx = await secretjs.tx.bank.send(
    {
      fromAddress: secretAddress,
      toAddress: "secret1e8fnfznmgm67nud2uf2lrcvuy40pcdhrerph7v",
      amount: [{ amount: "1", denom: "uscrt" }],
    },
    { memo: "Sent using MetaMask (Assaf was here)" }
  );
  console.log(tx);
}

export async function setKeplrViewingKey(token: string) {
  if (!window.keplr) {
    console.error("Keplr not present");
    return;
  }

  await window.keplr.suggestToken(SECRET_CHAIN_ID, token);
}

export async function getKeplrViewingKey(
  token: string
): Promise<string | null> {
  if (!window.keplr) {
    console.error("Keplr not present");
    return null;
  }

  try {
    return await window.keplr.getSecret20ViewingKey(SECRET_CHAIN_ID, token);
  } catch (e) {
    return null;
  }
}
