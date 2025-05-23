export type DevRole = string;

export interface DevPlateProps {
  url: string;
  imgUrl: string;
  name: string;
  role: DevRole;
  key?: React.Key;
}

export interface SAPageProps {
  app: App;
  poweredBy: PoweredBy;
  devCompany: DevCompany;
  changeLogs: Record<string, { date: number; changes: string[] }>;
  devs: DevPlateProps[];
  reportUrl: string;
}

export interface Logo {
  logoUrl: string;
  blurDataUrl?: string;
  alt: string;
}

export interface App {
  title: string;
  codeName: string;
  logo: Logo;
  version: string;
}

export interface PoweredBy {
  companyName: string;
  url: string;
}

export interface DevCompany {
  name: string;
  url: string;
  year: number;
}
