#!/usr/bin/env bash
echo "Setting up database..."
echo "Creating db 'bookie-bot'..."

createdb bookie-bot

if [ $? -eq 0 ]
then
  echo "Created DB"
else
  echo "Could not create DB" >&2
fi

echo "Running schema against db..."
psql -d bookie-bot -a -f ./db/setup/schema.sql
psql -d bookie-bot -a -f ./db/setup/seeds.sql

echo "Ya done!"

exit 0