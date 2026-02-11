#!/bin/zsh

# Initialize the psql command with your target database
cmd="psql --dbname=bookedge-server"

# Loop over each file that matches "insert-*.sql" in the fixtures directory
for file in ../bookedge-client/cypress/fixtures/insert-*.sql; do
  # Append an additional argument of '--file=filename'
  cmd+=" --file=\"${file}\""
done

# Show the full command string
echo "${cmd}"

# Execute the command
eval "${cmd}"
