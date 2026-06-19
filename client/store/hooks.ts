import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "./index";

/** Typed dispatch hook — use instead of `useDispatch` */
export const useAppDispatch = () => useDispatch<AppDispatch>();

/** Typed selector hook — use instead of `useSelector` */
export const useAppSelector = <T>(selector: (state: RootState) => T) =>
  useSelector(selector);
