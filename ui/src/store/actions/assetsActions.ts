// @ts-ignore
import type { FetchAssetsRequestAction } from '../types';
import { FETCH_ASSETS_REQUEST } from '../types';

export const fetchAssetsRequest = (): FetchAssetsRequestAction => ({
  type: FETCH_ASSETS_REQUEST,
});
