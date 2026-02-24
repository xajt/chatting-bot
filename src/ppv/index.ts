// Types
export type { PPVScript, Purchase } from './ppv-types'

// Repository
export {
  PPVRepository,
  getPPVRepository,
  resetPPVRepository,
} from './ppv-repository'

// CTA Library
export {
  CTALibrary,
  getCTALibrary,
  resetCTALibrary,
} from './cta-library'
export type { CTAContext } from './cta-library'

// Objection Handler
export {
  ObjectionHandler,
  getObjectionHandler,
  resetObjectionHandler,
} from './objection-handler'
export type { ObjectionType } from './objection-handler'

// Discount Manager
export {
  DiscountManager,
  getDiscountManager,
  resetDiscountManager,
} from './discount-manager'

// PPV Service (convenience functions)
export {
  getRandomPPVOffer,
  handleObjection,
  recordPurchase,
  getAllPPVs,
  getPPVById,
  getFanPurchases,
  hasFanPurchased,
  getFollowUpCTA,
} from './ppv-service'
export type { PPVOfferContext, PPVOffer, HandleObjectionResult } from './ppv-service'
