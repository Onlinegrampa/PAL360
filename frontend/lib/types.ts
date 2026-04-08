export interface Policy {
  policy_id: string
  client_id: string
  line: 'Life' | 'Health' | 'Annuities' | 'PA&S'
  status: 'IN-FORCE' | 'LAPSED' | 'PENDING'
  premium: number
  due_date: string
  coverage_amount: number
  start_date: string
}

export interface Claim {
  claim_id: string
  policy_id: string
  stage: 'Submitted' | 'Agent Review' | 'Claims Dept' | 'Finance' | 'Paid'
  timestamps: { stage: string; ts: string }[]
  est_resolution: string
  amount: number
  description: string
}

export interface Product {
  product_id: string
  line: 'Life' | 'Health' | 'Annuities' | 'PA&S'
  name: string
  benefits: string[]
  cost_range: string
  use_case: string
}

export interface Client {
  client_id: string
  name: string
  email: string
  cert_hash: string
}
