

import { Text, FlatList } from "react-native";
import tw from "twrnc";

import { Screen } from "../components/Screen";
//import { useConnection, usePublicKey, usePublicKeys, useSolanaConnection } from "../hooks/xnft-hooks";
import { PublicKey, SystemProgram, Transaction, TransactionInstruction } from "@solana/web3.js";
import { useSolanaConnection, usePublicKeys, } from "react-xnft";
import { useEffect, useState } from "react";
import { Buffer } from 'buffer';
import { Button, View , Image } from "react-native";
import { TransactionRequestURL, parseURL } from "@solana/pay";

type CnftInfo = {
  title: string,
  image: string,
  url: string
}

async function fetchData() {
  const url = `https://solandy-cnft-minting-service.vercel.app/api/current`;
  const headers = {}
  return fetch(url, {mode: "cors"}).then((r) => {
    console.log(r);
    return r.json()
  });
}

function useCnftData() {
  const [loading, setLoading] = useState(true);
  const [cnftdata, setData] = useState<CnftInfo>();

  useEffect(() => {
    async function fetch() {
      console.log("start fetch")
      setLoading(true);
      const data = await fetchData();
      console.log("data", data);
      setData(data);
      setLoading(false);
      console.log("done")
    }

    fetch();
  }, []);

  return { cnftdata, loading };
}

export function MintScreen() {

  const { cnftdata, loading } = useCnftData();
  const [signature, setSignature] = useState("");
  const [pk, setPk] = useState<PublicKey>();

  const pks = usePublicKeys() as unknown as {solana: string};
  useEffect(() => {
    const pkt = pks ? new PublicKey(pks?.solana) : undefined;
    setPk(pkt);
  }, [pks]);
  
  
  const connection = useSolanaConnection();

  const onButtonClick = async () => {

    if(!pk){
      console.log("NO PUBKEY!");
      return;
    }
    if(!cnftdata){
      console.log("no cnft info present!")
      return;
    }

    const tx = await getSolanaPayTransaction(cnftdata.url, pk, false);

    if(!tx){
      console.log("could not get transaction!")
      return;
    }

    const sx = await window.xnft.solana.send(tx);
    console.log("signature: "+ sx);
    setSignature(sx);
  }

  return (
    <Screen>
      <Text style={tw`mb-4`}>
        Get yourself a piece of my collection:
      </Text>
      
      { cnftdata ?
      <View style={tw`w-full h-3/4`}>
        <Image source={{ uri: cnftdata.image }} style={tw`w-fit h-4/5 aspect-auto`} />
        <Text style={tw`mb-4 text-xl font-semibold text-center`}>
          {cnftdata.title} 
        </Text>
      </View>
       : 
       <Text style={tw`mb-4`}>
       {loading? "loading..." : "something went wrong!"}
      </Text>
      }
      <button onClick={onButtonClick}>
        MINT
      </button>
      { signature?
      <Text style={tw`mb-4`}>
        Signature: {signature} 
      </Text>
      :<></>}
    </Screen>
  );
}



type SolanaPayResponse = {
  transaction: string;
  message?: string;
};
async function requestTransaction(url: string, pk: PublicKey, verbose = false): Promise<SolanaPayResponse | null> {
  const trurl = parseURL(url) as TransactionRequestURL;
  
  if(verbose)
      console.log(trurl.link.href)
try {
  const response = await fetch(trurl.link.href, {
    method: 'POST',
    // mode: "cors",
    body: JSON.stringify({
      account: pk.toBase58(),
    }),
    headers: {
      'Content-Type': 'application/json',
      "Accept-Encoding": 'application/json',
    },
  });

  if (!response.ok) {
    console.log(response)
    throw new Error(`Error! status: ${response.status}`);
  }

  const result = (await response.json()) as SolanaPayResponse;

  if(verbose)
      console.log(JSON.stringify(result, null, 4));

  return result;
} catch (error) {
  if (error instanceof Error) {
    console.log('error message: ', error.message);
    console.log(error)
    return null;
  } else {
    console.log('unexpected error: ', error);
    return null;
  }
}
}

export async function getSolanaPayTransaction(url: string, pk: PublicKey, verbose=false ) : Promise<Transaction|undefined> {
  const rawTX = await requestTransaction(url, pk, verbose);
  if(!rawTX || !rawTX.transaction){
      console.log("no transaction found! ")
      return;
  }
  try{
      
      const tx = Transaction.from(Buffer.from(rawTX.transaction, 'base64'));
      
      if(verbose)
          console.log(JSON.stringify(tx, null, 4))

      let signatureReqired = false;
      tx.signatures.forEach(spair => {
          if(spair.publicKey.equals(pk)){
              signatureReqired = true;
          } else {
              if(!spair.signature){
                  console.log("Fatal: missing signature for "+spair.publicKey.toBase58());
                  return;
              }
          }
      });
      
      if(verbose)
          console.log(tx.signatures)
      
      return tx;

  } catch (error) {
      console.log("error: "+error)
      if(verbose){
        console.trace();
      }
  }
}