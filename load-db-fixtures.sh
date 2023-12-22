#!/bin/zsh

# Start the command string
cmd="psql --dbname=bookedge-server"

# Base names of the files
files=("insert-test-users" "insert-imprints" "insert-books" "insert-users-imprints" "insert-contributors" "insert-releases" "insert-pricing")

# Loop over each base name in the array
for file in "${files[@]}"; do
  # Append an additional argument of '--file=filename'
  cmd+=" --file=../bookedge-client/cypress/fixtures/${file}.sql"
done

echo $cmd
# Execute the command
eval $cmd
