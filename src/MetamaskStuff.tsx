import { MetaMaskInpageProvider } from "@metamask/providers";
import { FileCopyOutlined } from "@mui/icons-material";
import {
  Dialog,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import Button from "@mui/material/Button";
import React, { useState } from "react";
import CopyToClipboard from "react-copy-to-clipboard";
import { isDesktop } from "react-device-detect";
import { MetaMaskWallet, SecretNetworkClient } from "secretjs";
import { chains } from "./config";
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
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);

  const content = (
    <div style={{ display: "flex", placeItems: "center", borderRadius: 10 }}>
      <img src="/MetaMask.svg" style={{ width: "1.8rem", borderRadius: 10 }} />
      <span style={{ margin: "0 0.3rem" }}>
        {secretjs
          ? isDesktop
            ? secretAddress
            : `${secretAddress.slice(0, 10)}...${secretAddress.slice(-7)}`
          : "Connect wallet"}
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
      <>
        <Button
          id="keplr-button"
          variant="contained"
          style={{ background: "white", color: "black" }}
          onClick={() =>
            setupMetamask(setSecretjs, setSecretAddress, setIsDialogOpen)
          }
        >
          {content}
        </Button>
        <Dialog open={isDialogOpen}>
          <DialogTitle>Secret Address</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Requesting Secret address from MetaMask...
            </DialogContentText>
          </DialogContent>
        </Dialog>
      </>
    );
  }
}

async function setupMetamask(
  setSecretjs: React.Dispatch<React.SetStateAction<SecretNetworkClient | null>>,
  setSecretAddress: React.Dispatch<React.SetStateAction<string>>,
  setIsDialogOpen: React.Dispatch<React.SetStateAction<boolean>>
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

  const ethPubkey = localStorage.getItem(`secretjs_${ethAddress}_pubkey`);
  setIsDialogOpen(!ethPubkey);

  const wallet = await MetaMaskWallet.create(window.ethereum, ethAddress);

  setIsDialogOpen(false);

  const secretjs = await SecretNetworkClient.create({
    grpcWebUrl: SECRET_RPC,
    chainId: SECRET_CHAIN_ID,
    wallet: wallet,
    walletAddress: wallet.address,
  });

  setSecretAddress(wallet.address);
  setSecretjs(secretjs);
}
