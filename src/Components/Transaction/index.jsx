import React, { Component } from 'react';
import { Link } from 'react-router-dom';

import PayInfo from '../Transaction/PayInfo';
import UploadForm from '../Transaction/UploadForm';

// import { w3cwebsocket as W3CWebsocket } from 'websocket';
import ReconnectingWebSocket from 'reconnecting-websocket';

import './index.scss';
import BuyCount from './BuyCount';
import ConfirmBuy from './ConfirmBuy';

export default class Transaction extends Component {
    state = {
        orderToken: null,
        loginSession: '',
        clientName: '',
        exRate: null,
        rmbAmt: null,
        usdtAmt: null,
        confirmPay: false,
        transferData: null,
        pair: false,
        isPairing: false,
        transactionState: 'buy',
        pairFinish: false,
        data: {},
        upload: false,
    };

    // 獲取匯率
    getExRate = async headers => {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('token 過期');
        }

        const exRateApi = `/j/ChkExRate.aspx`;

        try {
            const res = await fetch(exRateApi, {
                headers,
            });

            const resData = await res.json();

            if (!res.ok) {
                console.log(resData, '!res.ok');
            }

            const { data } = resData;

            this.setState({
                exRate: data,
            });
        } catch (error) {
            console.log(error, 'getExRate');
        }
    };

    getUsdtAmt = e => {
        this.setState(
            {
                usdtAmt: e.target.value.trim(),
            },
            () => {
                this.transformRmb();
            }
        );
    };

    getRmbAmt = e => {
        this.setState(
            {
                rmbAmt: e.target.value.trim(),
            },
            () => {
                this.transformToUsdt();
            }
        );
    };

    getClientName = e => {
        this.setState({
            clientName: e.target.value.trim(),
        });
    };

    transformRmb = () => {
        this.setState(state => {
            return {
                rmbAmt: (state.exRate.RMB_BUY * state.usdtAmt).toFixed(2),
            };
        });
    };

    transformToUsdt = () => {
        this.setState(state => {
            return {
                usdtAmt: (state.rmbAmt / state.exRate.RMB_BUY).toFixed(2),
            };
        });
    };

    // payComplete = () => {
    //     console.log(this.state.orderToken);
    //     const payCompleteApi = `/j/Req_Buy2.aspx`;

    //     const res = await fetch(payCompleteApi, {
    //         method: "POST",
    //         headers,
    //         body: JSON.stringify({

    //         })
    //     })
    // };

    getConfirmPay = async () => {
        const token = localStorage.getItem('token');
        let headers = new Headers();
        headers.append('Content-Type', 'application/json');
        headers.append('login_session', token);

        try {
            console.log('call buy2 api');
            const reqBuy2Api = `/j/Req_Buy2.aspx`;

            const res = await fetch(reqBuy2Api, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    Token: this.state.orderToken,
                }),
            });

            const resData = await res.json();

            if (!res.ok) {
                alert(resData);
            }

            console.log(resData.code, 'buy2');

            if (resData.code === 200) {
                this.setState(
                    {
                        upload: true,
                    },
                    () => {
                        console.log(this.state.upload);
                    }
                );
            }
        } catch (error) {
            alert(error);
        }
    };

    handleConfirm = async () => {
        const { usdtAmt, clientName } = this.state;

        if (!clientName) {
            alert('請輸入姓名');
            return;
        }

        const token = localStorage.getItem('token');
        let headers = new Headers();
        headers.append('Content-Type', 'application/json');
        headers.append('login_session', token);

        try {
            const reqBuyApi = `/j/Req_Buy1.aspx`;
            const res = await fetch(reqBuyApi, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    ClientName: clientName,
                    UsdtAmt: usdtAmt,
                }),
            });

            const resData = await res.json();

            const {
                data: { order_token },
            } = resData;

            this.setState(
                {
                    orderToken: order_token,
                },
                () => {
                    this.submitTransaction();
                }
            );
        } catch (error) {
            alert(error, 'transaction');
        }
    };

    showPayDetail = () => {
        const { usdtAmt, rmbAmt } = this.state;

        // 有1~2位小数的正數，且不能為0或0開頭
        let rule = /^([1-9][0-9]*)+(\.[0-9]{1,2})?$/;

        if (!rule.test(usdtAmt) || !rule.test(rmbAmt)) {
            alert('請輸入有效數量, (不能為0，最多小數第二位)');
            return;
        }

        this.setState({
            confirmPay: true,
        });
    };

    componentDidMount() {
        const token = localStorage.getItem('token');
        if (token) {
            let headers = new Headers();
            headers.append('Content-Type', 'application/json');
            headers.append('login_session', token);

            this.setState({
                loginSession: token,
                headers,
            });

            this.getExRate(headers);
        } else {
            return;
        }
    }

    // webSocket 連接
    submitTransaction = () => {
        const { orderToken, loginSession, isPairing } = this.state;
        const transactionApi = 'j/ws_orderstatus.ashx';
        const url = `ws://10.168.192.1/${transactionApi}?login_session=${loginSession}&order_token=${orderToken}`;

        // 自動重連次數
        // const options = {
        //     maxRetries: null,
        // };

        const client = new ReconnectingWebSocket(url);

        // 1.建立連接
        client.onopen = () => {
            console.log('websocket client connected');
            this.setState({
                isPairing: true,
            });
        };

        // 2.收到server回復
        client.onmessage = message => {
            const dataFromServer = JSON.parse(message.data);
            // console.log('got reply!', dataFromServer);

            // 第一次返回後設定state
            this.setState({
                transferData: dataFromServer.data,
            });

            // 配對成功後返回設定狀態
            if (this.state.transferData.Tx_HASH) {
                this.setState({
                    pair: true,
                    isPairing: false,
                    pairFinish: true,
                });
            }
        };

        // 3.錯誤處理
        client.onclose = () => {
            if (!isPairing) {
                alert('連線異常，請確認網路狀態');
            }
        };
    };

    render() {
        const {
            exRate,
            rmbAmt,
            usdtAmt,
            confirmPay,
            pair,
            isPairing,
            transactionState,
            pairFinish,
            upload,
        } = this.state;

        return (
            <section className="overview bg_grey">
                <div className="container h_88">
                    <div className="row">
                        <div className="col-12 ">
                            <p className="welcome_txt">歡迎登入</p>
                        </div>

                        <div className="col-12 transaction-card">
                            {/* Nav */}
                            <div className="history-tab trans-tab">
                                <Link
                                    to="/home"
                                    className={
                                        transactionState === 'buy'
                                            ? 'history-link history-link-active'
                                            : 'history-link'
                                    }
                                >
                                    購買
                                </Link>
                                <Link
                                    to="/home"
                                    className={
                                        transactionState === 'sell'
                                            ? 'history-link history-link-active'
                                            : 'history-link'
                                    }
                                >
                                    出售
                                </Link>

                                <Link
                                    to="/home"
                                    className={
                                        transactionState === 'sell'
                                            ? 'history-link history-link-active'
                                            : 'history-link'
                                    }
                                >
                                    轉帳
                                </Link>
                            </div>

                            {/* 申請購買 */}
                            <div>
                                {!upload ? (
                                    <>
                                        <p>購買USDT</p>
                                        <div className="pay-info">
                                            <p>匯率 : {exRate ? exRate.RMB_BUY : null}</p>
                                            <p>付款窗口 : 30分鐘</p>
                                            <p>限額 : 200 - 1230</p>
                                        </div>
                                    </>
                                ) : null}

                                {confirmPay && !pairFinish ? (
                                    <>
                                        <ConfirmBuy
                                            getClientName={this.getClientName}
                                            handleConfirm={this.handleConfirm}
                                            usdtAmt={usdtAmt}
                                            rmbAmt={rmbAmt}
                                            pairFinish={pairFinish}
                                            pair={pair}
                                            isPairing={isPairing}
                                        />

                                        <div>
                                            <hr className="mt_mb" />
                                            <p className="txt_12_grey">
                                                信息為幣商的指定收款賬戶，請務必按照規則操作，網銀轉賬到賬戶。
                                            </p>
                                        </div>
                                    </>
                                ) : pairFinish && !upload ? (
                                    <>
                                        <PayInfo
                                            {...this.state}
                                            getConfirmPay={this.getConfirmPay}
                                        />
                                    </>
                                ) : upload ? (
                                    <UploadForm />
                                ) : (
                                    <>
                                        <BuyCount
                                            showPayDetail={this.showPayDetail}
                                            getRmbAmt={this.getRmbAmt}
                                            getUsdtAmt={this.getUsdtAmt}
                                            usdtAmt={usdtAmt}
                                            rmbAmt={rmbAmt}
                                        />

                                        <div>
                                            <hr className="mt_mb" />
                                            <p className="txt_12_grey">
                                                請注意,透過網上銀行、流動銀行、付款服務、微型電郵或其他第三者付款平臺,直接轉帳予賣方。
                                                “如果您已經把錢匯給賣方，您絕對不能按賣方的付款方式單擊”取消交易”。
                                                除非你的付款帳戶已收到退款,否則沒有真正付款,切勿按交易規則所不允許的「付款」鍵。”
                                                <br />
                                                <br />
                                                OTC
                                                貿易區目前只提供BCTC/USDT/TES/EOS/HT/HUST/XRP/LTC/BCH。
                                                如果你想用其他數字資產進行交易，請用貨幣進行交易。
                                                <br />
                                                <br />
                                                如你有其他問題或爭議,你可透過網頁聯絡。
                                            </p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        );
    }
}