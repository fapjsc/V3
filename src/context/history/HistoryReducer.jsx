import { SET_ALL_HISTORY, SET_SINGLE_DETAIL } from '../type';

const HistoryReducer = (state, action) => {
  switch (action.type) {
    case SET_SINGLE_DETAIL:
      return {
        ...state,
        singleDetail: action.payload,
      };
    case SET_ALL_HISTORY:
      return {
        ...state,
        allHistory: action.payload,
      };
    default:
      return state;
  }
};

export default HistoryReducer;