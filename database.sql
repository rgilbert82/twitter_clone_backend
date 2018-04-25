-- DROP DATABASE IF EXISTS twit;
-- CREATE DATABASE twit;
--
-- \c twit;

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  username VARCHAR(100) NOT NULL,
  password VARCHAR(255) NOT NULL,
  avatar VARCHAR(255),
  slug VARCHAR(100),
  token VARCHAR(50),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(username)
);

CREATE TABLE users_followers (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  follower_id INTEGER NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

ALTER TABLE users_followers ADD UNIQUE (user_id, follower_id);

ALTER TABLE users_followers ADD CONSTRAINT users_followers_follower_id_fkey
  FOREIGN KEY (follower_id) REFERENCES users (id)
  ON DELETE CASCADE;

ALTER TABLE users_followers ADD CONSTRAINT users_followers_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users (id)
  ON DELETE CASCADE;

CREATE TABLE tweets (
  id SERIAL PRIMARY KEY,
  body TEXT NOT NULL,
  image VARCHAR(255),
  slug VARCHAR(100),
  user_id INTEGER NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

ALTER TABLE tweets ADD CONSTRAINT tweets_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users (id)
  ON DELETE CASCADE;

CREATE TABLE retweets (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  tweet_id INTEGER NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

ALTER TABLE retweets ADD CONSTRAINT retweets_tweet_id_fkey
  FOREIGN KEY (tweet_id) REFERENCES tweets (id)
  ON DELETE CASCADE;

ALTER TABLE retweets ADD CONSTRAINT retweets_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users (id)
  ON DELETE CASCADE;

CREATE TABLE comments (
  id SERIAL PRIMARY KEY,
  body TEXT NOT NULL,
  user_id INTEGER NOT NULL,
  tweet_id INTEGER NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

ALTER TABLE comments ADD CONSTRAINT comments_tweet_id_fkey
  FOREIGN KEY (tweet_id) REFERENCES tweets (id)
  ON DELETE CASCADE;

ALTER TABLE comments ADD CONSTRAINT comments_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users (id)
  ON DELETE CASCADE;
