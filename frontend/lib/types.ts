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
  plan_code: string          // PAL plan code e.g. "001-NP", "361", "818", "" for non-life
  line: 'Life' | 'Health' | 'Annuities' | 'PA&S'
  name: string
  benefits: string[]
  cost_range: string
  use_case: string
}

export interface Application {
  id: number
  app_ref: string
  client_id: string
  product_id: string
  product_name: string
  full_name: string
  date_of_birth: string
  address: string
  phone: string
  occupation: string
  smoker: boolean
  pre_existing_conditions: string
  beneficiary_name: string
  beneficiary_relationship: string
  beneficiary_phone: string
  status: 'under_review' | 'approved' | 'declined'
  assigned_policy_number: string | null
  created_at: string
}

export interface Client {
  client_id: string
  name: string
  email: string
  cert_hash: string
}
