import { useEffect, useContext, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';

// Context
import InstantContext from '../../context/instant/InstantContext';
import HttpErrorContext from '../../context/httpError/HttpErrorContext';

// Components

// Style
import Spinner from 'react-bootstrap/Spinner';
import Button from 'react-bootstrap/Button';

const TheInstant = () => {
  // Route Props
  const history = useHistory();

  // Init State
  const [token, setToken] = useState('');
  const [type, setType] = useState('');

  // Instant Context
  const instantContext = useContext(InstantContext);
  const {
    wsOnGoingData,
    sellMatch1,
    buyMatch1,
    sell1Data,
    buy1Data,
    setSell1Data,
    setBuy1Data,
    setCountData,
    setActionType,
  } = instantContext;

  // HttpError Context
  const httpError = useContext(HttpErrorContext);
  const { btnLoading, errorText, setHttpError } = httpError;

  const handleClick = (token, type) => {
    setToken(token);
    setType(type);
    setCountData({ token });
    setActionType('onGoing');
  };

  // ==========
  // UseEffect
  // ==========
  useEffect(() => {
    if (!token) return;
    if (type === 'sell') {
      sellMatch1(token);
      setBuy1Data(null);
    }
    if (type === 'buy') {
      buyMatch1(token);
      setSell1Data(null);
    }
    // eslint-disable-next-line
  }, [token]);

  useEffect(() => {
    if (sell1Data || buy1Data) history.replace(`/home/instant/${token}`);
    // eslint-disable-next-line
  }, [buy1Data, sell1Data]);

  useEffect(() => {
    if (errorText) alert(errorText);
    return () => {
      setHttpError('');
    };
    // eslint-disable-next-line
  }, [errorText]);

  return (
    <section>
      {wsOnGoingData.length > 0 &&
        wsOnGoingData.map(el => {
          if (el.MType === 2) {
            return (
              <div id="sell" className="tabcontent" key={uuidv4()}>
                <div className="">
                  <div className="txt_12 pt_20 inline mb-1">匯率：{el.D1.toFixed(2)}</div>
                  <div className="txt_12 pt_20 inline pl_20">
                    {/* <span className="i_clock" />
                      <span className="">剩餘時間：</span>
                      <span className="c_yellow">13秒</span> */}
                  </div>

                  <div className="row bb1 mx-0">
                    <div className="lightblue_bg txt_16 col-md-8 col-12">
                      <div className="inline pl_20 w45_m100">
                        <span className="i_blue1" />
                        <span className="blue">
                          買&nbsp;
                          <span className="bold_22">{el.UsdtAmt.toFixed(2)}</span>
                          <span style={{ fontWeight: 'bold' }}> USDT</span>
                        </span>
                      </div>

                      <div className="inline pl_20">
                        <span className="i_cny" />
                        <span className="">付&nbsp;{el.D2.toFixed(2)} CNY</span>
                      </div>
                    </div>

                    <div className="col-md-1" />
                    <div className="col-md-3 col-12">
                      <button
                        onClick={() => handleClick(el.token, 'sell')}
                        className="easy-btn margin0 w-100"
                      >
                        詳細
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          } else {
            return (
              <div id="buy" className="tabcontent" key={uuidv4()}>
                <div className="w1140" />
                <div>
                  <div className="txt_12 pt_20 inline mb-1">匯率：{el.D1.toFixed(2)}</div>
                  {/* <div className="txt_12 pt_20 inline pl_20">
                    <span className="i_clock" />
                    限時時間：
                    <span className="c_yellow">{el.DeltaTime} 秒</span>
                  </div> */}
                  <div className="row bb1 mx-0">
                    <div className="lightblue_bg txt_16 col-md-8 col-12">
                      <div className="inline pl_20 w45_m100">
                        <span className="i_red" />
                        <span className="red">
                          賣&nbsp;
                          <span className="bold_22">{el.UsdtAmt.toFixed(2)} </span>
                          <span style={{ fontWeight: 'bold' }}> USDT</span>
                        </span>
                      </div>
                      <div className="inline pl_20">
                        <span className="i_cny" />
                        <span>收&nbsp;{el.D2.toFixed(2)} CNY</span>
                      </div>
                    </div>
                    <div className="col-md-1" />
                    <div className="col-md-3 col-12">
                      {btnLoading ? (
                        <Button variant="primary" disabled>
                          <Spinner
                            as="span"
                            animation="grow"
                            size="sm"
                            role="status"
                            aria-hidden="true"
                          />
                          Loading...
                        </Button>
                      ) : (
                        <button
                          onClick={() => handleClick(el.token, 'buy')}
                          className="easy-btn margin0 w-100"
                        >
                          詳細
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          }
        })}

      {!wsOnGoingData.length && <h2 className="mt-4">目前沒有進行中的交易</h2>}
    </section>
  );
};

export default TheInstant;
