[comment]: <> (This file has been added on OGCIO fork)

# LogTo per OGCIO

## Get started

If you want to run it locally, you just have to run
```
make build run
```

And, once the process ended, you're ready to open `http://localhost:3302` on your browser to navigate on your LogTo instance!

## Sync with main repository

To sync with the main repository, once a new version is released, follow the following steps:
- add the main repository remote, if it is not set in your git configuration, `git remote add upstream git@github.com:logto-io/logto.git`
- run `git fetch --tags upstream` to fetch all the tags from the main repository
- check if the tag you want to sync with exists `git tag -v YOUR_TAG`, e.g. `git tag -v v1.17.0`
- checkout a new branch, starting by `dev`, locally, naming it `feature/YOUR_TAG`, 
e.g. `git checkout dev && git pull && git checkout -b feature/v1.17.0`
- merge the main repository tag accepting incoming updates using `git merge YOUR_TAG --strategy-option theirs`, 
e.g. `git merge v1.17.0 --strategy-option theirs`
- given that across releases they do a lot of commits, you will probably have to resolve some conflicts, check what did you change since the last sync and fix them!
- run `pnpm run dev` from the root directory and check for errors. What I suggest to do is to open a GitHub page with the tag from the main repository you are syncing with, then one with the latest OGCIO `dev` branch and check for differences between them
- commit the changes with `git commit -a` to end the merge and let git write the correct message
- push and open your PR!

## Setup and run Logto natively

You can also run Logto natively on your machine outside the docker container.

### Prerequisites
- NodeJS v20.10.0
- PNPM v7.0

### Starting the database

If you start Logto natively, the database won't be available, and you will have to start it separately. The database is still dockerized and has its own Docker Compose configuration. Use the following command to start the database container:

`docker compose -f docker-compose-db.yml up -d`

With the following command, you can shut down the database container:

`docker compose -f docker-compose-db.yml down`

### Configuration and installation

To run Logto natively, you must install and configure it first. These steps must be performed only once.

1. Create a `.env` file in your Logto's codebase's root folder and place the following configuration into it:

```
# Default config
TRUST_PROXY_HEADER=1
DB_URL=postgresql://postgres:p0stgr3s@localhost:5433/logto
ADMIN_PORT=3302
PORT=3301

# OGCIO Config
USER_DEFAULT_ORGANIZATION_NAMES=OGCIO Seeded Org
USER_DEFAULT_ORGANIZATION_ROLE_NAMES=OGCIO Employee, OGCIO Manager
```

2. Run the makefile command
```
make run-native
```

After the system is up and running, you can access the admin interface by accessing `http://localhost:3302`

### First-time login

After installing and seeding the database, you must create a default admin user. This can be done by accessing the admin interface for the first time. After creating your admin user, you can access the admin dashboard. Every configuration needed for the OGCIO Building Blocks integration should be seeded already.

## Custom seeder

We made a custom seeder to ensure the required configuration for OGCIO Building Block integration exists right after the installation. The seeder also makes configuring the deployed Logto instance easy via a CI pipeline. The seeder is located in `packages/cli/src/commands/database/ogcio/`. The configuration for the local dev environment is inside `packages/cli/src/commands/database/ogcio/ogcio-seeder-local.json`.

Each type of configuration has its own dedicated file, which serves as a repository of knowledge about the structure of the configuration and how it should be inserted into the database. This approach ensures a systematic and organized management of the database configuration.

In `packages/cli/src/commands/database/ogcio/queries.ts`, we have included a set of helper functions that are essential for interacting with the database. These functions, designed to insert, update, and read data in a generic way, are written with a specific focus on preventing data duplication. This is a critical feature, as it ensures that the database remains intact and free from data duplication even if the seeder is executed multiple times.

The following command can execute the seeder:

`npm run cli db ogcio`

This command can take a parameter to specify the input data file, called `seeder-filepath`, which allows us to seed different data in different environments.

Usage: `npm run cli db ogcio -- --seeder-filepath="DATA_FILE_PATH"`

To seed the default data for local dev environments, run `npm run cli db ogcio -- --seeder-filepath="./packages/cli/src/commands/database/ogcio/ogcio-seeder-local.json"`.

### Limitations

In most cases, we have predefined IDs in our seeder to ensure the same database structure, even if the database was cleared and re-seeded. Logto IDs are simple text fields (no UUID or other validations are applied) with a maximum length of 21 characters. Do not use IDs longer than 21 characters; otherwise, the seeder will fail with a database error!

Be careful when defining a new ID because data duplication is avoided based on this field. If you later want to change the ID of any of your entries, the seeder won't be able to detect the existence of the affected entry, and it will try to create a new one. Creating a duplicate entry with a different ID can cause a database error if some other fields have a unique constraint. If this is not the case, a duplicate entry will be created, which is also a mistake, and we want to avoid any of these situations. Once you have defined an ID, do not change it if unnecessary.

Using resources other than those declared in the seeder's data file is also impossible because referencing any resource outside of the seeder's scope is not supported. The seeder is supposed to create all the required resources and use them to seed the custom configuration into the database.

### Edge cases

Some changes might affect other entries from the database, like the user entities. In this case, a custom migration script is required to resolve the changes necessary to the affected entries. Before any change in the seeder data, analyse the situation to determine if it is safe to perform. The seeder is not intended to resolve conflicts or update other data than the configuration it seeds.

Deletion of existing seeded data via the seeder is not yet possible. Only the permissions (scopes) will be removed and recreated every time the seeder is executed because that is safe and does not cause conflicts with other entries. A custom script or manual action is required for any other data that must be eliminated.