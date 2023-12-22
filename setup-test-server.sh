pg_dump --dbname=bookedge-server --schema-only --file=bookedge-server-schema.sql
dropdb bookedge-test --if-exists
createdb bookedge-test
psql --dbname=bookedge-test --file=./bookedge-server-schema.sql --quiet
