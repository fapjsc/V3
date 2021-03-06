import { useContext, useEffect, useState } from 'react';
import { useRouteMatch, useHistory } from 'react-router-dom';
import Countdown from 'react-countdown';

// Context
import InstantContext from '../../context/instant/InstantContext';
import HttpErrorContext from '../../context/httpError/HttpErrorContext';
import BuyContext from '../../context/buy/BuyContext';

// Lang Context
import { useI18n } from '../../lang';

// Components
import FromFooter from '../Layout/FormFooter';
import BaseSpinner from '../Ui/BaseSpinner';
import CompleteStatus from '../universal/CompleteStatus';
import InstantNav from './InstantNav';
import CountDownTimer from '../universal/countDownTimer';

// Style
import Spinner from 'react-bootstrap/Spinner';
import Button from 'react-bootstrap/Button';

const BuyDetail = () => {
  // Lang Context
  const { t } = useI18n();
  // Router Props
  const match = useRouteMatch();
  const history = useHistory();

  // Http Error Context
  const httpErrorContext = useContext(HttpErrorContext);
  const { errorText, setHttpError, httpLoading } = httpErrorContext;

  // Buy Context
  const buyContext = useContext(BuyContext);
  const { deltaTime, GetDeltaTime } = buyContext;

  // Instant Context
  const instantContext = useContext(InstantContext);
  const { buy1Data, buyMatch2, statusWs, wsStatusData, wsStatusClient, cleanAll, paymentName } = instantContext;

  // Init State
  const [showComplete, setShowComplete] = useState(false);
  const [tab, setTab] = useState('all');
  const [timeLeft, setTimeLeft] = useState(Date.now() + 1000 * 60 * 30 - deltaTime * 1000);
  const [overTime, setOverTime] = useState(false);

  // ===========
  //  UseEffect
  // ===========
  useEffect(() => {
    statusWs(match.params.id);
    GetDeltaTime(match.params.id);
    return () => {
      if (wsStatusClient) wsStatusClient.close();
      setOverTime(false);
      setTimeLeft(null);
      cleanAll();
    };
    //eslint-disable-next-line
  }, []);

  useEffect(() => {
    setTimeLeft(Date.now() + 1000 * 60 * 30 - deltaTime * 1000);
    if (deltaTime > 1800) setOverTime(true);
  }, [deltaTime]);

  useEffect(() => {
    if (errorText) alert(errorText);
    return () => {
      setHttpError('');
    };
    // eslint-disable-next-line
  }, [errorText]);

  useEffect(() => {
    if (tab === 'onGoing') history.replace('/home/overview');
    // eslint-disable-next-line
  }, [tab]);

  useEffect(() => {
    if (wsStatusData === 99 || wsStatusData === 98) {
      setShowComplete(true);
    }

    if (wsStatusData === 1) setShowComplete(true);

    // eslint-disable-next-line
  }, [wsStatusData]);

  // ===========
  //  function
  // ===========
  const handleClick = () => {
    buyMatch2(match.params.id);
  };

  const backToHome = () => {
    history.replace('/home/overview');
    cleanAll();
  };

  return (
    <div className="row mt-4">
      <div className="col-xl-8 col-12">
        <p className="welcome_txt pl-0" style={{ marginTop: 20 }}>
          {t('welcome_text')}
        </p>
        <div className="contentbox">
          <InstantNav tab={tab} setTab={setTab} jumpTo={true} />
          {overTime ? (
            <div>
              <h2 className="txt_18 text-center my-4" style={{ color: '#242e47' }}>
                {t('instant_over_time')}
              </h2>
              <Button onClick={backToHome} className="easy-btn mw400 mobile-width" variant="primary">
                {t('btn_back_home')}
              </Button>
            </div>
          ) : (
            <>
              <div className="txt_12 pt_20">{t('instant_transaction')}</div>
              <div id="buy" className="tabcontent">
                {buy1Data && !showComplete ? (
                  <>
                    <div className="d-flex justify-content-between flex-column-mobile">
                      {/* Block-1  --pay info */}
                      <div className="w45_m100 mobile-width">
                        {/* Pay Timer */}
                        <div className="easy_counter mt-4 d-flex justify-content-start align-items-center mb-2">
                          <span className="txt_12 mr-auto">{t('instant_payee_data')}</span>
                          <span className="i_clock mr-1 mb-1" />
                          <span className="txt_12">{t('instant_pay_time')}???</span>
                          {/* <span className="c_yellow">15???40???</span> */}
                          <Countdown onComplete={() => setOverTime(true)} renderer={CountDownTimer} date={timeLeft} />
                        </div>
                        {/* ??????????????? */}
                        <div className="lightblue_bg txt_12 d-flex flex-column py-4">
                          <span className="txt_12_grey mb-4">
                            {t('instant_payee_name')}???{buy1Data.P2}
                          </span>
                          <span className="txt_12_grey mb-4">
                            {t('instant_payee_account')}???{buy1Data.P1}
                          </span>
                          <span className="txt_12_grey mb-4">
                            {t('instant_bank')}???{buy1Data.P3}
                          </span>
                          <span className="txt_12_grey">
                            {t('instant_city')}???{buy1Data.P4}
                          </span>
                        </div>
                        {/* ??????????????? */}
                        <div className="w45_m100 mobile-width w-100">
                          <p className="txt_12 pt_20 mb-2">{t('instant_payer_data')}</p>
                          <p className="txt_12_grey lightblue_bg py-4">
                            {t('instant_payer_name')}???{paymentName}
                          </p>
                        </div>
                      </div>

                      {/* Block-2  --???????????? */}
                      <div className="easy_info mobile-width h-50 flex-order1-mobile p-4">
                        <div className="inline">
                          <div className="txt_12_grey">{t('instant_exRate')}???</div>
                          <span className="">{buy1Data.D1.toFixed(2)}</span>
                        </div>

                        <div className="right_txt16">
                          <span className="i_red" />
                          <span className="red">{t('instant_sell')}</span>
                        </div>

                        <hr />

                        <div className="d-flex justify-content-between">
                          <div>
                            <p className="txt_12_grey mb-0 ">{t('instant_price')}</p>
                            <p className="c_blue ">{buy1Data.D2.toFixed(2)} CNY</p>
                          </div>

                          <div>
                            <p className="txt_12_grey text-right mb-0 ">{t('instant_qua')}</p>
                            <p className="">{Math.abs(buy1Data.UsdtAmt).toFixed(2)} USDT</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Button */}
                    {wsStatusData === 33 ? (
                      <button className="mw400 disable-easy-btn mobile-width">
                        <span className="i_ready"></span>
                        {t('btn_preparing')}
                      </button>
                    ) : null}

                    {wsStatusData === 34 && !httpLoading ? (
                      <Button onClick={handleClick} className="easy-btn mw400 mobile-width" style={{}}>
                        {t('btn_buyer_already_pay')}
                      </Button>
                    ) : null}

                    {wsStatusData === 34 && httpLoading ? (
                      <Button className="disable-easy-btn mobile-width mw400" disabled>
                        <Spinner as="span" animation="grow" size="sm" role="status" aria-hidden="true" />
                        {t('btn_loading')}...
                      </Button>
                    ) : null}

                    <FromFooter />
                  </>
                ) : buy1Data && showComplete ? (
                  // ????????????
                  <CompleteStatus wsStatus={wsStatusData} backToHome={backToHome} hash={buy1Data.Tx_HASH} type="sell" />
                ) : (
                  <BaseSpinner />
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default BuyDetail;
