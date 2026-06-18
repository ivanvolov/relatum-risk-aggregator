export const RFP  = 'https://relatum.xyz/ns/rfp#';
export const FEED = 'https://relatum.xyz/ns/feed/';
export const RDF  = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#';
export const RDFS = 'http://www.w3.org/2000/01/rdf-schema#';

export const A = RDF + 'type';
export const LABEL = RDFS + 'label';

export const T = {
  Rating:            RFP + 'Rating',
  Score:             RFP + 'Score',
  Finding:           RFP + 'Finding',
  CoverageStatement: RFP + 'CoverageStatement',
};

export const P = {
  statedBy:        RFP + 'statedBy',
  about:           RFP + 'about',
  observedAt:      RFP + 'observedAt',
  sourceURL:       RFP + 'sourceURL',
  methodologyURL:  RFP + 'methodologyURL',
  dimension:       RFP + 'dimension',
  ratingValue:     RFP + 'ratingValue',
  ratingScale:     RFP + 'ratingScale',
  scoreValue:      RFP + 'scoreValue',
  scoreUnit:       RFP + 'scoreUnit',
  coverageStatus:  RFP + 'coverageStatus',
  coverageReason:  RFP + 'coverageReason',
};

export const feedUriToId = (uri) => uri.startsWith(FEED) ? uri.slice(FEED.length) : uri;

export const STATUS_FROM_TTL = {
  covered:          'cov',
  partiallyCovered: 'part',
  notCovered:       'none',
};

export const STATUS_RANK = { cov: 2, part: 1, none: 0 };
export const pickBestStatus = (a, b) => (STATUS_RANK[a] ?? -1) >= (STATUS_RANK[b] ?? -1) ? a : b;
