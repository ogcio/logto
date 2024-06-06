# LogTo per OGCIO

## Get started

If you want to run it locally, you just have to run
```
make build run
```

And, once the process ended, you're ready to open `http://localhost:3302` on your browser to navigate on your LogTo instance!

## Sync with main repository

To sync with the main repository, once a new version is released, follow the following steps:
- run `git fetch --tags upstream` to fetch all the tags from the main repository
- check if the tag you want to sync with exists `git tags -v YOUR_TAG`, e.g. `git tags -v v1.17.0`
- 