-- Create table for Merkle tree roots
CREATE TABLE IF NOT EXISTS merkle_tree_roots (
    id SERIAL PRIMARY KEY,
    root TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create table for Merkle tree commitments
CREATE TABLE IF NOT EXISTS merkle_tree_commitments (
    id SERIAL PRIMARY KEY,
    commitment TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on commitment for faster lookup
CREATE INDEX IF NOT EXISTS commitment_idx ON merkle_tree_commitments (commitment);