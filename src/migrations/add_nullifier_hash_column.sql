-- Add nullifier_hash column if it doesn't exist
ALTER TABLE merkle_tree_commitments 
ADD COLUMN IF NOT EXISTS nullifier_hash TEXT;

-- Add used column if it doesn't exist
ALTER TABLE merkle_tree_commitments 
ADD COLUMN IF NOT EXISTS used BOOLEAN DEFAULT FALSE;

-- Now create the index
CREATE INDEX IF NOT EXISTS nullifier_hash_idx ON merkle_tree_commitments (nullifier_hash) WHERE nullifier_hash IS NOT NULL;