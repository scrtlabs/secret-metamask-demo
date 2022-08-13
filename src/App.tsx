import {
  Avatar,
  Button,
  Input,
  InputAdornment,
  InputLabel,
  Typography,
} from "@mui/material";
import BigNumber from "bignumber.js";
import React, { useEffect, useRef, useState } from "react";
import { isMobile } from "react-device-detect";
import ReactDOM from "react-dom";
import { BreakpointProvider } from "react-socks";
import { Bech32, SecretNetworkClient } from "secretjs";
import "./index.css";
import { MetamaskPanel } from "./MetamaskStuff";

const footerHeight = "1.8rem";

ReactDOM.render(
  <BreakpointProvider>
    <React.StrictMode>
      <div style={{ minHeight: `calc(100vh - ${footerHeight})` }}>
        <App />
      </div>
      <a
        href="https://SCRT.network"
        target="_blank"
        style={{
          height: footerHeight,
          backgroundColor: "#e7e7e7",
          display: "flex",
          placeContent: "center",
          placeItems: "center",
          position: "relative",
          left: 0,
          bottom: 0,
          gap: "0.3em",
          textDecoration: "none",
        }}
      >
        <Avatar src="/scrt.svg" sx={{ width: "1em", height: "1em" }} />
        <span style={{ color: "black" }}>Powered by Secret Network</span>
      </a>
    </React.StrictMode>
  </BreakpointProvider>,
  document.getElementById("root")
);

export default function App() {
  const [secretjs, setSecretjs] = useState<SecretNetworkClient | null>(null);
  const [secretAddress, setSecretAddress] = useState<string>("");
  const [scrtBalance, setScrtBalance] = useState<string>("");
  const inputAmountRef = useRef<any>("");
  const inputRecipientAddressRef = useRef<any>("");
  const [isToAddressError, setIsRecipientError] = useState<boolean>(true);
  const [isAmountError, setIsAmountError] = useState<boolean>(true);

  const updateScrtBalance = async () => {
    try {
      const response = await secretjs!.query.bank.balance({
        address: secretAddress,
        denom: "uscrt",
      });

      if (response.balance) {
        const amount = new BigNumber(response.balance.amount)
          .dividedBy(1e6)
          .toFixed();
        setScrtBalance(amount);
      }
    } catch (e) {
      console.error(`Error while trying to fetch SCRT balance:`, e);
    }
  };

  useEffect(() => {
    if (!secretjs || !secretAddress) {
      return;
    }

    const interval = setInterval(updateScrtBalance, 5_000);

    updateScrtBalance();

    return () => {
      clearInterval(interval);
    };
  }, [secretAddress, secretjs]);

  return (
    <div style={{ padding: "0.5rem" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          minHeight: "3rem",
          gap: "0.5rem",
        }}
      >
        {scrtBalance ? (
          <span style={{ paddingTop: "0.3rem" }}>{scrtBalance} SCRT</span>
        ) : null}
        <MetamaskPanel
          secretjs={secretjs}
          setSecretjs={setSecretjs}
          secretAddress={secretAddress}
          setSecretAddress={setSecretAddress}
        />
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          placeItems: "center",
          placeContent: "center",
          gap: "0.3rem",
        }}
      >
        <Typography
          variant="h3"
          component="div"
          align="center"
          sx={{ marginTop: "0.5rem" }}
        >
          Secret MetaMask
        </Typography>
        <Typography
          component="div"
          align="center"
          sx={{
            marginBottom: "0.5rem",
          }}
        >
          Sending Secret Network transactions using MetaMask is that easy.
        </Typography>
        <div style={{ width: isMobile ? "95%" : "28rem" }}>
          <div style={{ width: "100%", margin: "0.7rem 0" }}>
            <InputLabel htmlFor="recipient" variant="standard">
              Recipient
            </InputLabel>
            <Input
              id="recipient"
              placeholder="secret1..."
              onChange={() => {
                const isError = (() => {
                  try {
                    const recipientSecretAddress = Bech32.decode(
                      inputRecipientAddressRef.current.value
                    );
                    return (
                      recipientSecretAddress.prefix !== "secret" ||
                      recipientSecretAddress.data.length !== 20
                    );
                  } catch (e) {
                    return true;
                  }
                })();

                setIsRecipientError(isError);
              }}
              fullWidth
              autoComplete="off"
              type="text"
              inputRef={inputRecipientAddressRef}
            />
          </div>
          <div style={{ width: "100%" }}>
            <InputLabel htmlFor="amount" variant="standard">
              Amount
            </InputLabel>
            <Input
              id="amount"
              autoFocus
              onChange={() => {
                const isNotPositive = !(
                  Number(inputAmountRef.current.value) > 0
                );
                const isAboveBalance =
                  Number(inputAmountRef.current.value) + 0.002 >
                  Number(scrtBalance);

                // fee = 20k gas * 0.1uscrt = 2000usrct = 0.002 SCRT

                setIsAmountError(isNotPositive || isAboveBalance);
              }}
              fullWidth
              autoComplete="off"
              type="text"
              inputRef={inputAmountRef}
              endAdornment={
                <InputAdornment position="end">SCRT</InputAdornment>
              }
            />
          </div>
        </div>
        <div style={{ marginTop: "1rem" }}>
          <Button
            disabled={secretAddress === "" || isToAddressError || isAmountError}
            variant="contained"
            sx={{
              padding: "0.5em 0",
              width: "10em",
              fontWeight: "bold",
              fontSize: "1.2em",
            }}
            onClick={() => {
              // if (availableBalance === "") {
              //   return;
              // }
              // const prettyBalance = new BigNumber(availableBalance)
              //   .dividedBy(`1e${token.decimals}`)
              //   .toFormat();
              // if (prettyBalance === "NaN") {
              //   return;
              // }
              // inputAmountRef.current.value = "";
              // inputToRef.current.value = "";
            }}
          >
            Send Tokens
          </Button>
        </div>
      </div>
    </div>
  );
}
