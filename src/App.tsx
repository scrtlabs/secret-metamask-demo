import { Window as KeplrWindow } from "@keplr-wallet/types";
import { Avatar, Typography } from "@mui/material";
import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { BreakpointProvider } from "react-socks";
import { SecretNetworkClient } from "secretjs";
import { chains, tokens } from "./config";
import "./index.css";
import { MetamaskPanel } from "./MetamaskStuff";
import { Buffer } from "buffer";
globalThis.Buffer = Buffer;
declare global {
  interface Window extends KeplrWindow {}
}
window.addEventListener("keplr_keystorechange", () => {
  console.log("Key store in Keplr is changed. Refreshing page.");
  location.reload();
});

class ErrorBoundary extends React.Component<{}, { hasError: boolean }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any) {
    console.error(error);
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    // You can also log the error to an error reporting service
    console.error(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return <h1>Something went wrong.</h1>;
    }

    return this.props.children;
  }
}

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
  const [balances, setBalances] = useState<Map<string, string>>(new Map());
  const [prices, setPrices] = useState<Map<string, number>>(new Map());
  const [loadingCoinBalances, setLoadingCoinBalances] =
    useState<boolean>(false);

  const updateCoinBalances = async () => {
    const newBalances = new Map<string, string>(balances);

    const url = `${chains["Secret Network"].lcd}/bank/balances/${secretAddress}`;
    try {
      const response = await fetch(url);
      const result: {
        height: string;
        result: Array<{ denom: string; amount: string }>;
      } = await response.json();

      const denoms = Array.from(
        new Set(
          tokens.map((t) => t.withdrawals.map((w) => w.from_denom)).flat()
        )
      );

      for (const denom of denoms) {
        const balance =
          result.result.find((c) => c.denom === denom)?.amount || "0";

        newBalances.set(denom, balance);
      }
    } catch (e) {
      console.error(`Error while trying to query ${url}:`, e);
    }

    setBalances(newBalances);
  };

  useEffect(() => {
    if (!secretjs || !secretAddress) {
      return;
    }

    const interval = setInterval(updateCoinBalances, 10_000);

    (async () => {
      setLoadingCoinBalances(true);
      await updateCoinBalances();
      setLoadingCoinBalances(false);
    })();

    return () => {
      clearInterval(interval);
    };
  }, [secretAddress, secretjs]);

  return (
    <div style={{ padding: "0.5rem" }}>
      <div
        style={{
          display: "flex",
          placeContent: "flex-end",
          placeItems: "center",
          minHeight: "3rem",
        }}
      >
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
        }}
      >
        <Typography variant="h2" component="div" align="center">
          Get Privacy
        </Typography>
        <Typography
          component="div"
          align="center"
          sx={{
            marginBottom: "0.5rem",
          }}
        >
          Wrapping Coins as Secret Tokens immediately supercharges them with
          private balances and private transfers.
        </Typography>
      </div>
      {/* tokens.map((t) => (
        <ErrorBoundary key={t.name}>
          <TokenRow
            token={t}
            loadingCoinBalances={loadingCoinBalances}
            secretAddress={secretAddress}
            secretjs={secretjs}
            balances={balances}
            price={prices.get(t.name) || 0}
          />
        </ErrorBoundary>
      )) */}
    </div>
  );
}
