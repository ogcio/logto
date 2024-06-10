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

## Release a new version on AWS

At the moment, we need to manually execute some steps to release a new version of LogTo.
- ensure Docker is running on your machine
- ensure the AWS keys are correctly set in your `~/.aws/credentials`
- login to AWS ECR
```bash
aws ecr get-login-password --region {YOUR_REGION} | docker login --username AWS --password-stdin {YOUR_ACCOUNT_ID}.dkr.ecr.{YOUR_REGION}.amazonaws.com
```
- build your image for the `amd64` platform
```bash
docker build --platform=linux/amd64 -t life-events-logto:latest
```
- tag your image for the ECR
```bash
docker tag life-events-logto:latest {YOUR_ACCOUNT_ID}.dkr.ecr.{YOUR_REGION}.amazonaws.com/life-events-logto:latest
```
- push your image to the ECR
```bash
docker push {YOUR_ACCOUNT_ID}.dkr.ecr.{YOUR_REGION}.amazonaws.com/life-events-logto:latest
```
- asks to the DevOps person to deploy your new version