#!/bin/zsh

# Execute Heroku database pull command
dropdb bookedge-server --if-exists
heroku pg:pull DATABASE_URL bookedge-server --app=fep-bookedge-production
