# Orion Server

## Introduction

The backend uses sequelize to query a Postgres database.
This database's schema is automatically generated in `./scr/model/` using `sequelize-auto`. In case the backend schema changes, one can regenerate these files by running `gulp build-models`. Be careful, regenerating the models might prevent the backend from building (which is of course intentional since this failure would most likely come from a typing error in the code).

More generally, running `gulp clean && gulp build` will build everything you need from the server.
