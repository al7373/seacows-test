import type { NextPage } from 'next'
import styles from '../styles/Home.module.scss'
import { useEffect, useRef, useState } from 'react'
import detectEthereumProvider from '@metamask/detect-provider';
import { notification } from 'antd';
import Web3 from 'web3';
import SeacowsPairABI from '../lib/abi/SeacowsPair/SeacowsPair.json';

import txDecoder from 'ethereum-tx-decoder';
import axios from 'axios';
import erc20ABI from 'erc-20-abi';

import DisplayPair from '../components/DisplayPair/DisplayPair';
import objectHash from 'object-hash';


const baseURL = '/api/my-etherscan';

const showNot = (msg, key='error') => {
  notification.open({
    message: '',
    className: `${ styles.mynot }`,
    duration: null,
    description:
      <div className={ styles.description }>
        <i></i>
        <div>
          <p>{ msg }</p>
        </div>
      </div>,
    onClick: () => {
      console.log('Notification Clicked!');
    },
    key
  });
}

const Home: NextPage = () => {

  const accountRef = useRef(null)
	const web3Ref = useRef(null)
	const testNftContractRef = useRef(null)
	const seacowsPairContractRef = useRef(null)

	const [balance, setBalance] = useState(0);
  const [readingNft, setReadingNft] = useState(false);
  const [nfts, setNfts] = useState([]);

  async function getNftMetadata(nftAddress, id){

    let { data: { result: nftABI } } = await axios.get(
      baseURL, {
      params: {
        module: 'contract',
        action: 'getabi',
        address: nftAddress,
      }
    })

    let nftContract = new web3Ref.current.eth.Contract(
      JSON.parse(nftABI),
      nftAddress
    )

    const name = await nftContract.methods.name().call()
    const tokenURI = await nftContract.methods.tokenURI(id).call()

    let { data: metadata } = await axios.get(tokenURI)

    return {
      name, tokenURI, metadata
    }

  }

  async function readNft(){

      let seacowsPairContract = new web3Ref.current.eth.Contract(
        SeacowsPairABI,
        '0x1c9f47f8c42c3a8be36dcbe3d49e365b8099c7df'
      );

      let factory = await seacowsPairContract.methods.factory().call()

      console.log("factory", factory)


      let { data: { result } } = await axios.get(
        baseURL, {
        params: {
          module: 'account',
          action: 'txlist',
          address: factory,
          startblock: 0,
          endblock: 99999999,
          page: 1,
          offset: 10,
          sort: 'desc',
        }
      })

      let { data: { result: factoryABI } } = await axios.get(
        baseURL, {
        params: {
          module: 'contract',
          action: 'getabi',
          address: factory,
        }
      })

      factoryABI = JSON.parse(factoryABI)
    
      let fnDecoder = new txDecoder.FunctionDecoder(factoryABI);

      result = result.filter(({functionName, isError}) => 
        (functionName.startsWith('createPairERC20') || functionName.startsWith('createPairETH')) && 
        isError === "0"
      )

      result.splice(2)//deletes other results otherwise takes a long time. only 2 nfts.

      let endResults = [];

      for(let i = 0; i < result.length; i++){

        let example = result[i];
        let decodedInput = fnDecoder.decodeFn(example.input);

        if(example.functionName.startsWith('createPairERC20')){

          const token = new web3Ref.current.eth.Contract(erc20ABI, decodedInput.params.token)

          
          for(let i = 0; i < decodedInput.params.initialNFTIDs.length; i++){
            const nftId = decodedInput.params.initialNFTIDs[i];
            const metadata = await getNftMetadata(decodedInput.params.nft, nftId)
            endResults.push({
              "key": objectHash(decodedInput) + "_" + nftId,
              "nftId": nftId,
              "nft": decodedInput.params.nft,
              "nftMetadata": metadata,
              "correspondingToken": {
                "symbol": await token.methods.symbol().call(),
                "name": await token.methods.name().call(),
              }
            })
          }

        }

        if(example.functionName.startsWith('createPairETH')){

          for(let i = 0; i < decodedInput._initialNFTIDs.length; i++){
            const nftId = decodedInput._initialNFTIDs[i];
            const metadata = await getNftMetadata(decodedInput._nft, nftId)
            endResults.push({
              "key": objectHash(decodedInput) + "_" + nftId,
              'nftId': nftId,
              'nft': decodedInput._nft,
              "nftMetadata": metadata,
              "correspondingToken": {
                'symbol': 'ETH',
                'name': 'Ethereum',
              }
            })
          }

        }


      }

      return endResults;
  }

  function handleReadNft(){
     setReadingNft(true);
     readNft().then((data) => {
       setNfts(data);
       setReadingNft(false);
     })
  }

	async function handleAccountsChanged(accounts) {
		if (accounts.length === 0) {
			showNot('Please connect to MetaMask.');
		} else if (accounts[0] !== accountRef.current) {
			accountRef.current = accounts[0];

			const chainId = await window.ethereum.request({ method: 'eth_chainId' });
			handleChainChanged(chainId);

			const balanceResult = await window.ethereum.request({
				method: 'eth_getBalance',
				params: [accountRef.current, 'latest']
			})
			
			let wei = parseInt(balanceResult);
			let balance = wei/(10**18);


			setBalance(balance);

		}
	}

	function handleChainChanged(_chainId) {
		console.log('_chainId', _chainId)
	}



  function handleConnect(){
    window.ethereum.request({ method: 'eth_requestAccounts' })
      .then(handleAccountsChanged)
			.catch((err) => {
				if (err.code === 4001) {
					showNot('Please connect to MetaMask.');
				} else {
					console.error(err);
				}
			});
  }

	useEffect(function(){

		(async function(){
			const provider = await detectEthereumProvider();
			if(provider){

        if (provider !== window.ethereum) {
          showNot('Do you have multiple wallets installed?');
        }

				web3Ref.current = new Web3(provider);

				window.ethereum
					.request({ method: 'eth_accounts' })
					.then(handleAccountsChanged)

				window.ethereum.on('chainChanged', handleChainChanged);

			} else {
				showNot('Please install MetaMask.');
			}
		})();


	}, [])

  return (
    <div className={styles.container}>
      <button onClick={ handleConnect }>1.link to metamask wallet</button>
			<div>Balance: <strong>{ balance } ETH</strong></div>
      <button onClick={ handleReadNft } disabled={ readingNft }>
        { readingNft ? "loading ..." : "2.Read nft from the pool" }
      </button>
      { nfts.length > 0 && 
        <ul>
        {nfts.map((data) =>
          <li key={ data.key }>
            <DisplayPair data={ data }/>
          </li>
        )} 
        </ul>
      }
    </div>
  )
}

export default Home
