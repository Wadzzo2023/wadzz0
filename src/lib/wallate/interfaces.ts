export interface LogoImg {
  url: string;
  blurData: string | null;
}

export interface Market {
  title: string;
  link: string;
  logoImg?: LogoImg;
  color?: string;
}

export interface AssetType {
  logoImg: LogoImg;
  color: string;
  code: string;
  issuer: string;
  description: string;
  link: string;
  availableMarket: Market[];
  tags: string[];
  codeIssuer: string;
}

export interface Tag {
  name: string;
  total: number;
}
export interface MyTag {
  name: string;
  codeIssuer: string
}

export interface HomeProps {
  tags: Tag[];
}
export interface RewardsAsset {
  code: string;
  issuer: string;
  limit: number;
}
export interface RewardsAssetLimit {
  main: RewardsAsset;
  limits: RewardsAsset[];
}

export interface CheckAnyPlotProps {
  pubkey: string;
  checkData: RewardsAssetLimit;
  mainPlotCheck: boolean;
  listOutput: boolean;
}

export interface HorizonAccount {
  balances: { asset_code: string; asset_issuer: string; balance: string }[];
}

export interface GetAssetsType {
  assets: AssetType[];
}

export interface GetTagsType {
  tags: Tag[];
}
export interface GetMyTagsType {
  tags: MyTag[];
}

interface User {
  user: string;
  pass: string;
}

export interface Admins {
  admins: User[];
  user?: string;
  password?: string;
}
