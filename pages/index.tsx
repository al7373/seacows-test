import type { NextPage } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import { Button, notification } from 'antd';
import styles from '../styles/Home.module.scss'

const Home: NextPage = () => {

  const showNot = () => {
    notification.open({
      message: '',
      className: `${ styles.mynot }`,
      duration: null,
      description:
        <div className={ styles.description }>
          <i></i>
          <div>
            <p>ddddd</p>
          </div>
        </div>,
      onClick: () => {
        console.log('Notification Clicked!');
      },
    });
  }
  return (
    <div className={styles.container}>
      <button onClick={showNot}>dialog</button>
    </div>
  )
}

export default Home
