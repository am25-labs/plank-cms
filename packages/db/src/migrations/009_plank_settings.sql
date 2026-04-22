CREATE TABLE IF NOT EXISTS plank_settings (
  namespace  VARCHAR(64)  NOT NULL,
  key        VARCHAR(128) NOT NULL,
  value      TEXT,
  updated_at TIMESTAMP   NOT NULL DEFAULT NOW(),
  PRIMARY KEY (namespace, key)
);
