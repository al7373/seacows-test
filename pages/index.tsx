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

      seacowsPairContractRef.current = new web3Ref.current.eth.Contract(
        SeacowsPairABI,
        '0x1c9f47f8c42c3a8be36dcbe3d49e365b8099c7df'
      );

      let factory = await seacowsPairContractRef.current.methods.factory().call()

      console.log("factory", factory)


      const baseURL = '/api/my-etherscan'

      let { data: { result } } = await axios.get(
        baseURL, {
        params: {
          module: 'account',
          action: 'txlist',
          address: factory,
          startblock: 0,
          endblock: 99999999,
          page: 1,
          offset: 20,
          sort: 'desc',
        }
      })

      //tokony sarahana ny traitement-n'ny PAIRERC20 sy PAIRETH
      result = result.filter(({functionName, isError}) => 
        (functionName.startsWith('createPairERC20') || functionName.startsWith('createPairETH')) && 
        isError === "0"
      )

      let example = result[0];

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

      let decodedInput = fnDecoder.decodeFn(example.input);

      //ho an'ny ERC20 ihany vao misy ny params
      console.log(decodedInput);

      //console.log(decodedInput.params.nft);
      const token = new web3Ref.current.eth.Contract(erc20ABI, decodedInput.params.token)
       
      console.log("symbol", await token.methods.symbol().call()) // prints the token's symbol
      console.log("name", await token.methods.name().call()) // prints the token's name


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
      <button onClick={ handleConnect }>2.Read nft from the pool</button>
    </div>
  )
}

export default Home
