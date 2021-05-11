import { SET_HTTP_ERROR, SET_HTTP_LOADING } from '../type';

const HttpErrorReducer = (state, action) => {
  switch (action.type) {
    case SET_HTTP_LOADING:
      return {
        ...state,
        httpLoading: action.payload,
      };
    case SET_HTTP_ERROR:
      return {
        ...state,
        errorText: action.payload,
      };
    default:
      return state;
  }
};

export default HttpErrorReducer;
