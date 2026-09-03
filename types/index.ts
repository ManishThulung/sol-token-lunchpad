export interface TokenAsset {
  // interface: "FungibleToken";
  interface: string;
  id: string;
  content: {
    $schema: string;
    json_uri: string;
    files: TokenFile[];
    metadata: TokenMetadata;
    links: {
      image: string;
    };
  };
  authorities: TokenAuthority[];
  compression: TokenCompression;
  grouping: unknown[];
  royalty: TokenRoyalty;
  creators: unknown[];
  ownership: TokenOwnership;
  supply: number | null;
  mutable: boolean;
  burnt: boolean;
  mint_extensions: {
    metadata: MintMetadata;
    metadata_pointer: MetadataPointer;
  };
  token_info: TokenInfo;
}

export interface TokenFile {
  uri: string;
  cdn_uri: string;
  mime: string;
}

export interface TokenMetadata {
  description: string;
  json_name: string;
  name: string;
  symbol: string;
}

export interface TokenAuthority {
  address: string;
  scopes: string[];
}

export interface TokenCompression {
  eligible: boolean;
  compressed: boolean;
  data_hash: string;
  creator_hash: string;
  asset_hash: string;
  tree: string;
  seq: number;
  leaf_id: number;
}

export interface TokenRoyalty {
  royalty_model: string;
  target: string | null;
  percent: number;
  basis_points: number;
  primary_sale_happened: boolean;
  locked: boolean;
}

export interface TokenOwnership {
  frozen: boolean;
  delegated: boolean;
  delegate: string | null;
  ownership_model: string;
  owner: string;
}

export interface MintMetadata {
  uri: string;
  mint: string;
  name: string;
  symbol: string;
  update_authority: string;
  additional_metadata: unknown[];
}

export interface MetadataPointer {
  authority: string;
  metadata_address: string;
}

export interface TokenInfo {
  supply: number;
  decimals: number;
  token_program: string;
}

export interface Token {
  id: string;
  decimals: number;
  name: string;
  symbol: string;
  mintAuthority: string | null;
  description: string | null;
  imageUrl: string | null;
  metadataUri: string | null;
  revokeAuthority: string | null;
  createdAt?: string; // ISO date string
  updatedAt?: string; // ISO date string
}
export interface PoolMetrics {
  id: string;
  reserveA: string;
  reserveB: string;
  price: string;
  liquidityUsd: string;
  lpSupply: string;
  lpPrice: string;
  holderCount: number;
  volume24h: string;
  volume7d: string;
  volume30d: string;
  fees24h: string;
  fees7d: string;
  fees30d: string;
  apr24h: string;
  apr7d: string;
  updatedAt: string; // ISO date string
  poolId: string;
}

export interface LiquidityPool {
  id: string;
  mintAId: string;
  mintBId: string;
  lpMintAddress: string;
  lpMintDecimals: number;
  tradeFeeRate: number;
  configId: string;
  creatorWallet: string | null;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  mintA: Token;
  mintB: Token;
  metrics: PoolMetrics | null;
}
