import { AccessToken } from '../auth/access-token';
import { RefreshToken } from '../auth/refresh-token';

export type Tokens = {
  access: AccessToken;
  refresh: RefreshToken;
};
