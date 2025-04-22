-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    dob DATE NOT NULL,
    id_number VARCHAR(50) NOT NULL UNIQUE,
    commitment_hash TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Elections table
CREATE TABLE IF NOT EXISTS elections (
    id SERIAL PRIMARY KEY,
    blockchain_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Parties table
CREATE TABLE IF NOT EXISTS parties (
    id SERIAL PRIMARY KEY,
    election_id INTEGER REFERENCES elections(id),
    blockchain_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Merkle tree roots table
CREATE TABLE IF NOT EXISTS merkle_tree_roots (
    id SERIAL PRIMARY KEY,
    root TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Merkle tree commitments table
CREATE TABLE IF NOT EXISTS merkle_tree_commitments (
    id SERIAL PRIMARY KEY,
    commitment TEXT NOT NULL UNIQUE,
    nullifier_hash TEXT,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on commitment for faster lookup
CREATE INDEX IF NOT EXISTS commitment_idx ON merkle_tree_commitments (commitment);

-- Create index on nullifier_hash for double-voting prevention
CREATE INDEX IF NOT EXISTS nullifier_hash_idx ON merkle_tree_commitments (nullifier_hash) WHERE nullifier_hash IS NOT NULL;

-- Votes table (for tracking votes with ZKP)
CREATE TABLE IF NOT EXISTS votes (
    id SERIAL PRIMARY KEY,
    election_id INTEGER REFERENCES elections(id),
    nullifier_hash TEXT NOT NULL UNIQUE,
    tx_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on nullifier_hash for votes
CREATE INDEX IF NOT EXISTS vote_nullifier_idx ON votes (nullifier_hash);