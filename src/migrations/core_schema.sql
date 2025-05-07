CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    commitment VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS merkle_tree_roots (
    id SERIAL PRIMARY KEY,
    root TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS merkle_tree_commitments (
    id SERIAL PRIMARY KEY,
    commitment TEXT NOT NULL UNIQUE,
    nullifier_hash TEXT,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS commitment_idx ON merkle_tree_commitments (commitment);
CREATE INDEX IF NOT EXISTS nullifier_hash_idx ON merkle_tree_commitments (nullifier_hash) WHERE nullifier_hash IS NOT NULL;