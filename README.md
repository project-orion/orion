# Orion

## Code structure

* Front end code is located under `./app`; it builds a webpack bundle
* Backend code is located under `./server`; it builds an expressJS server

## Requirements

In order to run this projet locally, you need to have a local Postgres database populated with data that follows the schema which is expected by the backend.
We installed and defined our local instance of Postgres as follows (you have to have Homebrew installed first):
```
brew install postgresql
initdb /usr/local/var/postgres
postgres -D /usr/local/var/postgres

createdb orion
psql -d orion
```

Copy paste this SQL script in order to init roles in the database.
```
CREATE ROLE root;
ALTER ROLE root WITH Superuser;
ALTER ROLE root WITH LOGIN;
ALTER ROLE "root" WITH PASSWORD 'root';
```

Do not forget to generate the sequelize declaration files in the server with `gulp deploy` from `./`.
This command will populate your local Postgres instance with data; it will then use the current data and schemas in your Postgres instance in order to automatically generate typed files that are needed in this project (in the front-end as well as in the backend).

## Building projects

* `gulp deploy` should already have built the server for you. In case you want to build it manually, you can run `gulp clean && gulp build` from `./server`.
* A webpack bundle will be built when you start running the front end locally: no need to explicitely build it on your end. However, you still need to install its dependencies by running `npm install` from `./app`.

## Running the app locally

If you have already installed Postgres, simply start it using `postgres -D /usr/local/var/postgres`.
Then start the local backend by running `npm run start-server` from `./` and finally start the local front-end by running `cd app/ && npm start`.
