

import { Text, FlatList } from "react-native";
import tw from "twrnc";

import { Screen } from "../components/Screen";
//import { useConnection, usePublicKey, usePublicKeys, useSolanaConnection } from "../hooks/xnft-hooks";
import { PublicKey, SystemProgram, Transaction, TransactionInstruction } from "@solana/web3.js";
import { useSolanaConnection, usePublicKeys, Button, View , Image} from "react-xnft";
import { useEffect, useState } from "react";
import { Buffer } from 'buffer';

type CnftInfo = {
  title: string,
  image: string
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
  const [blockhash, setBlockhash] = useState("");
  const [signature, setSignature] = useState("");

  const receiver = new PublicKey("AndyaySnmjXM9hxht24vytt3SJdsW6ZfXL5NEgbTMfEU");

  const pks = usePublicKeys() as unknown as {solana: string};
  let pksString: string = "No pubkeys available!"
  const pk = pks ? new PublicKey(pks?.solana) : undefined;
  if(pk){
      pksString = pk.toBase58();
  }
  
  const connection = useSolanaConnection();

  const onButtonClick = async () => {
    
    const bh = (await connection.getLatestBlockhash()).blockhash;
    setBlockhash(bh);

    if(!pk){
      console.log("NO PUBKEY!");
      return;
    }
    
    // const ix = SystemProgram.transfer({
    //   fromPubkey: pk,
    //   toPubkey: receiver,
    //   lamports: 1000000
    // });
    const data = Buffer.alloc(4+8);
    data.writeUInt32LE(2,0); // transfer instruction descriminator
    data.writeUInt32LE(1000000,4); // lamports
    data.writeUInt32LE(0,8); // lamports (upper part, because can't write u64)
    const ix = new TransactionInstruction({
      keys: [
        {
            pubkey: pk,
            isSigner: true,
            isWritable: true
        },
        {
            pubkey: receiver,
            isSigner: false,
            isWritable: true
        },
        {
            pubkey: SystemProgram.programId,
            isSigner: false,
            isWritable: false
        },
      ],
      programId: SystemProgram.programId,
      data: data
  });
    const tx = new Transaction();
    tx.add(ix);

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
      <View>
        <Image src={cnftdata.image} style={{
                    borderRadius: "6px",
                    width: "157.5px",
                  }}>
        </Image>
        <Text style={tw`mb-4`}>
          Title: {cnftdata.title} 
        </Text>
      </View>
       : 
       <Text style={tw`mb-4`}>
       {loading? "loading..." : "something went wrong!"}
      </Text>
      }
      <Button onClick={onButtonClick}>
        Click me!
      </Button>
      { signature?
      <Text style={tw`mb-4`}>
        Signature: {signature} 
      </Text>
      :<></>}
    </Screen>
  );
}
